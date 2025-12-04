import { createSaasClient } from './supabase-saas';
import type { ChatMessage } from './messagePersistence';
import { testSupabaseConnection } from './testSupabaseConnection';

// 映射 ai_messages 到 ChatMessage
function mapAiMessageToChatMessage(msg: any): ChatMessage {
  // 判斷 role
  let role: any = 'user';
  if (msg.sender_type === 'user') {
    role = 'user';
  } else if (msg.sender_type === 'system') {
    role = 'system';
  } else {
    role = 'assistant'; // role or agent
  }

  return {
    id: msg.id,
    thread_id: msg.room_id,
    role: role,
    message_type: 'user_request', // 默認值
    content: msg.content,
    content_json: msg.content_json,
    status: msg.status || 'completed', // ai_messages 如果沒有 status，預設為 completed
    client_msg_id: msg.id, // ai_messages 沒有 client_msg_id，使用 id 作為後備
    model_used: msg.model_used,
    created_at: msg.created_at,
    updated_at: msg.created_at // ai_messages 可能沒有 updated_at，使用 created_at
  };
}

// 簡化的訊息同步方案：只在需要時檢查
export function createSimpleMessageSync(
  threadId: string,
  callbacks: {
    onInsert?: (message: ChatMessage) => void;
    onUpdate?: (message: ChatMessage) => void;
    onDelete?: (messageId: string) => void;
  }
) {
  const supabase = createSaasClient();
  let lastCheckedTimestamp: string | null = null;
  let seenMessageIds = new Set<string>();  // 追蹤已處理的訊息 ID

  console.log('🔄 [簡化同步] 開始簡化訊息同步 (ai_messages):', threadId);

  const checkMessages = async () => {
    try {
      console.log('🔍 [簡化同步] 檢查新訊息，lastCheckedTimestamp:', lastCheckedTimestamp);

      // 簡化查詢：只獲取最新的幾條訊息
      const { data, error } = await supabase
        .from('ai_messages') // 改為 ai_messages
        .select('*')
        .eq('room_id', threadId) // 改為 room_id
        .order('created_at', { ascending: false })
        .limit(10); // 獲取最新 10 條訊息

      console.log('🔍 [簡化同步] 查詢結果:', { dataLength: data?.length, error: !!error });
      if (error) {
        console.error('❌ [簡化同步] 查詢失敗:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`📨 [簡化同步] 發現 ${data.length} 條訊息`);

        // 處理每條訊息（按時間順序，從舊到新）
        const sortedData = [...(data as any[])].reverse();

        for (const msg of sortedData) {
          // 檢查是否已處理過
          if (seenMessageIds.has(msg.id)) {
            continue;
          }

          const message = mapAiMessageToChatMessage(msg);
          console.log('📨 [簡化同步] 處理訊息:', message.id, 'role:', message.role, '內容:', message.content?.substring(0, 20));

          // 標記為已處理
          seenMessageIds.add(message.id);

          // 觸發回調
          if (callbacks.onInsert) {
            callbacks.onInsert(message);
          }
        }
      }

    } catch (error) {
      console.error('❌ [簡化同步] 檢查錯誤:', error);
    }
  };

  // 立即執行一次檢查（初始化時載入歷史訊息）
  checkMessages();

  // 設置 realtime 訂閱
  const subscription = supabase
    .channel(`ai_messages_${threadId}`) // 改為 ai_messages channel
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'ai_messages', // 改為 ai_messages
      filter: `room_id=eq.${threadId}` // 改為 room_id
    }, (payload) => {
      console.log('📨 [Realtime INSERT] 檢測到新訊息插入:', {
        id: payload.new.id,
        sender_type: payload.new.sender_type,
        status: payload.new.status,
        content_preview: payload.new.content?.substring(0, 50),
        has_content_json: !!payload.new.content_json
      });

      const newMessage = mapAiMessageToChatMessage(payload.new);

      // 檢查是否已處理過
      console.log('📨 [Realtime INSERT] 檢查訊息是否已處理:', {
        messageId: newMessage.id,
        hasBeenSeen: seenMessageIds.has(newMessage.id),
        seenMessageIdsSize: seenMessageIds.size
      });

      if (!seenMessageIds.has(newMessage.id)) {
        console.log('✅ [Realtime INSERT] 處理新訊息:', {
          id: newMessage.id,
          role: newMessage.role,
          status: newMessage.status,
          content_length: newMessage.content?.length
        });
        seenMessageIds.add(newMessage.id);

        // 觸發回調
        if (callbacks.onInsert) {
          callbacks.onInsert(newMessage);
        }
      } else {
        console.log('⏭️ [Realtime INSERT] 訊息已處理過，跳過:', newMessage.id);
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'ai_messages', // 改為 ai_messages
      filter: `room_id=eq.${threadId}` // 改為 room_id
    }, (payload) => {
      console.log('📨 [Realtime UPDATE] 檢測到訊息更新:', {
        id: payload.new.id,
        sender_type: payload.new.sender_type,
        status: payload.new.status,
        content: payload.new.content?.substring(0, 50),
        content_json: payload.new.content_json
      });

      const updatedMessage = mapAiMessageToChatMessage(payload.new);

      // ⭐ 確保 status 不是 'deleted'
      if ((updatedMessage.status as any) === 'deleted') {
        console.log('📨 [Realtime UPDATE] 訊息已刪除，觸發 onDelete');
        // 觸發刪除回調
        if (callbacks.onDelete) {
          callbacks.onDelete(updatedMessage.id);
        }
        return;
      }

      // ⭐ 如果這是一條新訊息（之前未見過），先觸發 onInsert
      if (!seenMessageIds.has(updatedMessage.id)) {
        console.log('📨 [Realtime UPDATE] 這是新訊息（通過 UPDATE 首次收到），觸發 onInsert');
        seenMessageIds.add(updatedMessage.id);

        if (callbacks.onInsert) {
          callbacks.onInsert(updatedMessage);
        }
      } else {
        // ⭐ 已存在的訊息，觸發 onUpdate
        console.log('📨 [Realtime UPDATE] 更新已存在的訊息，觸發 onUpdate');
        if (callbacks.onUpdate) {
          callbacks.onUpdate(updatedMessage);
        }
      }
    })
    .subscribe((status) => {
      console.log('📡 [Realtime] 訂閱狀態:', status);
    });

  return {
    unsubscribe: () => {
      console.log('🔄 [簡化同步] 停止簡化同步');
      seenMessageIds.clear();  // 清理快取
      subscription.unsubscribe();  // 取消訂閱
    },
    // 手動觸發檢查
    checkNow: () => {
      console.log('🔄 [簡化同步] 手動觸發檢查');
      checkMessages();
    },
    // 重置時間戳（用於發送新訊息後）
    resetTimestamp: () => {
      console.log('🔄 [簡化同步] 重置時間戳');
      lastCheckedTimestamp = null;
    }
  };
}

// 手動觸發訊息檢查的函數
export async function triggerMessageCheck(threadId: string) {
  const supabase = createSaasClient();

  try {
    const { data, error } = await supabase
      .from('ai_messages') // 改為 ai_messages
      .select('*')
      .eq('room_id', threadId) // 改為 room_id
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ [手動檢查] 查詢訊息失敗:', error);
      return [];
    }

    console.log('📨 [手動檢查] 獲取到訊息:', data?.length || 0);
    return data?.map(mapAiMessageToChatMessage) || [];

  } catch (error) {
    console.error('❌ [手動檢查] 查詢錯誤:', error);
    return [];
  }
}

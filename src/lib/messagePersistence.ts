// 訊息持久化核心模組
import { createSaasClient } from './supabase-saas';
import { generateULID } from './ulid';
import type { IngressClient } from './ingress';

// 訊息狀態類型
export type MessageStatus = 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';

// 訊息角色類型
export type MessageRole = 'user' | 'assistant' | 'agent' | 'system' | 'internal';

// 訊息類型
export type MessageType = 'user_request' | 'plan' | 'work' | 'review' | 'final' | 'error' | 'status_update';

// 訊息介面
export interface ChatMessage {
  id: string;
  thread_id: string;
  role: MessageRole;
  message_type: MessageType;
  agent_id?: string;
  content: string;
  content_json?: Record<string, any>;
  status: MessageStatus;
  client_msg_id: string;
  turn_no?: number;
  parent_id?: string;
  processing_time_ms?: number;
  error_message?: string;
  age_rating?: 'all' | '18+';
  food_cost?: number;
  model_used?: string;
  created_at: string;
  updated_at: string;
}

// 發送訊息選項
export interface SendMessageOptions {
  threadId: string;
  userId: string;
  content: string;
  roleHint?: string;
  messageType?: MessageType;
  extra?: Record<string, any>;
  groupRoles?: Array<{ id: string; name?: string; model?: string; capabilities?: any }>;
  selectedRole?: { id: string; model?: string; tone?: string; guidance?: string };
  project?: { title?: string; guidance?: string };
  sessionId?: string;
}

// 持久化並發送訊息（核心函數）
export async function persistAndSendMessage(
  options: SendMessageOptions,
  ingressClient?: IngressClient
): Promise<{ success: boolean; messageId?: string; clientMsgId?: string; error?: string }> {
  console.log('🚀 [持久化] persistAndSendMessage 被調用', { options, ingressClient: !!ingressClient });

  const { threadId, userId, content, roleHint = 'auto', messageType = 'user_request' } = options;

  const clientMsgId = generateULID();
  console.log('🆔 [持久化] 生成 clientMsgId:', clientMsgId);

  const supabase = createSaasClient();
  console.log('🔗 [持久化] Supabase 客戶端創建成功');

  console.log('📝 [持久化] 開始保存訊息到 Supabase...', { threadId, clientMsgId });

  try {
    // === 步驟 1: 寫入訊息到 Supabase ===
    const { data: userMsg, error: insertError } = await (supabase as any)
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        role: 'user',
        message_type: messageType,
        content: content,
        status: 'queued',
        client_msg_id: clientMsgId,
        content_json: {
          user_id: userId,
          role_hint: roleHint,
          ...options.extra
        },
        created_at: new Date().toISOString()
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [持久化] 寫入 Supabase 失敗:', insertError);
      console.error('❌ [持久化] 錯誤詳情:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return { success: false, error: `保存訊息失敗: ${insertError.message}` };
    }

    console.log('✅ [持久化] 訊息已保存到 Supabase:', userMsg.id);

    // === 步驟 2: 等待並驗證訊息確實存在 ===
    console.log('⏳ [持久化] 等待 150ms 確保資料庫已提交...');
    await new Promise(resolve => setTimeout(resolve, 150));

    // 驗證訊息確實存在
    console.log('🔍 [持久化] 驗證訊息是否存在於資料庫...');
    const { data: verification, error: verifyError } = await supabase
      .from('chat_messages')
      .select('id, client_msg_id, status')
      .eq('client_msg_id', clientMsgId)
      .eq('thread_id', threadId)
      .maybeSingle();

    if (verifyError) {
      console.error('❌ [持久化] 驗證查詢失敗:', verifyError);
      // 驗證失敗但不影響發送，繼續執行
    } else if (!verification) {
      console.error('❌ [持久化] 訊息寫入失敗，無法在資料庫中找到');
      return { success: false, error: '訊息寫入驗證失敗' };
    } else {
      console.log('✅ [持久化] 訊息已確認存在於資料庫:', verification);
    }

    // === 步驟 3: 背景發送到 n8n（不阻塞 UI）===
    sendToN8nBackground(clientMsgId, options, ingressClient).catch(err => {
      console.error('❌ [持久化] 背景發送到 n8n 失敗:', err);
    });

    return {
      success: true,
      messageId: userMsg.id,
      clientMsgId
    };

  } catch (error) {
    console.error('❌ [持久化] 意外錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}

// 背景發送到 n8n（含重試機制）
async function sendToN8nBackground(
  clientMsgId: string,
  options: SendMessageOptions,
  providedClient?: IngressClient
): Promise<void> {
  const maxRetries = 3;
  const supabase = createSaasClient();

  // 動態導入 ingressClient（如果沒有提供）
  let client = providedClient;
  if (!client) {
    const { ingressClient } = await import('./ingress');
    client = ingressClient;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🚀 [n8n] 嘗試 ${attempt + 1}/${maxRetries} 發送到 n8n...`);

      await client.sendMessage(options.threadId, options.content, {
        roleHint: options.roleHint,
        messageType: options.messageType,
        clientMsgId: clientMsgId, // ⭐ 傳遞 client_msg_id 給 n8n
        extra: {
          ...options.extra,
          user_id: options.userId,
          client_msg_id: clientMsgId,
          room_id: options.threadId,
          source: 'aihome_room_chat',
          session_id: options.sessionId
        },
        groupRoles: options.groupRoles || [],
        selectedRole: options.selectedRole || { id: options.roleHint || 'auto' },
        project: options.project || {}
      });

      console.log('✅ [n8n] 成功發送到 n8n');
      return; // 成功就返回

    } catch (error) {
      console.error(`❌ [n8n] 第 ${attempt + 1} 次嘗試失敗:`, error);

      if (attempt === maxRetries - 1) {
        // 最後一次失敗，更新訊息狀態為 error
        console.error('❌ [n8n] 所有重試均失敗，標記訊息為錯誤');

        await (supabase as any)
          .from('chat_messages')
          .update({
            status: 'error',
            error_message: '無法連接到 AI 服務，請稍後重試',
            updated_at: new Date().toISOString()
          } as any)
          .eq('client_msg_id', clientMsgId);
      } else {
        // 等待後重試（指數退避）
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`⏳ [n8n] 等待 ${delay}ms 後重試...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// 載入歷史訊息（含狀態）
export async function loadMessagesWithStatus(
  threadId: string
): Promise<ChatMessage[]> {
  const supabase = createSaasClient();

  console.log('📚 [載入] 載入線程訊息:', threadId);

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [載入] 載入訊息失敗:', error);
      throw error;
    }

    console.log(`✅ [載入] 成功載入 ${data?.length || 0} 條訊息`);
    return data as ChatMessage[];

  } catch (error) {
    console.error('❌ [載入] 意外錯誤:', error);
    return [];
  }
}

// 訂閱訊息更新（Realtime）
export function subscribeToMessageUpdates(
  threadId: string,
  callbacks: {
    onInsert?: (message: ChatMessage) => void;
    onUpdate?: (message: ChatMessage) => void;
    onDelete?: (messageId: string) => void;
  }
) {
  const supabase = createSaasClient();

  console.log('📡 [Realtime] 開始訂閱線程更新:', threadId);

  const channel = supabase
    .channel(`chat-messages-${threadId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: threadId }
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `thread_id=eq.${threadId}`
    }, (payload) => {
      console.log('📨 [Realtime] 收到新訊息:', payload);
      console.log('📨 [Realtime] 新訊息詳情:', payload.new);
      if (callbacks.onInsert) {
        callbacks.onInsert(payload.new as ChatMessage);
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_messages',
      filter: `thread_id=eq.${threadId}`
    }, (payload) => {
      console.log('🔄 [Realtime] 訊息狀態更新:', payload);
      console.log('🔄 [Realtime] 更新詳情:', payload.new);
      if (callbacks.onUpdate) {
        callbacks.onUpdate(payload.new as ChatMessage);
      }
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'chat_messages',
      filter: `thread_id=eq.${threadId}`
    }, (payload) => {
      console.log('🗑️ [Realtime] 訊息被刪除:', payload);
      console.log('🗑️ [Realtime] 刪除詳情:', payload.old);
      if (callbacks.onDelete && payload.old) {
        callbacks.onDelete((payload.old as any).id);
      }
    })
    .subscribe((status, err) => {
      console.log('📡 [Realtime] 訂閱狀態:', status);
      if (err) {
        console.error('❌ [Realtime] 訂閱錯誤:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ [Realtime] 訂閱成功建立');
      }
    });

  return channel;
}

// 重試失敗的訊息
export async function retryFailedMessage(
  clientMsgId: string,
  ingressClient?: IngressClient
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSaasClient();

  console.log('🔄 [重試] 開始重試訊息:', clientMsgId);

  try {
    // 獲取原始訊息
    const { data: msg, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('client_msg_id', clientMsgId)
      .single();

    if (fetchError || !msg) {
      return { success: false, error: '找不到訊息' };
    }

    // 重置狀態為 queued
    await (supabase as any)
      .from('chat_messages')
      .update({
        status: 'queued',
        error_message: null,
        updated_at: new Date().toISOString()
      } as any)
      .eq('client_msg_id', clientMsgId);

    // 重新發送到 n8n
    const userId = (msg as any)?.content_json?.user_id || '';
    const roleHint = (msg as any)?.content_json?.role_hint || 'auto';

    await sendToN8nBackground(clientMsgId, {
      threadId: (msg as any)?.thread_id,
      userId,
      content: (msg as any)?.content,
      roleHint,
      messageType: (msg as any)?.message_type,
      extra: (msg as any)?.content_json
    }, ingressClient);

    return { success: true };

  } catch (error) {
    console.error('❌ [重試] 重試失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '重試失敗'
    };
  }
}

// 更新訊息狀態
export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSaasClient();

  console.log('🔄 [更新] 更新訊息狀態:', { messageId, status });

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await (supabase as any)
      .from('chat_messages')
      .update(updateData as any)
      .eq('id', messageId);

    if (error) {
      console.error('❌ [更新] 更新失敗:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [更新] 狀態更新成功');
    return { success: true };

  } catch (error) {
    console.error('❌ [更新] 意外錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失敗'
    };
  }
}

import { createSaasClient } from './supabase-saas';
import type { ChatMessage } from './messagePersistence';

// 輪詢方式的訊息更新（備用方案）
export function createMessagePolling(
  threadId: string,
  callbacks: {
    onInsert?: (message: ChatMessage) => void;
    onUpdate?: (message: ChatMessage) => void;
    onDelete?: (messageId: string) => void;
  }
) {
  const supabase = createSaasClient();
  let lastCheckTime = new Date().toISOString();
  let isPolling = false;
  
  console.log('🔄 [輪詢] 開始輪詢訊息更新:', threadId);
  
  const pollMessages = async () => {
    if (isPolling) return;
    isPolling = true;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .gt('created_at', lastCheckTime)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('❌ [輪詢] 查詢訊息失敗:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('📨 [輪詢] 發現新訊息:', data.length);
        
        for (const message of data) {
          console.log('📨 [輪詢] 處理新訊息:', message.id);
          if (callbacks.onInsert) {
            callbacks.onInsert(message as ChatMessage);
          }
        }
        
        lastCheckTime = new Date().toISOString();
      }
      
    } catch (error) {
      console.error('❌ [輪詢] 輪詢錯誤:', error);
    } finally {
      isPolling = false;
    }
  };
  
  // 每 2 秒輪詢一次
  const interval = setInterval(pollMessages, 2000);
  
  // 立即執行一次
  pollMessages();
  
  return {
    unsubscribe: () => {
      console.log('🔄 [輪詢] 停止輪詢');
      clearInterval(interval);
    }
  };
}

// 混合方案：先嘗試 Realtime，失敗則使用輪詢
export function createHybridMessageSubscription(
  threadId: string,
  callbacks: {
    onInsert?: (message: ChatMessage) => void;
    onUpdate?: (message: ChatMessage) => void;
    onDelete?: (messageId: string) => void;
  }
) {
  console.log('🔄 [混合] 開始混合訂閱方案:', threadId);
  
  // 先嘗試 Realtime
  const { subscribeToMessageUpdates } = require('./messagePersistence');
  
  let realtimeSubscription: any = null;
  let pollingSubscription: any = null;
  
  try {
    realtimeSubscription = subscribeToMessageUpdates(threadId, callbacks);
    
    // 監聽 Realtime 狀態
    const checkRealtimeStatus = () => {
      if (realtimeSubscription && realtimeSubscription.state === 'CHANNEL_ERROR') {
        console.log('❌ [混合] Realtime 失敗，切換到輪詢模式');
        if (realtimeSubscription) {
          realtimeSubscription.unsubscribe();
        }
        pollingSubscription = createMessagePolling(threadId, callbacks);
      }
    };
    
    // 每 5 秒檢查一次 Realtime 狀態
    const statusCheckInterval = setInterval(checkRealtimeStatus, 5000);
    
    return {
      unsubscribe: () => {
        console.log('🔄 [混合] 取消混合訂閱');
        clearInterval(statusCheckInterval);
        if (realtimeSubscription) {
          realtimeSubscription.unsubscribe();
        }
        if (pollingSubscription) {
          pollingSubscription.unsubscribe();
        }
      }
    };
    
  } catch (error) {
    console.error('❌ [混合] Realtime 初始化失敗，直接使用輪詢:', error);
    pollingSubscription = createMessagePolling(threadId, callbacks);
    
    return {
      unsubscribe: () => {
        console.log('🔄 [混合] 取消輪詢訂閱');
        if (pollingSubscription) {
          pollingSubscription.unsubscribe();
        }
      }
    };
  }
}

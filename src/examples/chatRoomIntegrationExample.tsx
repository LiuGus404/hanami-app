/**
 * 聊天室整合示例
 * 展示如何將訊息持久化系統整合到現有的聊天室頁面
 * 
 * 使用方法：
 * 1. 複製需要的部分到實際的聊天室頁面
 * 2. 根據實際情況調整變數名稱和邏輯
 * 3. 保留原有的 UI 和交互邏輯
 */

'use client';

import { useState, useEffect } from 'react';
import { persistAndSendMessage, loadMessagesWithStatus, subscribeToMessageUpdates } from '@/lib/messagePersistence';
import { MessageStatusIndicator } from '@/components/ai-companion/MessageStatusIndicator';
import { FoodBalanceDisplay } from '@/components/ai-companion/FoodBalanceDisplay';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'hibi' | 'mori' | 'pico' | 'assistant';
  timestamp: Date;
  type: 'text';
  status?: 'queued' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export default function ChatRoomExample({ roomId, user }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState('hibi');
  
  // =====================================
  // 1. 載入歷史訊息（含狀態）
  // =====================================
  useEffect(() => {
    if (!roomId || !user) return;
    
    const loadMessages = async () => {
      try {
        const dbMessages = await loadMessagesWithStatus(roomId);
        
        const formatted = dbMessages.map(msg => {
          // 判斷 sender
          let sender: any = 'user';
          if (msg.role === 'assistant' || msg.role === 'agent') {
            // 嘗試從 content_json 提取角色名稱
            try {
              const contentJson = typeof msg === 'object' && 'content_json' in msg 
                ? (msg as any).content_json 
                : {};
              sender = contentJson?.meta?.role || contentJson?.role_name || 'assistant';
            } catch {
              sender = 'assistant';
            }
          }
          
          // 轉換狀態類型
          const msgStatus = msg.status as any;
          let status: 'completed' | 'error' | 'queued' | 'processing' | undefined = msgStatus;
          if (msgStatus === 'cancelled' || msgStatus === 'deleted') {
            status = 'error';
          }
          
          return {
            id: msg.id,
            content: msg.content,
            sender,
            timestamp: new Date(msg.created_at),
            type: 'text' as const,
            status: status,
            errorMessage: msg.error_message
          };
        });
        
        setMessages(formatted);
        console.log('✅ 載入了', formatted.length, '條歷史訊息');
      } catch (error) {
        console.error('載入訊息錯誤:', error);
        toast.error('載入歷史訊息失敗');
      }
    };
    
    loadMessages();
  }, [roomId, user]);
  
  // =====================================
  // 2. 訂閱 Realtime 更新
  // =====================================
  useEffect(() => {
    if (!roomId) return;
    
    const subscription = subscribeToMessageUpdates(roomId, {
      onInsert: (newMsg) => {
        console.log('📨 收到新訊息:', newMsg);
        
        // 避免重複
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          
          let sender: any = 'user';
          if (newMsg.role === 'assistant') {
            try {
              const meta = newMsg.content_json?.meta || {};
              sender = meta.role || 'assistant';
            } catch {
              sender = 'assistant';
            }
          }
          
          // 轉換狀態類型
          const newMsgStatus = newMsg.status as any;
          let status: 'completed' | 'error' | 'queued' | 'processing' | undefined = newMsgStatus;
          if (newMsgStatus === 'cancelled' || newMsgStatus === 'deleted') {
            status = 'error';
          }
          
          return [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            sender,
            timestamp: new Date(newMsg.created_at),
            type: 'text',
            status: status
          }];
        });
      },
      
      onUpdate: (updatedMsg) => {
        console.log('🔄 訊息狀態更新:', updatedMsg.id, updatedMsg.status);
        
        // 轉換狀態類型
        const updatedStatus = updatedMsg.status as any;
        let status: 'completed' | 'error' | 'queued' | 'processing' | undefined = updatedStatus;
        if (updatedStatus === 'cancelled' || updatedStatus === 'deleted') {
          status = 'error';
        }
        
        setMessages(prev => prev.map(m => 
          m.id === updatedMsg.id 
            ? { ...m, status: status, content: updatedMsg.content }
            : m
        ));
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);
  
  // =====================================
  // 3. 發送訊息（持久化優先）
  // =====================================
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // 準備角色設定
      const selectedRole = await getSelectedRoleSettings(selectedCompanion);
      
      // 準備專案資訊
      const project = await getProjectInfo(roomId);
      
      // 使用持久化系統
      const result = await persistAndSendMessage({
        threadId: roomId,
        userId: user.id,
        content: messageContent,
        roleHint: selectedCompanion,
        groupRoles: [{ id: selectedCompanion }],
        selectedRole,
        project,
        sessionId: generateSessionId()
      });
      
      if (!result.success) {
        toast.error(result.error || '發送失敗');
        return;
      }
      
      console.log('✅ 訊息已持久化:', result.messageId);
      
      // 訊息會通過 Realtime 自動添加到 UI
      
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      toast.error('發送失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };
  
  // =====================================
  // 4. 輔助函數
  // =====================================
  async function getSelectedRoleSettings(roleId: string) {
    // 實際實現：從 localStorage 或資料庫獲取角色設定
    return {
      id: roleId,
      model: 'openai/gpt-4o-mini',
      tone: '友善專業',
      guidance: '你是一個有幫助的 AI 助手'
    };
  }
  
  async function getProjectInfo(roomId: string) {
    // 實際實現：從 localStorage 或資料庫獲取專案資訊
    return {
      title: '專案名稱',
      guidance: '專案說明'
    };
  }
  
  function generateSessionId() {
    return `session-${Date.now()}`;
  }
  
  // =====================================
  // 5. UI 渲染
  // =====================================
  return (
    <div className="flex flex-col h-screen">
      {/* 頂部導航 */}
      <nav className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-bold">聊天室</h1>
        
        {/* 食量餘額顯示 */}
        <FoodBalanceDisplay userId={user.id} />
      </nav>
      
      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* 訊息內容 */}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* 時間戳記 */}
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
              
              {/* 狀態指示器（僅用戶訊息） */}
              {message.sender === 'user' && message.status && (
                <MessageStatusIndicator 
                  status={message.status} 
                  className="mt-2" 
                />
              )}
              
              {/* 錯誤訊息 */}
              {message.status === 'error' && message.errorMessage && (
                <div className="text-xs text-red-200 mt-2">
                  {message.errorMessage}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 輸入區域 */}
      <div className="border-t p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="輸入訊息..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '發送中...' : '發送'}
          </button>
        </div>
      </div>
    </div>
  );
}


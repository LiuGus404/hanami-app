'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ingressClient, IngressResponse } from '@/lib/ingress';
import { MessageBubble } from './MessageBubble';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 聊天訊息介面
export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'agent' | 'system' | 'internal';
  message_type: string;
  agent_id?: string;
  content: string;
  content_json: any;
  status: 'queued' | 'processing' | 'completed' | 'error';
  client_msg_id: string;
  turn_no: number;
  parent_id?: string;
  processing_time_ms?: number;
  error_message?: string;
  age_rating: string;
  food_cost: number;
  created_at: string;
  updated_at: string;
}

// 聊天線程介面
interface ChatThread {
  id: string;
  user_id: string;
  title?: string;
  thread_type: string;
  settings: any;
  is_archived: boolean;
  age_rating: string;
  cost_tracking: any;
  food_balance_used: number;
  created_at: string;
  updated_at: string;
}

// 用戶食量餘額介面
interface UserFoodBalance {
  id: string;
  user_id: string;
  current_balance: number;
  total_earned: number;
  total_spent: number;
  monthly_allowance: number;
  last_monthly_reset: string;
  daily_usage: number;
  weekly_usage: number;
  monthly_usage: number;
  created_at: string;
  updated_at: string;
}

interface ThreadChatProps {
  threadId: string;
  userId: string;
}

export function ThreadChat({ threadId, userId }: ThreadChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [foodBalance, setFoodBalance] = useState<UserFoodBalance | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 載入聊天線程信息
  const loadThread = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (error) throw error;
      setThread(data);
    } catch (error) {
      console.error('載入聊天線程錯誤:', error);
      toast.error('載入聊天線程失敗');
    }
  };

  // 載入用戶食量餘額
  const loadFoodBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_food_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setFoodBalance(data);
    } catch (error) {
      console.error('載入食量餘額錯誤:', error);
    }
  };

  // 載入聊天訊息
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('載入訊息錯誤:', error);
      toast.error('載入訊息失敗');
    }
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // 檢查食量餘額
      if (foodBalance && foodBalance.current_balance < 10) {
        toast.error('食量餘額不足，請購買更多食量');
        setIsLoading(false);
        return;
      }

      // 發送到統一接收器
      const response: IngressResponse = await ingressClient.sendMessage(
        threadId,
        messageText,
        {
          roleHint: 'auto',
          messageType: 'user_request',
          priority: 'normal'
        }
      );

      if (response.success) {
        toast.success('訊息發送成功');
        // 重新載入訊息以獲取最新狀態
        setTimeout(() => {
          loadMessages();
          loadFoodBalance();
        }, 1000);
      } else {
        toast.error(response.error || '發送失敗');
      }
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      toast.error('發送訊息失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理鍵盤事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 訂閱實時更新
  useEffect(() => {
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          console.log('收到實時更新:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as ChatMessage;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
          
          // 更新當前發言者
          if (payload.new && (payload.new as any).role === 'assistant') {
            setCurrentSpeaker((payload.new as any).agent_id || 'AI');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // 訂閱食量餘額更新
  useEffect(() => {
    const channel = supabase
      .channel(`food_balance:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_food_balance',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('食量餘額更新:', payload);
          setFoodBalance(payload.new as UserFoodBalance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 初始載入
  useEffect(() => {
    loadThread();
    loadFoodBalance();
    loadMessages();
  }, [threadId, userId]);

  // 自動滾動到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#FFF9F2]">
      {/* 聊天線程標題和食量餘額 */}
      <div className="bg-white border-b border-[#EADBC8] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#4B4036]">
              {thread?.title || '未命名聊天'}
            </h2>
            <p className="text-sm text-[#2B3A3B]">
              {thread?.thread_type} • {messages.length} 條訊息
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#2B3A3B]">食量餘額</div>
            <div className="text-lg font-bold text-[#FFD59A]">
              {foodBalance?.current_balance || 0} 🍎
            </div>
          </div>
        </div>
      </div>

      {/* 協作狀態顯示 */}
      {currentSpeaker && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-600">
              目前發言者: {currentSpeaker}
            </span>
          </div>
        </div>
      )}

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#EADBC8]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-[#4B4036] ml-2">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入框 */}
      <div className="border-t border-[#EADBC8] p-4 bg-white">
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="輸入您的訊息..."
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <HanamiButton
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            variant="primary"
            size="md"
          >
            {isLoading ? '發送中...' : '發送'}
          </HanamiButton>
        </div>
        
        {/* 食量消耗提示 */}
        <div className="mt-2 text-xs text-[#2B3A3B] text-center">
          每條訊息約消耗 10 食量 🍎
        </div>
      </div>
    </div>
  );
}

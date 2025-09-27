'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'system' | 'parent';
  timestamp: Date;
  type: 'text' | 'system';
  direction?: 'incoming' | 'outgoing';
}

interface ContactChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  contactDays?: number | null;
}

export function ContactChatDialog({ 
  isOpen, 
  onClose, 
  phoneNumber, 
  contactDays 
}: ContactChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 載入對話記錄
  const loadMessageHistory = async () => {
    if (!phoneNumber || isLoadingHistory) return;

    console.log('開始載入對話記錄，電話號碼:', phoneNumber);
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(phoneNumber)}`);
      console.log('API 響應狀態:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API 響應數據:', data);
        console.log('找到的對話記錄數量:', data.messages?.length || 0);
        
        const historyMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender === 'parent' ? 'parent' : 'user',
          timestamp: new Date(msg.timestamp),
          type: 'text',
          direction: msg.direction
        }));

        console.log('處理後的對話記錄:', historyMessages);

        setMessages(prev => {
          // 更新系統消息，移除"正在載入對話記錄..."
          const systemMessage = prev.find(m => m.type === 'system');
          if (systemMessage) {
            const updatedSystemMessage = {
              ...systemMessage,
              content: systemMessage.content.replace('正在載入對話記錄...', '')
            };
            return [updatedSystemMessage, ...historyMessages];
          }
          return historyMessages;
        });
      } else {
        console.error('載入對話記錄失敗:', response.status);
        const errorText = await response.text();
        console.error('錯誤詳情:', errorText);
      }
    } catch (error) {
      console.error('載入對話記錄錯誤:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 初始化消息和載入對話記錄
  useEffect(() => {
    if (isOpen) {
      const initialMessages: Message[] = [
        {
          id: '1',
          content: `📞 聯繫記錄\n\n電話號碼: ${phoneNumber}\n${contactDays !== null ? `最後聯繫: ${contactDays === 0 ? '今天' : contactDays === 1 ? '1天前' : `${contactDays}天前`}` : '無聯繫記錄'}\n\n正在載入對話記錄...`,
          sender: 'system',
          timestamp: new Date(),
          type: 'system'
        }
      ];
      setMessages(initialMessages);
      
      // 載入對話記錄
      loadMessageHistory();
    }
  }, [isOpen, phoneNumber, contactDays]);

  // 發送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 這裡可以集成實際的 WhatsApp 或簡訊 API
      // 目前先模擬發送
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `✅ 訊息已發送至 ${phoneNumber}\n\n訊息內容: "${userMessage.content}"\n\n發送時間: ${new Date().toLocaleString('zh-TW')}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      };

      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '❌ 發送失敗，請稍後再試',
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-transparent"
          onClick={onClose}
        />

        {/* 對話框 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden"
        >
          {/* 標題欄 */}
          <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Phone className="w-5 h-5 text-[#FFD59A]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#2B3A3B]">聯繫家長</h3>
                <p className="text-sm text-[#87704e]">{phoneNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 消息區域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' 
                    ? 'justify-end' 
                    : message.sender === 'parent'
                    ? 'justify-start'
                    : 'justify-center'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B]'
                      : message.sender === 'parent'
                      ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900'
                      : 'bg-white text-gray-800 shadow-sm border'
                  }`}
                >
                  {message.sender === 'parent' && (
                    <div className="text-xs font-medium text-blue-700 mb-1">
                      家長
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-[#87704e]' 
                      : message.sender === 'parent'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoadingHistory && (
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">載入對話記錄中...</span>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFD59A]"></div>
                    <span className="text-sm text-gray-600">發送中...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 輸入區域 */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="輸入訊息..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  rows={1}
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-[#2B3A3B]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

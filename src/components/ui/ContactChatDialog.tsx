'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageCircle, Phone, Clock, Calendar, User, Bot } from 'lucide-react';
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

  // 根據日期分組訊息
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = message.timestamp.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

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
      const getContactStatusText = () => {
        if (contactDays === null) return '無聯繫記錄';
        if (contactDays === 0) return '今天';
        if (contactDays === 1) return '1天前';
        return `${contactDays}天前`;
      };

      const initialMessages: Message[] = [
        {
          id: '1',
          content: `聯繫記錄\n\n最後聯繫: ${getContactStatusText()}\n\n正在載入對話記錄...`,
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
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageContent = inputMessage.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    // 立即更新 UI
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 使用內部 API 路由發送訊息（更安全）
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: messageContent
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const systemMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `訊息已發送\n\n訊息內容: "${messageContent}"\n\n發送時間: ${new Date().toLocaleString('zh-TW')}`,
          sender: 'system',
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        throw new Error(result.error || `發送失敗: ${response.status}`);
      }
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `發送失敗，請稍後再試\n\n錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, phoneNumber]);

  // 處理鍵盤事件
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 對話框 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            mass: 0.8
          }}
          className="relative bg-[#FFFDF8] rounded-3xl shadow-2xl w-full max-w-lg h-[700px] flex flex-col overflow-hidden border border-[#EADBC8]"
        >
          {/* 標題欄 */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-[#FFD59A] via-[#FDE6B8] to-[#EBC9A4] p-6 flex items-center justify-between relative overflow-hidden"
          >
            {/* 背景裝飾 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 w-16 h-16 bg-white rounded-full"></div>
              <div className="absolute bottom-1 left-4 w-8 h-8 bg-white rounded-full"></div>
              <div className="absolute top-4 left-1/3 w-4 h-4 bg-white rounded-full"></div>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-white/90 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <MessageCircle className="w-6 h-6 text-[#FFD59A]" />
              </motion.div>
              <div>
                <h3 className="font-bold text-[#2B3A3B] text-lg">聯繫家長</h3>
                {contactDays !== null && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#87704e]" />
                    <span className="text-xs text-[#87704e]">
                      {contactDays === 0 ? '今天聯繫' : contactDays === 1 ? '1天前' : `${contactDays}天前`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 bg-white/90 rounded-2xl flex items-center justify-center shadow-lg hover:bg-white transition-colors relative z-10"
            >
              <X className="w-5 h-5 text-[#87704e]" />
            </motion.button>
          </motion.div>

          {/* 消息區域 */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#FFFDF8] to-[#FEFBF5]">
            {(() => {
              // 分離系統消息和對話消息
              const systemMessages = messages.filter(m => m.type === 'system');
              const chatMessages = messages.filter(m => m.type === 'text');
              
              // 根據日期分組對話消息
              const messageGroups = groupMessagesByDate(chatMessages);
              const sortedDates = Object.keys(messageGroups).sort((a, b) => 
                new Date(a).getTime() - new Date(b).getTime()
              );
              
              return (
                <>
                  {/* 系統消息 */}
                  {systemMessages.map((message, index) => (
                    <motion.div 
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-center mb-6"
                    >
                      <div className="bg-white/80 backdrop-blur-sm text-[#2B3A3B] shadow-lg border border-[#EADBC8] rounded-3xl px-6 py-4 max-w-[90%] relative overflow-hidden">
                        {/* 背景裝飾 */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FFD59A]/20 to-[#EBC9A4]/20 rounded-full -translate-y-10 translate-x-10"></div>
                        
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="w-8 h-8 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                              {message.content}
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-[#87704e]">
                              <Clock className="w-3 h-3" />
                              {message.timestamp.toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* 按日期分組的對話消息 */}
                  {sortedDates.map((dateKey, dateIndex) => (
                    <motion.div 
                      key={dateKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (systemMessages.length + dateIndex) * 0.1 }}
                    >
                      {/* 日期分隔線 */}
                      <div className="flex items-center justify-center my-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#EADBC8] to-transparent"></div>
                        <div className="mx-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-2xl text-xs text-[#87704e] font-medium shadow-sm border border-[#EADBC8] flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {dateKey}
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#EADBC8] to-transparent"></div>
                      </div>
                      
                      {/* 該日期的消息 */}
                      {messageGroups[dateKey]
                        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                        .map((message, msgIndex) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: message.sender === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (systemMessages.length + dateIndex + msgIndex) * 0.05 }}
                          className={`flex ${
                            message.sender === 'user' 
                              ? 'justify-end' 
                              : 'justify-start'
                          } mb-4`}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[75%] rounded-3xl px-5 py-4 relative overflow-hidden ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-lg'
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 shadow-lg border border-blue-200'
                            }`}
                          >
                            {/* 背景裝飾 */}
                            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 ${
                              message.sender === 'user' 
                                ? 'bg-white' 
                                : 'bg-blue-400'
                            } -translate-y-8 translate-x-8`}></div>
                            
                            {message.sender === 'parent' && (
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700">家長</span>
                              </div>
                            )}
                            
                            <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed relative z-10">
                              {message.content}
                            </div>
                            
                            <div className={`flex items-center gap-1 mt-2 text-xs ${
                              message.sender === 'user' 
                                ? 'text-[#87704e]' 
                                : 'text-blue-600'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {message.timestamp.toLocaleTimeString('zh-TW', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
                </>
              );
            })()}
            
            {isLoadingHistory && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-6"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-4 shadow-lg border border-[#EADBC8]">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-[#FFD59A] border-t-transparent rounded-full"
                    ></motion.div>
                    <span className="text-sm text-[#2B3A3B] font-medium">載入對話記錄中...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-start mb-4"
              >
                <div className="bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-3xl px-5 py-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    ></motion.div>
                    <span className="text-sm text-[#2B3A3B] font-medium">發送中...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 輸入區域 */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-gradient-to-r from-[#FFFDF8] to-[#FEFBF5] border-t border-[#EADBC8]"
          >
            <div className="flex items-end gap-4">
              <div className="flex-1 relative">
                <motion.textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="輸入訊息..."
                  className="w-full px-5 py-4 border-2 border-[#EADBC8] rounded-3xl resize-none focus:outline-none focus:ring-4 focus:ring-[#FFD59A]/20 focus:border-[#FFD59A] transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-sm text-[#2B3A3B] font-medium placeholder:text-[#87704e]/60"
                  rows={1}
                  style={{
                    minHeight: '56px',
                    maxHeight: '120px'
                  }}
                  disabled={isLoading}
                  whileFocus={{ scale: 1.01 }}
                />
                
                {/* 輸入框裝飾 */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#FFD59A]/30 rounded-full"></div>
              </div>
              
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }}
                disabled={!inputMessage.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  !inputMessage.trim() || isLoading
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] hover:shadow-xl hover:from-[#FDE6B8] hover:to-[#EBC9A4]'
                }`}
              >
                <Send className={`w-6 h-6 ${
                  !inputMessage.trim() || isLoading 
                    ? 'text-gray-400' 
                    : 'text-[#2B3A3B]'
                }`} />
              </motion.button>
            </div>
            
            {/* 底部裝飾 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD59A] via-[#EBC9A4] to-[#FFD59A] opacity-30"></div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

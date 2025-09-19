// ========================================
// AI 房間聊天組件
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  SparklesIcon,
  UserIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useChatSession } from '../../hooks/useAICompanion';
import { HanamiButton, HanamiCard } from '../ui';
import type { AIMessage, RoleInstance } from '../../types/ai-companion';

interface AIRoomChatProps {
  roomId: string;
  className?: string;
}

export function AIRoomChat({ roomId, className = '' }: AIRoomChatProps) {
  const {
    room,
    roles,
    messages,
    sessionId,
    isLoading,
    isTyping,
    error,
    sendMessage,
    startNewSession,
  } = useChatSession(roomId);

  const [inputValue, setInputValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    try {
      await sendMessage(inputValue, selectedRole || undefined, attachments);
      setInputValue('');
      setAttachments([]);
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  // 處理鍵盤事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 處理檔案選擇
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // 移除附件
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-hanami-primary border-t-transparent rounded-full"
        />
        <span className="ml-3 text-hanami-text-secondary">載入中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 text-center mb-4">{error}</p>
        <HanamiButton onClick={() => window.location.reload()} variant="soft">
          重新載入
        </HanamiButton>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-hanami-background ${className}`}>
      {/* 房間標題與角色選擇器 */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-hanami-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-hanami-text">{room?.title}</h2>
          <div className="flex items-center space-x-2">
            <HanamiButton
              size="sm"
              variant="soft"
              onClick={startNewSession}
              className="text-xs"
            >
              <SparklesIcon className="w-4 h-4 mr-1" />
              新對話
            </HanamiButton>
          </div>
        </div>

        {/* 活躍角色列表 */}
        {roles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRole('')}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedRole === '' 
                  ? 'bg-hanami-primary text-white' 
                  : 'bg-hanami-surface text-hanami-text-secondary hover:bg-hanami-secondary'
              }`}
            >
              所有角色
            </button>
            {roles.filter(r => r.is_active).map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedRole === role.id 
                    ? 'bg-hanami-primary text-white' 
                    : 'bg-hanami-surface text-hanami-text-secondary hover:bg-hanami-secondary'
                }`}
              >
                {role.nickname || role.role?.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* 輸入中指示器 */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-hanami-text-secondary"
          >
            <div className="flex space-x-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-hanami-primary rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-hanami-primary rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-hanami-primary rounded-full"
              />
            </div>
            <span className="text-sm">AI 正在思考中...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-hanami-border">
        {/* 附件預覽 */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-hanami-surface px-3 py-2 rounded-lg"
              >
                <PaperClipIcon className="w-4 h-4 text-hanami-text-secondary" />
                <span className="text-sm text-hanami-text">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 輸入框 */}
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                selectedRole 
                  ? `向 ${roles.find(r => r.id === selectedRole)?.nickname || '角色'} 發送訊息...`
                  : '輸入訊息... (Enter 發送，Shift+Enter 換行)'
              }
              className="w-full px-4 py-3 border border-hanami-border rounded-2xl resize-none focus:ring-2 focus:ring-hanami-primary focus:border-transparent transition-all"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* 附件按鈕 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-hanami-text-secondary hover:text-hanami-primary hover:bg-hanami-surface rounded-full transition-all"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            {/* 發送按鈕 */}
            <HanamiButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && attachments.length === 0}
              className="px-6 py-3 rounded-2xl"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </HanamiButton>
          </div>
        </div>

        {/* 隱藏的檔案輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
}

// ========================================
// 訊息氣泡組件
// ========================================

interface MessageBubbleProps {
  message: AIMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender_type === 'user';
  const isSystem = message.sender_type === 'system';
  
  const senderName = isUser 
    ? message.sender_user?.name || '用戶'
    : isSystem 
      ? '系統'
      : message.sender_role_instance?.nickname || message.sender_role_instance?.role?.name || 'AI';

  const senderAvatar = isUser 
    ? message.sender_user?.avatar_url
    : message.sender_role_instance?.role?.avatar_url;

  const getStatusIcon = () => {
    switch (message.status) {
      case 'queued':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
          />
        );
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-[80%]`}>
        {/* 頭像 */}
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-hanami-primary' : isSystem ? 'bg-gray-500' : 'bg-hanami-accent'
            }`}>
              {isUser ? (
                <UserIcon className="w-5 h-5 text-white" />
              ) : (
                <CpuChipIcon className="w-5 h-5 text-white" />
              )}
            </div>
          )}
        </div>

        {/* 訊息內容 */}
        <div className={`${isUser ? 'mr-3' : 'ml-3'}`}>
          {/* 發送者名稱 */}
          <div className={`text-xs text-hanami-text-secondary mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {senderName}
          </div>

          {/* 訊息氣泡 */}
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-hanami-primary text-white rounded-br-md'
                : isSystem
                  ? 'bg-gray-100 text-gray-800 rounded-bl-md'
                  : 'bg-white border border-hanami-border text-hanami-text rounded-bl-md shadow-sm'
            }`}
          >
            {message.content && (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}

            {message.content_json && (
              <div className="mt-2 p-3 bg-black bg-opacity-10 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(message.content_json, null, 2)}
                </pre>
              </div>
            )}

            {/* 附件 */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded-lg"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    <span className="text-sm">{attachment.file_name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 工具調用 */}
            {message.tool_calls && (
              <div className="mt-2 p-3 bg-black bg-opacity-10 rounded-lg">
                <div className="text-sm font-medium mb-2">工具調用:</div>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(message.tool_calls, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* 訊息狀態與時間 */}
          <div className={`flex items-center space-x-2 mt-1 text-xs text-hanami-text-secondary ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            {getStatusIcon()}
            <span>
              {new Date(message.created_at).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {message.model_used && (
              <span className="text-hanami-text-secondary">
                • {message.model_used}
              </span>
            )}
            {message.processing_time_ms && (
              <span className="text-hanami-text-secondary">
                • {message.processing_time_ms}ms
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AIRoomChat;

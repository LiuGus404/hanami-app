'use client';

import React from 'react';
import { ChatMessage } from './ThreadChat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';
  const isError = message.status === 'error';
  const isProcessing = message.status === 'processing';

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 獲取角色顯示名稱
  const getRoleDisplayName = () => {
    switch (message.role) {
      case 'user':
        return '您';
      case 'assistant':
        return message.agent_id || 'AI 助手';
      case 'system':
        return '系統';
      case 'agent':
        return message.agent_id || 'AI 代理';
      default:
        return '未知';
    }
  };

  // 獲取角色頭像
  const getRoleAvatar = () => {
    switch (message.role) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'agent':
        return '🎯';
      default:
        return '❓';
    }
  };

  // 獲取狀態指示器
  const getStatusIndicator = () => {
    switch (message.status) {
      case 'queued':
        return <span className="text-yellow-500">⏳</span>;
      case 'processing':
        return <span className="text-blue-500 animate-pulse">🔄</span>;
      case 'completed':
        return <span className="text-green-500">✅</span>;
      case 'error':
        return <span className="text-red-500">❌</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* 頭像 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          isUser 
            ? 'bg-[#FFD59A] text-[#4B4036]' 
            : isAssistant 
            ? 'bg-[#EBC9A4] text-[#4B4036]'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {getRoleAvatar()}
        </div>

        {/* 訊息內容 */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* 角色名稱和狀態 */}
          <div className={`flex items-center space-x-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs font-medium text-[#4B4036]">
              {getRoleDisplayName()}
            </span>
            {getStatusIndicator()}
            {message.food_cost > 0 && (
              <span className="text-xs text-[#2B3A3B]">
                -{message.food_cost}🍎
              </span>
            )}
          </div>

          {/* 訊息氣泡 */}
          <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-[#FFD59A] text-[#4B4036] rounded-br-md'
              : isAssistant
              ? 'bg-white text-[#4B4036] border border-[#EADBC8] rounded-bl-md'
              : isSystem
              ? 'bg-gray-100 text-gray-700 border border-gray-200'
              : 'bg-white text-[#4B4036] border border-[#EADBC8]'
          } ${isError ? 'border-red-300 bg-red-50' : ''}`}>
            
            {/* 訊息內容 */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* 錯誤訊息 */}
            {isError && message.error_message && (
              <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
                <strong>錯誤:</strong> {message.error_message}
              </div>
            )}

            {/* 處理時間 */}
            {message.processing_time_ms && (
              <div className="text-xs text-gray-500 mt-1">
                處理時間: {message.processing_time_ms}ms
              </div>
            )}
          </div>

          {/* 時間戳 */}
          <div className={`text-xs text-[#2B3A3B] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.created_at)}
          </div>

          {/* 訊息類型標籤 */}
          {message.message_type && message.message_type !== 'user_request' && (
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
              isUser ? 'bg-[#FFD59A] text-[#4B4036]' : 'bg-gray-100 text-gray-600'
            }`}>
              {message.message_type}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

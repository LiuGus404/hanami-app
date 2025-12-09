'use client';

import React from 'react';
import { ChatMessage } from './ThreadChat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Support both 'role' (ThreadChat) and 'sender' (Page) properties
  const role = message.role || (message as any).sender;
  const isUser = role === 'user';
  // Check if it's an AI character (hibi, mori, pic, or assistant/agent)
  const isAssistant = role === 'assistant' || role === 'agent' || ['hibi', 'mori', 'pico'].includes(role);
  const isSystem = role === 'system';
  const isError = message.status === 'error';

  // Robust attachment parsing
  let safeAttachments: any[] = [];
  try {
    const rawAttachments = message.attachments || (message as any).images; // Support 'images' alias if any
    if (Array.isArray(rawAttachments)) {
      safeAttachments = rawAttachments;
    } else if (typeof rawAttachments === 'string') {
      safeAttachments = JSON.parse(rawAttachments);
    }
  } catch (e) {
    console.error('Error parsing attachments:', e);
  }

  // Fallback to content_json images
  let contentJsonImages: any[] = [];
  try {
    const cJson = message.content_json;
    const images = (cJson as any)?.images;
    if (Array.isArray(images)) {
      contentJsonImages = images;
    } else if (typeof images === 'string') {
      contentJsonImages = JSON.parse(images);
    }
  } catch (e) {
    console.error('Error parsing content_json images:', e);
  }

  const finalAttachments = [...safeAttachments, ...contentJsonImages];

  if (finalAttachments.length > 0) {
    console.log('🖼️ [MessageBubble] Has attachments:', finalAttachments.length);
  }

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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
        return <span className="text-yellow-500 text-xs" title="排隊中">⏳</span>;
      case 'processing':
        return (
          <span className="text-blue-500 text-xs animate-spin inline-block" title="思考中">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        );
      case 'sent':
      case 'completed':
        return <span className="text-green-500 text-xs" title="已送達">✓</span>;
      case 'error':
        return <span className="text-red-500 text-xs" title="發送失敗">!</span>;
      default:
        // Default checkmark for older messages without status
        return <span className="text-gray-300 text-xs">✓</span>;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* 頭像 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${isUser
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
          <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${isUser
            ? 'bg-[#FFD59A] text-[#4B4036] rounded-br-md'
            : isAssistant
              ? 'bg-white text-[#4B4036] border border-[#EADBC8] rounded-bl-md'
              : isSystem
                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                : 'bg-white text-[#4B4036] border border-[#EADBC8]'
            } ${isError ? 'border-red-300 bg-red-50' : ''}`}>

            {/* 訊息內容 */}
            {message.content && (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}

            {/* Attachments */}
            {finalAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 relative">
                {finalAttachments.map((att: any, idx: number) => (
                  <div key={idx} className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#EADBC8]">
                    <img
                      src={att.url || (att.path && att.path.startsWith('http') ? att.path : '/assets/loading-logo.png')}
                      alt={att.name || 'attachment'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

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

            {/* 思維積木與模型資訊 */}
            {isAssistant && message.content_json && (
              <div className="mt-2 pt-2 border-t border-[#EADBC8]/50 text-xs text-[#8C7B6C] flex flex-wrap gap-3">
                {/* Debug log */}


                {(message.content_json.mind_name || message.content_json.model_responses?.[0]?.mind_name) && (
                  <span className="flex items-center gap-1" title="思維積木">
                    🧠 {message.content_json.mind_name || message.content_json.model_responses?.[0]?.mind_name}
                  </span>
                )}
                {(message.content_json.model_responses?.[0]?.model || message.model_used) && (
                  <span className="flex items-center gap-1" title="使用模型">
                    🤖 {message.content_json.model_responses?.[0]?.model || message.model_used}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 時間戳 */}
          <div className={`text-xs text-[#2B3A3B] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.created_at)}
          </div>

          {/* 訊息類型標籤 */}
          {message.message_type && message.message_type !== 'user_request' && (
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${isUser ? 'bg-[#FFD59A] text-[#4B4036]' : 'bg-gray-100 text-gray-600'
              }`}>
              {message.message_type}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  PuzzlePieceIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useChatSession } from '../../hooks/useAICompanion';
import { HanamiButton, HanamiCard } from '../ui';
import type { AIMessage, RoleInstance } from '../../types/ai-companion';

interface AIRoomChatProps {
  roomId: string;
  className?: string;
}

import { ChatLoadoutPanel } from './ChatLoadoutPanel';
import { BlockSelectionModal } from './BlockSelectionModal';
import { MindBlock } from '@/types/mind-block';

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
    updateRoleInstance,
  } = useChatSession(roomId);

  const [inputValue, setInputValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 首次進入聊天室時的「尚未裝備思維積木」提示
  const [showEquipHint, setShowEquipHint] = useState(false);

  // Loadout Panel State
  const [showLoadout, setShowLoadout] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    slotType: 'role' | 'style' | 'task';
    roleInstanceId: string;
  }>({
    isOpen: false,
    slotType: 'role',
    roleInstanceId: '',
  });

  // Listen for open-block-selector event
  useEffect(() => {
    const handleOpenBlockSelector = (e: CustomEvent) => {
      setModalState({
        isOpen: true,
        slotType: e.detail.type,
        roleInstanceId: e.detail.roleInstanceId,
      });
    };

    window.addEventListener('open-block-selector' as any, handleOpenBlockSelector as any);
    return () => {
      window.removeEventListener('open-block-selector' as any, handleOpenBlockSelector as any);
    };
  }, []);

  // 檢查是否需要顯示「裝備思維積木」提示（每個房間只顯示一次）
  useEffect(() => {
    if (!room?.id) return;

    const storageKey = `hanami_mindblock_equip_hint_shown_${room.id}`;
    const alreadyShown =
      typeof window === 'undefined' ? true : localStorage.getItem(storageKey) === 'true';
    if (alreadyShown) return;

    const hasEquipped = roles.some((r) => {
      const equipped = (r.settings as any)?.equipped_blocks || {};
      return !!(equipped.role || equipped.style || equipped.task);
    });

    if (!hasEquipped) {
      setShowEquipHint(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [room?.id, roles]);

  // Handle Block Selection
  const handleBlockSelect = async (block: MindBlock) => {
    const { roleInstanceId, slotType } = modalState;
    const roleInstance = roles.find(r => r.id === roleInstanceId);

    if (!roleInstance) {
      console.error('❌ 找不到對應的角色實例，無法裝備思維積木', { roleInstanceId, slotType });
      return;
    }

    const currentSettings = roleInstance.settings || {};
    const currentEquipped = currentSettings.equipped_blocks || {};

    const newEquipped = {
      ...currentEquipped,
      [slotType]: block
    };

    // Construct new system prompt
    // Base prompt from role definition
    let newSystemPrompt = roleInstance.role?.system_prompt || '';

    // Append blocks
    if (newEquipped.role) newSystemPrompt += `\n\n[Role Definition]\n${newEquipped.role.content_json?.blocks?.[0]?.params?.content || ''}`;
    if (newEquipped.style) newSystemPrompt += `\n\n[Style Guide]\n${newEquipped.style.content_json?.blocks?.[0]?.params?.content || ''}`;
    if (newEquipped.task) newSystemPrompt += `\n\n[Current Task]\n${newEquipped.task.content_json?.blocks?.[0]?.params?.content || ''}`;

    try {
      await updateRoleInstance(roleInstanceId, {
        settings: {
          ...currentSettings,
          equipped_blocks: newEquipped
        },
        system_prompt_override: newSystemPrompt
      });
      console.log('✅ 思維積木已裝備到角色實例', { roleInstanceId, slotType, blockId: block.id });
      setModalState(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('❌ Failed to equip block (updateRoleInstance error):', err);
    }
  };

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

  // Determine which role to show in Loadout Panel
  // If a specific role is selected, show that.
  // If "All Roles" (empty string) is selected, show the first active role or maybe a list?
  // For simplicity, let's show the first active role if "All Roles" is selected, 
  // or maybe we should force user to select a role to edit loadout?
  // Let's show the first active role for now.
  const activeRoleInstance = selectedRole
    ? roles.find(r => r.id === selectedRole)
    : roles.find(r => r.is_active);

  return (
    <div className={`flex h-full bg-hanami-background ${className}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* 房間標題與角色選擇器 */}
        <div className="flex-shrink-0 p-4 bg-white border-b border-hanami-border flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-hanami-text">{room?.title}</h2>
              <div className="flex items-center space-x-2 ml-4">
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
                  className={`px-3 py-1 rounded-full text-sm transition-all ${selectedRole === ''
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
                    className={`px-3 py-1 rounded-full text-sm transition-all ${selectedRole === role.id
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

          {/* Toggle Loadout Panel Button */}
          <button
            onClick={() => setShowLoadout(!showLoadout)}
            className={`p-2 rounded-lg transition-colors ${showLoadout ? 'bg-hanami-primary text-white' : 'text-hanami-text-secondary hover:bg-hanami-surface'}`}
            title="Toggle Loadout Panel"
          >
            <CpuChipIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 訊息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          {/* 首次進入聊天室的思維積木提示 */}
          <AnimatePresence>
            {showEquipHint && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-auto fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40"
              >
                <div className="bg-white rounded-2xl shadow-xl border border-[#EADBC8] p-4 flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] flex items-center justify-center flex-shrink-0">
                    <PuzzlePieceIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#4B4036] mb-1">
                      還沒有裝備思維積木
                    </h4>
                    <p className="text-xs text-[#4B4036]/70">
                      建議先幫角色裝備「思維積木」，讓 Hibi、墨墨和皮可以照你的角色、風格與任務思考。
                    </p>
                    <button
                      onClick={() => {
                        setShowEquipHint(false);
                        setShowLoadout(true);
                      }}
                      className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-xs font-bold text-white shadow hover:shadow-md transition-all"
                    >
                      <PuzzlePieceIcon className="w-4 h-4 mr-1" />
                      前往裝備思維積木
                    </button>
                  </div>
                  <button
                    onClick={() => setShowEquipHint(false)}
                    className="p-1 text-[#4B4036]/30 hover:text-[#4B4036] hover:bg-[#FFF9F2] rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onDelete={useChatSession(roomId).deleteMessage}
                isOwner={true} // 暫時允許所有用戶刪除（後端會驗證）
              />
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

      {/* Loadout Panel (Right Sidebar) */}
      <AnimatePresence>
        {showLoadout && activeRoleInstance && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-hanami-border h-full overflow-hidden"
          >
            <ChatLoadoutPanel
              roleInstance={activeRoleInstance}
              onUpdateRole={(updates) => updateRoleInstance(activeRoleInstance.id, updates)}
              onClose={() => setShowLoadout(false)}
              className="w-80 h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Selection Modal */}
      <BlockSelectionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleBlockSelect}
        slotType={modalState.slotType}
        roleInstanceId={modalState.roleInstanceId}
      />
    </div>
  );
}

// ========================================
// 訊息氣泡組件
// ========================================

interface MessageBubbleProps {
  message: AIMessage;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

function MessageBubble({ message, onDelete, isOwner }: MessageBubbleProps) {
  const isUser = message.sender_type === 'user';
  const isSystem = message.sender_type === 'system';

  const senderName = isUser
    ? message.sender_user?.name || '用戶'
    : isSystem
      ? '系統'
      : message.sender_role_instance?.nickname || message.sender_role_instance?.role?.name || 'AI';

  const rawSenderAvatar = isUser
    ? message.sender_user?.avatar_url
    : message.sender_role_instance?.role?.avatar_url;

  const senderAvatar =
    rawSenderAvatar && rawSenderAvatar.includes('Hibi.png')
      ? '/3d-character-backgrounds/studio/Hibi/lulu(front).png'
      : rawSenderAvatar;

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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-hanami-primary' : isSystem ? 'bg-gray-500' : 'bg-hanami-accent'
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
          <div className={`text-xs text-hanami-text-secondary mb-1 ${isUser ? 'text-right' : 'text-left'} flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {senderName}

            {/* 刪除按鈕 (僅在 hover 時顯示，且僅限用戶自己的訊息或擁有者) */}
            {(isUser || isOwner) && onDelete && (
              <button
                onClick={() => {
                  if (confirm('確定要刪除這條訊息嗎？如果包含圖片，圖片也會被刪除。')) {
                    onDelete(message.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                title="刪除訊息"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>

          {/* 訊息氣泡 */}
          <div
            className={`px-4 py-3 rounded-2xl ${isUser
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
          <div className={`flex items-center space-x-2 mt-1 text-xs text-hanami-text-secondary ${isUser ? 'justify-end' : 'justify-start'
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

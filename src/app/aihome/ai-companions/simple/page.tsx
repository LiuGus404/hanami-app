'use client';

import React, { useState } from 'react';
import { HanamiButton, HanamiCard } from '../../../../components/ui';
import { 
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

export default function SimpleAICompanionsPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'roles'>('chat');

  return (
    <div className="min-h-screen bg-hanami-background">
      {/* 頁面標題 */}
      <div className="bg-white border-b border-hanami-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-hanami-text flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-full flex items-center justify-center mr-3">
                  <CpuChipIcon className="w-6 h-6 text-white" />
                </div>
                AI 伙伴系統（簡化版）
              </h1>
              <p className="text-hanami-text-secondary">
                測試版本，確保基礎功能正常
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 側邊欄 */}
          <div className="lg:w-80 flex-shrink-0">
            <HanamiCard className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'chat'
                      ? 'bg-hanami-primary text-white shadow-sm'
                      : 'text-hanami-text-secondary hover:text-hanami-text hover:bg-hanami-surface'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <div className="ml-3 text-left">
                    <div className="font-medium">對話聊天</div>
                    <div className="text-xs opacity-75">與 AI 角色進行對話</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'roles'
                      ? 'bg-hanami-primary text-white shadow-sm'
                      : 'text-hanami-text-secondary hover:text-hanami-text hover:bg-hanami-surface'
                  }`}
                >
                  <CpuChipIcon className="w-5 h-5" />
                  <div className="ml-3 text-left">
                    <div className="font-medium">角色管理</div>
                    <div className="text-xs opacity-75">管理 AI 角色</div>
                  </div>
                </button>
              </nav>
            </HanamiCard>
          </div>

          {/* 主內容區域 */}
          <div className="flex-1 min-w-0">
            <HanamiCard className="p-8">
              {activeTab === 'chat' && (
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-hanami-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-hanami-text mb-2">
                    聊天功能
                  </h3>
                  <p className="text-hanami-text-secondary mb-4">
                    這裡將顯示聊天室界面
                  </p>
                  <HanamiButton>
                    開始對話
                  </HanamiButton>
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="text-center">
                  <CpuChipIcon className="w-16 h-16 text-hanami-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-hanami-text mb-2">
                    角色管理
                  </h3>
                  <p className="text-hanami-text-secondary mb-4">
                    這裡將顯示角色管理界面
                  </p>
                  <HanamiButton>
                    管理角色
                  </HanamiButton>
                </div>
              )}
            </HanamiCard>
          </div>
        </div>
      </div>
    </div>
  );
}


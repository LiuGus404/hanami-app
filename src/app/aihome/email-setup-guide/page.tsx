'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  CogIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function EmailSetupGuidePage() {
  const [activeTab, setActiveTab] = useState('problem');

  const tabs = [
    { id: 'problem', label: '問題說明', icon: ExclamationTriangleIcon },
    { id: 'solution', label: '解決方案', icon: CogIcon },
    { id: 'alternative', label: '替代方案', icon: InformationCircleIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            Supabase 郵件配置指南
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            解決 HanamiEcho 郵件驗證問題
          </p>
        </div>

        {/* 標籤導航 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/50 rounded-xl p-1 border border-[#EADBC8]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'text-[#2B3A3B] hover:bg-white/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 內容區域 */}
        <div className="space-y-6">
          {activeTab === 'problem' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    問題說明
                  </h2>
                  <div className="space-y-4 text-[#2B3A3B]">
                    <p>
                      <strong>問題：</strong>註冊用戶後沒有收到驗證郵件
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-2">可能的原因：</h3>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        <li>Supabase 未配置 SMTP 郵件服務</li>
                        <li>郵件服務提供商限制</li>
                        <li>垃圾郵件過濾器攔截</li>
                        <li>Supabase 免費版郵件限制</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'solution' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CogIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    解決方案
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[#4B4036] mb-3">
                        1. 配置 Supabase SMTP 設置
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <ol className="list-decimal list-inside space-y-2 text-[#2B3A3B]">
                          <li>登入 Supabase 控制台</li>
                          <li>選擇您的項目</li>
                          <li>導航至 <code className="bg-white px-2 py-1 rounded">Authentication → SMTP Settings</code></li>
                          <li>配置 SMTP 服務器信息：
                            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                              <li>SMTP 主機名</li>
                              <li>端口號（通常 587 或 465）</li>
                              <li>用戶名和密碼</li>
                              <li>發件人郵箱地址</li>
                            </ul>
                          </li>
                          <li>保存設置並測試</li>
                        </ol>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-[#4B4036] mb-3">
                        2. 推薦的 SMTP 服務提供商
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">SendGrid</h4>
                          <p className="text-sm text-[#2B3A3B]">專業郵件服務，每月免費 100 封郵件</p>
                        </div>
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">Mailgun</h4>
                          <p className="text-sm text-[#2B3A3B]">開發者友好的郵件 API</p>
                        </div>
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">Amazon SES</h4>
                          <p className="text-sm text-[#2B4036]">AWS 的郵件服務</p>
                        </div>
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">Gmail SMTP</h4>
                          <p className="text-sm text-[#2B3A3B]">使用 Gmail 的 SMTP 服務</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'alternative' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <InformationCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    替代方案
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[#4B4036] mb-3">
                        當前實施的解決方案
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold text-green-800 mb-2">
                              跳過郵件驗證
                            </h4>
                            <p className="text-green-700 mb-3">
                              用戶註冊後直接標記為已驗證，無需等待郵件驗證
                            </p>
                            <div className="bg-white/50 rounded-lg p-3">
                              <code className="text-sm text-green-800">
                                email_confirm: true
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-[#4B4036] mb-3">
                        其他替代方案
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">手動驗證</h4>
                          <p className="text-sm text-[#2B3A3B]">
                            管理員手動驗證用戶帳戶，適合小規模應用
                          </p>
                        </div>
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">第三方認證</h4>
                          <p className="text-sm text-[#2B3A3B]">
                            使用 Google、Facebook 等第三方登入
                          </p>
                        </div>
                        <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                          <h4 className="font-semibold text-[#4B4036] mb-2">SMS 驗證</h4>
                          <p className="text-sm text-[#2B3A3B]">
                            使用手機號碼進行驗證
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        測試郵件功能
                      </h4>
                      <p className="text-yellow-700 mb-3">
                        您可以使用測試頁面來驗證郵件發送功能
                      </p>
                      <HanamiButton
                        onClick={() => window.location.href = '/aihome/test-email'}
                        size="sm"
                      >
                        前往測試頁面
                      </HanamiButton>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}
        </div>

        <div className="text-center mt-8">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/dashboard'}
            size="lg"
          >
            返回儀表板
          </HanamiButton>
        </div>
      </div>
    </div>
  );
}


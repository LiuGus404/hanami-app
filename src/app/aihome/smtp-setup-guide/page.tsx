'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  CogIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CloudIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

export default function SMTPSetupGuidePage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '問題概述', icon: ExclamationTriangleIcon },
    { id: 'providers', label: 'SMTP 提供商', icon: CloudIcon },
    { id: 'setup', label: '配置步驟', icon: CogIcon },
    { id: 'testing', label: '測試驗證', icon: CheckCircleIcon }
  ];

  const smtpProviders = [
    {
      name: 'SendGrid',
      freeTier: '100 封/月',
      pricing: '免費',
      pros: ['易於設置', '可靠', '良好文檔'],
      cons: ['免費額度有限'],
      setupUrl: 'https://sendgrid.com/',
      recommended: true
    },
    {
      name: 'AWS SES',
      freeTier: '62,000 封/月',
      pricing: '$0.10/1000 封',
      pros: ['高額度', '企業級', '可擴展'],
      cons: ['設置複雜', '需要 AWS 帳戶'],
      setupUrl: 'https://aws.amazon.com/ses/',
      recommended: true
    },
    {
      name: 'Mailgun',
      freeTier: '5,000 封/月',
      pricing: '免費',
      pros: ['開發者友好', 'API 豐富'],
      cons: ['需要信用卡驗證'],
      setupUrl: 'https://www.mailgun.com/',
      recommended: false
    },
    {
      name: 'Gmail SMTP',
      freeTier: '500 封/天',
      pricing: '免費',
      pros: ['完全免費', '易於設置'],
      cons: ['需要應用密碼', '限制較多'],
      setupUrl: 'https://support.google.com/mail/answer/7126229',
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            Supabase SMTP 配置指南
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            解決 HanamiEcho 郵件發送問題
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
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HanamiCard className="p-6">
                <div className="flex items-start space-x-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                      問題診斷
                    </h2>
                    <div className="space-y-4 text-[#2B3A3B]">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="font-semibold text-red-800 mb-2">Supabase 免費版限制：</h3>
                        <ul className="list-disc list-inside space-y-1 text-red-700">
                          <li>每小時只能發送 <strong>2 封郵件</strong></li>
                          <li>使用默認 SMTP 服務</li>
                          <li>沒有自定義域名</li>
                          <li>郵件可能被標記為垃圾郵件</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </HanamiCard>

              <HanamiCard className="p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                      當前解決方案
                    </h2>
                    <div className="space-y-4 text-[#2B3A3B]">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 mb-2">已實施：</h3>
                        <ul className="list-disc list-inside space-y-1 text-green-700">
                          <li>跳過郵件驗證</li>
                          <li>用戶註冊後立即可用</li>
                          <li>簡化註冊流程</li>
                          <li>無需等待郵件</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </HanamiCard>
            </div>
          )}

          {activeTab === 'providers' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CloudIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-6">
                    SMTP 服務提供商
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {smtpProviders.map((provider) => (
                      <div key={provider.name} className={`border rounded-xl p-6 ${
                        provider.recommended 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-[#EADBC8] bg-white/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-[#4B4036]">
                            {provider.name}
                          </h3>
                          {provider.recommended && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                              推薦
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="font-medium text-[#4B4036]">免費額度：</span>
                            <span className="text-[#2B3A3B]">{provider.freeTier}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#4B4036]">定價：</span>
                            <span className="text-[#2B3A3B]">{provider.pricing}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-[#4B4036]">優點：</span>
                            <ul className="list-disc list-inside text-sm text-[#2B3A3B] mt-1">
                              {provider.pros.map((pro, index) => (
                                <li key={index}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <span className="font-medium text-[#4B4036]">缺點：</span>
                            <ul className="list-disc list-inside text-sm text-[#2B3A3B] mt-1">
                              {provider.cons.map((con, index) => (
                                <li key={index}>{con}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <HanamiButton
                            onClick={() => window.open(provider.setupUrl, '_blank')}
                            size="sm"
                            className="w-full"
                          >
                            查看設置指南
                          </HanamiButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'setup' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CogIcon className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-6">
                    Supabase SMTP 配置步驟
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">
                        步驟 1：獲取 SMTP 憑證
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-blue-700">
                        <li>選擇一個 SMTP 服務提供商（推薦 SendGrid 或 AWS SES）</li>
                        <li>註冊帳戶並完成驗證</li>
                        <li>創建 API 密鑰或 SMTP 憑證</li>
                        <li>記錄以下信息：
                          <ul className="list-disc list-inside ml-4 mt-2">
                            <li>SMTP 主機名</li>
                            <li>端口號（通常 587 或 465）</li>
                            <li>用戶名</li>
                            <li>密碼/API 密鑰</li>
                            <li>發件人郵箱地址</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-green-800 mb-4">
                        步驟 2：在 Supabase 中配置
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-green-700">
                        <li>登入 Supabase 控制台</li>
                        <li>選擇您的項目</li>
                        <li>導航至 <code className="bg-white px-2 py-1 rounded">Settings → Auth → SMTP Settings</code></li>
                        <li>填寫 SMTP 配置：
                          <ul className="list-disc list-inside ml-4 mt-2">
                            <li>啟用自定義 SMTP</li>
                            <li>輸入 SMTP 主機名</li>
                            <li>輸入端口號</li>
                            <li>輸入用戶名和密碼</li>
                            <li>設置發件人郵箱</li>
                          </ul>
                        </li>
                        <li>保存設置</li>
                        <li>測試郵件發送</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-yellow-800 mb-4">
                        步驟 3：啟用郵件確認
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                        <li>在 <code className="bg-white px-2 py-1 rounded">Settings → Auth</code> 中</li>
                        <li>啟用 "Enable email confirmations"</li>
                        <li>設置郵件模板（可選）</li>
                        <li>配置重定向 URL</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'testing' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-6">
                    測試和驗證
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-green-800 mb-4">
                        測試方法
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">1. 使用測試頁面</h4>
                          <p className="text-green-700 mb-3">使用我們提供的測試頁面來驗證郵件發送功能</p>
                          <HanamiButton
                            onClick={() => window.location.href = '/aihome/test-email'}
                            size="sm"
                          >
                            前往測試頁面
                          </HanamiButton>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">2. 註冊新用戶</h4>
                          <p className="text-green-700 mb-3">嘗試註冊一個新用戶，檢查是否收到驗證郵件</p>
                          <HanamiButton
                            onClick={() => window.location.href = '/aihome/auth/register'}
                            size="sm"
                          >
                            測試註冊
                          </HanamiButton>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">3. 檢查 Supabase 日誌</h4>
                          <p className="text-green-700">在 Supabase 控制台的 Logs 部分檢查郵件發送狀態</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">
                        常見問題排查
                      </h3>
                      <div className="space-y-3 text-blue-700">
                        <div>
                          <h4 className="font-semibold">郵件沒有發送：</h4>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>檢查 SMTP 憑證是否正確</li>
                            <li>確認 SMTP 服務商沒有限制</li>
                            <li>檢查 Supabase 日誌中的錯誤信息</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold">郵件被標記為垃圾郵件：</h4>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>使用自定義域名</li>
                            <li>設置 SPF 和 DKIM 記錄</li>
                            <li>避免使用可疑的郵件內容</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold">郵件發送延遲：</h4>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>檢查 SMTP 服務商的狀態</li>
                            <li>確認網絡連接正常</li>
                            <li>檢查 Supabase 的服務狀態</li>
                          </ul>
                        </div>
                      </div>
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


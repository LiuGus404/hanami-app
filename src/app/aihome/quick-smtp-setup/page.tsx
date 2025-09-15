'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  CogIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function QuickSMTPSetupPage() {
  const [selectedProvider, setSelectedProvider] = useState('');

  const providers = [
    {
      id: 'sendgrid',
      name: 'SendGrid',
      freeTier: '100 封/月',
      setupTime: '5-10 分鐘',
      difficulty: '簡單',
      steps: [
        '註冊 SendGrid 帳戶',
        '創建 API 密鑰',
        '在 Supabase 中配置 SMTP',
        '測試郵件發送'
      ],
      smtpSettings: {
        host: 'smtp.sendgrid.net',
        port: '587',
        username: 'apikey',
        password: '你的 API 密鑰'
      }
    },
    {
      id: 'gmail',
      name: 'Gmail SMTP',
      freeTier: '500 封/天',
      setupTime: '3-5 分鐘',
      difficulty: '最簡單',
      steps: [
        '啟用 Gmail 兩步驗證',
        '生成應用密碼',
        '在 Supabase 中配置 SMTP',
        '測試郵件發送'
      ],
      smtpSettings: {
        host: 'smtp.gmail.com',
        port: '587',
        username: '你的 Gmail 地址',
        password: '你的應用密碼'
      }
    }
  ];

  const currentSolution = {
    status: '已實施',
    description: '跳過郵件驗證，用戶註冊後立即可用',
    benefits: [
      '無需等待郵件',
      '立即可用所有功能',
      '簡化用戶體驗',
      '避免郵件發送問題'
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            快速解決方案
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            根據診斷結果提供的最佳解決方案
          </p>
        </div>

        <div className="space-y-6">
          {/* 當前解決方案 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  當前解決方案（推薦）
                </h2>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {currentSolution.status}
                    </span>
                    <span className="text-green-700 font-medium">
                      {currentSolution.description}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {currentSolution.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-green-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-4">
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/auth/register'}
                      size="lg"
                    >
                      測試註冊功能
                    </HanamiButton>
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/dashboard'}
                      size="lg"
                      variant="secondary"
                    >
                      前往儀表板
                    </HanamiButton>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 快速檢查 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  快速檢查（1 分鐘）
                </h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                    請立即檢查以下位置：
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
                      <span className="text-yellow-700">垃圾郵件文件夾</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
                      <span className="text-yellow-700">垃圾郵件文件夾</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
                      <span className="text-yellow-700">促銷郵件文件夾</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
                      <span className="text-yellow-700">所有郵件文件夾</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white/50 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>提示：</strong> 郵件可能被標記為垃圾郵件，請仔細檢查所有文件夾。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* SMTP 配置選項 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <CogIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  長期解決方案：配置 SMTP
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {providers.map((provider) => (
                    <div key={provider.id} className="border border-[#EADBC8] rounded-xl p-6 bg-white/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-[#4B4036]">
                          {provider.name}
                        </h3>
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                          {provider.difficulty}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <span className="font-medium text-[#4B4036]">免費額度：</span>
                          <span className="text-[#2B3A3B]">{provider.freeTier}</span>
                        </div>
                        <div>
                          <span className="font-medium text-[#4B4036]">設置時間：</span>
                          <span className="text-[#2B3A3B]">{provider.setupTime}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-[#4B4036] mb-2">設置步驟：</h4>
                        <ol className="list-decimal list-inside text-sm text-[#2B3A3B] space-y-1">
                          {provider.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-[#4B4036] mb-2">SMTP 設置：</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div>主機：{provider.smtpSettings.host}</div>
                          <div>端口：{provider.smtpSettings.port}</div>
                          <div>用戶名：{provider.smtpSettings.username}</div>
                          <div>密碼：{provider.smtpSettings.password}</div>
                        </div>
                      </div>
                      
                      <HanamiButton
                        onClick={() => setSelectedProvider(provider.id)}
                        size="sm"
                        className="w-full"
                        variant={selectedProvider === provider.id ? 'primary' : 'secondary'}
                      >
                        {selectedProvider === provider.id ? '已選擇' : '選擇此方案'}
                      </HanamiButton>
                    </div>
                  ))}
                </div>
                
                {selectedProvider && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                      下一步操作
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-700">
                          按照上述步驟配置 {providers.find(p => p.id === selectedProvider)?.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CogIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-700">
                          在 Supabase 控制台中配置 SMTP 設置
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-700">
                          測試郵件發送功能
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </HanamiCard>

          {/* 總結 */}
          <HanamiCard className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                建議行動計劃
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">立即（1 分鐘）</h3>
                  <p className="text-green-700 text-sm mb-3">檢查垃圾郵件文件夾</p>
                  <HanamiButton size="sm" variant="secondary">
                    檢查郵件
                  </HanamiButton>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">短期（今天）</h3>
                  <p className="text-blue-700 text-sm mb-3">使用當前跳過驗證方案</p>
                  <HanamiButton size="sm" variant="secondary">
                    測試註冊
                  </HanamiButton>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">長期（本週）</h3>
                  <p className="text-purple-700 text-sm mb-3">配置自定義 SMTP</p>
                  <HanamiButton size="sm" variant="secondary">
                    配置 SMTP
                  </HanamiButton>
                </div>
              </div>
            </div>
          </HanamiCard>
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


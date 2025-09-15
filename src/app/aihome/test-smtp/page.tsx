'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ServerIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function TestSMTPPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testSMTP = async () => {
    if (!email) {
      toast.error('請輸入郵箱地址');
      return;
    }

    setIsLoading(true);
    setTestResults(null);
    
    try {
      const response = await fetch('/aihome/api/auth/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('SMTP 測試響應:', data);

      setTestResults({
        timestamp: new Date().toISOString(),
        email: email,
        response: data,
        success: data.success
      });
      
      if (data.success) {
        toast.success('SMTP 測試完成！請檢查您的郵箱');
      } else {
        toast.error('SMTP 測試失敗：' + (data.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('SMTP 測試錯誤:', error);
      toast.error('SMTP 測試過程中發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmail = () => {
    toast.success('請檢查您的郵箱（包括垃圾郵件文件夾）！', {
      duration: 6000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            SMTP 配置測試
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            測試您新配置的 SMTP 設置
          </p>
        </div>

        <div className="space-y-6">
          {/* 測試輸入 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <ServerIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  SMTP 測試
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#4B4036] mb-2">
                      郵箱地址
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="請輸入您的郵箱地址"
                      className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                  </div>

                  <HanamiButton
                    onClick={testSMTP}
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? '測試中...' : '測試 SMTP 發送'}
                  </HanamiButton>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 測試結果 */}
          {testResults && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                {testResults.success ? (
                  <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                ) : (
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
                )}
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    測試結果
                  </h2>
                  
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 ${
                      testResults.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <h3 className={`font-semibold mb-2 ${
                        testResults.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        狀態：{testResults.success ? '成功' : '失敗'}
                      </h3>
                      <p className={`text-sm ${
                        testResults.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResults.response.message}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">詳細響應</h3>
                      <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(testResults.response, null, 2)}
                      </pre>
                    </div>

                    {testResults.success && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">下一步</h3>
                        <div className="space-y-2 text-blue-700">
                          <p>1. 檢查您的郵箱（包括垃圾郵件文件夾）</p>
                          <p>2. 如果收到郵件，說明 SMTP 配置成功</p>
                          <p>3. 可以開始使用完整的郵件驗證功能</p>
                        </div>
                        <div className="mt-4">
                          <HanamiButton
                            onClick={checkEmail}
                            size="sm"
                            variant="secondary"
                          >
                            檢查郵箱
                          </HanamiButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {/* 配置狀態 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  SMTP 配置狀態
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">✅ 已完成的配置</h3>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>在 Supabase 控制台中配置了 SMTP</li>
                      <li>Supabase 測試郵件發送成功</li>
                      <li>已收到 Supabase 發送的測試郵件</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">🔄 當前測試</h3>
                    <p className="text-blue-700">
                      使用新的 SMTP 測試 API 來驗證應用程序是否能正確使用您配置的 SMTP 設置。
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>如果測試成功，請檢查垃圾郵件文件夾</li>
                      <li>不同 SMTP 提供商可能有不同的發送延遲</li>
                      <li>某些郵箱服務可能對新配置的 SMTP 有額外限制</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 其他測試選項 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <EnvelopeIcon className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  其他測試選項
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                    <h3 className="font-semibold text-[#4B4036] mb-2">註冊測試</h3>
                    <p className="text-[#2B3A3B] text-sm mb-3">
                      測試完整的用戶註冊流程
                    </p>
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/auth/register'}
                      size="sm"
                      variant="secondary"
                    >
                      測試註冊
                    </HanamiButton>
                  </div>

                  <div className="bg-white/50 border border-[#EADBC8] rounded-lg p-4">
                    <h3 className="font-semibold text-[#4B4036] mb-2">診斷工具</h3>
                    <p className="text-[#2B3A3B] text-sm mb-3">
                      詳細的郵件發送診斷
                    </p>
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/email-diagnostic'}
                      size="sm"
                      variant="secondary"
                    >
                      運行診斷
                    </HanamiButton>
                  </div>
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


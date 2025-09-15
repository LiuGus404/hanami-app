'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function EmailDiagnosticPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const runDiagnostic = async () => {
    if (!email) {
      toast.error('請輸入郵箱地址');
      return;
    }

    setIsLoading(true);
    setDiagnosticResults(null);
    
    try {
      // 測試郵件發送
      const response = await fetch('/aihome/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('診斷響應:', data);

      // 收集診斷信息
      const results = {
        timestamp: new Date().toISOString(),
        email: email,
        apiResponse: data,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        diagnostics: {
          supabaseLimits: {
            freeTierLimit: '2 emails per hour',
            currentStatus: 'Using default SMTP',
            recommendation: 'Configure custom SMTP'
          },
          possibleIssues: [
            'Supabase free tier limit (2 emails/hour)',
            'Email in spam folder',
            'SMTP not configured',
            'Email confirmation disabled',
            'Network/firewall blocking'
          ],
          solutions: [
            'Check spam/junk folder',
            'Configure custom SMTP (SendGrid, AWS SES)',
            'Enable email confirmations in Supabase',
            'Use alternative verification method'
          ]
        }
      };

      setDiagnosticResults(results);
      
      if (data.success) {
        toast.success('診斷完成，請查看結果');
      } else {
        toast.error('診斷發現問題：' + (data.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('診斷錯誤:', error);
      toast.error('診斷過程中發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSpamFolder = () => {
    toast.success('請檢查您的垃圾郵件/垃圾郵件文件夾！', {
      duration: 6000,
    });
  };

  const openSupabaseConsole = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            郵件發送診斷工具
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            診斷 HanamiEcho 郵件發送問題
          </p>
        </div>

        <div className="space-y-6">
          {/* 診斷輸入 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <EnvelopeIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  郵件診斷
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
                    onClick={runDiagnostic}
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? '診斷中...' : '開始診斷'}
                  </HanamiButton>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 快速解決方案 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <InformationCircleIcon className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  快速解決方案
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">1. 檢查垃圾郵件</h3>
                    <p className="text-yellow-700 text-sm mb-3">
                      郵件可能被標記為垃圾郵件
                    </p>
                    <HanamiButton
                      onClick={checkSpamFolder}
                      size="sm"
                      variant="secondary"
                    >
                      檢查垃圾郵件
                    </HanamiButton>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">2. 配置 SMTP</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      設置自定義 SMTP 服務
                    </p>
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/smtp-setup-guide'}
                      size="sm"
                      variant="secondary"
                    >
                      查看配置指南
                    </HanamiButton>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">3. 使用當前方案</h3>
                    <p className="text-green-700 text-sm mb-3">
                      跳過郵件驗證，立即可用
                    </p>
                    <HanamiButton
                      onClick={() => window.location.href = '/aihome/auth/register'}
                      size="sm"
                      variant="secondary"
                    >
                      測試註冊
                    </HanamiButton>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">4. 檢查 Supabase</h3>
                    <p className="text-purple-700 text-sm mb-3">
                      查看 Supabase 控制台設置
                    </p>
                    <HanamiButton
                      onClick={openSupabaseConsole}
                      size="sm"
                      variant="secondary"
                    >
                      打開控制台
                    </HanamiButton>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 診斷結果 */}
          {diagnosticResults && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    診斷結果
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">API 響應</h3>
                      <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(diagnosticResults.apiResponse, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-2">可能的問題</h3>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        {diagnosticResults.diagnostics.possibleIssues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">建議解決方案</h3>
                      <ul className="list-disc list-inside space-y-1 text-green-700">
                        {diagnosticResults.diagnostics.solutions.map((solution: string, index: number) => (
                          <li key={index}>{solution}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">Supabase 限制信息</h3>
                      <div className="text-blue-700 space-y-1">
                        <p><strong>免費版限制：</strong> {diagnosticResults.diagnostics.supabaseLimits.freeTierLimit}</p>
                        <p><strong>當前狀態：</strong> {diagnosticResults.diagnostics.supabaseLimits.currentStatus}</p>
                        <p><strong>建議：</strong> {diagnosticResults.diagnostics.supabaseLimits.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {/* 常見問題 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  常見問題解答
                </h2>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h3 className="font-semibold text-[#4B4036] mb-1">Q: API 返回成功但沒收到郵件？</h3>
                    <p className="text-[#2B3A3B] text-sm">
                      A: 這是 Supabase 免費版的典型問題。API 返回成功但實際郵件可能被限制或延遲發送。
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-400 pl-4">
                    <h3 className="font-semibold text-[#4B4036] mb-1">Q: 如何檢查郵件是否真的發送？</h3>
                    <p className="text-[#2B3A3B] text-sm">
                      A: 檢查 Supabase 控制台的 Logs 部分，查看實際的郵件發送狀態和錯誤信息。
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-400 pl-4">
                    <h3 className="font-semibold text-[#4B4036] mb-1">Q: 最快的解決方案是什麼？</h3>
                    <p className="text-[#2B3A3B] text-sm">
                      A: 使用我們當前的跳過驗證方案，用戶註冊後立即可用，無需等待郵件驗證。
                    </p>
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


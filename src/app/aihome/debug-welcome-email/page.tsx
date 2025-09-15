'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  BugAntIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function DebugWelcomeEmailPage() {
  const [email, setEmail] = useState('test@example.com');
  const [nickname, setNickname] = useState('測試用戶');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWelcomeEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('開始測試歡迎郵件 API...');
      
      const response = await fetch('/aihome/api/auth/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          nickname: nickname
        })
      });

      console.log('API 響應狀態:', response.status);
      
      const data = await response.json();
      console.log('API 響應數據:', data);
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data
      });
    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            歡迎郵件 API 調試
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            調試 send-welcome-email API 的 500 錯誤
          </p>
        </div>

        <HanamiCard className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <BugAntIcon className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-[#4B4036]">
                API 調試工具
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  測試郵箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  測試暱稱
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <HanamiButton
                onClick={testWelcomeEmail}
                loading={loading}
                size="lg"
                className="w-full"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                測試歡迎郵件 API
              </HanamiButton>
            </div>

            {result && (
              <div className={`border rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {result.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <h3 className={`font-semibold ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    API 測試結果
                  </h3>
                </div>
                
                <div className="text-sm space-y-2">
                  <p><strong>狀態碼：</strong> {result.status}</p>
                  <p><strong>成功：</strong> {result.success ? '是' : '否'}</p>
                  
                  {result.data && (
                    <div>
                      <p><strong>響應數據：</strong></p>
                      <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <p className="text-red-700"><strong>錯誤：</strong> {result.error}</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">調試說明</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• 此工具用於調試 send-welcome-email API 的 500 錯誤</li>
                <li>• 會檢查用戶是否存在，避免重複邀請</li>
                <li>• 提供詳細的錯誤信息和響應數據</li>
                <li>• 查看瀏覽器控制台獲取更多調試信息</li>
              </ul>
            </div>
          </div>
        </HanamiCard>

        <div className="text-center mt-8 space-x-4">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/test-welcome-email'}
            size="lg"
            variant="secondary"
          >
            測試歡迎郵件
          </HanamiButton>
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


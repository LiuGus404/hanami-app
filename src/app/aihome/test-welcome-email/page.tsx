'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function TestWelcomeEmailPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sendWelcomeEmail = async () => {
    if (!email || !nickname) {
      setResult({
        success: false,
        error: '請填寫郵箱和暱稱'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
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

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: '發送過程中發生錯誤'
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
            測試歡迎郵件發送
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            測試註冊成功後的歡迎郵件功能
          </p>
        </div>

        <HanamiCard className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-[#4B4036]">
                歡迎郵件測試
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  郵箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="輸入測試郵箱地址"
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  暱稱
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="輸入用戶暱稱"
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <HanamiButton
                onClick={sendWelcomeEmail}
                loading={loading}
                size="lg"
                className="w-full"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                發送歡迎郵件
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
                    {result.success ? '發送成功' : '發送失敗'}
                  </h3>
                </div>
                
                <div className="text-sm space-y-2">
                  <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                    {result.message || result.error}
                  </p>
                  
                  {result.method && (
                    <p className="text-gray-600">
                      <strong>發送方法：</strong> {result.method}
                    </p>
                  )}
                  
                  {result.welcomeLink && (
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-600 mb-2"><strong>歡迎鏈接：</strong></p>
                      <a 
                        href={result.welcomeLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {result.welcomeLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">測試說明</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• 此工具測試註冊成功後的歡迎郵件發送</li>
                <li>• 使用您配置的 SMTP 設置發送郵件</li>
                <li>• 郵件將使用 HanamiEcho 品牌模板</li>
                <li>• 如果發送失敗，會提供備用鏈接</li>
              </ul>
            </div>
          </div>
        </HanamiCard>

        <div className="text-center mt-8 space-x-4">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/test-smtp'}
            size="lg"
            variant="secondary"
          >
            測試 SMTP 配置
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


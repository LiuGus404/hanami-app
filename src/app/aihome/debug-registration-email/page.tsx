'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  BugAntIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

export default function DebugRegistrationEmailPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    if (!email || !nickname || !password) {
      setResult({
        success: false,
        error: '請填寫所有必要字段'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('開始測試註冊流程...');
      
      const response = await fetch('/aihome/api/auth/register-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          nickname: nickname,
          phone: phone || null
        })
      });

      console.log('註冊 API 響應狀態:', response.status);
      
      const data = await response.json();
      console.log('註冊 API 響應數據:', data);
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data
      });
    } catch (error) {
      console.error('註冊測試過程中發生錯誤:', error);
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setLoading(false);
    }
  };

  const testWelcomeEmail = async () => {
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

      console.log('歡迎郵件 API 響應狀態:', response.status);
      
      const data = await response.json();
      console.log('歡迎郵件 API 響應數據:', data);
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data,
        testType: 'welcome_email'
      });
    } catch (error) {
      console.error('歡迎郵件測試過程中發生錯誤:', error);
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        testType: 'welcome_email'
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
            註冊郵件診斷工具
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            診斷註冊時沒有收到郵件的問題
          </p>
        </div>

        <HanamiCard className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <BugAntIcon className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-[#4B4036]">
                診斷工具
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  郵箱地址 *
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
                  暱稱 *
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="輸入用戶暱稱"
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  電話號碼（可選）
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="輸入電話號碼"
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  密碼 *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <HanamiButton
                  onClick={testRegistration}
                  loading={loading}
                  size="lg"
                  className="w-full"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  測試註冊流程
                </HanamiButton>
                
                <HanamiButton
                  onClick={testWelcomeEmail}
                  loading={loading}
                  size="lg"
                  variant="secondary"
                  className="w-full"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  測試歡迎郵件
                </HanamiButton>
              </div>
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
                    {result.testType === 'welcome_email' ? '歡迎郵件測試結果' : '註冊測試結果'}
                  </h3>
                </div>
                
                <div className="text-sm space-y-2">
                  <p><strong>狀態碼：</strong> {result.status}</p>
                  <p><strong>成功：</strong> {result.success ? '是' : '否'}</p>
                  
                  {result.data && (
                    <div>
                      <p><strong>響應數據：</strong></p>
                      <pre className="bg-white p-3 rounded border text-xs overflow-x-auto max-h-40">
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
              <h3 className="font-semibold text-blue-800 mb-2">診斷說明</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>測試註冊流程</strong>：模擬完整的註冊過程，包括郵件發送</li>
                <li>• <strong>測試歡迎郵件</strong>：單獨測試郵件發送功能</li>
                <li>• 查看瀏覽器控制台獲取詳細的調試信息</li>
                <li>• 檢查 Supabase 控制台的日誌和郵件發送記錄</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">常見問題</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• 檢查垃圾郵件文件夾</li>
                <li>• 確認 SMTP 配置是否正確</li>
                <li>• 檢查 Supabase 的郵件發送限制</li>
                <li>• 確認郵箱地址格式正確</li>
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

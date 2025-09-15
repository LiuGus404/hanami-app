'use client';

import { useState, useEffect } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  BugAntIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  CircleStackIcon as CookieIcon
} from '@heroicons/react/24/outline';

export default function DebugAuthStatusPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const checkAuthStatus = async () => {
    setLoading(true);
    
    try {
      // 檢查當前認證狀態
      const response = await fetch('/aihome/api/auth/check-status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      setAuthStatus({
        error: '無法檢查認證狀態',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const getCookies = () => {
    const cookieString = document.cookie;
    setCookies(cookieString);
  };

  const testDashboardAccess = () => {
    window.location.href = '/aihome/dashboard';
  };

  useEffect(() => {
    checkAuthStatus();
    getCookies();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            認證狀態調試工具
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            檢查認證狀態和 Cookie 信息
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 認證狀態 */}
          <HanamiCard className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <KeyIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-[#4B4036]">
                認證狀態
              </h2>
            </div>

            <div className="space-y-4">
              <HanamiButton
                onClick={checkAuthStatus}
                loading={loading}
                size="lg"
                className="w-full"
              >
                檢查認證狀態
              </HanamiButton>

              {authStatus && (
                <div className={`border rounded-lg p-4 ${
                  authStatus.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {authStatus.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <h3 className={`font-semibold ${
                      authStatus.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {authStatus.success ? '已認證' : '未認證'}
                    </h3>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    {authStatus.user && (
                      <div>
                        <p><strong>用戶 ID：</strong> {authStatus.user.id}</p>
                        <p><strong>郵箱：</strong> {authStatus.user.email}</p>
                        <p><strong>姓名：</strong> {authStatus.user.full_name}</p>
                      </div>
                    )}
                    
                    {authStatus.error && (
                      <p className="text-red-700"><strong>錯誤：</strong> {authStatus.error}</p>
                    )}
                    
                    <pre className="bg-white p-3 rounded border text-xs overflow-x-auto max-h-40">
                      {JSON.stringify(authStatus, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </HanamiCard>

          {/* Cookie 信息 */}
          <HanamiCard className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CookieIcon className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold text-[#4B4036]">
                Cookie 信息
              </h2>
            </div>

            <div className="space-y-4">
              <HanamiButton
                onClick={getCookies}
                size="lg"
                variant="secondary"
                className="w-full"
              >
                刷新 Cookie 信息
              </HanamiButton>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">當前 Cookie：</h3>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto max-h-40">
                  {cookies || '無 Cookie 信息'}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">關鍵 Cookie：</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• sb-hanamiecho-auth-token</li>
                  <li>• sb-hanamiecho-auth-refresh-token</li>
                  <li>• sb-hanamiecho-auth-token.0</li>
                  <li>• sb-hanamiecho-auth-token.1</li>
                </ul>
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 測試工具 */}
        <HanamiCard className="p-6 mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <BugAntIcon className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-bold text-[#4B4036]">
              測試工具
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <HanamiButton
                onClick={testDashboardAccess}
                size="lg"
                className="w-full"
              >
                測試儀表板訪問
              </HanamiButton>
              
              <HanamiButton
                onClick={() => window.location.href = '/aihome/auth/login'}
                size="lg"
                variant="secondary"
                className="w-full"
              >
                返回登入頁面
              </HanamiButton>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">調試說明</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• 檢查認證狀態是否正確</li>
                <li>• 確認 Cookie 是否包含認證 token</li>
                <li>• 測試儀表板訪問是否被中間件阻止</li>
                <li>• 查看瀏覽器控制台獲取更多信息</li>
              </ul>
            </div>
          </div>
        </HanamiCard>

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


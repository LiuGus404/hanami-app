'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestCookiesPage() {
  const { user, loading } = useSaasAuth();

  const checkCookies = () => {
    console.log('=== Cookie 檢查 ===');
    console.log('所有 cookies:', document.cookie);
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    console.log('解析後的 cookies:', cookies);
    
    // 檢查特定的認證 cookies
    const authToken = cookies['sb-hanamiecho-auth-token'];
    const refreshToken = cookies['sb-hanamiecho-auth-refresh-token'];
    
    console.log('sb-hanamiecho-auth-token:', authToken);
    console.log('sb-hanamiecho-auth-refresh-token:', refreshToken);
    
    return { authToken, refreshToken, cookies };
  };

  const cookieInfo = checkCookies();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">Cookie 測試頁面</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">認證狀態</h2>
          <div className="space-y-2 text-left">
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">載入狀態:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                loading ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {loading.toString()}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">用戶狀態:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user ? '已登入' : '未登入'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">Cookie 狀態</h2>
          <div className="space-y-2 text-left">
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">sb-hanamiecho-auth-token:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                cookieInfo.authToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {cookieInfo.authToken ? '存在' : '不存在'}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">sb-hanamiecho-auth-refresh-token:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                cookieInfo.refreshToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {cookieInfo.refreshToken ? '存在' : '不存在'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">所有 Cookies</h2>
          <div className="text-left text-sm">
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
              {JSON.stringify(cookieInfo.cookies, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試按鈕</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
            >
              重新載入
            </button>
            <button
              onClick={() => window.location.href = '/aihome/dashboard'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              前往儀表板
            </button>
            <button
              onClick={() => window.location.href = '/aihome/auth/login'}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              前往登入頁面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

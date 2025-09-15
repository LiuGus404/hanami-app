'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestSimplePage() {
  const { user, loading } = useSaasAuth();

  console.log('=== 簡單測試頁面 ===');
  console.log('loading:', loading);
  console.log('user:', user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">簡單測試頁面</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">狀態信息</h2>
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
            {user && (
              <div className="text-sm">
                <span className="font-medium text-[#2B3A3B]">用戶ID:</span>
                <span className="ml-2 text-gray-600">{user.id}</span>
              </div>
            )}
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

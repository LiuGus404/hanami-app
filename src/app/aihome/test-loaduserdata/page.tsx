'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestLoadUserDataPage() {
  const { user, loading } = useSaasAuth();

  console.log('TestLoadUserData - loading:', loading, 'user:', user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中... (loading: {loading.toString()})</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#4B4036]">未登入</p>
          <button
            onClick={() => window.location.href = '/aihome/auth/login'}
            className="mt-4 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
          >
            前往登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">loadUserData 測試</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">用戶信息</h2>
          <div className="space-y-2 text-left">
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">載入狀態:</span>
              <span className="ml-2 text-gray-600">{loading.toString()}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">用戶 ID:</span>
              <span className="ml-2 text-gray-600">{user.id}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">郵箱:</span>
              <span className="ml-2 text-gray-600">{user.email}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">暱稱:</span>
              <span className="ml-2 text-gray-600">{user.full_name}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">電話:</span>
              <span className="ml-2 text-gray-600">{user.phone}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">訂閱狀態:</span>
              <span className="ml-2 text-gray-600">{user.subscription_status}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">使用次數:</span>
              <span className="ml-2 text-gray-600">{user.usage_count}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">使用限制:</span>
              <span className="ml-2 text-gray-600">{user.usage_limit}</span>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

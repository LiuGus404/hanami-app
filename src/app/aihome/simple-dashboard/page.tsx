'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function SimpleDashboardPage() {
  const { user, loading } = useSaasAuth();

  console.log('SimpleDashboard - loading:', loading, 'user:', user);

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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-4">簡單儀表板</h1>
        <p className="text-[#2B3A3B] mb-4">歡迎，{user.full_name || user.email}！</p>
        <p className="text-sm text-gray-600 mb-4">
          載入狀態: {loading.toString()}<br/>
          用戶 ID: {user.id}
        </p>
        <button
          onClick={() => window.location.href = '/aihome/dashboard'}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          前往完整儀表板
        </button>
      </div>
    </div>
  );
}

'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestAuthPage() {
  const { user, loading } = useSaasAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">認證狀態測試</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">當前狀態</h2>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">載入狀態:</span>
              <span className="ml-2 text-gray-600">{loading ? '載入中...' : '已完成'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">用戶狀態:</span>
              <span className="ml-2 text-gray-600">{user ? '已登入' : '未登入'}</span>
            </div>
            {user && (
              <>
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
                  <span className="ml-2 text-gray-600">{user.full_name || '未設置'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
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

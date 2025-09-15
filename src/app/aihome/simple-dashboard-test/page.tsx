'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function SimpleDashboardTestPage() {
  const { user, loading } = useSaasAuth();

  console.log('SimpleDashboardTest - loading:', loading, 'user:', user);

  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果未認證，不渲染內容
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#4B4036]">未登入</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 簡化的歡迎區域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#4B4036] mb-6">
            歡迎來到 HanamiEcho AI 智能伙伴平台！
          </h1>
          <p className="text-xl text-[#2B3A3B] max-w-3xl mx-auto">
            我是 LuLu，你的智能伙伴！提供多種AI角色，為你解決問題。
            無論是學習成長還是工作，都是你最貼心的智能伙伴！
          </p>
        </div>

        {/* 簡化的功能區域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-2">AI工作伙伴</h3>
            <p className="text-[#2B3A3B] mb-4">協助撰寫報告、整理資料</p>
            <button className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors">
              開始工作
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-2">學習陪伴</h3>
            <p className="text-[#2B3A3B] mb-4">與老師安排學習路徑</p>
            <button className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors">
              開始學習
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-2">情感支持</h3>
            <p className="text-[#2B3A3B] mb-4">與你互動，給予溫暖陪伴</p>
            <button className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors">
              開始對話
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-2">個性化記憶</h3>
            <p className="text-[#2B3A3B] mb-4">根據需求定制專屬AI角色</p>
            <button className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors">
              開始定制
            </button>
          </div>
        </div>

        {/* 用戶信息 */}
        <div className="mt-16 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-[#4B4036] mb-4">用戶信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-[#2B3A3B]">暱稱:</span>
              <span className="ml-2 text-gray-600">{user.full_name}</span>
            </div>
            <div>
              <span className="font-medium text-[#2B3A3B]">郵箱:</span>
              <span className="ml-2 text-gray-600">{user.email}</span>
            </div>
            <div>
              <span className="font-medium text-[#2B3A3B]">電話:</span>
              <span className="ml-2 text-gray-600">{user.phone}</span>
            </div>
            <div>
              <span className="font-medium text-[#2B3A3B]">訂閱狀態:</span>
              <span className="ml-2 text-gray-600">{user.subscription_status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

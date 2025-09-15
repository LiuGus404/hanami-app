'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useSaasAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 如果未認證，重定向到登入頁面
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login?redirect=/aihome/profile');
    }
  }, [loading, user, router]);


  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD59A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4B4036] text-lg">載入中...</p>
          <p className="text-[#4B4036] text-sm mt-2">Loading: {loading ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

  // 如果未認證，顯示載入狀態
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">正在重定向到登入頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-[#4B4036] hover:bg-[#FFD59A]/20 transition-colors relative z-40"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 flex items-center">
                <img src="/@hanami.png" alt="Hanami" className="h-8 w-8" />
                <h1 className="ml-2 text-xl font-bold text-[#4B4036]">個人資料</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#4B4036]">
                {currentTime.toLocaleTimeString('zh-TW')}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* 側邊欄 */}
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* 主要內容區域 */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full">
            <div className="space-y-6">
              {/* 頁面標題 */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[#4B4036] mb-2">個人資料</h2>
                <p className="text-[#4B4036]/70">管理您的個人信息和偏好設定</p>
              </div>


              {/* 基本資料卡片 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">基本資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">用戶 ID</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] font-mono text-sm">
                      {user?.id || '未設定'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">電子郵件</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                      {user?.email || '未設定'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">電話號碼</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                      {user?.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">🇭🇰</span>
                          <span className="font-mono">{user.phone}</span>
                        </div>
                      ) : '未設定'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">暱稱</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                      {user?.full_name || '未設定'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">頭像 URL</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                      {user?.avatar_url || '未設置'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 訂閱計劃卡片 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">訂閱計劃</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">訂閱狀態</label>
                    <div className={`p-3 rounded-lg border ${
                      user?.subscription_status === 'trial' 
                        ? 'bg-blue-50 border-blue-300 text-blue-800' 
                        : 'bg-[#FFF9F2] border-[#EADBC8]'
                    }`}>
                      {user?.subscription_status === 'trial' ? '試用版' : user?.subscription_status || '未設定'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">計劃開始日期</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                      {user?.subscription_start_date || '未設置'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">計劃結束日期</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                      {user?.subscription_end_date || '未設置'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 使用統計卡片 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">使用統計</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">使用次數</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] text-center">
                      <span className="text-2xl font-bold text-[#4B4036]">{user?.usage_count || 0}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">使用限制</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] text-center">
                      <span className="text-2xl font-bold text-[#4B4036]">{user?.usage_limit || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 驗證信息卡片 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">驗證信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">驗證方式</label>
                    <div className="p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                      {user?.verification_method === 'email' ? '電子郵件' : user?.verification_method || '未設置'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 時間信息卡片 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">時間信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">最後登入</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                      {user?.last_login ? new Date(user.last_login).toLocaleString('zh-TW') : '未記錄'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">帳號創建時間</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                      {user?.created_at ? new Date(user.created_at).toLocaleString('zh-TW') : '未記錄'}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">最後更新時間</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                      {user?.updated_at ? new Date(user.updated_at).toLocaleString('zh-TW') : '未記錄'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 功能按鈕 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">操作</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      // 這裡可以添加編輯個人資料的功能
                      alert('編輯功能開發中...');
                    }}
                    className="px-6 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors font-medium"
                  >
                    編輯資料
                  </button>
                  <button
                    onClick={() => {
                      // 這裡可以添加修改密碼的功能
                      alert('修改密碼功能開發中...');
                    }}
                    className="px-6 py-3 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors font-medium"
                  >
                    修改密碼
                  </button>
                  <button
                    onClick={logout}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    登出
                  </button>
                </div>
              </div>

              {/* 系統信息 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">系統信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-[#4B4036]">當前時間：</span>
                    <span className="text-[#4B4036]/70">{currentTime.toLocaleString('zh-TW')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4B4036]">瀏覽器：</span>
                    <span className="text-[#4B4036]/70">{typeof window !== 'undefined' ? navigator.userAgent.split(' ')[0] : '未知'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

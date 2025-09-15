'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function SettingsPage() {
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
      router.push('/aihome/auth/login?redirect=/aihome/settings');
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
                <h1 className="ml-2 text-xl font-bold text-[#4B4036]">系統設置</h1>
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
                <h2 className="text-3xl font-bold text-[#4B4036] mb-2">系統設置</h2>
                <p className="text-[#4B4036]/70">管理您的系統偏好和設定</p>
              </div>

              {/* 調試信息 */}
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <h3 className="font-bold text-yellow-800 mb-2">調試信息</h3>
                <div className="text-sm text-yellow-700">
                  <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
                  <p><strong>User:</strong> {user ? '存在' : 'null'}</p>
                  <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
                  <p><strong>User Email:</strong> {user?.email || 'N/A'}</p>
                  <p><strong>User Role:</strong> {user?.user_type || 'N/A'}</p>
                </div>
              </div>

              {/* 通知設置 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">通知設置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">電子郵件通知</h4>
                      <p className="text-sm text-[#4B4036]/70">接收重要更新和提醒</p>
                    </div>
                    <button
                      onClick={() => alert('通知設置功能開發中...')}
                      className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                    >
                      啟用
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">課程提醒</h4>
                      <p className="text-sm text-[#4B4036]/70">課程開始前的提醒通知</p>
                    </div>
                    <button
                      onClick={() => alert('課程提醒功能開發中...')}
                      className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                    >
                      啟用
                    </button>
                  </div>
                </div>
              </div>

              {/* 隱私設置 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">隱私設置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">資料分享</h4>
                      <p className="text-sm text-[#4B4036]/70">允許與其他用戶分享學習進度</p>
                    </div>
                    <button
                      onClick={() => alert('隱私設置功能開發中...')}
                      className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
                    >
                      管理
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">數據分析</h4>
                      <p className="text-sm text-[#4B4036]/70">允許系統收集使用數據以改善服務</p>
                    </div>
                    <button
                      onClick={() => alert('數據分析設置功能開發中...')}
                      className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                    >
                      啟用
                    </button>
                  </div>
                </div>
              </div>

              {/* 外觀設置 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">外觀設置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">主題模式</h4>
                      <p className="text-sm text-[#4B4036]/70">選擇您喜歡的界面主題</p>
                    </div>
                    <button
                      onClick={() => alert('主題設置功能開發中...')}
                      className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                    >
                      淺色模式
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">字體大小</h4>
                      <p className="text-sm text-[#4B4036]/70">調整界面文字大小</p>
                    </div>
                    <button
                      onClick={() => alert('字體設置功能開發中...')}
                      className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
                    >
                      中等
                    </button>
                  </div>
                </div>
              </div>

              {/* 安全設置 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">安全設置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">兩步驟驗證</h4>
                      <p className="text-sm text-[#4B4036]/70">為您的帳戶添加額外的安全保護</p>
                    </div>
                    <button
                      onClick={() => alert('兩步驟驗證功能開發中...')}
                      className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
                    >
                      未啟用
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">登入記錄</h4>
                      <p className="text-sm text-[#4B4036]/70">查看最近的登入活動</p>
                    </div>
                    <button
                      onClick={() => alert('登入記錄功能開發中...')}
                      className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                    >
                      查看
                    </button>
                  </div>
                </div>
              </div>

              {/* 帳戶管理 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                <h3 className="text-xl font-bold text-[#4B4036] mb-4">帳戶管理</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">匯出資料</h4>
                      <p className="text-sm text-[#4B4036]/70">下載您的個人資料副本</p>
                    </div>
                    <button
                      onClick={() => alert('資料匯出功能開發中...')}
                      className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                    >
                      匯出
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#4B4036]">刪除帳戶</h4>
                      <p className="text-sm text-[#4B4036]/70">永久刪除您的帳戶和所有資料</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('確定要刪除帳戶嗎？此操作無法復原。')) {
                          alert('帳戶刪除功能開發中...');
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      刪除帳戶
                    </button>
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

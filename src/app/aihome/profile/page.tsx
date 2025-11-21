'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import ChildrenManagement from '@/components/children/ChildrenManagement';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { motion } from 'framer-motion';
import { User, Settings, Users, BarChart3, Shield, Clock, LogOut, Edit3, Key, Bell, Eye, Palette, Lock, Download, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useSaasAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'stats' | 'settings'>('profile');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

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
                <h1 className="ml-2 text-xl font-bold text-[#4B4036]">設定</h1>
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full">
            {/* 頁面標題 */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-4xl font-bold text-[#4B4036] mb-2">設定</h2>
                <p className="text-[#4B4036]/70 text-lg">管理您的個人信息和系統設定</p>
              </motion.div>
            </div>

            {/* 分頁導航 */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-[#EADBC8]/30 rounded-xl p-1">
                {[
                  { key: 'profile', label: '基本資料', icon: User, description: '個人基本資訊管理' },
                  { key: 'children', label: '小朋友管理', icon: Users, description: '管理小朋友資料' },
                  { key: 'stats', label: '使用統計', icon: BarChart3, description: '查看使用情況和統計' },
                  { key: 'settings', label: '系統設定', icon: Settings, description: '系統設定和帳號管理' }
                ].map(({ key, label, icon: Icon, description }) => (
                  <div key={key} className="relative">
                    <motion.button
                      onClick={() => setActiveTab(key as any)}
                      onMouseEnter={() => setShowTooltip(key)}
                      onMouseLeave={() => setShowTooltip(null)}
                      className={`
                        flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                        ${activeTab === key
                          ? 'bg-[#FFD59A] text-[#2B3A3B] shadow-sm'
                          : 'text-[#2B3A3B]/70 hover:text-[#2B3A3B] hover:bg-white/50'
                        }
                        px-2 py-3 sm:px-4
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{label}</span>
                    </motion.button>
                    
                    {/* 工具提示 - 只在小螢幕顯示 */}
                    {showTooltip === key && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#2B3A3B] text-white text-xs rounded-lg shadow-lg z-50 sm:hidden"
                      >
                        <div className="text-center">
                          <div className="font-medium">{label}</div>
                          <div className="text-[#EADBC8] text-xs mt-1">{description}</div>
                        </div>
                        {/* 箭頭 */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#2B3A3B]"></div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 分頁內容 */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 基本資料分頁 */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* 基本資料卡片 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">基本資料</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">用戶 ID</label>
                        <div className="p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] font-mono text-sm">
                          {user?.id || '未設定'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">電子郵件</label>
                        <div className="p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                          {user?.email || '未設定'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">電話號碼</label>
                        <div className="p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                          {user?.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">🇭🇰</span>
                              <span className="font-mono">{user.phone}</span>
                            </div>
                          ) : '未設定'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">暱稱</label>
                        <div className="p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                          {user?.full_name || '未設定'}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">頭像 URL</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                          {user?.avatar_url || '未設置'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 訂閱計劃卡片 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">訂閱計劃</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">訂閱狀態</label>
                        <div className={`p-4 rounded-lg border ${
                          user?.subscription_status === 'trial' 
                            ? 'bg-blue-50 border-blue-300 text-blue-800' 
                            : 'bg-[#FFF9F2] border-[#EADBC8]'
                        }`}>
                          {user?.subscription_status === 'trial' ? '試用版' : user?.subscription_status || '未設定'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">驗證方式</label>
                        <div className="p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                          {user?.verification_method === 'email' ? '電子郵件' : user?.verification_method || '未設置'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">計劃開始日期</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                          {user?.subscription_start_date || '未設置'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">計劃結束日期</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                          {user?.subscription_end_date || '未設置'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 時間信息卡片 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#EBC9A4] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">時間信息</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">最後登入</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                          {user?.last_login ? new Date(user.last_login).toLocaleString('zh-TW') : '未記錄'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">帳號創建時間</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                          {user?.created_at ? new Date(user.created_at).toLocaleString('zh-TW') : '未記錄'}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">最後更新時間</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-[#EADBC8] text-sm">
                          {user?.updated_at ? new Date(user.updated_at).toLocaleString('zh-TW') : '未記錄'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 小朋友管理分頁 */}
              {activeTab === 'children' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                  <ChildrenManagement />
                </div>
              )}

              {/* 使用統計分頁 */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  {/* 使用統計卡片 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">使用統計</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="p-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-xl">
                          <div className="text-4xl font-bold text-[#4B4036] mb-2">{user?.usage_count || 0}</div>
                          <div className="text-[#4B4036]/80 font-medium">使用次數</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="p-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-xl">
                          <div className="text-4xl font-bold text-[#4B4036] mb-2">{user?.usage_limit || 0}</div>
                          <div className="text-[#4B4036]/80 font-medium">使用限制</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 系統信息卡片 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#EBC9A4] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <Settings className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">系統信息</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
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
              )}

              {/* 系統設定分頁 */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* 帳號設定 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <Settings className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">帳號設定</h3>
                    </div>
                    <div className="space-y-4">
                      <motion.button
                        onClick={() => alert('編輯功能開發中...')}
                        className="w-full flex items-center gap-4 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] hover:bg-[#FFD59A]/20 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Edit3 className="w-5 h-5 text-[#4B4036]" />
                        <div className="text-left">
                          <div className="font-medium text-[#4B4036]">編輯個人資料</div>
                          <div className="text-sm text-[#4B4036]/70">修改您的個人信息</div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => alert('修改密碼功能開發中...')}
                        className="w-full flex items-center gap-4 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] hover:bg-[#FFD59A]/20 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Key className="w-5 h-5 text-[#4B4036]" />
                        <div className="text-left">
                          <div className="font-medium text-[#4B4036]">修改密碼</div>
                          <div className="text-sm text-[#4B4036]/70">更改您的登入密碼</div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        onClick={logout}
                        className="w-full flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogOut className="w-5 h-5 text-red-600" />
                        <div className="text-left">
                          <div className="font-medium text-red-600">登出帳號</div>
                          <div className="text-sm text-red-500">安全退出您的帳號</div>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* 通知設置 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <Bell className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">通知設置</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">電子郵件通知</h4>
                          <p className="text-sm text-[#4B4036]/70">接收重要更新和提醒</p>
                        </div>
                        <motion.button
                          onClick={() => alert('通知設置功能開發中...')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          啟用
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">課程提醒</h4>
                          <p className="text-sm text-[#4B4036]/70">課程開始前的提醒通知</p>
                        </div>
                        <motion.button
                          onClick={() => alert('課程提醒功能開發中...')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          啟用
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* 隱私設置 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#EBC9A4] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">隱私設置</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">資料分享</h4>
                          <p className="text-sm text-[#4B4036]/70">允許與其他用戶分享學習進度</p>
                        </div>
                        <motion.button
                          onClick={() => alert('隱私設置功能開發中...')}
                          className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          管理
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">數據分析</h4>
                          <p className="text-sm text-[#4B4036]/70">允許系統收集使用數據以改善服務</p>
                        </div>
                        <motion.button
                          onClick={() => alert('數據分析設置功能開發中...')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          啟用
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* 外觀設置 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <Palette className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">外觀設置</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">主題模式</h4>
                          <p className="text-sm text-[#4B4036]/70">選擇您喜歡的界面主題</p>
                        </div>
                        <motion.button
                          onClick={() => alert('主題設置功能開發中...')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          淺色模式
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">字體大小</h4>
                          <p className="text-sm text-[#4B4036]/70">調整界面文字大小</p>
                        </div>
                        <motion.button
                          onClick={() => alert('字體設置功能開發中...')}
                          className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          中等
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* 安全設置 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-[#4B4036]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#4B4036]">安全設置</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">兩步驟驗證</h4>
                          <p className="text-sm text-[#4B4036]/70">為您的帳戶添加額外的安全保護</p>
                        </div>
                        <motion.button
                          onClick={() => alert('兩步驟驗證功能開發中...')}
                          className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          未啟用
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#4B4036]">登入記錄</h4>
                          <p className="text-sm text-[#4B4036]/70">查看最近的登入活動</p>
                        </div>
                        <motion.button
                          onClick={() => alert('登入記錄功能開發中...')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          查看
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

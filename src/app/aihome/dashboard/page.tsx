'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  MusicalNoteIcon,
  PaintBrushIcon,

  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CogIcon,
  HomeIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import LuLuCharacterWithBubble from '@/components/3d/LuLuCharacterWithBubble';
import AppSidebar from '@/components/AppSidebar';
import UnifiedNavbar from '@/components/UnifiedNavbar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const activeView = 'dashboard';
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 更新時間
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使登出失敗，也導航到登入頁面
      router.push('/aihome/auth/login');
    }
  };

  // 認證保護
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login');
    }
  }, [user, loading, router]);

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
    return null;
  }

  // 獲取問候語
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 核心 AI 功能
  const coreAIFeatures = [
    {
      icon: SparklesIcon,
      title: 'AI工作伙伴',
      description: '讓AI解決你工作/日常/教學的問題',
      color: 'bg-orange-500',
      href: '/aihome/ai-companions'
    },
    {
      icon: AcademicCapIcon,
      title: '學習陪伴',
      description: '與老師安排學習路徑，陪伴您/孩子學習和成長',
      color: 'bg-orange-500',
      href: '/aihome/course-activities'
    },
    {
      icon: HeartIcon,
      title: '情感支持',
      description: '與你互動，給予溫暖的陪伴與溝通',
      color: 'bg-orange-500',
      href: '/aihome/emotional-support'
    },
    {
      icon: UserGroupIcon,
      title: '個性化記憶和體驗',
      description: '根據您的需求定制專屬AI角色',
      color: 'bg-orange-500',
      href: '/aihome/memory-bank'
    }
  ];


  // 快速導航
  const quickNav = [
    { icon: HomeIcon, label: '首頁', href: '/aihome' },
    { icon: SparklesIcon, label: 'AI夥伴', href: '/aihome/ai-companions' },
    { icon: UsersIcon, label: '家長連結', href: '/aihome/parent/bound-students' },
    { icon: UserIcon, label: '設定', href: '/aihome/profile' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄選單 */}
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome"
        />

        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col">
          <UnifiedNavbar
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            user={user}
            onLogout={handleLogout}
            onLogin={() => router.push('/aihome/auth/login')}
            onRegister={() => router.push('/aihome/auth/register')}
            customRightContent={<UnifiedRightContent user={user} onLogout={handleLogout} />}
          />

          {/* 主內容區域 */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full">
            {/* 歡迎區域 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-[#4B4036] mb-6">
                歡迎來到 HanamiEcho
              </h1>

              <div className="mb-8">
                <div className="w-96 h-96 mx-auto flex items-center justify-center relative">
                  <LuLuCharacterWithBubble
                    size="xxl"
                    enableInteractions={true}
                    className="drop-shadow-lg"
                  />
                </div>
              </div>

              {/* AI 對話框 - 暫時隱藏，之後開通 */}
              {/* 
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#4B4036]">AI</span>
                </div>
                <h3 className="text-lg font-semibold text-[#4B4036]">與 HanamiEcho 對話</h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="你好，有什麼可以幫到你？"
                    className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50 text-[#4B4036] placeholder-[#2B3A3B]"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200">
                    <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 bg-[#FFD59A]/20 text-[#4B4036] rounded-lg text-sm hover:bg-[#FFD59A]/30 transition-colors">
                    ✍️ 寫作助手
                  </button>
                  <button className="px-3 py-2 bg-[#FFD59A]/20 text-[#4B4036] rounded-lg text-sm hover:bg-[#FFD59A]/30 transition-colors">
                    📚 學習輔導
                  </button>
                  <button className="px-3 py-2 bg-[#FFD59A]/20 text-[#4B4036] rounded-lg text-sm hover:bg-[#FFD59A]/30 transition-colors">
                    💡 創意靈感
                  </button>
                  <button className="px-3 py-2 bg-[#FFD59A]/20 text-[#4B4036] rounded-lg text-sm hover:bg-[#FFD59A]/30 transition-colors">
                    🎯 生活建議
                  </button>
                </div>
              </div>
            </div>
          </div>
          */}

              <p className="text-xl text-[#2B3A3B] max-w-3xl mx-auto mb-6">
                提供多種AI角色，為你解決問題。無論是學習成長還是工作，都是你最貼心的智能伙伴！
              </p>
              <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                您的智能AI助手，為兒童和成人提供個性化的協作體驗和情感支持
              </p>
            </motion.div>

            {/* 快速導航 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex justify-center space-x-2 sm:space-x-4">
                {quickNav.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(item.href)}
                    className="flex items-center space-x-2 px-2 sm:px-4 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-[#EADBC8] hover:bg-white/80 transition-all duration-200"
                  >
                    <item.icon className="w-5 h-5 text-[#4B4036]" />
                    <span className="hidden sm:inline text-[#4B4036] font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>


            {/* 核心 AI 功能 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mb-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {coreAIFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.55 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className="bg-white rounded-xl p-6 h-full text-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border border-[#EADBC8]"
                      onClick={() => router.push(feature.href)}
                    >
                      <div
                        className={`w-16 h-16 mx-auto mb-4 ${feature.color} rounded-full flex items-center justify-center`}
                      >
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#4B4036] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-[#2B3A3B] text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 行動呼籲 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-16"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[#4B4036] mb-4">
                  準備開始 HanamiEcho 智能伙伴之旅？
                </h2>
                <p className="text-lg text-[#2B3A3B] mb-8">
                  立即開始使用，體驗AI智能伙伴的魅力
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/aihome/ai-companions')}
                  className="inline-flex items-center px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-orange-600 transition-all duration-200"
                >
                  開始使用
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
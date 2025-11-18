'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  HeartIcon,
  ArrowRightIcon,
  PlayIcon,
  Bars3Icon,
  Cog6ToothIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import LuLuCharacterWithBubble from '@/components/3d/LuLuCharacterWithBubble';
import AppSidebar from '@/components/AppSidebar';

export default function AIHomePage() {
  const { user: saasUser, loading } = useSaasAuth();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 處理登入按鈕點擊
  const handleLoginClick = () => {
    console.log('登入按鈕被點擊，當前用戶狀態:', { user: !!saasUser, loading });
    
    if (saasUser) {
      // 用戶已登入，直接跳轉到儀表板
      console.log('🎯 用戶已登入，直接跳轉到儀表板');
      router.push('/aihome/dashboard');
    } else {
      // 用戶未登入，跳轉到登入頁面
      console.log('🔐 用戶未登入，跳轉到登入頁面');
      router.push('/aihome/auth/login?redirect=/aihome/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPath="/aihome"
      />
      
      {/* 頂部導航欄 - 參考 ai-companions 設計 */}
      <nav className="bg-transparent border-b border-[#EADBC8]/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                title={sidebarOpen ? "關閉選單" : "開啟選單"}
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="min-w-0 flex-1">
                {/* 桌面版：顯示完整標題 */}
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                  <p className="text-sm text-[#2B3A3B]">兒童與成人的智能夥伴</p>
                </div>
                
                {/* 移動端：只顯示標題 */}
                <div className="block sm:hidden">
                  <h1 className="text-lg font-bold text-[#4B4036]">
                    HanamiEcho
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 桌面版：顯示完整的導航按鈕 */}
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={() => router.push('/aihome/course-activities')}
                  className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors font-medium"
                >
                  探索課程
                </button>
                {saasUser ? (
                  <>
                    <button
                      onClick={() => router.push('/aihome/dashboard')}
                      className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors font-medium"
                    >
                      管理面板
                    </button>
                    <button
                      onClick={() => router.push('/aihome/subscription')}
                      className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors font-medium"
                    >
                      訂閱管理
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLoginClick}
                      className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors font-medium"
                    >
                      登入
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/aihome/auth/register')}
                      className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      開始使用
                    </motion.button>
                  </>
                )}
              </div>

              {/* 移動端：齒輪圖標按鈕 + 下拉選單 */}
              <div className="flex md:hidden items-center space-x-2 relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                >
                  <Cog6ToothIcon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
                
                {/* 下拉選單 */}
                <AnimatePresence>
                  {showMobileMenu && (
                    <>
                      {/* 背景遮罩 */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setShowMobileMenu(false)}
                      />
                      
                      {/* 選單內容 */}
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#EADBC8] z-50 overflow-hidden"
                      >
                        <div className="py-2">
                          <button
                            onClick={() => {
                              router.push('/aihome/course-activities');
                              setShowMobileMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-[#4B4036] hover:bg-[#FFD59A]/20 transition-colors flex items-center space-x-2"
                          >
                            <AcademicCapIcon className="w-5 h-5" />
                            <span>探索課程</span>
                          </button>
                          
                          {saasUser ? (
                            <>
                              <button
                                onClick={() => {
                                  router.push('/aihome/dashboard');
                                  setShowMobileMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[#4B4036] hover:bg-[#FFD59A]/20 transition-colors flex items-center space-x-2"
                              >
                                <SparklesIcon className="w-5 h-5" />
                                <span>管理面板</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  router.push('/aihome/subscription');
                                  setShowMobileMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[#4B4036] hover:bg-[#FFD59A]/20 transition-colors flex items-center space-x-2"
                              >
                                <HeartIcon className="w-5 h-5" />
                                <span>訂閱管理</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  handleLoginClick();
                                  setShowMobileMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[#4B4036] hover:bg-[#FFD59A]/20 transition-colors flex items-center space-x-2"
                              >
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span>登入</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  router.push('/aihome/auth/register');
                                  setShowMobileMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[#4B4036] hover:bg-[#FFD59A]/20 transition-colors flex items-center space-x-2"
                              >
                                <UserPlusIcon className="w-5 h-5" />
                                <span>註冊</span>
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="relative">
        {/* 英雄區域 */}
        <section className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* 左側：文字內容 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-5xl md:text-6xl font-bold text-[#4B4036] mb-6">
                  歡迎來到
                  <span className="text-[#FFD59A] block">HanamiEcho</span>
                </h1>
                <p className="text-xl text-[#2B3A3B] mb-8 max-w-2xl">
                  您的智能 AI 助手，您和孩子專屬的學習和工作夥伴
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  {saasUser ? (
                    <HanamiButton
                      onClick={() => router.push('/aihome/dashboard')}
                      size="lg"
                      className="text-lg px-8 py-4"
                    >
                      開始您的旅程
                      <ArrowRightIcon className="w-6 h-6 ml-2" />
                    </HanamiButton>
                  ) : (
                    <>
                      <HanamiButton
                        onClick={() => router.push('/aihome/auth/register')}
                        size="lg"
                        className="text-lg px-8 py-4"
                      >
                        開始免費體驗
                        <PlayIcon className="w-6 h-6 ml-2" />
                      </HanamiButton>
                      <HanamiButton
                        onClick={() => router.push('/aihome/pricing')}
                        variant="secondary"
                        size="lg"
                        className="text-lg px-8 py-4"
                      >
                        查看方案
                      </HanamiButton>
                    </>
                  )}
                </div>
              </motion.div>
              
              {/* 右側：LuLu 增強版角色 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative h-96 lg:h-[500px] flex items-center justify-center"
              >
                <LuLuCharacterWithBubble 
                  size="xxl" 
                  enableInteractions={true}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 功能特色 */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#4B4036] mb-4">
                為什麼選擇 HanamiEcho？
              </h2>
              <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                提供多種AI角色，為你解決問題。無論是學習成長還是工作，都是你最貼心的智能伙伴
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: SparklesIcon,
                  title: 'AI工作伙伴',
                  description: '讓AI解決你工作/日常/教學的問題'
                },
                {
                  icon: AcademicCapIcon,
                  title: '學習陪伴',
                  description: '與老師安排學習路徑，陪伴您/孩子學習和成長'
                },
                {
                  icon: HeartIcon,
                  title: '情感支持',
                  description: '與你互動，給予溫暖的陪伴與溝通'
                },
                {
                  icon: UserGroupIcon,
                  title: '個性化記憶和體驗',
                  description: '根據您的需求定制專屬AI角色'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                >
                  <HanamiCard className="p-6 text-center h-full">
                    <div className="w-16 h-16 bg-[#FFD59A] rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-[#2B3A3B]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#4B4036] mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-[#2B3A3B]">
                      {feature.description}
                    </p>
                  </HanamiCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA 區域 */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#4B4036] mb-6">
                準備開始 HanamiEcho 智能伙伴之旅？
              </h2>
              <p className="text-lg text-[#2B3A3B] mb-8">
                立即開始使用，體驗AI智能伙伴的魅力
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <HanamiButton
                  onClick={() => router.push('/aihome/dashboard')}
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  開始使用
                  <ArrowRightIcon className="w-6 h-6 ml-2" />
                </HanamiButton>
                {!saasUser && (
                  <HanamiButton
                    onClick={() => router.push('/aihome/auth/register')}
                    variant="secondary"
                    size="lg"
                    className="text-lg px-8 py-4"
                  >
                    免費註冊
                  </HanamiButton>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

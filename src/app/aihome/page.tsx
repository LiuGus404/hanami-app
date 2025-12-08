'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  HeartIcon,
  ArrowRightIcon,
  PlayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import LuLuCharacterWithBubble from '@/components/3d/LuLuCharacterWithBubble';
import AppSidebar from '@/components/AppSidebar';
import UnifiedNavbar from '@/components/UnifiedNavbar';

export default function AIHomePage() {
  const { user: saasUser, loading } = useSaasAuth();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'news' | 'activities'>('news');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

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

  const handleLogout = () => {
    window.location.href = '/aihome/logout';
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

      <UnifiedNavbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        user={saasUser}
        onLogout={handleLogout}
        onLogin={handleLoginClick}
        onRegister={() => router.push('/aihome/auth/register')}
        customRightContent={<UnifiedRightContent user={saasUser} onLogout={handleLogout} />}
      />

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

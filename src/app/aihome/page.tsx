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
  PlayIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function AIHomePage() {
  const { user, loading } = useSaasAuth();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
    <div className="min-h-screen">
      {/* 導航欄 */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <HanamiEchoLogo size="lg" />
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/aihome/dashboard')}
                  className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                >
                  儀表板
                </button>
                <button
                  onClick={() => router.push('/aihome/subscription')}
                  className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                >
                  訂閱管理
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/aihome/auth/login')}
                  className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                >
                  登入
                </button>
                <button
                  onClick={() => router.push('/aihome/auth/register')}
                  className="bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#2B3A3B] px-6 py-2 rounded-full font-medium transition-colors"
                >
                  開始使用
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="relative">
        {/* 英雄區域 */}
        <section className="relative px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-[#4B4036] mb-6">
              歡迎來到
              <span className="text-[#FFD59A] block">AIHome</span>
            </h1>
            <p className="text-xl text-[#2B3A3B] mb-8 max-w-2xl mx-auto">
              您的智能家庭助手，為孩子提供個性化的學習體驗和情感支持
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <HanamiButton
                  onClick={() => router.push('/aihome/dashboard')}
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  進入儀表板
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
                為什麼選擇 AIHome？
              </h2>
              <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                我們提供全方位的智能教育解決方案，讓每個孩子都能享受個性化的學習體驗
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: SparklesIcon,
                  title: 'AI 智能助手',
                  description: '個性化的 AI 角色，陪伴孩子成長'
                },
                {
                  icon: AcademicCapIcon,
                  title: '學習路徑',
                  description: '根據孩子特點定制的學習計劃'
                },
                {
                  icon: HeartIcon,
                  title: '情感支持',
                  description: '理解孩子情緒，提供溫暖陪伴'
                },
                {
                  icon: UserGroupIcon,
                  title: '家庭協作',
                  description: '連接家庭成員，共同參與教育'
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
                準備開始您的 AIHome 之旅？
              </h2>
              <p className="text-lg text-[#2B3A3B] mb-8">
                立即註冊，體驗智能教育的魅力
              </p>
              
              {!user && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <HanamiButton
                    onClick={() => router.push('/aihome/auth/register')}
                    size="lg"
                    className="text-lg px-8 py-4"
                  >
                    免費註冊
                    <ArrowRightIcon className="w-6 h-6 ml-2" />
                  </HanamiButton>
                  <HanamiButton
                    onClick={() => router.push('/aihome/pricing')}
                    variant="secondary"
                    size="lg"
                    className="text-lg px-8 py-4"
                  >
                    查看定價
                  </HanamiButton>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

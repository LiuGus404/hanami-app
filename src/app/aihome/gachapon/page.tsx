'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  GiftIcon,
  SparklesIcon,
  XMarkIcon,
  TrophyIcon,
  StarIcon,
  HeartIcon,
  MusicalNoteIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';

export default function GachaponPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSaasAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 暫時顯示「暫未啟用」訊息
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ 
        backgroundImage: 'url(/HanamiMusic/nunu/nunucalssroom.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 返回按鈕 */}
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-5 h-5 text-[#4B4036]" />
                <span className="text-sm font-medium text-[#4B4036] hidden sm:inline">返回</span>
              </motion.button>
              
              {/* 選單按鈕 */}
              {user && (
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                  title="開啟選單"
                >
                  <HomeIcon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
              )}
              
              <div className="w-10 h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="Hanami Music Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">VIP 扭蛋機</h1>
                <p className="text-sm text-[#2B3A3B]">幸運抽獎</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </>
              ) : (
                <motion.button
                  onClick={() => router.push('/aihome/auth/login')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-all duration-200"
                >
                  登入
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <div className="flex-1 flex">
        {/* 側邊欄選單 */}
        {user && (
          <AppSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentPath="/aihome/gachapon"
          />
        )}

        {/* 暫未啟用訊息 */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-[#FFD59A]/30 max-w-lg mx-4 text-center relative overflow-hidden"
          >
            {/* 光澤動畫效果 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            <div className="relative z-10">
              {/* 圖標 */}
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 bg-gradient-to-br from-[#FFD59A] via-[#FFB6C1] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <GiftIcon className="w-12 h-12 text-white" />
              </motion.div>

              {/* 標題 */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] bg-clip-text text-transparent mb-4"
              >
                暫未啟用
              </motion.h2>

              {/* 說明文字 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#2B3A3B]/70 mb-8 leading-relaxed"
              >
                扭蛋機功能目前正在準備中，<br/>
                敬請期待！
              </motion.p>

              {/* 返回按鈕 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => router.back()}
                whileHover={{ 
                  scale: 1.05, 
                  y: -3,
                  boxShadow: '0 20px 40px rgba(255,213,154,0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-8 py-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-center space-x-2">
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>返回上一頁</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

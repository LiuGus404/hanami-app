'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  TrophyIcon,
  SparklesIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  HeartIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  StarIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';

export default function HanamiMusicDetailPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    }
  };

  // 認證保護
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login');
    }
  }, [user, loading, router]);

  // 機構特色
  const features = [
    {
      icon: TrophyIcon,
      title: '連續獲獎',
      description: '2022-2024連續獲得優秀教育機構及導師獎',
      color: 'from-yellow-400 to-orange-400'
    },
    {
      icon: SparklesIcon,
      title: '科學教學',
      description: '以最有趣活潑又科學的音樂教學助孩子成長發展',
      color: 'from-blue-400 to-cyan-400'
    },
    {
      icon: MusicalNoteIcon,
      title: '非傳統教學法',
      description: '孩子絕對會學上癮的非傳統音樂鋼琴教學法',
      color: 'from-purple-400 to-pink-400'
    },
    {
      icon: HeartIcon,
      title: '讓音樂萌芽',
      description: '讓音樂在孩子心中萌芽，從15個月起開始音樂之旅',
      color: 'from-green-400 to-emerald-400'
    },
    {
      icon: AcademicCapIcon,
      title: '專業團隊',
      description: '8年資深幼師、一級榮譽特殊幼師、奧福音樂導師精心設計',
      color: 'from-indigo-400 to-blue-400'
    }
  ];

  // 優惠方案
  const promotions = [
    {
      id: 'trial-special',
      title: '試堂優惠',
      subtitle: '首次體驗特價',
      price: '免費',
      originalPrice: 'HK$300',
      features: [
        '45分鐘體驗課程',
        '專業導師一對一評估',
        '個性化學習計劃建議',
        '免費音樂啟蒙教材'
      ],
      badge: '限時優惠',
      badgeColor: 'bg-red-500',
      action: 'trial'
    },
    {
      id: 'new-student',
      title: '新生報名優惠',
      subtitle: '立即享受折扣',
      price: 'HK$2,880',
      originalPrice: 'HK$3,600',
      features: [
        '8堂常規課程',
        '免費贈送課程教材',
        '家長觀課指導',
        '學習進度報告',
        '免費補課一次'
      ],
      badge: '最受歡迎',
      badgeColor: 'bg-green-500',
      action: 'register'
    },
    {
      id: 'renewal',
      title: '續堂優惠',
      subtitle: '舊生專享',
      price: 'HK$3,200',
      originalPrice: 'HK$3,600',
      features: [
        '8堂常規課程',
        '優先選擇上課時段',
        '免費補課兩次',
        '年度音樂會表演機會'
      ],
      badge: '舊生專享',
      badgeColor: 'bg-blue-500',
      action: 'renew'
    }
  ];

  // 可選時段
  const availableSlots = [
    { day: '星期一', time: '10:00-10:45', available: 3 },
    { day: '星期一', time: '15:00-15:45', available: 2 },
    { day: '星期三', time: '10:00-10:45', available: 4 },
    { day: '星期三', time: '16:00-16:45', available: 1 },
    { day: '星期五', time: '10:00-10:45', available: 3 },
    { day: '星期六', time: '09:00-09:45', available: 2 },
    { day: '星期六', time: '11:00-11:45', available: 5 },
    { day: '星期日', time: '10:00-10:45', available: 3 }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex flex-col">
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
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>

              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="開啟選單"
              >
                <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-10 h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="Hanami Music Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">Hanami Music 花見音樂</h1>
                <p className="text-sm text-[#2B3A3B]">課程詳情</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#2B3A3B]">
                {currentTime.toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-[#4B4036]">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                title="登出"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">登出</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <div className="flex-1 flex">
        {/* 側邊欄選單 */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/course-activities/hanami-music"
        />

        {/* 主內容 */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* 頁面標題 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/@hanami.png" 
                  alt="Hanami Music" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
                Hanami Music 花見音樂
              </h1>
              <p className="text-xl text-[#2B3A3B] max-w-3xl mx-auto mb-6">
                讓音樂在孩子心中萌芽 🌱
              </p>
              
              {/* 報名按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/aihome/course-activities/hanami-music/register')}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-2xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <ClipboardDocumentCheckIcon className="w-7 h-7" />
                <span>立即報名</span>
              </motion.button>
            </motion.div>

            {/* 機構特色 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">為什麼選擇我們</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#4B4036] mb-2">{feature.title}</h3>
                    <p className="text-[#2B3A3B] leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 優惠方案 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">優惠方案</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotions.map((promo, index) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -8 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* 徽章 */}
                    <div className={`absolute top-4 right-4 ${promo.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      {promo.badge}
                    </div>

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-1">{promo.title}</h3>
                      <p className="text-sm text-[#2B3A3B]">{promo.subtitle}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-[#4B4036]">{promo.price}</span>
                        {promo.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">{promo.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {promo.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-[#2B3A3B]">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAction(promo.action)}
                      className="w-full py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                    >
                      {promo.action === 'trial' && '預約試堂'}
                      {promo.action === 'register' && '立即報名'}
                      {promo.action === 'renew' && '續堂報名'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 可選時段 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">可選時段</h2>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {availableSlots.map((slot, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.5, delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        slot.available > 0
                          ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 hover:shadow-md'
                          : 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <CalendarDaysIcon className="w-5 h-5 text-[#4B4036]" />
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          slot.available > 3 
                            ? 'bg-green-100 text-green-800'
                            : slot.available > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {slot.available > 0 ? `剩 ${slot.available} 位` : '已滿'}
                        </span>
                      </div>
                      <p className="font-semibold text-[#4B4036]">{slot.day}</p>
                      <p className="text-sm text-[#2B3A3B] flex items-center mt-1">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {slot.time}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 留位提示 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-2xl p-8 shadow-lg">
                <HeartIcon className="w-12 h-12 text-[#4B4036] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#4B4036] mb-4">
                  想為孩子預留位置？
                </h3>
                <p className="text-[#2B3A3B] mb-6">
                  名額有限，立即聯絡我們為您的孩子預留學位
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAction('reserve')}
                    className="px-8 py-4 bg-white text-[#4B4036] rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    留位
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = 'tel:+85212345678'}
                    className="px-8 py-4 bg-[#4B4036] text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    立即致電
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 操作彈窗 */}
      <AnimatePresence>
        {selectedAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-[#4B4036]" />
                </div>
                <h3 className="text-2xl font-bold text-[#4B4036] mb-4">
                  {selectedAction === 'trial' && '預約試堂'}
                  {selectedAction === 'register' && '立即報名'}
                  {selectedAction === 'renew' && '續堂報名'}
                  {selectedAction === 'reserve' && '預留學位'}
                </h3>
                <p className="text-[#2B3A3B] mb-6">
                  我們的客服團隊會盡快與您聯絡，確認詳細安排
                </p>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = 'https://wa.me/85212345678'}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    WhatsApp 聯絡
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = 'tel:+85212345678'}
                    className="w-full py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    電話聯絡
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAction(null)}
                    className="w-full py-3 bg-gray-100 text-[#4B4036] rounded-xl font-semibold transition-all duration-200"
                  >
                    關閉
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


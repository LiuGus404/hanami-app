'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  StarIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  PlayIcon,
  HeartIcon,
  MusicalNoteIcon,
  GiftIcon,
  SparklesIcon,
  TrophyIcon,
  CheckCircleIcon,
  BookOpenIcon,
  UserCircleIcon,
  ShareIcon,
  VideoCameraIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { supabase } from '@/lib/supabase';
import AppSidebar from '@/components/AppSidebar';

export default function MusicFocusClassPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayedPhotos, setDisplayedPhotos] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [courseTypesById, setCourseTypesById] = useState<Record<string, any>>({});

  // 處理展開/收起
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 課堂照片列表
  const classPhotos = [
    '/HanamiMusic/classphoto/IMG_7936.jpeg',
    '/HanamiMusic/classphoto/IMG_7288.jpeg',
    '/HanamiMusic/classphoto/IMG_6308.jpeg',
    '/HanamiMusic/classphoto/IMG_2927.jpeg',
    '/HanamiMusic/classphoto/IMG_9072.jpeg',
    '/HanamiMusic/classphoto/IMG_9071.jpeg',
    '/HanamiMusic/classphoto/IMG_9070.jpeg',
    '/HanamiMusic/classphoto/IMG_9042.jpeg',
    '/HanamiMusic/classphoto/IMG_9024.jpeg',
    '/HanamiMusic/classphoto/IMG_8984.jpeg',
    '/HanamiMusic/classphoto/IMG_8907.jpeg',
    '/HanamiMusic/classphoto/IMG_8895.jpeg',
    '/HanamiMusic/classphoto/IMG_8893.jpeg',
    '/HanamiMusic/classphoto/IMG_8886.jpeg',
    '/HanamiMusic/classphoto/IMG_8593.jpeg',
    '/HanamiMusic/classphoto/IMG_8388.jpeg',
    '/HanamiMusic/classphoto/IMG_8213.jpeg',
    '/HanamiMusic/classphoto/IMG_8032.jpeg',
    '/HanamiMusic/classphoto/IMG_8028.jpeg',
    '/HanamiMusic/classphoto/IMG_7387.jpeg',
    '/HanamiMusic/classphoto/IMG_6837 2.jpeg',
    '/HanamiMusic/classphoto/IMG_7379.jpeg',
    '/HanamiMusic/classphoto/IMG_6773 2.jpeg',
    '/HanamiMusic/classphoto/IMG_7374.jpeg',
    '/HanamiMusic/classphoto/IMG_6646 2.jpeg',
    '/HanamiMusic/classphoto/IMG_7269.jpeg',
    '/HanamiMusic/classphoto/IMG_6643 2.jpeg',
    '/HanamiMusic/classphoto/IMG_7003.jpeg',
    '/HanamiMusic/classphoto/IMG_6972.jpeg',
    '/HanamiMusic/classphoto/IMG_6566 2.jpeg',
    '/HanamiMusic/classphoto/IMG_6622.jpeg',
    '/HanamiMusic/classphoto/IMG_6546.jpeg',
    '/HanamiMusic/classphoto/IMG_6538.jpeg',
    '/HanamiMusic/classphoto/IMG_6521.jpeg',
    '/HanamiMusic/classphoto/IMG_6519.jpeg',
    '/HanamiMusic/classphoto/IMG_6504.jpeg',
    '/HanamiMusic/classphoto/IMG_6499.jpeg',
    '/HanamiMusic/classphoto/IMG_6479.jpeg',
    '/HanamiMusic/classphoto/IMG_6422 2.jpeg',
    '/HanamiMusic/classphoto/IMG_6253.jpeg',
    '/HanamiMusic/classphoto/IMG_5998.jpeg',
    '/HanamiMusic/classphoto/IMG_3902.jpeg',
    '/HanamiMusic/classphoto/IMG_2874.jpeg',
    '/HanamiMusic/classphoto/IMG_2856.jpeg',
    '/HanamiMusic/classphoto/IMG_2852.jpeg',
    '/HanamiMusic/classphoto/IMG_2851.jpeg',
    '/HanamiMusic/classphoto/IMG_2844.jpeg',
    '/HanamiMusic/classphoto/IMG_2752.jpeg',
    '/HanamiMusic/classphoto/IMG_2742.jpeg',
    '/HanamiMusic/classphoto/IMG_2733.jpeg',
    '/HanamiMusic/classphoto/IMG_2648.jpeg',
    '/HanamiMusic/classphoto/IMG_2646.jpeg',
    '/HanamiMusic/classphoto/IMG_2632.jpeg',
    '/HanamiMusic/classphoto/IMG_2631.jpeg',
    '/HanamiMusic/classphoto/IMG_2618.jpeg',
    '/HanamiMusic/classphoto/8bd39b7d-ac3a-47f9-8b6b-1c987f9b4fa7.jpg',
    '/HanamiMusic/classphoto/7e4feb45-e9aa-46a5-9cfd-241088ec98ef.jpg',
    '/HanamiMusic/classphoto/IMG_2596.jpeg',
    '/HanamiMusic/classphoto/IMG_2389.jpeg',
    '/HanamiMusic/classphoto/IMG_2363.jpeg',
    '/HanamiMusic/classphoto/IMG_2124.jpeg',
    '/HanamiMusic/classphoto/IMG_2101.jpeg',
    '/HanamiMusic/classphoto/dcc57fd4-15f4-467c-a15b-93ff9ee88a38.jpg',
    '/HanamiMusic/classphoto/IMG_9304.jpeg',
    '/HanamiMusic/classphoto/IMG_9251.jpeg',
    '/HanamiMusic/classphoto/ad9a64c8-c4aa-48dc-859c-94902e455cca.jpg',
    '/HanamiMusic/classphoto/IMG_9090.jpeg',
    '/HanamiMusic/classphoto/IMG_9063.jpeg',
    '/HanamiMusic/classphoto/IMG_9046.jpeg',
    '/HanamiMusic/classphoto/IMG_8978.jpeg',
    '/HanamiMusic/classphoto/IMG_8738.jpeg',
    '/HanamiMusic/classphoto/IMG_8418.jpeg',
    '/HanamiMusic/classphoto/088bd39d-4ac1-421c-8da2-b6ff9d069e8c.jpg',
    '/HanamiMusic/classphoto/IMG_8310.jpeg',
    '/HanamiMusic/classphoto/IMG_8022.jpeg',
    '/HanamiMusic/classphoto/d27ed887-f6e3-4eab-8895-d7236e99d94d.jpg',
    '/HanamiMusic/classphoto/IMG_7420.jpeg',
    '/HanamiMusic/classphoto/IMG_7224.jpeg',
    '/HanamiMusic/classphoto/IMG_5494.jpeg',
    '/HanamiMusic/classphoto/IMG_5464.jpeg',
    '/HanamiMusic/classphoto/749a99d5-0321-4bd6-8eb6-117fd98c7425.jpg',
    '/HanamiMusic/classphoto/IMG_5845.jpeg',
    '/HanamiMusic/classphoto/982ee696-3549-4770-a938-1c957aa9d225.jpg',
    '/HanamiMusic/classphoto/e24001fe-93ee-4f06-a33f-948d07842d0a.jpg',
    '/HanamiMusic/classphoto/65849112-f966-44e9-a31a-22140e8b2ef5.jpg',
    '/HanamiMusic/classphoto/IMG_8932.jpeg',
    '/HanamiMusic/classphoto/IMG_8854.jpeg',
    '/HanamiMusic/classphoto/IMG_8829.jpeg',
    '/HanamiMusic/classphoto/IMG_8640.jpeg',
    '/HanamiMusic/classphoto/IMG_8281.jpeg',
    '/HanamiMusic/classphoto/IMG_8233.jpeg',
    '/HanamiMusic/classphoto/IMG_8034.jpeg',
    '/HanamiMusic/classphoto/IMG_7957.jpeg',
    '/HanamiMusic/classphoto/IMG_7899.jpeg',
    '/HanamiMusic/classphoto/IMG_7771.jpeg',
    '/HanamiMusic/classphoto/IMG_7518.jpeg',
    '/HanamiMusic/classphoto/IMG_7342.jpeg',
    '/HanamiMusic/classphoto/IMG_6252.jpeg',
    '/HanamiMusic/classphoto/IMG_7297.jpeg',
    '/HanamiMusic/classphoto/776ac3d0-25c7-4312-a863-a244e3f0a212.jpg'
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 載入課程與價格方案（來自 Hanami-AI-Student-Database 舊表）
  useEffect(() => {
    let isCancelled = false;
    const loadPricing = async () => {
      try {
        setPricingLoading(true);
        setPricingError(null);

        // 讀取課程類型（寬鬆條件，避免名稱微調導致抓不到）
        const { data: courseTypesAll, error: typeErr } = await (supabase
          .from('Hanami_CourseTypes') as any)
          .select('id,name,age_range,duration_minutes,max_students,status,display_order');

        if (typeErr) throw typeErr;
        const activeTypes = (courseTypesAll || []).filter((ct: any) => ct.status !== false);
        // 嘗試用關鍵字挑選音樂專注力班課程，若找不到則用 is_featured 或全部 active
        const keywords = ['幼兒', '專注', 'Music Focus', '音樂專注力', '音樂專注'];
        let targetTypes = activeTypes.filter((ct: any) => keywords.some(k => (ct.name || '').includes(k)));
        if (targetTypes.length === 0) {
          targetTypes = activeTypes; // 後備：全部 active
        }
        const typeIdList = activeTypes.map((ct: any) => ct.id);
        const typeMap: Record<string, any> = {};
        activeTypes.forEach((ct: any) => { typeMap[ct.id] = ct; });

        // 讀取對應價格方案（若以目標課程無資料，將以全部 active 作為後備）
        let { data: plans, error: planErr } = await (supabase
          .from('hanami_course_pricing_plans') as any)
          .select('id,course_type_id,plan_name,plan_description,plan_type,price_monthly,price_yearly,price_per_lesson,package_lessons,package_price,currency,is_active,is_featured,display_order,valid_from,valid_until')
          .in('course_type_id', targetTypes.map((t: any) => t.id))
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (planErr) throw planErr;
        // 後備：若沒有方案，放寬至全部 active 課程
        if (!plans || plans.length === 0) {
          const retry = await (supabase
            .from('hanami_course_pricing_plans') as any)
            .select('id,course_type_id,plan_name,plan_description,plan_type,price_monthly,price_yearly,price_per_lesson,package_lessons,package_price,currency,is_active,is_featured,display_order,valid_from,valid_until')
            .in('course_type_id', typeIdList)
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          if (retry.error) throw retry.error;
          plans = retry.data || [];
        }

        if (!isCancelled) {
          setCourseTypesById(typeMap);
          setPricingPlans(plans || []);
        }
      } catch (e: any) {
        if (!isCancelled) setPricingError(e?.message || '讀取課程價格失敗');
      } finally {
        if (!isCancelled) setPricingLoading(false);
      }
    };

    loadPricing();
    return () => { isCancelled = true; };
  }, []);

  // 初始化顯示4張隨機照片
  useEffect(() => {
    if (classPhotos.length === 0) return;

    // 隨機選擇4張照片
    const shuffled = [...classPhotos].sort(() => Math.random() - 0.5);
    setDisplayedPhotos(shuffled.slice(0, 4));
  }, [classPhotos.length]);

  // 每15秒切換一張照片
  useEffect(() => {
    if (classPhotos.length === 0 || displayedPhotos.length === 0) return;

    const timer = setInterval(() => {
      setDisplayedPhotos((prevPhotos) => {
        // 隨機選擇一張新照片替換當前的一張照片
        const availablePhotos = classPhotos.filter(photo => !prevPhotos.includes(photo));
        if (availablePhotos.length === 0) {
          // 如果沒有新照片可用，重新隨機選擇4張
          const shuffled = [...classPhotos].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, 4);
        }

        // 隨機選擇要替換的位置
        const replaceIndex = Math.floor(Math.random() * prevPhotos.length);
        // 隨機選擇新照片
        const newPhoto = availablePhotos[Math.floor(Math.random() * availablePhotos.length)];

        // 替換照片
        const newPhotos = [...prevPhotos];
        newPhotos[replaceIndex] = newPhoto;
        return newPhotos;
      });
    }, 15000); // 15秒 = 15000毫秒

    return () => clearInterval(timer);
  }, [classPhotos.length, displayedPhotos.length]);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 點擊照片替換功能
  const handlePhotoClick = (clickedIndex: number) => {
    setDisplayedPhotos((prevPhotos) => {
      // 隨機選擇一張新照片替換被點擊的照片
      const availablePhotos = classPhotos.filter(photo => !prevPhotos.includes(photo));
      if (availablePhotos.length === 0) {
        // 如果沒有新照片可用，重新隨機選擇4張
        const shuffled = [...classPhotos].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 4);
      }

      // 隨機選擇新照片
      const newPhoto = availablePhotos[Math.floor(Math.random() * availablePhotos.length)];

      // 替換被點擊的照片
      const newPhotos = [...prevPhotos];
      newPhotos[clickedIndex] = newPhoto;
      return newPhotos;
    });
  };

  // 學生證書照片
  const certificatePhotos = [
    '/HanamiMusic/marks/LCM證書.zip - 100.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 101.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 102.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 103.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 104.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 105.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 106.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 107.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 55.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 56.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 57.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 58.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 59.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 60.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 61.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 62.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 63.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 64.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 65.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 66.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 67.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 68.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 69.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 70.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 71.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 72.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 73.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 74.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 75.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 76.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 77.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 78.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 79.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 80.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 81.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 82.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 83.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 84.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 85.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 86.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 87.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 88.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 89.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 90.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 91.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 92.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 93.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 94.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 95.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 96.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 97.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 98.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 99.jpg'
  ];

  // ABRSM 考試成果
  const abrsmResults = [
    { grade: 'Grade 2', result: 'Distinction' },
    { grade: 'Grade 3', result: 'Distinction' },
    { grade: 'Grade 5', result: 'Merit' },
    { grade: 'Grade 7', result: 'Merit' }
  ];


  // 課程優惠
  const courseOffers = [
    {
      lessons: 8,
      originalPrice: 2560,
      offerPrice: 1888,
      discount: 52
    },
    {
      lessons: 12,
      originalPrice: 3840,
      offerPrice: 2788,
      discount: 52
    },
    {
      lessons: 16,
      originalPrice: 5120,
      offerPrice: 3588,
      discount: 52
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex flex-col">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 返回按鈕 */}
              <motion.button
                onClick={() => router.push('/aihome/hanami-music')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回主頁"
              >
                <ArrowLeftIcon className="w-5 h-5 text-[#4B4036]" />
                <span className="text-sm font-medium text-[#4B4036] hidden sm:inline">返回</span>
              </motion.button>

              {/* 選單按鈕 - 只在登入時顯示 */}
              {user && (
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                  title="開啟選單"
                >
                  <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
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
                <h1 className="text-xl font-bold text-[#4B4036]">幼兒音樂專注力班(1.5+)</h1>
                <p className="text-sm text-[#2B3A3B]">Music Focus Class</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#2B3A3B]">
                {currentTime.toLocaleTimeString('zh-TW', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {user ? (
                <>
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
                    <span>登出</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                  >
                    登入
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/register')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-all duration-200"
                  >
                    註冊
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <div className="flex-1 flex">
        {/* 側邊欄選單 - 只在登入時顯示 */}
        {user && (
          <AppSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentPath="/aihome/hanami-music/music-focus-class"
          />
        )}

        {/* 主內容 */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">

            {/* 主要標題區塊 */}
            <motion.section
              initial={{ opacity: 0, y: -20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <div className="relative bg-gradient-to-br from-[#FFD59A] via-[#EBC9A4] to-[#FFB6C1] rounded-3xl p-8 md:p-16 overflow-hidden shadow-2xl">
                {/* 背景裝飾圖案 */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-[#4B4036]"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                      }}
                    >
                      <MusicalNoteIcon className="w-6 h-6" />
                    </motion.div>
                  ))}
                </div>

                {/* 主要內容 */}
                <div className="relative z-10 text-center">
                  {/* 鋼琴圖片 */}
                  <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="mb-8 flex justify-center"
                  >
                    <div className="relative w-full max-w-md">
                      <img
                        src="/HanamiMusic/musicclass.png"
                        alt="幼兒音樂專注力班"
                        className="w-full h-auto rounded-2xl shadow-2xl mx-auto"
                        style={{ maxWidth: '400px', height: 'auto' }}
                      />
                      {/* 裝飾性光暈效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-8"
                  >
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg mb-4">
                      幼兒音樂專注力班(1.5+)
                    </h1>
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <MusicalNoteIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl md:text-2xl text-white/90 mb-2">
                          為1.5歲以上小朋友度身訂造！
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                          把握1.5-7歲專注力發展黃金期！！！
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <HeartIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  {/* 行動按鈕 */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center"
                  >
                    <motion.button
                      onClick={() => router.push('/aihome/course-activities/register')}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="group px-10 py-4 bg-white text-[#4B4036] rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3"
                    >
                      <CalendarDaysIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>立即預約試堂</span>
                      <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* 教學理念標語 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-12"
            >
              <div className="text-center relative">
                {/* 背景裝飾圖案 */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -top-2 -right-6 w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full opacity-70 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute -bottom-3 -left-2 w-5 h-5 bg-gradient-to-br from-[#EBC9A4] to-[#FFB6C1] rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-1 -right-4 w-7 h-7 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

                {/* 主要標語容器 */}
                <div className="relative inline-block bg-gradient-to-r from-[#FFD59A]/30 via-[#FFB6C1]/25 to-[#EBC9A4]/30 rounded-3xl px-10 py-6 border-2 border-[#FFD59A]/40 shadow-lg">
                  {/* 內部裝飾 */}
                  <div className="absolute top-2 left-4 w-3 h-3 bg-[#FFB6C1] rounded-full opacity-80"></div>
                  <div className="absolute top-3 right-5 w-2 h-2 bg-[#FFD59A] rounded-full opacity-70"></div>
                  <div className="absolute bottom-3 left-6 w-2.5 h-2.5 bg-[#EBC9A4] rounded-full opacity-75"></div>
                  <div className="absolute bottom-2 right-3 w-3.5 h-3.5 bg-[#FFB6C1] rounded-full opacity-60"></div>

                  {/* 標語文字 */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-[#4B4036]">教學理念</h3>
                      <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-[#4B4036] italic leading-relaxed">
                      <span className="text-[#FF6B6B]">從孩子的角度出發</span>
                      <br />
                      <span className="text-[#4B4036]">讓學習音樂</span>
                      <span className="text-[#FF8E53] font-extrabold">變得不一樣</span>
                    </p>
                  </div>
                </div>

                {/* 底部裝飾線 */}
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#EBC9A4] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </motion.section>

            {/* 課堂照片展示 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#4B4036] mb-4">課堂實況</h2>
                  <p className="text-lg text-[#2B3A3B]">看看我們的小朋友如何快樂學琴，真實記錄每一刻的成長</p>
                </div>


                {/* 照片展示 */}
                <div className="grid grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
                  {displayedPhotos.map((photo, index) => {
                    // 前兩張是花花形（圓角矩形），後兩張是圓形
                    const isFlowerShape = index < 2;
                    const shapeClass = isFlowerShape ? 'rounded-3xl' : 'rounded-full';
                    const overlayClass = isFlowerShape ? 'rounded-3xl' : 'rounded-full';
                    const aspectRatio = isFlowerShape ? 'aspect-[4/3]' : 'aspect-square';
                    const dimensions = isFlowerShape ? 'w-48 h-36' : 'w-48 h-48';

                    return (
                      <motion.div
                        key={`${photo}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative group cursor-pointer"
                        onClick={() => handlePhotoClick(index)}
                      >
                        <div className={`${aspectRatio} ${shapeClass} overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 ${dimensions} mx-auto`}>
                          <img
                            src={photo}
                            alt={`課堂照片 ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent ${overlayClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        {/* 點擊提示 */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            </motion.section>

            {/* 非傳統教學法 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50">
                <div className="text-center mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-[#4B4036] mb-8">不一樣的音樂教學法</h2>

                  {/* 主要特色描述 - 使用大號字體和漸層背景 */}
                  <div className="relative mb-8">
                    <div className="inline-block relative">
                      {/* 背景裝飾 */}
                      <div className="absolute -inset-4 bg-gradient-to-r from-[#FFB6C1]/20 via-[#FFD59A]/15 to-[#EBC9A4]/20 rounded-3xl blur-sm"></div>
                      <div className="absolute -inset-3 bg-gradient-to-r from-[#FFB6C1]/30 via-[#FFD59A]/25 to-[#EBC9A4]/30 rounded-2xl"></div>

                      {/* 主要文字容器 */}
                      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl px-10 py-8 border border-[#FFD59A]/40 shadow-xl">
                        {/* 內部裝飾點 */}
                        <div className="absolute top-3 left-6 w-3 h-3 bg-[#FFB6C1] rounded-full opacity-70"></div>
                        <div className="absolute top-4 right-8 w-2 h-2 bg-[#FFD59A] rounded-full opacity-60"></div>
                        <div className="absolute bottom-4 left-8 w-3 h-3 bg-[#EBC9A4] rounded-full opacity-75"></div>
                        <div className="absolute bottom-3 right-6 w-2 h-2 bg-[#FFB6C1] rounded-full opacity-80"></div>

                        {/* 主要文字 */}
                        <div className="relative z-10">
                          <p className="text-2xl md:text-3xl font-bold text-[#4B4036] leading-relaxed">
                            <span className="text-[#FF6B6B]">用主題遊戲、繪本、多種樂器和訓練活動</span>
                            <br />
                            <span className="text-[#4B4036]">非常規的</span>
                            <span className="text-[#FF8E53] font-extrabold text-3xl md:text-4xl">音樂Playgroup！</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 次要描述 - 使用不同樣式 */}
                  <div className="bg-gradient-to-r from-[#FFD59A]/10 to-[#EBC9A4]/10 rounded-2xl px-8 py-6 border border-[#FFD59A]/20">
                    <p className="text-xl text-[#2B3A3B] font-medium">
                      <span className="text-[#4B4036] font-bold text-2xl">用音樂為孩子日後學習與學樂器做好準備</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* 教學特色 */}
                  <motion.div
                    className="text-center group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                        <img
                          src="/HanamiMusic/ManyGames.png"
                          alt="主題遊戲"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* 裝飾性光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFB6C1]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">主題遊戲</h3>
                    <p className="text-[#2B3A3B] text-lg font-medium">用主題遊戲建立孩子音樂興趣</p>
                  </motion.div>

                  <motion.div
                    className="text-center group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                        <img
                          src="/HanamiMusic/StoryTelling.png"
                          alt="繪本故事"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* 裝飾性光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFB6C1]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">繪本故事</h3>
                    <p className="text-[#2B3A3B] text-lg font-medium">透過繪本引導音樂學習</p>
                  </motion.div>

                  <motion.div
                    className="text-center group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#EBC9A4] to-[#FFB6C1] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                        <img
                          src="/HanamiMusic/MusicInstrument.png"
                          alt="多種樂器"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* 裝飾性光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#EBC9A4]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">多種樂器</h3>
                    <p className="text-[#2B3A3B] text-lg font-medium">接觸不同樂器，培養音樂感知</p>
                  </motion.div>

                  <motion.div
                    className="text-center group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                        <img
                          src="/HanamiMusic/train.jpg"
                          alt="訓練活動"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* 裝飾性光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">訓練活動</h3>
                    <p className="text-[#2B3A3B] text-lg font-medium">培養專注力、小肌肉發展、語言表達等</p>
                  </motion.div>

                  <motion.div
                    className="text-center group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                        <img
                          src="/HanamiMusic/Rythm.png"
                          alt="節奏律動"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* 裝飾性光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFB6C1]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">節奏律動</h3>
                    <p className="text-[#2B3A3B] text-lg font-medium">培養音感與節奏感</p>
                  </motion.div>

                  <motion.div
                    className="text-center group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#EBC9A4] to-[#FFB6C1] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                        <img
                          src="/HanamiMusic/SmallGroup.png"
                          alt="小組活動式"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* 裝飾性光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#EBC9A4]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">小組活動式</h3>
                    <p className="text-[#2B3A3B] text-lg font-medium">培養自信心、社交能力、團隊合作精神</p>
                  </motion.div>
                </div>

                {/* 重點強調區塊 - 使用特殊設計 */}
                <div className="mt-8 relative">
                  <div className="relative inline-block w-full">
                    {/* 背景裝飾 */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#FFB6C1]/20 via-[#FFD59A]/15 to-[#EBC9A4]/20 rounded-3xl blur-sm"></div>
                    <div className="absolute -inset-3 bg-gradient-to-r from-[#FFB6C1]/30 via-[#FFD59A]/25 to-[#EBC9A4]/30 rounded-2xl"></div>

                    {/* 主要文字容器 */}
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl px-10 py-8 border border-[#FFD59A]/40 shadow-xl">
                      {/* 內部裝飾點 */}
                      <div className="absolute top-3 left-6 w-3 h-3 bg-[#FFB6C1] rounded-full opacity-70"></div>
                      <div className="absolute top-4 right-8 w-2 h-2 bg-[#FFD59A] rounded-full opacity-60"></div>
                      <div className="absolute bottom-4 left-8 w-3 h-3 bg-[#EBC9A4] rounded-full opacity-75"></div>
                      <div className="absolute bottom-3 right-6 w-2 h-2 bg-[#FFB6C1] rounded-full opacity-80"></div>

                      {/* 文字內容 */}
                      <div className="relative z-10 text-center">
                        <p className="text-xl md:text-2xl font-bold text-[#4B4036] leading-relaxed">
                          <span className="text-[#FF6B6B] text-2xl md:text-3xl">把握1.5歲-7歲專注力及注意力發展黃金期</span>
                          <br />
                          <span className="text-[#4B4036]">讓孩子愛上音樂，建立音樂基礎</span>
                          <br />
                          <span className="text-[#4B4036] font-extrabold text-2xl md:text-3xl">培養</span>
                          <span className="text-[#FF6B6B] font-extrabold text-2xl md:text-3xl">幼兒專注力</span>
                          <span className="text-[#4B4036] font-extrabold text-2xl md:text-3xl">和</span>
                          <span className="text-[#FF8E53] font-extrabold text-2xl md:text-3xl">多種發展能力</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 腦部發展科學說明 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50">
                <div className="text-center mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-[#4B4036] mb-8">
                    <span className="text-[#4B4036]">用音樂為孩子日後</span>
                    <span className="text-[#FF6B6B]">學習</span>
                    <span className="text-[#4B4036]">與</span>
                    <span className="text-[#FF8E53]">學樂器</span>
                    <span className="text-[#4B4036]">做好準備</span>
                  </h2>
                  <p className="text-lg text-[#2B3A3B] mb-8">科學化音樂教學法，為1.5歲以上度身訂造，全面提升孩子多種能力</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {/* 專注及注意力 */}
                    <motion.div
                      className="text-center group"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 border-2 border-[#FFD59A]">
                          <img
                            src="/HanamiMusic/focusgroup/Focus.png"
                            alt="專注及注意力"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {/* 裝飾性光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">專注及注意力</h3>
                      <p className="text-[#2B3A3B] text-lg font-medium">提升專注力與注意力</p>
                    </motion.div>

                    {/* 大小肌肉 */}
                    <motion.div
                      className="text-center group"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 border-2 border-[#FFB6C1]">
                          <img
                            src="/HanamiMusic/focusgroup/Finemotor.png"
                            alt="大小肌肉"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {/* 裝飾性光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB6C1]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">大小肌肉</h3>
                      <p className="text-[#2B3A3B] text-lg font-medium">發展大小肌肉協調</p>
                    </motion.div>

                    {/* 協調能力 */}
                    <motion.div
                      className="text-center group"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 border-2 border-[#EBC9A4]">
                          <img
                            src="/HanamiMusic/focusgroup/Coordinate.png"
                            alt="協調能力"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {/* 裝飾性光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#EBC9A4]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">協調能力</h3>
                      <p className="text-[#2B3A3B] text-lg font-medium">增強身體協調能力</p>
                    </motion.div>

                    {/* 社交表達 */}
                    <motion.div
                      className="text-center group"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 border-2 border-[#FFD59A]">
                          <img
                            src="/HanamiMusic/focusgroup/unnamed-5 4.png"
                            alt="社交表達"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {/* 裝飾性光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">社交表達</h3>
                      <p className="text-[#2B3A3B] text-lg font-medium">促進社交與情感表達</p>
                    </motion.div>

                    {/* 認知理解 */}
                    <motion.div
                      className="text-center group"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 border-2 border-[#FFB6C1]">
                          <img
                            src="/HanamiMusic/focusgroup/ProblemSolving.png"
                            alt="認知理解"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {/* 裝飾性光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB6C1]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">認知理解</h3>
                      <p className="text-[#2B3A3B] text-lg font-medium">啟發認知與理解能力</p>
                    </motion.div>

                    {/* 音感及節奏 */}
                    <motion.div
                      className="text-center group"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300 border-2 border-[#EBC9A4]">
                          <img
                            src="/HanamiMusic/focusgroup/Music.png"
                            alt="音感及節奏"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {/* 裝飾性光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#EBC9A4]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-3 group-hover:text-[#FF6B6B] transition-colors duration-300">音感及節奏</h3>
                      <p className="text-[#2B3A3B] text-lg font-medium">培養音感與節奏感</p>
                    </motion.div>
                  </div>
                </div>


                <div className="mt-8 text-center">
                  <div className="relative inline-block">
                    {/* 背景裝飾 */}
                    <div className="absolute -inset-3 bg-gradient-to-r from-[#FFB6C1]/15 via-[#FFD59A]/10 to-[#EBC9A4]/15 rounded-2xl blur-sm"></div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#FFB6C1]/25 via-[#FFD59A]/20 to-[#EBC9A4]/25 rounded-xl"></div>

                    {/* 文字容器 */}
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-xl px-8 py-6 border border-[#FFD59A]/30 shadow-lg">
                      {/* 內部裝飾點 */}
                      <div className="absolute top-2 left-4 w-2 h-2 bg-[#FFB6C1] rounded-full opacity-70"></div>
                      <div className="absolute top-3 right-6 w-1.5 h-1.5 bg-[#FFD59A] rounded-full opacity-60"></div>
                      <div className="absolute bottom-3 left-6 w-2 h-2 bg-[#EBC9A4] rounded-full opacity-50"></div>
                      <div className="absolute bottom-2 right-4 w-1.5 h-1.5 bg-[#FFB6C1] rounded-full opacity-80"></div>

                      {/* 文字內容 */}
                      <div className="relative z-10">
                        <p className="text-2xl font-bold text-[#4B4036] leading-relaxed">
                          <span className="text-[#FF6B6B]">花見</span>
                          <span className="text-[#4B4036]"> 讓你的孩子體驗</span>
                          <br />
                          <span className="text-[#4B4036]">不一樣的</span>
                          <span className="text-[#FF8E53] font-extrabold text-3xl">音樂學習與成長之路</span>
                          <span className="text-[#4B4036]">...</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 學生證書照片牆 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <TrophyIcon className="w-8 h-8 text-yellow-500 mr-3" />
                    <h2 className="text-3xl font-bold text-[#4B4036]">學生證書成就牆</h2>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center ml-3">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#2B3A3B] text-lg">讓孩子快樂學琴，見證成長</p>

                  {/* 美化的標語 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mt-4 relative"
                  >
                    <div className="inline-block relative">
                      {/* 背景裝飾 */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-[#FFB6C1]/20 via-[#FFD59A]/15 to-[#EBC9A4]/20 rounded-2xl blur-sm"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#FFB6C1]/30 via-[#FFD59A]/25 to-[#EBC9A4]/30 rounded-xl"></div>

                      {/* 主要文字容器 */}
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-[#FFD59A]/40 shadow-lg">
                        {/* 內部裝飾點 */}
                        <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-[#FFB6C1] rounded-full opacity-70"></div>
                        <div className="absolute top-2 right-3 w-1 h-1 bg-[#FFD59A] rounded-full opacity-60"></div>
                        <div className="absolute bottom-2 left-4 w-1.5 h-1.5 bg-[#EBC9A4] rounded-full opacity-50"></div>
                        <div className="absolute bottom-1 right-2 w-1 h-1 bg-[#FFB6C1] rounded-full opacity-80"></div>

                        {/* 標語文字 */}
                        <div className="relative z-10 text-center">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <div className="w-4 h-4 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-[#4B4036]">見證成長</span>
                            <div className="w-4 h-4 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-[#4B4036] leading-relaxed">
                            <span className="text-[#FF6B6B]">讓我們一起</span>
                            <br />
                            <span className="text-[#4B4036]">見證</span>
                            <span className="text-[#FF8E53] font-extrabold">孩子的成長</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 底部裝飾線 */}
                    <div className="mt-3 flex justify-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-[#FFB6C1] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#FFD59A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#EBC9A4] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </motion.div>
                </div>

                {/* 電影風格照片牆 */}
                <div className="relative">
                  {/* 背景裝飾 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/10 via-transparent to-[#FFB6C1]/10 rounded-2xl"></div>

                  {/* 照片牆網格 */}
                  <div className="relative grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-6">
                    {certificatePhotos.slice(0, isExpanded ? certificatePhotos.length : 24).map((photo, index) => {
                      // 隨機旋轉角度 (-15度到15度)
                      const rotation = (Math.random() - 0.5) * 30;
                      // 隨機陰影偏移
                      const shadowX = (Math.random() - 0.5) * 8;
                      const shadowY = (Math.random() - 0.5) * 8;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
                          animate={isLoaded ? { opacity: 1, scale: 1, rotate: rotation } : {}}
                          transition={{
                            duration: 0.6,
                            delay: 1.0 + index * 0.02,
                            type: "spring",
                            stiffness: 100
                          }}
                          whileHover={{
                            scale: 1.1,
                            rotate: 0,
                            zIndex: 10,
                            transition: { duration: 0.3 }
                          }}
                          className="relative group cursor-pointer"
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            boxShadow: `${shadowX}px ${shadowY}px 15px rgba(0,0,0,0.2)`
                          }}
                        >
                          {/* 照片 */}
                          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-white shadow-lg">
                            <img
                              src={photo}
                              alt={`學生證書 ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>

                          {/* 懸停效果 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>

                          {/* 圖釘效果 */}
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm"></div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm"></div>

                          {/* 懸停時顯示的放大鏡圖標 */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                              <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* 展開狀態下的證書形狀"還有更多"提示 */}
                    {isExpanded && (
                      <motion.div
                        key="more-certificate"
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={isLoaded ? { opacity: 1, scale: 1, rotate: -5 } : {}}
                        transition={{
                          duration: 0.8,
                          delay: 1.0 + certificatePhotos.length * 0.02,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{
                          scale: 1.05,
                          rotate: 0,
                          zIndex: 10,
                          transition: { duration: 0.3 }
                        }}
                        className="relative group cursor-pointer"
                        style={{
                          transform: `rotate(-5deg)`,
                          boxShadow: `3px 3px 15px rgba(0,0,0,0.2)`
                        }}
                      >
                        {/* 證書形狀容器 */}
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-white shadow-lg bg-gradient-to-br from-[#FFD59A]/90 via-[#FFB6C1]/85 to-[#EBC9A4]/90">
                          {/* 證書內容 */}
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center relative">
                            {/* 背景裝飾 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>

                            {/* 證書邊框裝飾 */}
                            <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full"></div>
                            <div className="absolute bottom-2 left-2 right-2 h-1 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full"></div>

                            {/* 主要內容 */}
                            <div className="relative z-10">
                              {/* 圖標 */}
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                              >
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </motion.div>

                              {/* 文字 */}
                              <h3 className="text-lg font-bold text-white mb-2">還有更多</h3>
                              <p className="text-xs text-white/90 leading-relaxed">
                                讓我們見證<br />
                                孩子的成長<br />
                                與進步
                              </p>

                              {/* 底部裝飾 */}
                              <div className="mt-3 flex justify-center space-x-1">
                                <motion.div
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                                  className="w-1.5 h-1.5 bg-white/70 rounded-full"
                                ></motion.div>
                                <motion.div
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                  className="w-1.5 h-1.5 bg-white/70 rounded-full"
                                ></motion.div>
                                <motion.div
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                  className="w-1.5 h-1.5 bg-white/70 rounded-full"
                                ></motion.div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 圖釘效果 */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm"></div>

                        {/* 懸停效果 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                      </motion.div>
                    )}
                  </div>


                  {/* 還有更多提示 */}
                  {!isExpanded && (
                    <div className="text-center mt-6">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-full border border-[#FFD59A]/30">
                        <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse"></div>
                        <span className="text-sm text-[#4B4036] font-medium">還有更多證書等待展示</span>
                        <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                    </div>
                  )}

                  {/* 展開/收起按鈕 */}
                  <div className="text-center mt-6">
                    <div
                      onClick={handleToggleExpanded}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1] text-[#4B4036] rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                      style={{ pointerEvents: 'auto' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleToggleExpanded();
                        }
                      }}
                    >
                      <span>{isExpanded ? '收起' : '展開更多'}</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* 底部統計信息 */}
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center space-x-6 bg-gradient-to-r from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-full px-6 py-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4B4036]">100+</div>
                        <div className="text-sm text-[#2B3A3B]">證書</div>
                      </div>
                      <div className="w-px h-8 bg-[#EADBC8]"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4B4036]">95%</div>
                        <div className="text-sm text-[#2B3A3B]">通過率</div>
                      </div>
                      <div className="w-px h-8 bg-[#EADBC8]"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4B4036]">100%</div>
                        <div className="text-sm text-[#2B3A3B]">滿意度</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 課程價格方案（來自舊庫） */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#4B4036] mb-2">限時課程優惠</h2>
                </div>

                {pricingLoading && (
                  <div className="text-center text-[#2B3A3B]">讀取中...</div>
                )}
                {pricingError && (
                  <div className="text-center text-red-600">{pricingError}</div>
                )}

                {!pricingLoading && !pricingError && pricingPlans.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pricingPlans
                      .filter((plan) => {
                        const c = courseTypesById[plan.course_type_id];
                        const name = (c?.name || '').toLowerCase();
                        return name.includes('幼兒') || name.includes('專注') || name.includes('music focus') || name.includes('音樂專注力');
                      })
                      .map((plan, index) => {
                        const course = courseTypesById[plan.course_type_id];
                        const typeClass =
                          plan.plan_type === 'trial'
                            ? 'from-[#FFF9F2] to-[#FFD59A]/30 border-[#FFD59A]/30 hover:border-[#FFD59A]/60'
                            : plan.plan_type === 'premium'
                              ? 'from-[#FFF9F2] to-[#FFB6C1]/30 border-[#FFB6C1]/30 hover:border-[#FFB6C1]/60'
                              : 'from-[#FFF9F2] to-[#EBC9A4]/30 border-[#EBC9A4]/30 hover:border-[#EBC9A4]/60';

                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.1 * index }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            className={`group relative rounded-2xl p-6 border bg-gradient-to-br ${typeClass} transition-all duration-300`}
                          >
                            {/* 特色標籤 */}
                            {plan.is_featured && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className={`px-4 py-1 rounded-full text-xs font-bold text-white ${plan.plan_type === 'trial' ? 'bg-red-500' : plan.plan_type === 'premium' ? 'bg-purple-500' : 'bg-blue-500'
                                  }`}>
                                  {plan.plan_type === 'trial' ? '限時優惠' : plan.plan_type === 'premium' ? '推薦' : '熱門'}
                                </div>
                              </div>
                            )}

                            <div className="text-center mb-6">
                              <h3 className="text-xl font-bold text-[#4B4036] mb-1">{plan.plan_name}</h3>
                              <p className="text-sm text-[#2B3A3B] mb-3">{plan.plan_description}</p>
                              {/* 隱藏適用課程細節 */}

                              {/* 價格顯示 */}
                              <div className="mb-4">
                                {plan.plan_type === 'trial' ? (
                                  <div className="space-y-2">
                                    <span className="text-3xl font-bold text-[#E74C3C]">${plan.price_per_lesson}</span>
                                    {plan.package_price && (
                                      <div className="text-sm text-[#2B3A3B]">套裝：{plan.package_lessons}堂 ${plan.package_price}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {plan.price_monthly && (
                                      <div>
                                        <span className="text-2xl font-bold text-[#4B4036]">${plan.price_monthly}</span>
                                        <span className="text-sm text-[#2B3A3B]">/月</span>
                                      </div>
                                    )}
                                    {plan.package_price && (
                                      <div className="text-sm text-[#2B3A3B]">{plan.package_lessons}堂：${plan.package_price}</div>
                                    )}
                                    {plan.price_per_lesson && (
                                      <div className="text-sm text-[#2B3A3B]">單堂：${plan.price_per_lesson}</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <motion.button
                                onClick={() => router.push('/aihome/course-activities/register')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-full px-4 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${plan.plan_type === 'trial'
                                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                                  : plan.plan_type === 'premium'
                                    ? 'bg-gradient-to-r from-[#FFB6C1] to-[#EBC9A4] text-white'
                                    : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-white'
                                  }`}
                              >
                                <CalendarDaysIcon className="w-5 h-5 mr-2 inline" />
                                立即預約
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
                {!pricingLoading && !pricingError && pricingPlans.length === 0 && (
                  <div className="text-center text-[#2B3A3B]">目前未有可顯示的價格方案</div>
                )}
              </div>
            </motion.section>

            {/* 新年優惠區塊移除 per 要求 */}

            {/* 師資介紹 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-12"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8]">
                <h2 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">我們的團隊</h2>

                {/* 重新設計的師資介紹佈局：圖片在上，內容在下 */}
                <div className="space-y-8">
                  {/* 上方 - 師資團隊圖片 */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.0 }}
                    className="text-center"
                  >
                    <div className="relative inline-block">
                      <img
                        src="/HanamiMusic/teachersicon.png"
                        alt="專業師資團隊"
                        className="w-full max-w-lg h-auto rounded-2xl shadow-2xl mx-auto"
                        onError={(e) => {
                          console.log('師資圖片載入失敗，使用備用圖片');
                          e.currentTarget.src = '/@hanami.png';
                        }}
                      />
                      {/* 裝飾性光暈效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-2xl"></div>
                    </div>
                  </motion.div>

                  {/* 下方 - 專業認證與成就 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-[#4B4036] flex items-center justify-center mb-4">
                        <TrophyIcon className="w-8 h-8 text-yellow-500 mr-3" />
                        專業認證與成就
                      </h3>
                      <p className="text-[#2B3A3B] text-lg leading-relaxed max-w-3xl mx-auto flex items-center justify-center flex-wrap gap-2">
                        <span className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-green-500" />
                          讓音樂在孩子心中萌芽，以最有趣活潑又科學的音樂教學助
                        </span>
                        <span className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-blue-500" />
                          孩子成長發展
                        </span>
                        <span className="flex items-center gap-2">
                          <MusicalNoteIcon className="w-5 h-5 text-yellow-500" />
                          、學習樂器和音樂
                        </span>
                      </p>
                    </div>

                    {/* 認證項目網格佈局 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <TrophyIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">2022-2025年連續獲得</p>
                          <p className="text-[#4B4036] font-bold text-sm">優秀教育機構及導師獎</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">育兒專業認證</p>
                          <p className="text-[#4B4036] font-bold text-sm">一級榮譽特殊幼師</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">教學經驗</p>
                          <p className="text-[#4B4036] font-bold text-sm">8年資深幼兒教師</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <HeartIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">成長發展</p>
                          <p className="text-[#4B4036] font-bold text-sm">ABA行為治療師</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <MusicalNoteIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">音樂學習</p>
                          <p className="text-[#4B4036] font-bold text-sm">奧福音樂、音樂治療證書</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                          <SparklesIcon className="w-6 h-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">樂器學習</p>
                          <p className="text-[#4B4036] font-bold text-sm">8級或以上ABRSM鋼琴及樂理</p>
                        </div>
                      </div>
                    </div>

                    {/* 底部強調文字 */}
                    <div className="text-center p-6 bg-gradient-to-r from-[#FFD59A]/10 to-[#EBC9A4]/10 rounded-xl border border-[#FFD59A]/20">
                      <p className="text-[#4B4036] font-bold text-lg flex items-center justify-center">
                        <MusicalNoteIcon className="w-6 h-6 mr-2 text-[#FFD59A]" />
                        專業團隊精心設計，以遊戲、活動與訓練讓孩子愛上音樂
                        <SparklesIcon className="w-6 h-6 ml-2 text-[#FFD59A]" />
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* 聯絡方式 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mb-12"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8]">
                <h2 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">聯絡我們</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 聯絡方式 */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <PhoneIcon className="w-6 h-6 text-[#4B4036]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#4B4036]">電話聯絡</h3>
                        <p className="text-[#2B3A3B]">+852 98271410</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open('tel:+85298271410', '_self')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#EBC9A4] transition-colors mt-2"
                        >
                          立即撥打
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center overflow-hidden">
                        <img
                          src="/socialmedia logo/whatsapp.png"
                          alt="WhatsApp"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-[#4B4036]">WhatsApp 聯繫</h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open('https://wa.me/85298271410', '_blank')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          立即聯絡
                        </motion.button>
                      </div>
                    </div>

                    {/* 社交媒體 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#4B4036] flex items-center">
                        <ShareIcon className="w-5 h-5 mr-2" />
                        社交媒體
                      </h4>
                      <div className="flex space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://youtube.com/@hanamimusichk?si=k480c4xfHs9-6Q_j', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img
                            src="/socialmedia logo/youtube.png"
                            alt="YouTube"
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://www.facebook.com/share/1JRjDBKAD2/?mibextid=wwXIfr', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img
                            src="/socialmedia logo/facebook.png"
                            alt="Facebook"
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://www.instagram.com/hanamimusichk?igsh=ZnRvYWtuOXFlc2Uw&utm_source=qr', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img
                            src="/socialmedia logo/instagram.png"
                            alt="Instagram"
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://v.douyin.com/bKyjgdaCQ-k/', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img
                            src="/socialmedia logo/tiktok.png"
                            alt="TikTok"
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://xhslink.com/m/Aqz3owoQhZo', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img
                            src="/socialmedia logo/xionghaoshu.png"
                            alt="小紅書"
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                      </div>
                    </div>

                  </div>

                  {/* 地圖 */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                          <MapIcon className="w-6 h-6 text-[#4B4036]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#4B4036]">地址</h3>
                          <p className="text-[#2B3A3B] text-sm">香港九龍旺角威達商業大廈504-505室</p>
                        </div>
                      </div>

                      {/* 互動式地圖預覽卡片 */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative cursor-pointer group"
                      >
                        <div className="relative bg-white rounded-2xl border-2 border-[#FFD59A] shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                          {/* 地圖 iframe */}
                          <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-100">
                            <iframe
                              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.123456789!2d114.1711689236447!3d22.31635215808169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3404016b2580ddbf%3A0x306292da37e80235!2z6Iqx6KaL55C06IiNIEhhbmFtaSBNdXNpYw!5e0!3m2!1szh-TW!2sjp!4v1760902449350!5m2!1szh-TW!2sjp"
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="eager"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Hanami Music 位置地圖"
                              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            />

                            {/* 半透明遮罩層 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* 展開提示 */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                                <div className="flex items-center space-x-2 text-[#4B4036]">
                                  <MapPinIcon className="w-5 h-5" />
                                  <span className="font-medium">點擊展開地圖</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 裝飾性位置標記 */}
                          <div className="absolute top-2 left-2 w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-br from-[#EBC9A4] to-[#FFB6C1] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      </div>
    </div>
  );
}

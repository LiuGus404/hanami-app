'use client';

import { useState, useEffect } from 'react';
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
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';

export default function CourseActivitiesPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // 移除認證保護 - 允許未登入用戶訪問
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/aihome/auth/login');
  //   }
  // }, [user, loading, router]);


  // 課程活動數據 - 目前為空
  // 定義課程活動的類型
  interface Course {
    id: string;
    name: string;
    description: string;
    duration: string;
    level: string;
    instructor: string;
    schedule: string;
    location: string;
    maxStudents: number;
    currentStudents: number;
    price: number;
    rating: number;
    image: string;
    status: string;
    progress: number;
    nextClass: string;
  }

  interface Institution {
    id: string;
    name: string;
    institution: string;
    institutionLogo: string;
    description: string;
    location: string;
    courses: Course[];
  }

  const courseActivities: Institution[] = [
    {
      id: 'hanami-music',
      name: 'Hanami Music 花見音樂',
      institution: 'Hanami Music 花見音樂',
      institutionLogo: '/@hanami.png',
      description: '專業音樂教育機構，提供創新的音樂教學方法',
      location: '香港',
      courses: [
        {
          id: 'hanami-main',
          name: 'Hanami Music 精選課程',
          description: '2022-2024連續獲得優秀教育機構及導師獎。以最有趣活潑又科學的音樂教學助孩子成長發展。孩子絕對會學上癮的非傳統音樂鋼琴教學法',
          duration: '15個月起',
          level: '初級至高級',
          instructor: '8年資深幼師、一級榮譽特殊幼師、奧福音樂導師專業團隊',
          schedule: '靈活安排',
          location: '多個分校',
          maxStudents: 8,
          currentStudents: 6,
          price: 0,
          rating: 5.0,
          image: '/@hanami.png',
          status: '招生中',
          progress: 0,
          nextClass: '立即報名開始學習'
        }
      ]
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

  // 移除未認證檢查 - 允許未登入用戶訪問
  // if (!user) {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex flex-col">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 返回主頁按鈕 */}
              <motion.button
                onClick={() => router.push('/aihome')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回主頁"
              >
                <HomeIcon className="w-5 h-5 text-[#4B4036]" />
                <span className="text-sm font-medium text-[#4B4036] hidden sm:inline">返回主頁</span>
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
                  alt="HanamiEcho Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                <p className="text-sm text-[#2B3A3B]">課程活動</p>
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
            currentPath="/aihome/course-activities"
          />
        )}

        {/* 主內容 */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* 頁面標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            我的課程活動
          </h1>
          <p className="text-xl text-[#2B3A3B] max-w-3xl mx-auto">
            查看您報讀的所有機構和課程活動，掌握學習進度和安排
          </p>
        </motion.div>

        {/* 課程活動列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          {courseActivities.map((institution, institutionIndex) => (
            <motion.div
              key={institution.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 + institutionIndex * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]"
            >
              {/* 機構標題 */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 relative">
                  <img 
                    src={institution.institutionLogo} 
                    alt={`${institution.institution} Logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#4B4036]">{institution.institution}</h2>
                  <p className="text-[#2B3A3B]">{institution.courses.length} 個課程</p>
                </div>
              </div>

              {/* 課程列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {institution.courses.map((course, courseIndex) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 + institutionIndex * 0.1 + courseIndex * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      if (institution.id === 'hanami-music') {
                        router.push('/aihome/course-activities/hanami-music');
                      }
                    }}
                    className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-6 border border-[#EADBC8] hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    {/* 課程標題和狀態 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#4B4036] mb-1">{course.name}</h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === '進行中' 
                            ? 'bg-green-100 text-green-800' 
                            : course.status === '即將開始'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </div>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-[#2B3A3B]" />
                    </div>

                    {/* 課程信息 */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="w-4 h-4 text-[#4B4036]" />
                        <span className="text-sm text-[#2B3A3B]">{course.instructor}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-[#4B4036]" />
                        <span className="text-sm text-[#2B3A3B]">{course.schedule}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="w-4 h-4 text-[#4B4036]" />
                        <span className="text-sm text-[#2B3A3B]">{course.location}</span>
                      </div>
                    </div>

                    {/* 進度條 */}
                    {course.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-[#4B4036]">學習進度</span>
                          <span className="text-sm text-[#2B3A3B]">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-[#EADBC8] rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* 下次課程 */}
                    <div className="bg-white/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <CalendarDaysIcon className="w-4 h-4 text-[#4B4036]" />
                        <span className="text-sm font-medium text-[#4B4036]">下次課程</span>
                      </div>
                      <p className="text-sm text-[#2B3A3B]">{course.nextClass}</p>
                    </div>

                    {/* 課程描述 */}
                    <p className="text-sm text-[#2B3A3B] leading-relaxed">{course.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 空狀態 */}
        {courseActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-6">
              <AcademicCapIcon className="w-12 h-12 text-[#4B4036]" />
            </div>
            <h3 className="text-2xl font-bold text-[#4B4036] mb-4">還沒有報讀任何課程</h3>
            <p className="text-lg text-[#2B3A3B] mb-8">開始您的學習之旅，探索豐富的課程活動</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/aihome')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              探索課程
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </motion.button>
          </motion.div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PlusIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

interface Course {
  id: string;
  title: string;
  description: string;
  studentCount: number;
  duration: string;
  schedule: string;
  status: 'active' | 'inactive' | 'upcoming';
}

export default function CourseManagementPage() {
  const { user } = useSaasAuth();
  const { hasTeacherAccess } = useTeacherAccess();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setIsLoaded(true);
    // 模擬載入課程資料
    setCourses([
      {
        id: '1',
        title: '基礎鋼琴課程',
        description: '適合初學者的鋼琴基礎課程',
        studentCount: 8,
        duration: '60 分鐘',
        schedule: '週一、三 14:00-15:00',
        status: 'active'
      },
      {
        id: '2',
        title: '進階音樂理論',
        description: '深入學習音樂理論和作曲技巧',
        studentCount: 5,
        duration: '90 分鐘',
        schedule: '週二、四 16:00-17:30',
        status: 'active'
      },
      {
        id: '3',
        title: '兒童音樂啟蒙',
        description: '專為 3-6 歲兒童設計的音樂啟蒙課程',
        studentCount: 12,
        duration: '45 分鐘',
        schedule: '週六 10:00-10:45',
        status: 'upcoming'
      }
    ]);
  }, []);

  // 如果沒有教師權限，重定向到主頁
  useEffect(() => {
    if (user && !hasTeacherAccess) {
      router.push('/');
    }
  }, [user, hasTeacherAccess, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">檢查權限中...</p>
        </div>
      </div>
    );
  }

  if (!hasTeacherAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">權限不足</h1>
          <p className="text-[#2B3A3B] mb-6">您不具備花見老師專區的訪問權限</p>
          <HanamiButton onClick={() => router.push('/')}>
            返回首頁
          </HanamiButton>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '進行中';
      case 'upcoming':
        return '即將開始';
      case 'inactive':
        return '已結束';
      default:
        return '未知';
    }
  };

  return (
    <div className="min-h-screen">
      {/* 導航欄 */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/aihome/teacher-zone')}
              className="flex items-center space-x-2 text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>返回教師專區</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              <img
                src="/@hanami.png"
                alt="HanamiEcho Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#4B4036]">課程管理</h1>
              <p className="text-sm text-[#2B3A3B]">管理您的教學課程</p>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="relative px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 頁面標題和操作按鈕 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#4B4036] mb-2">我的課程</h1>
              <p className="text-[#2B3A3B]">管理您的所有教學課程和安排</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <HanamiButton
                onClick={() => {
                  // 這裡可以添加創建新課程的邏輯
                  alert('創建新課程功能即將推出！');
                }}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>新增課程</span>
              </HanamiButton>
            </div>
          </motion.div>

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-[#FFD59A] mb-2">{courses.length}</div>
                <div className="text-[#4B4036] font-medium">總課程數</div>
              </HanamiCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-[#FFD59A] mb-2">
                  {courses.filter(c => c.status === 'active').length}
                </div>
                <div className="text-[#4B4036] font-medium">進行中</div>
              </HanamiCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-[#FFD59A] mb-2">
                  {courses.reduce((sum, c) => sum + c.studentCount, 0)}
                </div>
                <div className="text-[#4B4036] font-medium">總學生數</div>
              </HanamiCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-[#FFD59A] mb-2">
                  {courses.filter(c => c.status === 'upcoming').length}
                </div>
                <div className="text-[#4B4036] font-medium">即將開始</div>
              </HanamiCard>
            </motion.div>
          </div>

          {/* 課程列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <HanamiCard className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <BookOpenIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#4B4036]">{course.title}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {getStatusText(course.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[#2B3A3B] mb-4 text-sm">{course.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-[#4B4036]">
                      <UserGroupIcon className="w-4 h-4" />
                      <span>{course.studentCount} 位學生</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-[#4B4036]">
                      <ClockIcon className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-[#4B4036]">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{course.schedule}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <HanamiButton
                      size="sm"
                      variant="primary"
                      className="flex-1"
                      onClick={() => {
                        alert('編輯課程功能即將推出！');
                      }}
                    >
                      編輯
                    </HanamiButton>
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        alert('查看詳情功能即將推出！');
                      }}
                    >
                      詳情
                    </HanamiButton>
                  </div>
                </HanamiCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

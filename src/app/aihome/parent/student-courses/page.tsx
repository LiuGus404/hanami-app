'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  User,
  Star,
  TrendingUp,
  Award,
  PlayCircle
} from 'lucide-react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useParentId } from '@/hooks/useParentId';

interface Course {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  progress: number;
  nextClass: string;
  status: 'active' | 'completed' | 'upcoming';
  rating: number;
}

interface Student {
  id: string;
  name: string;
  courses: Course[];
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const { user } = useSaasAuth();
  const parentId = useParentId();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬載入學生課程資料
    const loadStudentCourses = async () => {
      try {
        setLoading(true);

        // 模擬資料
        const mockStudents: Student[] = [
          {
            id: '38a1f68d-864c-4216-a20a-d053fc4f49bf',
            name: 'Helia',
            courses: [
              {
                id: '1',
                name: '基礎鋼琴課程',
                instructor: '李老師',
                schedule: '每週三 16:00-17:00',
                progress: 75,
                nextClass: '2024-12-25 16:00',
                status: 'active',
                rating: 4.8
              },
              {
                id: '2',
                name: '音樂理論基礎',
                instructor: '王老師',
                schedule: '每週五 15:00-16:00',
                progress: 60,
                nextClass: '2024-12-27 15:00',
                status: 'active',
                rating: 4.6
              }
            ]
          }
        ];

        setStudents(mockStudents);
      } catch (error) {
        console.error('載入課程資料失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStudentCourses();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'upcoming':
        return '即將開始';
      default:
        return '未知';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD59A] border-t-[#4B4036] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4B4036] text-lg">載入課程資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-6xl mx-auto">
        {/* 頂部導航 */}
        <div className="mb-8">
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首頁</span>
          </motion.button>

          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-[#4B4036]" />
            <h1 className="text-3xl font-bold text-[#4B4036]">學生課程</h1>
          </div>
          <p className="text-[#2B3A3B] mt-2">查看學生的課程進度和安排</p>
        </div>

        {/* 學生課程列表 */}
        {students.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-[#EADBC8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#4B4036] mb-2">還沒有課程資料</h3>
            <p className="text-[#2B3A3B] mb-6">請先綁定孩子帳戶以查看課程資訊</p>
            <motion.button
              onClick={() => router.push('/aihome/parent/connect')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-lg font-medium"
            >
              綁定孩子
            </motion.button>
          </div>
        ) : (
          <div className="space-y-8">
            {students.map((student, studentIndex) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: studentIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
              >
                {/* 學生標題 */}
                <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-[#4B4036]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#4B4036]">{student.name}</h2>
                      <p className="text-[#2B3A3B]">共 {student.courses.length} 門課程</p>
                    </div>
                  </div>
                </div>

                {/* 課程列表 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {student.courses.map((course, courseIndex) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (studentIndex * 0.1) + (courseIndex * 0.05) }}
                        className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-xl p-6 border border-[#EADBC8] hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#4B4036] mb-2">
                              {course.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-[#2B3A3B] mb-2">
                              <User className="w-4 h-4" />
                              <span>{course.instructor}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-[#2B3A3B]">
                              <Calendar className="w-4 h-4" />
                              <span>{course.schedule}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                            {getStatusText(course.status)}
                          </span>
                        </div>

                        {/* 進度條 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#4B4036]">進度</span>
                            <span className="text-sm text-[#2B3A3B]">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-[#EADBC8] rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${course.progress}%` }}
                              transition={{ duration: 1, delay: 0.5 + (courseIndex * 0.1) }}
                              className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-2 rounded-full"
                            />
                          </div>
                        </div>

                        {/* 課程資訊 */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2 text-[#2B3A3B]">
                            <Clock className="w-4 h-4" />
                            <span>下次課程: {new Date(course.nextClass).toLocaleString('zh-TW')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[#2B3A3B]">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>評分: {course.rating}/5.0</span>
                          </div>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="mt-4 flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>查看詳情</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

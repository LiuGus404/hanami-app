'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useParentId } from '@/hooks/useParentId';

interface ScheduleItem {
  id: string;
  studentName: string;
  courseName: string;
  instructor: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type: 'lesson' | 'exam' | 'event';
}

export default function SchedulePage() {
  const router = useRouter();
  const { user } = useSaasAuth();
  const parentId = useParentId();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        
        // 模擬課程安排資料
        const mockSchedule: ScheduleItem[] = [
          {
            id: '1',
            studentName: 'Helia',
            courseName: '基礎鋼琴課程',
            instructor: '李老師',
            date: '2024-12-25',
            startTime: '16:00',
            endTime: '17:00',
            location: '音樂教室 A',
            status: 'upcoming',
            type: 'lesson'
          },
          {
            id: '2',
            studentName: 'Helia',
            courseName: '音樂理論基礎',
            instructor: '王老師',
            date: '2024-12-27',
            startTime: '15:00',
            endTime: '16:00',
            location: '音樂教室 B',
            status: 'upcoming',
            type: 'lesson'
          },
          {
            id: '3',
            studentName: 'Helia',
            courseName: '鋼琴期末考試',
            instructor: '李老師',
            date: '2024-12-30',
            startTime: '14:00',
            endTime: '15:00',
            location: '音樂教室 A',
            status: 'upcoming',
            type: 'exam'
          }
        ];
        
        setScheduleItems(mockSchedule);
      } catch (error) {
        console.error('載入課程安排失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSchedule();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '即將開始';
      case 'ongoing':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-[#FFD59A] text-[#4B4036]';
      case 'exam':
        return 'bg-red-500 text-white';
      case 'event':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'lesson':
        return '課程';
      case 'exam':
        return '考試';
      case 'event':
        return '活動';
      default:
        return '其他';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getTodaySchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleItems.filter(item => item.date === today);
  };

  const getUpcomingSchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleItems.filter(item => item.date > today).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD59A] border-t-[#4B4036] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4B4036] text-lg">載入課程安排中...</p>
        </div>
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const upcomingSchedule = getUpcomingSchedule();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-6xl mx-auto">
        {/* 頂部導航 */}
        <div className="mb-8">
          <motion.button
            onClick={() => router.push('/aihome')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首頁</span>
          </motion.button>
          
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-[#4B4036]" />
            <h1 className="text-3xl font-bold text-[#4B4036]">課程安排</h1>
          </div>
          <p className="text-[#2B3A3B] mt-2">查看學生的課程時間安排</p>
        </div>

        {/* 今日課程 */}
        {todaySchedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-[#4B4036]" />
                <h2 className="text-xl font-bold text-[#4B4036]">今日課程</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaySchedule.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#4B4036] mb-2">
                        {item.courseName}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-[#2B3A3B] mb-2">
                        <User className="w-4 h-4" />
                        <span>{item.studentName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-[#2B3A3B]">
                        <User className="w-4 h-4" />
                        <span>{item.instructor}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeText(item.type)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-[#2B3A3B] mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{item.startTime} - {item.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 text-sm font-medium"
                    >
                      查看詳情
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 即將到來的課程 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-[#4B4036]" />
              <h2 className="text-xl font-bold text-[#4B4036]">即將到來的課程</h2>
            </div>
          </div>
          
          {upcomingSchedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-[#EADBC8] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#4B4036] mb-2">沒有即將到來的課程</h3>
              <p className="text-[#2B3A3B]">所有課程安排都會顯示在這裡</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSchedule.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[#4B4036]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#4B4036] mb-1">
                          {item.courseName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-[#2B3A3B]">
                          <span>{item.studentName}</span>
                          <span>•</span>
                          <span>{item.instructor}</span>
                          <span>•</span>
                          <span>{item.startTime} - {item.endTime}</span>
                          <span>•</span>
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {getTypeText(item.type)}
                      </span>
                      <span className="text-sm text-[#2B3A3B]">
                        {formatDate(item.date)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 text-sm font-medium"
                      >
                        查看詳情
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

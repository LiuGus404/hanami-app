'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  BookOpen, 
  Calendar, 
  Heart, 
  HeartOff, 
  ArrowLeft, 
  Users, 
  Clock,
  Building,
  X,
  Home,
  User as UserIcon,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useParentId } from '@/hooks/useParentId';
import toast from 'react-hot-toast';
import AppSidebar from '@/components/AppSidebar';

interface BoundStudent {
  id: string;
  student_id: string;
  student_name: string;
  student_oid: string;
  institution: string;
  student_age_months: number; // 月齡
  binding_type: string;
  binding_status: string;
  binding_date: string;
  last_accessed: string;
  access_count: number;
  notes: string;
}

export default function BoundStudentsPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [boundStudents, setBoundStudents] = useState<BoundStudent[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 載入已綁定的孩子
  useEffect(() => {
    const loadBoundStudents = async () => {
      try {
        setPageLoading(true);
        
        // 模擬 API 調用 - 實際應該從 API 獲取
        const mockStudents: BoundStudent[] = [
          {
            id: '1',
            student_id: '38a1f68d-864c-4216-a20a-d053fc4f49bf',
            student_name: 'Helia',
            student_oid: 'fd08d847',
            institution: 'Hanami Music',
            student_age_months: 20, // 1歲8個月 = 20個月
            binding_type: 'parent',
            binding_status: 'active',
            binding_date: '2024-12-19T10:00:00Z',
            last_accessed: '2024-12-19T15:30:00Z',
            access_count: 5,
            notes: '我的孩子'
          }
        ];
        
        setBoundStudents(mockStudents);
      } catch (error) {
        console.error('載入綁定孩子失敗:', error);
        toast.error('載入學生資料失敗');
      } finally {
        setPageLoading(false);
      }
    };

    if (user) {
      loadBoundStudents();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const handleUnbindStudent = async (studentId: string, studentName: string) => {
    try {
      // 這裡應該調用 API 取消綁定
      console.log('取消綁定孩子:', studentId);
      toast.success(`已取消與 ${studentName} 的綁定`);
      
      // 從列表中移除
      setBoundStudents(prev => prev.filter(s => s.student_id !== studentId));
    } catch (error) {
      console.error('取消綁定失敗:', error);
      toast.error('取消綁定失敗');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 月齡換算年齡
  const convertMonthsToAge = (months: number) => {
    if (months < 12) {
      return `${months} 個月`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} 歲`;
      } else {
        return `${years} 歲 ${remainingMonths} 個月`;
      }
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD59A] border-t-[#4B4036] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4B4036] text-lg">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄選單 */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/parent/bound-students"
        />

        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col">
          {/* 頂部導航欄 */}
          <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  {/* 選單按鈕 */}
                  <motion.button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                    title={sidebarOpen ? "關閉選單" : "開啟選單"}
                  >
                    <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                  
                  <div className="w-10 h-10 relative">
                    <img 
                      src="/@hanami.png" 
                      alt="HanamiEcho Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                    <p className="text-sm text-[#2B3A3B]">家長連結</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={() => router.push('/aihome/parent/connect')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-lg font-medium"
                    title="新增綁定孩子"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新增綁定</span>
                  </motion.button>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                    title="登出"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>登出</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </nav>

          {/* 主內容區域 */}
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
            {/* 學生列表 */}
            {boundStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-[#EADBC8] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#4B4036] mb-2">還沒有綁定的孩子</h3>
                <p className="text-[#2B3A3B] mb-6">開始綁定您的孩子，查看他們的學習進度</p>
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
              <div className="flex flex-wrap gap-6">
                {/* 學生卡片 */}
                {boundStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-lg border border-[#EADBC8] p-6 hover:shadow-xl transition-all duration-200 relative w-full md:w-80 lg:w-80"
                  >
                    {/* 取消綁定按鈕 - 右上角 */}
                    <motion.button
                      onClick={() => handleUnbindStudent(student.student_id, student.student_name)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="取消綁定"
                    >
                      <HeartOff className="w-4 h-4" />
                    </motion.button>
                    
                    {/* 角色圖片和名字區域 */}
                    <div className="text-center mb-4">
                      {/* 更大的動態孩子圖片 */}
                      <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center">
                        <img 
                          src="/@girl(front).png" 
                          alt={student.student_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* 名字在角色下方 */}
                      <h3 className="text-xl font-semibold text-[#4B4036] mb-1">{student.student_name}</h3>
                      
                      {/* 學生 ID 格式 */}
                      <p className="text-xs text-[#2B3A3B] font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        學生id：{student.student_id}
                      </p>
                    </div>
                    
                    {/* 主要信息 */}
                    <div className="space-y-3 text-sm text-[#2B3A3B] mb-6">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-[#FFD59A]" />
                        <span className="font-medium">{student.institution}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-[#FFD59A]" />
                        <span>{convertMonthsToAge(student.student_age_months)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-[#FFD59A]" />
                        <span>我的孩子</span>
                      </div>
                    </div>
                    
                    {/* 查看詳情按鈕 */}
                    <motion.button
                      onClick={() => router.push(`/aihome/parent/student-simple/${student.student_id}`)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      查看詳情
                    </motion.button>
                  </motion.div>
                ))}
                
                {/* 新增綁定按鍵 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full md:w-80 lg:w-80"
                >
                  <motion.button
                    onClick={() => router.push('/aihome/parent/connect')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full h-full min-h-[400px] bg-white rounded-lg shadow-lg border-2 border-dashed border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center p-6 group"
                  >
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center group-hover:from-[#EBC9A4] group-hover:to-[#FFD59A] transition-all duration-200">
                      <Plus className="w-12 h-12 text-[#4B4036]" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-[#4B4036] mb-2">新增綁定</h3>
                    <p className="text-sm text-[#2B3A3B] text-center mb-4">
                      綁定更多孩子<br />
                      查看他們的學習進度
                    </p>
                    
                    <div className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg group-hover:from-[#EBC9A4] group-hover:to-[#FFD59A] transition-all duration-200 font-medium shadow-md">
                      開始綁定
                    </div>
                  </motion.button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

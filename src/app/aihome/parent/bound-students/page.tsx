'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import toast from 'react-hot-toast';
import ParentShell, { ParentShellAction } from '@/components/ParentShell';

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

  // 載入已綁定的孩子
  useEffect(() => {
    const loadBoundStudents = async () => {
      try {
        setPageLoading(true);
        
        if (!user?.id) {
          console.error('用戶未登入或缺少用戶 ID');
          return;
        }

        // 從 API 獲取真實的綁定學生資料
        const response = await fetch(`/api/parent/bind-student?parentId=${user.id}`);
        const data = await response.json();

        if (data.success) {
          setBoundStudents(data.bindings || []);
        } else {
          console.error('獲取綁定學生失敗:', data.error);
          toast.error(data.error || '載入學生資料失敗');
          setBoundStudents([]);
        }
      } catch (error) {
        console.error('載入綁定孩子失敗:', error);
        toast.error('載入學生資料失敗');
        setBoundStudents([]);
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

  const handleUnbindStudent = async (bindingId: string, studentName: string) => {
    try {
      if (!user?.id) {
        throw new Error('用戶未登入');
      }

      const response = await fetch(
        `/api/parent/bind-student?bindingId=${bindingId}&parentId=${user.id}`,
        { method: 'DELETE' }
      );

      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || '取消綁定失敗');
      }

      toast.success(payload.message || `已取消與 ${studentName} 的綁定`);
      setBoundStudents(prev => prev.filter((student) => student.id !== bindingId));
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
  const convertMonthsToAge = (months: number | null | undefined) => {
    // 檢查輸入是否有效
    if (months === null || months === undefined || isNaN(months) || months < 0) {
      return '年齡未設定';
    }
    
    const validMonths = Math.floor(months);
    
    if (validMonths < 12) {
      return `${validMonths} 個月`;
    } else {
      const years = Math.floor(validMonths / 12);
      const remainingMonths = validMonths % 12;
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

  const action: ParentShellAction = {
    label: '新增綁定',
    onClick: () => router.push('/aihome/parent/connect'),
    icon: <Plus className="w-4 h-4" />,
  };

  const mainContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full">
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
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {/* 學生卡片 */}
          {boundStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg border border-[#EADBC8] p-4 sm:p-6 hover:shadow-xl transition-all duration-200 relative w-full sm:w-80 lg:w-80"
            >
              {/* 取消綁定按鈕 - 右上角 */}
              <motion.button
                onClick={() => handleUnbindStudent(student.id, student.student_name)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="取消綁定"
              >
                <HeartOff className="w-4 h-4" />
              </motion.button>

              {/* 角色圖片和名字區域 */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center">
                  <img 
                    src="/@girl(front).png" 
                    alt={student.student_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-[#4B4036] mb-1">{student.student_name}</h3>
                <p className="text-xs text-[#2B3A3B] font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  學生id：{student.student_id}
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[#2B3A3B] mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <Building className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD59A]" />
                  <span className="font-medium">{student.institution}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD59A]" />
                  <span>{convertMonthsToAge(student.student_age_months)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD59A]" />
                  <span>我的孩子</span>
                </div>
              </div>

              <motion.button
                onClick={() => router.push(`/aihome/parent/student-simple/${student.student_id}`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                查看詳情
              </motion.button>
            </motion.div>
          ))}

          {/* 新增綁定按鍵 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full sm:w-80 lg:w-80"
          >
            <motion.button
              onClick={() => router.push('/aihome/parent/connect')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full h-full min-h-[300px] sm:min-h-[400px] bg-white rounded-lg shadow-lg border-2 border-dashed border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center p-4 sm:p-6 group"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center group-hover:from-[#EBC9A4] group-hover:to-[#FFD59A] transition-all duration-200">
                <Plus className="w-8 h-8 sm:w-12 sm:h-12 text-[#4B4036]" />
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-[#4B4036] mb-2">新增綁定</h3>
              <p className="text-xs sm:text-sm text-[#2B3A3B] text-center mb-3 sm:mb-4">
                綁定更多孩子<br />
                查看他們的學習進度
              </p>

              <div className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg group-hover:from-[#EBC9A4] group-hover:to-[#FFD59A] transition-all duration-200 font-medium shadow-md text-sm sm:text-base">
                開始綁定
              </div>
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );

  return (
    <ParentShell
      currentPath="/aihome/parent/bound-students"
      pageTitle="已綁定的孩子"
      pageSubtitle="查看目前已經連結的學習者"
      action={action}
      user={user}
      onLogout={handleLogout}
      onLogin={() => router.push('/aihome/auth/login')}
      onRegister={() => router.push('/aihome/auth/login')}
    >
      {mainContent}
    </ParentShell>
  );
}

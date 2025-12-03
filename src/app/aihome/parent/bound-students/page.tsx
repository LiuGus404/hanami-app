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
          <div className="w-20 h-20 bg-[#FFF9F2] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#EADBC8]">
            <Users className="w-10 h-10 text-[#FFD59A]" />
          </div>
          <h3 className="text-xl font-bold text-[#4B4036] mb-3">還沒有綁定的孩子</h3>
          <p className="text-[#2B3A3B]/70 mb-8 max-w-md mx-auto">
            綁定您的孩子後，您將能夠查看他們的學習進度、課程記錄以及 AI 學習夥伴的互動情況。
          </p>
          <motion.button
            onClick={() => router.push('/aihome/parent/connect')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-[#FFD59A] text-[#4B4036] rounded-2xl hover:bg-[#EBC9A4] transition-all duration-200 shadow-sm hover:shadow-md font-semibold flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            綁定孩子
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 學生卡片 */}
          {boundStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-[#F3EAD9] relative group overflow-hidden"
            >
              {/* 裝飾背景 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFF9F2] to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />

              {/* 取消綁定按鈕 - 右上角 */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnbindStudent(student.id, student.student_name);
                }}
                whileHover={{ scale: 1.1, backgroundColor: '#FEE2E2' }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-500 rounded-xl transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="取消綁定"
              >
                <HeartOff className="w-4 h-4" />
              </motion.button>

              <div
                className="cursor-pointer"
                onClick={() => router.push(`/aihome/parent/student-simple/${student.student_id}`)}
              >
                {/* 角色圖片和名字區域 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FFF9F2] border-2 border-[#EADBC8] shadow-sm flex-shrink-0">
                    <img
                      src="/@girl(front).png"
                      alt={student.student_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4036] mb-1">{student.student_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 bg-[#FFF9F2] text-[#E6A23C] rounded-full border border-[#FFE4BA]">
                        {convertMonthsToAge(student.student_age_months)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Building className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">所屬機構</div>
                      <div className="text-sm font-medium text-[#4B4036] truncate">{student.institution}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">學生 ID</div>
                      <div className="text-sm font-medium text-[#4B4036] font-mono">{student.student_id}</div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-[#FFD59A] text-[#4B4036] rounded-xl hover:bg-[#EBC9A4] transition-colors font-semibold shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  查看學習檔案
                </motion.button>
              </div>
            </motion.div>
          ))}

          {/* 新增綁定按鍵 */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/aihome/parent/connect')}
            className="bg-white rounded-3xl p-8 shadow-sm border border-[#F3EAD9] flex flex-col items-center justify-center text-center group min-h-[320px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFF9F2] to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />

            <div className="w-20 h-20 bg-[#FFD59A]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-10 h-10 text-[#4B4036]" />
            </div>
            <h3 className="text-2xl font-bold text-[#4B4036] mb-2">新增綁定</h3>
            <p className="text-[#4B4036]/70">
              連結更多孩子帳號<br />一同參與學習旅程
            </p>
          </motion.button>
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

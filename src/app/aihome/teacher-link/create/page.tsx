'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { ArrowLeftIcon, ChartBarIcon, CalendarIcon, ExclamationTriangleIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';

// 延迟加载非关键组件
const HanamiCalendar = lazy(() => import('@/components/ui/HanamiCalendar').then(mod => ({ default: mod.default })));

import { getSaasSupabaseClient } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { TeacherLinkShell, useTeacherLinkOrganization } from './TeacherLinkShell';
import { toast } from 'react-hot-toast';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import { useTeacherLinkPermissions } from '@/hooks/useTeacherLinkPermissions';
import type { PageKey } from '@/lib/permissions';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSubscriptionLimit } from '@/hooks/useSubscriptionLimit';
import Link from 'next/link';

function CreatePageContent() {
  const router = useRouter();
  const { user: saasUser, loading: authLoading } = useSaasAuth();
  const {
    organization,
    orgId,
    allowOrgData,
    organizationResolved,
    orgDataDisabled,
    userOrganizations,
  } = useTeacherLinkOrganization();

  // 使用权限系统
  const { role, hasPermission } = useTeacherLinkPermissions();

  // 檢查是否為成員身份（向后兼容）
  const isMember = role === 'member';
  const [adminName, setAdminName] = useState('管理員');
  const [showTrialDetails, setShowTrialDetails] = useState(false);
  const [showDeactivatedDetails, setShowDeactivatedDetails] = useState(false);
  const [showLastLessonDetails, setShowLastLessonDetails] = useState(false);

  // 使用 SWR 缓存的数据
  const { data: dashboardData, isLoading, error } = useDashboardData(
    orgId,
    saasUser?.email || ''
  );

  const { studentCount, trialStudentCount, lastLessonCount, lastLessonStudents, weeklyTrialCounts, weeklyDeactivatedStudents } = dashboardData;

  // Check subscription limit for add/edit permissions
  const { canEdit, currentCount, maxStudents, loading: limitLoading } = useSubscriptionLimit(orgId);
  const isSubscriptionReadOnly = !canEdit && !limitLoading;

  const displayName =
    (saasUser?.full_name && saasUser.full_name.trim()) ||
    saasUser?.email ||
    adminName ||
    '';
  const displayInitial = displayName ? displayName.trim().charAt(0).toUpperCase() : 'U';
  const [effectiveRole, setEffectiveRole] = useState<string>('member');

  const normalizedRoleFromUser = (
    (saasUser as any)?.user_role ??
    (saasUser as any)?.role ??
    (saasUser as any)?.metadata?.user_role ??
    (saasUser as any)?.metadata?.role ??
    (saasUser as any)?.app_metadata?.user_role ??
    (saasUser as any)?.app_metadata?.role ??
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  useEffect(() => {
    if (saasUser) {
      console.log('Teacher-link/create user role debug:', {
        rawUser: saasUser,
        normalizedRole: normalizedRoleFromUser,
        effectiveRole,
      });
    }
  }, [saasUser, normalizedRoleFromUser, effectiveRole]);

  useEffect(() => {
    if (!saasUser?.email) {
      return;
    }

    const saas = getSaasSupabaseClient();
    let cancelled = false;

    const fetchRole = async () => {
      try {
        const { data, error } = await (saas.from('saas_users') as any)
          .select('user_role')
          .eq('email', saasUser.email)
          .maybeSingle();

        if (error) {
          console.error('無法從 saas_users 讀取角色資訊:', error);
          return;
        }

        if (!cancelled && data?.user_role) {
          const normalized = data.user_role.toString().trim().toLowerCase();
          setEffectiveRole((prev) => (prev === normalized ? prev : normalized));
        }
      } catch (err) {
        console.error('讀取 saas_users 角色資訊失敗:', err);
      }
    };

    // 將目前 user 的角色同步為初始值
    if (normalizedRoleFromUser) {
      setEffectiveRole((prev) =>
        prev === normalizedRoleFromUser ? prev : normalizedRoleFromUser
      );
    }

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [saasUser?.email, normalizedRoleFromUser]);

  const normalizedRole = (effectiveRole || normalizedRoleFromUser || 'member')
    .toString()
    .trim()
    .toLowerCase();

  const isSuperAdmin = normalizedRole === 'super_admin';

  const buildOrgPath = useCallback((
    basePath: string,
    extraParams?: Record<string, string | undefined | null>,
  ) => {
    const params = new URLSearchParams();

    // 不再在 URL 中顯示機構 ID，機構信息從 localStorage 讀取
    // 只保留其他必要的查詢參數（如 filter）

    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value);
        }
      });
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }, []);

  // 页面键到权限键的映射
  const pageKeyMap: Record<string, PageKey> = {
    'students': 'students',
    'members': 'members',
    'class': 'class-activities',
    'progress': 'progress',
    'finance': 'finance',
    'tasks': 'tasks',
    'learning-resources': 'learning-resources',
  };

  const quickActionsAll = useMemo(() => [
    {
      key: 'students',
      title: '學生管理',
      icon: <img alt="學生管理" className="w-12 h-12 object-contain" src="/girl.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/students')),
      permissionKey: 'students' as PageKey,
    },
    {
      key: 'members',
      title: '成員管理',
      icon: <img alt="成員管理" className="w-12 h-12 object-contain" src="/teacher.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/member-management')),
      permissionKey: 'members' as PageKey,
    },
    {
      key: 'class',
      title: '課堂管理',
      icon: <img alt="課堂管理" className="w-12 h-12 object-contain" src="/foxcat.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/class-activities')),
      permissionKey: 'class-activities' as PageKey,
    },
    {
      key: 'progress',
      title: '學生進度',
      icon: <img alt="學生進度" className="w-12 h-12 object-contain" src="/icons/book-elephant.PNG" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/student-progress')),
      permissionKey: 'progress' as PageKey,
    },
    {
      key: 'finance',
      title: '財務狀況',
      icon: (
        <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V8h16v9c0 .55-.45 1-1 1z" />
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
        </svg>
      ),
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/financial-management')),
      permissionKey: 'finance' as PageKey,
    },
    {
      key: 'tasks',
      title: '任務管理',
      subtitle: '工作任務 · 進度追蹤 · 時間管理',
      icon: (
        <svg className="w-10 h-10 text-[#FF8C42]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#10B981" />
        </svg>
      ),
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/task-management')),
      permissionKey: 'tasks' as PageKey,
    },
    {
      key: 'learning-resources',
      title: '學習資源',
      subtitle: '成長樹 · 學習路線 · 活動 · 能力 · 範本',
      icon: <img alt="學習資源" className="w-12 h-12 object-contain" src="/icons/book-elephant.PNG" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/learning-resources')),
      permissionKey: 'learning-resources' as PageKey,
    },
  ], [router, buildOrgPath]);

  // 根據權限過濾和標記按鈕
  // 財務狀況按鈕只對 admin 和 owner 顯示，其他角色完全隱藏
  const quickActions = useMemo(() => {
    return quickActionsAll
      .filter((action) => {
        // 如果是財務狀況按鈕，檢查是否有權限，沒有權限則完全隱藏
        if (action.key === 'finance') {
          return hasPermission(action.permissionKey);
        }
        // 其他按鈕都顯示（但可能被禁用）
        return true;
      })
      .map((action) => {
        const hasAccess = hasPermission(action.permissionKey);
        return {
          ...action,
          hasAccess,
        };
      });
  }, [quickActionsAll, hasPermission]);


  useEffect(() => {
    if (saasUser) {
      setAdminName(saasUser.full_name || saasUser.email || '管理員');
    } else {
      setAdminName('管理員');
    }
  }, [saasUser]);

  // 如果機構數據被禁用（正在選擇機構或顯示介紹頁面），不顯示內容
  if (orgDataDisabled) {
    console.log('CreatePageContent: orgDataDisabled 為 true，不顯示內容');
    return null;
  }

  if (isLoading) {
    return <CuteLoadingSpinner message="載入管理面板..." className="h-full min-h-[320px] p-8" />;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 text-[#2B3A3B]">
        {/* 響應式佈局：大屏幕左右分欄，小屏幕單欄 */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-8">
          {/* 左側內容區 */}
          <div className="w-full lg:w-[420px] lg:flex-shrink-0">
            {/* 返回機構選擇按鍵 */}
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/aihome/teacher-link/create/select-organization')}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[#EADBC8] rounded-xl text-[#2B3A3B] hover:text-[#A64B2A] hover:bg-white/90 hover:border-[#FFD59A] transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="font-medium">選擇機構</span>
            </motion.button>

            {/* 歡迎區 */}
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() =>
                router.push(
                  buildOrgPath('/aihome/teacher-link/create/organization-settings'),
                )
              }
              className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-4 mb-4 flex w-full items-center justify-between border-2 border-[#EADBC8] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group"
            >
              {/* 簡化的背景裝飾 */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#FFF9F2]/5 to-[#FFD59A]/5" />
              <div className="text-left relative z-10">
                <motion.h1
                  className="text-xl font-bold text-[#2B3A3B]"
                  whileHover={{ scale: 1.02 }}
                >
                  Hi {adminName}，歡迎回來！
                </motion.h1>
                <p className="text-sm text-[#8A7C70] mt-1 flex items-center gap-2">
                  {organization.name}
                  <motion.span
                    className="rounded-full bg-gradient-to-r from-[#FFF4DF] to-[#FFE3C6] px-2 py-0.5 text-[11px] text-[#D48347] border border-[#FFD59A]/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    點此修改您的機構資料
                  </motion.span>
                </p>
              </div>
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF9F2] to-[#FFE3C6] border-2 border-[#FFD59A] flex items-center justify-center overflow-hidden shadow-lg relative z-10"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <img alt="管理員" src="/owlui.png" className="w-full h-full object-contain" />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full shadow-md"
                />
              </motion.div>
            </motion.button>

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4 shadow-lg">
                <p className="font-medium">{error instanceof Error ? error.message : '載入數據時發生錯誤'}</p>
              </div>
            )}

            {/* 訂閱限制警告 */}
            {isSubscriptionReadOnly && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-md mb-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-amber-800 font-semibold text-lg flex items-center gap-2">
                      已超出學生上限
                    </h3>
                    <p className="text-amber-700 text-sm mt-1">
                      目前學生數量 ({currentCount}) 已超過方案上限 ({maxStudents})，學生資料處於只讀模式。
                    </p>
                    <Link
                      href="/aihome/teacher-link/create/student-pricing"
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <ArrowUpCircleIcon className="w-5 h-5" />
                      升級方案
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 學校狀況總覽區 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-4 mb-4 border-2 border-[#EADBC8] shadow-xl overflow-hidden"
            >
              {/* 簡化的背景裝飾 */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#FFF9F2]/5 to-[#FFD59A]/5" />
              <div className="relative z-10">
                <motion.h2
                  className="text-base font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-5 h-5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
                  >
                    <ChartBarIcon className="w-3 h-3 text-white" />
                  </motion.div>
                  學校狀況一覽
                </motion.h2>
                <div className="flex flex-row justify-center gap-6 mb-2">
                  <div className="flex flex-col items-center">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${!hasPermission('students')
                        ? 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#FFFDF8] to-[#F8F5EC] border-2 border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-lg'
                        }`}
                      onClick={() => {
                        if (!hasPermission('students')) {
                          toast.error('權限不足，未能進入');
                          return;
                        }
                        router.push(
                          buildOrgPath('/aihome/teacher-link/create/students', { filter: 'regular' }),
                        );
                      }}
                      disabled={!hasPermission('students')}
                    >
                      <motion.div
                        animate={hasPermission('students') ? { y: [0, -3, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <img alt="學生" src="/icons/bear-face.PNG" className="w-10 h-10 object-contain mb-2" />
                      </motion.div>
                      <p className={`text-2xl font-bold ${!hasPermission('students') ? 'text-gray-400' : 'text-[#2B3A3B]'}`}>{!hasPermission('students') ? '-' : studentCount}</p>
                      <p className={`text-sm ${!hasPermission('students') ? 'text-gray-400' : 'text-[#555]'}`}>常規學生人數</p>
                    </motion.button>
                    {hasPermission('students') && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeactivatedDetails(!showDeactivatedDetails)}
                        className="mt-2 px-3 py-1 text-xs text-[#8A7C70] hover:text-[#2B3A3B] flex items-center gap-1 transition-colors bg-white/60 rounded-full border border-[#EADBC8]"
                      >
                        <span>{showDeactivatedDetails ? '收起停用' : '停用記錄'}</span>
                        <motion.svg
                          animate={{ rotate: showDeactivatedDetails ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${!hasPermission('students')
                        ? 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#FFFDF8] to-[#F8F5EC] border-2 border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-lg'
                        }`}
                      onClick={() => {
                        if (!hasPermission('students')) {
                          toast.error('權限不足，未能進入');
                          return;
                        }
                        router.push(
                          buildOrgPath('/aihome/teacher-link/create/students', { filter: 'trial' }),
                        );
                      }}
                      disabled={!hasPermission('students')}
                    >
                      <motion.div
                        animate={hasPermission('students') ? { y: [0, -3, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                      >
                        <img alt="試堂" src="/icons/penguin-face.PNG" className="w-10 h-10 object-contain mb-2" />
                      </motion.div>
                      <p className={`text-2xl font-bold ${!hasPermission('students') ? 'text-gray-400' : 'text-[#2B3A3B]'}`}>{!hasPermission('students') ? '-' : trialStudentCount}</p>
                      <p className={`text-sm ${!hasPermission('students') ? 'text-gray-400' : 'text-[#555]'}`}>試堂學生人數</p>
                    </motion.button>
                    {hasPermission('students') && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTrialDetails(!showTrialDetails)}
                        className="mt-2 px-3 py-1 text-xs text-[#8A7C70] hover:text-[#2B3A3B] flex items-center gap-1 transition-colors bg-white/60 rounded-full border border-[#EADBC8]"
                      >
                        <span>{showTrialDetails ? '收起' : '展開'}</span>
                        <motion.svg
                          animate={{ rotate: showTrialDetails ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${!hasPermission('students')
                        ? 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#FFFDF8] to-[#F8F5EC] border-2 border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-lg'
                        }`}
                      onClick={() => {
                        if (!hasPermission('students')) {
                          toast.error('權限不足，未能進入');
                          return;
                        }
                        router.push(
                          buildOrgPath('/aihome/teacher-link/create/students', {
                            filter: 'lastLesson',
                          }),
                        );
                      }}
                      disabled={!hasPermission('students')}
                    >
                      <motion.div
                        animate={hasPermission('students') ? { y: [0, -3, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                      >
                        <img alt="最後一堂" src="/icons/clock.PNG" className="w-10 h-10 object-contain mb-2" />
                      </motion.div>
                      <p className={`text-2xl font-bold ${!hasPermission('students') ? 'text-gray-400' : 'text-[#2B3A3B]'}`}>{!hasPermission('students') ? '-' : lastLessonCount}</p>
                      <p className={`text-sm ${!hasPermission('students') ? 'text-gray-400' : 'text-[#555]'}`}>最後一堂人數</p>
                    </motion.button>
                    {hasPermission('students') && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowLastLessonDetails(!showLastLessonDetails)}
                        className="mt-2 px-3 py-1 text-xs text-[#8A7C70] hover:text-[#2B3A3B] flex items-center gap-1 transition-colors bg-white/60 rounded-full border border-[#EADBC8]"
                      >
                        <span>{showLastLessonDetails ? '收起' : '按星期'}</span>
                        <motion.svg
                          animate={{ rotate: showLastLessonDetails ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* 最後一堂學生詳情（按星期分組） */}
                {showLastLessonDetails && hasPermission('students') && (
                  <div className="mt-4 pt-4 border-t-2 border-[#EADBC8] relative z-10">
                    <motion.h3
                      className="text-sm font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFD59A] rounded-full"
                      />
                      最後一堂學生
                    </motion.h3>
                    {(() => {
                      // 計算未來7天各星期的學生
                      const weekdayMap: { [key: string]: string } = {
                        '0': '日', '1': '一', '2': '二', '3': '三',
                        '4': '四', '5': '五', '6': '六'
                      };

                      // 獲取未來7天的日期和星期
                      const next7Days = [];
                      const today = new Date();
                      for (let i = 0; i < 7; i++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        const weekday = date.getDay().toString();
                        const dateStr = date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                        next7Days.push({ weekday, dateStr, dayName: weekdayMap[weekday] });
                      }

                      // 根據學生的 regular_weekday 分組
                      console.log('最後一堂學生列表:', lastLessonStudents);
                      const groupedByWeekday = next7Days.map(day => {
                        const studentsForDay = lastLessonStudents.filter(
                          s => String(s.regular_weekday) === String(day.weekday)
                        );
                        return { ...day, students: studentsForDay, count: studentsForDay.length };
                      }).filter(day => day.count > 0); // 只顯示有學生的日期

                      if (groupedByWeekday.length === 0) {
                        return (
                          <motion.div
                            className="text-center py-4 text-sm text-[#8A7C70]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            未來7天沒有最後一堂的學生
                          </motion.div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {groupedByWeekday.map((day, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                              className="relative bg-gradient-to-br from-[#FFFDF8] to-[#F8F5EC] border-2 border-[#EADBC8] rounded-xl p-3 hover:border-[#FFD59A] hover:shadow-md transition-all duration-300 overflow-hidden"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-[#8A7C70]">
                                  {day.dateStr} (週{day.dayName})
                                </span>
                                <span className="px-2 py-0.5 bg-gradient-to-r from-[#FF6B6B]/10 to-[#FFD59A]/10 rounded-full text-xs font-bold text-[#2B3A3B]">
                                  {day.count} 人
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {day.students.map((student) => (
                                  <span
                                    key={student.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 border border-[#EADBC8] rounded-full text-xs text-[#2B3A3B]"
                                  >
                                    <span className="font-medium">{student.full_name}</span>
                                    {student.regular_timeslot && (
                                      <span className="text-[#8A7C70]">({student.regular_timeslot})</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 未來4週試堂人數詳情 */}
                {showTrialDetails && hasPermission('students') && (
                  <div className="mt-4 pt-4 border-t-2 border-[#EADBC8] relative z-10">
                    <motion.h3
                      className="text-sm font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full"
                      />
                      試堂人數統計
                    </motion.h3>
                    {weeklyTrialCounts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {weeklyTrialCounts.map((week, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="relative bg-gradient-to-br from-[#FFFDF8] to-[#F8F5EC] border-2 border-[#EADBC8] rounded-xl p-3 text-center hover:border-[#FFD59A] hover:shadow-md transition-all duration-300 overflow-hidden group"
                          >
                            {/* 裝飾背景 */}
                            <motion.div
                              animate={{
                                background: [
                                  "radial-gradient(circle at 50% 50%, rgba(255, 182, 193, 0.1) 0%, transparent 70%)",
                                  "radial-gradient(circle at 50% 50%, rgba(255, 213, 154, 0.1) 0%, transparent 70%)",
                                  "radial-gradient(circle at 50% 50%, rgba(255, 182, 193, 0.1) 0%, transparent 70%)"
                                ]
                              }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="absolute inset-0 pointer-events-none"
                            />
                            <div className="relative z-10">
                              <p className="text-xs text-[#8A7C70] mb-1 font-medium">{week.week}</p>
                              <motion.p
                                className="text-xl font-bold text-[#2B3A3B]"
                                whileHover={{ scale: 1.1 }}
                              >
                                {week.count}
                              </motion.p>
                              <p className="text-[10px] text-[#8A7C70] mt-1">
                                {week.endDate
                                  ? `${new Date(week.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - ${new Date(week.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}`
                                  : `${new Date(week.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} 起`}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        className="text-center py-4 text-sm text-[#8A7C70]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-[#FFD59A] border-t-transparent rounded-full mx-auto mb-2"
                        />
                        載入中...
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 停用學生詳情 */}
                {showDeactivatedDetails && hasPermission('students') && (
                  <div className="mt-4 pt-4 border-t-2 border-[#EADBC8] relative z-10">
                    <motion.h3
                      className="text-sm font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-gradient-to-r from-[#F87171] to-[#FBBF24] rounded-full"
                      />
                      近三週停用學生
                    </motion.h3>
                    {weeklyDeactivatedStudents.length > 0 ? (
                      <div className="space-y-3">
                        {weeklyDeactivatedStudents.map((week, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                            className="relative bg-gradient-to-br from-[#FFFDF8] to-[#F8F5EC] border-2 border-[#EADBC8] rounded-xl p-3 hover:border-[#FFD59A] hover:shadow-md transition-all duration-300 overflow-hidden"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-[#8A7C70]">{week.week}</span>
                              <span className="px-2 py-0.5 bg-gradient-to-r from-[#F87171]/10 to-[#FBBF24]/10 rounded-full text-xs font-bold text-[#2B3A3B]">
                                {week.count} 人
                              </span>
                              <span className="text-[10px] text-[#8A7C70]">
                                {week.endDate
                                  ? `${new Date(week.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - ${new Date(week.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}`
                                  : `${new Date(week.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} 起`}
                              </span>
                            </div>
                            {week.students.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {week.students.map((student, sIndex) => {
                                  // 轉換星期數字為中文
                                  const weekdayMap: { [key: string]: string } = {
                                    '0': '日', '1': '一', '2': '二', '3': '三',
                                    '4': '四', '5': '五', '6': '六'
                                  };
                                  const weekdayText = student.regular_weekday
                                    ? `週${weekdayMap[student.regular_weekday] || student.regular_weekday}`
                                    : '';
                                  const timeslotText = student.regular_timeslot || '';
                                  const scheduleInfo = [weekdayText, timeslotText].filter(Boolean).join(' ');

                                  return (
                                    <span
                                      key={student.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 border border-[#EADBC8] rounded-full text-xs text-[#2B3A3B]"
                                    >
                                      <span className="font-medium">{student.full_name}</span>
                                      {scheduleInfo && (
                                        <span className="text-[#8A7C70]">({scheduleInfo})</span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-[#8A7C70] italic">{week.week}無停用學生</p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        className="text-center py-4 text-sm text-[#8A7C70]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        近三週無停用學生
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* 簡化的日曆區 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-4 mb-6 border-2 border-[#EADBC8] shadow-xl overflow-hidden"
            >
              {/* 簡化的背景裝飾 */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#FFF9F2]/5 to-[#FFD59A]/5" />
              <div className="relative z-10">
                <motion.h3
                  className="text-base font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-5 h-5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
                  >
                    <CalendarIcon className="w-3 h-3 text-white" />
                  </motion.div>
                  Hanami 日曆
                </motion.h3>
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><CuteLoadingSpinner message="載入日曆..." /></div>}>
                  <HanamiCalendar organizationId={orgId} forceEmpty={orgDataDisabled || !hasPermission('students')} userEmail={saasUser?.email || null} />
                </Suspense>
              </div>
            </motion.div>

          </div>

          {/* 右側管理按鈕區 - 僅在大屏幕上顯示 */}
          <div className="hidden lg:block lg:w-[400px] lg:flex-shrink-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sticky top-8"
            >
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-5 h-5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
                >
                  <ChartBarIcon className="w-3 h-3 text-white" />
                </motion.div>
                管理功能
              </motion.h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, index) => {
                  const isRestricted = !action.hasAccess;

                  return (
                    <motion.button
                      key={action.key}
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                      whileHover={!isRestricted ? { x: -4, scale: 1.02 } : {}}
                      whileTap={!isRestricted ? { scale: 0.98 } : {}}
                      className={`relative ${isRestricted
                        ? 'bg-gray-200 border-2 border-gray-300 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md border-2 border-[#EADBC8] hover:border-[#FFD59A] shadow-lg hover:shadow-2xl'
                        } p-4 rounded-2xl text-left transition-colors transition-shadow duration-500 w-full flex flex-row items-center gap-4 overflow-hidden group`}
                      onClick={() => {
                        if (isRestricted) {
                          toast.error('權限不足，未能進入', {
                            duration: 2000,
                          });
                          return;
                        }
                        action.onClick();
                      }}
                      disabled={isRestricted}
                    >
                      {/* 簡化的背景裝飾 */}
                      {!isRestricted && (
                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#FFF9F2]/10 to-[#FFD59A]/10" />
                      )}
                      <div className={`relative z-10 w-12 h-12 flex-shrink-0 flex items-center justify-center ${isRestricted ? 'opacity-50' : ''}`}>
                        <motion.div
                          animate={!isRestricted ? { y: [0, -3, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                        >
                          {action.icon}
                        </motion.div>
                      </div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <span className={`block text-base font-semibold ${isRestricted ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                          {action.title}
                        </span>
                        {action.subtitle && (
                          <span className={`block text-xs mt-1 ${isRestricted ? 'text-gray-400' : 'text-[#777]'}`}>
                            {action.subtitle}
                          </span>
                        )}
                      </div>
                      {/* 懸停光暈效果 */}
                      {!isRestricted && (
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg pointer-events-none" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* 移動端管理按鈕區 - 僅在小屏幕上顯示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:hidden w-full mt-6"
          >
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-5 h-5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
              >
                <ChartBarIcon className="w-3 h-3 text-white" />
              </motion.div>
              管理功能
            </motion.h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 place-items-center gap-4 mb-10 px-2 w-full">
              {quickActions.map((action, index) => {
                const isRestricted = !action.hasAccess;

                return (
                  <motion.button
                    key={action.key}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                    whileHover={!isRestricted ? { y: -6, scale: 1.03, rotateX: 2 } : {}}
                    whileTap={!isRestricted ? { scale: 0.97 } : {}}
                    className={`relative ${isRestricted
                      ? 'bg-gray-200 border-2 border-gray-300 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md border-2 border-[#EADBC8] hover:border-[#FFD59A] shadow-lg hover:shadow-2xl'
                      } p-4 rounded-3xl text-center transition-colors transition-shadow duration-500 h-full w-full flex flex-col items-center justify-center overflow-hidden group`}
                    onClick={() => {
                      if (isRestricted) {
                        toast.error('權限不足，未能進入', {
                          duration: 2000,
                        });
                        return;
                      }
                      action.onClick();
                    }}
                    disabled={isRestricted}
                  >
                    {/* 動態背景裝飾 */}
                    {!isRestricted && (
                      <motion.div
                        animate={{
                          background: [
                            "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
                            "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
                          ]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                    )}
                    <div className={`relative z-10 w-12 h-12 mb-2 flex items-center justify-center ${isRestricted ? 'opacity-50' : ''}`}>
                      <motion.div
                        animate={!isRestricted ? { y: [0, -3, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        {action.icon}
                      </motion.div>
                    </div>
                    <span className={`relative z-10 text-lg font-semibold ${isRestricted ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                      {action.title}
                    </span>
                    {action.subtitle && (
                      <span className={`relative z-10 text-xs mt-1 ${isRestricted ? 'text-gray-400' : 'text-[#777]'}`}>
                        {action.subtitle}
                      </span>
                    )}
                    {/* 懸停光暈效果 */}
                    {!isRestricted && (
                      <motion.div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          boxShadow: '0 0 30px rgba(255, 182, 193, 0.3)'
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

    </>
  );
}

export default function AdminPage() {
  return (
    <TeacherLinkShell
      currentPath="/aihome/teacher-link/create"
      contentClassName="bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]"
    >
      <CreatePageContent />
    </TeacherLinkShell>
  );
}

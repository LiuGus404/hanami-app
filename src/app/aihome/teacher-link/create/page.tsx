'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import HanamiCalendar from '@/components/ui/HanamiCalendar';
import { supabase, getSaasSupabaseClient } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { TeacherLinkShell, useTeacherLinkOrganization } from './TeacherLinkShell';
import { toast } from 'react-hot-toast';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';

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
  
  // 獲取當前機構中的用戶角色
  const currentOrgRole = useMemo(() => {
    if (!orgId || !userOrganizations || userOrganizations.length === 0) {
      return null;
    }
    const currentOrg = userOrganizations.find(org => org.orgId === orgId);
    return currentOrg?.role || null;
  }, [orgId, userOrganizations]);
  
  // 檢查是否為成員身份
  const isMember = currentOrgRole === 'member';
  
  // 成員身份需要禁用的按鈕
  const restrictedButtonsForMembers = ['students', 'availability', 'progress', 'schedule'];
  const [studentCount, setStudentCount] = useState(0);
  const [trialStudentCount, setTrialStudentCount] = useState(0);
  const [lastLessonCount, setLastLessonCount] = useState(0);
  const [adminName, setAdminName] = useState('管理員');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrialDetails, setShowTrialDetails] = useState(false);
  const [weeklyTrialCounts, setWeeklyTrialCounts] = useState<Array<{ week: string; count: number; startDate: string; endDate: string }>>([]);

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

  const buildOrgPath = (
    basePath: string,
    extraParams?: Record<string, string | undefined | null>,
  ) => {
    const params = new URLSearchParams();

    if (organization?.id && !orgDataDisabled) {
      params.set('orgId', organization.id);
      if (organization.name) {
        params.set('orgName', organization.name);
      }
      if (organization.slug) {
        params.set('orgSlug', organization.slug);
      }
    }

    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value);
        }
      });
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const quickActionsAll = [
    {
      key: 'students',
      title: '學生管理',
      icon: <img alt="學生管理" className="w-12 h-12 object-contain" src="/girl.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/students')),
    },
    {
      key: 'members',
      title: '成員管理',
      icon: <img alt="成員管理" className="w-12 h-12 object-contain" src="/teacher.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/member-management')),
    },
    {
      key: 'class',
      title: '課堂管理',
      icon: <img alt="課堂管理" className="w-12 h-12 object-contain" src="/foxcat.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/class-activities')),
    },
    {
      key: 'aiLogs',
      title: 'AI 專案對話紀錄',
      subtitle: '用戶 · 專案 · 對話 · 錯誤',
      icon: (
        <svg className="w-10 h-10 text-[#FF8C42]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M7 8h10v2H7zM7 12h7v2H7z" fill="#fff" />
        </svg>
      ),
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/ai-project-logs')),
    },
    {
      key: 'availability',
      title: '課堂空缺',
      icon: <img alt="課堂空缺" className="w-12 h-12 object-contain" src="/details.png" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/lesson-availability')),
    },
    {
      key: 'progress',
      title: '學生進度',
      icon: <img alt="學生進度" className="w-12 h-12 object-contain" src="/icons/book-elephant.PNG" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/student-progress')),
    },
    {
      key: 'pending',
      title: '待審核學生',
      subtitle: '常規課程報名審核',
      icon: <div className="w-12 h-12 rounded-full bg-[#FFF7D6] flex items-center justify-center text-3xl">⏳</div>,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/pending-students')),
    },
    {
      key: 'schedule',
      title: '管理課堂',
      icon: <img alt="管理課堂" className="w-12 h-12 object-contain" src="/icons/clock.PNG" />,
      onClick: () => router.push(buildOrgPath('/aihome/teacher-link/create/schedule-management')),
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
    },
  ];

  const limitedKeys = ['students', 'class', 'progress', 'schedule', 'availability'];
  const allowedKeys = isSuperAdmin ? quickActionsAll.map((action) => action.key) : limitedKeys;
  const quickActions = quickActionsAll.filter((action) => allowedKeys.includes(action.key));

  // AI 專案對話紀錄 - 狀態
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'rooms' | 'messages' | 'errors'>('rooms');

  const openLogViewer = async () => {
    setShowLogViewer(true);
    setLogsLoading(true);
    try {
      const saas = getSaasSupabaseClient();
      const [uRes, rRes, mRes] = await Promise.all([
        (saas.from('saas_users') as any).select('id,email,full_name,created_at').order('created_at', { ascending: false }).limit(100),
        (saas.from('ai_rooms') as any).select('id,title,description,created_by,created_at,last_message_at').order('created_at', { ascending: false }).limit(100),
        (saas.from('ai_messages') as any).select('id,room_id,sender_type,sender_user_id,content,content_json,status,error_message,created_at').order('created_at', { ascending: false }).limit(200)
      ]);
      setUsers((uRes as any)?.data || []);
      setRooms((rRes as any)?.data || []);
      setMessages((mRes as any)?.data || []);
    } catch (e) {
      console.error('載入 AI 記錄失敗:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (saasUser) {
      setAdminName(saasUser.full_name || saasUser.email || '管理員');
    } else {
      setAdminName('管理員');
    }
  }, [saasUser]);

  useEffect(() => {
    if (!organizationResolved) {
      return;
    }

    if (orgDataDisabled || !orgId) {
      setStudentCount(0);
      setTrialStudentCount(0);
      setLastLessonCount(0);
      setWeeklyTrialCounts([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // 獲取香港時間（UTC+8）的今天日期
        const getHongKongDateString = () => {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          return formatter.format(now); // 返回 YYYY-MM-DD 格式
        };
        
        const today = getHongKongDateString();
        const userEmail = saasUser?.email || '';

        // 並行執行多個請求以加快載入速度
        const [studentsResponse, trialStudentsResult] = await Promise.all([
          // 獲取常規學生列表
          fetch(
            `/api/students/list?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=常規`
          ),
          // 獲取試堂學生列表
          supabase
            .from('hanami_trial_students')
            .select('id, lesson_date')
            .gte('lesson_date', today)
            .eq('org_id', orgId)
        ]);

        // 處理常規學生數據
        if (!studentsResponse.ok) {
          const errorData = await studentsResponse.json().catch(() => ({}));
          console.error('Error fetching regular students:', errorData);
          setError(errorData.error || '無法獲取常規學生數據');
        } else {
          const studentsData = await studentsResponse.json();
          const regularStudents = studentsData.data || [];
          setStudentCount(regularStudents.length);
          
          // 立即開始計算最後一堂課程數（不等待試堂數據）
          if (regularStudents.length > 0) {
            const studentIds = regularStudents.map((s: any) => s.id);
            // 異步計算最後一堂課程數，不阻塞主流程
            fetch('/api/students/calculate-remaining-lessons', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                studentIds,
                todayDate: today,
                orgId,
                userEmail,
              }),
            })
              .then((calculateResponse) => {
                if (calculateResponse.ok) {
                  return calculateResponse.json();
                }
                return { data: [] };
              })
              .then((calculateData) => {
                const remainingData = calculateData.data || [];
                const studentsWithLastLesson = remainingData.filter(
                  (item: any) => (item.remaining_lessons || 0) <= 1,
                ).length;
                setLastLessonCount(studentsWithLastLesson);
              })
              .catch((error) => {
                console.error('計算最後一堂人數時發生錯誤:', error);
                setLastLessonCount(0);
              });
          } else {
            setLastLessonCount(0);
          }
        }

        // 處理試堂學生數據
        const { data: trialStudents, error: trialError } = trialStudentsResult;

        // 計算未來4周每週的試堂人數（無論是否有錯誤都計算）
        const weeklyCounts: Array<{ week: string; count: number; startDate: string; endDate: string }> = [];
        const validTrialStudents = Array.isArray(trialStudents) ? trialStudents : [];
        
        if (trialError) {
          console.error('Error fetching trial students:', trialError);
        } else {
          setTrialStudentCount(validTrialStudents.length);
        }
        
        // 獲取香港時間的日期對象（用於計算星期幾）
        const getHongKongDateObj = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          // 使用UTC創建日期對象，但年月日基於香港時間
          return new Date(Date.UTC(year, month - 1, day));
        };
        
        const hkTodayObj = getHongKongDateObj(today);
        
        // 計算本週的週一（使用香港時間）
        const currentDay = hkTodayObj.getUTCDay(); // 0 = 星期日, 1 = 星期一, ..., 6 = 星期六
        const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        
        // 計算本週週一的日期
        const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
        const mondayDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + daysToMonday));
        const mondayYear = mondayDate.getUTCFullYear();
        const mondayMonth = mondayDate.getUTCMonth();
        const mondayDay = mondayDate.getUTCDate();
        
        // 格式化日期為 YYYY-MM-DD
        const formatDate = (year: number, month: number, day: number) => {
          return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        };
        
        // 無論是否有數據，都初始化4周的數據結構（每週從週一到週日，第4週為之後所有合計）
        for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
          // 計算這一週的週一
          const weekMonday = new Date(Date.UTC(mondayYear, mondayMonth, mondayDay + weekIndex * 7));
          const weekMondayYear = weekMonday.getUTCFullYear();
          const weekMondayMonth = weekMonday.getUTCMonth();
          const weekMondayDay = weekMonday.getUTCDate();
          
          const weekStartStr = formatDate(weekMondayYear, weekMondayMonth, weekMondayDay);
          
          let weekEndStr: string;
          let weekCount: number;
          
          if (weekIndex === 3) {
            // 第4週：之後所有合計（從第4週週一開始到未來所有）
            weekEndStr = ''; // 不設置結束日期，表示之後所有
            weekCount = validTrialStudents.filter((student: any) => {
              if (!student.lesson_date) return false;
              const lessonDate = new Date(student.lesson_date).toISOString().split('T')[0];
              return lessonDate >= weekStartStr; // 只檢查是否 >= 第4週週一
            }).length;
          } else {
            // 前3週：計算這一週的週日（週一+6天）
            const weekSunday = new Date(Date.UTC(weekMondayYear, weekMondayMonth, weekMondayDay + 6));
            const weekSundayYear = weekSunday.getUTCFullYear();
            const weekSundayMonth = weekSunday.getUTCMonth();
            const weekSundayDay = weekSunday.getUTCDate();
            
            weekEndStr = formatDate(weekSundayYear, weekSundayMonth, weekSundayDay);
            
            weekCount = validTrialStudents.filter((student: any) => {
              if (!student.lesson_date) return false;
              const lessonDate = new Date(student.lesson_date).toISOString().split('T')[0];
              return lessonDate >= weekStartStr && lessonDate <= weekEndStr;
            }).length;
          }
          
          const weekLabel = weekIndex === 0 
            ? '本週' 
            : weekIndex === 1 
            ? '下週' 
            : weekIndex === 2
            ? '第3週'
            : '之後所有合計';
          
          weeklyCounts.push({
            week: weekLabel,
            count: weekCount,
            startDate: weekStartStr,
            endDate: weekEndStr,
          });
        }
        
        setWeeklyTrialCounts(weeklyCounts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('載入數據時發生錯誤');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orgId, orgDataDisabled, organizationResolved]);

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
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-[#2B3A3B]">
        <div className="mx-auto" style={{ width: '420px' }}>
          {/* 返回機構選擇按鍵 */}
          <button
            type="button"
            onClick={() => router.push('/aihome/teacher-link/create/select-organization')}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#EADBC8] rounded-lg text-[#2B3A3B] hover:text-[#A64B2A] hover:bg-[#FFF9F2] hover:border-[#FFD59A] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="font-medium">選擇機構</span>
          </button>

          {/* 歡迎區 */}
          <button
            type="button"
            onClick={() =>
              router.push(
                buildOrgPath('/aihome/teacher-link/create/organization-settings'),
              )
            }
            className="bg-white rounded-2xl p-4 mb-4 flex w-full items-center justify-between border border-[#EADBC8] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
          >
            <div className="text-left">
              <h1 className="text-xl font-bold text-[#2B3A3B]">Hi {adminName}，歡迎回來！</h1>
              <p className="text-sm text-[#8A7C70] mt-1 flex items-center gap-2">
                {organization.name}
                <span className="rounded-full bg-[#FFF4DF] px-2 py-0.5 text-[11px] text-[#D48347]">
                  點此修改您的機構資料
                </span>
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#FFF9F2] border border-[#FFE3C6] flex items-center justify-center overflow-hidden">
              <img alt="管理員" src="/owlui.png" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
              <p>{error}</p>
            </div>
          )}

          {/* 學校狀況總覽區 */}
          <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EADBC8] shadow-sm">
            <h2 className="text-base font-semibold text-[#2B3A3B] mb-3">學校狀況一覽</h2>
            <div className="flex flex-row justify-center gap-6 mb-2">
              <button
                className={`p-3 rounded-2xl flex flex-col items-center justify-center transition ${
                  isMember
                    ? 'bg-gray-100 border border-gray-300 cursor-not-allowed'
                    : 'bg-[#FFFDF8] border border-[#EADBC8] hover:shadow-md'
                }`}
                onClick={() => {
                  if (isMember) {
                    toast.error('未開通權限');
                    return;
                  }
                  router.push(
                    buildOrgPath('/aihome/teacher-link/create/students', { filter: 'regular' }),
                  );
                }}
                disabled={isMember}
              >
                <img alt="學生" src="/icons/bear-face.PNG" className="w-10 h-10 object-contain mb-2" />
                <p className={`text-2xl font-bold ${isMember ? 'text-gray-400' : 'text-[#2B3A3B]'}`}>{isMember ? '-' : studentCount}</p>
                <p className={`text-sm ${isMember ? 'text-gray-400' : 'text-[#555]'}`}>常規學生人數</p>
              </button>
              <div className="flex flex-col items-center">
                <button
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center transition ${
                    isMember
                      ? 'bg-gray-100 border border-gray-300 cursor-not-allowed'
                      : 'bg-[#FFFDF8] border border-[#EADBC8] hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (isMember) {
                      toast.error('未開通權限');
                      return;
                    }
                    router.push(
                      buildOrgPath('/aihome/teacher-link/create/students', { filter: 'trial' }),
                    );
                  }}
                  disabled={isMember}
                >
                  <img alt="試堂" src="/icons/penguin-face.PNG" className="w-10 h-10 object-contain mb-2" />
                  <p className={`text-2xl font-bold ${isMember ? 'text-gray-400' : 'text-[#2B3A3B]'}`}>{isMember ? '-' : trialStudentCount}</p>
                  <p className={`text-sm ${isMember ? 'text-gray-400' : 'text-[#555]'}`}>試堂學生人數</p>
                </button>
                {!isMember && (
                  <button
                    type="button"
                    onClick={() => setShowTrialDetails(!showTrialDetails)}
                    className="mt-2 px-3 py-1 text-xs text-[#8A7C70] hover:text-[#2B3A3B] flex items-center gap-1 transition-colors"
                  >
                    <span>{showTrialDetails ? '收起' : '展開'}</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${showTrialDetails ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                className={`p-3 rounded-2xl flex flex-col items-center justify-center transition ${
                  isMember
                    ? 'bg-gray-100 border border-gray-300 cursor-not-allowed'
                    : 'bg-[#FFFDF8] border border-[#EADBC8] hover:shadow-md'
                }`}
                onClick={() => {
                  if (isMember) {
                    toast.error('未開通權限');
                    return;
                  }
                  router.push(
                    buildOrgPath('/aihome/teacher-link/create/students', {
                      filter: 'lastLesson',
                    }),
                  );
                }}
                disabled={isMember}
              >
                <img alt="最後一堂" src="/icons/clock.PNG" className="w-10 h-10 object-contain mb-2" />
                <p className={`text-2xl font-bold ${isMember ? 'text-gray-400' : 'text-[#2B3A3B]'}`}>{isMember ? '-' : lastLessonCount}</p>
                <p className={`text-sm ${isMember ? 'text-gray-400' : 'text-[#555]'}`}>最後一堂人數</p>
              </button>
            </div>
            
            {/* 未來4週試堂人數詳情 */}
            {showTrialDetails && !isMember && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-[#EADBC8]"
                >
                  <h3 className="text-sm font-semibold text-[#2B3A3B] mb-3">試堂人數統計</h3>
                  {weeklyTrialCounts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {weeklyTrialCounts.map((week, index) => (
                        <div
                          key={index}
                          className="bg-[#FFFDF8] border border-[#EADBC8] rounded-xl p-3 text-center"
                        >
                          <p className="text-xs text-[#8A7C70] mb-1">{week.week}</p>
                          <p className="text-xl font-bold text-[#2B3A3B]">{week.count}</p>
                          <p className="text-[10px] text-[#8A7C70] mt-1">
                            {week.endDate 
                              ? `${new Date(week.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - ${new Date(week.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}`
                              : `${new Date(week.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} 起`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-[#8A7C70]">
                      載入中...
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* 簡化的日曆區 */}
          <div className="bg-white rounded-2xl p-4 mb-6 border border-[#EADBC8] shadow-sm">
            <h3 className="text-base font-semibold text-[#2B3A3B] mb-3">Hanami 日曆</h3>
            <HanamiCalendar organizationId={orgId} forceEmpty={orgDataDisabled || isMember} userEmail={saasUser?.email || null} />
          </div>

          {/* 管理按鈕區 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 place-items-center gap-4 mb-10 px-2 w-full">
            {quickActions.map((action) => {
              const isRestricted = isMember && restrictedButtonsForMembers.includes(action.key);
              
              return (
                <button
                  key={action.key}
                  className={`${
                    isRestricted
                      ? 'bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed'
                      : 'bg-white border border-[#FDE6B8] shadow hover:shadow-md'
                  } p-3 rounded-2xl text-center transition h-full w-full flex flex-col items-center justify-center`}
                  onClick={() => {
                    if (isRestricted) {
                      toast.error('未開通權限', {
                        duration: 2000,
                      });
                      return;
                    }
                    action.onClick();
                  }}
                  disabled={isRestricted}
                >
                  <div className={`w-12 h-12 mb-2 flex items-center justify-center ${isRestricted ? 'opacity-50' : ''}`}>
                    {action.icon}
                  </div>
                  <span className={`text-lg font-semibold ${isRestricted ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                    {action.title}
                  </span>
                  {action.subtitle && (
                    <span className={`text-xs mt-1 ${isRestricted ? 'text-gray-400' : 'text-[#777]'}`}>
                      {action.subtitle}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowLogViewer(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-5xl bg-white rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-[#EADBC8]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2B3A3B]">AI 專案對話紀錄</h3>
                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='rooms'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('rooms')}>專案</button>
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='users'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('users')}>用戶</button>
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='messages'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('messages')}>對話</button>
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='errors'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('errors')}>錯誤</button>
                </div>
              </div>

              {logsLoading ? (
                <div className="py-10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative mx-auto w-16 h-16 mb-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-3 border-[#FFD59A] border-t-transparent"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          src="/owlui.png"
                          alt="載入中"
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    </div>
                    <p className="text-[#2B3A3B] text-sm">載入中...</p>
                  </div>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-auto">
                  {activeTab === 'rooms' && (
                    <div className="space-y-2">
                      {rooms.map((r:any)=> (
                        <div key={r.id} className="p-3 rounded-xl border border-[#EADBC8] bg-white/60">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#4B4036]">{r.title || '(未命名專案)'} <span className="text-xs text-gray-500 ml-1">{new Date(r.created_at).toLocaleString()}</span></p>
                              <p className="text-xs text-gray-600">room_id: {r.id}</p>
                            </div>
                            <span className="text-xs text-gray-500">最後: {r.last_message_at ? new Date(r.last_message_at).toLocaleString() : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-2">
                      {users.map((u:any)=> (
                        <div key={u.id} className="p-3 rounded-xl border border-[#EADBC8] bg-white/60">
                          <p className="font-semibold text-[#4B4036]">{u.full_name || u.email}</p>
                          <p className="text-xs text-gray-600">{u.email} · {new Date(u.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'messages' && (
                    <div className="space-y-2">
                      {messages.map((m:any)=> (
                        <div key={m.id} className="p-3 rounded-xl border border-[#EADBC8] bg-white/60">
                          <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {new Date(m.created_at).toLocaleString()}</p>
                          <p className="font-medium text-[#2B3A3B]">[{m.sender_type}] {m.content?.slice(0,200) || m.content_json?.text || '(空白)'}</p>
                          {m.status && m.status !== 'sent' && (
                            <p className="text-xs text-rose-600 mt-1">狀態: {m.status}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'errors' && (
                    <div className="space-y-2">
                      {messages.filter((m:any)=> m.status==='error' || m.error_message).map((m:any)=> (
                        <div key={m.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50">
                          <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {new Date(m.created_at).toLocaleString()}</p>
                          <p className="font-medium text-[#B00020]">{m.error_message || '未知錯誤'}</p>
                          <p className="text-xs text-[#2B3A3B] mt-1">內容: {m.content?.slice(0,180) || m.content_json?.text || '(空白)'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B3A3B]" onClick={()=>setShowLogViewer(false)}>關閉</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

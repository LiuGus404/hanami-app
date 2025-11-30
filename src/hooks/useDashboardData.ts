import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

interface DashboardData {
  studentCount: number;
  trialStudentCount: number;
  lastLessonCount: number;
  weeklyTrialCounts: Array<{ week: string; count: number; startDate: string; endDate: string }>;
}

interface DashboardDataParams {
  orgId: string | null;
  userEmail: string;
  today: string;
}

// 获取香港时间字符串
const getHongKongDateString = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
};

// 计算每周试堂人数的辅助函数
const calculateWeeklyTrialCounts = (trialStudents: any[], today: string) => {
  const weeklyCounts: Array<{ week: string; count: number; startDate: string; endDate: string }> = [];
  
  const getHongKongDateObj = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  
  const hkTodayObj = getHongKongDateObj(today);
  const currentDay = hkTodayObj.getUTCDay();
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const mondayDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + daysToMonday));
  const mondayYear = mondayDate.getUTCFullYear();
  const mondayMonth = mondayDate.getUTCMonth();
  const mondayDay = mondayDate.getUTCDate();
  
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
    const weekMonday = new Date(Date.UTC(mondayYear, mondayMonth, mondayDay + weekIndex * 7));
    const weekMondayYear = weekMonday.getUTCFullYear();
    const weekMondayMonth = weekMonday.getUTCMonth();
    const weekMondayDay = weekMonday.getUTCDate();
    
    const weekStartStr = formatDate(weekMondayYear, weekMondayMonth, weekMondayDay);
    
    let weekEndStr: string;
    let weekCount: number;
    
    if (weekIndex === 3) {
      weekEndStr = '';
      weekCount = trialStudents.filter((student: any) => {
        if (!student.lesson_date) return false;
        const lessonDate = new Date(student.lesson_date).toISOString().split('T')[0];
        return lessonDate >= weekStartStr;
      }).length;
    } else {
      const weekSunday = new Date(Date.UTC(weekMondayYear, weekMondayMonth, weekMondayDay + 6));
      const weekSundayYear = weekSunday.getUTCFullYear();
      const weekSundayMonth = weekSunday.getUTCMonth();
      const weekSundayDay = weekSunday.getUTCDate();
      
      weekEndStr = formatDate(weekSundayYear, weekSundayMonth, weekSundayDay);
      
      weekCount = trialStudents.filter((student: any) => {
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
  
  return weeklyCounts;
};

// 数据获取函数
const fetchDashboardData = async (params: DashboardDataParams): Promise<DashboardData> => {
  const { orgId, userEmail, today } = params;
  
  if (!orgId) {
    return {
      studentCount: 0,
      trialStudentCount: 0,
      lastLessonCount: 0,
      weeklyTrialCounts: [],
    };
  }

  // 并行获取数据
  const [studentsResponse, trialStudentsResult] = await Promise.all([
    fetch(
      `/api/students/list?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=常規`
    ),
    supabase
      .from('hanami_trial_students')
      .select('id, lesson_date')
      .gte('lesson_date', today)
      .eq('org_id', orgId)
  ]);

  // 处理常规学生数据
  let regularStudents: any[] = [];
  if (studentsResponse.ok) {
    const studentsData = await studentsResponse.json();
    regularStudents = studentsData.data || [];
  }

  // 处理试堂学生数据
  const { data: trialStudents } = trialStudentsResult;
  const validTrialStudents = Array.isArray(trialStudents) ? trialStudents : [];

  // 计算最后课程数（异步，不阻塞）
  let lastLessonCount = 0;
  if (regularStudents.length > 0) {
    try {
      const calculateResponse = await fetch('/api/students/calculate-remaining-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: regularStudents.map((s: any) => s.id),
          todayDate: today,
          orgId,
          userEmail,
        }),
      });
      
      if (calculateResponse.ok) {
        const calculateData = await calculateResponse.json();
        const remainingData = calculateData.data || [];
        lastLessonCount = remainingData.filter(
          (item: any) => (item.remaining_lessons || 0) <= 1,
        ).length;
      }
    } catch (error) {
      console.error('計算最後一堂人數時發生錯誤:', error);
    }
  }

  // 计算每周试堂人数
  const weeklyTrialCounts = calculateWeeklyTrialCounts(validTrialStudents, today);

  return {
    studentCount: regularStudents.length,
    trialStudentCount: validTrialStudents.length,
    lastLessonCount,
    weeklyTrialCounts,
  };
};

export function useDashboardData(orgId: string | null, userEmail: string) {
  const today = getHongKongDateString();
  
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    orgId && userEmail ? ['dashboard-data', orgId, userEmail, today] : null,
    () => fetchDashboardData({ orgId: orgId!, userEmail, today }),
    {
      revalidateOnFocus: false, // 不自动重新验证
      revalidateOnReconnect: false, // 不自动重新验证
      dedupingInterval: 60000, // 60秒内去重请求
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true, // 保持之前的数据
    }
  );

  return {
    data: data || {
      studentCount: 0,
      trialStudentCount: 0,
      lastLessonCount: 0,
      weeklyTrialCounts: [],
    },
    isLoading,
    error,
    mutate,
  };
}


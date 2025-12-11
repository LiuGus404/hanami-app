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

// 基础数据接口
interface BasicDashboardData {
  studentCount: number;
  trialStudentCount: number;
  weeklyTrialCounts: Array<{ week: string; count: number; startDate: string; endDate: string }>;
  regularStudents: any[]; // 保留用于计算
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

// 1. 获取基本数据（快速）
const fetchBasicDashboardData = async (params: DashboardDataParams): Promise<BasicDashboardData> => {
  const { orgId, userEmail, today } = params;

  if (!orgId) {
    return {
      studentCount: 0,
      trialStudentCount: 0,
      weeklyTrialCounts: [],
      regularStudents: [],
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
  const weeklyTrialCounts = calculateWeeklyTrialCounts(validTrialStudents, today);

  return {
    studentCount: regularStudents.length,
    trialStudentCount: validTrialStudents.length,
    weeklyTrialCounts,
    regularStudents,
  };
};

// 2. 获取剩余课程数（慢速，依赖基本数据）
const fetchLessonCounts = async (
  regularStudents: any[],
  orgId: string,
  userEmail: string,
  today: string
): Promise<number> => {
  if (regularStudents.length === 0) return 0;

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
      return remainingData.filter(
        (item: any) => (item.remaining_lessons || 0) <= 1,
      ).length;
    }
  } catch (error) {
    console.error('計算最後一堂人數時發生錯誤:', error);
  }
  return 0;
};

export function useDashboardData(orgId: string | null, userEmail: string) {
  const today = getHongKongDateString();

  // 1. 先获取基础数据
  const {
    data: basicData,
    error: basicError,
    isLoading: isBasicLoading,
    mutate: mutateBasic
  } = useSWR<BasicDashboardData>(
    orgId && userEmail ? ['dashboard-basic', orgId, userEmail, today] : null,
    () => fetchBasicDashboardData({ orgId: orgId!, userEmail, today }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 300000,
      keepPreviousData: true,
    }
  );

  // 2. 依赖基础数据获取课程数
  const shouldFetchLessons = basicData && basicData.regularStudents.length > 0;
  const {
    data: lastLessonCount,
    isLoading: isLessonsLoading
  } = useSWR<number>(
    shouldFetchLessons ? ['dashboard-lessons', orgId, userEmail, today, basicData?.regularStudents.length] : null,
    () => fetchLessonCounts(basicData!.regularStudents, orgId!, userEmail, today),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    }
  );

  const isLoading = isBasicLoading; // 指示主要 UI 是否可以显示

  return {
    data: {
      studentCount: basicData?.studentCount || 0,
      trialStudentCount: basicData?.trialStudentCount || 0,
      lastLessonCount: lastLessonCount || 0, // 如果还在加载则显示 0
      weeklyTrialCounts: basicData?.weeklyTrialCounts || [],
    },
    isLoading,
    error: basicError,
    mutate: mutateBasic,
  };
}


import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

interface DeactivatedStudent {
  id: string;
  full_name: string;
  inactive_date: string;
  regular_weekday: string | null;
  regular_timeslot: string | null;
}

interface WeeklyDeactivatedStudents {
  week: string;
  count: number;
  students: DeactivatedStudent[];
  startDate: string;
  endDate: string;
}

interface LastLessonStudent {
  id: string;
  full_name: string;
  regular_weekday: string | null;
  regular_timeslot: string | null;
  remaining_lessons: number;
}

interface LastLessonData {
  count: number;
  students: LastLessonStudent[];
}

interface DashboardData {
  studentCount: number;
  trialStudentCount: number;
  lastLessonCount: number;
  lastLessonStudents: LastLessonStudent[];
  weeklyTrialCounts: Array<{ week: string; count: number; startDate: string; endDate: string }>;
  weeklyDeactivatedStudents: WeeklyDeactivatedStudents[];
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
  weeklyDeactivatedStudents: WeeklyDeactivatedStudents[];
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

// 计算每周被停用的常規学生（过去三週）
const calculateWeeklyDeactivatedStudents = (
  deactivatedStudents: DeactivatedStudent[],
  today: string
): WeeklyDeactivatedStudents[] => {
  const weeklyData: WeeklyDeactivatedStudents[] = [];

  const getHongKongDateObj = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const hkTodayObj = getHongKongDateObj(today);
  const currentDay = hkTodayObj.getUTCDay();
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const thisMonday = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + daysToMonday));
  const thisMondayYear = thisMonday.getUTCFullYear();
  const thisMondayMonth = thisMonday.getUTCMonth();
  const thisMondayDay = thisMonday.getUTCDate();

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // 本週、上週、前1週（向前推算）
  const weekLabels = ['本週', '上週', '前1週'];

  for (let weekIndex = 0; weekIndex < 3; weekIndex++) {
    // 向前推算週一（負數週索引）
    const weekMonday = new Date(Date.UTC(thisMondayYear, thisMondayMonth, thisMondayDay - weekIndex * 7));
    const weekMondayYear = weekMonday.getUTCFullYear();
    const weekMondayMonth = weekMonday.getUTCMonth();
    const weekMondayDay = weekMonday.getUTCDate();

    const weekSunday = new Date(Date.UTC(weekMondayYear, weekMondayMonth, weekMondayDay + 6));
    const weekSundayYear = weekSunday.getUTCFullYear();
    const weekSundayMonth = weekSunday.getUTCMonth();
    const weekSundayDay = weekSunday.getUTCDate();

    const weekStartStr = formatDate(weekMondayYear, weekMondayMonth, weekMondayDay);
    const weekEndStr = formatDate(weekSundayYear, weekSundayMonth, weekSundayDay);

    // 過濾該週被停用的學生
    const studentsInWeek = deactivatedStudents.filter((student) => {
      if (!student.inactive_date) return false;
      const inactiveDate = student.inactive_date.split('T')[0];
      return inactiveDate >= weekStartStr && inactiveDate <= weekEndStr;
    });

    weeklyData.push({
      week: weekLabels[weekIndex],
      count: studentsInWeek.length,
      students: studentsInWeek,
      startDate: weekStartStr,
      endDate: weekEndStr,
    });
  }

  return weeklyData;
};

// 1. 获取基本数据（快速）
const fetchBasicDashboardData = async (params: DashboardDataParams): Promise<BasicDashboardData> => {
  const { orgId, userEmail, today } = params;

  if (!orgId) {
    return {
      studentCount: 0,
      trialStudentCount: 0,
      weeklyTrialCounts: [],
      weeklyDeactivatedStudents: [],
      regularStudents: [],
    };
  }

  // 計算三週前的日期（用於查詢停用學生）
  const getThreeWeeksAgoDate = (todayStr: string): string => {
    const [year, month, day] = todayStr.split('-').map(Number);
    const todayDate = new Date(Date.UTC(year, month - 1, day));
    const threeWeeksAgo = new Date(todayDate);
    threeWeeksAgo.setUTCDate(threeWeeksAgo.getUTCDate() - 21);
    return `${threeWeeksAgo.getUTCFullYear()}-${String(threeWeeksAgo.getUTCMonth() + 1).padStart(2, '0')}-${String(threeWeeksAgo.getUTCDate()).padStart(2, '0')}`;
  };

  const threeWeeksAgo = getThreeWeeksAgoDate(today);

  // 并行获取数据 (使用 API 來繞過 RLS)
  const [studentsResponse, trialStudentsResult, deactivatedResponse] = await Promise.all([
    fetch(
      `/api/students/list?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=常規`
    ),
    supabase
      .from('hanami_trial_students')
      .select('id, lesson_date')
      .gte('lesson_date', today)
      .eq('org_id', orgId),
    // 查詢已停用的學生（使用 API 繞過 RLS）
    fetch(
      `/api/students/list?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=已停用`
    )
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

  // 處理停用學生數據 (從 API 獲取 student_type='已停用' 的記錄)
  let deactivatedStudents: any[] = [];
  if (deactivatedResponse.ok) {
    const deactivatedData = await deactivatedResponse.json();
    deactivatedStudents = deactivatedData.data || [];
  }
  console.log('停用學生 API 結果:', { deactivatedStudents, threeWeeksAgo, today });

  // 過濾三週內的停用學生 (使用 updated_at 作為停用日期)
  const validDeactivatedStudents: DeactivatedStudent[] = deactivatedStudents
    .filter((s: any) => {
      if (!s.updated_at) return false;
      const updatedDate = s.updated_at.split('T')[0];
      return updatedDate >= threeWeeksAgo;
    })
    .map((s: any) => ({
      id: s.id,
      full_name: s.full_name || '未知',
      inactive_date: s.updated_at,
      regular_weekday: s.regular_weekday || null,
      regular_timeslot: s.regular_timeslot || null,
    }));
  console.log('過濾後的停用學生:', validDeactivatedStudents);
  const weeklyDeactivatedStudents = calculateWeeklyDeactivatedStudents(validDeactivatedStudents, today);

  return {
    studentCount: regularStudents.length,
    trialStudentCount: validTrialStudents.length,
    weeklyTrialCounts,
    weeklyDeactivatedStudents,
    regularStudents,
  };
};


// 2. 获取剩余课程数（慢速，依赖基本数据）- 返回詳細數據
const fetchLessonCounts = async (
  regularStudents: any[],
  orgId: string,
  userEmail: string,
  today: string
): Promise<LastLessonData> => {
  if (regularStudents.length === 0) return { count: 0, students: [] };

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

      // 過濾出最後一堂的學生
      const lastLessonItems = remainingData.filter(
        (item: any) => (item.remaining_lessons || 0) <= 1,
      );

      // 找到對應的學生資料並組合
      const lastLessonStudents: LastLessonStudent[] = lastLessonItems.map((item: any) => {
        const student = regularStudents.find((s: any) => s.id === item.student_id);
        return {
          id: item.student_id,
          full_name: student?.full_name || '未知',
          regular_weekday: student?.regular_weekday || null,
          regular_timeslot: student?.regular_timeslot || null,
          remaining_lessons: item.remaining_lessons || 0,
        };
      });

      return {
        count: lastLessonStudents.length,
        students: lastLessonStudents,
      };
    }
  } catch (error) {
    console.error('計算最後一堂人數時發生錯誤:', error);
  }
  return { count: 0, students: [] };
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
    data: lastLessonData,
    isLoading: isLessonsLoading
  } = useSWR<LastLessonData>(
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
      lastLessonCount: lastLessonData?.count || 0, // 如果还在加载则显示 0
      lastLessonStudents: lastLessonData?.students || [],
      weeklyTrialCounts: basicData?.weeklyTrialCounts || [],
      weeklyDeactivatedStudents: basicData?.weeklyDeactivatedStudents || [],
    },
    isLoading,
    error: basicError,
    mutate: mutateBasic,
  };
}


import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { TrialLesson } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { calculateRemainingLessonsBatch } from '@/lib/utils';

// 固定香港時區的 Date 產生器
const getHongKongDate = (date = new Date()) => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000)); // 香港是 UTC+8
};

// 修改類型定義
type TrialStudent = {
  id: string;
  full_name: string | null;
  student_age: number | null;
  student_dob: string | null;
  contact_number: string | null;
  parent_email: string | null;
  health_note: string | null;
  created_at: string;
  lesson_date: string;
  actual_timeslot: string;
  course_type: string | null;
  weekday: string | null;
};

type RegularLesson = {
  id: string;
  student_id: string | null;
  lesson_date: string;
  regular_timeslot: string;
  course_type: string | null;
  lesson_status: string | null;
  Hanami_Students: {
    full_name: string;
    student_age: number | null;
  } | null;
};

interface GroupedDetail {
  time: string;
  course: string;
  names: {
    name: string;
  student_id: string;
    age: string;
  is_trial?: boolean;
    remaining_lessons?: number | null;
  }[];
}

interface GroupedLesson {
  time: string;
  course: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  student_id: string;
  lesson_date: string;
  regular_timeslot: string;
  course_type: string;
  full_name: string;
  student_age: number | null;
  lesson_status: string | null;
  remaining_lessons: number | null;
  is_trial: boolean;
  age_display?: string;
  Hanami_Students?: {
    full_name: string;
    student_age: number;
  } | null;
}

type StudentNameObj = {
  name: string;
  student_id: string;
  age: string;
  is_trial?: boolean;
};

type SelectedDetail = {
  date: Date;
  groups: GroupedDetail[];
};

// 修改 holidays 型別
type Holiday = {
  date: string;
  title: string;
};

const HanamiCalendar = () => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(getHongKongDate());
  const supabase = getSupabaseClient();
  const [lessons, setLessons] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [popupInfo, setPopupInfo] = useState<{ lessonId: string } | null>(null);
  const [popupSelected, setPopupSelected] = useState<string>('');
  // 節日資料
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [statusPopupOpen, setStatusPopupOpen] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 添加 loading 狀態
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateTeachers, setSelectedDateTeachers] = useState<{name: string, start: string, end: string}[]>([]);

  // 添加防抖機制
  const lessonsFetchedRef = useRef(false);
  const currentViewRef = useRef<string>('');
  const currentDateRef = useRef<string>('');
  const loadingRef = useRef(false);

  // 抓取節日資料
  useEffect(() => {
    const fetchHolidays = async () => {
      const { data, error } = await supabase.from('hanami_holidays').select('date, title');
      if (!error && data) {
        // 確保資料符合 Holiday 型別
        const validHolidays: Holiday[] = data
          .filter((h): h is Holiday => h.date !== null && h.title !== null)
          .map(h => ({
            date: h.date,
            title: h.title
          }));
        setHolidays(validHolidays);
      }
    };
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 判斷是否為節日
  const isHoliday = (dateStr: string) => {
    return holidays.find(h => h.date === dateStr);
  };

  // fetchLessons 支援日期範圍
  const fetchLessons = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('hanami_student_lesson')
      .select('*')
      .gte('lesson_date', startDate.toISOString())
      .lte('lesson_date', endDate.toISOString());
    if (error) {
      console.error('Fetch error:', error);
      return;
    }
    if (data) setLessons(data);
  };

  useEffect(() => {
    // 如果 view 和 currentDate 沒有變化且已經載入過，不重複載入
    const dateStr = getDateString(currentDate);
    const viewKey = `${view}_${dateStr}`;
    if (currentViewRef.current === viewKey && lessonsFetchedRef.current) return
    
    // 防止重複載入
    if (loadingRef.current) return
    
    // 設置 loading 狀態
    loadingRef.current = true;
    setIsLoading(true);
    
    // 更新當前 view 和 date
    currentViewRef.current = viewKey;
    currentDateRef.current = dateStr;
    
    if (view === 'day') {
      // 查詢當天課堂
      const fetchDay = async () => {
        try {
          const dateStr = getDateString(currentDate);
          console.log('查詢日期:', dateStr);
          
          // 獲取常規學生的課堂，明確指定關聯關係
          const { data: regularLessonsData, error: regularLessonsError } = await supabase
            .from('hanami_student_lesson')
            .select(`
              *,
              Hanami_Students!hanami_student_lesson_student_id_fkey (
                full_name,
                student_age
              )
            `)
            .eq('lesson_date', dateStr);

          console.log('常規學生課堂:', regularLessonsData);

          // 獲取試堂學生的課堂
          const { data: trialLessonsData, error: trialLessonsError } = await supabase
            .from('hanami_trial_students')
            .select('*')
            .eq('lesson_date', dateStr);

          console.log('試堂學生課堂:', trialLessonsData);

          if (regularLessonsError) {
            console.error('Fetch regular lessons error:', regularLessonsError);
            return;
          }

          if (trialLessonsError) {
            console.error('Fetch trial lessons error:', trialLessonsError);
            return;
          }

          // 計算常規學生的剩餘堂數
          const regularStudentIds = (regularLessonsData || [])
            .filter(lesson => lesson.student_id)
            .map(lesson => lesson.student_id!);
          
          const remainingLessonsMap = await calculateRemainingLessonsBatch(regularStudentIds, new Date());

          // 處理常規學生數據
          const processedRegularLessons = (regularLessonsData || []).map((lesson) => ({
            id: lesson.id,
            student_id: lesson.student_id || '',
            lesson_date: lesson.lesson_date || '',
            regular_timeslot: lesson.regular_timeslot || '',
            course_type: lesson.course_type || '',
            full_name: lesson.Hanami_Students?.full_name || '未命名學生',
            student_age: lesson.Hanami_Students?.student_age || null,
            lesson_status: lesson.lesson_status,
            remaining_lessons: remainingLessonsMap[lesson.student_id!] || 0,
            is_trial: false,
            lesson_duration: lesson.lesson_duration || null,
          }));

          // 處理試堂學生數據
          const processedTrialLessons = (trialLessonsData || []).map((trial) => ({
            id: trial.id,
            student_id: trial.id,
            lesson_date: trial.lesson_date || '',
            regular_timeslot: trial.actual_timeslot || '',
            course_type: trial.course_type || '',
            full_name: trial.full_name || '未命名學生',
            student_age: trial.student_age,
            lesson_status: null,
            remaining_lessons: null,
            is_trial: true,
            lesson_duration: trial.lesson_duration || null,
          }));

          // 合併常規和試堂學生的課堂
          const allLessons = [...processedRegularLessons, ...processedTrialLessons];
          console.log('All processed lessons:', allLessons);
          setLessons(allLessons);
          lessonsFetchedRef.current = true;
        } catch (error) {
          console.error('Error fetching day lessons:', error);
        } finally {
          loadingRef.current = false;
          setIsLoading(false);
        }
      };

      fetchDay();
    } else if (view === 'week') {
      // 查詢當週課堂
      const fetchWeek = async () => {
        try {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          const startDateStr = getDateString(startOfWeek);
          const endDateStr = getDateString(endOfWeek);

          console.log('查詢週期:', { startDateStr, endDateStr });

          // 獲取常規學生的課堂
          const { data: regularLessonsData, error: regularLessonsError } = await supabase
            .from('hanami_student_lesson')
            .select(`
              *,
              Hanami_Students!hanami_student_lesson_student_id_fkey (
                full_name,
                student_age
              )
            `)
            .gte('lesson_date', startDateStr)
            .lte('lesson_date', endDateStr);

          // 獲取試堂學生的課堂
          const { data: trialLessonsData, error: trialLessonsError } = await supabase
            .from('hanami_trial_students')
            .select('*')
            .gte('lesson_date', startDateStr)
            .lte('lesson_date', endDateStr);

          if (regularLessonsError || trialLessonsError) {
            console.error('Fetch error:', regularLessonsError || trialLessonsError);
            return;
          }

          // 計算常規學生的剩餘堂數
          const regularStudentIds = (regularLessonsData || [])
            .filter(lesson => lesson.student_id)
            .map(lesson => lesson.student_id!);
          
          const remainingLessonsMap = await calculateRemainingLessonsBatch(regularStudentIds, new Date());

          // 處理常規學生數據
          const processedRegularLessons = (regularLessonsData || []).map((lesson) => ({
            id: lesson.id,
            student_id: lesson.student_id || '',
            lesson_date: lesson.lesson_date || '',
            regular_timeslot: lesson.regular_timeslot || '',
            course_type: lesson.course_type || '',
            full_name: lesson.Hanami_Students?.full_name || '未命名學生',
            student_age: lesson.Hanami_Students?.student_age || null,
            lesson_status: lesson.lesson_status,
            remaining_lessons: remainingLessonsMap[lesson.student_id!] || 0,
            is_trial: false,
            lesson_duration: lesson.lesson_duration || null,
          }));

          // 處理試堂學生數據
          const processedTrialLessons = (trialLessonsData || []).map((trial) => ({
            id: trial.id,
            student_id: trial.id,
            lesson_date: trial.lesson_date || '',
            regular_timeslot: trial.actual_timeslot || '',
            course_type: trial.course_type || '',
            full_name: trial.full_name || '未命名學生',
            student_age: trial.student_age,
            lesson_status: null,
            remaining_lessons: null,
            is_trial: true,
            lesson_duration: trial.lesson_duration || null,
          }));

          // 合併常規和試堂學生的課堂
          const allLessons = [...processedRegularLessons, ...processedTrialLessons];
          setLessons(allLessons);
          lessonsFetchedRef.current = true;
        } catch (error) {
          console.error('Error fetching week lessons:', error);
        } finally {
          loadingRef.current = false;
          setIsLoading(false);
        }
      };

      fetchWeek();
    } else if (view === 'month') {
      // 查詢當月課堂
      const fetchMonth = async () => {
        try {
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

          const startDateStr = getDateString(startOfMonth);
          const endDateStr = getDateString(endOfMonth);

          console.log('查詢月份:', { startDateStr, endDateStr });

          // 獲取常規學生的課堂
          const { data: regularLessonsData, error: regularLessonsError } = await supabase
            .from('hanami_student_lesson')
            .select(`
              *,
              Hanami_Students!hanami_student_lesson_student_id_fkey (
                full_name,
                student_age
              )
            `)
            .gte('lesson_date', startDateStr)
            .lte('lesson_date', endDateStr);

          // 獲取試堂學生的課堂
          const { data: trialLessonsData, error: trialLessonsError } = await supabase
            .from('hanami_trial_students')
            .select('*')
            .gte('lesson_date', startDateStr)
            .lte('lesson_date', endDateStr);

          if (regularLessonsError || trialLessonsError) {
            console.error('Fetch error:', regularLessonsError || trialLessonsError);
            return;
          }

          // 計算常規學生的剩餘堂數
          const regularStudentIds = (regularLessonsData || [])
            .filter(lesson => lesson.student_id)
            .map(lesson => lesson.student_id!);
          
          const remainingLessonsMap = await calculateRemainingLessonsBatch(regularStudentIds, new Date());

          // 處理常規學生數據
          const processedRegularLessons = (regularLessonsData || []).map((lesson) => ({
            id: lesson.id,
            student_id: lesson.student_id || '',
            lesson_date: lesson.lesson_date || '',
            regular_timeslot: lesson.regular_timeslot || '',
            course_type: lesson.course_type || '',
            full_name: lesson.Hanami_Students?.full_name || '未命名學生',
            student_age: lesson.Hanami_Students?.student_age || null,
            lesson_status: lesson.lesson_status,
            remaining_lessons: remainingLessonsMap[lesson.student_id!] || 0,
            is_trial: false,
            lesson_duration: lesson.lesson_duration || null,
          }));

          // 處理試堂學生數據
          const processedTrialLessons = (trialLessonsData || []).map((trial) => ({
            id: trial.id,
            student_id: trial.id,
            lesson_date: trial.lesson_date || '',
            regular_timeslot: trial.actual_timeslot || '',
            course_type: trial.course_type || '',
            full_name: trial.full_name || '未命名學生',
            student_age: trial.student_age,
            lesson_status: null,
            remaining_lessons: null,
            is_trial: true,
            lesson_duration: trial.lesson_duration || null,
          }));

          // 合併常規和試堂學生的課堂
          const allLessons = [...processedRegularLessons, ...processedTrialLessons];
          setLessons(allLessons);
          lessonsFetchedRef.current = true;
        } catch (error) {
          console.error('Error fetching month lessons:', error);
        } finally {
          loadingRef.current = false;
          setIsLoading(false);
        }
      };

      fetchMonth();
    }
  }, [view, currentDate]);

  // 當 view 或 currentDate 變化時重置防抖狀態
  useEffect(() => {
    const dateStr = getDateString(currentDate);
    const viewKey = `${view}_${dateStr}`;
    if (currentViewRef.current !== viewKey) {
      lessonsFetchedRef.current = false;
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [view, currentDate]);

  useEffect(() => {
    if (isModalOpen) setStatusPopupOpen(null);
  }, [isModalOpen]);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    if (view === 'week') {
      const weekStart = getHongKongDate(new Date(date));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = getHongKongDate(new Date(weekStart));
      weekEnd.setDate(weekEnd.getDate() + 6);
      // 顯示跨月時包含月份
      return `${weekStart.getFullYear()}/${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    } else if (view === 'month') {
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    } else {
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const getStudentAge = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || student.student_age === null || student.student_age === undefined) return '';
    const months = typeof student.student_age === 'string' ? parseInt(student.student_age) : student.student_age;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (!years && !remainingMonths) return '';
    return `${years}`;
  };

  const getDateString = (date: Date) => {
    // 'sv-SE' 會產生 'YYYY-MM-DD'
    // 使用香港時區
    return getHongKongDate(date).toLocaleDateString('sv-SE');
  };

  // 點擊日曆格子時，動態查詢該日學生資料
  const handleOpenDetail = async (date: Date, course?: string, time?: string) => {
    const dateStr = getDateString(date);

    // 獲取常規學生的課堂，明確指定關聯關係
    const { data: regularLessonsData, error: regularLessonsError } = await supabase
      .from('hanami_student_lesson')
      .select(`
        *,
        Hanami_Students!hanami_student_lesson_student_id_fkey (
          full_name,
          student_age
        )
      `)
      .eq('lesson_date', dateStr);

    // 獲取試堂學生的課堂
    const { data: trialLessonsData, error: trialLessonsError } = await supabase
      .from('hanami_trial_students')
      .select('*')
      .eq('lesson_date', dateStr);

    if (regularLessonsError || trialLessonsError) {
      console.error('Fetch lessons error:', regularLessonsError || trialLessonsError);
      return;
    }

    // 計算常規學生的剩餘堂數
    const regularStudentIds = (regularLessonsData || [])
      .filter(lesson => lesson.student_id)
      .map(lesson => lesson.student_id!);
    const remainingLessonsMap = await calculateRemainingLessonsBatch(regularStudentIds, new Date());

    // 處理常規學生數據
    const processedRegularLessons = (regularLessonsData || []).map((lesson: any) => ({
        id: lesson.id,
      student_id: lesson.student_id ?? '',
        lesson_date: lesson.lesson_date,
        regular_timeslot: lesson.regular_timeslot,
      course_type: lesson.course_type || '',
        full_name: lesson.Hanami_Students?.full_name || '未命名學生',
        student_age: lesson.Hanami_Students?.student_age || null,
        lesson_status: lesson.lesson_status,
        remaining_lessons: remainingLessonsMap[lesson.student_id!] || 0,
        is_trial: false
    }));

    // 處理試堂學生數據
    const processedTrialLessons = (trialLessonsData || []).map((trial: any) => {
      // 計算年齡
      let ageDisplay = '';
      let studentAge = 0;
      if (trial.student_age !== null && trial.student_age !== undefined) {
        studentAge = typeof trial.student_age === 'string' ? parseInt(trial.student_age) : trial.student_age;
        const years = Math.floor(studentAge / 12);
        const remainingMonths = studentAge % 12;
        ageDisplay = `${years}Y${remainingMonths}M`;
      }
      return {
        id: trial.id,
        student_id: trial.id,
        lesson_date: trial.lesson_date,
        regular_timeslot: trial.actual_timeslot,
        course_type: trial.course_type || '',
        full_name: trial.full_name || '未命名學生',
        student_age: studentAge,
        age_display: ageDisplay,
        lesson_status: null,
        remaining_lessons: null,
        is_trial: true,
        health_note: trial.health_note ?? null
      } as Lesson;
    });

    // 合併常規和試堂學生的課堂
    let allLessons: Lesson[] = [...processedRegularLessons, ...processedTrialLessons];

    // 如果有指定課程和時間，進行過濾
    if (course && time) {
      allLessons = allLessons.filter(
        l => l.course_type === course && l.regular_timeslot === time
      );
    }

    // 分組處理
    const grouped = allLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
      const key = `${l.regular_timeslot}_${l.course_type}`;
      if (!acc[key]) {
        acc[key] = {
          time: l.regular_timeslot,
          course: l.course_type,
          lessons: []
        };
      }
      acc[key].lessons.push(l);
      return acc;
    }, {});

    const groupedArray: GroupedLesson[] = Object.values(grouped) as GroupedLesson[];
    groupedArray.sort((a, b) => a.time.localeCompare(b.time));
    
    // 設置選中的詳細資訊
    setSelectedDetail({
      date,
      groups: groupedArray.map(g => ({
        time: g.time,
        course: g.course,
        names: g.lessons.map(lesson => ({
          name: lesson.full_name,
          student_id: lesson.student_id,
          age: lesson.is_trial ? (lesson.age_display ? String(parseInt(lesson.age_display)) : '') : getStudentAge(lesson.student_id),
          is_trial: lesson.is_trial,
          remaining_lessons: lesson.remaining_lessons
        }))
      }))
    });
  };

  const handleUpdateStatus = async (lessonId: string, status: string) => {
    try {
      // 1. 使用 PATCH 只更新狀態欄位
      const { error: updateError } = await supabase
      .from('hanami_student_lesson')
        .update({
          lesson_status: status,
          updated_at: new Date().toISOString()
        })
      .eq('id', lessonId);

      if (updateError) {
        console.error('Update error:', updateError);
        alert('更新失敗：' + updateError.message);
        return false;
    }

      // 2. 查詢更新後的資料
      const { data: updatedLesson, error: fetchError } = await supabase
        .from('hanami_student_lesson')
        .select(`
          *,
          Hanami_Students!hanami_student_lesson_student_id_fkey (
            full_name,
            student_age
          )
        `)
        .eq('id', lessonId)
        .maybeSingle();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return false;
      }

      // 3. 更新本地狀態
      if (updatedLesson) {
        setLessons(prevLessons => 
          prevLessons.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, ...updatedLesson }
              : lesson
          )
        );

        // 4. 重新獲取當前視圖的課堂
    if (view === 'day') {
          const dateStr = getDateString(currentDate);
          const { data: refreshedLessons } = await supabase
            .from('hanami_student_lesson')
            .select(`
              *,
              Hanami_Students!hanami_student_lesson_student_id_fkey (
                full_name,
                student_age
              )
            `)
            .eq('lesson_date', dateStr);

          if (refreshedLessons) {
            setLessons(refreshedLessons);
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('發生未預期的錯誤，請稍後再試');
      return false;
    }
  };

  // Helper: check if date string is today or in the past (date portion only)
  const isPastOrToday = (dateStr: string) => {
    const date = getHongKongDate(new Date(dateStr));
    const today = getHongKongDate();
    date.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return date <= today;
  };

  // 修改渲染部分，為試堂學生添加特殊標記
  const renderStudentButton = (nameObj: StudentNameObj, lesson?: Lesson) => {
    const lessonIsTodayOrPast = lesson ? isPastOrToday(lesson.lesson_date) : false;
    
    // 根據剩餘堂數決定背景顏色
    let bgColor = nameObj.is_trial ? '#FFF7D6' : '#F5E7D4';
    if (!nameObj.is_trial && lesson?.remaining_lessons !== undefined && lesson?.remaining_lessons !== null) {
      if (lesson.remaining_lessons === 1) {
        bgColor = '#FF8A8A';
      } else if (lesson.remaining_lessons === 2) {
        bgColor = '#FFB67A';
      }
    }

    // 動畫 class
    const baseBtnClass = `inline-block px-2 py-1 m-1 rounded-full text-[#4B4036] text-xs transition-all duration-200 flex items-center shadow-sm hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none`;
    const statusBtnClass = `ml-2 px-2 py-0.5 rounded text-xs transition-all duration-200 shadow-sm hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none`;
    const unsetBtnClass = `ml-2 px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600 border border-gray-300 transition-all duration-200 shadow-sm hover:scale-105 hover:bg-yellow-100 hover:shadow-lg active:scale-95 focus:outline-none`;

    return (
      <div className="flex items-center">
        <button
          onClick={() => window.location.href = `/admin/students/${nameObj.student_id}`}
          className={baseBtnClass}
          style={{ 
            minWidth: '60px',
            backgroundColor: bgColor
          }}
        >
          {nameObj.name}
          {nameObj.age ? (
            <span className="ml-1 text-[10px] text-[#87704e]">({nameObj.age}歲)</span>
          ) : null}
          {nameObj.is_trial && (
            <img
              src="/trial.png"
              alt="Trial"
              className="ml-1 w-4 h-4"
            />
          )}
        </button>
        {(lessonIsTodayOrPast && lesson?.lesson_status) ? (
          <button
            onClick={() => setPopupInfo({ lessonId: lesson.id })}
            className={
              statusBtnClass + ' ' + (
                lesson.lesson_status === '出席' ? 'bg-[#DFFFD6] text-green-800' :
                lesson.lesson_status === '缺席' ? 'bg-[#FFC1C1] text-red-700' :
                (lesson.lesson_status === '病假' || lesson.lesson_status === '事假') ? 'bg-[#FFE5B4] text-yellow-700' :
                'bg-gray-200 text-gray-600'
              )
            }
          >
            {lesson.lesson_status}
          </button>
        ) : (
          lessonIsTodayOrPast && !nameObj.is_trial && lesson && (
            <button
              onClick={() => setPopupInfo({ lessonId: lesson.id })}
              className={unsetBtnClass}
              title="設定出席狀態"
            >
              未設定
            </button>
          )
        )}
      </div>
    );
  };

  const handleEdit = (lesson: Lesson) => {
    setStatusPopupOpen(null);
    setPopupInfo(null);
    setSelectedDetail({
      date: new Date(lesson.lesson_date),
      groups: [
        {
          time: lesson.regular_timeslot,
          course: lesson.course_type,
          names: [
            {
              name: lesson.full_name,
              student_id: lesson.student_id,
              age: lesson.is_trial ? (lesson.age_display ? String(parseInt(lesson.age_display)) : '') : getStudentAge(lesson.student_id),
              is_trial: lesson.is_trial,
              remaining_lessons: lesson.remaining_lessons
            }
          ]
        }
      ]
    });
  };

  const handleAdd = () => {
    setStatusPopupOpen(null);
    setPopupInfo(null);
    setSelectedDetail(null);
  };

  useEffect(() => {
    const fetchSelectedDateTeachers = async () => {
      const supabase = getSupabaseClient();
      const selectedDateStr = getDateString(currentDate); // 使用現有的 getDateString 函數
      const { data, error } = await supabase
        .from('teacher_schedule')
        .select(`
          id,
          start_time,
          end_time,
          hanami_employee:teacher_id (teacher_nickname)
        `)
        .eq('scheduled_date', selectedDateStr);
      if (!error && data) {
        const list: {name: string, start: string, end: string}[] = [];
        data.forEach((row: any) => {
          if (row.hanami_employee && row.hanami_employee.teacher_nickname && row.start_time && row.end_time) {
            list.push({ name: row.hanami_employee.teacher_nickname, start: row.start_time, end: row.end_time });
          }
        });
        setSelectedDateTeachers(list);
      }
    };
    fetchSelectedDateTeachers();
  }, [currentDate]);

  return (
    <div className="bg-[#FFFDF8] p-4 rounded-xl shadow-md">
      <div className="flex flex-wrap gap-2 items-center mb-4 overflow-x-auto">
        <button
          onClick={handlePrev}
          className="hanami-btn-cute w-fit min-w-0 max-w-[56px] sm:max-w-[80px] sm:px-3 px-2 sm:text-base text-sm flex-shrink-0 overflow-hidden"
        >{'◀'}</button>
        {view === 'day' ? (
          <input
            type="date"
            value={getDateString(currentDate)}
            onChange={(e) => {
              const [year, month, day] = e.target.value.split('-').map(Number);
              const newDate = getHongKongDate(new Date(year, month - 1, day));
              setCurrentDate(newDate);
            }}
            className="border-2 border-[#EAC29D] px-3 py-2 rounded-full w-[120px] bg-white focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200"
            style={{ minWidth: '100px' }}
          />
        ) : (
          <span className="font-semibold w-fit min-w-0 max-w-[120px] truncate text-[#4B4036]">{formatDate(currentDate)}</span>
        )}
        <button
          onClick={handleNext}
          className="hanami-btn-cute w-fit min-w-0 max-w-[56px] sm:max-w-[80px] sm:px-3 px-2 sm:text-base text-sm flex-shrink-0 overflow-hidden"
        >{'▶'}</button>
        <button onClick={() => setView('day')} className={`hanami-btn w-fit min-w-0 max-w-[56px] sm:max-w-[80px] sm:px-3 px-2 sm:text-base text-sm flex-shrink-0 overflow-hidden ${view === 'day' ? 'hanami-btn' : 'hanami-btn-soft'}`}>日</button>
        <button onClick={() => setView('week')} className={`hanami-btn w-fit min-w-0 max-w-[56px] sm:max-w-[80px] sm:px-3 px-2 sm:text-base text-sm flex-shrink-0 overflow-hidden ${view === 'week' ? 'hanami-btn' : 'hanami-btn-soft'}`}>週</button>
        <button onClick={() => setView('month')} className={`hanami-btn w-fit min-w-0 max-w-[56px] sm:max-w-[80px] sm:px-3 px-2 sm:text-base text-sm flex-shrink-0 overflow-hidden ${view === 'month' ? 'hanami-btn' : 'hanami-btn-soft'}`}>月</button>
        <button
          onClick={async () => {
            lessonsFetchedRef.current = false;
            loadingRef.current = false;
            setIsLoading(true);
            const newDate = new Date(currentDate);
            setCurrentDate(newDate);
            const btn = document.getElementById('refresh-btn');
            if (btn) {
              btn.classList.add('animate-spin');
              setTimeout(() => btn.classList.remove('animate-spin'), 1000);
            }
          }}
          id="refresh-btn"
          className="hanami-btn-soft w-fit min-w-0 max-w-[56px] sm:max-w-[80px] sm:px-3 px-2 sm:text-base text-sm flex-shrink-0 overflow-hidden ml-2"
          title="刷新資料"
        >
          <img src="/refresh.png" alt="Refresh" className="w-4 h-4" />
        </button>
      </div>
      {/* 選擇日期上班老師圓角按鈕區塊 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedDateTeachers.length > 0 ? (
          selectedDateTeachers.map((item, idx) => (
            <button
              key={idx}
              className="rounded-full bg-[#FFF7D6] text-[#4B4036] px-4 py-2 shadow-md font-semibold text-sm hover:bg-[#FFE5B4] transition-all duration-150"
              onClick={() => {
                window.location.href = `/admin/teachers/teacher-schedule?teacher_name=${encodeURIComponent(item.name)}`;
              }}
            >
              {item.name}（{item.start.slice(0,5)}~{item.end.slice(0,5)}）
            </button>
          ))
        ) : (
          <span className="text-[#A68A64]">{getDateString(currentDate)} 無上班老師</span>
        )}
      </div>
      <div className="mt-4">
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8 border-[#EBC9A4] text-[#EBC9A4]" />
            <span className="ml-2 text-[#4B4036]">載入中...</span>
          </div>
        )}
        {!isLoading && view === 'day' && (
          (() => {
            const dateStr = getDateString(currentDate);
            const holiday = isHoliday(dateStr);
            return (
              <div
                className="relative space-y-2"
                style={{
                  backgroundColor: holiday ? '#FFF0F0' : undefined,
                  border: holiday ? '1px solid #FFB3B3' : undefined
                }}
              >
                {/* 印章圖示 */}
                {holiday && (
                  <img
                    src="/closed.png"
                    alt="休息日"
                    className="absolute top-1 right-1 w-4 h-4"
                  />
                )}
                {(() => {
                  const filteredLessons = lessons.filter(l => {
                    const lessonDateStr = l.lesson_date;
                    const currentDateStr = getDateString(currentDate);
                    return lessonDateStr === currentDateStr;
                  });
                  if (filteredLessons.length === 0) {
                    return (
                      <div className="text-center text-[#A68A64] py-8">
                        今日沒有課堂
                      </div>
                    );
                  }
                  // group by time+course
                  const grouped = filteredLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
                    const key = `${l.regular_timeslot}_${l.course_type}`;
                    if (!acc[key]) {
                      acc[key] = {
                        time: l.regular_timeslot,
                        course: l.course_type,
                        lessons: []
                      };
                    }
                    acc[key].lessons.push(l);
                    return acc;
                  }, {});
                  // 以課堂時間排序
                  const groupedArray: GroupedLesson[] = Object.values(grouped) as GroupedLesson[];
                  groupedArray.sort((a, b) => a.time.localeCompare(b.time));
                  return groupedArray.map((g, i) => {
                    const endTime = (() => {
                      const [h, m] = g.time.split(':').map(Number);
                      let duration = 45;
                      if (g.course === '音樂專注力') duration = 60;
                      const end = getHongKongDate();
                      end.setHours(h, m + duration);
                      return end.toTimeString().slice(0, 5);
                    })();
                    return (
                      <div key={`${g.time}-${g.course}-${i}`} className="border-l-2 pl-4">
                        <div className="text-[#4B4036] font-bold">
                          {g.time.slice(0,5)}-{endTime} {g.course} ({g.lessons.length})
                        </div>
                        <div className="ml-4 text-sm text-[#4B4036]">
                          {g.lessons.map((lesson: Lesson, j: number) => {
                          let age = '';
                          if (lesson.is_trial) {
                            age = lesson.age_display ? String(parseInt(lesson.age_display)) : '';
                          } else {
                            age = getStudentAge(lesson.student_id);
                          }
                          const nameObj = {
                            name: lesson.full_name,
                            student_id: lesson.student_id,
                            age,
                            is_trial: lesson.is_trial
                          };
                          return (
                            <div key={`${lesson.id}-${j}`}>
                              {renderStudentButton(nameObj, lesson)}
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })()
        )}

        {!isLoading && view === 'week' && (
          <div className="grid grid-cols-7 gap-2">
            {(() => {
              const weekStart = getHongKongDate(currentDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              return Array.from({ length: 7 }, (_, i) => {
                const date = getHongKongDate(weekStart);
                date.setDate(date.getDate() + i);
                const dateStr = getDateString(date);
                const holiday = isHoliday(dateStr);
                const dayLessons = lessons.filter(l => {
                  const lessonDate = getHongKongDate(new Date(l.lesson_date));
                  return lessonDate.getFullYear() === date.getFullYear() &&
                         lessonDate.getMonth() === date.getMonth() &&
                         lessonDate.getDate() === date.getDate();
                });
                // group by time+course
                const grouped = dayLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
                  const key = `${l.regular_timeslot}_${l.course_type}`;
                  if (!acc[key]) {
                    acc[key] = {
                      time: l.regular_timeslot,
                      course: l.course_type,
                      lessons: []
                    };
                  }
                  acc[key].lessons.push(l);
                  return acc;
                }, {});
                const groupedArray = Object.values(grouped) as GroupedLesson[];
                groupedArray.sort((a, b) => a.time.localeCompare(b.time));
                return (
                  <div
                    key={i}
                    className="relative p-2 rounded-xl text-center text-[#4B4036] text-sm"
                    style={{
                      backgroundColor: holiday ? '#FFF0F0' : undefined,
                      border: holiday ? '1px solid #FFB3B3' : undefined
                    }}
                  >
                    {/* 印章圖示 */}
                    {holiday && (
                      <img
                        src="/closed.png"
                        alt="休息日"
                        className="absolute top-1 right-1 w-4 h-4"
                      />
                    )}
                    <div>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}</div>
                    {groupedArray.map((g, j) => (
                        <div
                          key={j}
                        className="text-xs mt-1 rounded-xl p-1 cursor-pointer hover:bg-[#FFE5B4]"
                        style={{
                          backgroundColor:
                            g.course === '音樂專注力'
                              ? '#D1E7DD'
                              : g.course === '鋼琴'
                              ? '#CCE5FF'
                              : '#F3EAD9'
                        }}
                        onClick={() => {
                          // 點擊時 setSelectedDetail，彈窗顯示學生
                          setSelectedDetail({
                            date,
                            groups: [
                              {
                                time: g.time,
                                course: g.course,
                                names: g.lessons.map(lesson => ({
                                  name: lesson.full_name,
                                  student_id: lesson.student_id,
                                  age: lesson.is_trial ? (lesson.age_display ? String(parseInt(lesson.age_display)) : '') : getStudentAge(lesson.student_id),
                                  is_trial: lesson.is_trial,
                                  remaining_lessons: lesson.remaining_lessons
                                }))
                              }
                            ]
                          });
                        }}
                        >
                        <div className="font-bold">{g.time.slice(0, 5)} {g.course} ({g.lessons.length})</div>
                        </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {!isLoading && view === 'month' && (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} className="font-bold text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const firstDayOfWeek = getHongKongDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)).getDay();
                const daysInMonth = getHongKongDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)).getDate();
                const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
                return Array.from({ length: totalCells }, (_, idx) => {
                  const dayNum = idx - firstDayOfWeek + 1;
                  if (idx < firstDayOfWeek || dayNum > daysInMonth) {
                    return <div key={idx} />; // 空格
                  }
                  const date = getHongKongDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum));
                  const dateStr = getDateString(date);
                  const holiday = isHoliday(dateStr);
                  const dayLessons = lessons.filter(l => {
                    const lessonDate = getHongKongDate(new Date(l.lesson_date));
                    return lessonDate.getFullYear() === date.getFullYear() &&
                           lessonDate.getMonth() === date.getMonth() &&
                           lessonDate.getDate() === date.getDate();
                  });
                  // group by time+course
                  const grouped = dayLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
                    const key = `${l.regular_timeslot}_${l.course_type}`;
                    if (!acc[key]) {
                      acc[key] = {
                        time: l.regular_timeslot,
                        course: l.course_type,
                        lessons: []
                      };
                  }
                    acc[key].lessons.push(l);
                    return acc;
                  }, {});
                  const groupedArray = Object.values(grouped) as GroupedLesson[];
                  groupedArray.sort((a, b) => a.time.localeCompare(b.time));
                  // 統一休息日底色與邊框
                  let bgColor;
                  if (holiday) {
                    bgColor = '#FFF0F0';
                  } else {
                    bgColor = '#F3EAD9'; // 月曆格子統一用預設色，不分課程類型
                  }
                  return (
                    <div
                      key={idx}
                      className="relative p-2 rounded-xl text-center text-[#4B4036] text-sm cursor-pointer"
                      style={{
                        backgroundColor: bgColor,
                        border: holiday ? '1px solid #FFB3B3' : undefined
                      }}
                      onClick={() => {
                        // 點擊格子時 setSelectedDetail，彈窗顯示該天所有班別與學生
                        setSelectedDetail({
                          date,
                          groups: groupedArray.map(g => ({
                            time: g.time,
                            course: g.course,
                            names: g.lessons.map(lesson => ({
                              name: lesson.full_name,
                              student_id: lesson.student_id,
                              age: lesson.is_trial ? (lesson.age_display ? String(parseInt(lesson.age_display)) : '') : getStudentAge(lesson.student_id),
                              is_trial: lesson.is_trial,
                              remaining_lessons: lesson.remaining_lessons
                            }))
                          }))
                        });
                      }}
                    >
                      {/* 印章圖示 */}
                      {holiday && (
                        <img
                          src="/closed.png"
                          alt="休息日"
                          className="absolute top-1 right-1 w-4 h-4"
                        />
                      )}
                      <div>{dayNum}</div>
                      {groupedArray.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1">
                          {groupedArray.map((g, gi) => {
                            // 計算該 group 的剩餘堂數總和
                            const totalRemaining = g.lessons
                              .filter(l => !l.is_trial && typeof l.remaining_lessons === 'number')
                              .reduce((sum, l) => sum + (l.remaining_lessons ?? 0), 0);
                            return (
                              <div key={gi} className="flex items-center justify-center gap-1 text-xs">
                                <span>{g.time?.slice(0,5) || ''} {g.course || ''}</span>
                                <span
                                  style={totalRemaining === 0 ? { color: '#FF5A5A', fontWeight: 'bold' } : { color: '#A68A64' }}
                                >
                                  剩餘{totalRemaining}堂
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </>
        )}
      </div>
      {popupInfo && (
        <PopupSelect
          title="選擇出席狀態"
          options={[
            { label: '出席', value: '出席' },
            { label: '缺席', value: '缺席' },
            { label: '病假', value: '病假' },
            { label: '事假', value: '事假' },
            { label: '未設定', value: '未設定' }
          ]}
          selected={popupSelected}
          onChange={(value) => setPopupSelected(value as string)}
          onConfirm={async () => {
            if (popupInfo.lessonId && popupSelected) {
              const success = await handleUpdateStatus(popupInfo.lessonId, popupSelected);
              if (success) {
                alert('已儲存更改！');
              }
            }
            setPopupInfo(null);
            setPopupSelected('');
          }}
          onCancel={() => {
            setPopupInfo(null);
            setPopupSelected('');
          }}
          mode="single"
        />
      )}
      {selectedDetail && (
        <div className="fixed inset-0 flex items-center justify-center z-30 overflow-y-auto">
          <div className="bg-[#FFFDF8] p-6 rounded-xl shadow-xl w-80 text-[#4B4036] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-2">
              {formatDate(selectedDetail.date)} 課堂學生
            </h3>
            <div className="space-y-2 text-sm">
              {selectedDetail.groups
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((group, idx) => {
                  // 課程結束時間計算
                  const endTime = (() => {
                    const [h, m] = group.time.split(':').map(Number);
                    let duration = 45;
                    if (group.course === '音樂專注力') duration = 60;
                    const end = getHongKongDate();
                    end.setHours(h, m + duration);
                    return end.toTimeString().slice(0, 5);
                  })();
                  return (
                    <div key={idx}>
                      <div className="font-bold">
                        {group.time.slice(0, 5)}-{endTime} {group.course} ({group.names.length})
                      </div>
                      <div className="flex flex-wrap gap-2 ml-2 mt-1">
                        {group.names.map((nameObj: any, j: number) => {
                          const lesson = lessons.find(
                            l =>
                              l.student_id === nameObj.student_id &&
                              l.regular_timeslot === group.time &&
                              l.course_type === group.course &&
                              getHongKongDate(new Date(l.lesson_date)).toDateString() === getHongKongDate(selectedDetail.date).toDateString()
                          );
                          return (
                            <div key={j} className="flex items-center">
                              {renderStudentButton(nameObj, lesson)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => setSelectedDetail(null)}
              className="mt-4 px-4 py-2 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036]"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HanamiCalendar;
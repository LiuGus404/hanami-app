import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { TrialLesson } from '@/types'

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
    remaining_lessons: number | null;
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
  names: {
    name: string;
    student_id: string;
    age: string;
    is_trial?: boolean;
    remaining_lessons?: number | null;
  }[];
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
    remaining_lessons: number;
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
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [popupInfo, setPopupInfo] = useState<{ lessonId: string } | null>(null);
  const [popupSelected, setPopupSelected] = useState<string>('');
  // 節日資料
  const [holidays, setHolidays] = useState<Holiday[]>([]);
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
    if (view === 'day') {
      // 查詢當天課堂
      const fetchDay = async () => {
        const dateStr = getDateString(currentDate);
        console.log('查詢日期:', dateStr);
        
        // 獲取常規學生的課堂，明確指定關聯關係
        const { data: regularLessonsData, error: regularLessonsError } = await supabase
          .from('hanami_student_lesson')
          .select(`
            *,
            Hanami_Students!hanami_student_lesson_student_id_fkey (
              full_name,
              student_age,
              remaining_lessons
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
          remaining_lessons: lesson.Hanami_Students?.remaining_lessons || null,
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

        // 分組處理
        const grouped = allLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
          const key = `${l.regular_timeslot}_${l.course_type}`;
          if (!acc[key]) {
            acc[key] = {
              time: l.regular_timeslot,
              course: l.course_type,
              names: []
            };
          }
          acc[key].names.push({
            name: l.full_name,
            student_id: l.student_id,
            age: l.is_trial ? (l.age_display ? String(parseInt(l.age_display)) : '') : getStudentAge(l.student_id),
            is_trial: l.is_trial,
            remaining_lessons: l.remaining_lessons
          });
          return acc;
        }, {});

        const groupedArray: GroupedLesson[] = Object.values(grouped);
        setSelectedDetail({ date: currentDate, groups: groupedArray });
      };
      fetchDay();
    } else if (view === 'week') {
      // 查詢當週課堂
      const fetchWeek = async () => {
        const weekStart = getHongKongDate(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = getHongKongDate(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekStartStr = getDateString(weekStart);
        const weekEndStr = getDateString(weekEnd);

        // 獲取常規學生的課堂，明確指定關聯關係
        const { data: regularLessonsData, error: regularLessonsError } = await supabase
          .from('hanami_student_lesson')
          .select(`
            *,
            Hanami_Students!hanami_student_lesson_student_id_fkey (
              full_name,
              student_age,
              remaining_lessons
            )
          `)
          .gte('lesson_date', weekStartStr)
          .lte('lesson_date', weekEndStr);

        // 獲取試堂學生的課堂
        const { data: trialLessonsData, error: trialLessonsError } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .gte('lesson_date', weekStartStr)
          .lte('lesson_date', weekEndStr);

        if (regularLessonsError) {
          console.error('Fetch regular lessons error:', regularLessonsError);
          return;
        }

        if (trialLessonsError) {
          console.error('Fetch trial lessons error:', trialLessonsError);
          return;
        }

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
          remaining_lessons: lesson.Hanami_Students?.remaining_lessons || null,
          is_trial: false
        }));

        // 處理試堂學生數據
        const processedTrialLessons = (trialLessonsData || []).map((trial: any) => ({
          id: trial.id,
          student_id: trial.id,
          lesson_date: trial.lesson_date,
          regular_timeslot: trial.actual_timeslot,
          course_type: trial.course_type,
          full_name: trial.full_name || '未命名學生',
          student_age: trial.student_age,
          lesson_status: null,
          is_trial: true
        }));

        // 合併常規和試堂學生的課堂
        let allLessons = [...processedRegularLessons, ...processedTrialLessons];
        setLessons(allLessons);

        // 獲取所有學生資料
        const { data: studentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age');

        if (studentsError) {
          console.error('Fetch students error:', studentsError);
          setStudents([]);
          return;
        }

        setStudents(studentsData || []);
      };
      fetchWeek();
    } else if (view === 'month') {
      // 查詢當月課堂
      const fetchMonth = async () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const monthStartStr = getDateString(monthStart);
        const monthEndStr = getDateString(monthEnd);

        // 獲取常規學生的課堂，明確指定關聯關係
        const { data: regularLessonsData, error: regularLessonsError } = await supabase
          .from('hanami_student_lesson')
          .select(`
            *,
            Hanami_Students!hanami_student_lesson_student_id_fkey (
              full_name,
              student_age,
              remaining_lessons
            )
          `)
          .gte('lesson_date', monthStartStr)
          .lte('lesson_date', monthEndStr);

        // 獲取試堂學生的課堂
        const { data: trialLessonsData, error: trialLessonsError } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .gte('lesson_date', monthStartStr)
          .lte('lesson_date', monthEndStr);

        if (regularLessonsError) {
          console.error('Fetch regular lessons error:', regularLessonsError);
          return;
        }
        if (trialLessonsError) {
          console.error('Fetch trial lessons error:', trialLessonsError);
          return;
        }

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
          remaining_lessons: lesson.Hanami_Students?.remaining_lessons || null,
          is_trial: false
        }));

        // 處理試堂學生數據
        const processedTrialLessons = (trialLessonsData || []).map((trial: any) => ({
          id: trial.id,
          student_id: trial.id,
          lesson_date: trial.lesson_date,
          regular_timeslot: trial.actual_timeslot,
          course_type: trial.course_type,
          full_name: trial.full_name || '未命名學生',
          student_age: trial.student_age,
          lesson_status: null,
          is_trial: true
        }));

        // 合併常規和試堂學生的課堂
        let allLessons = [...processedRegularLessons, ...processedTrialLessons];
        setLessons(allLessons);

        // 獲取所有學生資料
        const { data: studentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age');

        if (studentsError) {
          console.error('Fetch students error:', studentsError);
          setStudents([]);
          return;
        }

        setStudents(studentsData || []);
      };
      fetchMonth();
    } else {
      // 其他 view 不查詢
      setLessons([]);
      setStudents([]);
    }
  }, [view, currentDate]);

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
      setSelectedDetail(null);
      return;
    }

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
      remaining_lessons: lesson.Hanami_Students?.remaining_lessons || null,
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
          names: []
        };
      }
      acc[key].names.push({
        name: l.full_name,
        student_id: l.student_id,
        age: l.is_trial ? (l.age_display ? String(parseInt(l.age_display)) : '') : getStudentAge(l.student_id),
        is_trial: l.is_trial,
        remaining_lessons: l.remaining_lessons
      });
      return acc;
    }, {});

    const groupedArray: GroupedLesson[] = Object.values(grouped);
    setSelectedDetail({ date, groups: groupedArray });
  };

  const handleUpdateStatus = async (lessonId: string, status: string) => {
    const { error } = await supabase
      .from('hanami_student_lesson')
      .update({ lesson_status: status })
      .eq('id', lessonId);
    if (error) {
      console.error('Update lesson status error:', error);
      return;
    }
    // Refresh lessons for current view and date range
    let start: Date, end: Date;
    if (view === 'day') {
      start = new Date(currentDate);
      end = new Date(currentDate);
    } else if (view === 'week') {
      start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else {
      // for month or others, just fetch empty or do nothing
      return;
    }
    await fetchLessons(start, end);
    // alert('狀態已成功更新！'); // 刪除這行
  };

  // Helper: check if date string is today or in the past (date portion only)
  const isPastOrToday = (dateStr: string) => {
    const date = getHongKongDate(new Date(dateStr));
    const today = getHongKongDate();
    date.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return date <= today;
  };

  const firstDayOfWeek = getHongKongDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)).getDay();

  const daysInMonth = getHongKongDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)).getDate();

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

    return (
      <div className="flex items-center">
        <button
          onClick={() => window.location.href = `/admin/students/${nameObj.student_id}`}
          className={`inline-block px-2 py-1 m-1 rounded-full text-[#4B4036] text-xs hover:bg-[#d0ab7d] transition flex items-center`}
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
            className={`ml-2 px-2 py-0.5 rounded text-xs hover:opacity-80 transition ${
              lesson.lesson_status === '出席' ? 'bg-[#DFFFD6]' :
              lesson.lesson_status === '缺席' ? 'bg-[#FFC1C1]' :
              (lesson.lesson_status === '病假' || lesson.lesson_status === '事假') ? 'bg-[#FFE5B4]' :
              'bg-gray-200'
            }`}
          >
            {lesson.lesson_status}
          </button>
        ) : (
          lessonIsTodayOrPast && !nameObj.is_trial && lesson && (
            <button
              onClick={() => setPopupInfo({ lessonId: lesson.id })}
              className="ml-2 px-1 py-0.5 rounded bg-green-400 text-white text-xs"
              title="設定出席狀態"
            >
              ⚙️
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#FFFDF8] p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button onClick={handlePrev} className="px-2 py-1 bg-[#EBC9A4] rounded-full">{'◀'}</button>
          {view === 'day' ? (
            <input
              type="date"
              value={getDateString(currentDate)}
              onChange={(e) => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                const newDate = getHongKongDate(new Date(year, month - 1, day));
                setCurrentDate(newDate);
              }}
              className="border px-2 py-1 rounded"
              style={{ width: '120px' }}
            />
          ) : (
            <span className="font-semibold">{formatDate(currentDate)}</span>
          )}
          <button onClick={handleNext} className="px-2 py-1 bg-[#EBC9A4] rounded-full">{'▶'}</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('day')} className={`px-3 py-1 rounded-full border ${view === 'day' ? 'bg-[#EBC9A4]' : 'bg-white border-[#EBC9A4]'}`}>日</button>
          <button onClick={() => setView('week')} className={`px-3 py-1 rounded-full border ${view === 'week' ? 'bg-[#EBC9A4]' : 'bg-white border-[#EBC9A4]'}`}>週</button>
          <button onClick={() => setView('month')} className={`px-3 py-1 rounded-full border ${view === 'month' ? 'bg-[#EBC9A4]' : 'bg-white border-[#EBC9A4]'}`}>月</button>
        </div>
      </div>

      {/* 刷新按鈕靠右，位於日週月按鈕下方，與日週月按鈕樣式一致 */}
      <div className="flex justify-end mb-2">
        <button
          disabled
          className={`px-3 py-1 rounded-full border bg-white border-[#EBC9A4] opacity-60 cursor-default`}
        >
          學生: {lessons.filter(l => !l.is_trial).length}
        </button>
        <button
          disabled
          className={`px-3 py-1 rounded-full border bg-white border-[#EBC9A4] opacity-60 cursor-default ml-2`}
        >
          試堂: {lessons.filter(l => l.is_trial).length}
        </button>
        {view !== 'month' && (
          <button
            disabled
            className={`px-3 py-1 rounded-full border bg-white border-[#EBC9A4] opacity-60 cursor-default ml-2`}
          >
            剩1堂: {lessons.filter(l => l.remaining_lessons === 1).length}
          </button>
        )}
        <button
          onClick={async () => {
            const start = new Date(currentDate);
            const end = new Date(currentDate);
            if (view === 'week') {
              start.setDate(start.getDate() - start.getDay());
              end.setDate(start.getDate() + 6);
            }
            await fetchLessons(start, end);
            const btn = document.getElementById('refresh-btn');
            if (btn) {
              btn.classList.add('animate-spin');
              setTimeout(() => btn.classList.remove('animate-spin'), 1000);
            }
          }}
          id="refresh-btn"
          className={`px-3 py-1 rounded-full border bg-white border-[#EBC9A4] ml-2`}
          title="刷新資料"
        >
          <img src="/refresh.png" alt="Refresh" className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4">
        {view === 'day' && (
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
                  console.log('當前課堂數據:', lessons);
                  const filteredLessons = lessons.filter(l => {
                    const lessonDateStr = l.lesson_date;
                    const currentDateStr = getDateString(currentDate);
                    console.log('比較日期:', { lessonDateStr, currentDateStr });
                    return lessonDateStr === currentDateStr;
                  });
                  console.log('過濾後的課堂:', filteredLessons);

                  if (filteredLessons.length === 0) {
                    return (
                      <div className="text-center text-[#A68A64] py-8">
                        今日沒有課堂
                      </div>
                    );
                  }

                  const grouped = filteredLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
                    const key = `${l.regular_timeslot}_${l.course_type}`;
                    if (!acc[key]) {
                      acc[key] = {
                        time: l.regular_timeslot,
                        course: l.course_type,
                        names: []
                      };
                    }
                    acc[key].names.push({
                      name: l.full_name,
                      student_id: l.student_id,
                      age: l.is_trial ? (l.age_display ? String(parseInt(l.age_display)) : '') : getStudentAge(l.student_id),
                      is_trial: l.is_trial,
                      remaining_lessons: l.remaining_lessons
                    });
                    return acc;
                  }, {});

                  const groupedArray: GroupedLesson[] = Object.values(grouped);
                  console.log('分組後的課堂:', groupedArray);

                  return groupedArray.map((g) => {
                    return (
                      <div
                        key={`${g.time}-${g.course}`}
                        className={`p-2 rounded-lg cursor-pointer ${
                          g.course === '鋼琴' ? '#E1E8F0' :
                          g.course === '音樂專注力' ? '#E9F2DA' :
                          '#F0F0F0'
                        }`}
                        onClick={async () => await handleOpenDetail(currentDate, g.course, g.time)}
                      >
                        <div className="font-bold">{g.time.slice(0, 5)} {g.course} ({g.names.length})</div>
                        {g.names.map((nameObj, j) => (
                          <div key={j}>{renderStudentButton(nameObj)}</div>
                        ))}
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })()
        )}

        {view === 'week' && (
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
                const grouped = dayLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
                  const key = `${l.regular_timeslot}_${l.course_type}`;
                  if (!acc[key]) {
                    acc[key] = {
                      time: l.regular_timeslot,
                      course: l.course_type,
                      names: []
                    };
                  }
                  acc[key].names.push({
                    name: l.full_name,
                    student_id: l.student_id,
                    age: l.is_trial ? (l.age_display ? String(parseInt(l.age_display)) : '') : getStudentAge(l.student_id),
                    is_trial: l.is_trial,
                    remaining_lessons: l.remaining_lessons
                  });
                  return acc;
                }, {});
                const groupedArray: GroupedLesson[] = Object.values(grouped);
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
                    {groupedArray.map((g) => (
                      <div
                        key={`${g.time}-${g.course}`}
                        className={`p-2 rounded-lg cursor-pointer ${
                          g.course === '鋼琴' ? '#E1E8F0' :
                          g.course === '音樂專注力' ? '#E9F2DA' :
                          '#F0F0F0'
                        }`}
                        onClick={async () => await handleOpenDetail(date, g.course, g.time)}
                      >
                        <div className="font-bold">{g.time.slice(0, 5)} {g.course} ({g.names.length})</div>
                        {g.names.map((nameObj, j) => (
                          <div key={j}>{renderStudentButton(nameObj)}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {view === 'month' && (
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
                  const grouped = dayLessons.reduce((acc: Record<string, GroupedLesson>, l: Lesson) => {
                    const key = `${l.regular_timeslot}_${l.course_type}`;
                    if (!acc[key]) {
                      acc[key] = {
                        time: l.regular_timeslot,
                        course: l.course_type,
                        names: []
                      };
                    }
                    acc[key].names.push({
                      name: l.full_name,
                      student_id: l.student_id,
                      age: l.is_trial ? (l.age_display ? String(parseInt(l.age_display)) : '') : getStudentAge(l.student_id),
                      is_trial: l.is_trial,
                      remaining_lessons: l.remaining_lessons
                    });
                    return acc;
                  }, {});
                  const groupedArray: GroupedLesson[] = Object.values(grouped);
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
                      onClick={async () => await handleOpenDetail(date)}
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
                      {groupedArray.map((g) => (
                        <div key={`${g.time}-${g.course}`}>
                          {g.names.map((nameObj, j) => (
                            <div key={j}>{renderStudentButton(nameObj)}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>
          </>
        )}
      </div>
      {selectedDetail && (
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
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
                    // setMinutes handles overflow, so add duration to m
                    end.setHours(h, m + duration);
                    return end.toTimeString().slice(0, 5);
                  })();
                  return (
                    <div key={idx}>
                      <div className="font-bold">
                        {group.time.slice(0, 5)}-{endTime} {group.course} ({group.names.length})
                      </div>
                      <div className="flex flex-wrap gap-2 ml-2 mt-1">
                        {group.names.map((nameObj, j) => {
                          const lesson = lessons.find(
                            l =>
                              l.student_id === nameObj.student_id &&
                              l.regular_timeslot === group.time &&
                              l.course_type === group.course &&
                              getHongKongDate(new Date(l.lesson_date)).toDateString() === getHongKongDate(selectedDetail.date).toDateString()
                          );
                          const lessonStatus = lesson?.lesson_status;
                          const isPastOrTodayDay = isPastOrToday(selectedDetail.date.toISOString());
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
      {popupInfo && (
        <PopupSelect
          title="選擇出席狀態"
          options={[
            { label: '出席', value: '出席' },
            { label: '缺席', value: '缺席' },
            { label: '病假', value: '病假' },
            { label: '事假', value: '事假' }
          ]}
          selected={popupSelected}
          onChange={(value) => {
            setPopupSelected(value as string);
          }}
          onConfirm={async () => {
            if (popupInfo.lessonId && popupSelected) {
              await handleUpdateStatus(popupInfo.lessonId, popupSelected);
              alert('已儲存更改！');
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
    </div>
  );
};

export default HanamiCalendar;
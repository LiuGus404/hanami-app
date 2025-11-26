'use client';

import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  UserIcon, 
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  ListBulletIcon,
  Squares2X2Icon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import { PopupSelect } from '@/components/ui/PopupSelect';
import TimePicker from '@/components/ui/TimePicker';
import { supabase } from '@/lib/supabase';

interface Teacher {
  id: string
  teacher_fullname: string | null
  teacher_nickname: string
}

interface Schedule {
  id: string
  teacher_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  created_at: string | null
  updated_at: string | null
  weekday?: string
  timeslot?: string
  max_students?: number
  current_students?: number
  duration?: string | null
}

interface Lesson {
  id: string
  lesson_date: string
  student_id: string | null
  regular_timeslot: string | null
  course_type: string | null
  Hanami_Students?: {
    id: string
    full_name: string
    student_age: number | null
  } | null
}

interface GroupedLesson {
  time: string | null;
  course: string | null;
  students: {
    name: string;
    student_id: string | null;
    age: string | null;
  }[];
}

interface SelectedDetail {
  date: Date
  teachers: Teacher[]
  groups: GroupedLesson[]
}

interface TeacherSchedule {
  teacher_id: string
  start_time: string
  end_time: string
}

interface DragSchedule {
  teacher_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  isNew?: boolean
  confirmed?: boolean
}

type TeacherSchedulePanelProps = {
  teacherIds?: string[]
  orgId?: string | null
  userEmail?: string | null // 用戶 email，用於 API 查詢繞過 RLS
}

export default function TeacherShiftCalendar({ teacherIds, orgId, userEmail }: TeacherSchedulePanelProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSchedule>({
    teacher_id: '',
    start_time: '09:00',
    end_time: '18:00',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('18:00');
  const [showTeacherPopup, setShowTeacherPopup] = useState(false);
  const [tempTeacherId, setTempTeacherId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showArrangeTeacher, setShowArrangeTeacher] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // 列表模式編輯狀態
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingScheduleTime, setEditingScheduleTime] = useState<{ start_time: string; end_time: string } | null>(null);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{ id: string; teacherId: string; date: string; teacherName: string } | null>(null);
  // 列表模式展開/收起狀態
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  // 日期詳情彈窗狀態
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);
  const [selectedDateDetail, setSelectedDateDetail] = useState<{ date: string; dateStr: string; teachers: Teacher[]; schedules: (Schedule | DragSchedule)[]; lessonCount: number } | null>(null);
  const [dragSchedules, setDragSchedules] = useState<DragSchedule[]>([]);
  const [draggedTeacher, setDraggedTeacher] = useState<Teacher | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  
  // 移動端檢測（包括平板和窄視窗）
  // 在 < 1024px (lg 斷點) 時使用移動端顯示方法
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 模態框引用
  const arrangeTeacherModalRef = useRef<HTMLDivElement>(null);
  const dateTeacherSelectModalRef = useRef<HTMLDivElement>(null);
  const singleTeacherScheduleModalRef = useRef<HTMLDivElement>(null);

  // 滑動手勢支持 - 切換月份
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // 滑動的最小距離（像素）
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // 只處理水平滑動，忽略垂直滑動（避免與頁面滾動衝突）
    if (!isVerticalSwipe) {
      if (isLeftSwipe) {
        handleNextMonth();
      } else if (isRightSwipe) {
        handlePrevMonth();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // 新增：日期選擇彈窗狀態
  const [showDateTeacherSelect, setShowDateTeacherSelect] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTeachersForDate, setSelectedTeachersForDate] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{
    start_time: string;
    end_time: string;
  }>({
    start_time: '09:00',
    end_time: '18:00',
  });

  // 新增：單個老師排班彈窗狀態
  const [showSingleTeacherSchedule, setShowSingleTeacherSchedule] = useState(false);
  const [selectedSingleTeacher, setSelectedSingleTeacher] = useState<Teacher | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');
  const [selectedScheduleTime, setSelectedScheduleTime] = useState<{
    start_time: string;
    end_time: string;
  }>({
    start_time: '09:00',
    end_time: '18:00',
  });

  // 當模態框打開時，自動滾動到可見位置（移動端）
  useEffect(() => {
    if (showArrangeTeacher && isMobile) {
      setTimeout(() => {
        // 滾動到頁面底部，確保模態框可見
        window.scrollTo({ 
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300); // 等待動畫完成
    }
  }, [showArrangeTeacher, isMobile]);

  useEffect(() => {
    if (showDateTeacherSelect && isMobile) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [showDateTeacherSelect, isMobile]);

  useEffect(() => {
    if (showSingleTeacherSchedule && isMobile) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [showSingleTeacherSchedule, isMobile]);

  useEffect(() => {
    if (showEditScheduleModal && isMobile) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [showEditScheduleModal, isMobile]);

  useEffect(() => {
    if (showDateDetailModal && isMobile) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [showDateDetailModal, isMobile]);

  // 提取資料獲取邏輯為可重用函數
  const fetchData = async () => {
    try {
      setErrorMsg(null);
      setErrorMsg(null);
      
      // Calculate month start and end
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

      // Fetch lessons for the month with student information
      // 參考 class-activities 頁面的實現，使用 API 端點繞過 RLS
      let regularLessonsData: any[] = [];
      let trialLessonsData: any[] = [];
      let regularLessonsError: any = null;
      let trialLessonsError: any = null;

      if (orgId) {
        // 使用新的 API 端點繞過 RLS（參考 /api/class-activities 的實現）
        try {
          const apiUrl = `/api/lessons/month?orgId=${encodeURIComponent(orgId)}&monthStart=${encodeURIComponent(monthStartStr)}&monthEnd=${encodeURIComponent(monthEndStr)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
          
          const lessonsResponse = await fetch(apiUrl, {
            credentials: 'include',
          });

          if (lessonsResponse.ok) {
            const lessonsData = await lessonsResponse.json();
            regularLessonsData = lessonsData.data?.regularLessons || [];
            trialLessonsData = lessonsData.data?.trialLessons || [];
            console.log('✅ [TeacherSchedulePanel] 通過 API 載入的課程數量:', {
              regular: regularLessonsData.length,
              trial: trialLessonsData.length,
              total: regularLessonsData.length + trialLessonsData.length
            });
          } else {
            const errorData = await lessonsResponse.json().catch(() => ({}));
            regularLessonsError = errorData;
            console.warn('⚠️ [TeacherSchedulePanel] API 查詢失敗，回退到直接查詢');
          }
        } catch (error) {
          regularLessonsError = error;
          console.warn('⚠️ [TeacherSchedulePanel] API 查詢異常，回退到直接查詢:', error);
        }
      }

      // 如果 API 查詢失敗或沒有提供 orgId，回退到直接查詢
      if (regularLessonsError || !orgId) {
        let lessonQuery = supabase
          .from('hanami_student_lesson')
          .select(`
            id,
            lesson_date,
            student_id,
            regular_timeslot,
            course_type,
            Hanami_Students!hanami_student_lesson_student_id_fkey (
              id,
              full_name,
              student_age
            )
          `)
          .gte('lesson_date', monthStartStr)
          .lte('lesson_date', monthEndStr);

        // 根據 org_id 過濾課程記錄
        if (orgId) {
          lessonQuery = lessonQuery.eq('org_id', orgId);
          console.log('✅ [TeacherSchedulePanel] 課程記錄查詢已添加 org_id 過濾:', orgId);
        } else {
          lessonQuery = lessonQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
          console.warn('⚠️ [TeacherSchedulePanel] orgId 為 null，課程記錄查詢將返回空結果');
        }
        
        const lessonResult = await lessonQuery;
        if (lessonResult.error) {
          regularLessonsError = lessonResult.error;
        } else {
          regularLessonsData = lessonResult.data || [];
        }
      }

      // 如果 API 查詢失敗，才需要查詢試堂學生
      if (trialLessonsError || !trialLessonsData.length) {
        let trialLessonQuery = supabase
          .from('hanami_trial_students')
          .select('id, lesson_date, full_name, student_age, actual_timeslot, course_type, org_id')
          .gte('lesson_date', monthStartStr)
          .lte('lesson_date', monthEndStr);

        // 根據 org_id 過濾試堂學生課程記錄
        if (orgId) {
          trialLessonQuery = trialLessonQuery.eq('org_id', orgId);
          console.log('✅ [TeacherSchedulePanel] 試堂課程記錄查詢已添加 org_id 過濾:', orgId);
        } else {
          trialLessonQuery = trialLessonQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
          console.warn('⚠️ [TeacherSchedulePanel] orgId 為 null，試堂課程記錄查詢將返回空結果');
        }
        
        const trialLessonResult = await trialLessonQuery;
        if (trialLessonResult.error) {
          trialLessonsError = trialLessonResult.error;
        } else {
          trialLessonsData = trialLessonResult.data || [];
        }
      }

      // Fetch schedules for the month
      let scheduleQuery = supabase
        .from('teacher_schedule')
        .select('id, teacher_id, scheduled_date, start_time, end_time, created_at, updated_at, org_id')
        .gte('scheduled_date', monthStartStr)
        .lte('scheduled_date', monthEndStr);

      // 根據 org_id 過濾排班記錄
      console.log('🔍 [TeacherSchedulePanel] fetchData - orgId:', orgId);
      if (orgId) {
        scheduleQuery = scheduleQuery.eq('org_id', orgId);
        console.log('✅ [TeacherSchedulePanel] 排班記錄查詢已添加 org_id 過濾:', orgId);
      } else {
        // 如果沒有 orgId，查詢一個不存在的 UUID 以確保不返回任何結果
        scheduleQuery = scheduleQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
        console.warn('⚠️ [TeacherSchedulePanel] orgId 為 null，排班記錄查詢將返回空結果');
      }

      // Fetch teachers
      let teacherQuery = supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_nickname');

      // 根據 org_id 過濾老師
      if (orgId) {
        teacherQuery = teacherQuery.eq('org_id', orgId);
        console.log('✅ [TeacherSchedulePanel] 老師查詢已添加 org_id 過濾:', orgId);
      } else {
        // 如果沒有 orgId，查詢一個不存在的 UUID 以確保不返回任何結果
        teacherQuery = teacherQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
        console.warn('⚠️ [TeacherSchedulePanel] orgId 為 null，老師查詢將返回空結果');
      }

      if (teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*') {
        scheduleQuery = scheduleQuery.in('teacher_id', teacherIds);
        teacherQuery = teacherQuery.in('id', teacherIds);
      }

      console.log('🔍 [TeacherSchedulePanel] 執行並行查詢，orgId:', orgId);
      const [scheduleResult, teacherResult] = await Promise.all([
        scheduleQuery,
        teacherQuery,
      ]);
      
      console.log('📊 [TeacherSchedulePanel] 查詢結果:', {
        schedulesCount: scheduleResult.data?.length || 0,
        teachersCount: teacherResult.data?.length || 0,
        orgId
      });

      // Handle lesson data (參考 HanamiCalendar 的實現)
      const allLessons: Lesson[] = [];

      // 處理常規學生課程
      if (regularLessonsError) {
        console.warn('Warning fetching regular lessons:', regularLessonsError.message || regularLessonsError);
      } else if (regularLessonsData && regularLessonsData.length > 0) {
        // 類型轉換，確保 Hanami_Students 欄位型別正確
        const regularLessons: Lesson[] = regularLessonsData.map((l: any) => ({
          id: l.id,
          student_id: l.student_id || '',
          lesson_date: l.lesson_date || '',
          regular_timeslot: l.regular_timeslot || '',
          course_type: l.course_type || '',
          full_name: l.Hanami_Students?.full_name || '未命名學生',
          student_age: l.Hanami_Students?.student_age || null,
          lesson_status: null,
          remaining_lessons: null,
          is_trial: false,
          Hanami_Students: l.Hanami_Students && Array.isArray(l.Hanami_Students)
            ? l.Hanami_Students[0]
            : l.Hanami_Students,
        }));
        allLessons.push(...regularLessons);
      }

      // 處理試堂學生課程
      if (trialLessonsError) {
        console.warn('Warning fetching trial lessons:', trialLessonsError.message || trialLessonsError);
      } else if (trialLessonsData && trialLessonsData.length > 0) {
        const trialLessons: Lesson[] = trialLessonsData.map((trial: any) => ({
          id: trial.id,
          student_id: trial.id, // 試堂學生使用自己的 id 作為 student_id
          lesson_date: trial.lesson_date || '',
          regular_timeslot: trial.actual_timeslot || '',
          course_type: trial.course_type || '',
          full_name: trial.full_name || '未命名學生',
          student_age: trial.student_age || null,
          lesson_status: null,
          remaining_lessons: null,
          is_trial: true,
          Hanami_Students: null,
        }));
        allLessons.push(...trialLessons);
      }

      setLessons(allLessons);
      console.log('📊 [TeacherSchedulePanel] 載入的課程總數:', allLessons.length, 'orgId:', orgId);

      // Handle schedule data
      if (scheduleResult.error) {
        console.warn('Warning fetching schedules:', scheduleResult.error.message);
      } else if (scheduleResult.data) {
        console.log('📊 [TeacherSchedulePanel] 載入的排班記錄數量:', scheduleResult.data.length, 'orgId:', orgId);
        if (scheduleResult.data.length > 0) {
          // 檢查排班記錄的 org_id（如果查詢中包含）
          const sampleSchedule = scheduleResult.data[0] as any;
          console.log('📊 [TeacherSchedulePanel] 排班記錄示例:', {
            id: sampleSchedule.id,
            teacher_id: sampleSchedule.teacher_id,
            scheduled_date: sampleSchedule.scheduled_date,
            org_id: sampleSchedule.org_id
          });
        }
        setSchedules(scheduleResult.data as Schedule[]);
      } else {
        console.log('📊 [TeacherSchedulePanel] 沒有載入到任何排班記錄，orgId:', orgId);
      }

      // Handle teacher data
      if (teacherResult.error) {
        console.warn('Warning fetching teachers:', teacherResult.error.message);
      } else if (teacherResult.data) {
        console.log('📊 [TeacherSchedulePanel] 載入的老師數量:', teacherResult.data.length, 'orgId:', orgId);
        console.log('📊 [TeacherSchedulePanel] 載入的老師列表:', teacherResult.data.map((t: any) => ({ id: t.id, name: t.teacher_nickname || t.teacher_fullname })));
        setTeachers(teacherResult.data as Teacher[]);
      } else {
        console.log('📊 [TeacherSchedulePanel] 沒有載入到任何老師，orgId:', orgId);
      }

    } catch (error) {
      console.warn('Unexpected error in fetchData:', error);
      setErrorMsg('載入資料時發生錯誤，請重新整理頁面');
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, teacherIds, orgId]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Group schedules by date
  const schedulesByDate: Record<string, Teacher[]> = {};
  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const scheduledTeacherIds = schedules
      .filter(s => s.scheduled_date === dateStr)
      .map(s => s.teacher_id);
    const scheduledTeachers = teachers.filter(t => scheduledTeacherIds.includes(t.id));
    schedulesByDate[dateStr] = scheduledTeachers;
  });

  // Group lessons count by date - 計算每天的唯一學生數（不是課程數）
  // 參考 HanamiCalendar 的邏輯，使用 Set 去重 student_id
  const lessonsCountByDate: Record<string, number> = {};
  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    // 過濾當天的所有課程（包括常規和試堂）
    const dayLessons = lessons.filter(l => l.lesson_date === dateStr);
    // 使用 Set 去重 student_id，計算唯一學生數
    const uniqueStudentIds = new Set(
      dayLessons
        .map(l => l.student_id)
        .filter(Boolean) // 過濾掉 null 值
    );
    lessonsCountByDate[dateStr] = uniqueStudentIds.size;
    // 調試日誌：顯示當天的課程數和學生數
    if (dayLessons.length > 0) {
      console.log(`📊 [TeacherSchedulePanel] ${dateStr}: 課程數=${dayLessons.length}, 學生數=${uniqueStudentIds.size}`);
    }
  });

  // Helper to get teacher initials
  const getInitials = (name?: string | null): string => {
    if (!name || typeof name !== 'string') return '--';
    const trimmed = name.trim();
    if (!trimmed) return '--';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return parts.map(p => p[0]).join('').slice(0, 2);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle date cell click
  const handleDateClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    // 移動端：打開日期詳情彈窗
    if (isMobile) {
      const currentSchedules = editMode ? dragSchedules : filteredSchedules;
      const scheduledTeachers = currentSchedules
        .filter(s => s.scheduled_date === dateStr)
        .map(s => filteredTeachers.find(t => t.id === s.teacher_id))
        .filter(Boolean) as Teacher[];
      const dateSchedules = currentSchedules.filter(s => s.scheduled_date === dateStr);
      const lessonCount = lessonsCountByDate[dateStr] || 0;
      
      setSelectedDateDetail({
        date: format(day, 'yyyy年MM月dd日'),
        dateStr: dateStr,
        teachers: scheduledTeachers,
        schedules: dateSchedules,
        lessonCount: lessonCount,
      });
      setShowDateDetailModal(true);
      return;
    }
    
    // 設置選中的日期和初始化選擇
    setSelectedDate(dateStr);
    setSelectedTeachersForDate([]);
    setSelectedTimeRange({
      start_time: '09:00',
      end_time: '18:00',
    });
    
    // 顯示老師選擇彈窗
    setShowDateTeacherSelect(true);
  };

  // Handle save teacher schedule
  const handleSaveTeacherSchedule = async () => {
    if (!selectedDetail || !selectedTeacher.teacher_id) {
      setErrorMsg('請選擇老師');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const insertData: any = {
        teacher_id: selectedTeacher.teacher_id,
        scheduled_date: format(selectedDetail.date, 'yyyy-MM-dd'),
        start_time: selectedTeacher.start_time,
        end_time: selectedTeacher.end_time,
      };

      // 如果提供了 orgId，則包含它
      if (orgId) {
        insertData.org_id = orgId;
      }

      const { error } = await (supabase
        .from('teacher_schedule') as any)
        .insert(insertData as any);

      if (error) {
        console.warn('Error saving teacher schedule:', error.message);
        setErrorMsg(`儲存失敗：${error.message}`);
        return;
      }

      // Refresh schedules
      let refreshQuery = supabase
        .from('teacher_schedule')
        .select('*')
        .eq('scheduled_date', format(selectedDetail.date, 'yyyy-MM-dd'));

      // 根據 org_id 過濾
      if (orgId) {
        refreshQuery = refreshQuery.eq('org_id', orgId);
      }

      const { data: scheduleData, error: refreshError } = await refreshQuery;

      if (refreshError) {
        console.warn('Error refreshing schedules:', refreshError.message);
      } else if (scheduleData) {
        setSchedules(prev => [...prev.filter(s => s.scheduled_date !== format(selectedDetail.date, 'yyyy-MM-dd')), ...scheduleData as Schedule[]]);
      }

      setShowArrangeTeacher(false);
      setSelectedTeacher({ teacher_id: '', start_time: '09:00', end_time: '18:00' });
      setTempTeacherId('');

    } catch (error) {
      console.warn('Unexpected error saving teacher schedule:', error);
      setErrorMsg('儲存時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete teacher schedule
  const handleDeleteTeacherSchedule = async (teacherId: string) => {
    if (!selectedDetail) return;

    try {
      setErrorMsg(null);

      let deleteQuery = supabase
        .from('teacher_schedule')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('scheduled_date', format(selectedDetail.date, 'yyyy-MM-dd'));

      // 根據 org_id 過濾
      if (orgId) {
        deleteQuery = deleteQuery.eq('org_id', orgId);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.warn('Error deleting teacher schedule:', error.message);
        setErrorMsg(`刪除失敗：${error.message}`);
        return;
      }

      // Refresh schedules
      let refreshQuery = supabase
        .from('teacher_schedule')
        .select('*')
        .eq('scheduled_date', format(selectedDetail.date, 'yyyy-MM-dd'));

      // 根據 org_id 過濾
      if (orgId) {
        refreshQuery = refreshQuery.eq('org_id', orgId);
      }

      const { data: scheduleData, error: refreshError } = await refreshQuery;

      if (refreshError) {
        console.warn('Error refreshing schedules:', refreshError.message);
      } else if (scheduleData) {
        setSchedules(prev => [...prev.filter(s => s.scheduled_date !== format(selectedDetail.date, 'yyyy-MM-dd')), ...scheduleData as Schedule[]]);
      }

    } catch (error) {
      console.warn('Unexpected error deleting teacher schedule:', error);
      setErrorMsg('刪除時發生未預期的錯誤');
    }
  };

  // Export teacher schedule to CSV
  function exportTeacherCSV(teacher: Teacher): void {
    try {
      const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id);
      const csvContent = [
        ['日期', '開始時間', '結束時間'],
        ...teacherSchedules.map(s => [
          s.scheduled_date,
          s.start_time,
          s.end_time,
        ]),
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${teacher.teacher_nickname}_排班表.csv`;
      link.click();
    } catch (error) {
      console.warn('Error exporting CSV:', error);
      setErrorMsg('匯出失敗');
    }
  }

  // Copy teacher schedule as markdown
  function copyTeacherMarkdown(teacher: Teacher): void {
    try {
      const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id);
      const markdown = [
        `# ${teacher.teacher_nickname} 排班表`,
        '',
        '| 日期 | 開始時間 | 結束時間 |',
        '|------|----------|----------|',
        ...teacherSchedules.map(s => `| ${s.scheduled_date} | ${s.start_time} | ${s.end_time} |`),
      ].join('\n');

      navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.warn('Error copying markdown:', error);
      setErrorMsg('複製失敗');
    }
  }

  // 編輯模式處理函數
  const handleEditModeToggle = () => {
    if (editMode) {
      // 退出編輯模式，清空拖拽狀態
      setEditMode(false);
      setDragSchedules([]);
      setDraggedTeacher(null);
      setDragOverDate(null);
    } else {
      // 進入編輯模式，初始化拖拽排班
      setEditMode(true);
      setDragSchedules(schedules.map(s => ({
        teacher_id: s.teacher_id,
        scheduled_date: s.scheduled_date,
        start_time: s.start_time,
        end_time: s.end_time,
        confirmed: false,
      })));
    }
  };

  const handleTeacherDragStart = (teacher: Teacher) => {
    setDraggedTeacher(teacher);
  };

  // 自動滾動功能
  const handleAutoScroll = (e: React.DragEvent) => {
    const scrollThreshold = 80; // 距離邊緣多少像素開始滾動
    const scrollSpeed = 8; // 滾動速度
    
    const mouseY = e.clientY;
    const windowHeight = window.innerHeight;
    
    // 檢查是否接近頁面底部
    if (mouseY > windowHeight - scrollThreshold) {
      // 向下滾動
      window.scrollBy({
        top: scrollSpeed,
        behavior: 'smooth'
      });
    }
    // 檢查是否接近頁面頂部
    else if (mouseY < scrollThreshold) {
      // 向上滾動
      window.scrollBy({
        top: -scrollSpeed,
        behavior: 'smooth'
      });
    }
  };

  const handleTeacherDragEnd = () => {
    setDraggedTeacher(null);
    setDragOverDate(null);
  };

  const handleDateDragOver = (dateStr: string) => {
    setDragOverDate(dateStr);
  };

  const handleDateDrop = (dateStr: string) => {
    if (draggedTeacher) {
      const existingSchedule = dragSchedules.find(
        s => s.teacher_id === draggedTeacher.id && s.scheduled_date === dateStr,
      );
      
      if (!existingSchedule) {
        // 添加新排班
        setDragSchedules(prev => [...prev, {
          teacher_id: draggedTeacher.id,
          scheduled_date: dateStr,
          start_time: '09:00',
          end_time: '18:00',
          isNew: true,
          confirmed: false,
        }]);
        
        // 顯示成功提示
        setErrorMsg(null);
        setTimeout(() => {
          setErrorMsg(`${draggedTeacher.teacher_nickname} 已安排到 ${dateStr}，可調整時間`);
          setTimeout(() => setErrorMsg(null), 3000);
        }, 100);
      } else {
        setErrorMsg('該老師在此日期已有排班');
        setTimeout(() => setErrorMsg(null), 2000);
      }
    }
    setDraggedTeacher(null);
    setDragOverDate(null);
  };

  const handleScheduleDelete = (teacherId: string, dateStr: string) => {
    setDragSchedules(prev => prev.filter(s => 
      !(s.teacher_id === teacherId && s.scheduled_date === dateStr),
    ));
  };

  const handleScheduleConfirm = (teacherId: string, dateStr: string) => {
    console.log('確認按鈕被點擊:', teacherId, dateStr);
    // 確認該時段，可以添加視覺標記
    setDragSchedules(prev => {
      const updated = prev.map(s => 
        s.teacher_id === teacherId && s.scheduled_date === dateStr
          ? { ...s, confirmed: true }
          : s,
      );
      console.log('更新後的排班:', updated);
      return updated;
    });
    const teacherName = filteredTeachers.find(t => t.id === teacherId)?.teacher_nickname;
    setErrorMsg(`${teacherName} 的排班已確認`);
    setTimeout(() => setErrorMsg(null), 2000);
  };

  const handleScheduleCancel = (teacherId: string, dateStr: string) => {
    console.log('取消按鈕被點擊:', teacherId, dateStr);
    // 取消該時段
    setDragSchedules(prev => {
      const updated = prev.filter(s => 
        !(s.teacher_id === teacherId && s.scheduled_date === dateStr),
      );
      console.log('更新後的排班:', updated);
      return updated;
    });
    const teacherName = filteredTeachers.find(t => t.id === teacherId)?.teacher_nickname;
    setErrorMsg(`${teacherName} 的排班已取消`);
    setTimeout(() => setErrorMsg(null), 2000);
  };

  const handleScheduleTimeChange = (teacherId: string, dateStr: string, field: 'start_time' | 'end_time', value: string) => {
    setDragSchedules(prev => prev.map(s => 
      s.teacher_id === teacherId && s.scheduled_date === dateStr
        ? { ...s, [field]: value }
        : s,
    ));
  };

  // 處理老師選擇
  const handleTeacherSelection = (teacherId: string) => {
    setSelectedTeachersForDate(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  // 處理時間範圍變更
  const handleTimeRangeChange = (field: 'start_time' | 'end_time', value: string) => {
    setSelectedTimeRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 處理單個老師排班時間變更
  const handleSingleTeacherTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    setSelectedScheduleTime(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 處理單個老師排班
  const handleSingleTeacherSchedule = async () => {
    if (!selectedSingleTeacher) {
      setErrorMsg('請選擇老師');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 準備排班資料
      const scheduleData: any = {
        teacher_id: selectedSingleTeacher.id,
        scheduled_date: selectedScheduleDate,
        start_time: selectedScheduleTime.start_time,
        end_time: selectedScheduleTime.end_time,
      };

      // 如果提供了 orgId，則包含它
      if (orgId) {
        scheduleData.org_id = orgId;
      }

      // 先檢查是否已有該日期的排班
      let checkQuery = supabase
        .from('teacher_schedule')
        .select('*')
        .eq('teacher_id', selectedSingleTeacher.id)
        .eq('scheduled_date', selectedScheduleDate);

      // 根據 org_id 過濾
      if (orgId) {
        checkQuery = checkQuery.eq('org_id', orgId);
      }

      const { data: existingSchedule } = await checkQuery.single();

      if (existingSchedule) {
        // 更新現有排班
        let updateQuery = (supabase
          .from('teacher_schedule') as any)
          .update({
            start_time: selectedScheduleTime.start_time,
            end_time: selectedScheduleTime.end_time,
          } as any)
          .eq('teacher_id', selectedSingleTeacher.id)
          .eq('scheduled_date', selectedScheduleDate);

        // 根據 org_id 過濾
        if (orgId) {
          updateQuery = updateQuery.eq('org_id', orgId);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) {
          console.warn('Error updating schedule:', updateError.message);
          setErrorMsg(`更新排班失敗：${updateError.message}`);
          return;
        }
      } else {
        // 插入新排班
        const { error: insertError } = await (supabase
          .from('teacher_schedule') as any)
          .insert(scheduleData as any);

        if (insertError) {
          console.warn('Error inserting schedule:', insertError.message);
          setErrorMsg(`儲存排班失敗：${insertError.message}`);
          return;
        }
      }

      // 重新載入資料
      await fetchData();

      // 關閉彈窗並重置狀態
      setShowSingleTeacherSchedule(false);
      setSelectedSingleTeacher(null);
      setSelectedScheduleDate('');
      setSelectedScheduleTime({
        start_time: '09:00',
        end_time: '18:00',
      });

      setErrorMsg(`已成功安排 ${selectedSingleTeacher.teacher_nickname} 在 ${selectedScheduleDate} 的排班！`);
      setTimeout(() => setErrorMsg(null), 3000);

    } catch (error) {
      console.warn('Unexpected error in single teacher scheduling:', error);
      setErrorMsg('安排排班時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 處理老師排班按鈕點擊
  const handleTeacherScheduleClick = (teacher: Teacher) => {
    // 設置選中的老師和當前日期
    setSelectedSingleTeacher(teacher);
    setSelectedScheduleDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedScheduleTime({
      start_time: '09:00',
      end_time: '18:00',
    });
    
    // 顯示單個老師排班彈窗
    setShowSingleTeacherSchedule(true);
  };

  // 處理刪除老師排班
  const handleTeacherScheduleDelete = (teacher: Teacher) => {
    // 設置選中的老師
    setSelectedSingleTeacher(teacher);
    
    // 顯示刪除確認彈窗
    if (confirm(`確定要刪除 ${teacher.teacher_nickname} 的所有排班記錄嗎？\n\n此操作將刪除該老師的所有排班資料，無法復原。`)) {
      deleteTeacherAllSchedules(teacher.id);
    }
  };

  // 刪除老師所有排班記錄
  const deleteTeacherAllSchedules = async (teacherId: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 刪除該老師的所有排班記錄
      let deleteQuery = supabase
        .from('teacher_schedule')
        .delete()
        .eq('teacher_id', teacherId);

      // 根據 org_id 過濾
      if (orgId) {
        deleteQuery = deleteQuery.eq('org_id', orgId);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.warn('Error deleting teacher schedules:', deleteError.message);
        setErrorMsg(`刪除排班失敗：${deleteError.message}`);
        return;
      }

      // 重新載入資料
      await fetchData();

      setErrorMsg(`已成功刪除 ${teachers.find(t => t.id === teacherId)?.teacher_nickname} 的所有排班記錄！`);
      setTimeout(() => setErrorMsg(null), 3000);

    } catch (error) {
      console.warn('Unexpected error deleting teacher schedules:', error);
      setErrorMsg('刪除排班時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 刪除單個排班記錄
  const handleSingleScheduleDelete = (scheduleId: string, teacherName: string, scheduleDate: string) => {
    if (confirm(`確定要刪除 ${teacherName} 在 ${scheduleDate} 的排班記錄嗎？`)) {
      deleteSingleSchedule(scheduleId, teacherName, scheduleDate);
    }
  };

  // 編輯單個排班記錄 - 打開編輯彈窗
  const handleEditSchedule = (schedule: Schedule, teacher: Teacher) => {
    setEditingSchedule({
      id: schedule.id || '',
      teacherId: teacher.id,
      date: schedule.scheduled_date || '',
      teacherName: teacher.teacher_nickname || teacher.teacher_fullname || '',
    });
    setEditingScheduleTime({
      start_time: schedule.start_time?.slice(0, 5) || '09:00',
      end_time: schedule.end_time?.slice(0, 5) || '18:00',
    });
    setShowEditScheduleModal(true);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setShowEditScheduleModal(false);
    setEditingSchedule(null);
    setEditingScheduleTime(null);
  };

  // 保存編輯的排班
  const handleSaveEditSchedule = async () => {
    if (!editingSchedule || !editingScheduleTime) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      // 更新排班記錄
      let updateQuery = (supabase
        .from('teacher_schedule') as any)
        .update({
          start_time: editingScheduleTime.start_time,
          end_time: editingScheduleTime.end_time,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', editingSchedule.id);

      // 根據 org_id 過濾
      if (orgId) {
        updateQuery = updateQuery.eq('org_id', orgId);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) {
        console.warn('Error updating schedule:', updateError.message);
        setErrorMsg(`更新排班失敗：${updateError.message}`);
        return;
      }

      // 重新載入資料
      await fetchData();

      // 關閉彈窗並清除編輯狀態
      setShowEditScheduleModal(false);
      setEditingSchedule(null);
      setEditingScheduleTime(null);

      setErrorMsg('排班已成功更新！');
      setTimeout(() => setErrorMsg(null), 3000);

    } catch (error) {
      console.warn('Unexpected error updating schedule:', error);
      setErrorMsg('更新排班時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

    // 刪除單個排班記錄
  const deleteSingleSchedule = async (scheduleId: string, teacherName: string, scheduleDate: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 刪除指定的排班記錄
      let deleteQuery = supabase
        .from('teacher_schedule')
        .delete()
        .eq('id', scheduleId);

      // 根據 org_id 過濾
      if (orgId) {
        deleteQuery = deleteQuery.eq('org_id', orgId);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.warn('Error deleting single schedule:', deleteError.message);
        setErrorMsg(`刪除排班失敗：${deleteError.message}`);
        return;
      }

      // 重新載入資料
      await fetchData();

      setErrorMsg(`已成功刪除 ${teacherName} 在 ${scheduleDate} 的排班記錄！`);
      setTimeout(() => setErrorMsg(null), 3000);

    } catch (error) {
      console.warn('Unexpected error deleting single schedule:', error);
      setErrorMsg('刪除排班時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 處理批量安排老師排班
  const handleBatchScheduleTeachers = async () => {
    if (selectedTeachersForDate.length === 0) {
      setErrorMsg('請至少選擇一位老師');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 準備批量插入的資料
      const schedulesToInsert = selectedTeachersForDate.map(teacherId => ({
        teacher_id: teacherId,
        scheduled_date: selectedDate,
        start_time: selectedTimeRange.start_time,
        end_time: selectedTimeRange.end_time,
      }));

      // 先刪除該日期現有的排班（可選）
      let deleteQuery = supabase
        .from('teacher_schedule')
        .delete()
        .eq('scheduled_date', selectedDate)
        .in('teacher_id', selectedTeachersForDate);

      // 根據 org_id 過濾
      if (orgId) {
        deleteQuery = deleteQuery.eq('org_id', orgId);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.warn('Warning deleting existing schedules:', deleteError.message);
      }

      // 插入新的排班（添加 org_id）
      const schedulesWithOrgId = schedulesToInsert.map((schedule: any) => {
        if (orgId) {
          return { ...schedule, org_id: orgId };
        }
        return schedule;
      });

      const { error: insertError } = await (supabase
        .from('teacher_schedule') as any)
        .insert(schedulesWithOrgId as any);

      if (insertError) {
        console.warn('Error inserting schedules:', insertError.message);
        setErrorMsg(`儲存失敗：${insertError.message}`);
        return;
      }

      // 重新載入資料
      await fetchData();

      // 關閉彈窗並重置狀態
      setShowDateTeacherSelect(false);
      setSelectedTeachersForDate([]);
      setSelectedTimeRange({
        start_time: '09:00',
        end_time: '18:00',
      });

      setErrorMsg('排班安排成功！');
      setTimeout(() => setErrorMsg(null), 3000);

    } catch (error) {
      console.warn('Unexpected error in batch scheduling:', error);
      setErrorMsg('安排排班時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditMode = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 獲取當前月份的所有教師ID（包括已排班和未排班的）
      const allTeacherIds = new Set([
        ...filteredTeachers.map(t => t.id),
        ...schedules.map(s => s.teacher_id)
      ]);

      // 只刪除當前編輯的教師在當前月份的排班記錄
      const teacherIdsToUpdate = Array.from(allTeacherIds);
      
      if (teacherIdsToUpdate.length > 0) {
        let deleteQuery = supabase
          .from('teacher_schedule')
          .delete()
          .in('teacher_id', teacherIdsToUpdate)
          .gte('scheduled_date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
          .lte('scheduled_date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));

        // 根據 org_id 過濾
        if (orgId) {
          deleteQuery = deleteQuery.eq('org_id', orgId);
        }

        const { error: deleteError } = await deleteQuery;

        if (deleteError) {
          console.warn('Error deleting schedules:', deleteError.message);
          setErrorMsg(`刪除舊排班失敗：${deleteError.message}`);
          return;
        }
      }

      // 插入新排班（添加 org_id）
      if (dragSchedules.length > 0) {
        const schedulesToInsert = dragSchedules.map(s => {
          const schedule: any = {
            teacher_id: s.teacher_id,
            scheduled_date: s.scheduled_date,
            start_time: s.start_time,
            end_time: s.end_time,
          };
          // 如果提供了 orgId，則包含它
          if (orgId) {
            schedule.org_id = orgId;
          }
          return schedule;
        });

        const { error: insertError } = await (supabase
          .from('teacher_schedule') as any)
          .insert(schedulesToInsert as any);

        if (insertError) {
          console.warn('Error inserting schedules:', insertError.message);
          setErrorMsg(`儲存新排班失敗：${insertError.message}`);
          return;
        }
      }

      // 重新載入資料
      let reloadQuery = supabase
        .from('teacher_schedule')
        .select('*')
        .gte('scheduled_date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));

      // 根據 org_id 過濾
      if (orgId) {
        reloadQuery = reloadQuery.eq('org_id', orgId);
      }

      const { data: newSchedules } = await reloadQuery;

      if (newSchedules) {
        setSchedules(newSchedules as Schedule[]);
      }

      setEditMode(false);
      setDragSchedules([]);
      setDraggedTeacher(null);
      setDragOverDate(null);
      
      // 顯示成功訊息
      setErrorMsg('儲存成功！排班已更新');
      setTimeout(() => setErrorMsg(null), 3000);

    } catch (error) {
      console.warn('Unexpected error saving edit mode:', error);
      setErrorMsg('儲存時發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditMode = () => {
    setEditMode(false);
    setDragSchedules([]);
    setDraggedTeacher(null);
    setDragOverDate(null);
  };

  // 過濾 teachers, schedules, lessons 根據 teacherIds
  const filteredTeachers = teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*' ? teachers.filter(t => teacherIds.includes(t.id)) : teachers;
  
  // 調試：檢查 filteredTeachers
  useEffect(() => {
    if (filteredTeachers.length > 0) {
      console.log('📊 [TeacherSchedulePanel] filteredTeachers 數量:', filteredTeachers.length, 'orgId:', orgId);
      console.log('📊 [TeacherSchedulePanel] filteredTeachers 列表:', filteredTeachers.map(t => ({ id: t.id, name: t.teacher_nickname || t.teacher_fullname })));
    }
  }, [filteredTeachers, orgId]);
  const filteredSchedules = teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*' ? schedules.filter(s => teacherIds.includes(s.teacher_id)) : schedules;
  const filteredLessons = teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*' ? lessons.filter(l => {
    // 只顯示該老師有排班的課堂
    const schedule = schedules.find(s => s.teacher_id === teacherIds[0] && s.scheduled_date === l.lesson_date);
    return !!schedule;
  }) : lessons;

  return (
    <>
      <div className={`${isMobile ? 'p-3 lg:p-6' : 'p-6'} bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md ${isMobile ? 'rounded-2xl' : 'rounded-3xl'} shadow-xl border-2 border-[#EADBC8] max-w-7xl mx-auto font-['Quicksand',_sans-serif] ${isMobile ? 'mb-24' : ''}`}>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-2'} rounded-l-xl border-2 transition-all flex items-center gap-2 min-h-[44px] touch-manipulation ${
                viewMode === 'calendar' 
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-[#FFB6C1] shadow-lg' 
                  : 'bg-white/70 text-[#4B4036] border-[#EADBC8] hover:bg-white'
              }`}
              onClick={() => setViewMode('calendar')}
            >
              <Squares2X2Icon className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              <span className={isMobile ? 'hidden sm:inline' : ''}>日曆顯示</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-2'} rounded-r-xl border-2 border-l-0 transition-all flex items-center gap-2 min-h-[44px] touch-manipulation ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-[#FFB6C1] shadow-lg' 
                  : 'bg-white/70 text-[#4B4036] border-[#EADBC8] hover:bg-white'
              }`}
              onClick={() => setViewMode('list')}
            >
              <ListBulletIcon className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              <span className={isMobile ? 'hidden sm:inline' : ''}>列表顯示</span>
            </motion.button>
          </div>
        
          {viewMode === 'calendar' && !isMobile && (
          <div className="flex gap-3">
            {editMode ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  onClick={handleSaveEditMode}
                  className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-5 py-2.5'} bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 font-medium shadow-md min-h-[44px] touch-manipulation`}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span className={isMobile ? 'text-sm' : ''}>儲存中...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span className={isMobile ? 'text-sm' : ''}>儲存</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelEditMode}
                  className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-5 py-2.5'} bg-white/70 border-2 border-[#EADBC8] text-[#4B4036] rounded-xl hover:bg-white transition-all flex items-center gap-2 font-medium shadow-sm min-h-[44px] touch-manipulation`}
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span className={isMobile ? 'text-sm' : ''}>取消</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditModeToggle}
                className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-5 py-2.5'} bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium shadow-md min-h-[44px] touch-manipulation`}
              >
                <PencilIcon className="w-4 h-4" />
                <span className={isMobile ? 'text-sm' : ''}>編輯模式</span>
              </motion.button>
            )}
          </div>
          )}
        </div>

        {/* 編輯模式老師列表 - 移動端隱藏 */}
        {editMode && viewMode === 'calendar' && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-2xl border-2 border-[#EADBC8] shadow-lg"
        >
          <h3 className="text-lg font-bold mb-4 text-[#4B4036] flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CalendarIcon className="w-5 h-5 text-[#FFB6C1]" />
            </motion.div>
            <span>拖拽老師到日期安排排班</span>
            <span className="text-sm font-normal text-[#A68A64]">(拖拽後可調整時間)</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {filteredTeachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileDrag={{ scale: 1.1, rotate: 5 }}
                draggable
                className="px-4 py-3 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-xl cursor-move hover:shadow-lg border-2 border-[#EADBC8] hover:border-[#FFB6C1] transition-all duration-200 shadow-md font-medium flex items-center gap-2"
                onDragEnd={handleTeacherDragEnd}
                onDragStart={() => handleTeacherDragStart(teacher)}
              >
                <UserIcon className="w-4 h-4" />
                {teacher.teacher_nickname}
              </motion.div>
            ))}
          </div>
        </motion.div>
        )}

        {viewMode === 'list' ? (
          <div className="overflow-x-auto mt-4 space-y-4">
            {filteredTeachers.map((teacher, teacherIndex) => {
              const teacherSchedules = filteredSchedules.filter(s => s.teacher_id === teacher.id);
              if (teacherSchedules.length === 0) return null;
              
              // 按日期排序（升序）
              const sortedSchedules = [...teacherSchedules].sort((a, b) => 
                new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
              );

              // 計算本月統計：上班天數和工作時數
              const monthStart = startOfMonth(currentMonth);
              const monthEnd = endOfMonth(currentMonth);
              const monthStartStr = format(monthStart, 'yyyy-MM-dd');
              const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
              
              // 過濾本月排班
              const currentMonthSchedules = sortedSchedules.filter(s => {
                const scheduleDate = s.scheduled_date || '';
                return scheduleDate >= monthStartStr && scheduleDate <= monthEndStr;
              });

              // 計算工作時數
              const calculateWorkHours = (startTime: string, endTime: string): number => {
                if (!startTime || !endTime) return 0;
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;
                return (endMinutes - startMinutes) / 60;
              };

              const totalWorkHours = currentMonthSchedules.reduce((total, schedule) => {
                const hours = calculateWorkHours(schedule.start_time || '', schedule.end_time || '');
                return total + hours;
              }, 0);

              const workDays = currentMonthSchedules.length;
              const isExpanded = expandedTeachers.has(teacher.id);
              
              return (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: teacherIndex * 0.1 }}
                  className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-[#EADBC8] overflow-hidden"
                >
                  {/* 收起狀態：顯示統計信息 */}
                  <div 
                    className={`${isMobile ? 'p-4' : 'p-6'} cursor-pointer`}
                    onClick={() => {
                      const newExpanded = new Set(expandedTeachers);
                      if (isExpanded) {
                        newExpanded.delete(teacher.id);
                      } else {
                        newExpanded.add(teacher.id);
                      }
                      setExpandedTeachers(newExpanded);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] p-1 shadow-md flex-shrink-0`}>
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <UserIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-[#4B4036]`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} text-[#4B4036] mb-1`}>
                            {teacher.teacher_nickname || teacher.teacher_fullname}
                          </div>
                          <div className={`flex flex-wrap gap-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-[#FFB6C1]`} />
                              <span className="text-[#4B4036] font-medium">
                                本月上班：<span className="font-bold text-[#FFB6C1]">{workDays}</span> 天
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-[#FFD59A]`} />
                              <span className="text-[#4B4036] font-medium">
                                工作時數：<span className="font-bold text-[#FFD59A]">{totalWorkHours.toFixed(1)}</span> 小時
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} flex items-center justify-center rounded-full bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 border-2 border-[#EADBC8] flex-shrink-0 min-h-[44px] min-w-[44px] touch-manipulation`}
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[#4B4036]`} />
                        ) : (
                          <ChevronDownIcon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[#4B4036]`} />
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* 展開狀態：顯示完整表格 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
                          <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2 mb-4 pt-4 border-t border-[#EADBC8]`}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`${isMobile ? 'w-full' : 'px-4'} py-2.5 lg:py-2 text-sm bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium shadow-md min-h-[44px] touch-manipulation`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeacherScheduleClick(teacher);
                              }}
                              title="安排老師排班"
                            >
                              <CalendarIcon className="w-4 h-4" />
                              安排排班
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`${isMobile ? 'w-full' : 'px-4'} py-2.5 lg:py-2 text-sm bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium shadow-md min-h-[44px] touch-manipulation`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeacherScheduleDelete(teacher);
                              }}
                              title="刪除老師排班"
                            >
                              <TrashIcon className="w-4 h-4" />
                              刪除排班
                            </motion.button>
                            {!isMobile && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-4 py-2 text-sm bg-white/70 border-2 border-[#EADBC8] text-[#4B4036] rounded-xl hover:bg-white transition-all flex items-center gap-2 font-medium shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportTeacherCSV(teacher);
                                  }}
                                >
                                  <DocumentArrowDownIcon className="w-4 h-4" />
                                  匯出 CSV
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-4 py-2 text-sm bg-white/70 border-2 border-[#EADBC8] text-[#4B4036] rounded-xl hover:bg-white transition-all flex items-center gap-2 font-medium shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyTeacherMarkdown(teacher);
                                  }}
                                >
                                  <ClipboardDocumentIcon className="w-4 h-4" />
                                  複製 Markdown
                                </motion.button>
                              </>
                            )}
                          </div>
                          {/* 移動端：鎖定老師列，時間區域可橫向滾動；桌面端：完整表格 */}
                          <div className={`bg-white/50 rounded-xl border border-[#EADBC8] ${isMobile ? 'overflow-hidden' : 'overflow-x-auto'}`}>
                    {isMobile ? (
                      // 移動端：鎖定老師列，時間區域可橫向滾動
                      <div className="flex relative" style={{ width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
                        {/* 鎖定的老師列 */}
                        <div className="sticky left-0 z-20 bg-white/95 backdrop-blur-sm border-r-2 border-[#EADBC8] flex-shrink-0" style={{ width: '100px', minWidth: '100px' }}>
                          <div className="p-2 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8]">
                            <div className="text-[10px] font-bold text-[#4B4036] mb-1">老師</div>
                            <div className="text-xs font-medium text-[#2B3A3B] truncate">{teacher.teacher_nickname || teacher.teacher_fullname}</div>
                          </div>
                          {sortedSchedules.map((sch, index) => (
                            <div
                              key={sch.id}
                              className="p-2 border-b border-[#EADBC8] bg-white/90 min-h-[60px] flex items-center"
                            >
                              <div className="text-[10px] font-medium text-[#4B4036] truncate">{sch.scheduled_date}</div>
                            </div>
                          ))}
                        </div>
                        {/* 可滾動的時間區域 */}
                        <div 
                          className="flex-1 overflow-x-auto touch-pan-x" 
                          style={{ 
                            WebkitOverflowScrolling: 'touch' as any,
                            touchAction: 'pan-x',
                            maxWidth: 'calc(100vw - 100px)'
                          }}
                          onTouchStart={(e) => {
                            // 防止雙指縮放
                            if (e.touches.length > 1) {
                              e.preventDefault();
                            }
                          }}
                          onTouchMove={(e) => {
                            // 只允許水平滾動
                            if (e.touches.length > 1) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="min-w-max" style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* 表頭 */}
                            <div className="flex border-b border-[#EADBC8] bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] sticky top-0 z-10">
                              <div className="p-2 border-r border-[#EADBC8] min-w-[90px] text-[10px] font-bold text-[#4B4036] text-center">日期</div>
                              <div className="p-2 border-r border-[#EADBC8] min-w-[90px] text-[10px] font-bold text-[#4B4036] text-center">上班</div>
                              <div className="p-2 border-r border-[#EADBC8] min-w-[90px] text-[10px] font-bold text-[#4B4036] text-center">下班</div>
                              <div className="p-2 min-w-[140px] text-[10px] font-bold text-[#4B4036] text-center">操作</div>
                            </div>
                            {/* 表體 */}
                            {sortedSchedules.map((sch, index) => (
                              <motion.div
                                key={sch.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex border-b border-[#EADBC8] bg-white/50 min-h-[60px]"
                              >
                                <div className="p-2 border-r border-[#EADBC8] min-w-[90px] font-medium text-[#4B4036] text-[10px] flex items-center justify-center">
                                  {sch.scheduled_date}
                                </div>
                                <div className="p-2 border-r border-[#EADBC8] min-w-[90px] flex items-center justify-center">
                                  <span className="px-2 py-1 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-full text-[10px] font-medium whitespace-nowrap">
                                    {sch.start_time?.slice(0, 5) || ''}
                                  </span>
                                </div>
                                <div className="p-2 border-r border-[#EADBC8] min-w-[90px] flex items-center justify-center">
                                  <span className="px-2 py-1 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-full text-[10px] font-medium whitespace-nowrap">
                                    {sch.end_time?.slice(0, 5) || ''}
                                  </span>
                                </div>
                                <div className="p-2 min-w-[140px] flex items-center justify-center gap-1">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    className="px-2 py-1.5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-lg transition-all flex items-center justify-center gap-1 text-[10px] font-medium shadow-md min-h-[36px] min-w-[36px] touch-manipulation"
                                    onClick={() => handleEditSchedule(sch, teacher)}
                                    title="編輯"
                                  >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    className="px-2 py-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg transition-all flex items-center justify-center gap-1 text-[10px] font-medium shadow-md min-h-[36px] min-w-[36px] touch-manipulation"
                                    onClick={() => handleSingleScheduleDelete(sch.id || '', teacher.teacher_nickname || teacher.teacher_fullname || '', sch.scheduled_date || '')}
                                    title="刪除此排班"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 桌面端：完整表格，可橫向滾動
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                          <thead className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8]">
                            <tr>
                              <th className="p-4 border-b border-[#EADBC8] text-left text-sm font-bold text-[#4B4036]">日期</th>
                              <th className="p-4 border-b border-[#EADBC8] text-left text-sm font-bold text-[#4B4036]">老師</th>
                              <th className="p-4 border-b border-[#EADBC8] text-left text-sm font-bold text-[#4B4036]">上班時間</th>
                              <th className="p-4 border-b border-[#EADBC8] text-left text-sm font-bold text-[#4B4036]">下班時間</th>
                              <th className="p-4 border-b border-[#EADBC8] text-left text-sm font-bold text-[#4B4036]">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedSchedules.map((sch, index) => (
                              <motion.tr
                                key={sch.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-gradient-to-r hover:from-[#FFF9F2]/50 hover:to-[#FFFDF8]/50 transition-colors"
                              >
                                <td className="p-4 border-b border-[#EADBC8] font-medium text-[#4B4036]">{sch.scheduled_date}</td>
                                <td className="p-4 border-b border-[#EADBC8] text-[#2B3A3B]">{teacher.teacher_nickname || teacher.teacher_fullname}</td>
                                <td className="p-4 border-b border-[#EADBC8]">
                                  <span className="px-3 py-1 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-full text-sm font-medium">
                                    {sch.start_time?.slice(0, 5) || ''}
                                  </span>
                                </td>
                                <td className="p-4 border-b border-[#EADBC8]">
                                  <span className="px-3 py-1 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-full text-sm font-medium">
                                    {sch.end_time?.slice(0, 5) || ''}
                                  </span>
                                </td>
                                <td className="p-4 border-b border-[#EADBC8]">
                                  <div className="flex items-center gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1.5 text-xs font-medium shadow-md"
                                      onClick={() => handleEditSchedule(sch, teacher)}
                                      title="編輯"
                                    >
                                      <PencilIcon className="w-3.5 h-3.5" />
                                      編輯
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1.5 text-xs font-medium shadow-md"
                                      onClick={() => handleSingleScheduleDelete(sch.id || '', teacher.teacher_nickname || teacher.teacher_fullname || '', sch.scheduled_date || '')}
                                      title="刪除此排班"
                                    >
                                      <TrashIcon className="w-3.5 h-3.5" />
                                      刪除
                                    </motion.button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between mb-6 bg-white/70 backdrop-blur-sm ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl p-4'} shadow-lg border border-[#EADBC8]`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous Month"
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </motion.button>
            <motion.div
              key={format(currentMonth, 'yyyy-MM')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {!isMobile && <CalendarIcon className="w-6 h-6 text-[#FFB6C1]" />}
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#4B4036]`}>
                {format(currentMonth, 'yyyy年MM月')}
              </h2>
              {isMobile && (
                <span className="text-xs text-[#A68A64] ml-2">左右滑動切換</span>
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next Month"
              onClick={handleNextMonth}
              className={`${isMobile ? 'px-3 py-2.5' : 'px-4 py-2'} bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation`}
            >
              <ChevronRightIcon className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
            </motion.button>
          </motion.div>
        )}

        {viewMode === 'calendar' ? (
          <div 
            className={`grid grid-cols-7 ${isMobile ? 'gap-0.5' : 'gap-3'} text-center`}
            onDragOver={editMode ? (e) => {
              e.preventDefault();
              handleAutoScroll(e);
            } : undefined}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`font-bold text-[#4B4036] pb-2 ${isMobile ? 'text-xs' : 'text-sm'} bg-gradient-to-br from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-lg ${isMobile ? 'px-1 py-1' : 'px-2 py-2'} border border-[#EADBC8]/50`}
              >
                {day}
              </motion.div>
            ))}
            {/* Empty slots for days before the first of the month */}
            {Array(daysInMonth[0].getDay()).fill(null).map((_, i) => (
              <div key={`empty-start-${i}`} />
            ))}
            {daysInMonth.map((day, dayIndex) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const currentSchedules = editMode ? dragSchedules : filteredSchedules;
              const scheduledTeachers = currentSchedules
                .filter(s => s.scheduled_date === dateStr)
                .map(s => filteredTeachers.find(t => t.id === s.teacher_id))
                .filter(Boolean) as Teacher[];
              const lessonCount = lessonsCountByDate[dateStr] || 0;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
              return (
                <motion.div
                  key={dateStr}
                  data-date-cell
                  data-date={dateStr}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: dayIndex * 0.02 }}
                  whileHover={editMode || isMobile ? {} : { 
                    y: -4, 
                    scale: 1.02,
                    boxShadow: "0 10px 25px rgba(255, 182, 193, 0.2)"
                  }}
                  className={`relative bg-gradient-to-br ${
                    scheduledTeachers.length > 0 
                      ? 'from-white/90 to-white/70' 
                      : 'from-white/50 to-white/30'
                  } backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-1' : 'p-2'} flex flex-col justify-between ${isMobile ? 'min-h-[80px]' : 'min-h-[140px]'} transition-all duration-300 border-2 ${
                    isToday 
                      ? 'border-[#FFB6C1] shadow-lg ring-2 ring-[#FFB6C1]/30' 
                      : 'border-[#EADBC8]'
                  } ${
                    editMode ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    dragOverDate === dateStr ? 'bg-gradient-to-br from-[#FFE8C2] to-[#FFD59A] border-[#FFB6C1] shadow-xl scale-105' : ''
                  } touch-manipulation active:scale-95`}
                  style={{ overflow: 'hidden' }}
                  onClick={editMode ? undefined : () => handleDateClick(day)}
                  onDragOver={editMode ? (e) => {
                    e.preventDefault();
                    handleDateDragOver(dateStr);
                    handleAutoScroll(e);
                  } : undefined}
                  onDrop={editMode ? (e) => {
                    e.preventDefault();
                    handleDateDrop(dateStr);
                  } : undefined}
                >
                  {/* 動態背景裝飾 */}
                  {scheduledTeachers.length > 0 && (
                    <motion.div
                      animate={{ 
                        background: [
                          "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
                          "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
                          "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
                        ]
                      }}
                      transition={{ duration: 8, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl"
                    />
                  )}
                  
                  <div className="relative z-10">
                    {/* 日期數字 */}
                    <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold ${
                          isToday 
                            ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white px-2 py-0.5 rounded-full' 
                            : 'text-[#4B4036]'
                        }`}
                      >
                        {day.getDate()}
                      </motion.span>
                      {isToday && !isMobile && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-[#FFB6C1] rounded-full"
                        />
                      )}
                    </div>
                    {/* 移動端：只顯示統計信息 */}
                    {isMobile ? (
                      <div className="flex flex-col gap-1 w-full">
                        {scheduledTeachers.length > 0 && (
                          <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFE8C2]/50 to-[#FFD59A]/50 rounded px-2 py-1">
                            <UserIcon className="w-3 h-3 text-[#4B4036]" />
                            <span className="text-[10px] font-bold text-[#4B4036]">{scheduledTeachers.length}</span>
                          </div>
                        )}
                        {lessonCount > 0 && (
                          <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFB6C1]/50 to-[#FFD59A]/50 rounded px-2 py-1">
                            <CalendarIcon className="w-3 h-3 text-[#4B4036]" />
                            <span className="text-[10px] font-bold text-[#4B4036]">{lessonCount}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`flex flex-col gap-2 w-full`}>
                        {/* 學生數量 - 桌面端，顯示在老師之上，可點擊 */}
                        {!isMobile && lessonCount > 0 && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(day);
                            }}
                            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFB6C1]/30 to-[#FFD59A]/30 rounded-full px-3 py-1.5 border border-[#EADBC8] cursor-pointer transition-all duration-200 hover:from-[#FFB6C1]/50 hover:to-[#FFD59A]/50 hover:shadow-md"
                          >
                            <SparklesIcon className="w-3.5 h-3.5 text-[#FFB6C1]" />
                            <span className="text-xs font-bold text-[#4B4036]">{lessonCount} 學生</span>
                          </motion.button>
                        )}
                        {scheduledTeachers.length > 0 ? scheduledTeachers.map((t, teacherIndex) => {
                          if (!t) return null;
                          const schedule = currentSchedules.find(s => s.teacher_id === t.id && s.scheduled_date === dateStr);
                        return (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: teacherIndex * 0.1 }}
                            whileHover={isMobile ? {} : { scale: 1.05, y: -2 }}
                            className={`w-full max-w-full bg-gradient-to-br ${
                              editMode && schedule && 'confirmed' in schedule && schedule.confirmed 
                                ? 'from-[#FFB6C1] to-[#FFD59A] border-[#FFB6C1] ring-2 ring-[#FFB6C1]/50 shadow-lg' 
                                : 'from-[#FFE8C2] to-[#FFD59A] border-[#EADBC8]'
                            } ${isMobile ? 'rounded' : 'rounded-lg'} shadow-md flex flex-col items-center ${isMobile ? 'p-1' : 'p-1.5'} overflow-hidden border-2 min-w-0 transition-all duration-300 ${isMobile ? '' : 'hover:shadow-xl'} ${
                              editMode ? (isMobile ? 'p-1' : 'p-2') : (isMobile ? 'p-1' : 'p-1.5')
                            }`}
                            style={{ zIndex: 10, marginBottom: 2 }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className={`flex flex-col items-center w-full ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
                              {/* 老師名字 */}
                              <motion.span
                                whileHover={isMobile ? {} : { scale: 1.1 }}
                                className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold w-full text-center bg-white/90 backdrop-blur-sm rounded-full ${isMobile ? 'px-1 py-0.5' : 'px-2 py-1'} shadow-sm transition-all duration-200 ${
                                  editMode && schedule && 'confirmed' in schedule && schedule.confirmed 
                                    ? 'text-[#4B4036] bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 ring-2 ring-[#FFB6C1]' 
                                    : 'text-[#4B4036]'
                                }`}
                              >
                                {editMode && schedule && 'confirmed' in schedule && schedule.confirmed ? (
                                  <motion.img
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    alt="confirmed" 
                                    className="w-3 h-3 inline mr-1" 
                                    src="/leaf-sprout.png" 
                                  />
                                ) : null}
                                {t.teacher_nickname}
                              </motion.span>
                            
                              {/* 編輯模式按鈕 */}
                              {editMode && (
                                <div className="flex gap-1 pointer-events-auto">
                                  <motion.button
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-6 h-6 text-[#4B4036] hover:text-[#FFB6C1] flex items-center justify-center rounded-full border-2 border-[#FFB6C1] bg-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-[#FFB6C1]/20 hover:to-[#FFD59A]/20"
                                    title="確認"
                                    type="button"
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleConfirm(t.id, dateStr); }}
                                  >
                                    <motion.img
                                      animate={{ rotate: [0, 360] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                      src="/leaf-sprout.png" 
                                      alt="confirm" 
                                      className="w-3 h-3" 
                                    />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.2, rotate: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-6 h-6 text-[#A68A64] hover:text-red-600 flex items-center justify-center rounded-full border-2 border-[#EADBC8] bg-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:bg-red-50"
                                    title="取消"
                                    type="button"
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleCancel(t.id, dateStr); }}
                                  >
                                    <motion.img
                                      animate={{ rotate: [0, 180] }}
                                      transition={{ duration: 0.5 }}
                                      src="/close.png" 
                                      alt="cancel" 
                                      className="w-3 h-3" 
                                    />
                                  </motion.button>
                                </div>
                              )}
                            </div>
                            {/* 時間顯示區域 - 僅桌面端顯示 */}
                            {!isMobile && (
                              <div className="flex flex-col items-center gap-1 mt-1 w-full px-1">
                                {/* 編輯模式：24小時制時間輸入框 */}
                                {editMode && (
                                  <div className="flex flex-col items-center gap-1 w-full">
                                    {/* 起始時間 */}
                                    <div className="w-full relative">
                                      <input
                                        className="w-full text-[10px] lg:text-[11px] px-2 py-1 bg-white/90 backdrop-blur-sm border-2 border-[#EADBC8] rounded-lg text-center flex-shrink-0 min-w-[60px] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                                        type="text"
                                        pattern="[0-9]{2}:[0-9]{2}"
                                        placeholder="HH:MM"
                                        value={schedule?.start_time?.slice(0, 5) || '09:00'}
                                        onChange={e => {
                                          const value = e.target.value;
                                          // 格式化輸入為 HH:MM
                                          let formatted = value.replace(/[^\d:]/g, '');
                                          if (formatted.length === 4 && !formatted.includes(':')) {
                                            formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
                                          }
                                          handleScheduleTimeChange(t.id, dateStr, 'start_time', formatted);
                                        }}
                                        onBlur={e => {
                                          const value = e.target.value;
                                          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                                          if (!timeRegex.test(value)) {
                                            handleScheduleTimeChange(t.id, dateStr, 'start_time', '09:00');
                                          }
                                        }}
                                      />
                                    </div>
                                    {/* 分隔符號 */}
                                    <motion.span
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="text-[10px] lg:text-[11px] text-[#FFB6C1] font-bold flex-shrink-0"
                                    >
                                      →
                                    </motion.span>
                                    {/* 結束時間 */}
                                    <div className="w-full relative">
                                      <input
                                        className="w-full text-[10px] lg:text-[11px] px-2 py-1 bg-white/90 backdrop-blur-sm border-2 border-[#EADBC8] rounded-lg text-center flex-shrink-0 min-w-[60px] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] transition-all"
                                        type="text"
                                        pattern="[0-9]{2}:[0-9]{2}"
                                        placeholder="HH:MM"
                                        value={schedule?.end_time?.slice(0, 5) || '18:00'}
                                        onChange={e => {
                                          const value = e.target.value;
                                          // 格式化輸入為 HH:MM
                                          let formatted = value.replace(/[^\d:]/g, '');
                                          if (formatted.length === 4 && !formatted.includes(':')) {
                                            formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
                                          }
                                          handleScheduleTimeChange(t.id, dateStr, 'end_time', formatted);
                                        }}
                                        onBlur={e => {
                                          const value = e.target.value;
                                          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                                          if (!timeRegex.test(value)) {
                                            handleScheduleTimeChange(t.id, dateStr, 'end_time', '18:00');
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                {/* 美化時間文字顯示 - 編輯和非編輯模式都顯示 */}
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="text-center w-full mt-1"
                                >
                                  <div className="bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] rounded-full px-2 py-1.5 shadow-md border-2 border-[#EADBC8] transition-all duration-200">
                                    <span className="text-[#4B4036] font-bold text-xs lg:text-sm">
                                      {schedule?.start_time?.slice(0, 5) || schedule?.start_time || '09:00'}
                                    </span>
                                    <motion.span
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="text-[#FFB6C1] mx-1 font-bold"
                                    >
                                      →
                                    </motion.span>
                                    <span className="text-[#4B4036] font-bold text-xs lg:text-sm">
                                      {schedule?.end_time?.slice(0, 5) || schedule?.end_time || '18:00'}
                                    </span>
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </motion.div>
                        );
                      }) : null}
                        {scheduledTeachers.length === 0 && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[#aaa] text-xs italic"
                          >
                            無排班
                          </motion.span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {/* Empty slots for days after the last of the month */}
            {Array(6 - daysInMonth[daysInMonth.length - 1].getDay()).fill(null).map((_, i) => (
              <div key={`empty-end-${i}`} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Popup for daily schedule (Modern style) */}
      <AnimatePresence>
        {selectedDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-[420px] max-h-[90vh] overflow-y-auto border-2 border-[#EADBC8]"
            >
              {/* 動態背景裝飾 */}
              <motion.div
                animate={{ 
                  background: [
                    "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
              />
              
              <div className="relative z-10">
                {/* 關閉按鈕 */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="關閉"
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border-2 border-[#EADBC8] text-xl text-[#4B4036] hover:bg-[#FFB6C1] hover:text-white hover:border-[#FFB6C1] shadow-lg transition-all"
                  onClick={() => setSelectedDetail(null)}
                >
                  ×
                </motion.button>
                {/* 日期標題 */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CalendarIcon className="w-6 h-6 text-[#FFB6C1]" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#4B4036]">
                      {format(selectedDetail.date, 'yyyy年MM月dd日')}
                    </h3>
                    <p className="text-sm text-[#2B3A3B]">課堂安排</p>
                  </div>
                </motion.div>
                {/* 老師區塊 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[#4B4036] flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-[#FFB6C1]" />
                      當日老師
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs px-3 py-1.5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                      onClick={() => setShowArrangeTeacher(true)}
                    >
                      <PencilIcon className="w-3 h-3" />
                      安排老師
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetail.teachers.length > 0 ? selectedDetail.teachers.map((teacher, index) => {
                      const schedule = schedules.find(
                        s => s.teacher_id === teacher.id && s.scheduled_date === format(selectedDetail.date, 'yyyy-MM-dd'),
                      );
                      return (
                        <motion.div
                          key={teacher.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] rounded-full px-3 py-1.5 shadow-md border border-[#EADBC8]"
                        >
                          <span className="text-xs font-bold text-[#4B4036]">
                            {teacher.teacher_nickname}
                            {schedule && (
                              <span className="ml-2 text-[10px] text-[#A68A64] font-medium">
                                ({schedule.start_time?.slice(0, 5) || ''} → {schedule.end_time?.slice(0, 5) || ''})
                              </span>
                            )}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-red-500 hover:text-red-700 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 transition-all"
                            title="移除"
                            onClick={() => {
                              const confirmed = window.confirm('確定要移除此老師的排班嗎？');
                              if (confirmed) handleDeleteTeacherSchedule(teacher.id);
                            }}
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </motion.button>
                        </motion.div>
                      );
                    }) : (
                      <span className="text-[#aaa] text-sm italic">無老師排班</span>
                    )}
                  </div>
                </div>
                {/* 課堂安排 */}
                <div>
                  <div className="font-bold text-[#4B4036] mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#FFD59A]" />
                    課堂安排
                  </div>
                  <div className="space-y-3">
                    {selectedDetail.groups.length > 0 ? selectedDetail.groups.map((group, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] rounded-xl p-4 border-l-4 border-[#FFB6C1] shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-sm font-bold text-[#4B4036] bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white px-3 py-1 rounded-full"
                          >
                            {group.time?.slice(0, 5) || ''}
                          </motion.span>
                          <span className="text-sm font-bold text-[#4B4036]">
                            {group.course || '未命名課程'}
                          </span>
                          <span className="text-xs text-[#2B3A3B] bg-white/70 px-2 py-0.5 rounded-full">
                            {group.students.length} 位學生
                          </span>
                        </div>
                        <div className="ml-2 space-y-1">
                          {group.students.map((student, j) => (
                            <motion.div
                              key={j}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.1 + j * 0.05 }}
                              className="flex items-center gap-2 text-sm text-[#4B4036]"
                            >
                              <div className="w-2 h-2 bg-[#FFB6C1] rounded-full" />
                              <span className="font-medium">{student.name}</span>
                              {student.age && (
                                <span className="text-xs text-[#A68A64] bg-white/50 px-2 py-0.5 rounded-full">
                                  {Math.floor(parseInt(student.age) / 12)}Y{parseInt(student.age) % 12}M
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )) : (
                      <div className="text-center py-4 text-[#aaa] text-sm italic">
                        當日無課程安排
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 安排老師彈窗 - 移動端優化 */}
      {showArrangeTeacher && (
        <motion.div
          ref={arrangeTeacherModalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/20"
          onClick={() => setShowArrangeTeacher(false)}
          style={{ paddingBottom: isMobile ? '80px' : '0' }}
        >
          <motion.div
            initial={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-[#FFFDF8] ${isMobile ? 'rounded-t-3xl' : 'rounded-2xl'} shadow-2xl ${isMobile ? 'p-6 w-full' : 'p-8 w-[400px]'} ${isMobile ? 'max-h-[calc(100vh-100px)]' : 'max-h-[90vh]'} overflow-y-auto border border-[#EADBC8] relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="關閉"
              className={`absolute ${isMobile ? 'top-4 right-4' : 'top-3 right-3'} ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-[#A68A64] hover:bg-[#F3F0E5] shadow min-h-[44px] min-w-[44px] touch-manipulation`}
              onClick={() => setShowArrangeTeacher(false)}
            >
              <img src="/close.png" alt="close" className="w-4 h-4" />
            </button>
            <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 text-[#4B4036]`}>安排老師</div>
            <div className="mb-4">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-1`}>選擇老師：</label>
              <button
                className={`w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] min-h-[44px] touch-manipulation`}
                onClick={() => setShowTeacherPopup(true)}
              >
                {selectedTeacher.teacher_id
                  ? teachers.find(t => t.id === selectedTeacher.teacher_id)?.teacher_nickname || '請選擇老師'
                  : '請選擇老師'}
              </button>
            </div>
            <div className="mb-4">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-1`}>上班時間</label>
              <div className={isMobile ? 'text-base' : ''}>
                <TimePicker
                  value={selectedTeacher.start_time}
                  onChange={(time) => setSelectedTeacher(prev => ({ ...prev, start_time: time }))}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-1`}>下班時間</label>
              <div className={isMobile ? 'text-base' : ''}>
                <TimePicker
                  value={selectedTeacher.end_time}
                  onChange={(time) => setSelectedTeacher(prev => ({ ...prev, end_time: time }))}
                />
              </div>
            </div>
            {errorMsg && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}
            <div className={`flex ${isMobile ? 'flex-col-reverse' : 'justify-end'} gap-2 mt-6`}>
              <button
                className={`${isMobile ? 'w-full' : 'px-4'} py-3 bg-gray-200 rounded-full text-sm text-[#4B4036] min-h-[44px] touch-manipulation`}
                onClick={() => setShowArrangeTeacher(false)}
              >
                取消
              </button>
              <button
                className={`${isMobile ? 'w-full' : 'px-4'} py-3 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036] min-h-[44px] touch-manipulation disabled:opacity-50`}
                disabled={loading}
                onClick={handleSaveTeacherSchedule}
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </motion.div>
          {/* PopupSelect 只在需要時彈出 */}
          {showTeacherPopup && (
          <PopupSelect
            mode="single"
            options={teachers.map(t => ({ label: t.teacher_nickname, value: t.id }))}
            selected={tempTeacherId || selectedTeacher.teacher_id}
            title="選擇老師"
            onCancel={() => {
              setTempTeacherId(selectedTeacher.teacher_id);
              setShowTeacherPopup(false);
            }}
            onChange={(value) => setTempTeacherId(value as string)}
            onConfirm={() => {
              setSelectedTeacher(prev => ({ ...prev, teacher_id: tempTeacherId }));
              setShowTeacherPopup(false);
            }}
          />
          )}
        </motion.div>
      )}

      {/* 日期老師選擇彈窗 - 移動端優化 */}
      {showDateTeacherSelect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/20"
          onClick={() => setShowDateTeacherSelect(false)}
        >
          <motion.div
            initial={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-[#FFFDF8] ${isMobile ? 'rounded-t-3xl' : 'rounded-2xl'} shadow-2xl ${isMobile ? 'p-6 w-full' : 'p-8 w-[500px]'} max-h-[90vh] overflow-y-auto border border-[#EADBC8] relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="關閉"
              className={`absolute ${isMobile ? 'top-4 right-4' : 'top-3 right-3'} ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-[#A68A64] hover:bg-[#F3F0E5] shadow min-h-[44px] min-w-[44px] touch-manipulation`}
              onClick={() => setShowDateTeacherSelect(false)}
            >
              <img src="/close.png" alt="close" className="w-4 h-4" />
            </button>
            
            <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 text-[#4B4036]`}>
              安排老師排班 - {selectedDate}
            </div>

            {/* 老師選擇區域 */}
            <div className="mb-6">
              <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium mb-3 text-[#4B4036]`}>選擇老師：</label>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 ${isMobile ? 'max-h-60' : 'max-h-40'} overflow-y-auto`}>
                {teachers.map(teacher => (
                  <label
                    key={teacher.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedTeachersForDate.includes(teacher.id)
                        ? 'border-[#A68A64] bg-[#FFE8C2] shadow-md'
                        : 'border-[#EADBC8] bg-white hover:bg-[#FFFCF5]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeachersForDate.includes(teacher.id)}
                      onChange={() => handleTeacherSelection(teacher.id)}
                      className="mr-3 w-4 h-4 text-[#A68A64] border-[#EADBC8] rounded focus:ring-[#A68A64]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[#4B4036]">{teacher.teacher_nickname}</div>
                      <div className="text-xs text-[#A68A64]">{teacher.teacher_fullname}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 時間設置區域 */}
            <div className="mb-6">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-3 text-[#4B4036]`}>上班時間：</label>
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <div className="flex-1">
                  <label className={`block ${isMobile ? 'text-sm' : 'text-xs'} text-[#A68A64] mb-1`}>開始時間</label>
                  <input
                    type="time"
                    value={selectedTimeRange.start_time}
                    onChange={(e) => handleTimeRangeChange('start_time', e.target.value)}
                    className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64] min-h-[44px] touch-manipulation`}
                  />
                </div>
                <div className="flex-1">
                  <label className={`block ${isMobile ? 'text-sm' : 'text-xs'} text-[#A68A64] mb-1`}>結束時間</label>
                  <input
                    type="time"
                    value={selectedTimeRange.end_time}
                    onChange={(e) => handleTimeRangeChange('end_time', e.target.value)}
                    className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64] min-h-[44px] touch-manipulation`}
                  />
                </div>
              </div>
            </div>

            {/* 預覽區域 */}
            {selectedTeachersForDate.length > 0 && (
              <div className="mb-6 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <div className="text-sm font-medium text-[#4B4036] mb-2">預覽安排：</div>
                <div className="space-y-1">
                  {selectedTeachersForDate.map(teacherId => {
                    const teacher = teachers.find(t => t.id === teacherId);
                    return (
                      <div key={teacherId} className="text-sm text-[#4B4036]">
                        • {teacher?.teacher_nickname}：{selectedTimeRange.start_time} - {selectedTimeRange.end_time}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errorMsg && <div className="text-red-500 text-sm mb-4">{errorMsg}</div>}

            {/* 操作按鈕 - 移動端優化 */}
            <div className={`flex ${isMobile ? 'flex-col-reverse' : 'justify-end'} gap-3`}>
              <button
                className={`${isMobile ? 'w-full' : 'px-6'} py-3 bg-gray-200 rounded-full text-sm text-[#4B4036] hover:bg-gray-300 transition-colors min-h-[44px] touch-manipulation`}
                onClick={() => setShowDateTeacherSelect(false)}
              >
                取消
              </button>
              <button
                className={`${isMobile ? 'w-full' : 'px-6'} py-3 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036] hover:bg-[#DDBA90] transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation`}
                disabled={loading || selectedTeachersForDate.length === 0}
                onClick={handleBatchScheduleTeachers}
              >
                {loading ? '安排中...' : '安排排班'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 單個老師排班彈窗 - 移動端優化 */}
      {showSingleTeacherSchedule && selectedSingleTeacher && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/20"
          onClick={() => setShowSingleTeacherSchedule(false)}
        >
          <motion.div
            initial={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-[#FFFDF8] ${isMobile ? 'rounded-t-3xl' : 'rounded-2xl'} shadow-2xl ${isMobile ? 'p-6 w-full' : 'p-8 w-[450px]'} max-h-[90vh] overflow-y-auto border border-[#EADBC8] relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="關閉"
              className={`absolute ${isMobile ? 'top-4 right-4' : 'top-3 right-3'} ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-[#A68A64] hover:bg-[#F3F0E5] shadow min-h-[44px] min-w-[44px] touch-manipulation`}
              onClick={() => setShowSingleTeacherSchedule(false)}
            >
              <img src="/close.png" alt="close" className="w-4 h-4" />
            </button>
            
            <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 text-[#4B4036]`}>
              安排老師排班
            </div>

            {/* 老師資訊 */}
            <div className="mb-6 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
              <div className="text-sm font-medium text-[#4B4036] mb-2">老師資訊：</div>
              <div className="text-lg font-bold text-[#4B4036]">{selectedSingleTeacher.teacher_nickname}</div>
              <div className="text-sm text-[#A68A64]">{selectedSingleTeacher.teacher_fullname}</div>
            </div>

            {/* 日期選擇 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-[#4B4036]">排班日期：</label>
              <input
                type="date"
                value={selectedScheduleDate}
                onChange={(e) => setSelectedScheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              />
            </div>

            {/* 時間設置區域 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-[#4B4036]">上班時間：</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-[#A68A64] mb-1">開始時間</label>
                  <input
                    type="time"
                    value={selectedScheduleTime.start_time}
                    onChange={(e) => handleSingleTeacherTimeChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[#A68A64] mb-1">結束時間</label>
                  <input
                    type="time"
                    value={selectedScheduleTime.end_time}
                    onChange={(e) => handleSingleTeacherTimeChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  />
                </div>
              </div>
            </div>

            {/* 預覽區域 */}
            <div className="mb-6 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
              <div className="text-sm font-medium text-[#4B4036] mb-2">預覽安排：</div>
              <div className="text-sm text-[#4B4036]">
                • {selectedSingleTeacher.teacher_nickname}：{selectedScheduleDate} {selectedScheduleTime.start_time} - {selectedScheduleTime.end_time}
              </div>
            </div>

            {errorMsg && <div className="text-red-500 text-sm mb-4">{errorMsg}</div>}

            {/* 操作按鈕 - 移動端優化 */}
            <div className={`flex ${isMobile ? 'flex-col-reverse' : 'justify-end'} gap-3`}>
              <button
                className={`${isMobile ? 'w-full' : 'px-6'} py-3 bg-gray-200 rounded-full text-sm text-[#4B4036] hover:bg-gray-300 transition-colors min-h-[44px] touch-manipulation disabled:opacity-50`}
                onClick={() => setShowSingleTeacherSchedule(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className={`${isMobile ? 'w-full' : 'px-6'} py-3 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036] hover:bg-[#DDBA90] transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation`}
                disabled={loading}
                onClick={handleSingleTeacherSchedule}
              >
                {loading ? '安排中...' : '安排排班'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Message Display */}
      {errorMsg && (
        <div
          className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
            errorMsg.includes('已安排到') || errorMsg.includes('儲存成功')
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {errorMsg.includes('已安排到') || errorMsg.includes('儲存成功') ? (
              <img alt="success" className="w-4 h-4" src="/leaf-sprout.png" />
            ) : (
              <img alt="warning" className="w-4 h-4" src="/close.png" />
            )}
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* 日期詳情彈窗 - 移動端 */}
      {showDateDetailModal && selectedDateDetail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/20"
          onClick={() => setShowDateDetailModal(false)}
          style={{ paddingBottom: isMobile ? '80px' : '0' }}
        >
          <motion.div
            initial={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-[#FFFDF8] ${isMobile ? 'rounded-t-3xl' : 'rounded-2xl'} shadow-2xl ${isMobile ? 'p-6 w-full' : 'p-8 w-[500px]'} ${isMobile ? 'max-h-[calc(100vh-100px)]' : 'max-h-[90vh]'} overflow-y-auto border border-[#EADBC8] relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="關閉"
              className={`absolute ${isMobile ? 'top-4 right-4' : 'top-3 right-3'} ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-[#A68A64] hover:bg-[#F3F0E5] shadow min-h-[44px] min-w-[44px] touch-manipulation`}
              onClick={() => setShowDateDetailModal(false)}
            >
              <img src="/close.png" alt="close" className="w-4 h-4" />
            </button>
            
            <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 text-[#4B4036]`}>
              {selectedDateDetail.date}
            </div>

            {/* 統計信息 */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-[#FFE8C2] to-[#FFD59A] rounded-xl border-2 border-[#EADBC8]">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-5 h-5 text-[#4B4036]" />
                  <span className="text-sm font-medium text-[#4B4036]">老師</span>
                </div>
                <div className="text-2xl font-bold text-[#4B4036]">{selectedDateDetail.teachers.length}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-xl border-2 border-[#EADBC8]">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-5 h-5 text-[#4B4036]" />
                  <span className="text-sm font-medium text-[#4B4036]">學生</span>
                </div>
                <div className="text-2xl font-bold text-[#4B4036]">{selectedDateDetail.lessonCount}</div>
              </div>
            </div>

            {/* 老師列表 */}
            {selectedDateDetail.teachers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold mb-3 text-[#4B4036]">排班老師</h3>
                <div className="space-y-3">
                  {selectedDateDetail.teachers.map((teacher) => {
                    const schedule = selectedDateDetail.schedules.find(s => s.teacher_id === teacher.id);
                    return (
                      <motion.div
                        key={teacher.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-br from-white/90 to-white/70 rounded-xl border-2 border-[#EADBC8] shadow-md"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] p-1">
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-[#4B4036]" />
                              </div>
                            </div>
                            <span className="font-bold text-[#4B4036]">{teacher.teacher_nickname || teacher.teacher_fullname}</span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium shadow-md min-h-[36px] touch-manipulation"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (schedule && 'id' in schedule) {
                                handleEditSchedule(schedule as Schedule, teacher);
                                // 延迟关闭日期详情弹窗，确保编辑弹窗先打开
                                setTimeout(() => {
                                  setShowDateDetailModal(false);
                                }, 100);
                              }
                            }}
                            title="編輯"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            編輯
                          </motion.button>
                        </div>
                        {schedule && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#A68A64]">上班：</span>
                              <span className="px-2 py-1 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-full font-medium">
                                {schedule.start_time?.slice(0, 5) || ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#A68A64]">下班：</span>
                              <span className="px-2 py-1 bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] text-[#4B4036] rounded-full font-medium">
                                {schedule.end_time?.slice(0, 5) || ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex-1 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium shadow-md min-h-[44px] touch-manipulation"
                onClick={() => {
                  setShowDateDetailModal(false);
                  // 可以添加安排新排班的功能
                }}
              >
                <CalendarIcon className="w-4 h-4" />
                安排排班
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 編輯排班彈窗 - 移動端優化 */}
      {showEditScheduleModal && editingSchedule && editingScheduleTime && (
        <motion.div
          ref={arrangeTeacherModalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/20"
          onClick={() => handleCancelEdit()}
          style={{ paddingBottom: isMobile ? '80px' : '0' }}
        >
          <motion.div
            initial={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? '100%' : 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-[#FFFDF8] ${isMobile ? 'rounded-t-3xl' : 'rounded-2xl'} shadow-2xl ${isMobile ? 'p-6 w-full' : 'p-8 w-[400px]'} ${isMobile ? 'max-h-[calc(100vh-100px)]' : 'max-h-[90vh]'} overflow-y-auto border border-[#EADBC8] relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="關閉"
              className={`absolute ${isMobile ? 'top-4 right-4' : 'top-3 right-3'} ${isMobile ? 'w-10 h-10' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-[#A68A64] hover:bg-[#F3F0E5] shadow min-h-[44px] min-w-[44px] touch-manipulation`}
              onClick={() => handleCancelEdit()}
            >
              <img src="/close.png" alt="close" className="w-4 h-4" />
            </button>
            
            <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4 text-[#4B4036]`}>編輯排班</div>

            {/* 老師資訊 */}
            <div className="mb-6 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
              <div className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-[#4B4036] mb-2`}>老師資訊：</div>
              <div className={`${isMobile ? 'text-lg' : 'text-base'} font-bold text-[#4B4036]`}>{editingSchedule.teacherName}</div>
            </div>

            {/* 日期顯示 */}
            <div className="mb-6">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-1 text-[#4B4036]`}>排班日期：</label>
              <div className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} bg-white border border-[#EADBC8] rounded-lg text-[#4B4036] min-h-[44px] flex items-center`}>
                {editingSchedule.date}
              </div>
            </div>

            {/* 時間設置區域 */}
            <div className="mb-6">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium mb-3 text-[#4B4036]`}>上班時間：</label>
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <div className="flex-1">
                  <label className={`block ${isMobile ? 'text-sm' : 'text-xs'} text-[#A68A64] mb-1`}>開始時間</label>
                  <input
                    type="time"
                    value={editingScheduleTime.start_time}
                    onChange={(e) => setEditingScheduleTime(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                    className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64] min-h-[44px] touch-manipulation`}
                  />
                </div>
                <div className="flex-1">
                  <label className={`block ${isMobile ? 'text-sm' : 'text-xs'} text-[#A68A64] mb-1`}>結束時間</label>
                  <input
                    type="time"
                    value={editingScheduleTime.end_time}
                    onChange={(e) => setEditingScheduleTime(prev => prev ? { ...prev, end_time: e.target.value } : null)}
                    className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#A68A64] min-h-[44px] touch-manipulation`}
                  />
                </div>
              </div>
            </div>

            {errorMsg && <div className="text-red-500 text-sm mb-4">{errorMsg}</div>}

            {/* 操作按鈕 - 移動端優化 */}
            <div className={`flex ${isMobile ? 'flex-col-reverse' : 'justify-end'} gap-3`}>
              <button
                className={`${isMobile ? 'w-full' : 'px-6'} py-3 bg-gray-200 rounded-full text-sm text-[#4B4036] hover:bg-gray-300 transition-colors min-h-[44px] touch-manipulation`}
                onClick={() => handleCancelEdit()}
                disabled={loading}
              >
                取消
              </button>
              <button
                className={`${isMobile ? 'w-full' : 'px-6'} py-3 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036] hover:bg-[#DDBA90] transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation`}
                disabled={loading}
                onClick={handleSaveEditSchedule}
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 移動端固定底部操作欄 */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#EADBC8] p-3 z-40 lg:hidden shadow-lg safe-area-inset-bottom">
          <div className="flex justify-around items-center max-w-md mx-auto pb-safe">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode('calendar')}
              className={`flex flex-col items-center gap-1 min-h-[60px] min-w-[60px] px-3 py-2 rounded-xl transition-all touch-manipulation ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                  : 'text-[#4B4036] hover:bg-[#FFF9F2]'
              }`}
            >
              <Squares2X2Icon className="w-6 h-6" />
              <span className="text-xs font-medium">日曆</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode('list')}
              className={`flex flex-col items-center gap-1 min-h-[60px] min-w-[60px] px-3 py-2 rounded-xl transition-all touch-manipulation ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                  : 'text-[#4B4036] hover:bg-[#FFF9F2]'
              }`}
            >
              <ListBulletIcon className="w-6 h-6" />
              <span className="text-xs font-medium">列表</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowArrangeTeacher(true)}
              className="flex flex-col items-center gap-1 min-h-[60px] min-w-[60px] px-3 py-2 rounded-xl bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md touch-manipulation"
            >
              <CalendarIcon className="w-6 h-6" />
              <span className="text-xs font-medium">新增</span>
            </motion.button>
          </div>
        </div>
      )}
    </>
  );
}
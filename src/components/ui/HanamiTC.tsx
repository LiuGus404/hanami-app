import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

import LessonCard from './LessonCard';
import MiniLessonCard from './MiniLessonCard';

import AITeacherSchedulerModal from '@/components/ui/AITeacherSchedulerModal';
import LessonPlanModal from '@/components/ui/LessonPlanModal';
import StudentActivitiesPanel from '@/components/ui/StudentActivitiesPanel';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { getSupabaseClient } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import { Lesson, Teacher, CourseType, Student } from '@/types';

interface ProcessedLesson {
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
  lesson_duration: string | null;
}

interface Group {
  time: string;
  course: string;
  students: {
    name: string;
    student_id: string;
    age: string;
    is_trial: boolean;
    remaining_lessons?: number | null;
  }[];
  teachers?: Teacher[];
}

interface SelectedDetail {
  date: Date;
  teachers: Teacher[];
  groups: Group[];
}

interface UseLessonPlansProps {
  lessonDate: string;
  timeslot: string;
  courseType: string;
}

interface LessonPlanModalProps {
  open: boolean;
  onClose: () => void;
  lessonDate: Date;
  timeslot: string;
  courseType: string;
  existingPlan?: any;
  onSaved?: () => void;
  teachers: { id: string; name: string }[];
}

interface HanamiTCProps {
  teachers: Teacher[];
}

const getHongKongDate = (date = new Date()): Date => {
  // 移除額外的時區轉換，直接使用本地時間
  return new Date(date);
};

const HanamiTC: React.FC<HanamiTCProps> = ({ teachers }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const supabase = getSupabaseClient();
  const [lessons, setLessons] = useState<ProcessedLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [popupInfo, setPopupInfo] = useState<{ field: string; open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    date: Date;
    time: string;
    course: string;
    plan?: any;
  } | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{
    time: string;
    course: { name: string };
    teachers: Teacher[];
    students: {
      id: string;
      name: string;
      age?: string;
      isTrial?: boolean;
      remainingLessons?: number;
      avatar?: string;
    }[];
    plan?: {
      teacherNames1: string[];
      teacherNames2: string[];
      objectives: string[];
      materials: string[];
    };
    onEdit: () => void;
  } | null>(null);
  const [selectedTeacher1, setSelectedTeacher1] = useState<string[]>([]);
  const [selectedTeacher2, setSelectedTeacher2] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<'main' | 'assist' | null>(null);
  const [tempSelectedTeacher1, setTempSelectedTeacher1] = useState<string[]>([]);
  const [tempSelectedTeacher2, setTempSelectedTeacher2] = useState<string[]>([]);
  const [allShowTeachers, setAllShowTeachers] = useState(true);
  const [allShowStudents, setAllShowStudents] = useState(true);
  const [allShowPlan, setAllShowPlan] = useState(true);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);
  const [isStudentActivitiesOpen, setIsStudentActivitiesOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    courseType: string;
    age?: string;
    lessonDate?: string;
    timeslot?: string;
  } | null>(null);

  // 添加防抖機制和初始化標記
  const lessonsFetchedRef = useRef(false);
  const currentViewRef = useRef<string>('');
  const currentDateRef = useRef<string>('');
  const loadingRef = useRef(false);
  const isInitializedRef = useRef(false);

  const getDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchLessons = async (startDate: Date, endDate: Date): Promise<void> => {
    const startDateStr = getDateString(startDate);
    const endDateStr = getDateString(endDate);

    console.log('Fetching lessons between:', { startDateStr, endDateStr });

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

    const { data: trialLessonsData, error: trialLessonsError } = await supabase
      .from('hanami_trial_students')
      .select('*')
      .gte('lesson_date', startDateStr)
      .lte('lesson_date', endDateStr);

    if (regularLessonsError || trialLessonsError) {
      console.error('Fetch error:', regularLessonsError || trialLessonsError);
      return;
    }

    console.log('Fetched regular lessons:', regularLessonsData);
    console.log('Fetched trial lessons:', trialLessonsData);

    // 使用現有的 calculateRemainingLessonsBatch 函數計算剩餘堂數
    const regularStudentIds = [...new Set((regularLessonsData || []).map(lesson => lesson.student_id).filter((id): id is string => Boolean(id)))];
    const remainingLessonsMap = await calculateRemainingLessonsBatch(regularStudentIds, new Date());

    console.log('Remaining lessons map:', remainingLessonsMap);

    // 處理常規學生數據
    const processedRegularLessons: ProcessedLesson[] = (regularLessonsData || []).map((lesson) => ({
      id: lesson.id,
      student_id: lesson.student_id || '',
      lesson_date: lesson.lesson_date || '',
      regular_timeslot: lesson.regular_timeslot && lesson.regular_timeslot !== '' ? lesson.regular_timeslot : '未設定',
      course_type: lesson.course_type && lesson.course_type !== '' ? lesson.course_type : '未設定',
      full_name: lesson.Hanami_Students?.full_name || '未命名學生',
      student_age: lesson.Hanami_Students?.student_age || null,
      lesson_status: lesson.lesson_status,
      remaining_lessons: remainingLessonsMap[lesson.student_id!] || 0,
      is_trial: false,
      lesson_duration: lesson.lesson_duration || null,
    }));

    // 處理試堂學生數據
    const processedTrialLessons: ProcessedLesson[] = (trialLessonsData || []).map((trial) => ({
      id: trial.id,
      student_id: trial.id,
      lesson_date: trial.lesson_date || '',
      regular_timeslot: trial.actual_timeslot && trial.actual_timeslot !== '' ? trial.actual_timeslot : '未設定',
      course_type: trial.course_type && trial.course_type !== '' ? trial.course_type : '未設定',
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
    
    // 檢查 lessons 是否真的需要更新
    setLessons(prevLessons => {
      // 如果內容相同，不更新狀態
      if (prevLessons.length === allLessons.length && 
          prevLessons.every((lesson, index) => lesson.id === allLessons[index].id)) {
        return prevLessons;
      }
      return allLessons;
    });

    // 獲取所有學生資料
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_age, contact_number');

    if (studentsError) {
      console.error('Fetch students error:', studentsError);
      setStudents([]);
      return;
    }

    // 轉換為 Student 類型
    const processedStudents: Student[] = (studentsData || []).map(student => ({
      id: student.id,
      full_name: student.full_name || '未命名學生',
      student_age: student.student_age,
      student_type: '常規',
      course_type: null,
      regular_weekday: null,
      regular_timeslot: null,
      remaining_lessons: null,
      contact_number: student.contact_number || '',
      health_notes: null,
      student_oid: null,
      nick_name: null,
      gender: null,
      student_dob: null,
      parent_email: null,
      student_remarks: null,
      created_at: null,
      updated_at: null,
      address: null,
      duration_months: null,
      school: null,
      started_date: null,
      student_email: null,
      student_password: null,
      student_preference: null,
      student_teacher: null,
      lesson_date: null,
      actual_timeslot: null,
    }));

    // 檢查 students 是否真的需要更新
    setStudents(prevStudents => {
      // 如果內容相同，不更新狀態
      if (prevStudents.length === processedStudents.length && 
          prevStudents.every((student, index) => student.id === processedStudents[index].id)) {
        return prevStudents;
      }
      return processedStudents;
    });
  };

  const fetchPlans = async (startDate: Date, endDate: Date) => {
    const startDateStr = getDateString(startDate);
    const endDateStr = getDateString(endDate);

    console.log('Fetching plans between:', { startDateStr, endDateStr });

    const { data } = await supabase
      .from('hanami_lesson_plan')
      .select('*')
      .gte('lesson_date', startDateStr)
      .lte('lesson_date', endDateStr);

    console.log('Fetched plans:', data);
    
    // 檢查 plans 是否真的需要更新
    setPlans(prevPlans => {
      const newPlans = data || [];
      // 如果內容相同，不更新狀態
      if (prevPlans.length === newPlans.length && 
          prevPlans.every((plan, index) => plan.id === newPlans[index].id)) {
        return prevPlans;
      }
      return newPlans;
    });
  };

  const fetchTodayTeachers = async (date: Date) => {
    const supabase = getSupabaseClient();
    const dateStr = getDateString(date); // 使用本地日期字符串，避免時區問題
    const { data, error } = await supabase
      .from('teacher_schedule')
      .select(`
        id,
        start_time,
        end_time,
        hanami_employee:teacher_id (teacher_nickname)
      `)
      .eq('scheduled_date', dateStr);
    if (!error && data) {
      const list: {name: string, start: string, end: string}[] = [];
      data.forEach((row: any) => {
        if (row.hanami_employee?.teacher_nickname && row.start_time && row.end_time) {
          list.push({ name: row.hanami_employee.teacher_nickname, start: row.start_time, end: row.end_time });
        }
      });
      return list;
    }
    return [];
  };

  // 今日上班老師元件
  const TodayTeachersSection = ({ date }: { date: Date }) => {
    const [teachers, setTeachers] = useState<{name: string, start: string, end: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const dateRef = useRef<string>('');

    useEffect(() => {
      const dateString = getDateString(date); // 使用本地日期字符串，避免時區問題
      // 如果日期沒有變化，不重新載入
      if (dateRef.current === dateString) return;
      dateRef.current = dateString;
      
      const loadTeachers = async () => {
        setLoading(true);
        const teacherList = await fetchTodayTeachers(date);
        setTeachers(teacherList);
        setLoading(false);
      };
      loadTeachers();
    }, [getDateString(date)]); // 使用本地日期字符串，避免時區問題

    if (loading) {
      return <div className="text-xs text-[#A68A64] mt-1">載入中...</div>;
    }

    if (teachers.length === 0) {
      return <div className="text-xs text-[#A68A64] mt-1">無上班老師</div>;
    }

    return (
      <div className="w-full flex flex-row flex-wrap gap-2 justify-center mb-1">
        {teachers.map((teacher, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <button
              className="rounded-full bg-[#FFF7D6] text-[#4B4036] px-2 py-1 shadow-sm font-semibold text-xs hover:bg-[#FFE5B4] transition-all duration-150 truncate max-w-full"
              title={teacher.name}
              onClick={() => {
                window.location.href = `/admin/teachers/teacher-schedule?teacher_name=${encodeURIComponent(teacher.name)}`;
              }}
            >
              {teacher.name}
            </button>
            <span
              className="rounded-full bg-[#EADBC8] text-[#7A6654] px-2 py-0.5 font-mono text-xs min-w-[60px] text-center mt-1"
              title={`${teacher.start.slice(0, 5)}~${teacher.end.slice(0, 5)}`}
            >
              {teacher.start.slice(0, 5)}~{teacher.end.slice(0, 5)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 主要資料載入邏輯 - 只在初始化時載入一次
  useEffect(() => {
    // 只在第一次載入時執行
    if (isInitializedRef.current) return;
    
    const loadInitialData = async () => {
      try {
        if (view === 'week') {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          await Promise.all([
            fetchLessons(startOfWeek, endOfWeek),
            fetchPlans(startOfWeek, endOfWeek),
          ]);
        } else if (view === 'day') {
          const startOfDay = new Date(currentDate);
          const endOfDay = new Date(currentDate);

          await Promise.all([
            fetchLessons(startOfDay, endOfDay),
            fetchPlans(startOfDay, endOfDay),
          ]);
        }

        lessonsFetchedRef.current = true;
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []); // 空依賴項，只在組件掛載時執行一次

  // 手動重新載入資料的函數
  const reloadData = async () => {
    try {
      lessonsFetchedRef.current = false;
      loadingRef.current = true;
      
      if (view === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        await Promise.all([
          fetchLessons(startOfWeek, endOfWeek),
          fetchPlans(startOfWeek, endOfWeek),
        ]);
      } else if (view === 'day') {
        const startOfDay = new Date(currentDate);
        const endOfDay = new Date(currentDate);

        await Promise.all([
          fetchLessons(startOfDay, endOfDay),
          fetchPlans(startOfDay, endOfDay),
        ]);
      }

      lessonsFetchedRef.current = true;
      loadingRef.current = false;
    } catch (error) {
      console.error('Error reloading data:', error);
      loadingRef.current = false;
    }
  };

  // 當 view 或 currentDate 變化時重置防抖狀態
  // useEffect(() => {
  //   const viewKey = `${view}_${currentDate.toISOString().split('T')[0]}`;
  //   if (currentViewRef.current !== viewKey) {
  //     lessonsFetchedRef.current = false;
  //     loadingRef.current = false;
  //   }
  // }, [view, currentDate]);

  const handlePrev = (): void => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
    // 手動重新載入資料
    setTimeout(() => reloadData(), 0);
  };

  const handleNext = (): void => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
    // 手動重新載入資料
    setTimeout(() => reloadData(), 0);
  };

  const formatDate = (date: Date): string => {
    const weekStart = getHongKongDate(new Date(date));
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = getHongKongDate(new Date(weekStart));
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.getFullYear()}/${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
  };

  const getStudentAge = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    if (!student || student.student_age === null || student.student_age === undefined) return '';
    const months = typeof student.student_age === 'string' ? parseInt(student.student_age) : student.student_age;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (!years && !remainingMonths) return '';
    return `${years}`;
  };

  const renderStudentButton = (nameObj: { name: string; student_id: string; age: string; is_trial: boolean; remaining_lessons?: number | null }, lesson: ProcessedLesson): React.ReactElement => {
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
          className={'inline-block px-2 py-1 m-1 rounded-full text-[#4B4036] text-xs hover:bg-[#d0ab7d] transition flex items-center'}
          style={{ 
            minWidth: '60px',
            backgroundColor: bgColor,
          }}
          onClick={() => window.location.href = `/admin/students/${nameObj.student_id}`}
        >
          {nameObj.name}
          {nameObj.age && <span className="ml-1 text-[10px]">({nameObj.age}歲)</span>}
          {nameObj.is_trial && <span className="ml-1 text-[10px]">(試堂)</span>}
        </button>
      </div>
    );
  };

  const handleDeleteTeacherSchedule = async (teacherId: string) => {
    try {
      const { error } = await supabase
        .from('hanami_lesson_plan')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('lesson_date', currentDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Refresh the data
      const { data: updatedTeachers, error: fetchError } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('id', teacherId);

      if (fetchError) throw fetchError;
    } catch (err) {
      console.error('Error deleting teacher schedule:', err);
      alert('刪除失敗');
    }
  };

  const renderDayLessons = (date: Date) => {
    const dateStr = getDateString(date);
    
    const dayLessons = lessons.filter(l => {
      const lessonDateStr = l.lesson_date;
      return lessonDateStr === dateStr;
    });
    
    dayLessons.sort((a, b) => a.regular_timeslot.localeCompare(b.regular_timeslot));
    
    const grouped = dayLessons.reduce<Record<string, Group>>((acc, l) => {
      const key = `${l.regular_timeslot}_${l.course_type}`;
      if (!acc[key]) {
        acc[key] = {
          time: l.regular_timeslot,
          course: l.course_type,
          students: [],
        };
      }
      let age = '';
      if (l.student_age !== null && l.student_age !== undefined) {
        age = (typeof l.student_age === 'string' ? parseInt(l.student_age) : l.student_age).toString();
      }
      acc[key].students.push({
        name: l.full_name,
        student_id: l.student_id,
        age,
        is_trial: l.is_trial,
        remaining_lessons: l.remaining_lessons ?? undefined,
      });
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  let dailyViewContent = null;
  if (view === 'day') {
    const date = getHongKongDate(currentDate);
    const dayLessons = lessons.filter(l => getDateString(new Date(l.lesson_date)) === getDateString(date));
    dayLessons.sort((a, b) => a.regular_timeslot.localeCompare(b.regular_timeslot));
    const grouped = dayLessons.reduce<Record<string, Group>>((acc, l) => {
      const key = `${l.regular_timeslot}_${l.course_type}`;
      if (!acc[key]) {
        acc[key] = {
          time: l.regular_timeslot,
          course: l.course_type,
          students: [],
        };
      }
      let age = '';
      if (l.student_age !== null && l.student_age !== undefined) {
        age = (typeof l.student_age === 'string' ? parseInt(l.student_age) : l.student_age).toString();
      }
      acc[key].students.push({
        name: l.full_name,
        student_id: l.student_id,
        age,
        is_trial: l.is_trial,
        remaining_lessons: l.remaining_lessons ?? undefined,
      });
      return acc;
    }, {});
    const groupedArray = Object.values(grouped);
    dailyViewContent = (
      <div className="flex flex-col items-center w-full">
        <div className="font-semibold text-[#4B4036] text-lg mb-1">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}</div>
        <div className="text-xs text-gray-500">{date.getDate()}</div>
        <TodayTeachersSection date={date} />
        <div className="flex flex-col items-center gap-2 mt-1 w-full">
          {groupedArray.map((group, j) => (
            <MiniLessonCard
              key={j}
              allShowPlan={allShowPlan}
              allShowStudents={allShowStudents}
              allShowTeachers={allShowTeachers}
              course={{ name: group.course }}
              duration={lessons.find(l =>
                l.regular_timeslot === group.time &&
                l.course_type === group.course &&
                getDateString(new Date(l.lesson_date)) === getDateString(date),
              )?.lesson_duration || undefined}
              students={group.students.map(student => ({
                id: student.student_id,
                name: student.name,
                age: student.age,
                isTrial: student.is_trial,
                remainingLessons: student.remaining_lessons ?? undefined,
              }))}
              time={group.time?.slice(0, 5) || ''}
              onClick={() => {
                setSelectedLesson({
                  time: group.time?.slice(0, 5) || '',
                  course: { name: group.course },
                  teachers,
                  students: group.students.map(student => ({
                    id: student.student_id,
                    name: student.name,
                    age: student.age,
                    isTrial: student.is_trial,
                    remainingLessons: student.remaining_lessons ?? undefined,
                  })),
                  onEdit: () => {
                    setModalInfo({ date, time: group.time, course: group.course });
                    setIsModalOpen(true);
                  },
                });
              }}
              onEdit={() => {
                const matchedPlan = (plans || []).find(
                  p =>
                    p.lesson_date === getDateString(date) &&
                    p.timeslot === group.time &&
                    p.course_type === group.course,
                );
                setModalInfo({ date, time: group.time, course: group.course, plan: matchedPlan });
                setIsModalOpen(true);
              }}
              onStudentClick={(student) => {
                // 打開學生活動面板
                const studentData = group.students.find(s => s.student_id === student.id);
                setSelectedStudent({
                  id: student.id || '',
                  name: student.name,
                  courseType: group.course,
                  age: studentData?.age,
                  lessonDate: getDateString(date),
                  timeslot: group.time || '',
                });
                setIsStudentActivitiesOpen(true);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 補回 updatePlan
  const updatePlan = async (startDate: Date, endDate: Date) => {
    const { data } = await supabase
      .from('hanami_lesson_plan')
      .select('*')
      .gte('lesson_date', startDate.toISOString())
      .lte('lesson_date', endDate.toISOString());
    
    // 檢查 plans 是否真的需要更新
    setPlans(prevPlans => {
      const newPlans = data || [];
      // 如果內容相同，不更新狀態
      if (prevPlans.length === newPlans.length && 
          prevPlans.every((plan, index) => plan.id === newPlans[index].id)) {
        return prevPlans;
      }
      return newPlans;
    });
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center py-0">
      <div className="bg-[#FFFDF8] rounded-xl shadow p-4 w-full max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <button className="hanami-btn-cute px-2 py-1 text-[#4B4036]" onClick={handlePrev}>◀</button>
            {view === 'day' ? (
              <input
                className="border-2 border-[#EAC29D] px-3 py-2 rounded-full bg-white focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200"
                style={{ width: '120px' }}
                type="date"
                value={getDateString(currentDate)}
                onChange={e => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  setCurrentDate(new Date(year, month - 1, day));
                }}
              />
            ) : (
              <span className="font-semibold text-[#4B4036]">{formatDate(currentDate)}</span>
            )}
            <button className="hanami-btn-cute px-2 py-1 text-[#4B4036]" onClick={handleNext}>▶</button>
            {view === 'day' && (
            <span className="ml-2 text-[#4B4036] text-sm font-semibold">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()]}
            </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className={`px-3 py-1 ${view === 'day' ? 'hanami-btn' : 'hanami-btn-soft'} text-[#4B4036]`} onClick={() => setView('day')}>日</button>
            <button className={`px-3 py-1 ${view === 'week' ? 'hanami-btn' : 'hanami-btn-soft'} text-[#4B4036]`} onClick={() => setView('week')}>週</button>
            <button className="flex items-center gap-1 px-2 py-1 hanami-btn-soft text-[#4B4036]" onClick={() => setAllShowTeachers((prev) => !prev)}>
              <img alt="老師" className="w-4 h-4" src="/teacher.png" />
              <span className="text-xs">{allShowTeachers ? '收起老師' : '展示老師'}</span>
            </button>
            <button className="flex items-center gap-1 px-2 py-1 hanami-btn-soft text-[#4B4036]" onClick={() => setAllShowStudents((prev) => !prev)}>
              <img alt="學生" className="w-4 h-4" src="/icons/penguin-face.PNG" />
              <span className="text-xs">{allShowStudents ? '收起學生' : '展示學生'}</span>
            </button>
            <button className="flex items-center gap-1 px-2 py-1 hanami-btn-soft text-[#4B4036]" onClick={() => setAllShowPlan((prev) => !prev)}>
              <img alt="課堂活動" className="w-4 h-4" src="/details.png" />
              <span className="text-xs">{allShowPlan ? '收起活動' : '展示活動'}</span>
            </button>

            {/* 重新載入按鈕 */}
            <button 
              className="flex items-center gap-1 px-2 py-1 hanami-btn text-[#4B4036]" 
              onClick={reloadData}
              disabled={loadingRef.current}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">{loadingRef.current ? '載入中...' : '重新載入'}</span>
            </button>
          </div>
        </div>
        {/* 日曆內容 */}
        <div className="w-full overflow-x-auto">
          {view === 'week' ? (
            <div className="grid grid-cols-7 gap-2 min-w-[700px] sm:min-w-0">
              {Array.from({ length: 7 }, (_, i) => {
                const weekStart = getHongKongDate(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                const date = getHongKongDate(weekStart);
                date.setDate(date.getDate() + i);
                const groupedArray = renderDayLessons(date);
              
                return (
                  <div key={i} className="p-2 rounded-xl text-center text-[#4B4036] text-sm bg-[#FFFDF8] flex flex-col items-center h-full">
                    <div className="font-semibold">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</div>
                    <div className="text-xs text-gray-500">{date.getDate()}</div>
                    <TodayTeachersSection date={date} />
                    <div className="flex flex-row flex-wrap gap-2 justify-center mt-1 w-full">
                      {groupedArray.map((group, j) => {
                        const matchedPlan = (plans || []).find(
                          p =>
                            p.lesson_date === getDateString(date) &&
                          p.timeslot === group.time &&
                          p.course_type === group.course,
                        );
                      
                        const teacherNames1 = (matchedPlan?.teacher_names_1 || []) as string[];
                        const teacherNames2 = (matchedPlan?.teacher_names_2 || []) as string[];
                      
                        const plan = matchedPlan
                          ? {
                            teacherNames1,
                            teacherNames2,
                            objectives: matchedPlan.objectives || [],
                            materials: matchedPlan.materials || [],
                          }
                          : undefined;
                      
                        return (
                          <MiniLessonCard
                            key={j}
                            allShowPlan={allShowPlan}
                            allShowStudents={allShowStudents}
                            allShowTeachers={allShowTeachers}
                            course={{ name: group.course }}
                            duration={lessons.find(l =>
                              l.regular_timeslot === group.time &&
                            l.course_type === group.course &&
                            getDateString(new Date(l.lesson_date)) === getDateString(date),
                            )?.lesson_duration || undefined}
                            plan={plan}
                            students={group.students.map(student => ({
                              id: student.student_id,
                              name: student.name,
                              age: student.age,
                              isTrial: student.is_trial,
                              remainingLessons: student.remaining_lessons ?? undefined,
                            }))}
                            time={group.time?.slice(0, 5) || ''}
                            onClick={() => {
                              setSelectedLesson({
                                time: group.time?.slice(0, 5) || '',
                                course: { name: group.course },
                                teachers,
                                students: group.students.map(student => ({
                                  id: student.student_id,
                                  name: student.name,
                                  age: student.age,
                                  isTrial: student.is_trial,
                                  remainingLessons: student.remaining_lessons ?? undefined,
                                })),
                                plan,
                                onEdit: () => {
                                  setModalInfo({ date, time: group.time, course: group.course });
                                  setIsModalOpen(true);
                                },
                              });
                            }}
                            onEdit={() => {
                              const matchedPlan = (plans || []).find(
                                p =>
                                  p.lesson_date === getDateString(date) &&
                                p.timeslot === group.time &&
                                p.course_type === group.course,
                              );
                              setModalInfo({ date, time: group.time, course: group.course, plan: matchedPlan });
                              setIsModalOpen(true);
                            }}
                            onStudentClick={(student) => {
                              // 打開學生活動面板
                              const studentData = group.students.find(s => s.student_id === student.id);
                              setSelectedStudent({
                                id: student.id || '',
                                name: student.name,
                                courseType: group.course,
                                age: studentData?.age,
                                lessonDate: getDateString(date),
                                timeslot: group.time || '',
                              });
                              setIsStudentActivitiesOpen(true);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            dailyViewContent
          )}
        </div>
        {/* LessonCard 彈窗 */}
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedLesson(null)}>
            <div className="max-w-md w-full relative" onClick={e => e.stopPropagation()}>
              <LessonCard 
                course={selectedLesson.course}
                plan={selectedLesson.plan ? {
                  teacherNames: [...selectedLesson.plan.teacherNames1, ...selectedLesson.plan.teacherNames2],
                  objectives: selectedLesson.plan.objectives,
                  materials: selectedLesson.plan.materials,
                } : undefined}
                students={selectedLesson.students}
                teachers={selectedLesson.teachers.map(t => ({
                  name: t.teacher_fullname,
                }))}
                time={selectedLesson.time}
                onClose={() => setSelectedLesson(null)}
                onEdit={selectedLesson.onEdit}
              />
            </div>
          </div>
        )}
        {modalInfo && (
          <LessonPlanModal
            courseType={modalInfo.course}
            existingPlan={modalInfo.plan}
            lessonDate={modalInfo.date}
            open={isModalOpen}
            timeslot={modalInfo.time}
            onClose={() => setIsModalOpen(false)}
            onSaved={async () => {
              // 使用 reloadData 而不是 updatePlan，避免無限循環
              await reloadData();
            }}
          />
        )}

        {/* AI 安排老師模態框 */}
        <AITeacherSchedulerModal
          open={isAISchedulerOpen}
          teachers={teachers}
          onClose={() => setIsAISchedulerOpen(false)}
        />

        {/* 學生活動面板模態框 */}
        {selectedStudent && isStudentActivitiesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-[#FFFDF8] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8] pointer-events-auto relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-[#4B4036] text-sm font-medium">
                      {selectedStudent.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4B4036]">{selectedStudent.name}</h2>
                    <p className="text-sm text-[#2B3A3B] opacity-70">
                      {selectedStudent.courseType} • {selectedStudent.age ? `${Math.floor(parseInt(selectedStudent.age) / 12)}歲` : '年齡未知'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsStudentActivitiesOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="p-2 hover:bg-[#F5E7D4] rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <StudentActivitiesPanel
                studentId={selectedStudent.id}
                lessonDate={selectedStudent.lessonDate || ''}
                timeslot={selectedStudent.timeslot || ""}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HanamiTC;

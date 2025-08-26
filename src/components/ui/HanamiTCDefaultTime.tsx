import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

import LessonCard from './LessonCard';
import MiniLessonCard from './MiniLessonCard';

import AITeacherSchedulerModal from '@/components/ui/AITeacherSchedulerModal';
import LessonPlanModal from '@/components/ui/LessonPlanModal';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { getSupabaseClient } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import { Lesson, Teacher, CourseType, Student } from '@/types';

interface ProcessedDefaultLesson {
  id: string;
  student_id: string;
  regular_weekday: number | null;
  regular_timeslot: string | null;
  course_type: string | null;
  full_name: string;
  student_age: number | null;
  remaining_lessons: number | null;
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

interface HanamiTCDefaultTimeProps {
  teachers: Teacher[];
}

const getHongKongDate = (date = new Date()): Date => {
  // 移除額外的時區轉換，直接使用本地時間
  return new Date(date);
};

const HanamiTCDefaultTime: React.FC<HanamiTCDefaultTimeProps> = ({ teachers }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const supabase = getSupabaseClient();
  const [defaultLessons, setDefaultLessons] = useState<ProcessedDefaultLesson[]>([]);
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

  const fetchDefaultLessons = async (startDate: Date, endDate: Date): Promise<void> => {
    const startDateStr = getDateString(startDate);
    const endDateStr = getDateString(endDate);

    console.log('Fetching default lessons between:', { startDateStr, endDateStr });

    // 只獲取常規學生的預設時間資料
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select(`
        id,
        full_name,
        student_age,
        regular_weekday,
        regular_timeslot,
        course_type,
        contact_number
      `)
      .not('regular_weekday', 'is', null)
      .not('regular_timeslot', 'is', null);

    if (studentsError) {
      console.error('Fetch students error:', studentsError);
      return;
    }

    console.log('Fetched students with default times:', studentsData);

    // 過濾掉沒有有效時間的學生
    const validStudents = (studentsData || []).filter(student => 
      student.regular_weekday !== null && 
      student.regular_timeslot !== null && 
      student.regular_timeslot !== '' && 
      student.regular_timeslot !== 'null'
    );

    console.log('Valid students with default times:', validStudents);

    // 使用現有的 calculateRemainingLessonsBatch 函數計算剩餘堂數
    const studentIds = [...new Set(validStudents.map(student => student.id).filter((id): id is string => Boolean(id)))];
    const remainingLessonsMap = await calculateRemainingLessonsBatch(studentIds, new Date());

    console.log('Remaining lessons map:', remainingLessonsMap);

    // 處理常規學生預設時間數據
    const processedDefaultLessons: ProcessedDefaultLesson[] = validStudents.map((student) => ({
      id: student.id,
      student_id: student.id,
      regular_weekday: student.regular_weekday,
      regular_timeslot: student.regular_timeslot,
      course_type: student.course_type,
      full_name: student.full_name || '未命名學生',
      student_age: student.student_age,
      remaining_lessons: remainingLessonsMap[student.id] || 0,
      lesson_duration: null, // 預設時間沒有課程時長
    }));

    console.log('All processed default lessons:', processedDefaultLessons);
    
    // 檢查 lessons 是否真的需要更新
    setDefaultLessons(prevLessons => {
      // 如果內容相同，不更新狀態
      if (prevLessons.length === processedDefaultLessons.length && 
          prevLessons.every((lesson, index) => lesson.id === processedDefaultLessons[index].id)) {
        return prevLessons;
      }
      return processedDefaultLessons;
    });

    // 轉換為 Student 類型
    const processedStudents: Student[] = validStudents.map(student => ({
      id: student.id,
      full_name: student.full_name || '未命名學生',
      student_age: student.student_age,
      student_type: '常規',
      course_type: student.course_type,
      regular_weekday: student.regular_weekday,
      regular_timeslot: student.regular_timeslot,
      remaining_lessons: remainingLessonsMap[student.id] || null,
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



  // 預設時間不需要顯示老師上班時間
  const TodayTeachersSection = ({ date }: { date: Date }) => {
    return null;
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
            fetchDefaultLessons(startOfWeek, endOfWeek),
            fetchPlans(startOfWeek, endOfWeek),
          ]);
        } else if (view === 'day') {
          const startOfDay = new Date(currentDate);
          const endOfDay = new Date(currentDate);

          await Promise.all([
            fetchDefaultLessons(startOfDay, endOfDay),
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
          fetchDefaultLessons(startOfWeek, endOfWeek),
          fetchPlans(startOfWeek, endOfWeek),
        ]);
      } else if (view === 'day') {
        const startOfDay = new Date(currentDate);
        const endOfDay = new Date(currentDate);

        await Promise.all([
          fetchDefaultLessons(startOfDay, endOfDay),
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

  const renderStudentButton = (nameObj: { name: string; student_id: string; age: string; remaining_lessons?: number | null }, lesson: ProcessedDefaultLesson): React.ReactElement => {
    // 根據剩餘堂數決定背景顏色
    let bgColor = '#F5E7D4'; // 常規學生背景色
    if (lesson?.remaining_lessons !== undefined && lesson?.remaining_lessons !== null) {
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

  const renderDayDefaultLessons = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // 篩選出符合該星期的預設課程
    const dayDefaultLessons = defaultLessons.filter(l => {
      return l.regular_weekday === dayOfWeek;
    });
    
    dayDefaultLessons.sort((a, b) => (a.regular_timeslot || '').localeCompare(b.regular_timeslot || ''));
    
    const grouped = dayDefaultLessons.reduce<Record<string, Group>>((acc, l) => {
      const key = `${l.regular_timeslot}_${l.course_type}`;
      if (!acc[key]) {
        acc[key] = {
          time: l.regular_timeslot || '未設定',
          course: l.course_type || '未設定',
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
        is_trial: false, // 預設時間只顯示常規學生
        remaining_lessons: l.remaining_lessons ?? undefined,
      });
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  // 生成課程統計信息
  const generateCourseStats = (groups: Group[]) => {
    const courseStats = groups.reduce<Record<string, { count: number; students: number }>>((acc, group) => {
      const courseName = group.course;
      if (!acc[courseName]) {
        acc[courseName] = { count: 0, students: 0 };
      }
      acc[courseName].count += 1; // 一堂課
      acc[courseName].students += group.students.length; // 學生數
      return acc;
    }, {});

    return Object.entries(courseStats).map(([courseName, stats]) => ({
      courseName,
      count: stats.count,
      students: stats.students
    }));
  };

  // 獲取課程顏色
  const getCourseColor = (courseName: string) => {
    const colors = [
      '#FFF7D6', // 溫暖黃色
      '#FFE0E0', // 溫暖粉色
      '#E0F2E0', // 溫暖綠色
      '#E0E0FF', // 溫暖藍色
      '#FFF0E0', // 溫暖橙色
      '#F0E0FF', // 溫暖紫色
      '#F5E7D4', // 溫暖棕色
      '#FFD6E0', // 溫暖玫瑰色
      '#D6F0FF', // 溫暖天藍色
      '#E8F5E8', // 溫暖淺綠色
    ];
    
    // 根據課程名稱生成固定的顏色索引
    const hash = courseName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  let dailyViewContent = null;
  if (view === 'day') {
    const date = getHongKongDate(currentDate);
    const dayOfWeek = date.getDay();
    const dayDefaultLessons = defaultLessons.filter(l => l.regular_weekday === dayOfWeek);
    dayDefaultLessons.sort((a, b) => (a.regular_timeslot || '').localeCompare(b.regular_timeslot || ''));
    const grouped = dayDefaultLessons.reduce<Record<string, Group>>((acc, l) => {
      const key = `${l.regular_timeslot}_${l.course_type}`;
      if (!acc[key]) {
        acc[key] = {
          time: l.regular_timeslot || '未設定',
          course: l.course_type || '未設定',
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
        is_trial: false, // 預設時間只顯示常規學生
        remaining_lessons: l.remaining_lessons ?? undefined,
      });
      return acc;
    }, {});
    const groupedArray = Object.values(grouped);
    dailyViewContent = (
      <div className="flex flex-col items-center w-full">
        <div className="font-semibold text-[#4B4036] text-lg mb-1">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}</div>
        {groupedArray.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {generateCourseStats(groupedArray).map((stat, index) => (
              <div key={index} className="rounded-full px-4 py-2 shadow-sm" style={{ backgroundColor: getCourseColor(stat.courseName) }}>
                <div className="text-sm text-[#4B4036] font-medium text-center leading-tight">
                  <div>{stat.courseName}</div>
                  <div>{stat.count}堂｜{stat.students}人</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col items-center gap-2 mt-1 w-full">
          {groupedArray.map((group, j) => (
            <MiniLessonCard
              key={j}
              allShowPlan={allShowPlan}
              allShowStudents={allShowStudents}
              allShowTeachers={allShowTeachers}
              course={{ name: group.course }}
              duration={undefined} // 預設時間沒有課程時長
              students={group.students.map(student => ({
                id: student.student_id,
                name: student.name,
                age: student.age,
                isTrial: false, // 預設時間只顯示常規學生
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
                    isTrial: false,
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
                              setModalInfo({ 
                                date, 
                                time: group.time, 
                                course: group.course, 
                                plan: matchedPlan
                              });
                              setIsModalOpen(true);
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
                const groupedArray = renderDayDefaultLessons(date);
              
                return (
                  <div key={i} className="p-2 rounded-xl text-center text-[#4B4036] text-sm bg-[#FFFDF8] flex flex-col items-center h-full">
                    <div className="font-semibold">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</div>
                    {groupedArray.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2 mb-1">
                        {generateCourseStats(groupedArray).map((stat, index) => (
                          <div key={index} className="rounded-full px-3 py-1" style={{ backgroundColor: getCourseColor(stat.courseName) }}>
                            <div className="text-xs text-[#4B4036] font-medium text-center leading-tight">
                              <div>{stat.courseName}</div>
                              <div>{stat.count}堂｜{stat.students}人</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                            duration={undefined} // 預設時間沒有課程時長
                            plan={plan}
                            students={group.students.map(student => ({
                              id: student.student_id,
                              name: student.name,
                              age: student.age,
                              isTrial: false, // 預設時間只顯示常規學生
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
                                  isTrial: false,
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
                              setModalInfo({ 
                                date, 
                                time: group.time, 
                                course: group.course, 
                                plan: matchedPlan
                              });
                              setIsModalOpen(true);
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

        
        {modalInfo && isModalOpen && (
          <LessonPlanModal
            courseType={modalInfo.course}
            existingPlan={modalInfo.plan}
            lessonDate={modalInfo.date}
            open={isModalOpen}
            timeslot={modalInfo.time}
            isDefaultTime={true}
            onClose={() => {
              setIsModalOpen(false);
              setModalInfo(null);
            }}
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

      </div>
    </div>
  );
};

export default HanamiTCDefaultTime;

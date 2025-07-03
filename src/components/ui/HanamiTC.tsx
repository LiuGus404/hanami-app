import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { PopupSelect } from '@/components/ui/PopupSelect';
import LessonPlanModal from '@/components/ui/LessonPlanModal';
import { Lesson, Teacher, CourseType, Student } from '@/types';
import LessonCard from './LessonCard';
import MiniLessonCard from './MiniLessonCard';

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

const getHongKongDate = (date = new Date()): Date => {
  // 移除額外的時區轉換，直接使用本地時間
  return new Date(date);
};

const HanamiTC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const supabase = getSupabaseClient();
  const [lessons, setLessons] = useState<ProcessedLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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

  // 添加防抖機制
  const lessonsFetchedRef = useRef(false);
  const currentViewRef = useRef<string>('');
  const currentDateRef = useRef<string>('');
  const loadingRef = useRef(false);

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
          student_age,
          remaining_lessons
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

    // 處理常規學生數據
    const processedRegularLessons: ProcessedLesson[] = (regularLessonsData || []).map((lesson) => ({
      id: lesson.id,
      student_id: lesson.student_id || '',
      lesson_date: lesson.lesson_date || '',
      regular_timeslot: lesson.regular_timeslot || '',
      course_type: lesson.course_type || '',
      full_name: lesson.Hanami_Students?.full_name || '未命名學生',
      student_age: lesson.Hanami_Students?.student_age || null,
      lesson_status: lesson.lesson_status,
      remaining_lessons: lesson.Hanami_Students?.remaining_lessons || null,
      is_trial: false,
      lesson_duration: lesson.lesson_duration || null,
    }));

    // 處理試堂學生數據
    const processedTrialLessons: ProcessedLesson[] = (trialLessonsData || []).map((trial) => ({
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

    setStudents(processedStudents);
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
    setPlans(data || []);
  };

  const fetchTeachers = async (): Promise<void> => {
    try {
      const { data } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_nickname, teacher_role, teacher_status, teacher_email, teacher_phone, teacher_address, teacher_dob, teacher_hsalary, teacher_msalary, teacher_background, teacher_bankid, created_at, updated_at')
        .eq('teacher_status', 'active');
      
      if (data) {
        // 轉換為 Teacher 類型
        const processedTeachers: Teacher[] = data.map(teacher => ({
          id: teacher.id,
          teacher_fullname: teacher.teacher_fullname || '',
          teacher_nickname: teacher.teacher_nickname || '',
          teacher_role: teacher.teacher_role || null,
          teacher_status: teacher.teacher_status || null,
          teacher_email: teacher.teacher_email || null,
          teacher_phone: teacher.teacher_phone || null,
          teacher_address: teacher.teacher_address || null,
          teacher_dob: teacher.teacher_dob || null,
          teacher_hsalary: teacher.teacher_hsalary || null,
          teacher_msalary: teacher.teacher_msalary || null,
          teacher_background: teacher.teacher_background || null,
          teacher_bankid: teacher.teacher_bankid || null,
          teacher_gender: 'unknown',
          created_at: teacher.created_at,
          updated_at: teacher.updated_at
        }));
        setTeachers(processedTeachers);
      }
    } catch (error) {
      console.error('Unexpected error in fetchTeachers:', error);
    }
  };

  const updatePlan = async (startDate: Date, endDate: Date) => {
    const { data } = await supabase
      .from('hanami_lesson_plan')
      .select('*')
      .gte('lesson_date', startDate.toISOString())
      .lte('lesson_date', endDate.toISOString());
    setPlans(data || []);
  };

  // 主要資料載入邏輯
  useEffect(() => {
    // 如果 view 和 currentDate 沒有變化且已經載入過，不重複載入
    const viewKey = `${view}_${currentDate.toISOString().split('T')[0]}`;
    if (currentViewRef.current === viewKey && lessonsFetchedRef.current) return;
    
    // 防止重複載入
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    // 更新當前 view 和 date
    currentViewRef.current = viewKey;
    currentDateRef.current = currentDate.toISOString().split('T')[0];

    const loadData = async () => {
      try {
        if (view === 'week') {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          await Promise.all([
            fetchLessons(startOfWeek, endOfWeek),
            fetchPlans(startOfWeek, endOfWeek),
            fetchTeachers()
          ]);
        } else if (view === 'day') {
          const startOfDay = new Date(currentDate);
          const endOfDay = new Date(currentDate);

          await Promise.all([
            fetchLessons(startOfDay, endOfDay),
            fetchPlans(startOfDay, endOfDay),
            fetchTeachers()
          ]);
        }

        lessonsFetchedRef.current = true;
        loadingRef.current = false;
      } catch (error) {
        console.error('Error loading data:', error);
        loadingRef.current = false;
      }
    };

    loadData();
  }, [view, currentDate]);

  // 當 view 或 currentDate 變化時重置防抖狀態
  useEffect(() => {
    const viewKey = `${view}_${currentDate.toISOString().split('T')[0]}`;
    if (currentViewRef.current !== viewKey) {
      lessonsFetchedRef.current = false;
      loadingRef.current = false;
    }
  }, [view, currentDate]);

  const handlePrev = (): void => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = (): void => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
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
          onClick={() => window.location.href = `/admin/students/${nameObj.student_id}`}
          className={`inline-block px-2 py-1 m-1 rounded-full text-[#4B4036] text-xs hover:bg-[#d0ab7d] transition flex items-center`}
          style={{ 
            minWidth: '60px',
            backgroundColor: bgColor
          }}
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
    
    console.log('Checking lessons for date:', dateStr);
    
    const dayLessons = lessons.filter(l => {
      const lessonDateStr = l.lesson_date;
      console.log('Comparing:', { lessonDateStr, dateStr });
      return lessonDateStr === dateStr;
    });
    
    console.log('Filtered dayLessons:', dayLessons);
    
    dayLessons.sort((a, b) => a.regular_timeslot.localeCompare(b.regular_timeslot));
    
    const grouped = dayLessons.reduce<Record<string, Group>>((acc, l) => {
      const key = `${l.regular_timeslot}_${l.course_type}`;
      if (!acc[key]) {
        acc[key] = {
          time: l.regular_timeslot,
          course: l.course_type,
          students: []
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
        remaining_lessons: l.remaining_lessons
      });
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center py-0">
      <div className="bg-[#FFFDF8] rounded-xl shadow p-4 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <button onClick={handlePrev} className="hanami-btn-cute px-2 py-1 text-[#4B4036]">◀</button>
          {view === 'day' ? (
            <input
              type="date"
              value={getDateString(currentDate)}
                onChange={e => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                  setCurrentDate(new Date(year, month - 1, day));
              }}
              className="border-2 border-[#EAC29D] px-3 py-2 rounded-full bg-white focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200"
              style={{ width: '120px' }}
            />
          ) : (
              <span className="font-semibold text-[#4B4036]">{formatDate(currentDate)}</span>
          )}
            <button onClick={handleNext} className="hanami-btn-cute px-2 py-1 text-[#4B4036]">▶</button>
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
            <img src="/teacher.png" alt="老師" className="w-4 h-4" />
            <span className="text-xs">{allShowTeachers ? '收起老師' : '展示老師'}</span>
          </button>
            <button className="flex items-center gap-1 px-2 py-1 hanami-btn-soft text-[#4B4036]" onClick={() => setAllShowStudents((prev) => !prev)}>
            <img src="/icons/penguin-face.png" alt="學生" className="w-4 h-4" />
            <span className="text-xs">{allShowStudents ? '收起學生' : '展示學生'}</span>
          </button>
            <button className="flex items-center gap-1 px-2 py-1 hanami-btn-soft text-[#4B4036]" onClick={() => setAllShowPlan((prev) => !prev)}>
            <img src="/details.png" alt="課堂活動" className="w-4 h-4" />
            <span className="text-xs">{allShowPlan ? '收起活動' : '展示活動'}</span>
          </button>
          <button
            onClick={async (e) => {
                const btn = e.currentTarget.querySelector('img');
              if (btn) {
                  btn.classList.add('animate-spin');
                  setTimeout(() => btn.classList.remove('animate-spin'), 1000);
              }
                const weekStart = getHongKongDate(currentDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = getHongKongDate(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                await fetchLessons(weekStart, weekEnd);
                await fetchPlans(weekStart, weekEnd);
              await fetchTeachers();
            }}
              className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EBC9A4] text-[#4B4036] hover:bg-[#f7f3ec]"
              title="刷新資料"
          >
              <img src="/refresh.png" alt="Refresh" className="w-4 h-4" />
          </button>
        </div>
      </div>
        {/* 日曆內容 */}
        <div className="w-full overflow-x-auto">
          {view === 'week' ? (
          <div className="grid grid-cols-7 gap-2 min-w-[700px] sm:min-w-0">
            {Array.from({ length: 7 }, (_, i) => {
              const weekStart = getHongKongDate(currentDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              const date = getHongKongDate(weekStart);
              date.setDate(date.getDate() + i);
              const groupedArray = renderDayLessons(date);
              
              return (
                <div key={i} className="p-2 rounded-xl text-center text-[#4B4036] text-sm bg-[#FFFDF8] flex flex-col items-center">
                  <div className="font-semibold">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</div>
                  <div className="text-xs text-gray-500">{date.getDate()}</div>
                  <div className="flex flex-col items-center gap-2 mt-1 w-full">
                    {groupedArray.map((group, j) => {
                      const matchedPlan = (plans || []).find(
                        p =>
                          p.lesson_date === getDateString(date) &&
                          p.timeslot === group.time &&
                          p.course_type === group.course
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
                          time={group.time?.slice(0, 5) || ''}
                          course={{ name: group.course }}
                          students={group.students.map(student => ({
                            id: student.student_id,
                            name: student.name,
                            age: student.age,
                            isTrial: student.is_trial,
                            remainingLessons: student.remaining_lessons ?? undefined,
                            avatar: undefined
                          }))}
                          plan={plan}
                          onEdit={() => {
                            const matchedPlan = (plans || []).find(
                              p =>
                                p.lesson_date === getDateString(date) &&
                                p.timeslot === group.time &&
                                p.course_type === group.course
                            );
                            setModalInfo({ date, time: group.time, course: group.course, plan: matchedPlan });
                            setIsModalOpen(true);
                          }}
                          onClick={() => {
                            setSelectedLesson({
                              time: group.time?.slice(0, 5) || '',
                              course: { name: group.course },
                              teachers: teachers,
                              students: group.students.map(student => ({
                                id: student.student_id,
                                name: student.name,
                                age: student.age,
                                isTrial: student.is_trial,
                                remainingLessons: student.remaining_lessons ?? undefined,
                                avatar: undefined
                              })),
                              plan,
                              onEdit: () => {
                                setModalInfo({ date, time: group.time, course: group.course });
                                setIsModalOpen(true);
                              }
                            });
                          }}
                          duration={lessons.find(l =>
                            l.regular_timeslot === group.time &&
                            l.course_type === group.course &&
                            getDateString(new Date(l.lesson_date)) === getDateString(date)
                          )?.lesson_duration || undefined}
                          allShowTeachers={allShowTeachers}
                          allShowStudents={allShowStudents}
                          allShowPlan={allShowPlan}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
            // day view
            (() => {
                const date = getHongKongDate(currentDate);
                const dayLessons = lessons.filter(l => getDateString(new Date(l.lesson_date)) === getDateString(date));
                dayLessons.sort((a, b) => a.regular_timeslot.localeCompare(b.regular_timeslot));
                const grouped = dayLessons.reduce<Record<string, Group>>((acc, l) => {
                  const key = `${l.regular_timeslot}_${l.course_type}`;
                  if (!acc[key]) {
                    acc[key] = {
                      time: l.regular_timeslot,
                      course: l.course_type,
                      students: []
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
                    remaining_lessons: l.remaining_lessons
                  });
                  return acc;
                }, {});
                const groupedArray = Object.values(grouped) as Group[];
                  return (
                <div className="flex flex-col gap-2 items-center w-full">
                  {groupedArray.map((group, j) => (
                        <MiniLessonCard
                      key={j}
                          time={group.time?.slice(0, 5) || ''}
                          course={{ name: group.course }}
                      students={group.students.map(student => ({
                        id: student.student_id,
                        name: student.name,
                        age: student.age,
                        isTrial: student.is_trial,
                        remainingLessons: student.remaining_lessons ?? undefined,
                        avatar: undefined
                      }))}
                          onEdit={() => {
                            const matchedPlan = (plans || []).find(
                              p =>
                                p.lesson_date === getDateString(date) &&
                                p.timeslot === group.time &&
                                p.course_type === group.course
                            );
                            setModalInfo({ date, time: group.time, course: group.course, plan: matchedPlan });
                            setIsModalOpen(true);
                          }}
                          onClick={() => {
                            setSelectedLesson({
                          time: group.time?.slice(0, 5) || '',
                              course: { name: group.course },
                          teachers: (teachers || []) as Teacher[],
                          students: group.students.map(student => ({
                            id: student.student_id,
                            name: student.name,
                            age: student.age,
                            isTrial: student.is_trial,
                            remainingLessons: student.remaining_lessons ?? undefined,
                            avatar: undefined
                          })),
                              onEdit: () => {
                                setModalInfo({ date, time: group.time, course: group.course });
                                setIsModalOpen(true);
                              }
                            });
                          }}
                          duration={lessons.find(l =>
                            l.regular_timeslot === group.time &&
                            l.course_type === group.course &&
                            getDateString(new Date(l.lesson_date)) === getDateString(date)
                          )?.lesson_duration || undefined}
                          allShowTeachers={allShowTeachers}
                          allShowStudents={allShowStudents}
                          allShowPlan={allShowPlan}
                        />
                  ))}
                      </div>
              );
            })()
          )}
            </div>
        {/* LessonCard 彈窗 */}
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedLesson(null)}>
            <div className="max-w-md w-full relative" onClick={e => e.stopPropagation()}>
              <LessonCard 
                time={selectedLesson.time}
                course={selectedLesson.course}
                teachers={selectedLesson.teachers.map(t => ({
                  name: t.teacher_fullname,
                  avatar: undefined
                }))}
                students={selectedLesson.students}
                plan={selectedLesson.plan ? {
                  teacherNames: [...selectedLesson.plan.teacherNames1, ...selectedLesson.plan.teacherNames2],
                  objectives: selectedLesson.plan.objectives,
                  materials: selectedLesson.plan.materials
                } : undefined}
                onEdit={selectedLesson.onEdit}
                onClose={() => setSelectedLesson(null)}
              />
            </div>
          </div>
        )}
        {modalInfo && (
          <LessonPlanModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            lessonDate={modalInfo.date}
            timeslot={modalInfo.time}
            courseType={modalInfo.course}
            existingPlan={modalInfo.plan}
            onSaved={async () => {
              const weekStart = getHongKongDate(currentDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              const weekEnd = getHongKongDate(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              await updatePlan(weekStart, weekEnd);
            }}
          />
        )}
        </div>
    </div>
  );
};

export default HanamiTC;

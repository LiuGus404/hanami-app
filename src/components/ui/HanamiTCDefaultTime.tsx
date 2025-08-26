'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import MiniLessonCard from './MiniLessonCard';
import LessonCard from './LessonCard';
import LessonPlanModal from './LessonPlanModal';
import AITeacherSchedulerModal from './AITeacherSchedulerModal';
import StudentActivitiesPanel from './StudentActivitiesPanel';
import { Teacher } from '@/types';

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

interface HanamiTCDefaultTimeProps {
  teachers: Teacher[];
}

const HanamiTCDefaultTime: React.FC<HanamiTCDefaultTimeProps> = ({ teachers }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const supabase = getSupabaseClient();
  const [defaultLessons, setDefaultLessons] = useState<ProcessedDefaultLesson[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [view, setView] = useState<'day' | 'week'>('week');
  const [allShowTeachers, setAllShowTeachers] = useState(false);
  const [allShowStudents, setAllShowStudents] = useState(true);
  const [allShowPlan, setAllShowPlan] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);
  const [isStudentActivitiesModalOpen, setIsStudentActivitiesModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    courseType: string;
    age?: string;
    lessonDate?: string;
    timeslot?: string;
  } | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{
    time: string;
    course: { name: string };
    teachers: Teacher[];
    students: Array<{
      id: string;
      name: string;
      age: string;
      isTrial: boolean;
      remainingLessons?: number;
    }>;
    plan?: any;
    onEdit: () => void;
  } | null>(null);
  const [modalInfo, setModalInfo] = useState<{
    date: Date;
    time: string;
    course: string;
    plan?: any;
  } | null>(null);
  const loadingRef = useRef(false);

  // 獲取香港時區的日期
  const getHongKongDate = (date: Date) => {
    return new Date(date.getTime() + 8 * 60 * 60 * 1000);
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    const hkDate = getHongKongDate(date);
    const year = hkDate.getFullYear();
    const month = String(hkDate.getMonth() + 1).padStart(2, '0');
    const day = String(hkDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 獲取日期字符串
  const getDateString = (date: Date) => {
    return formatDate(date);
  };

  // 獲取預設課程資料
  const fetchDefaultLessons = async (startDate: Date, endDate: Date): Promise<void> => {
    const startDateStr = getDateString(startDate);
    const endDateStr = getDateString(endDate);
    
    try {
      // 直接從Hanami_Students獲取預設時間資料
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select(`id, full_name, student_age, regular_weekday, regular_timeslot, course_type, contact_number`)
        .not('regular_weekday', 'is', null)
        .not('regular_timeslot', 'is', null);

      if (studentsError) {
        console.error('Fetch students error:', studentsError);
        return;
      }

      // 過濾掉無效的時間段
      const validStudents = (studentsData || []).filter(student =>
        student.regular_weekday !== null &&
        student.regular_timeslot !== null &&
        student.regular_timeslot !== '' &&
        student.regular_timeslot !== 'null'
      );

      // 批量計算剩餘課程數
      const studentIds = validStudents.map(s => s.id);
      const remainingLessonsMap = await calculateRemainingLessonsBatch(studentIds, new Date());

      // 處理資料
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

      setDefaultLessons(prevLessons => {
        // 合併新資料，避免重複
        const existingIds = new Set(prevLessons.map(l => l.id));
        const newLessons = processedDefaultLessons.filter(l => !existingIds.has(l.id));
        return [...prevLessons, ...newLessons];
      });

      // 同時更新學生資料
      setStudents(prevStudents => {
        const existingIds = new Set(prevStudents.map(s => s.id));
        const newStudents = validStudents.filter(s => !existingIds.has(s.id));
        return [...prevStudents, ...newStudents];
      });

    } catch (error) {
      console.error('Error fetching default lessons:', error);
    }
  };

  // 獲取教案資料
  const fetchPlans = async (startDate: Date, endDate: Date) => {
    const { data } = await supabase
      .from('hanami_lesson_plan')
      .select('*')
      .gte('lesson_date', getDateString(startDate))
      .lte('lesson_date', getDateString(endDate));
    
    setPlans(data || []);
  };

  // 重新載入資料
  const reloadData = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 7);

      await Promise.all([
        fetchDefaultLessons(startDate, endDate),
        fetchPlans(startDate, endDate)
      ]);
    } catch (error) {
      console.error('Error reloading data:', error);
    } finally {
      loadingRef.current = false;
    }
  };

  // 初始載入
  useEffect(() => {
    reloadData();
  }, [currentDate]);

  // 切換日期
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // 渲染每日預設課程
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
        <div className="font-semibold text-[#4B4036] text-lg mb-1">{['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}</div>
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
              onStudentClick={(student) => {
                // 打開學生活動面板
                // 在預設時間模式下，使用今天的日期作為 lessonDate
                const today = new Date();
                const studentData = group.students.find(s => s.student_id === student.id);
                setSelectedStudent({
                  id: student.id || '',
                  name: student.name,
                  courseType: group.course,
                  age: studentData?.age,
                  lessonDate: getDateString(today),
                  timeslot: group.time || '',
                });
                setIsStudentActivitiesModalOpen(true);
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
              {['日', '一', '二', '三', '四', '五', '六'][currentDate.getDay()]}
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
                // 計算該星期的日期：從星期日開始
                const weekStart = getHongKongDate(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                const date = getHongKongDate(weekStart);
                date.setDate(date.getDate() + i);
                const groupedArray = renderDayDefaultLessons(date);
                
                return (
                  <div key={i} className="p-2 rounded-xl text-center text-[#4B4036] text-sm bg-[#FFFDF8] flex flex-col items-center h-full">
                    <div className="font-semibold">{['日', '一', '二', '三', '四', '五', '六'][i]}</div>
                    <div className="text-xs text-gray-500">{date.getDate()}</div>
                    
                    {groupedArray.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2 mb-1 w-full">
                        {generateCourseStats(groupedArray).map((stat, index) => (
                          <div key={index} className="rounded-full px-2 py-1" style={{ backgroundColor: getCourseColor(stat.courseName) }}>
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
                            duration={undefined}
                            plan={plan}
                            students={group.students.map(student => ({
                              id: student.student_id,
                              name: student.name,
                              age: student.age,
                              isTrial: false,
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
                            onStudentClick={(student) => {
                              // 打開學生活動面板
                              // 在預設時間模式下，使用今天的日期作為 lessonDate
                              const today = new Date();
                              const studentData = group.students.find(s => s.student_id === student.id);
                              setSelectedStudent({
                                id: student.id || '',
                                name: student.name,
                                courseType: group.course,
                                age: studentData?.age,
                                lessonDate: getDateString(today),
                                timeslot: group.time || '',
                              });
                              setIsStudentActivitiesModalOpen(true);
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

        {/* 學生活動面板模態框 */}
        {selectedStudent && isStudentActivitiesModalOpen && (
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
                    setIsStudentActivitiesModalOpen(false);
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

export default HanamiTCDefaultTime;

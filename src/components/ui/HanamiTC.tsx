import * as React from 'react';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import PopupSelect from '@/components/ui/PopupSelect';
import LessonPlanModal from '@/components/ui/LessonPlanModal';
import { useLessonPlans, LessonPlan } from '@/hooks/useLessonPlans';
import LessonCard from './LessonCard';
import MiniLessonCard from './MiniLessonCard';

type Lesson = {
  id: string;
  student_id: string;
  lesson_date: string;
  regular_timeslot: string;
  course_type: string;
  full_name: string;
  student_age: number | null;
  lesson_status?: string | null;
  remaining_lessons?: number | null;
  is_trial: boolean;
  lesson_duration?: string | null;
};

type Student = {
  id: string;
  full_name: string;
  student_age: number | null;
};

type Group = {
  time: string;
  course: string;
  students: {
    name: string;
    student_id: string;
    age: string;
    is_trial: boolean;
    remaining_lessons?: number | null;
  }[];
};

const getHongKongDate = (date = new Date()) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 8 * 3600000);
};

const HanamiTC = () => {
  const [currentDate, setCurrentDate] = useState(getHongKongDate());
  const supabase = getSupabaseClient();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [popupSelected, setPopupSelected] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    date: Date;
    time: string;
    course: string;
  } | null>(null);
  const { plans, fetchPlans } = useLessonPlans();
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeacher1, setSelectedTeacher1] = useState<string[]>([]);
  const [selectedTeacher2, setSelectedTeacher2] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<'main' | 'assist' | null>(null);
  const [tempSelectedTeacher1, setTempSelectedTeacher1] = useState<string[]>([]);
  const [tempSelectedTeacher2, setTempSelectedTeacher2] = useState<string[]>([]);
  const [allShowTeachers, setAllShowTeachers] = useState(true);
  const [allShowStudents, setAllShowStudents] = useState(true);
  const [allShowPlan, setAllShowPlan] = useState(true);
  const [view, setView] = useState<'week' | 'day'>('week');

  const getDateString = (date) => {
    return getHongKongDate(date).toLocaleDateString('sv-SE');
  };

  const fetchLessons = async (startDate, endDate) => {
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
      .gte('lesson_date', startDate.toISOString())
      .lte('lesson_date', endDate.toISOString());

    const { data: trialLessonsData, error: trialLessonsError } = await supabase
      .from('hanami_trial_students')
      .select('*')
      .gte('lesson_date', startDate.toISOString())
      .lte('lesson_date', endDate.toISOString());

    if (regularLessonsError || trialLessonsError) {
      console.error('Fetch error:', regularLessonsError || trialLessonsError);
      return;
    }

    // 處理常規學生數據
    const processedRegularLessons = (regularLessonsData || []).map((lesson) => ({
      id: lesson.id,
      student_id: lesson.student_id,
      lesson_date: lesson.lesson_date,
      regular_timeslot: lesson.regular_timeslot,
      course_type: lesson.course_type,
      full_name: lesson.Hanami_Students?.full_name || '未命名學生',
      student_age: lesson.Hanami_Students?.student_age || null,
      lesson_status: lesson.lesson_status,
      remaining_lessons: lesson.Hanami_Students?.remaining_lessons || null,
      is_trial: false,
      lesson_duration: lesson.lesson_duration || null,
    }));

    // 處理試堂學生數據
    const processedTrialLessons = (trialLessonsData || []).map((trial) => ({
      id: trial.id,
      student_id: trial.id,
      lesson_date: trial.lesson_date,
      regular_timeslot: trial.actual_timeslot,
      course_type: trial.course_type,
      full_name: trial.full_name || '未命名學生',
      student_age: trial.student_age,
      lesson_status: null,
      is_trial: true,
      lesson_duration: trial.lesson_duration || null,
    }));

    // 合併常規和試堂學生的課堂
    const allLessons = [...processedRegularLessons, ...processedTrialLessons];
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

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname')
        .not('teacher_nickname', 'is', null);

      if (error) {
        console.error('Error fetching teachers:', error);
        setTeachers([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No teachers found in database');
        setTeachers([]);
        return;
      }

      const formattedTeachers = data.map(teacher => ({
        id: teacher.id,
        name: teacher.teacher_nickname
      }));

      setTeachers(formattedTeachers);
      console.log('teachers:', formattedTeachers);
    } catch (error) {
      console.error('Unexpected error in fetchTeachers:', error);
      setTeachers([]);
    }
  };

  useEffect(() => {
    const weekStart = getHongKongDate(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = getHongKongDate(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    fetchLessons(weekStart, weekEnd);
    fetchPlans(weekStart, weekEnd);
    fetchTeachers();
  }, [currentDate]);

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

  const formatDate = (date) => {
    const weekStart = getHongKongDate(new Date(date));
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = getHongKongDate(new Date(weekStart));
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.getFullYear()}/${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
  };

  const getStudentAge = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student || student.student_age === null || student.student_age === undefined) return '';
    const months = typeof student.student_age === 'string' ? parseInt(student.student_age) : student.student_age;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (!years && !remainingMonths) return '';
    return `${years}`;
  };

  const renderStudentButton = (nameObj, lesson) => {
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
        <div className="flex items-center gap-2">
          {/* 日/週切換按鈕 */}
          <button
            className={`px-3 py-1 rounded-full border ${view === 'day' ? 'bg-[#EBC9A4]' : 'bg-white border-[#EADBC8]'}`}
            onClick={() => setView('day')}
          >日</button>
          <button
            className={`px-3 py-1 rounded-full border ${view === 'week' ? 'bg-[#EBC9A4]' : 'bg-white border-[#EADBC8]'}`}
            onClick={() => setView('week')}
          >週</button>
          {/* 展示/收起所有老師 */}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EADBC8]"
            onClick={() => setAllShowTeachers((prev) => !prev)}
            title={allShowTeachers ? '收起所有老師' : '展示所有老師'}
          >
            <img src="/teacher.png" alt="老師" className="w-4 h-4" />
            <span className="text-xs">{allShowTeachers ? '收起老師' : '展示老師'}</span>
          </button>
          {/* 展示/收起所有學生 */}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EADBC8]"
            onClick={() => setAllShowStudents((prev) => !prev)}
            title={allShowStudents ? '收起所有學生' : '展示所有學生'}
          >
            <img src="/icons/penguin-face.png" alt="學生" className="w-4 h-4" />
            <span className="text-xs">{allShowStudents ? '收起學生' : '展示學生'}</span>
          </button>
          {/* 展示/收起所有課堂活動 */}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EADBC8]"
            onClick={() => setAllShowPlan((prev) => !prev)}
            title={allShowPlan ? '收起課堂活動' : '展示課堂活動'}
          >
            <img src="/details.png" alt="課堂活動" className="w-4 h-4" />
            <span className="text-xs">{allShowPlan ? '收起活動' : '展示活動'}</span>
          </button>
          {/* 原本的 refresh 按鈕 */}
          <button
            onClick={async (e) => {
              const btn = document.getElementById('refresh-btn');
              if (btn) {
                btn.classList.add('animate-spin', 'duration-700');
                setTimeout(() => btn.classList.remove('animate-spin', 'duration-700'), 1000);
              }
              const start = new Date(currentDate);
              const end = new Date(currentDate);
              if (view === 'week') {
                start.setDate(start.getDate() - start.getDay());
                end.setDate(start.getDate() + 6);
              }
              // 若為 day view，start/end 都是 currentDate
              await fetchLessons(start, end);
              await fetchPlans(start, end);
              await fetchTeachers();
            }}
            id="refresh-btn"
            className="px-3 py-1 rounded-full border bg-white border-[#EBC9A4] ml-2 transition-transform"
          >
            <span className="inline-block">
              <img src="/refresh.png" alt="Refresh" className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* 主內容區塊 */}
      {view === 'week' ? (
        <div className="w-full overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px] sm:min-w-0">
            {Array.from({ length: 7 }, (_, i) => {
              const weekStart = getHongKongDate(currentDate);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              const date = getHongKongDate(weekStart);
              date.setDate(date.getDate() + i);
              const dayLessons = lessons.filter(l => getDateString(new Date(l.lesson_date)) === getDateString(date));
              dayLessons.sort((a, b) => a.regular_timeslot.localeCompare(b.regular_timeslot));
              return (
                <div key={i} className="p-2 rounded-xl text-center text-[#4B4036] text-sm bg-[#FFFDF8] flex flex-col items-center">
                  <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</div>
                  <div className="flex flex-col items-center gap-2 mt-1 w-full">
                    {(() => {
                      const grouped = dayLessons.reduce<Record<string, Group>>((acc, l) => {
                        const key = `${l.regular_timeslot}_${l.course_type}`;
                        if (!acc[key]) {
                          acc[key] = {
                            time: l.regular_timeslot,
                            course: l.course_type,
                            students: []
                          };
                        }
                        // 計算歲數
                        let age = undefined;
                        if (l.student_age !== null && l.student_age !== undefined) {
                          age = typeof l.student_age === 'string' ? parseInt(l.student_age) : l.student_age;
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
                      return (Array.isArray(groupedArray) ? groupedArray : []).map((group, j) => {
                        const matchedPlan = plans.find(
                          p =>
                            p.lesson_date === getDateString(date) &&
                            p.timeslot === group.time &&
                            p.course_type === group.course
                        );
                        // 準備老師資料
                        const teacherNames = matchedPlan?.teacher_names || [];
                        const teachers = Array.isArray(teacherNames) ? teacherNames.map(name => ({ name })) : [];
                        // 準備學生資料
                        const studentsData = Array.isArray(group.students)
                          ? group.students.map(student => {
                              const lesson = lessons.find(l =>
                                l.student_id === student.student_id &&
                                l.regular_timeslot === group.time &&
                                l.course_type === group.course &&
                                getDateString(new Date(l.lesson_date)) === getDateString(date)
                              );
                              return {
                                id: student.student_id,
                                name: student.name,
                                age: student.age,
                                isTrial: student.is_trial,
                                remainingLessons: lesson?.remaining_lessons ?? undefined,
                                teacher: lesson?.lesson_teacher ?? undefined,
                              };
                            })
                          : [];
                        // 準備教案內容
                        const plan = matchedPlan
                          ? {
                              teacherNames: Array.isArray(matchedPlan.teacher_names) ? matchedPlan.teacher_names : [],
                              objectives: Array.isArray(matchedPlan.objectives) ? matchedPlan.objectives : [],
                              materials: Array.isArray(matchedPlan.materials) ? matchedPlan.materials : [],
                            }
                          : {
                              teacherNames: [],
                              objectives: [],
                              materials: [],
                            };
                        // Mini 卡片點擊時彈出大卡片
                        return (
                          <React.Fragment key={j}>
                            <div className="flex justify-center w-full">
                              <MiniLessonCard
                                time={group.time?.slice(0, 5) || ''}
                                course={{ name: group.course }}
                                students={studentsData}
                                plan={plan}
                                onEdit={() => {
                                  setModalInfo({ date, time: group.time, course: group.course });
                                  setIsModalOpen(true);
                                }}
                                onClick={() => {
                                  // 找到該 group 的第一個 lesson 以取得 regular_timeslot 和 lesson_duration
                                  const lessonForTime = lessons.find(l =>
                                    l.regular_timeslot === group.time &&
                                    l.course_type === group.course &&
                                    getDateString(new Date(l.lesson_date)) === getDateString(date)
                                  );
                                  let timeStr = group.time?.slice(0, 5) || '';
                                  if (lessonForTime && lessonForTime.lesson_duration && group.time) {
                                    // 計算結束時間
                                    const [h, m] = group.time.split(':').map(Number);
                                    const [dh, dm] = lessonForTime.lesson_duration.split(':').map(Number);
                                    const startDate = new Date(2000, 0, 1, h, m);
                                    const endDate = new Date(startDate.getTime() + (dh * 60 + dm) * 60000);
                                    const eh = endDate.getHours().toString().padStart(2, '0');
                                    const em = endDate.getMinutes().toString().padStart(2, '0');
                                    timeStr = `${group.time.slice(0, 5)}-${eh}:${em}`;
                                  }
                                  setSelectedLesson({
                                    time: timeStr,
                                    course: { name: group.course },
                                    teachers,
                                    students: studentsData,
                                    plan,
                                    miniKey: `${i}_${j}`,
                                    showActivities: false,
                                    onEdit: () => {
                                      setModalInfo({ date, time: group.time, course: group.course });
                                      setIsModalOpen(true);
                                    }
                                  });
                                }}
                                startTime={group.time?.slice(0, 5)}
                                duration={lessons.find(l =>
                                  l.regular_timeslot === group.time &&
                                  l.course_type === group.course &&
                                  getDateString(new Date(l.lesson_date)) === getDateString(date)
                                )?.lesson_duration || undefined}
                                allShowTeachers={allShowTeachers}
                                allShowStudents={allShowStudents}
                                allShowPlan={allShowPlan}
                              />
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="p-2 rounded-xl text-center text-[#4B4036] text-sm bg-[#FFFDF8] flex flex-col items-center">
            <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][getHongKongDate(currentDate).getDay()]}</div>
            <div className="flex flex-col items-center gap-2 mt-1 w-full">
              {(() => {
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
                  // 計算歲數
                  let age = undefined;
                  if (l.student_age !== null && l.student_age !== undefined) {
                    age = typeof l.student_age === 'string' ? parseInt(l.student_age) : l.student_age;
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
                return (Array.isArray(groupedArray) ? groupedArray : []).map((group, j) => {
                  const matchedPlan = plans.find(
                    p =>
                      p.lesson_date === getDateString(date) &&
                      p.timeslot === group.time &&
                      p.course_type === group.course
                  );
                  // 準備老師資料
                  const teacherNames = matchedPlan?.teacher_names || [];
                  const teachers = Array.isArray(teacherNames) ? teacherNames.map(name => ({ name })) : [];
                  // 準備學生資料
                  const studentsData = Array.isArray(group.students)
                    ? group.students.map(student => {
                        const lesson = lessons.find(l =>
                          l.student_id === student.student_id &&
                          l.regular_timeslot === group.time &&
                          l.course_type === group.course &&
                          getDateString(new Date(l.lesson_date)) === getDateString(date)
                        );
                        return {
                          id: student.student_id,
                          name: student.name,
                          age: student.age,
                          isTrial: student.is_trial,
                          remainingLessons: lesson?.remaining_lessons ?? undefined,
                          teacher: lesson?.lesson_teacher ?? undefined,
                        };
                      })
                    : [];
                  // 準備教案內容
                  const plan = matchedPlan
                    ? {
                        teacherNames: Array.isArray(matchedPlan.teacher_names) ? matchedPlan.teacher_names : [],
                        objectives: Array.isArray(matchedPlan.objectives) ? matchedPlan.objectives : [],
                        materials: Array.isArray(matchedPlan.materials) ? matchedPlan.materials : [],
                      }
                    : {
                        teacherNames: [],
                        objectives: [],
                        materials: [],
                      };
                  // Mini 卡片點擊時彈出大卡片
                  return (
                    <React.Fragment key={j}>
                      <div className="flex justify-center w-full">
                        <MiniLessonCard
                          time={group.time?.slice(0, 5) || ''}
                          course={{ name: group.course }}
                          students={studentsData}
                          plan={plan}
                          onEdit={() => {
                            setModalInfo({ date, time: group.time, course: group.course });
                            setIsModalOpen(true);
                          }}
                          onClick={() => {
                            // 找到該 group 的第一個 lesson 以取得 regular_timeslot 和 lesson_duration
                            const lessonForTime = lessons.find(l =>
                              l.regular_timeslot === group.time &&
                              l.course_type === group.course &&
                              getDateString(new Date(l.lesson_date)) === getDateString(date)
                            );
                            let timeStr = group.time?.slice(0, 5) || '';
                            if (lessonForTime && lessonForTime.lesson_duration && group.time) {
                              // 計算結束時間
                              const [h, m] = group.time.split(':').map(Number);
                              const [dh, dm] = lessonForTime.lesson_duration.split(':').map(Number);
                              const startDate = new Date(2000, 0, 1, h, m);
                              const endDate = new Date(startDate.getTime() + (dh * 60 + dm) * 60000);
                              const eh = endDate.getHours().toString().padStart(2, '0');
                              const em = endDate.getMinutes().toString().padStart(2, '0');
                              timeStr = `${group.time.slice(0, 5)}-${eh}:${em}`;
                            }
                            setSelectedLesson({
                              time: timeStr,
                              course: { name: group.course },
                              teachers,
                              students: studentsData,
                              plan,
                              miniKey: `day_${j}`,
                              showActivities: false,
                              onEdit: () => {
                                setModalInfo({ date, time: group.time, course: group.course });
                                setIsModalOpen(true);
                              }
                            });
                          }}
                          startTime={group.time?.slice(0, 5)}
                          duration={lessons.find(l =>
                            l.regular_timeslot === group.time &&
                            l.course_type === group.course &&
                            getDateString(new Date(l.lesson_date)) === getDateString(date)
                          )?.lesson_duration || undefined}
                          allShowTeachers={allShowTeachers}
                          allShowStudents={allShowStudents}
                          allShowPlan={allShowPlan}
                        />
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {modalInfo && (
        <LessonPlanModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalInfo(null);
          }}
          lessonDate={modalInfo.date}
          timeslot={modalInfo.time}
          courseType={modalInfo.course}
          existingPlan={plans.find(
            p =>
              p.lesson_date === getDateString(modalInfo.date) &&
              p.timeslot === modalInfo.time &&
              p.course_type === modalInfo.course
          )}
          onSaved={async () => {
            const weekStart = getHongKongDate(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = getHongKongDate(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            await fetchPlans(weekStart, weekEnd);
            setSelectedTeacher1(modalInfo.existingPlan?.teacher_ids_1 || []);
            setSelectedTeacher2(modalInfo.existingPlan?.teacher_ids_2 || []);
          }}
          teachers={teachers}
        >
          <div className="flex items-center gap-4">
            <div>
              <span className="mr-2">主老師：</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  setTempSelectedTeacher1(selectedTeacher1);
                  setShowPopup('main');
                }}
              >
                {selectedTeacher1.length > 0
                  ? teachers.filter(t => selectedTeacher1.includes(t.id)).map(t => t.name).join('、')
                  : '請選擇'}
              </button>
            </div>
            <div>
              <span className="mr-2">副老師：</span>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => {
                  setTempSelectedTeacher2(selectedTeacher2);
                  setShowPopup('assist');
                }}
              >
                {selectedTeacher2.length > 0
                  ? teachers.filter(t => selectedTeacher2.includes(t.id)).map(t => t.name).join('、')
                  : '請選擇'}
              </button>
            </div>
          </div>
        </LessonPlanModal>
      )}

      {showPopup === 'main' && (
        <PopupSelect
          title="選擇主老師"
          options={teachers.map(t => ({ value: t.id, label: t.name }))}
          selected={tempSelectedTeacher1}
          onChange={setTempSelectedTeacher1}
          onConfirm={() => {
            setSelectedTeacher1(tempSelectedTeacher1);
            setShowPopup(null);
          }}
          onCancel={() => setShowPopup(null)}
          mode="multi"
        />
      )}
      {showPopup === 'assist' && (
        <PopupSelect
          title="選擇副老師"
          options={teachers.map(t => ({ value: t.id, label: t.name }))}
          selected={tempSelectedTeacher2}
          onChange={setTempSelectedTeacher2}
          onConfirm={() => {
            setSelectedTeacher2(tempSelectedTeacher2);
            setShowPopup(null);
          }}
          onCancel={() => setShowPopup(null)}
          mode="multi"
        />
      )}

      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedLesson(null)}>
          <div className="max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <LessonCard {...selectedLesson} onClose={() => setSelectedLesson(null)} allShowTeachers={allShowTeachers} allShowStudents={allShowStudents} allShowPlan={allShowPlan} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HanamiTC;

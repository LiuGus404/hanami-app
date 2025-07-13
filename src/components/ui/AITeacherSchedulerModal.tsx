import React, { useState, useEffect } from 'react';

import Calendarui from './Calendarui';

import { getSupabaseClient } from '@/lib/supabase';
import { Teacher } from '@/types';

interface AITeacherSchedulerModalProps {
  open: boolean;
  onClose: () => void;
  teachers: Teacher[];
}

interface TeacherRequirement {
  teacherId: string;
  teacherName: string;
  requirement: string;
  startTime: string;
  endTime: string;
  courses: {
    courseId: string;
    main: boolean;
    assist: boolean;
  }[];
}

interface CourseType {
  id: string;
  name: string;
}

interface DaySchedule {
  date: string;
  teachers: TeacherRequirement[];
  hasSchedule: boolean; // 新增：該日有無老師上班
}

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMonthDays = (year: number, month: number) => {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
};

const AITeacherSchedulerModal: React.FC<AITeacherSchedulerModalProps> = ({
  open,
  onClose,
  teachers,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [savingTeacherId, setSavingTeacherId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ [teacherId: string]: string }>({});

  // 進入時查詢課程
  useEffect(() => {
    if (!open) return;
    const fetchCourses = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from('Hanami_CourseTypes').select('id, name').eq('status', true);
      setCourseTypes(Array.isArray(data) ? data.map(c => ({ ...c, name: c.name ?? '' })) : []);
    };
    fetchCourses();
  }, [open]);

  // 1. 切換日期時自動查詢老師設定
  useEffect(() => {
    if (!open || !daySchedule || daySchedule.teachers.length === 0) return;
    const fetchTeacherRoles = async () => {
      const supabase = getSupabaseClient();
      const ids = daySchedule.teachers.map(t => t.teacherId);
      const { data } = await supabase
        .from('hanami_employee')
        .select('id, course_roles, course_roles_note')
        .in('id', ids);
      if (Array.isArray(data)) {
        setDaySchedule(prev => prev ? {
          ...prev,
          teachers: prev.teachers.map(t => {
            let found: any = undefined;
            if (Array.isArray(data) && data.length > 0 && 'id' in data[0]) {
              found = data.find((d: any) => d.id === t.teacherId);
            }
            let courses = t.courses;
            if (found?.course_roles) {
              // course_roles: { [courseId]: { main: boolean, assist: boolean } }
              courses = courses.map(c =>
                found.course_roles[c.courseId]
                  ? { ...c, ...found.course_roles[c.courseId] }
                  : c,
              );
            }
            return {
              ...t,
              courses,
              requirement: found?.course_roles_note || '',
            };
          }),
        } : null);
      }
    };
    fetchTeacherRoles();
    // eslint-disable-next-line
  }, [open, daySchedule?.teachers.map(t => t.teacherId).join(',')]);

  // 2. 儲存成功提示動畫
  const [fadeOutTeacherId, setFadeOutTeacherId] = useState<string | null>(null);
  useEffect(() => {
    if (!fadeOutTeacherId) return;
    const timer = setTimeout(() => {
      setSaveMessage(msg => ({ ...msg, [fadeOutTeacherId]: '' }));
      setFadeOutTeacherId(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [fadeOutTeacherId]);

  // 工具函數：本地 yyyy-mm-dd
  const formatDateLocal = (date: Date | string) => {
    if (typeof date === 'string') return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 單選日期
  const handleDateSelect = async (date: string) => {
    // date 已經是 yyyy-mm-dd
    if (selectedDate === date) {
      setSelectedDate(undefined);
      setDaySchedule(null);
      return;
    }
    // 查詢 teacher_schedule，join hanami_employee
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('teacher_schedule')
      .select('teacher_id, start_time, end_time, hanami_employee(id, teacher_fullname, teacher_nickname)')
      .eq('scheduled_date', date); // 這裡 date 已經是本地 yyyy-mm-dd
    const teacherRows = Array.isArray(data) ? data : [];
    const hasSchedule = teacherRows.length > 0;
    setDaySchedule({
      date,
      teachers: teacherRows.map((row: any) => ({
        teacherId: row.teacher_id,
        teacherName: row.hanami_employee?.teacher_nickname || row.hanami_employee?.teacher_fullname || '',
        requirement: '',
        startTime: row.start_time,
        endTime: row.end_time,
        courses: courseTypes.map(c => ({ courseId: c.id, main: false, assist: false })),
      })),
      hasSchedule,
    });
    setSelectedDate(date);
  };

  const handleRequirementChange = (date: string, teacherId: string, requirement: string) => {
    setDaySchedule(prev =>
      prev ? {
        ...prev,
        teachers: prev.teachers.map(teacher =>
          teacher.teacherId === teacherId
            ? { ...teacher, requirement }
            : teacher,
        ),
      } : null,
    );
  };

  const handleCourseCheckboxChange = (teacherId: string, courseId: string, type: 'main' | 'assist', checked: boolean) => {
    setDaySchedule(prev => prev ? {
      ...prev,
      teachers: prev.teachers.map(t =>
        t.teacherId === teacherId
          ? {
            ...t,
            courses: t.courses.map(c =>
              c.courseId === courseId
                ? { ...c, [type]: checked }
                : c,
            ),
          }
          : t,
      ),
    } : null);
  };

  const handleCoursePillClick = (teacherId: string, courseId: string, type: 'main' | 'assist') => {
    setDaySchedule(prev => prev ? {
      ...prev,
      teachers: prev.teachers.map(t =>
        t.teacherId === teacherId
          ? {
            ...t,
            courses: t.courses.map(c =>
              c.courseId === courseId
                ? { ...c, [type]: !c[type] }
                : c,
            ),
          }
          : t,
      ),
    } : null);
  };

  const handleSelectAll = (teacherId: string) => {
    setDaySchedule(prev => prev ? {
      ...prev,
      teachers: prev.teachers.map(t =>
        t.teacherId === teacherId
          ? {
            ...t,
            courses: t.courses.map(c => ({ ...c, main: true, assist: true })),
          }
          : t,
      ),
    } : null);
  };
  const handleClearAll = (teacherId: string) => {
    setDaySchedule(prev => prev ? {
      ...prev,
      teachers: prev.teachers.map(t =>
        t.teacherId === teacherId
          ? {
            ...t,
            courses: t.courses.map(c => ({ ...c, main: false, assist: false })),
          }
          : t,
      ),
    } : null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${date.getMonth() + 1}/${date.getDate()} (週${weekdays[date.getDay()]})`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      const payload = {
        dates: daySchedule
          ? [
            {
              date: daySchedule.date,
              formattedDate: formatDate(daySchedule.date),
              teachers: daySchedule.teachers.filter(t => t.requirement.trim() !== ''),
            },
          ]
          : [],
      };
      const response = await fetch('https://webhook.lingumiai.com/webhook/b1987633-4ffb-4bcd-8c64-59e06f518e4c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSubmitMessage('✅ 老師安排需求已成功發送！');
        setTimeout(() => {
          onClose();
          setSelectedDate(undefined);
          setDaySchedule(null);
          setSubmitMessage('');
        }, 2000);
      } else {
        setSubmitMessage('❌ 發送失敗，請稍後再試');
      }
    } catch (error) {
      console.error('提交錯誤:', error);
      setSubmitMessage('❌ 發送失敗，請檢查網路連接');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 儲存按鈕
  const handleSaveTeacher = async (teacher: TeacherRequirement) => {
    setSavingTeacherId(teacher.teacherId);
    setSaveMessage(msg => ({ ...msg, [teacher.teacherId]: '' }));
    const supabase = getSupabaseClient();
    // course_roles: { [courseId]: { main, assist } }
    const course_roles: Record<string, { main: boolean; assist: boolean }> = {};
    teacher.courses.forEach(c => {
      course_roles[c.courseId] = { main: c.main, assist: c.assist };
    });
    const { error } = await supabase
      .from('hanami_employee')
      .update({})
      .eq('id', teacher.teacherId);
    if (!error) {
      setSaveMessage(msg => ({ ...msg, [teacher.teacherId]: '已儲存' }));
      setFadeOutTeacherId(teacher.teacherId);
    } else {
      setSaveMessage(msg => ({ ...msg, [teacher.teacherId]: '儲存失敗' }));
    }
    setSavingTeacherId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#EADBC8] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#2B3A3B] flex items-center gap-2">
            <img alt="AI" className="w-6 h-6" src="/icons/edit-pencil.png" />
            AI 安排老師
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {/* 日曆區域 */}
        <div className="mb-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
            <img alt="日曆" className="w-5 h-5" src="/calendar.png" />
            選擇需要安排老師的日期：
          </h3>
          <Calendarui value={selectedDate} onSelect={handleDateSelect} />
        </div>
        {/* 老師需求輸入區域 */}
        {daySchedule && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#4B4036] flex items-center gap-2">
              <img alt="老師" className="w-5 h-5" src="/teacher.png" />
              輸入老師安排需求：
            </h3>
            <div className="border border-[#EADBC8] rounded-xl p-4 bg-[#FFF9F2]">
              <h4 className="font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
                <img alt="日期" className="w-4 h-4" src="/calendar.png" />
                {formatDate(daySchedule.date)}
              </h4>
              {!daySchedule.hasSchedule ? (
                <div className="text-red-500 font-bold text-center py-4">當日沒有安排老師上班，未能使用</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {daySchedule.teachers.map((teacher) => (
                    <div key={teacher.teacherId} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-[#EADBC8]">
                      <div className="flex-shrink-0 w-full">
                        <span className="text-sm font-medium text-[#4B4036] flex items-center gap-1">
                          <img alt="老師" className="w-3 h-3" src="/teacher.png" />
                          {teacher.teacherName}（{teacher.startTime}~{teacher.endTime}）
                        </span>
                      </div>
                      <input
                        className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all bg-white"
                        disabled={!daySchedule.hasSchedule}
                        placeholder="輸入老師安排需求/備註..."
                        type="text"
                        value={teacher.requirement}
                        onChange={(e) => handleRequirementChange(daySchedule.date, teacher.teacherId, e.target.value)}
                      />
                      {/* 儲存/全選/消除按鈕同行 */}
                      <div className="flex gap-2 mb-1 items-center">
                        <button
                          className="px-3 py-1 rounded-full bg-[#FFD59A] text-[#4B4036] text-xs font-bold hover:bg-[#EAC29D] transition-all disabled:opacity-50"
                          disabled={savingTeacherId === teacher.teacherId || !daySchedule.hasSchedule}
                          type="button"
                          onClick={() => handleSaveTeacher(teacher)}
                        >{savingTeacherId === teacher.teacherId ? '儲存中...' : '儲存'}
                        </button>
                        <button
                          className="px-3 py-1 rounded-full bg-[#EAC29D] text-white text-xs font-bold hover:bg-[#D4B08A] transition-all"
                          disabled={!daySchedule.hasSchedule}
                          type="button"
                          onClick={() => handleSelectAll(teacher.teacherId)}
                        >全選
                        </button>
                        <button
                          className="px-3 py-1 rounded-full bg-gray-200 text-[#4B4036] text-xs font-bold hover:bg-gray-300 transition-all"
                          disabled={!daySchedule.hasSchedule}
                          type="button"
                          onClick={() => handleClearAll(teacher.teacherId)}
                        >消除
                        </button>
                        {saveMessage[teacher.teacherId] && (
                          <span className={`text-xs transition-opacity duration-700 ${fadeOutTeacherId === teacher.teacherId ? 'opacity-100 animate-fade-in-out' : 'opacity-100'}`}>{saveMessage[teacher.teacherId]}</span>
                        )}
                      </div>
                      {/* 課程主教/助教選擇 */}
                      <div className="flex flex-col gap-1 mt-1">
                        {courseTypes.map(course => {
                          const courseState = teacher.courses.find(c => c.courseId === course.id);
                          return (
                            <div key={course.id} className="flex items-center gap-3">
                              <span className="text-xs text-[#4B4036] w-20">{course.name}</span>
                              <button
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 focus:outline-none ${courseState?.main ? 'bg-[#FFD59A] text-[#4B4036] shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-[#FDE6B8]'}`}
                                disabled={!daySchedule.hasSchedule}
                                type="button"
                                onClick={() => handleCoursePillClick(teacher.teacherId, course.id, 'main')}
                              >主教
                              </button>
                              <button
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 focus:outline-none ${courseState?.assist ? 'bg-[#EBC9A4] text-[#4B4036] shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-[#FDE6B8]'}`}
                                disabled={!daySchedule.hasSchedule}
                                type="button"
                                onClick={() => handleCoursePillClick(teacher.teacherId, course.id, 'assist')}
                              >助教
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* 提交按鈕 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EADBC8]">
          {submitMessage && (
            <span className={`text-sm font-medium ${submitMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {submitMessage}
            </span>
          )}
          <button
            className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded-lg hover:bg-[#F5E7D4] transition-all font-medium"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="hanami-btn disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !daySchedule?.hasSchedule}
            onClick={handleSubmit}
          >
            {isSubmitting ? '發送中...' : '發送需求'}
          </button>
        </div>
      </div>
      {/* 動畫樣式 */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s;
        }
      `}
      </style>
    </div>
  );
};

export default AITeacherSchedulerModal; 
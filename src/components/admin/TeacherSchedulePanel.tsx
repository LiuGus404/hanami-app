'use client';

import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { useState, useEffect } from 'react';

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
}

export default function TeacherShiftCalendar({ teacherIds }: TeacherSchedulePanelProps) {
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
  const [dragSchedules, setDragSchedules] = useState<DragSchedule[]>([]);
  const [draggedTeacher, setDraggedTeacher] = useState<Teacher | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  useEffect(() => {
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
        const lessonQuery = supabase
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

        // Fetch schedules for the month
        let scheduleQuery = supabase
          .from('teacher_schedule')
          .select('id, teacher_id, scheduled_date, start_time, end_time, created_at, updated_at')
          .gte('scheduled_date', monthStartStr)
          .lte('scheduled_date', monthEndStr);

        // Fetch teachers
        let teacherQuery = supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_nickname');

        if (teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*') {
          scheduleQuery = scheduleQuery.in('teacher_id', teacherIds);
          teacherQuery = teacherQuery.in('id', teacherIds);
        }

        const [lessonResult, scheduleResult, teacherResult] = await Promise.all([
          lessonQuery,
          scheduleQuery,
          teacherQuery,
        ]);

        // Handle lesson data
        if (lessonResult.error) {
          console.warn('Warning fetching lessons:', lessonResult.error.message);
        } else if (lessonResult.data) {
          // 類型轉換，確保 Hanami_Students 欄位型別正確
          const lessons: Lesson[] = lessonResult.data.map((l: any) => ({
            ...l,
            Hanami_Students: l.Hanami_Students && Array.isArray(l.Hanami_Students)
              ? l.Hanami_Students[0]
              : l.Hanami_Students,
          }));
          setLessons(lessons);
        }

        // Handle schedule data
        if (scheduleResult.error) {
          console.warn('Warning fetching schedules:', scheduleResult.error.message);
        } else if (scheduleResult.data) {
          setSchedules(scheduleResult.data as Schedule[]);
        }

        // Handle teacher data
        if (teacherResult.error) {
          console.warn('Warning fetching teachers:', teacherResult.error.message);
        } else if (teacherResult.data) {
          setTeachers(teacherResult.data as Teacher[]);
        }

      } catch (error) {
        console.warn('Unexpected error in fetchData:', error);
        setErrorMsg('載入資料時發生錯誤，請重新整理頁面');
      }
    };

    fetchData();
  }, [currentMonth, teacherIds]);

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

  // Group lessons count by date
  const lessonsCountByDate: Record<string, number> = {};
  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const uniqueStudentIds = new Set(
      lessons
        .filter(l => l.lesson_date === dateStr)
        .map(l => l.student_id)
        .filter(Boolean), // 過濾掉 null 值
    );
    lessonsCountByDate[dateStr] = uniqueStudentIds.size;
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
    const scheduledTeachers = schedulesByDate[dateStr] || [];
    
    // Group lessons by time and course (合併同時段同課程)
    const dayLessons = lessons.filter(l => l.lesson_date === dateStr);
    const groupedMap: Record<string, GroupedLesson> = {};
    dayLessons.forEach(lesson => {
      const key = `${lesson.regular_timeslot || ''}_${lesson.course_type || ''}`;
      if (!groupedMap[key]) {
        groupedMap[key] = {
          time: lesson.regular_timeslot,
          course: lesson.course_type,
          students: [],
        };
      }
      if (lesson.Hanami_Students) {
        groupedMap[key].students.push({
          name: lesson.Hanami_Students.full_name,
          student_id: lesson.student_id,
          age: lesson.Hanami_Students.student_age ? String(lesson.Hanami_Students.student_age) : null,
        });
      }
    });
    const groupedLessons = Object.values(groupedMap).sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return a.time.localeCompare(b.time);
    });

    setSelectedDetail({
      date: day,
      teachers: scheduledTeachers,
      groups: groupedLessons,
    });
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

      const { error } = await supabase
        .from('teacher_schedule')
        .insert({
          teacher_id: selectedTeacher.teacher_id,
          scheduled_date: format(selectedDetail.date, 'yyyy-MM-dd'),
          start_time: selectedTeacher.start_time,
          end_time: selectedTeacher.end_time,
        });

      if (error) {
        console.warn('Error saving teacher schedule:', error.message);
        setErrorMsg(`儲存失敗：${error.message}`);
        return;
      }

      // Refresh schedules
      const { data: scheduleData, error: refreshError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .eq('scheduled_date', format(selectedDetail.date, 'yyyy-MM-dd'));

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

      const { error } = await supabase
        .from('teacher_schedule')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('scheduled_date', format(selectedDetail.date, 'yyyy-MM-dd'));

      if (error) {
        console.warn('Error deleting teacher schedule:', error.message);
        setErrorMsg(`刪除失敗：${error.message}`);
        return;
      }

      // Refresh schedules
      const { data: scheduleData, error: refreshError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .eq('scheduled_date', format(selectedDetail.date, 'yyyy-MM-dd'));

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

  const handleSaveEditMode = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 刪除所有現有排班
      const { error: deleteError } = await supabase
        .from('teacher_schedule')
        .delete()
        .gte('scheduled_date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));

      if (deleteError) {
        console.warn('Error deleting schedules:', deleteError.message);
        setErrorMsg(`刪除舊排班失敗：${deleteError.message}`);
        return;
      }

      // 插入新排班
      if (dragSchedules.length > 0) {
        const { error: insertError } = await supabase
          .from('teacher_schedule')
          .insert(dragSchedules.map(s => ({
            teacher_id: s.teacher_id,
            scheduled_date: s.scheduled_date,
            start_time: s.start_time,
            end_time: s.end_time,
          })));

        if (insertError) {
          console.warn('Error inserting schedules:', insertError.message);
          setErrorMsg(`儲存新排班失敗：${insertError.message}`);
          return;
        }
      }

      // 重新載入資料
      const { data: newSchedules } = await supabase
        .from('teacher_schedule')
        .select('*')
        .gte('scheduled_date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));

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
  const filteredSchedules = teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*' ? schedules.filter(s => teacherIds.includes(s.teacher_id)) : schedules;
  const filteredLessons = teacherIds && teacherIds.length > 0 && teacherIds[0] !== '*' ? lessons.filter(l => {
    // 只顯示該老師有排班的課堂
    const schedule = schedules.find(s => s.teacher_id === teacherIds[0] && s.scheduled_date === l.lesson_date);
    return !!schedule;
  }) : lessons;

  return (
    <>
      <div className="p-4 bg-[#FFFDF8] rounded-xl shadow border border-[#EADBC8] max-w-6xl mx-auto font-['Quicksand',_sans-serif]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-l-full border border-[#EADBC8] ${viewMode === 'calendar' ? 'bg-[#FFE8C2] text-[#4B4036]' : 'bg-white text-[#A68A64]'}`}
              onClick={() => setViewMode('calendar')}
            >日曆顯示
            </button>
            <button
              className={`px-3 py-1 rounded-r-full border border-[#EADBC8] border-l-0 ${viewMode === 'list' ? 'bg-[#FFE8C2] text-[#4B4036]' : 'bg-white text-[#A68A64]'}`}
              onClick={() => setViewMode('list')}
            >列表顯示
            </button>
          </div>
        
          {viewMode === 'calendar' && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  className="px-4 py-2 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] disabled:opacity-50 transition-colors"
                  disabled={loading}
                  onClick={handleSaveEditMode}
                >
                  {loading ? '儲存中...' : '儲存'}
                </button>
                <button
                  className="px-4 py-2 bg-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#D8CDBF] transition-colors"
                  onClick={handleCancelEditMode}
                >
                  取消
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] transition-colors"
                onClick={handleEditModeToggle}
              >
                編輯模式
              </button>
            )}
          </div>
          )}
        </div>

        {/* 編輯模式老師列表 */}
        {editMode && viewMode === 'calendar' && (
        <div className="mb-4 p-4 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] shadow-sm">
          <h3 className="text-lg font-bold mb-3 text-[#4B4036] flex items-center gap-2">
            <span className="flex items-center gap-1">
              <img alt="calendar" className="w-4 h-4" src="/calendar.png" />
              拖拽老師到日期安排排班
            </span>
            <span className="text-sm font-normal text-[#A68A64]">(拖拽後可調整時間)</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {filteredTeachers.map(teacher => (
              <div
                key={teacher.id}
                draggable
                className="px-4 py-3 bg-[#FFE8C2] text-[#4B4036] rounded-lg cursor-move hover:bg-[#EADBC8] border-2 border-[#EADBC8] hover:border-[#A68A64] transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                onDragEnd={handleTeacherDragEnd}
                onDragStart={() => handleTeacherDragStart(teacher)}
              >
                <img alt="teacher" className="w-4 h-4" src="/teacher.png" />
                {teacher.teacher_nickname}
              </div>
            ))}
          </div>
        </div>
        )}

        {viewMode === 'list' ? (
          <div className="overflow-x-auto mt-4">
            {filteredTeachers.map(teacher => {
              const teacherSchedules = filteredSchedules.filter(s => s.teacher_id === teacher.id);
              if (teacherSchedules.length === 0) return null;
              return (
                <div key={teacher.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-bold text-[#4B4036] text-lg">{teacher.teacher_nickname || teacher.teacher_fullname}</div>
                    <button
                      className="px-2 py-1 text-xs bg-[#EADBC8] rounded hover:bg-[#FFE8C2] border border-[#EADBC8]"
                      onClick={() => exportTeacherCSV(teacher)}
                    >匯出 CSV
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-[#EADBC8] rounded hover:bg-[#FFE8C2] border border-[#EADBC8]"
                      onClick={() => copyTeacherMarkdown(teacher)}
                    >複製 Markdown
                    </button>
                  </div>
                  <table className="w-full min-w-max border border-[#EADBC8] rounded-xl">
                    <thead className="bg-[#FFF9F2]">
                      <tr>
                        <th className="p-2 border-b border-[#EADBC8] text-left">日期</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left">老師</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left">上班時間</th>
                        <th className="p-2 border-b border-[#EADBC8] text-left">下班時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherSchedules.map(sch => (
                        <tr key={sch.id}>
                          <td className="p-2 border-b border-[#EADBC8]">{sch.scheduled_date}</td>
                          <td className="p-2 border-b border-[#EADBC8]">{teacher.teacher_nickname || teacher.teacher_fullname}</td>
                          <td className="p-2 border-b border-[#EADBC8]">{sch.start_time?.slice(0, 5) || ''}</td>
                          <td className="p-2 border-b border-[#EADBC8]">{sch.end_time?.slice(0, 5) || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <button
              aria-label="Previous Month"
              className="px-3 py-1 bg-[#EADBC8] rounded hover:bg-[#d4c1a1]"
              onClick={handlePrevMonth}
            >
              &lt;
            </button>
            <h2 className="text-xl font-bold text-[#2B3A3B]">
              {format(currentMonth, 'yyyy年MM月')}
            </h2>
            <button
              aria-label="Next Month"
              className="px-3 py-1 bg-[#EADBC8] rounded hover:bg-[#d4c1a1]"
              onClick={handleNextMonth}
            >
              &gt;
            </button>
          </div>
        )}

        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-7 gap-2 text-center text-sm text-[#2B3A3B]">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="font-semibold border-b border-[#EADBC8] pb-1">
                {day}
              </div>
            ))}
            {/* Empty slots for days before the first of the month */}
            {Array(daysInMonth[0].getDay()).fill(null).map((_, i) => (
              <div key={`empty-start-${i}`} />
            ))}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const currentSchedules = editMode ? dragSchedules : filteredSchedules;
              const scheduledTeachers = currentSchedules
                .filter(s => s.scheduled_date === dateStr)
                .map(s => filteredTeachers.find(t => t.id === s.teacher_id))
                .filter(Boolean) as Teacher[];
              const lessonCount = lessonsCountByDate[dateStr] || 0;
            
              return (
                <div
                  key={dateStr}
                  className={`relative border border-[#EADBC8] rounded p-1 flex flex-col justify-between min-h-[90px] ${
                    editMode ? 'cursor-default' : 'cursor-pointer hover:bg-[#FFFCF5]'
                  } ${
                    dragOverDate === dateStr ? 'bg-[#FFE8C2] border-[#A68A64] shadow-lg' : ''
                  }`}
                  style={{ overflow: 'hidden' }}
                  onClick={editMode ? undefined : () => handleDateClick(day)}
                  onDragOver={editMode ? (e) => {
                    e.preventDefault();
                    handleDateDragOver(dateStr);
                  } : undefined}
                  onDrop={editMode ? (e) => {
                    e.preventDefault();
                    handleDateDrop(dateStr);
                  } : undefined}
                >
                  <div className="absolute top-0 left-1 text-xs font-semibold text-[#2B3A3B]">{day.getDate()}</div>
                  <div className="flex flex-col gap-0.5 mt-4 w-full">
                    {scheduledTeachers.length > 0 ? scheduledTeachers.map(t => {
                      if (!t) return null;
                      const schedule = currentSchedules.find(s => s.teacher_id === t.id && s.scheduled_date === dateStr);
                      return (
                        <div
                          key={t.id}
                          className={`w-full max-w-full bg-[#FFE8C2] rounded-md shadow flex flex-col items-center p-1 overflow-hidden border border-[#EADBC8] ${
                          editMode && schedule && 'confirmed' in schedule && schedule.confirmed ? 'bg-green-50 border-green-300' : ''
                        }`}
                          style={{ zIndex: 10, marginBottom: 2 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold truncate ${
                              editMode && schedule && 'confirmed' in schedule && schedule.confirmed ? 'text-green-700' : ''
                            }`}
                          >
                            {editMode && schedule && 'confirmed' in schedule && schedule.confirmed ? (
                              <img alt="confirmed" className="w-3 h-3 inline mr-1" src="/leaf-sprout.png" />
                            ) : null}
                            {t.teacher_nickname}
                          </span>
                          {editMode && (
                            <div className="flex gap-0.5 ml-1 pointer-events-auto">
                              <button
                                className="w-5 h-5 text-green-600 hover:text-green-800 flex items-center justify-center rounded-full border border-green-200 bg-white text-xs"
                                title="確認"
                                type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleConfirm(t.id, dateStr); }}
                              >✓
                              </button>
                              <button
                                className="w-5 h-5 text-[#A68A64] hover:text-red-600 flex items-center justify-center rounded-full border border-[#EADBC8] bg-white text-xs"
                                title="取消"
                                type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleCancel(t.id, dateStr); }}
                              >×
                              </button>
                            </div>
                          )}
                        </div>
                          <div className="flex items-center gap-1 mt-1 w-full">
                          <input
                            className="w-14 text-[10px] px-1 bg-white border border-[#EADBC8] rounded"
                            type="time"
                            value={schedule?.start_time?.slice(0, 5) || '09:00'}
                            onChange={e => handleScheduleTimeChange(t.id, dateStr, 'start_time', e.target.value)}
                          />
                          <span className="text-[10px]">-</span>
                          <input
                            className="w-14 text-[10px] px-1 bg-white border border-[#EADBC8] rounded"
                            type="time"
                            value={schedule?.end_time?.slice(0, 5) || '18:00'}
                            onChange={e => handleScheduleTimeChange(t.id, dateStr, 'end_time', e.target.value)}
                          />
                        </div>
                        </div>
                      );
                    }) : <span className="text-[#aaa] text-xs">無</span>}
                  </div>
                  <div className="text-xs mt-2 flex items-center justify-center gap-1">
                    <img alt="girl icon" className="w-4 h-4" src="/icons/penguin-face.PNG" />
                    {lessonCount}
                  </div>
                </div>
              );
            })}
            {/* Empty slots for days after the last of the month */}
            {Array(6 - daysInMonth[daysInMonth.length - 1].getDay()).fill(null).map((_, i) => (
              <div key={`empty-end-${i}`} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Popup for daily schedule (Hanami style) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="relative bg-[#FFFDF8] rounded-2xl shadow-2xl p-6 w-[380px] max-h-[90vh] overflow-y-auto border border-[#EADBC8]">
            {/* 關閉按鈕 */}
            <button
              aria-label="關閉"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-xl text-[#A68A64] hover:bg-[#F3F0E5] shadow"
              onClick={() => setSelectedDetail(null)}
            >×
            </button>
            {/* 日期標題 */}
            <div className="text-lg font-bold mb-2 text-[#4B4036]">
              {format(selectedDetail.date, 'yyyy年MM月dd日')} 課堂安排
            </div>
            {/* 老師區塊 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#A68A64]">當日老師：</span>
                <button
                  className="text-xs text-[#A68A64] hover:underline flex items-center gap-1"
                  onClick={() => setShowArrangeTeacher(true)}
                >
                  <img alt="編輯" className="w-4 h-4" src="/icons/edit-pencil.png" /> 安排老師
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedDetail.teachers.length > 0 ? selectedDetail.teachers.map(teacher => {
                  const schedule = schedules.find(
                    s => s.teacher_id === teacher.id && s.scheduled_date === format(selectedDetail.date, 'yyyy-MM-dd'),
                  );
                  return (
                    <div key={teacher.id} className="flex items-center gap-1">
                      <span className="bg-[#FFE8C2] text-[#4B4036] rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                        {teacher.teacher_nickname}
                        {schedule && (
                          <span className="ml-1 text-[10px] text-[#A68A64]">
                            ({schedule.start_time?.slice(0, 5) || ''}-{schedule.end_time?.slice(0, 5) || ''})
                          </span>
                        )}
                      </span>
                      <button
                        className="text-red-500 hover:text-red-700 text-base font-bold w-6 h-6 flex items-center justify-center"
                        title="移除"
                        onClick={() => {
                          const confirmed = window.confirm('確定要移除此老師的排班嗎？');
                          if (confirmed) handleDeleteTeacherSchedule(teacher.id);
                        }}
                      >×
                      </button>
                    </div>
                  );
                }) : <span className="text-[#aaa]">無</span>}
              </div>
            </div>
            {/* 課堂安排 */}
            <div>
              <div className="font-semibold text-[#A68A64] mb-1">課堂安排：</div>
              <div className="space-y-2">
                {selectedDetail.groups.map((group, idx) => (
                  <div key={idx} className="border-l-2 border-[#EADBC8] pl-3">
                    <div className="text-[#4B4036] font-bold">
                      {group.time?.slice(0, 5) || ''} {group.course || ''} ({group.students.length})
                    </div>
                    <div className="ml-2 text-sm text-[#4B4036] flex flex-col gap-1">
                      {group.students.map((student, j) => (
                        <div key={j} className="flex flex-col">
                          <span>{student.name}</span>
                          {student.age && (
                            <span className="text-[10px] text-[#87704e] ml-2">（{Math.floor(parseInt(student.age) / 12)}Y{parseInt(student.age) % 12}M ）</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 安排老師彈窗 */}
      {showArrangeTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-[#FFFDF8] rounded-2xl shadow-2xl p-8 w-[400px] max-h-[90vh] overflow-y-auto border border-[#EADBC8] relative">
            <button
              aria-label="關閉"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#EADBC8] text-xl text-[#A68A64] hover:bg-[#F3F0E5] shadow"
              onClick={() => setShowArrangeTeacher(false)}
            >×
            </button>
            <div className="text-xl font-bold mb-4 text-[#4B4036]">安排老師</div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">選擇老師：</label>
              <button
                className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                onClick={() => setShowTeacherPopup(true)}
              >
                {selectedTeacher.teacher_id
                  ? teachers.find(t => t.id === selectedTeacher.teacher_id)?.teacher_nickname || '請選擇老師'
                  : '請選擇老師'}
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">上班時間</label>
              <TimePicker
                value={selectedTeacher.start_time}
                onChange={(time) => setSelectedTeacher(prev => ({ ...prev, start_time: time }))}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">下班時間</label>
              <TimePicker
                value={selectedTeacher.end_time}
                onChange={(time) => setSelectedTeacher(prev => ({ ...prev, end_time: time }))}
              />
            </div>
            {errorMsg && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded-full text-sm text-[#4B4036]"
                onClick={() => setShowArrangeTeacher(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036]"
                disabled={loading}
                onClick={handleSaveTeacherSchedule}
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
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
        </div>
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
    </>
  );
}
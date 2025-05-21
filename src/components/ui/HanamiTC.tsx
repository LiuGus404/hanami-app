import * as React from 'react';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { PopupSelect } from '@/components/ui/PopupSelect';
import LessonPlanModal from '@/components/ui/LessonPlanModal';
import { useLessonPlans } from '@/hooks/useLessonPlans';
import { Lesson, Teacher, CourseType, Student } from '@/types';
import LessonCard from './LessonCard';
import MiniLessonCard from './MiniLessonCard';

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

const getHongKongDate = (date = new Date()): Date => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 8 * 3600000);
};

const HanamiTC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const supabase = getSupabaseClient();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [popupInfo, setPopupInfo] = useState<{ field: string; open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    date: Date;
    time: string;
    course: string;
  } | null>(null);
  const { plans, teachers, loading, savePlan, updatePlan } = useLessonPlans({
    lessonDate: currentDate.toISOString().split('T')[0],
    timeslot: '',
    courseType: ''
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
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

  const getDateString = (date: Date): string => {
    return getHongKongDate(date).toLocaleDateString('sv-SE');
  };

  const fetchLessons = async (startDate: Date, endDate: Date): Promise<void> => {
    const { data: regularLessonsData, error: regularLessonsError } = await supabase
      .from('hanami_student_lesson')
      .select(`
        *,
        Hanami_Students!hanami_student_lesson_student_id_fkey (
          id,
          full_name,
          student_age,
          student_oid,
          nick_name,
          gender,
          contact_number,
          student_dob,
          parent_email,
          health_notes,
          student_remarks,
          created_at,
          updated_at,
          address,
          course_type,
          duration_months,
          regular_timeslot,
          regular_weekday,
          remaining_lessons,
          school,
          started_date,
          student_email,
          student_password,
          student_preference,
          student_teacher,
          student_type,
          actual_timeslot
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
    const processedRegularLessons = (regularLessonsData || []).map((lesson) => {
      const student = lesson.Hanami_Students as any;
      return {
        id: lesson.id,
        student_id: String(lesson.student_id ?? ''),
        student_oid: typeof student?.student_oid === 'string' ? student.student_oid : null,
        lesson_date: lesson.lesson_date,
        regular_timeslot: lesson.regular_timeslot ?? '',
        actual_timeslot: lesson.actual_timeslot ?? null,
        lesson_status: lesson.lesson_status ?? null,
        course_type: typeof lesson.course_type === 'string' ? lesson.course_type : '',
        lesson_duration: lesson.lesson_duration ?? null,
        regular_weekday: lesson.regular_weekday !== undefined && lesson.regular_weekday !== null ? Number(lesson.regular_weekday) : null,
        lesson_count: typeof (lesson as any).lesson_count === 'number' ? (lesson as any).lesson_count : 0,
        remaining_lessons: typeof student?.remaining_lessons === 'number' ? student.remaining_lessons : null,
        is_trial: false,
        lesson_teacher: lesson.lesson_teacher ?? null,
        package_id: lesson.package_id ?? null,
        status: lesson.status ?? null,
        notes: lesson.notes ?? null,
        next_target: lesson.next_target ?? null,
        progress_notes: lesson.progress_notes ?? null,
        video_url: lesson.video_url ?? null,
        full_name: typeof student?.full_name === 'string' ? student.full_name : '',
        created_at: lesson.created_at ?? null,
        updated_at: lesson.updated_at ?? null,
        access_role: lesson.access_role ?? null,
        remarks: lesson.remarks ?? null
      }
    });

    // 處理試堂學生數據
    const processedTrialLessons = (trialLessonsData || []).map((trial) => ({
      id: trial.id,
      student_id: String(trial.id),
      student_oid: null,
      lesson_date: trial.lesson_date ?? '',
      regular_timeslot: trial.actual_timeslot ?? '',
      actual_timeslot: trial.actual_timeslot ?? null,
      lesson_status: null,
      course_type: typeof trial.course_type === 'string' ? trial.course_type : '',
      lesson_duration: trial.lesson_duration ?? null,
      regular_weekday: trial.regular_weekday !== undefined && trial.regular_weekday !== null ? Number(trial.regular_weekday) : null,
      lesson_count: 0,
      remaining_lessons: null,
      is_trial: true,
      lesson_teacher: null,
      package_id: null,
      status: null,
      notes: null,
      next_target: null,
      progress_notes: null,
      video_url: null,
      full_name: typeof trial.full_name === 'string' ? trial.full_name : '',
      created_at: trial.created_at ?? null,
      updated_at: trial.updated_at ?? null,
      access_role: trial.access_role ?? null,
      remarks: null
    }));

    // 合併常規和試堂學生的課堂
    const allLessons: Lesson[] = [...processedRegularLessons, ...processedTrialLessons];
    setLessons(allLessons);

    // 獲取所有學生資料
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('*');

    if (studentsError) {
      console.error('Fetch students error:', studentsError);
      setStudents([]);
      return;
    }

    setStudents((studentsData || []).map((s: any) => ({
      id: s.id,
      student_oid: s.student_oid ?? null,
      full_name: s.full_name ?? '',
      nick_name: s.nick_name ?? null,
      gender: s.gender ?? null,
      contact_number: s.contact_number ?? '',
      student_dob: s.student_dob ?? null,
      student_age: s.student_age ?? null,
      parent_email: s.parent_email ?? null,
      health_notes: s.health_notes ?? null,
      student_remarks: s.student_remarks ?? null,
      created_at: s.created_at ?? null,
      updated_at: s.updated_at ?? null,
      address: s.address ?? null,
      course_type: s.course_type ?? null,
      duration_months: s.duration_months ?? null,
      regular_timeslot: s.regular_timeslot ?? null,
      regular_weekday: s.regular_weekday ?? null,
      remaining_lessons: s.remaining_lessons ?? null,
      school: s.school ?? null,
      started_date: s.started_date ?? null,
      student_email: s.student_email ?? null,
      student_password: s.student_password ?? null,
      student_preference: s.student_preference ?? null,
      student_teacher: s.student_teacher ?? null,
      student_type: s.student_type ?? null,
      lesson_date: s.lesson_date ?? null,
      actual_timeslot: s.actual_timeslot ?? null
    })));
  };

  const fetchTeachers = async (): Promise<void> => {
    try {
      await supabase
        .from('hanami_employee')
        .select('*')
        .eq('teacher_status', 'active');
      // 不 setTeachers，直接用 useLessonPlans 的 teachers
    } catch (error) {
      console.error('Unexpected error in fetchTeachers:', error);
    }
  };

  useEffect(() => {
    const weekStart = getHongKongDate(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = getHongKongDate(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    fetchLessons(weekStart, weekEnd);
    fetchTeachers();
  }, [currentDate]);

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

  const renderStudentButton = (nameObj: { name: string; student_id: string; age: string; is_trial: boolean; remaining_lessons?: number | null }, lesson: Lesson): React.ReactElement => {
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
        .from('hanami_teacher_schedule')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('date', currentDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Refresh the data
      const { data: updatedTeachers, error: fetchError } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('id', teacherId);

      if (fetchError) throw fetchError;
      // 不 setTeachers
    } catch (err) {
      console.error('Error deleting teacher schedule:', err);
      alert('刪除失敗');
    }
  };

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {formatDate(currentDate)}
          </h2>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded ${
              view === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            週
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 rounded ${
              view === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            日
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center font-semibold p-2">
            {day}
          </div>
        ))}
        {Array.from({ length: view === 'week' ? 7 : 1 }, (_, i) => {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          const dateStr = getDateString(date);
          const dayLessons = lessons.filter(l => l.lesson_date === dateStr);
          const groupedLessons = dayLessons.reduce((acc: Record<string, Group>, lesson) => {
            const key = `${lesson.regular_timeslot}_${typeof lesson.course_type === 'string' ? lesson.course_type : (lesson.course_type as CourseType)?.id ?? ''}`;
            if (!acc[key]) {
              acc[key] = {
                time: lesson.regular_timeslot ?? '',
                course: typeof lesson.course_type === 'string' ? lesson.course_type : (lesson.course_type as CourseType)?.id ?? '',
                students: []
              };
            }
            acc[key].students.push({
              name: lesson.full_name ?? '',
              student_id: lesson.student_id ?? '',
              age: (lesson as any).student_age?.toString() ?? '',
              is_trial: lesson.is_trial ?? false,
              remaining_lessons: lesson.remaining_lessons ?? null
            });
            return acc;
          }, {});

          return (
            <div key={dateStr} className="border rounded p-2">
              <div className="text-sm font-medium mb-2">
                {date.getMonth() + 1}/{date.getDate()}
              </div>
              <div className="space-y-2">
                {Object.values(groupedLessons).map((group, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">
                      {group.time} - {group.course}
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.students.map(student => (
                        <div key={student.student_id}>
                          {student.name}
                          {student.age && ` (${student.age}歲)`}
                          {student.is_trial && ' (試堂)'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Detail */}
      {selectedDetail && (
        <div className="mt-4 p-4 border rounded">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {formatDate(currentDate)}
            </h3>
            <button
              onClick={() => setShowPopup('main')}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              新增老師
            </button>
          </div>

          {/* Teacher List */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">已排班老師</h4>
            <div className="flex flex-wrap gap-2">
              {selectedDetail.teachers.map(teacher => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                >
                  <span>{teacher.teacher_nickname}</span>
                  <button
                    onClick={() => handleDeleteTeacherSchedule(teacher.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Groups */}
          <div>
            <h4 className="font-medium mb-2">課堂安排</h4>
            <div className="space-y-2">
              {selectedDetail.groups.map((group, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">
                    {group.time} - {group.course}
                  </div>
                  <div className="text-sm text-gray-600">
                    {group.students.map(student => (
                      <div key={student.student_id}>
                        {student.name}
                        {student.age && ` (${student.age}歲)`}
                        {student.is_trial && ' (試堂)'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Select Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              {showPopup === 'main' ? '選擇主導老師' : '選擇輔助老師'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  選擇老師
                </label>
                <PopupSelect
                  title={showPopup === 'main' ? '選擇主導老師' : '選擇輔助老師'}
                  options={teachers.map(t => ({
                    label: t.teacher_nickname,
                    value: t.id
                  }))}
                  selected={showPopup === 'main' ? tempSelectedTeacher1 : tempSelectedTeacher2}
                  onChange={(val) => {
                    if (showPopup === 'main') {
                      setTempSelectedTeacher1(Array.isArray(val) ? val : [val]);
                    } else {
                      setTempSelectedTeacher2(Array.isArray(val) ? val : [val]);
                    }
                  }}
                  mode="multi"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPopup(null)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (showPopup === 'main') {
                    setSelectedTeacher1(tempSelectedTeacher1);
                  } else {
                    setSelectedTeacher2(tempSelectedTeacher2);
                  }
                  setShowPopup(null);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default HanamiTC;

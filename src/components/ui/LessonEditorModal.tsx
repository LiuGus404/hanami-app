import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { getSupabaseClient } from '@/lib/supabase'
import { PopupSelect } from '@/components/ui/PopupSelect'
import TimePicker from '@/components/ui/TimePicker'
import { Lesson, CourseType, Teacher } from '@/types'

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onSaved: (newLesson: Lesson) => Promise<void>;
  teachers: { label: string; value: string; }[];
}

interface CourseTypeOption {
  label: string;
  value: string;
}

export default function LessonEditorModal({
  isOpen,
  onClose,
  lesson,
  onSaved,
  teachers,
}: LessonEditorModalProps) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState<Partial<Lesson>>({
    id: lesson?.id,
    student_id: lesson?.student_id,
    student_oid: lesson?.student_oid || null,
    lesson_date: lesson?.lesson_date || '',
    regular_timeslot: lesson?.regular_timeslot || '',
    actual_timeslot: lesson?.actual_timeslot || null,
    lesson_status: lesson?.lesson_status || null,
    course_type: lesson?.course_type || null,
    lesson_duration: lesson?.lesson_duration || null,
    regular_weekday: lesson?.regular_weekday || null,
    lesson_count: lesson?.lesson_count || 0,
    remaining_lessons: lesson?.remaining_lessons || null,
    is_trial: lesson?.is_trial || false,
    lesson_teacher: lesson?.lesson_teacher || null,
    package_id: lesson?.package_id || null,
    status: lesson?.status || null,
    notes: lesson?.notes || null,
    next_target: lesson?.next_target || null,
    progress_notes: lesson?.progress_notes || null,
    video_url: lesson?.video_url || null,
    full_name: lesson?.full_name || null,
    created_at: lesson?.created_at || null,
    updated_at: lesson?.updated_at || null,
    access_role: lesson?.access_role || null,
    remarks: lesson?.remarks || null,
    lesson_activities: lesson?.lesson_activities || null
  })

  const [initialFormState, setInitialFormState] = useState<Lesson | null>(null)
  const [pendingCourseType, setPendingCourseType] = useState('')
  const [pendingLessonCount, setPendingLessonCount] = useState('')
  const [pendingStatus, setPendingStatus] = useState('')
  const [pendingTeacher, setPendingTeacher] = useState('')
  const [teacherOptions, setTeacherOptions] = useState<{ label: string; value: string; }[]>([])
  const [courseTypeOptions, setCourseTypeOptions] = useState<CourseTypeOption[]>([])

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [courseTypeDropdownOpen, setCourseTypeDropdownOpen] = useState(false)
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false)
  const [lessonCountDropdownOpen, setLessonCountDropdownOpen] = useState(false)
  const [customLessonCount, setCustomLessonCount] = useState(1)

  // 預覽多堂課日期
  const [previewDates, setPreviewDates] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // finalizedDates 狀態，用於存儲預覽儲存後的多堂課時間
  const [finalizedDates, setFinalizedDates] = useState<string[]>([])

  useEffect(() => {
    if (lesson) {
      setForm(lesson)
      setInitialFormState(lesson)
      setPendingCourseType(typeof lesson.course_type === 'string' ? lesson.course_type : lesson.course_type?.name || '')
      setPendingLessonCount(lesson.lesson_count.toString())
      setPendingStatus(lesson.lesson_status || '')
      setPendingTeacher(lesson.lesson_teacher || '')
    }
  }, [lesson])

useEffect(() => {
  fetchCourseTypes()
  fetchTeachers()
}, [])

// 從 Supabase 撈取該學生最近一筆課堂記錄的 regular_timeslot、actual_timeslot 及 lesson_date
const fetchRegularTimeslot = async () => {
  const { data, error } = await supabase
    .from('hanami_student_lesson')
    .select('regular_timeslot, actual_timeslot, lesson_date')
      .eq('student_id', form.student_id || '')
    .order('lesson_date', { ascending: false })
    .limit(1)
    .single()

  if (data) {
    setForm(prev => ({
      ...prev,
      regular_timeslot: data.regular_timeslot || '',
      actual_timeslot: data.actual_timeslot || ''
    }))
  }
}

// 從歷史課堂記錄撈取最常見的課程類別
const fetchHistoricalCourseType = async () => {
  const { data, error } = await supabase
    .from('hanami_student_lesson')
    .select('course_type')
      .eq('student_id', form.student_id || '')
  if (data && data.length > 0) {
    const countMap: Record<string, number> = {}
    data.forEach(item => {
        const key = typeof item.course_type === 'string' ? item.course_type : '';
      countMap[key] = (countMap[key] || 0) + 1
    })
    const mostCommon = Object.entries(countMap)
      .filter(([key]) => key)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    if (mostCommon) {
      setForm(prev => ({ ...prev, course_type: mostCommon }))
    }
  }
}

const fetchTeachers = async () => {
  const { data, error } = await supabase
    .from('hanami_employee')
    .select('teacher_nickname')
  if (data) {
      const options = data.map((item: { teacher_nickname: string }) => ({
      label: item.teacher_nickname,
      value: item.teacher_nickname,
    }))
    setTeacherOptions(options)
  }
}

useEffect(() => {
    if (isOpen && form.student_id && !lesson) {
    const today = new Date().toISOString().split('T')[0];
      const defaultForm: Lesson = {
        id: '',
        student_id: '',
      lesson_date: today,
      regular_timeslot: '',
      actual_timeslot: '',
        course_type: '',
      lesson_status: '',
      lesson_teacher: '',
      progress_notes: '',
      video_url: '',
        lesson_count: 1,
        lesson_duration: null,
        regular_weekday: null,
        remaining_lessons: null,
        is_trial: false,
        package_id: null,
        status: null,
        notes: null,
        next_target: null,
        full_name: null,
        created_at: null,
        updated_at: null,
        access_role: null,
        remarks: null,
        student_oid: null
    }
    setForm(defaultForm)
    setInitialFormState(defaultForm)
    fetchRegularTimeslot()
    fetchHistoricalCourseType()
    fetchCourseTypeFromStudent()
  }
  }, [isOpen, form.student_id, lesson])

  const fetchCourseTypes = async () => {
    const { data, error } = await supabase.from('Hanami_CourseTypes').select('*')
    if (data) {
      const options = data.map((item: { name: string | null }) => ({
        label: item.name || '',
        value: item.name || ''
      }))
      setCourseTypeOptions(options)
    }
  }

  const fetchCourseTypeFromStudent = async () => {
    const { data, error } = await supabase
      .from('Hanami_Students')
      .select('course_type')
      .eq('id', form.student_id || '')
      .single()

    if (data?.course_type) {
      setForm((prev) => ({
        ...prev,
        course_type: data.course_type
      }))
    }
  }

  useEffect(() => {
    if (form.lesson_count && form.lesson_count > 0) {
    const baseDate = form.lesson_date ? new Date(form.lesson_date) : new Date()
      const previews = Array.from({ length: form.lesson_count }, (_, i) => {
        const newDate = new Date(baseDate)
        newDate.setDate(baseDate.getDate() + 7 * i)
        const formattedTime = form.regular_timeslot ? to24Hour(form.regular_timeslot) : '未設定時間'
        return `${newDate.toISOString().split('T')[0]} ${formattedTime}`
      })
      setPreviewDates(previews as string[])
    } else {
      setPreviewDates([])
    }
  }, [form.lesson_count, form.lesson_date, form.regular_timeslot])

  const to24Hour = (timeStr: string) => {
    const date = new Date(`1970-01-01T${timeStr}`);
    return date.toTimeString().slice(0, 5);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if ((name === 'regular_timeslot' || name === 'actual_timeslot') && value) {
      setForm({ ...form, [name]: to24Hour(value) })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSave = async () => {
    if (!form.student_id) {
      alert('缺少學生ID');
        return;
      }
    const payload = {
      ...form,
      id: form.id || '',
      student_id: form.student_id,
      lesson_date: form.lesson_date || '',
      regular_timeslot: form.regular_timeslot || '',
      course_type: typeof form.course_type === 'string' ? form.course_type : '',
      lesson_count: form.lesson_count ?? 0,
      is_trial: form.is_trial || false,
      created_at: form.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      regular_weekday: form.regular_weekday !== null && form.regular_weekday !== undefined ? String(form.regular_weekday) : null,
      lesson_duration: form.lesson_duration ?? null,
      lesson_teacher: form.lesson_teacher ?? null,
      package_id: form.package_id ?? null,
      status: (form.status && ['attended','absent','makeup','cancelled','sick_leave','personal_leave'].includes(form.status)
        ? form.status 
        : null) as ('attended' | 'absent' | 'makeup' | 'cancelled' | 'sick_leave' | 'personal_leave' | null),
      notes: form.notes ?? null,
      next_target: form.next_target ?? null,
      progress_notes: form.progress_notes ?? null,
      video_url: form.video_url ?? null,
      full_name: form.full_name ?? null,
      access_role: form.access_role ?? null,
      remarks: form.remarks ?? null,
      student_oid: form.student_oid ?? null,
      remaining_lessons: form.remaining_lessons ?? null,
      lesson_activities: form.lesson_activities ?? null,
      actual_timeslot: form.actual_timeslot ?? null,
      lesson_status: form.lesson_status || null
    };

    try {
      if (form.id) {
        await supabase
          .from('hanami_student_lesson')
          .update(payload)
          .eq('id', form.id)
      } else {
        await supabase
            .from('hanami_student_lesson')
            .insert(payload)
      }
      onSaved(payload as Lesson);
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('儲存失敗');
    }
  };

  const handleCancel = () => {
    if (initialFormState) {
      setForm(initialFormState);
    }
    onClose();
  }

  const handleLessonCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    setForm(prev => ({ ...prev, lesson_count: count }));
    
    if (count > 0) {
      const previews = Array.from({ length: count }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i * 7);
        return date.toISOString().split('T')[0];
      });
      setPreviewDates(previews);
    } else {
      setPreviewDates([]);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            {lesson ? '編輯課堂' : '新增課堂'}
          </Dialog.Title>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">課堂日期</label>
              <input
                type="date"
                name="lesson_date"
                value={form.lesson_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">課程類別</label>
                <PopupSelect
                title="選擇課程類別"
                  options={courseTypeOptions}
                selected={typeof form.course_type === 'string' ? [form.course_type] : []}
                onChange={(selected) => setForm({ ...form, course_type: selected[0] })}
                onConfirm={() => setCourseTypeDropdownOpen(false)}
                onCancel={() => setCourseTypeDropdownOpen(false)}
                  mode="single"
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">老師</label>
                  <PopupSelect
                title="選擇老師"
                options={teacherOptions}
                selected={form.lesson_teacher ? [form.lesson_teacher] : []}
                onChange={(selected) => setForm({ ...form, lesson_teacher: selected[0] })}
                onConfirm={() => setTeacherDropdownOpen(false)}
                onCancel={() => setTeacherDropdownOpen(false)}
                    mode="single"
                  />
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">課堂狀態</label>
              <PopupSelect
                title="選擇課堂狀態"
                options={[
                  { label: '已完成', value: 'completed' },
                  { label: '未完成', value: 'pending' },
                  { label: '取消', value: 'cancelled' }
                ]}
                selected={form.lesson_status ? [form.lesson_status] : []}
                onChange={(selected) => setForm({ ...form, lesson_status: selected[0] })}
                onConfirm={() => setStatusDropdownOpen(false)}
                onCancel={() => setStatusDropdownOpen(false)}
                mode="single"
                />
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">進度筆記</label>
              <textarea
                name="progress_notes"
                value={form.progress_notes || ''}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">影片連結</label>
              <input
                type="text"
                name="video_url"
                value={form.video_url || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
              <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    取消
                  </button>
                  <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    儲存
                  </button>
              </div>
            </Dialog.Panel>
          </div>
    </Dialog>
  )
  }
import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { getSupabaseClient } from '@/lib/supabase'
import { PopupSelect } from '@/components/ui/PopupSelect'
import TimePicker from '@/components/ui/TimePicker'
import { Lesson, CourseType, Teacher } from '@/types'

interface LessonEditorModalProps {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  studentId: string;
  onSaved: () => void;
  mode?: 'edit' | 'add';
}

interface CourseTypeOption {
  label: string;
  value: string;
}

function toStatus(val: string | null | undefined): "attended" | "absent" | "makeup" | "cancelled" | "sick_leave" | "personal_leave" | null {
  if (
    val === 'attended' ||
    val === 'absent' ||
    val === 'makeup' ||
    val === 'cancelled' ||
    val === 'sick_leave' ||
    val === 'personal_leave'
  ) {
    return val
  }
  return null
}

export default function LessonEditorModal({
  open,
  onClose,
  lesson,
  studentId,
  onSaved,
  mode = 'add'
}: LessonEditorModalProps) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState<Partial<Lesson>>({
    id: lesson?.id,
    student_id: lesson?.student_id,
    student_oid: lesson?.student_oid || null,
    lesson_date: lesson?.lesson_date || '',
    regular_timeslot: lesson?.regular_timeslot || '',
    actual_timeslot: lesson?.actual_timeslot || '',
    lesson_status: lesson?.lesson_status || '',
    course_type: lesson?.course_type || '',
    lesson_duration: lesson?.lesson_duration || null,
    regular_weekday: lesson?.regular_weekday || null,
    lesson_count: lesson?.lesson_count ?? 1,
    remaining_lessons: lesson?.remaining_lessons || null,
    is_trial: lesson?.is_trial || false,
    lesson_teacher: lesson?.lesson_teacher || '',
    package_id: lesson?.package_id || null,
    status: lesson?.status || null,
    notes: lesson?.notes || null,
    next_target: lesson?.next_target || null,
    progress_notes: lesson?.progress_notes || null,
    video_url: lesson?.video_url || '',
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
      setPendingCourseType(typeof lesson.course_type === 'string' ? lesson.course_type : '')
      setPendingLessonCount(lesson.lesson_count?.toString() ?? '1')
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
      .eq('student_id', studentId)
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
      .eq('student_id', studentId)
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
    if (open && studentId && !lesson) {
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
  }, [open, studentId, lesson])

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
      .eq('id', studentId)
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

  const handleSubmit = async () => {
    try {
      // 驗證必填欄位
      if (!form.lesson_date) {
        alert('請選擇課堂日期');
        return;
      }

      // 1. 從 Supabase 取得學生資料
      let studentData = null;
      try {
        const { data } = await supabase
          .from('Hanami_Students')
          .select('student_oid, regular_weekday, full_name')
          .eq('id', studentId)
          .single();
        studentData = data;
      } catch (e) {
        console.error('Error fetching student data:', e);
      }

      // 自動設置 lesson_duration
      const autoLessonDuration =
        form.course_type === '鋼琴'
          ? '00:45:00'
          : form.course_type === '音樂專注力'
          ? '01:00:00'
          : null;

      // 準備 payload，型別全部正確
      const payload = {
        student_id: studentId,
        student_oid: studentData?.student_oid ?? null,
        full_name: studentData?.full_name ?? '',
        lesson_date: form.lesson_date,
        regular_timeslot: form.regular_timeslot ?? '',
        actual_timeslot: form.actual_timeslot ?? '',
        course_type: typeof form.course_type === 'string' ? form.course_type : (form.course_type && typeof form.course_type === 'object' && 'name' in form.course_type ? String((form.course_type as { name: string }).name) : ''),
        lesson_status: form.lesson_status ?? '',
        lesson_teacher: form.lesson_teacher ?? '',
        progress_notes: form.progress_notes ?? '',
        video_url: form.video_url ?? '',
        lesson_duration: autoLessonDuration,
        regular_weekday: studentData?.regular_weekday !== undefined && studentData?.regular_weekday !== null ? String(studentData.regular_weekday) : null,
        package_id: form.package_id && form.package_id !== '' ? form.package_id : null,
        status: toStatus(form.status),
        notes: form.notes ?? null,
        next_target: form.next_target ?? null,
        created_at: form.created_at || new Date().toISOString(),
        updated_at: form.updated_at || new Date().toISOString(),
        access_role: form.access_role ?? null,
        remarks: form.remarks ?? null,
        lesson_activities: form.lesson_activities ?? null,
      };

      if (lesson) {
        const updatePayload = {
          ...payload,
          id: lesson.id // 只在更新時包含id
        };
        
        const { error } = await supabase
          .from('hanami_student_lesson')
          .update(updatePayload)
          .eq('id', lesson.id)
        
        if (error) {
          console.error('Error updating lesson:', error)
          alert('更新課堂記錄失敗，請稍後再試\n' + error.message)
          return
        }
        alert(
          '課堂已成功更新！\n' +
          '日期：' + payload.lesson_date + '\n' +
          '時間：' + (payload.actual_timeslot || payload.regular_timeslot)
        );
      } else {
        // 新增多堂課的情況
        if ((form.lesson_count ?? 1) > 1) {
          const nowISOString = new Date().toISOString();
          const newLessons = previewDates.map(dt => ({
            student_id: studentId,
            student_oid: (!studentData?.student_oid || studentData.student_oid === '') ? null : studentData.student_oid,
            full_name: studentData?.full_name ?? '',
            lesson_date: dt.split(' ')[0],
            regular_timeslot: dt.split(' ')[1],
            actual_timeslot: dt.split(' ')[1],
            course_type: typeof form.course_type === 'string' ? form.course_type : (form.course_type && typeof form.course_type === 'object' && 'name' in form.course_type ? String((form.course_type as { name: string }).name) : ''),
            lesson_status: form.lesson_status ?? '',
            lesson_teacher: form.lesson_teacher ?? '',
            progress_notes: form.progress_notes ?? '',
            video_url: form.video_url ?? '',
            lesson_duration: autoLessonDuration,
            regular_weekday: studentData?.regular_weekday !== undefined && studentData?.regular_weekday !== null ? String(studentData.regular_weekday) : null,
            package_id: (!form.package_id || form.package_id === '') ? null : form.package_id,
            status: toStatus(form.status),
            notes: form.notes ?? null,
            next_target: form.next_target ?? null,
            created_at: nowISOString,
            updated_at: nowISOString,
            access_role: form.access_role ?? null,
            remarks: form.remarks ?? null,
            lesson_activities: form.lesson_activities ?? null,
          }))
          const { data, error } = await supabase
            .from('hanami_student_lesson')
            .insert(newLessons)
            .select()
          if (error) {
            console.error('Error inserting multiple lessons:', error)
            alert('新增多堂課記錄失敗，請稍後再試\n' + error.message)
            return
          }
          if (data) {
            const summary = data
              .map(d => '日期：' + d.lesson_date + ' 時間：' + (d.actual_timeslot || d.regular_timeslot))
              .join('\n');
            alert('課堂已成功新增！\n' + summary);
          }
        } else {
          // 新增單堂課
          const nowISOString = new Date().toISOString();
          const singlePayload = {
            ...payload,
            created_at: nowISOString,
            updated_at: nowISOString,
          };
          const { data, error } = await supabase
            .from('hanami_student_lesson')
            .insert(singlePayload)
            .select()
          if (error) {
            console.error('Error inserting single lesson:', error)
            alert('新增課堂記錄失敗，請稍後再試\n' + error.message)
            return
          }
          if (data && data[0]) {
            alert(
              '課堂已成功新增！\n' +
              '日期：' + data[0].lesson_date + '\n' +
              '時間：' + (data[0].actual_timeslot || data[0].regular_timeslot)
            );
          }
        }
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Unexpected error during save:', err)
      alert('儲存失敗，請稍後再試\n' + (err instanceof Error ? err.message : ''))
    }
  }

  const handleCancel = () => {
    setForm(initialFormState || {})
    onClose()
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

  // handlePreviewDateChange/handlePreviewTimeChange 放在這裡
  const handlePreviewDateChange = (index: number, newDate: string) => {
    setPreviewDates(prev => {
      const copy = [...prev]
      const [, time] = copy[index].split(' ')
      copy[index] = `${newDate} ${time}`
      return copy
    })
  }
  const handlePreviewTimeChange = (index: number, newTime: string) => {
    setPreviewDates(prev => {
      const copy = [...prev]
      const [date] = copy[index].split(' ')
      copy[index] = `${date} ${newTime}`
      return copy
    })
  }

  const handleDelete = async () => {
    if (lesson?.id) {
      await supabase.from('hanami_student_lesson').delete().eq('id', lesson.id)
      onSaved()
      onClose()
    }
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      className="fixed z-10 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl w-full max-w-md border border-[#F3EAD9]">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold"> {lesson ? '編輯課堂記錄' : '新增課堂記錄'} </Dialog.Title>
            {(form.lesson_count ?? 1) > 1 && (
              <button
                onClick={() => setShowPreview((prev) => !prev)}
                className="text-sm text-[#4B4036] underline hover:text-[#2B3A3B]"
              >
                {showPreview ? '隱藏預覽' : '預覽課堂時間'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="mb-3">
              <button
                onClick={() => {
                  setPendingCourseType(typeof form.course_type === 'string' ? form.course_type : '')
                  setCourseTypeDropdownOpen(true)
                }}
                className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
              >
                {form.course_type ? `課堂類別：${form.course_type}` : '請選擇課堂類別'}
              </button>
              {courseTypeDropdownOpen && (
                <PopupSelect
                  title="選擇課堂類別"
                  options={courseTypeOptions}
                  selected={pendingCourseType}
                  mode="single"
                  onChange={(val) => setPendingCourseType(Array.isArray(val) ? val[0] : val || '')}
                  onConfirm={() => {
                    setForm({ ...form, course_type: pendingCourseType })
                    setCourseTypeDropdownOpen(false)
                  }}
                  onCancel={() => setCourseTypeDropdownOpen(false)}
                />
              )}
            </div>
            {mode === 'add' && (
              <div className="mb-3">
                <button
                  onClick={() => {
                    setLessonCountDropdownOpen(true)
                    setPendingLessonCount(form.lesson_count?.toString() || '1')
                  }}
                  className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                >
                  新增堂數：{form.lesson_count || 1} 堂
                </button>
                {lessonCountDropdownOpen && (
                  <PopupSelect
                    title="選擇堂數"
                    options={[
                      { label: '1 堂', value: '1' },
                      { label: '4 堂', value: '4' },
                      { label: '8 堂', value: '8' },
                      { label: '12 堂', value: '12' },
                      { label: '16 堂', value: '16' },
                      { label: '自訂', value: 'custom' },
                    ]}
                    selected={pendingLessonCount}
                    onChange={(val) => setPendingLessonCount(Array.isArray(val) ? val[0] : val || '')}
                    onConfirm={() => {
                      setForm({
                        ...form,
                        lesson_count: pendingLessonCount === 'custom' ? customLessonCount : Number(pendingLessonCount)
                      })
                      setLessonCountDropdownOpen(false)
                    }}
                    onCancel={() => setLessonCountDropdownOpen(false)}
                    mode="single"
                  />
                )}
                {pendingLessonCount === 'custom' && (
                  <input
                    type="number"
                    value={customLessonCount}
                    onChange={(e) => setCustomLessonCount(Number(e.target.value))}
                    className="mt-2 w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B]"
                    placeholder="請輸入自訂堂數"
                  />
                )}
              </div>
            )}
            <input type="date" name="lesson_date" value={form.lesson_date || ''} onChange={handleChange} className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" />
            {form.lesson_count === 1 ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#4B4036]">常規時間（不可修改）</label>
                <input
                  type="time"
                  value={form.regular_timeslot || ''}
                  readOnly
                  className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] bg-gray-100 cursor-not-allowed"
                />
              </div>
            ) : (
              <>
                <TimePicker
                  label="常規時間"
                  value={form.regular_timeslot || ''}
                  onChange={(val) => setForm({ ...form, regular_timeslot: val })}
                />
                {(form.lesson_count ?? 1) > 1 && previewDates.length > 0 && (
                  <div className="mt-2 text-sm text-[#4B4036] space-y-1">
                    <p className="font-semibold">課堂日期時間</p>
                    {previewDates.map((d, i) => (
                      <div key={i}>{d}</div>
                    ))}
                  </div>
                )}
              </>
            )}
            {form.lesson_count === 1 && (
              <TimePicker
                label="實際時間"
                value={form.actual_timeslot || ''}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    actual_timeslot: val,
                    regular_timeslot: val,
                  }))
                }
              />
            )}
            {form.lesson_count === 1 && (
              <>
                <div className="mb-3">
                  <button
                    onClick={() => {
                      setPendingStatus(form.lesson_status || '')
                      setStatusDropdownOpen(true)
                    }}
                    className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                  >
                    {form.lesson_status ? `出席狀況：${form.lesson_status}` : '請選擇出席狀況'}
                  </button>
                  {statusDropdownOpen && (
                    <PopupSelect
                      title="選擇出席狀況"
                      options={[
                        { label: '出席', value: 'attended' },
                        { label: '缺席', value: 'absent' },
                        { label: '補堂', value: 'makeup' },
                        { label: '病假', value: 'sick_leave' },
                        { label: '事假', value: 'personal_leave' },
                      ]}
                      selected={pendingStatus}
                      mode="single"
                      onChange={(val) => setPendingStatus(Array.isArray(val) ? val[0] : val || '')}
                      onConfirm={() => {
                        setForm({ ...form, lesson_status: pendingStatus })
                        setStatusDropdownOpen(false)
                      }}
                      onCancel={() => setStatusDropdownOpen(false)}
                    />
                  )}
                </div>
              </>
            )}
            <div className="mb-3">
              <button
                onClick={() => {
                  setPendingTeacher(form.lesson_teacher || '')
                  setTeacherDropdownOpen(true)
                }}
                className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
              >
                {form.lesson_teacher ? `負責老師：${form.lesson_teacher}` : '請選擇負責老師'}
              </button>
              {teacherDropdownOpen && (
                <PopupSelect
                  title="選擇負責老師"
                  options={teacherOptions}
                  selected={pendingTeacher}
                  mode="single"
                  onChange={(val) => setPendingTeacher(Array.isArray(val) ? val[0] : val || '')}
                  onConfirm={() => {
                    setForm({ ...form, lesson_teacher: pendingTeacher })
                    setTeacherDropdownOpen(false)
                  }}
                  onCancel={() => setTeacherDropdownOpen(false)}
                />
              )}
            </div>
            <textarea name="progress_notes" value={form.progress_notes || ''} onChange={handleChange} placeholder="備註" className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" />
            <input type="text" name="video_url" value={form.video_url || ''} onChange={handleChange} placeholder="影片連結" className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" />
          </div>

          <div className="mt-6 flex justify-end gap-2">
                    <button onClick={handleCancel} className="hanami-btn-soft px-4 py-2 text-sm text-[#A68A64]">取消</button>
        <button onClick={handleSubmit} className="hanami-btn px-4 py-2 text-sm text-[#2B3A3B]">儲存</button>
            {mode === 'edit' && lesson && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-200 text-sm text-red-600 bg-white rounded-full hover:bg-red-50"
              >
                刪除
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
      {/* Overlay Preview Dialog */}
      
      {showPreview && (
        <Dialog open={true} onClose={() => setShowPreview(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Panel className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl w-full max-w-md border border-[#F3EAD9]">
              <Dialog.Title className="text-lg font-bold mb-2">預覽課堂時間</Dialog.Title>
              {previewDates.length > 0 ? (
                <>
                  <p className="text-sm font-semibold text-[#4B4036] mb-1">課堂時間</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#4B4036]">
                    {previewDates.map((d, i) => {
                      const [dateStr, timeStr] = d.split(' ')
                      return (
                        <li key={i} className="flex items-center gap-2 mb-2">
                          <input
                            type="date"
                            value={dateStr}
                            onChange={e => handlePreviewDateChange(i, e.target.value)}
                            className="border border-[#EADBC8] rounded px-2 py-1"
                          />
                          <TimePicker
                            label=""
                            value={timeStr}
                            onChange={val => handlePreviewTimeChange(i, val)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-500">尚無可預覽的課堂時間。</p>
              )}
              {/* 新增重設/關閉/儲存按鈕區塊 */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => {
                    // 重設為原始時間
                    const baseDate = form.lesson_date ? new Date(form.lesson_date) : new Date()
                    if ((form.lesson_count ?? 1) > 0) {
                      const previews = Array.from({ length: form.lesson_count ?? 1 }, (_, i) => {
                        const newDate = new Date(baseDate)
                        newDate.setDate(newDate.getDate() + 7 * i)
                        const formattedTime = form.regular_timeslot ? to24Hour(form.regular_timeslot) : '未設定時間'
                        return `${newDate.toISOString().split('T')[0]} ${formattedTime}`
                      })
                      setPreviewDates(previews as string[])
                    }
                  }}
                  className="px-4 py-2 border border-[#EADBC8] text-sm text-[#A68A64] bg-white rounded-full hover:bg-[#f7f3ec]"
                >
                  重設
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Restore previewDates to the previously finalized state, not changing lesson_count
                      const restoredPreviews = finalizedDates.length > 0
                        ? [...finalizedDates]
                        : Array.from({ length: form.lesson_count ?? 1 }, (_, i) => {
                            const newDate = new Date(form.lesson_date || new Date())
                            newDate.setDate(newDate.getDate() + 7 * i)
                            const formattedTime = form.regular_timeslot || '未設定時間'
                            return `${newDate.toISOString().split('T')[0]} ${formattedTime}`
                          })
                      setPreviewDates(restoredPreviews)
                      setShowPreview(false)
                    }}
                    className="px-4 py-2 border border-[#EADBC8] text-sm text-[#A68A64] bg-white rounded-full hover:bg-[#f7f3ec]"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      // 儲存預覽的所有日期到 finalizedDates
                      setFinalizedDates(previewDates)
                      setShowPreview(false)
                      // 若是單堂課，將第一筆同步到 form
                      if (form.lesson_count === 1 && previewDates.length > 0) {
                        const [date, time] = previewDates[0].split(' ')
                        setForm(prev => ({
                          ...prev,
                          lesson_date: date,
                          regular_timeslot: time,
                          actual_timeslot: time,
                        }))
                      }
                    }}
                    className="px-4 py-2 bg-[#EBC9A4] text-sm text-[#2B3A3B] rounded-full hover:bg-[#e5ba8e]"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </Dialog>
  )
}
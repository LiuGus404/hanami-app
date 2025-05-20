import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { getSupabaseClient } from '@/lib/supabase'
import PopupSelect from '@/components/ui/PopupSelect'
import TimePicker from '@/components/ui/TimePicker'

export default function LessonEditorModal({ open, onClose, lesson, studentId, onSaved, mode = 'add' }: {
  open: boolean
  onClose: () => void
  lesson: any | null
  studentId: string
  onSaved: () => void
  mode?: 'edit' | 'add'
}) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState({
    course_type: '',
    lesson_date: '',
    regular_timeslot: '',
    actual_timeslot: '',
    lesson_status: '',
    lesson_teacher: '',
    progress_notes: '',
    video_url: '',
    lesson_count: 1
  })

  const [initialFormState, setInitialFormState] = useState(form)

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('')
  const statusOptions = [
    { label: '出席', value: '出席' },
    { label: '缺席', value: '缺席' },
    { label: '補堂', value: '補堂' },
    { label: '病假', value: '病假' },
    { label: '事假', value: '事假' },
  ]

  const [courseTypeOptions, setCourseTypeOptions] = useState<{ label: string, value: string }[]>([])
  const [courseTypeDropdownOpen, setCourseTypeDropdownOpen] = useState(false)
  const [pendingCourseType, setPendingCourseType] = useState('')

  const [teacherOptions, setTeacherOptions] = useState<{ label: string, value: string }[]>([])
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false)
  const [pendingTeacher, setPendingTeacher] = useState(form.lesson_teacher)

  const [lessonCountDropdownOpen, setLessonCountDropdownOpen] = useState(false)
  const [pendingLessonCount, setPendingLessonCount] = useState('1')
  const [customLessonCount, setCustomLessonCount] = useState(1)

  // 預覽多堂課日期
  const [previewDates, setPreviewDates] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // 用於修改預覽課堂日期
  const handlePreviewDateChange = (index: number, newDate: string) => {
    setPreviewDates(prev => {
      const copy = [...prev]
      const [, time] = copy[index].split(' ')
      copy[index] = `${newDate} ${time}`
      return copy
    })
  }

  // 用於修改預覽課堂時間
  const handlePreviewTimeChange = (index: number, newTime: string) => {
    setPreviewDates(prev => {
      const copy = [...prev]
      const [date] = copy[index].split(' ')
      copy[index] = `${date} ${newTime}`
      return copy
    })
  }

  // finalizedDates 狀態，用於存儲預覽儲存後的多堂課時間
  const [finalizedDates, setFinalizedDates] = useState<string[]>([])

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

  console.log('Fetched lesson data:', data)

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
      const key = item.course_type || ''
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
    const options = data.map((item: any) => ({
      label: item.teacher_nickname,
      value: item.teacher_nickname,
    }))
    setTeacherOptions(options)
  }
}

useEffect(() => {
  if (open && studentId && !lesson) {
    const today = new Date().toISOString().split('T')[0];
    const defaultForm = {
      course_type: '',
      lesson_date: today,
      regular_timeslot: '',
      actual_timeslot: '',
      lesson_status: '',
      lesson_teacher: '',
      progress_notes: '',
      video_url: '',
      lesson_count: 1
    }
    setForm(defaultForm)
    setInitialFormState(defaultForm)
    fetchRegularTimeslot()
    fetchHistoricalCourseType()
    fetchCourseTypeFromStudent()
  }
}, [open, studentId, lesson])

  const fetchCourseTypes = async () => {
    const { data, error } = await supabase.from('Hanami_CourseTypes').select('name')
    if (data) {
      const options = data.map((item: any) => ({
        label: item.name,
        value: item.name,
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
    if (lesson) {
      const newForm = { ...form, ...lesson }
      setForm(newForm)
      setInitialFormState(newForm)
    } else {
      const today = new Date().toISOString().split('T')[0];
      const defaultForm = {
        course_type: '',
        lesson_date: today,
        regular_timeslot: '',
        actual_timeslot: '',
        lesson_status: '',
        lesson_teacher: '',
        progress_notes: '',
        video_url: '',
        lesson_count: 1
      }
      setForm(defaultForm)
      setInitialFormState(defaultForm)
      fetchRegularTimeslot()
      fetchHistoricalCourseType()
    }
  }, [lesson])

  useEffect(() => {
    const baseDate = form.lesson_date ? new Date(form.lesson_date) : new Date()
    if (form.lesson_count > 0) {
      const previews = Array.from({ length: form.lesson_count }, (_, i) => {
        const newDate = new Date(baseDate)
        newDate.setDate(baseDate.getDate() + 7 * i)
        const formattedTime = form.regular_timeslot ? to24Hour(form.regular_timeslot) : '未設定時間'
        return `${newDate.toISOString().split('T')[0]} ${formattedTime}`
      })
      setPreviewDates(previews)
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

      // Create payload without lesson_count field
      const { lesson_count, ...payloadWithoutLessonCount } = form

      // 自動設置 lesson_duration
      const autoLessonDuration =
        form.course_type === '鋼琴'
          ? '00:45:00'
          : form.course_type === '音樂專注力'
          ? '01:00:00'
          : null;

      const payload = {
        ...payloadWithoutLessonCount,
        student_id: studentId,
        student_oid: studentData?.student_oid,
        lesson_duration: autoLessonDuration,
        regular_weekday: studentData?.regular_weekday,
        full_name: studentData?.full_name
      }

      if (lesson) {
        const { error } = await supabase
          .from('hanami_student_lesson')
          .update(payload)
          .eq('id', lesson.id)
        
        if (error) {
          console.error('Error updating lesson:', error)
          alert('更新課堂記錄失敗，請稍後再試')
          return
        }
        alert(
          '課堂已成功更新！\n' +
          '日期：' + payload.lesson_date + '\n' +
          '時間：' + (payload.actual_timeslot || payload.regular_timeslot)
        );
      } else {
        // 新增多堂課的情況
        if (form.lesson_count > 1) {
          const newLessons = previewDates.map(dt => {
            const [d, t] = dt.split(' ')
            return {
              ...payload,
              lesson_date: d,
              regular_timeslot: t,
              actual_timeslot: t // 預設實際時間與常規時間相同
            }
          })
          
          const { data, error } = await supabase
            .from('hanami_student_lesson')
            .insert(newLessons)
            .select()
          
          if (error) {
            console.error('Error inserting multiple lessons:', error)
            alert('新增多堂課記錄失敗，請稍後再試')
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
          const { data, error } = await supabase
            .from('hanami_student_lesson')
            .insert(payload)
            .select()
          
          if (error) {
            console.error('Error inserting single lesson:', error)
            alert('新增課堂記錄失敗，請稍後再試')
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
      alert('儲存失敗，請稍後再試')
    }
  }

  const handleCancel = () => {
    setForm(initialFormState)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl w-full max-w-md border border-[#F3EAD9]">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold"> {lesson ? '編輯課堂記錄' : '新增課堂記錄'} </Dialog.Title>
            {form.lesson_count > 1 && (
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
                  setPendingCourseType(form.course_type)
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
                  onChange={(val) => setPendingCourseType(val)}
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
                    onChange={(val) => setPendingLessonCount(val)}
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
            <input type="date" name="lesson_date" value={form.lesson_date} onChange={handleChange} className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" />
            {form.lesson_count === 1 ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#4B4036]">常規時間（不可修改）</label>
                <input
                  type="time"
                  value={form.regular_timeslot}
                  readOnly
                  className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] bg-gray-100 cursor-not-allowed"
                />
              </div>
            ) : (
              <>
                <TimePicker
                  label="常規時間"
                  value={form.regular_timeslot}
                  onChange={(val) => setForm({ ...form, regular_timeslot: val })}
                />
                {form.lesson_count > 1 && previewDates.length > 0 && (
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
                value={form.actual_timeslot}
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
                      setPendingStatus(form.lesson_status)
                      setStatusDropdownOpen(true)
                    }}
                    className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                  >
                    {form.lesson_status ? `出席狀況：${form.lesson_status}` : '請選擇出席狀況'}
                  </button>
                  {statusDropdownOpen && (
                    <PopupSelect
                      title="選擇出席狀況"
                      options={statusOptions}
                      selected={pendingStatus}
                      mode="single"
                      onChange={(val) => setPendingStatus(val)}
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
                  setPendingTeacher(form.lesson_teacher)
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
                  onChange={(val) => setPendingTeacher(val)}
                  onConfirm={() => {
                    setForm({ ...form, lesson_teacher: pendingTeacher })
                    setTeacherDropdownOpen(false)
                  }}
                  onCancel={() => setTeacherDropdownOpen(false)}
                />
              )}
            </div>
            <textarea name="progress_notes" value={form.progress_notes} onChange={handleChange} placeholder="備註" className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" />
            <input type="text" name="video_url" value={form.video_url} onChange={handleChange} placeholder="影片連結" className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={handleCancel} className="px-4 py-2 border border-[#EADBC8] text-sm text-[#A68A64] bg-white rounded-full hover:bg-[#f7f3ec]">取消</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-[#EBC9A4] text-sm text-[#2B3A3B] rounded-full hover:bg-[#e5ba8e]">儲存</button>
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
                    if (form.lesson_count > 0) {
                      const previews = Array.from({ length: form.lesson_count }, (_, i) => {
                        const newDate = new Date(baseDate)
                        newDate.setDate(baseDate.getDate() + 7 * i)
                        const formattedTime = form.regular_timeslot ? to24Hour(form.regular_timeslot) : '未設定時間'
                        return `${newDate.toISOString().split('T')[0]} ${formattedTime}`
                      })
                      setPreviewDates(previews)
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
                        : Array.from({ length: form.lesson_count }, (_, i) => {
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
  const handleDelete = async () => {
    if (lesson?.id) {
      await supabase.from('hanami_student_lesson').delete().eq('id', lesson.id)
      onSaved()
      onClose()
    }
  }
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import PopupSelect from '@/components/ui/PopupSelect'
import TimePicker from '@/components/ui/TimePicker'

interface Teacher {
  id: string
  teacher_fullname: string
  teacher_nickname: string
}

interface Schedule {
  id: string
  teacher_id: string
  scheduled_date: string
  start_time: string
  end_time: string
}

interface Lesson {
  id: string
  lesson_date: string
  student_id: string
  regular_timeslot: string
  course_type: string
  Hanami_Students?: {
    id: string
    full_name: string
    student_age: number | null
  }
}

interface GroupedLesson {
  time: string
  course: string
  students: {
    name: string
    student_id: string
    age: string | null
  }[]
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

type TeacherSchedulePanelProps = {
  teacherIds?: string[]
}

export default function TeacherShiftCalendar({ teacherIds }: TeacherSchedulePanelProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null)
  const [showTeacherSelect, setShowTeacherSelect] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSchedule>({
    teacher_id: '',
    start_time: '09:00',
    end_time: '18:00'
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)
  const [editStartTime, setEditStartTime] = useState('09:00')
  const [editEndTime, setEditEndTime] = useState('18:00')
  const [showTeacherPopup, setShowTeacherPopup] = useState(false)
  const [tempTeacherId, setTempTeacherId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Calculate month start and end
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const monthStartStr = format(monthStart, 'yyyy-MM-dd')
        const monthEndStr = format(monthEnd, 'yyyy-MM-dd')

        // Fetch lessons for the month with student information
        let lessonQuery = supabase
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
          .lte('lesson_date', monthEndStr)

        // Fetch schedules for the month (only if needed)
        let scheduleQuery = supabase
          .from('teacher_schedule')
          .select('id, teacher_id, scheduled_date, start_time, end_time')
          .gte('scheduled_date', monthStartStr)
          .lte('scheduled_date', monthEndStr)

        // Fetch teachers (only if needed)
        let teacherQuery = supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_nickname')

        if (teacherIds && teacherIds.length > 0) {
          scheduleQuery = scheduleQuery.in('teacher_id', teacherIds)
          teacherQuery = teacherQuery.in('id', teacherIds)
        }

        const [{ data: lessonData, error: lessonError }, { data: scheduleData, error: scheduleError }, { data: teacherData, error: teacherError }] = await Promise.all([
          lessonQuery,
          scheduleQuery,
          teacherQuery
        ])

        if (lessonError) {
          console.error('Error fetching lessons:', lessonError)
          return
        }
        if (lessonData) {
          setLessons(lessonData)
        }

        if (scheduleError) {
          console.error('Error fetching schedules:', scheduleError)
          return
        }
        if (scheduleData) setSchedules(scheduleData)

        if (teacherError) {
          console.error('Error fetching teachers:', teacherError)
          return
        }
        if (teacherData) setTeachers(teacherData)

      } catch (error) {
        console.error('Error in fetchData:', error)
      }
    }

    fetchData()
  }, [currentMonth, teacherIds])

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Group schedules by date
  const schedulesByDate: Record<string, Teacher[]> = {}
  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const scheduledTeacherIds = schedules
      .filter(s => s.scheduled_date === dateStr)
      .map(s => s.teacher_id)
    const scheduledTeachers = teachers.filter(t => scheduledTeacherIds.includes(t.id))
    schedulesByDate[dateStr] = scheduledTeachers
  })

  // Group lessons count by date
  const lessonsCountByDate: Record<string, number> = {}
  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const uniqueStudentIds = new Set(
      lessons
        .filter(l => l.lesson_date === dateStr)
        .map(l => l.student_id)
    )
    lessonsCountByDate[dateStr] = uniqueStudentIds.size
  })

  // Helper to get teacher initials
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return '--';
    const trimmed = name.trim();
    if (!trimmed) return '--';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return parts.map(p => p[0]).join('').slice(0, 2);
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Handle date cell click
  const handleDateClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const scheduledTeachers = schedulesByDate[dateStr] || []
    
    // Group lessons by time and course
    const dayLessons = lessons.filter(l => l.lesson_date === dateStr)
    const groupedLessons = dayLessons.reduce((acc: Record<string, GroupedLesson>, lesson) => {
      const key = `${lesson.regular_timeslot}_${lesson.course_type}`
      if (!acc[key]) {
        acc[key] = {
          time: lesson.regular_timeslot,
          course: lesson.course_type,
          students: []
        }
      }
      if (lesson.Hanami_Students) {
        acc[key].students.push({
          name: lesson.Hanami_Students.full_name,
          student_id: lesson.student_id,
          age: lesson.Hanami_Students.student_age?.toString() || null
        })
      }
      return acc
    }, {})

    setSelectedDetail({
      date: day,
      teachers: scheduledTeachers,
      groups: Object.values(groupedLessons).sort((a, b) => a.time.localeCompare(b.time))
    })
  }

  // Handle save teacher schedule
  const handleSaveTeacherSchedule = async () => {
    if (!selectedDetail || !selectedTeacher.teacher_id) return
    setLoading(true)
    setErrorMsg(null)
    const dateStr = format(selectedDetail.date, 'yyyy-MM-dd')
    const { error } = await supabase
      .from('teacher_schedule')
      .insert({
        teacher_id: selectedTeacher.teacher_id,
        scheduled_date: dateStr,
        start_time: selectedTeacher.start_time,
        end_time: selectedTeacher.end_time
      })

    if (error) {
      console.error('Error saving schedule:', error)
      setErrorMsg('儲存失敗，請檢查資料庫權限或網路連線')
      setLoading(false)
      return
    }

    // Refresh data
    const { data: scheduleData, error: fetchError } = await supabase
      .from('teacher_schedule')
      .select('id, teacher_id, scheduled_date, start_time, end_time')
      .eq('scheduled_date', dateStr)

    if (fetchError) {
      setErrorMsg('儲存後重新取得資料失敗')
      setLoading(false)
      return
    }
    if (scheduleData) {
      setSchedules(prev => [...prev.filter(s => s.scheduled_date !== dateStr), ...scheduleData])
      setShowTeacherSelect(false)
      setSelectedTeacher({ teacher_id: '', start_time: '09:00', end_time: '18:00' })
      setLoading(false)
    }
    setLoading(false)
  }

  // Handle delete teacher schedule
  const handleDeleteTeacherSchedule = async (teacherId: string) => {
    if (!selectedDetail) return
    setLoading(true)
    setErrorMsg(null)
    const dateStr = format(selectedDetail.date, 'yyyy-MM-dd')
    const { error } = await supabase
      .from('teacher_schedule')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('scheduled_date', dateStr)

    if (error) {
      console.error('Error deleting schedule:', error)
      setErrorMsg('刪除失敗，請檢查資料庫權限或網路連線')
      setLoading(false)
      return
    }

    // Refresh data
    setSchedules(prev => prev.filter(s => !(s.teacher_id === teacherId && s.scheduled_date === dateStr)))
    setSelectedDetail(prev => prev ? {
      ...prev,
      teachers: prev.teachers.filter(t => t.id !== teacherId)
    } : null)
    setLoading(false)
  }

  // 匯出 CSV
  function exportTeacherCSV(teacher) {
    const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id)
    if (teacherSchedules.length === 0) return
    const header = ['日期', '老師', '上班時間', '下班時間']
    const rows = teacherSchedules.map(sch => [
      sch.scheduled_date,
      teacher.teacher_nickname || teacher.teacher_fullname,
      sch.start_time.slice(0,5),
      sch.end_time.slice(0,5)
    ])
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${teacher.teacher_nickname || teacher.teacher_fullname}_排班.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 複製 Markdown
  function copyTeacherMarkdown(teacher) {
    const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id)
    if (teacherSchedules.length === 0) return
    const header = ['| 日期 | 老師 | 上班時間 | 下班時間 |', '|---|---|---|---|']
    const rows = teacherSchedules.map(sch => `| ${sch.scheduled_date} | ${teacher.teacher_nickname || teacher.teacher_fullname} | ${sch.start_time.slice(0,5)} | ${sch.end_time.slice(0,5)} |`)
    const md = [...header, ...rows].join('\n')
    navigator.clipboard.writeText(md)
      .then(() => alert('已複製為 Markdown 表格！'))
      .catch(() => alert('複製失敗，請手動複製'))
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-6xl mx-auto font-['Quicksand',_sans-serif]">
      <div className="flex justify-end mb-2">
        <button
          className={`px-3 py-1 rounded-l-full border border-[#EADBC8] ${viewMode === 'calendar' ? 'bg-[#FFE8C2] text-[#4B4036]' : 'bg-white text-[#A68A64]'}`}
          onClick={() => setViewMode('calendar')}
        >日曆顯示</button>
        <button
          className={`px-3 py-1 rounded-r-full border border-[#EADBC8] border-l-0 ${viewMode === 'list' ? 'bg-[#FFE8C2] text-[#4B4036]' : 'bg-white text-[#A68A64]'}`}
          onClick={() => setViewMode('list')}
        >列表顯示</button>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto mt-4">
          {teachers.map(teacher => {
            const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id)
            if (teacherSchedules.length === 0) return null
            return (
              <div key={teacher.id} className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-[#4B4036] text-lg">{teacher.teacher_nickname || teacher.teacher_fullname}</div>
                  <button
                    className="px-2 py-1 text-xs bg-[#EADBC8] rounded hover:bg-[#FFE8C2] border border-[#EADBC8]"
                    onClick={() => exportTeacherCSV(teacher)}
                  >匯出 CSV</button>
                  <button
                    className="px-2 py-1 text-xs bg-[#EADBC8] rounded hover:bg-[#FFE8C2] border border-[#EADBC8]"
                    onClick={() => copyTeacherMarkdown(teacher)}
                  >複製 Markdown</button>
                </div>
                <table className="min-w-full border border-[#EADBC8] rounded-xl">
                  <thead className="bg-[#FFFCEB]">
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
                        <td className="p-2 border-b border-[#EADBC8]">{sch.start_time.slice(0,5)}</td>
                        <td className="p-2 border-b border-[#EADBC8]">{sch.end_time.slice(0,5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1 bg-[#EADBC8] rounded hover:bg-[#d4c1a1]"
            aria-label="Previous Month"
          >
            &lt;
          </button>
          <h2 className="text-xl font-bold text-[#2B3A3B]">
            {format(currentMonth, 'yyyy年MM月')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 bg-[#EADBC8] rounded hover:bg-[#d4c1a1]"
            aria-label="Next Month"
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
            const dateStr = format(day, 'yyyy-MM-dd')
            const scheduledTeachers = schedulesByDate[dateStr] || []
            const lessonCount = lessonsCountByDate[dateStr] || 0
            return (
              <div
                key={dateStr}
                className="relative border border-[#EADBC8] rounded p-2 flex flex-col justify-between min-h-[90px] cursor-pointer hover:bg-[#FFFCF5]"
                onClick={() => handleDateClick(day)}
              >
                <div className="absolute top-0 left-1 text-xs font-semibold text-[#2B3A3B]">{day.getDate()}</div>
                <div className="flex flex-col justify-between h-full">
                  <div className="flex flex-col items-center mt-4 space-y-1">
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {scheduledTeachers.length > 0 ? scheduledTeachers.map(t => {
                        const schedule = schedules.find(s => s.teacher_id === t.id && s.scheduled_date === dateStr)
                        return (
                          <button
                            key={t.id}
                            className="bg-[#FFE8C2] text-[#4B4036] rounded-full px-1 py-0.5 text-[10px] font-medium whitespace-nowrap flex items-center gap-1 hover:ring-2 hover:ring-[#EADBC8] focus:outline-none"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setEditingTeacherId(t.id)
                              setEditStartTime(schedule?.start_time?.slice(0,5) || '09:00')
                              setEditEndTime(schedule?.end_time?.slice(0,5) || '18:00')
                            }}
                            title="點擊修改時間"
                          >
                            {t.teacher_nickname}
                            {schedule && (
                              <span className="ml-1 text-[10px] text-[#A68A64]">
                                ({schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)})
                              </span>
                            )}
                          </button>
                        )
                      }) : <span className="text-[#aaa]">無</span>}
                    </div>
                  </div>
                  <div className="text-xs mt-2 flex items-center justify-center gap-1">
                    <img src="/icons/penguin-face.PNG" alt="girl icon" className="w-4 h-4" />
                    {lessonCount}
                  </div>
                </div>
              </div>
            )
          })}
          {/* Empty slots for days after the last of the month */}
          {Array(6 - daysInMonth[daysInMonth.length - 1].getDay()).fill(null).map((_, i) => (
            <div key={`empty-end-${i}`} />
          ))}
        </div>
      ) : null}

      {/* Popup for daily schedule */}
      {selectedDetail && (
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[#FFFDF8] p-6 rounded-xl shadow-xl w-80 text-[#4B4036] max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedDetail(null)}
              className="fixed top-4 right-[calc(50%-160px)] z-50 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-100 shadow"
              aria-label="關閉"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-2">
              {format(selectedDetail.date, 'yyyy年MM月dd日')} 課堂安排
            </h3>
            
            {/* Teachers section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">當日老師：</h4>
                <button
                  onClick={() => setShowTeacherSelect(true)}
                  className="text-sm text-[#A68A64] hover:underline flex items-center gap-1"
                >
                  <img src="/icons/edit-pencil.png" alt="編輯" className="w-4 h-4" /> 安排老師
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {selectedDetail.teachers.length > 0 ? (
                  selectedDetail.teachers.map(teacher => {
                    const schedule = schedules.find(
                      s => s.teacher_id === teacher.id && 
                      s.scheduled_date === format(selectedDetail.date, 'yyyy-MM-dd')
                    )
                    return (
                      <div key={teacher.id} className="flex items-center gap-2">
                        <button
                          className="bg-[#FFE8C2] text-[#4B4036] rounded-full px-1.5 py-0.5 text-xs font-medium whitespace-nowrap flex items-center gap-1 hover:ring-2 hover:ring-[#EADBC8] focus:outline-none"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setEditingTeacherId(teacher.id)
                            setEditStartTime(schedule?.start_time?.slice(0,5) || '09:00')
                            setEditEndTime(schedule?.end_time?.slice(0,5) || '18:00')
                          }}
                          title="點擊修改時間"
                        >
                          {teacher.teacher_nickname}
                          {schedule && (
                            <span className="ml-1 text-[11px] text-[#A68A64]">
                              ({schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)})
                            </span>
                          )}
                        </button>
                        {editingTeacherId === teacher.id && (
                          <div className="absolute left-1/2 top-12 z-50 bg-white border border-[#EADBC8] rounded-xl shadow-xl p-4 flex flex-col gap-2 min-w-[220px]" style={{ transform: 'translateX(-50%)' }}>
                            <div className="font-bold mb-2 text-[#4B4036]">修改時間</div>
                            <div className="flex items-center gap-2 text-sm font-medium text-[#4B4036]">
                              <img src="/teacher.png" alt="老師圖示" className="w-4 h-4" />
                              {teacher.teacher_nickname}
                            </div>
                            <TimePicker
                              label="上班時間"
                              value={editStartTime}
                              onChange={setEditStartTime}
                              disabled={loading}
                            />
                            <TimePicker
                              label="下班時間"
                              value={editEndTime}
                              onChange={setEditEndTime}
                              disabled={loading}
                            />
                            {errorMsg && <div className="text-red-500 text-xs mt-1">{errorMsg}</div>}
                            <div className="flex gap-2 mt-2">
                              <button
                                className="px-3 py-1 rounded-full bg-gray-200 text-[#4B4036] text-sm"
                                onClick={() => setEditingTeacherId(null)}
                                disabled={loading}
                              >取消</button>
                              <button
                                className="px-3 py-1 rounded-full bg-[#EBC9A4] text-[#4B4036] text-sm"
                                disabled={loading}
                                onClick={async () => {
                                  setLoading(true)
                                  setErrorMsg(null)
                                  const dateStr = format(selectedDetail.date, 'yyyy-MM-dd')
                                  const { error } = await supabase
                                    .from('teacher_schedule')
                                    .update({ start_time: editStartTime, end_time: editEndTime })
                                    .eq('teacher_id', teacher.id)
                                    .eq('scheduled_date', dateStr)
                                  if (error) {
                                    setErrorMsg('更新失敗，請檢查資料庫權限或網路連線')
                                    setLoading(false)
                                    return
                                  }
                                  // Refresh data
                                  const { data: scheduleData, error: fetchError } = await supabase
                                    .from('teacher_schedule')
                                    .select('id, teacher_id, scheduled_date, start_time, end_time')
                                    .eq('scheduled_date', dateStr)
                                  if (fetchError) {
                                    setErrorMsg('更新後重新取得資料失敗')
                                    setLoading(false)
                                    return
                                  }
                                  if (scheduleData) {
                                    setSchedules(prev => [...prev.filter(s => s.scheduled_date !== dateStr), ...scheduleData])
                                    setEditingTeacherId(null)
                                    setLoading(false)
                                  }
                                  setLoading(false)
                                }}
                              >{loading ? '儲存中...' : '儲存'}</button>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTeacherSchedule(teacher.id)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-[#aaa]">無</span>
                )}
              </div>
            </div>

            {/* Lessons section */}
            <div>
              <h4 className="font-semibold mb-2">課堂安排：</h4>
              <div className="space-y-3">
                {selectedDetail.groups.map((group, idx) => (
                  <div key={idx} className="border-l-2 pl-4">
                    <div className="text-[#4B4036] font-bold">
                      {group.time.slice(0, 5)} {group.course} ({group.students.length})
                    </div>
                    <div className="ml-4 text-sm text-[#4B4036]">
                      {group.students.map((student, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span>{student.name}</span>
                          {student.age && (
                            <span className="text-[10px] text-[#87704e]">
                              （
                              {Math.floor(parseInt(student.age) / 12)}Y
                              {parseInt(student.age) % 12}M
                              ）
                            </span>
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

      {/* Teacher selection popup */}
      {showTeacherSelect && (
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[#FFFDF8] p-6 rounded-xl shadow-xl w-96 text-[#4B4036]">
            <h3 className="text-lg font-bold mb-4">安排老師</h3>
            {errorMsg && <div className="mb-2 text-red-500 text-sm">{errorMsg}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">選擇老師：</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowTeacherPopup(true)}
                  disabled={loading}
                >
                  {selectedTeacher.teacher_id
                    ? teachers.find(t => t.id === selectedTeacher.teacher_id)?.teacher_nickname || '請選擇老師'
                    : '請選擇老師'}
                </button>
                {showTeacherPopup && (
                  <PopupSelect
                    title="選擇老師"
                    options={teachers.map(t => ({ label: t.teacher_nickname, value: t.id }))}
                    selected={tempTeacherId || selectedTeacher.teacher_id}
                    onChange={(value) => setTempTeacherId(value as string)}
                    onConfirm={() => {
                      setSelectedTeacher(prev => ({ ...prev, teacher_id: tempTeacherId }))
                      setShowTeacherPopup(false)
                    }}
                    onCancel={() => {
                      setTempTeacherId(selectedTeacher.teacher_id)
                      setShowTeacherPopup(false)
                    }}
                    mode="single"
                  />
                )}
              </div>
              <div className="space-y-4">
                <TimePicker
                  label="上班時間"
                  value={selectedTeacher.start_time}
                  onChange={(time) => setSelectedTeacher(prev => ({ ...prev, start_time: time }))}
                />
                <TimePicker
                  label="下班時間"
                  value={selectedTeacher.end_time}
                  onChange={(time) => setSelectedTeacher(prev => ({ ...prev, end_time: time }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowTeacherSelect(false)
                  setSelectedTeacher({ teacher_id: '', start_time: '09:00', end_time: '18:00' })
                }}
                className="px-4 py-2 bg-gray-200 rounded-full text-sm text-[#4B4036]"
                disabled={loading}
              >
                取消
              </button>
              <button
                onClick={handleSaveTeacherSchedule}
                className="px-4 py-2 bg-[#EBC9A4] rounded-full text-sm text-[#4B4036]"
                disabled={loading}
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
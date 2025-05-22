'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import { PopupSelect } from '@/components/ui/PopupSelect'
import TimePicker from '@/components/ui/TimePicker'

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
          .from('hanami_teacher_schedule')
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
          setLessons(lessonData as Lesson[])
        }

        if (scheduleError) {
          console.error('Error fetching schedules:', scheduleError)
          return
        }
        if (scheduleData) {
          setSchedules(scheduleData as Schedule[])
        }

        if (teacherError) {
          console.error('Error fetching teachers:', teacherError)
          return
        }
        if (teacherData) {
          setTeachers(teacherData as Teacher[])
        }

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
  const getInitials = (name?: string | null): string => {
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
    const groupedLessons: GroupedLesson[] = dayLessons.map(lesson => ({
      time: lesson.regular_timeslot || '',
      course: lesson.course_type || '',
      students: [{
        name: lesson.Hanami_Students?.full_name || '',
        student_id: lesson.student_id || '',
        age: lesson.Hanami_Students?.student_age ? String(lesson.Hanami_Students.student_age) : null
      }]
    }));

    setSelectedDetail({
      date: day,
      teachers: scheduledTeachers,
      groups: groupedLessons.sort((a, b) => a.time.localeCompare(b.time))
    })
  }

  // Handle save teacher schedule
  const handleSaveTeacherSchedule = async () => {
    if (!selectedDetail || !selectedTeacher.teacher_id) return
    setLoading(true)
    setErrorMsg(null)
    const dateStr = format(selectedDetail.date, 'yyyy-MM-dd')
    const { error } = await supabase
      .from('hanami_teacher_schedule')
      .insert({
        teacher_id: selectedTeacher.teacher_id,
        scheduled_date: dateStr,
        start_time: selectedTeacher.start_time,
        end_time: selectedTeacher.end_time
      })

    if (error) {
      setErrorMsg('無法儲存老師排班：' + error.message)
    } else {
    // Refresh data
      const { data: newSchedule, error: fetchError } = await supabase
        .from('hanami_teacher_schedule')
      .select('id, teacher_id, scheduled_date, start_time, end_time')
      .eq('scheduled_date', dateStr)
        .eq('teacher_id', selectedTeacher.teacher_id)
        .single()

    if (fetchError) {
        setErrorMsg('無法獲取新排班資料：' + fetchError.message)
      } else if (newSchedule) {
        setSchedules([...schedules, newSchedule as Schedule])
      setSelectedTeacher({ teacher_id: '', start_time: '09:00', end_time: '18:00' })
        setShowTeacherSelect(false)
      }
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
      .from('hanami_teacher_schedule')
      .delete()
      .eq('scheduled_date', dateStr)
      .eq('teacher_id', teacherId)

    if (error) {
      setErrorMsg('無法刪除老師排班：' + error.message)
    } else {
      setSchedules(schedules.filter(s => !(s.scheduled_date === dateStr && s.teacher_id === teacherId)))
    }
    setLoading(false)
  }

  // Export teacher schedule to CSV
  function exportTeacherCSV(teacher: Teacher): void {
    const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id)
    const csvContent = [
      ['日期', '開始時間', '結束時間'],
      ...teacherSchedules.map(s => [
        s.scheduled_date,
        s.start_time,
        s.end_time
    ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${teacher.teacher_nickname}_排班表.csv`
    link.click()
  }

  // Copy teacher schedule as markdown
  function copyTeacherMarkdown(teacher: Teacher): void {
    const teacherSchedules = schedules.filter(s => s.teacher_id === teacher.id)
    const markdown = [
      `# ${teacher.teacher_nickname} 排班表`,
      '',
      '| 日期 | 開始時間 | 結束時間 |',
      '|------|----------|----------|',
      ...teacherSchedules.map(s => `| ${s.scheduled_date} | ${s.start_time} | ${s.end_time} |`)
    ].join('\n')

    navigator.clipboard.writeText(markdown)
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'yyyy年MM月')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded ${
              viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            月曆
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${
              viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            列表
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
        {daysInMonth.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const scheduledTeachers = schedulesByDate[dateStr] || []
            const lessonCount = lessonsCountByDate[dateStr] || 0
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(day)}
              className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-sm">{format(day, 'd')}</div>
              <div className="text-xs text-gray-500">
                {scheduledTeachers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scheduledTeachers.map(teacher => (
                      <span
                        key={teacher.id}
                        className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {getInitials(teacher.teacher_nickname)}
                              </span>
                    ))}
                  </div>
                )}
                {lessonCount > 0 && (
                  <div className="mt-1 text-green-600">
                    {lessonCount} 堂
                  </div>
                )}
                </div>
              </div>
            )
          })}
        </div>

      {/* Selected Date Detail */}
      {selectedDetail && (
        <div className="mt-4 p-4 border rounded">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {format(selectedDetail.date, 'yyyy年MM月dd日')}
            </h3>
            <button
              onClick={() => setShowTeacherSelect(true)}
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
      {showTeacherSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">新增老師排班</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  選擇老師
                </label>
                  <PopupSelect
                    title="選擇老師"
                  options={teachers.map(t => ({
                    label: t.teacher_nickname,
                    value: t.id
                  }))}
                  selected={selectedTeacher.teacher_id}
                  onChange={(val) => setSelectedTeacher(prev => ({
                    ...prev,
                    teacher_id: typeof val === 'string' ? val : val[0]
                  }))}
                    mode="single"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  開始時間
                </label>
                <TimePicker
                  value={selectedTeacher.start_time}
                  onChange={(time) => setSelectedTeacher(prev => ({
                    ...prev,
                    start_time: time
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  結束時間
                </label>
                <TimePicker
                  value={selectedTeacher.end_time}
                  onChange={(time) => setSelectedTeacher(prev => ({
                    ...prev,
                    end_time: time
                  }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowTeacherSelect(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleSaveTeacherSchedule}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? '儲存中...' : '儲存'}
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
  )
}
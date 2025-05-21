'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { PopupSelect } from '@/components/ui/PopupSelect'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import StudentCard from '@/components/ui/StudentCard'
import { BookOpen, CalendarClock, Star, LayoutGrid, List, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useParams } from 'next/navigation'

export default function StudentManagementPage() {
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>(() => {
    if (filterParam === 'regular') return ['常規']
    if (filterParam === 'trial') return ['試堂']
    return []
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([])
  const [weekdayDropdownOpen, setWeekdayDropdownOpen] = useState(false)
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<'all' | 'gt2' | 'lte2' | 'custom'>(() => {
    if (filterParam === 'lastLesson') return 'custom'
    return 'all'
  })
  const [customLessonCount, setCustomLessonCount] = useState<number | ''>(() => {
    if (filterParam === 'lastLesson') return 1
    return ''
  })
  const [lessonDropdownOpen, setLessonDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false)
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'student_oid',
    'full_name',
    'student_age',
    'student_type',
    'course_type',
    'regular_weekday',
    'regular_timeslot',
    'remaining_lessons',
    'contact_number',
    'health_notes'
  ])

  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { id } = useParams()

  console.log('user:', user, 'userLoading:', userLoading, 'id:', id)

  // 基本欄位（強制顯示，但不在選單中）
  // { label: '學生編號', value: 'student_oid' },
  // { label: '姓名', value: 'full_name' },
  // { label: '年齡', value: 'student_age' },
  const columnOptions = [
    { label: '性別', value: 'gender' },
    { label: '生日', value: 'student_dob' },
    { label: '類型', value: 'student_type' },
    { label: '課程', value: 'course_type' },
    { label: '學校', value: 'school' },
    { label: '地址', value: 'address' },
    { label: '負責老師', value: 'student_teacher' },
    { label: '偏好', value: 'student_preference' },
    { label: '上課日', value: 'regular_weekday' },
    { label: '上課時間', value: 'regular_timeslot' },
    { label: '剩餘堂數', value: 'remaining_lessons' },
    { label: '入學日期', value: 'started_date' },
    { label: '報讀時長', value: 'duration_months' },
    { label: '聯絡電話', value: 'contact_number' },
    { label: '家長 Email', value: 'parent_email' },
    { label: '健康備註', value: 'health_notes' },
    { label: '試堂日期', value: 'lesson_date' },
    { label: '試堂時間', value: 'actual_timeslot' }
  ]

  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login')
      return
    }
    if (user && !['admin', 'manager'].includes(user.role)) {
      router.push('/')
      return
    }

    const checkAndFetch = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user

      if (!user) {
        router.push('/admin/login')
        return
      }

      if (user.user_metadata?.role !== 'admin') {
        alert('無權限存取，僅限管理員登入')
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      try {
        // 獲取常規學生數據
        const { data: studentData, error: studentError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age, student_preference, course_type, remaining_lessons, regular_weekday, gender, student_type, student_oid, contact_number, regular_timeslot, health_notes')

        // 獲取試堂學生數據
        const { data: trialStudentData, error: trialStudentError } = await supabase
          .from('hanami_trial_students')
          .select('*')

        if (studentError) {
          console.error('Error fetching regular students:', studentError)
          return
        }

        if (trialStudentError) {
          console.error('Error fetching trial students:', trialStudentError)
          return
        }

        // 處理常規學生數據
        const regularStudents = studentData || []

        // 處理試堂學生數據
        const trialStudents = (trialStudentData || []).map((trial) => {
          // 計算學生年齡
          let student_age = 0
          if (trial.student_dob) {
            const dob = new Date(trial.student_dob)
            const now = new Date()
            let years = now.getFullYear() - dob.getFullYear()
            let months = now.getMonth() - dob.getMonth()
            if (months < 0) {
              years -= 1
              months += 12
            }
            student_age = years * 12 + months
          }

          // 計算星期
          let weekday = null
          if (trial.lesson_date) {
            const trialDate = new Date(trial.lesson_date)
            const hkTime = new Date(trialDate.getTime() + 8 * 60 * 60 * 1000)
            weekday = hkTime.getDay().toString()
          }

          return {
            id: trial.id,
            full_name: trial.full_name,
            student_age,
            student_preference: trial.student_preference || null,
            course_type: trial.course_type || null,
            remaining_lessons: trial.remaining_lessons ?? null,
            regular_weekday: weekday !== null ? [weekday] : [],
            weekday: weekday,
            gender: trial.gender || null,
            student_type: '試堂',
            lesson_date: trial.lesson_date,
            actual_timeslot: trial.actual_timeslot,
            student_oid: trial.student_oid || null,
            contact_number: trial.contact_number || null,
            regular_timeslot: trial.regular_timeslot || null,
            health_notes: trial.health_notes || null
          }
        })

        // 合併所有學生數據
        const allStudents = [...regularStudents, ...trialStudents]
        console.log('🧒 全部學生資料：', allStudents)
        setStudents(allStudents)
      } catch (err) {
        console.error('Error:', err)
      }
    }

    checkAndFetch()
  }, [])

  const filteredStudents = students.filter((student) => {
    const type = student.course_type?.trim() || ''
    
    // 處理常規學生的星期
    const regularWeekdays = Array.isArray(student.regular_weekday)
      ? student.regular_weekday.map((d: string | number) => d.toString())
      : typeof student.regular_weekday === 'string'
        ? [student.regular_weekday]
        : typeof student.regular_weekday === 'number'
          ? [student.regular_weekday.toString()]
          : []

    // 處理試堂學生的星期
    const trialWeekday = student.weekday?.toString()

    const courseMatch =
      selectedCourses.length === 0 ||
      selectedCourses.some((selected) => {
        if (['鋼琴', '音樂專注力', '未分班'].includes(selected)) {
          return type === selected || (!type && selected === '未分班')
        } else if (selected === '常規') {
          return student.student_type !== '試堂'
        } else if (selected === '試堂') {
          return student.student_type === '試堂'
        }
        return false
      })

    const weekdayMatch =
      selectedWeekdays.length === 0 ||
      regularWeekdays.some((day: string) => selectedWeekdays.includes(day)) ||
      (trialWeekday && selectedWeekdays.includes(trialWeekday))

    const lessonMatch =
      selectedLessonFilter === 'all'
        ? true
        : selectedLessonFilter === 'gt2'
          ? Number(student.remaining_lessons) > 2
          : selectedLessonFilter === 'lte2'
            ? Number(student.remaining_lessons) <= 2
            : isCustomLessonFilterActive(selectedLessonFilter, customLessonCount)
              ? Number(student.remaining_lessons) === customLessonCount
              : true

    const nameMatch = student.full_name?.includes(searchTerm.trim())

    return courseMatch && weekdayMatch && lessonMatch && nameMatch
  })

  // 對試堂學生進行排序
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (selectedCourses.includes('試堂')) {
      const dateA = a.lesson_date ? new Date(a.lesson_date).getTime() : 0
      const dateB = b.lesson_date ? new Date(b.lesson_date).getTime() : 0
      return dateB - dateA // 從新到舊排序
    }
    return 0
  })

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">學生資料管理</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="搜尋學生姓名"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex overflow-x-auto gap-2 pb-3">
            <div className="mb-4">
              <button
                onClick={() => setDropdownOpen(true)}
                className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm"
              >
                篩選課程
              </button>
              {dropdownOpen && (
                <PopupSelect
                  title="篩選課程"
                  options={[
                    { label: '鋼琴', value: '鋼琴' },
                    { label: '音樂專注力', value: '音樂專注力' },
                    { label: '未分班', value: '未分班' },
                    { label: '常規', value: '常規' },
                    { label: '試堂', value: '試堂' },
                  ]}
                  selected={selectedCourses}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      setSelectedCourses(value);
                    } else if (typeof value === 'string') {
                      setSelectedCourses([value]);
                    }
                  }}
                  onConfirm={() => { console.log('父層 confirm'); setDropdownOpen(false) }}
                  onCancel={() => { console.log('父層 cancel'); setDropdownOpen(false) }}
                />
              )}
            </div>

            <div className="mb-4">
              <button
                onClick={() => setWeekdayDropdownOpen(true)}
                className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm"
              >
                篩選星期
              </button>
              {weekdayDropdownOpen && (
                <PopupSelect
                  title="篩選星期"
                  options={[
                    { label: '星期一', value: '1' },
                    { label: '星期二', value: '2' },
                    { label: '星期三', value: '3' },
                    { label: '星期四', value: '4' },
                    { label: '星期五', value: '5' },
                    { label: '星期六', value: '6' },
                    { label: '星期日', value: '0' },
                  ]}
                  selected={selectedWeekdays}
                  onChange={value => setSelectedWeekdays(Array.isArray(value) ? value : [value])}
                  onConfirm={() => { console.log('父層 confirm'); setWeekdayDropdownOpen(false) }}
                  onCancel={() => { console.log('父層 cancel'); setWeekdayDropdownOpen(false) }}
                />
              )}
            </div>

            <div className="mb-4">
              <button
                onClick={() => setLessonDropdownOpen(true)}
                className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm"
              >
                篩選堂數
              </button>
              {lessonDropdownOpen && (
                <PopupSelect
                  title="篩選剩餘堂數"
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '> 2', value: 'gt2' },
                    { label: '≤ 2', value: 'lte2' },
                    { label: '自訂數字', value: 'custom' },
                  ]}
                  selected={selectedLessonFilter}
                  onChange={(value) => setSelectedLessonFilter(value as any)}
                  onConfirm={() => { console.log('父層 confirm'); setLessonDropdownOpen(false) }}
                  onCancel={() => { console.log('父層 cancel'); setLessonDropdownOpen(false) }}
                  mode="single"
                />
              )}
              {selectedLessonFilter === 'custom' && (
                <input
                  type="number"
                  value={customLessonCount}
                  onChange={(e) => setCustomLessonCount(Number(e.target.value))}
                  className="ml-2 border border-[#EADBC8] rounded px-2 py-1 text-sm w-20 mt-2"
                  placeholder="數字"
                />
              )}
            </div>

            <div className="mb-4">
              <button
                onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
                className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm flex items-center gap-2"
              >
                {displayMode === 'grid' ? (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span>圖卡顯示</span>
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4" />
                    <span>列表顯示</span>
                  </>
                )}
              </button>
            </div>

            {(selectedCourses.length > 0 ||
              selectedWeekdays.length > 0 ||
              selectedLessonFilter !== 'all' ||
              isCustomLessonFilterActive(selectedLessonFilter, customLessonCount)) && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setSelectedCourses([])
                      setSelectedWeekdays([])
                      setSelectedLessonFilter('all')
                      setCustomLessonCount('')
                    }}
                    className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#A68A64] shadow-sm hover:bg-[#f7f3ec]"
                  >
                    清除條件
                  </button>
                </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          顯示學生數：{sortedStudents.length}（
          {[
            selectedCourses.length > 0 && `課程：${selectedCourses.join('、')}`,
            selectedWeekdays.length > 0 &&
              `星期：${selectedWeekdays
                .map((day) => ['日', '一', '二', '三', '四', '五', '六'][Number(day)])
                .join('、')}`,
            selectedLessonFilter === 'custom' && typeof customLessonCount === 'number'
              ? `剩餘堂數 = ${customLessonCount}`
              : selectedLessonFilter === 'gt2'
              ? '剩餘堂數 > 2'
              : selectedLessonFilter === 'lte2'
              ? '剩餘堂數 ≤ 2'
              : null,
          ]
            .filter(Boolean)
            .join('；') || '全部條件'}
          )
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#2B3A3B]">每頁顯示：</span>
            <button
              onClick={() => setPageSizeDropdownOpen(true)}
              className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm"
            >
              {pageSize === Infinity ? '全部' : pageSize}
            </button>
            {pageSizeDropdownOpen && (
              <PopupSelect
                title="選擇顯示數量"
                options={[
                  { label: '20', value: '20' },
                  { label: '50', value: '50' },
                  { label: '100', value: '100' },
                  { label: '全部', value: 'all' },
                ]}
                selected={pageSize.toString()}
                onChange={(value) => {
                  setPageSize(value === 'all' ? Infinity : Number(value))
                  setCurrentPage(1)
                }}
                onConfirm={() => { console.log('父層 confirm'); setPageSizeDropdownOpen(false) }}
                onCancel={() => { console.log('父層 cancel'); setPageSizeDropdownOpen(false) }}
                mode="single"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setColumnSelectorOpen(true)}
              className="bg-white border border-[#EADBC8] text-sm px-4 py-2 rounded-full text-[#2B3A3B] shadow-sm flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              <span>顯示欄位</span>
            </button>
            {columnSelectorOpen && (
              <PopupSelect
                title="選擇顯示欄位"
                options={columnOptions}
                selected={selectedColumns}
                onChange={(value) => {
                  // 確保基本欄位始終被選中
                  const newSelected = Array.isArray(value) ? value : [value]
                  if (!newSelected.includes('student_oid')) newSelected.push('student_oid')
                  if (!newSelected.includes('full_name')) newSelected.push('full_name')
                  if (!newSelected.includes('student_age')) newSelected.push('student_age')
                  setSelectedColumns(newSelected)
                }}
                onConfirm={() => { console.log('父層 confirm'); setColumnSelectorOpen(false) }}
                onCancel={() => { console.log('父層 cancel'); setColumnSelectorOpen(false) }}
                mode="multi"
              />
            )}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-[#2B3A3B] hover:bg-[#FFFCEB]'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#2B3A3B]">
              第 {currentPage} 頁，共 {Math.ceil(sortedStudents.length / pageSize)} 頁
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sortedStudents.length / pageSize), prev + 1))}
              disabled={currentPage === Math.ceil(sortedStudents.length / pageSize)}
              className={`p-2 rounded-full ${
                currentPage === Math.ceil(sortedStudents.length / pageSize)
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-[#2B3A3B] hover:bg-[#FFFCEB]'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtered students list */}
        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sortedStudents
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((student) => {
                const ageInMonths = Number(student.student_age) || 0
                const years = Math.floor(ageInMonths / 12)
                const months = ageInMonths % 12

                if (!student.gender) {
                  console.warn(`學生 ${student.full_name || student.id} 缺少 gender，avatar 預設為 boy.png`)
                }

                const isTrialStudent = student.student_type === '試堂'
                const cardFields = isTrialStudent
                  ? [
                      {
                        icon: CalendarClock,
                        label: '年齡',
                        value: ageInMonths ? `${years} 歲${months > 0 ? ` ${months} 個月` : ''}` : '—',
                      },
                      {
                        icon: BookOpen,
                        label: '課程',
                        value: student.course_type || '未分班',
                      },
                      {
                        icon: CalendarClock,
                        label: '試堂時間',
                        value: student.lesson_date && student.actual_timeslot
                          ? `${new Date(student.lesson_date).toLocaleDateString('zh-HK')} ${student.actual_timeslot}`
                          : '—',
                      },
                    ]
                  : [
                      {
                        icon: CalendarClock,
                        label: '年齡',
                        value: ageInMonths ? `${years} 歲${months > 0 ? ` ${months} 個月` : ''}` : '—',
                      },
                      {
                        icon: BookOpen,
                        label: '課程',
                        value: student.course_type || '未分班',
                      },
                      {
                        icon: Star,
                        label: '剩餘堂數',
                        value: `${student.remaining_lessons ?? '—'} 堂`,
                      },
                    ]

                return (
                  <motion.div
                    key={student.id}
                    initial={false}
                    animate={{
                      scale: selectedStudents.includes(student.id) ? 1.03 : 1,
                      boxShadow: selectedStudents.includes(student.id)
                        ? '0 4px 20px rgba(252, 213, 139, 0.4)'
                        : 'none',
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="cursor-pointer relative"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/students/${student.id}`)
                      }}
                    >
                      <img
                        src="/icons/edit-pencil.png"
                        alt="編輯"
                        className="w-7 h-7 cursor-pointer hover:scale-110 transition-transform"
                      />
                    </div>
                    {selectedStudents.includes(student.id) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-2 right-2"
                      >
                        <img src="/icons/leaf-sprout.png" alt="選取" className="w-12 h-12" />
                      </motion.div>
                    )}
                    <StudentCard
                      name={student.full_name || '未命名學生'}
                      selected={selectedStudents.includes(student.id)}
                      avatar={
                        student.gender === 'male'
                          ? '/boy.png'
                          : student.gender === 'female'
                            ? '/girl.png'
                            : '/boy.png'
                      }
                      fields={cardFields}
                      studentType={student.student_type}
                      isTrialStudent={isTrialStudent}
                    />
                  </motion.div>
                )
              })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EADBC8] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFFCEB] border-b border-[#EADBC8]">
                  <th className="w-12 p-3 text-left text-sm font-medium text-[#2B3A3B]">
                    <Checkbox
                      checked={selectedStudents.length === sortedStudents.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(sortedStudents.map(s => s.id))
                        } else {
                          setSelectedStudents([])
                        }
                      }}
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">#</th>
                  {selectedColumns.includes('student_oid') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">學生編號</th>
                  )}
                  {selectedColumns.includes('full_name') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">姓名</th>
                  )}
                  {selectedColumns.includes('student_age') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">年齡</th>
                  )}
                  {selectedColumns.includes('gender') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">性別</th>
                  )}
                  {selectedColumns.includes('student_dob') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">生日</th>
                  )}
                  {selectedColumns.includes('student_type') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">類型</th>
                  )}
                  {selectedColumns.includes('course_type') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">課程</th>
                  )}
                  {selectedColumns.includes('school') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">學校</th>
                  )}
                  {selectedColumns.includes('address') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">地址</th>
                  )}
                  {selectedColumns.includes('student_teacher') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">負責老師</th>
                  )}
                  {selectedColumns.includes('student_preference') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">偏好</th>
                  )}
                  {selectedColumns.includes('regular_weekday') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">上課日</th>
                  )}
                  {selectedColumns.includes('regular_timeslot') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">上課時間</th>
                  )}
                  {selectedColumns.includes('remaining_lessons') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">剩餘堂數</th>
                  )}
                  {selectedColumns.includes('started_date') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">入學日期</th>
                  )}
                  {selectedColumns.includes('duration_months') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">報讀時長</th>
                  )}
                  {selectedColumns.includes('contact_number') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">聯絡電話</th>
                  )}
                  {selectedColumns.includes('parent_email') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">家長 Email</th>
                  )}
                  {selectedColumns.includes('health_notes') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">健康備註</th>
                  )}
                  {selectedColumns.includes('lesson_date') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">試堂日期</th>
                  )}
                  {selectedColumns.includes('actual_timeslot') && (
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">試堂時間</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedStudents
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((student, index) => {
                    const ageInMonths = Number(student.student_age) || 0
                    const years = Math.floor(ageInMonths / 12)
                    const months = ageInMonths % 12
                    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
                    const regularWeekdays = Array.isArray(student.regular_weekday)
                      ? student.regular_weekday.map((d: string | number) => weekdays[Number(d)]).join('、')
                      : typeof student.regular_weekday === 'string'
                        ? weekdays[Number(student.regular_weekday)]
                        : '—'

                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-[#EADBC8] hover:bg-[#FFFCEB] cursor-pointer ${
                          selectedStudents.includes(student.id) ? 'bg-[#FFFCEB]' : ''
                        }`}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents([...selectedStudents, student.id])
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                              }
                            }}
                          />
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">{index + 1}</td>
                        {selectedColumns.includes('student_oid') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.student_oid || '—'}</td>
                        )}
                        {selectedColumns.includes('full_name') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            <div className="flex items-center gap-2">
                              <span>{student.full_name || '未命名學生'}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/students/${student.id}`)
                                }}
                                className="p-1 hover:bg-[#EADBC8] rounded-full transition-colors"
                              >
                                <img
                                  src="/icons/edit-pencil.png"
                                  alt="編輯"
                                  className="w-4 h-4"
                                />
                              </button>
                            </div>
                          </td>
                        )}
                        {selectedColumns.includes('student_age') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {ageInMonths ? `${years} 歲${months > 0 ? ` ${months} 個月` : ''}` : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('gender') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.gender === 'female' ? '女' : student.gender === 'male' ? '男' : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('student_dob') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.student_dob ? new Date(student.student_dob).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('student_type') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.student_type || '—'}</td>
                        )}
                        {selectedColumns.includes('course_type') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.course_type || '未分班'}</td>
                        )}
                        {selectedColumns.includes('school') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.school || '—'}</td>
                        )}
                        {selectedColumns.includes('address') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.address || '—'}</td>
                        )}
                        {selectedColumns.includes('student_teacher') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.student_teacher || '—'}</td>
                        )}
                        {selectedColumns.includes('student_preference') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.student_preference || '—'}</td>
                        )}
                        {selectedColumns.includes('regular_weekday') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{regularWeekdays}</td>
                        )}
                        {selectedColumns.includes('regular_timeslot') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.regular_timeslot ? 
                              `${student.regular_timeslot.split(':')[0]}:${student.regular_timeslot.split(':')[1]}` : 
                              '—'
                            }
                          </td>
                        )}
                        {selectedColumns.includes('remaining_lessons') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.remaining_lessons ?? '—'}</td>
                        )}
                        {selectedColumns.includes('started_date') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.started_date ? new Date(student.started_date).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('duration_months') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.duration_months ? `${student.duration_months} 個月` : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('contact_number') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.contact_number && student.contact_number.length === 8 ? 
                              `${student.contact_number.slice(0, 4)}-${student.contact_number.slice(4, 8)}` : 
                              student.contact_number || '—'
                            }
                          </td>
                        )}
                        {selectedColumns.includes('parent_email') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.parent_email || '—'}</td>
                        )}
                        {selectedColumns.includes('health_notes') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.health_notes || '—'}</td>
                        )}
                        {selectedColumns.includes('lesson_date') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">
                            {student.lesson_date ? new Date(student.lesson_date).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('actual_timeslot') && (
                          <td className="p-3 text-sm text-[#2B3A3B]">{student.actual_timeslot || '—'}</td>
                        )}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function isCustomLessonFilterActive(filter: 'all' | 'gt2' | 'lte2' | 'custom', count: number | ''): boolean {
  return filter === 'custom' && count !== '' && count !== null && count !== undefined;
}
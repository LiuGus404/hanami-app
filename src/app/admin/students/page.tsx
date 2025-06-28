'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { PopupSelect } from '@/components/ui/PopupSelect'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import StudentCard from '@/components/ui/StudentCard'
import { BookOpen, CalendarClock, Star, LayoutGrid, List, ChevronLeft, ChevronRight, Settings2, Trash2, UserX, RotateCcw } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useParams } from 'next/navigation'
import TeacherSchedulePanel from '@/components/admin/TeacherSchedulePanel'

export default function StudentManagementPage() {
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>(() => {
    if (filterParam === 'regular') return ['常規']
    if (filterParam === 'trial') return ['試堂']
    if (filterParam === 'inactive') return ['停用學生']
    return []
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [inactiveStudents, setInactiveStudents] = useState<any[]>([])
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
  const [isLoading, setIsLoading] = useState(false)

  // 排序相關狀態
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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

        // 獲取停用學生數據
        const { data: inactiveStudentData, error: inactiveStudentError } = await supabase
          .from('inactive_student_list')
          .select('*')

        if (studentError) {
          console.error('Error fetching regular students:', studentError)
          return
        }

        if (trialStudentError) {
          console.error('Error fetching trial students:', trialStudentError)
          return
        }

        if (inactiveStudentError) {
          console.error('Error fetching inactive students:', inactiveStudentError)
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

        // 處理停用學生數據
        const inactiveStudents = (inactiveStudentData || []).map((inactive) => {
          return {
            id: inactive.id,
            original_id: inactive.original_id,
            full_name: inactive.full_name,
            student_age: inactive.student_age,
            student_preference: inactive.student_preference,
            course_type: inactive.course_type,
            remaining_lessons: inactive.remaining_lessons,
            regular_weekday: inactive.regular_weekday,
            gender: inactive.gender,
            student_type: inactive.student_type === 'regular' ? '常規' : '試堂',
            lesson_date: inactive.lesson_date,
            actual_timeslot: inactive.actual_timeslot,
            student_oid: inactive.student_oid,
            contact_number: inactive.contact_number,
            regular_timeslot: inactive.regular_timeslot,
            health_notes: inactive.health_notes,
            inactive_date: inactive.inactive_date,
            inactive_reason: inactive.inactive_reason,
            is_inactive: true
          }
        })

        // 合併所有學生數據
        const allStudents = [...regularStudents, ...trialStudents]
        console.log('🧒 全部學生資料：', allStudents)
        console.log('🚫 停用學生資料：', inactiveStudents)
        setStudents(allStudents)
        setInactiveStudents(inactiveStudents)
      } catch (err) {
        console.error('Error:', err)
      }
    }

    checkAndFetch()
  }, [])

  // 刪除學生功能
  const handleDeleteStudents = async () => {
    if (!selectedStudents.length) return
    
    if (!confirm(`確定要刪除選中的 ${selectedStudents.length} 位學生嗎？此操作無法復原。`)) {
      return
    }

    setIsLoading(true)
    try {
      // 獲取選中學生的完整資料
      const selectedStudentData = students.filter(s => selectedStudents.includes(s.id))
      console.log('選中要刪除的學生資料:', selectedStudentData)
      
      // 分離常規學生和試堂學生
      const regularStudents = selectedStudentData.filter(s => s.student_type !== '試堂')
      const trialStudents = selectedStudentData.filter(s => s.student_type === '試堂')
      
      console.log('常規學生:', regularStudents)
      console.log('試堂學生:', trialStudents)

      // 處理常規學生的外鍵依賴
      if (regularStudents.length > 0) {
        const regularIds = regularStudents.map(s => s.id)
        
        // 處理常規學生的外鍵依賴
        console.log('處理常規學生外鍵依賴...')
        
        // 1. 刪除相關的課堂記錄 (hanami_student_lesson)
        const { error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .delete()
          .in('student_id', regularIds)
        
        if (lessonError) {
          console.error('Error deleting lesson records:', lessonError)
          alert(`刪除課堂記錄時發生錯誤: ${lessonError.message}`)
          return
        }

        // 2. 刪除相關的進度記錄 (hanami_student_progress)
        const { error: progressError } = await supabase
          .from('hanami_student_progress')
          .delete()
          .in('student_id', regularIds)
        
        if (progressError) {
          console.error('Error deleting progress records:', progressError)
          alert(`刪除進度記錄時發生錯誤: ${progressError.message}`)
          return
        }

        // 3. 刪除相關的課程包 (Hanami_Student_Package)
        const { error: packageError } = await supabase
          .from('Hanami_Student_Package')
          .delete()
          .in('student_id', regularIds)
        
        if (packageError) {
          console.error('Error deleting package records:', packageError)
          alert(`刪除課程包時發生錯誤: ${packageError.message}`)
          return
        }

        // 4. 刪除試堂隊列記錄 (hanami_trial_queue)
        const { error: queueError } = await supabase
          .from('hanami_trial_queue')
          .delete()
          .in('student_id', regularIds)
        
        if (queueError) {
          console.error('Error deleting trial queue records:', queueError)
          // 不中斷流程，因為這可能不是必需的
        }

        // 5. 最後刪除學生記錄
        const { error: regularError } = await supabase
          .from('Hanami_Students')
          .delete()
          .in('id', regularIds)
        
        if (regularError) {
          console.error('Error deleting regular students:', regularError)
          alert(`刪除常規學生時發生錯誤: ${regularError.message}`)
          return
        }
      }

      // 處理試堂學生
      if (trialStudents.length > 0) {
        const trialIds = trialStudents.map(s => s.id)
        
        // 試堂學生通常沒有複雜的外鍵依賴，直接刪除
        const { error: trialError } = await supabase
          .from('hanami_trial_students')
          .delete()
          .in('id', trialIds)
        
        if (trialError) {
          console.error('Error deleting trial students:', trialError)
          alert(`刪除試堂學生時發生錯誤: ${trialError.message}`)
          return
        }
      }

      // 更新本地狀態
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)))
      setSelectedStudents([])
      alert(`成功刪除 ${selectedStudents.length} 位學生`)
    } catch (error) {
      console.error('Error deleting students:', error)
      alert(`刪除學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 停用學生功能
  const handleInactiveStudents = async () => {
    if (!selectedStudents.length) return
    
    if (!confirm(`確定要停用選中的 ${selectedStudents.length} 位學生嗎？`)) {
      return
    }

    setIsLoading(true)
    try {
      // 獲取選中學生的完整資料
      const selectedStudentData = students.filter(s => selectedStudents.includes(s.id))
      
      // 分離常規學生和試堂學生
      const regularStudents = selectedStudentData.filter(s => s.student_type !== '試堂')
      const trialStudents = selectedStudentData.filter(s => s.student_type === '試堂')

      // 如果有試堂學生，提示用戶試堂學生只能刪除不能停用
      if (trialStudents.length > 0) {
        alert(`試堂學生只能刪除不能停用。請先取消選擇試堂學生，或使用刪除功能。`)
        setIsLoading(false)
        return
      }

      // 將學生資料插入 inactive_student_list 表
      const inactiveStudentsData = regularStudents.map(s => ({
        original_id: s.id,
        student_type: 'regular',
        full_name: s.full_name,
        student_age: s.student_age,
        student_preference: s.student_preference,
        course_type: s.course_type,
        remaining_lessons: s.remaining_lessons,
        regular_weekday: s.regular_weekday,
        gender: s.gender,
        student_oid: s.student_oid,
        contact_number: s.contact_number,
        regular_timeslot: s.regular_timeslot,
        health_notes: s.health_notes,
        inactive_date: new Date().toISOString(),
        inactive_reason: '管理員停用'
      }))

      // 插入 inactive_student_list 表
      const { error: insertError } = await supabase
        .from('inactive_student_list')
        .insert(inactiveStudentsData)

      if (insertError) {
        console.error('Error inserting inactive students:', insertError)
        alert('停用學生時發生錯誤')
        return
      }

      // 刪除原表中的學生資料
      if (regularStudents.length > 0) {
        const regularIds = regularStudents.map(s => s.id)
        
        // 處理常規學生的外鍵依賴
        console.log('處理常規學生外鍵依賴...')
        
        // 1. 刪除相關的課堂記錄 (hanami_student_lesson)
        const { error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .delete()
          .in('student_id', regularIds)
        
        if (lessonError) {
          console.error('Error deleting lesson records:', lessonError)
          alert(`刪除課堂記錄時發生錯誤: ${lessonError.message}`)
          return
        }

        // 2. 刪除相關的進度記錄 (hanami_student_progress)
        const { error: progressError } = await supabase
          .from('hanami_student_progress')
          .delete()
          .in('student_id', regularIds)
        
        if (progressError) {
          console.error('Error deleting progress records:', progressError)
          alert(`刪除進度記錄時發生錯誤: ${progressError.message}`)
          return
        }

        // 3. 刪除相關的課程包 (Hanami_Student_Package)
        const { error: packageError } = await supabase
          .from('Hanami_Student_Package')
          .delete()
          .in('student_id', regularIds)
        
        if (packageError) {
          console.error('Error deleting package records:', packageError)
          alert(`刪除課程包時發生錯誤: ${packageError.message}`)
          return
        }

        // 4. 刪除試堂隊列記錄 (hanami_trial_queue)
        const { error: queueError } = await supabase
          .from('hanami_trial_queue')
          .delete()
          .in('student_id', regularIds)
        
        if (queueError) {
          console.error('Error deleting trial queue records:', queueError)
          // 不中斷流程，因為這可能不是必需的
        }

        // 5. 最後刪除學生記錄
        const { error: regularError } = await supabase
          .from('Hanami_Students')
          .delete()
          .in('id', regularIds)
        
        if (regularError) {
          console.error('Error deleting regular students:', regularError)
          alert(`刪除常規學生時發生錯誤: ${regularError.message}`)
          return
        }
      }

      // 更新本地狀態
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)))
      setSelectedStudents([])
      alert(`成功停用 ${regularStudents.length} 位常規學生`)
      
      // 重新獲取停用學生數據
      const { data: inactiveStudentData } = await supabase
        .from('inactive_student_list')
        .select('*')
      
      if (inactiveStudentData) {
        const updatedInactiveStudents = inactiveStudentData.map((inactive) => ({
          id: inactive.id,
          original_id: inactive.original_id,
          full_name: inactive.full_name,
          student_age: inactive.student_age,
          student_preference: inactive.student_preference,
          course_type: inactive.course_type,
          remaining_lessons: inactive.remaining_lessons,
          regular_weekday: inactive.regular_weekday,
          gender: inactive.gender,
          student_type: inactive.student_type === 'regular' ? '常規' : '試堂',
          lesson_date: inactive.lesson_date,
          actual_timeslot: inactive.actual_timeslot,
          student_oid: inactive.student_oid,
          contact_number: inactive.contact_number,
          regular_timeslot: inactive.regular_timeslot,
          health_notes: inactive.health_notes,
          inactive_date: inactive.inactive_date,
          inactive_reason: inactive.inactive_reason,
          is_inactive: true
        }))
        setInactiveStudents(updatedInactiveStudents)
      }
    } catch (error) {
      console.error('Error inactivating students:', error)
      alert('停用學生時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  // 回復學生功能
  const handleRestoreStudents = async () => {
    if (!selectedStudents.length) return
    
    if (!confirm(`確定要回復選中的 ${selectedStudents.length} 位學生嗎？`)) {
      return
    }

    setIsLoading(true)
    try {
      // 獲取選中停用學生的完整資料
      const selectedInactiveData = inactiveStudents.filter(s => selectedStudents.includes(s.id))
      
      // 分離常規學生和試堂學生
      const regularStudents = selectedInactiveData.filter(s => s.student_type === '常規')
      const trialStudents = selectedInactiveData.filter(s => s.student_type === '試堂')

      // 將學生資料移回原表
      if (regularStudents.length > 0) {
        const regularData = regularStudents.map(s => ({
          id: s.original_id,
          full_name: s.full_name,
          student_age: s.student_age,
          student_preference: s.student_preference,
          course_type: s.course_type,
          remaining_lessons: s.remaining_lessons,
          regular_weekday: s.regular_weekday,
          gender: s.gender,
          student_oid: s.student_oid,
          contact_number: s.contact_number,
          regular_timeslot: s.regular_timeslot,
          health_notes: s.health_notes
        }))

        // 使用 upsert 而不是 insert，這樣如果 ID 已存在會更新而不是報錯
        const { error: regularError } = await supabase
          .from('Hanami_Students')
          .upsert(regularData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
        
        if (regularError) {
          console.error('Error restoring regular students:', regularError)
          alert(`回復常規學生時發生錯誤: ${regularError.message}`)
          return
        }
      }

      if (trialStudents.length > 0) {
        const trialData = trialStudents.map(s => ({
          id: s.original_id,
          full_name: s.full_name,
          student_age: s.student_age,
          student_preference: s.student_preference,
          course_type: s.course_type,
          remaining_lessons: s.remaining_lessons,
          regular_weekday: s.regular_weekday,
          gender: s.gender,
          student_oid: s.student_oid,
          contact_number: s.contact_number,
          regular_timeslot: s.regular_timeslot,
          health_notes: s.health_notes,
          lesson_date: s.lesson_date,
          actual_timeslot: s.actual_timeslot
        }))

        // 使用 upsert 而不是 insert
        const { error: trialError } = await supabase
          .from('hanami_trial_students')
          .upsert(trialData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
        
        if (trialError) {
          console.error('Error restoring trial students:', trialError)
          alert(`回復試堂學生時發生錯誤: ${trialError.message}`)
          return
        }
      }

      // 從 inactive_student_list 表中刪除
      // 使用停用學生列表中的 ID（不是原始學生表的 ID）
      const inactiveIdsToDelete = selectedInactiveData.map(s => s.id)
      const { error: deleteError } = await supabase
        .from('inactive_student_list')
        .delete()
        .in('id', inactiveIdsToDelete)

      if (deleteError) {
        console.error('Error deleting from inactive list:', deleteError)
        alert(`從停用列表刪除時發生錯誤: ${deleteError.message}`)
        return
      }

      // 更新本地狀態
      setInactiveStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)))
      setSelectedStudents([])
      alert(`成功回復 ${selectedStudents.length} 位學生`)
      
      // 重新獲取學生數據
      const { data: studentData } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_age, student_preference, course_type, remaining_lessons, regular_weekday, gender, student_type, student_oid, contact_number, regular_timeslot, health_notes')

      const { data: trialStudentData } = await supabase
        .from('hanami_trial_students')
        .select('*')

      if (studentData) {
        const regularStudents = studentData || []
        const trialStudents = (trialStudentData || []).map((trial) => {
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

        const allStudents = [...regularStudents, ...trialStudents]
        setStudents(allStudents)
      }
    } catch (error) {
      console.error('Error restoring students:', error)
      alert(`回復學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 刪除停用學生功能
  const handleDeleteInactiveStudents = async () => {
    if (!selectedStudents.length) return
    
    if (!confirm(`確定要永久刪除選中的 ${selectedStudents.length} 位停用學生嗎？此操作無法復原。`)) {
      return
    }

    setIsLoading(true)
    try {
      // 獲取選中停用學生的完整資料
      const selectedInactiveStudentData = inactiveStudents.filter(s => selectedStudents.includes(s.id))
      console.log('選中要刪除的停用學生資料:', selectedInactiveStudentData)
      
      // 分離常規學生和試堂學生
      const regularInactiveStudents = selectedInactiveStudentData.filter(s => s.student_type === '常規')
      const trialInactiveStudents = selectedInactiveStudentData.filter(s => s.student_type === '試堂')
      
      console.log('停用常規學生:', regularInactiveStudents)
      console.log('停用試堂學生:', trialInactiveStudents)

      // 處理停用常規學生的外鍵依賴（如果原始學生記錄還存在）
      if (regularInactiveStudents.length > 0) {
        const originalIds = regularInactiveStudents.map(s => s.original_id).filter(id => id)
        console.log('要檢查的原始學生ID:', originalIds)
        
        if (originalIds.length > 0) {
          // 檢查原始學生記錄是否還存在，如果存在則處理外鍵依賴
          const { data: existingStudents } = await supabase
            .from('Hanami_Students')
            .select('id')
            .in('id', originalIds)
          
          if (existingStudents && existingStudents.length > 0) {
            const existingIds = existingStudents.map(s => s.id)
            console.log('存在的原始學生ID:', existingIds)
            
            // 1. 刪除相關的課堂記錄
            const { error: lessonError } = await supabase
              .from('hanami_student_lesson')
              .delete()
              .in('student_id', existingIds)
            
            if (lessonError) {
              console.error('Error deleting lesson records:', lessonError)
              alert(`刪除課堂記錄時發生錯誤: ${lessonError.message}`)
              return
            }

            // 2. 刪除相關的進度記錄
            const { error: progressError } = await supabase
              .from('hanami_student_progress')
              .delete()
              .in('student_id', existingIds)
            
            if (progressError) {
              console.error('Error deleting progress records:', progressError)
              alert(`刪除進度記錄時發生錯誤: ${progressError.message}`)
              return
            }

            // 3. 刪除相關的課程包
            const { error: packageError } = await supabase
              .from('Hanami_Student_Package')
              .delete()
              .in('student_id', existingIds)
            
            if (packageError) {
              console.error('Error deleting package records:', packageError)
              alert(`刪除課程包時發生錯誤: ${packageError.message}`)
              return
            }

            // 4. 刪除試堂隊列記錄
            const { error: queueError } = await supabase
              .from('hanami_trial_queue')
              .delete()
              .in('student_id', existingIds)
            
            if (queueError) {
              console.error('Error deleting trial queue records:', queueError)
              // 不中斷流程
            }

            // 5. 刪除原始學生記錄
            const { error: regularError } = await supabase
              .from('Hanami_Students')
              .delete()
              .in('id', existingIds)
            
            if (regularError) {
              console.error('Error deleting original students:', regularError)
              alert(`刪除原始學生記錄時發生錯誤: ${regularError.message}`)
              return
            }
          }
        }
      }

      // 處理停用試堂學生（如果原始試堂記錄還存在）
      if (trialInactiveStudents.length > 0) {
        const originalIds = trialInactiveStudents.map(s => s.original_id).filter(id => id)
        console.log('要檢查的原始試堂學生ID:', originalIds)
        
        if (originalIds.length > 0) {
          // 檢查原始試堂記錄是否還存在
          const { data: existingTrialStudents } = await supabase
            .from('hanami_trial_students')
            .select('id')
            .in('id', originalIds)
          
          if (existingTrialStudents && existingTrialStudents.length > 0) {
            const existingIds = existingTrialStudents.map(s => s.id)
            console.log('存在的原始試堂學生ID:', existingIds)
            
            // 刪除原始試堂記錄
            const { error: trialError } = await supabase
              .from('hanami_trial_students')
              .delete()
              .in('id', existingIds)
            
            if (trialError) {
              console.error('Error deleting original trial students:', trialError)
              alert(`刪除原始試堂記錄時發生錯誤: ${trialError.message}`)
              return
            }
          }
        }
      }

      // 最後刪除停用學生記錄
      const inactiveIds = selectedInactiveStudentData.map(s => s.id)
      console.log('要刪除的停用學生記錄ID:', inactiveIds)
      
      const { error: inactiveError } = await supabase
        .from('inactive_student_list')
        .delete()
        .in('id', inactiveIds)
      
      if (inactiveError) {
        console.error('Error deleting inactive students:', inactiveError)
        alert(`刪除停用學生記錄時發生錯誤: ${inactiveError.message}`)
        return
      }

      // 更新本地狀態
      setInactiveStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)))
      setSelectedStudents([])
      alert(`成功永久刪除 ${selectedStudents.length} 位停用學生`)
    } catch (error) {
      console.error('Error deleting inactive students:', error)
      alert(`刪除停用學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 根據篩選條件決定顯示哪些學生
  const isShowingInactiveStudents = selectedCourses && selectedCourses.length > 0 && selectedCourses.includes('停用學生')
  const currentStudents = isShowingInactiveStudents ? inactiveStudents : students

  const filteredStudents = currentStudents.filter((student) => {
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
      !selectedCourses || selectedCourses.length === 0 ||
      selectedCourses.some((selected) => {
        if (['鋼琴', '音樂專注力', '未分班'].includes(selected)) {
          return type === selected || (!type && selected === '未分班')
        } else if (selected === '常規') {
          return student.student_type !== '試堂'
        } else if (selected === '試堂') {
          return student.student_type === '試堂'
        } else if (selected === '停用學生') {
          // 當顯示停用學生時，所有學生都應該顯示（因為 currentStudents 已經是 inactiveStudents）
          return isShowingInactiveStudents || student.is_inactive === true
        }
        return false
      })

    const weekdayMatch =
      !selectedWeekdays || selectedWeekdays.length === 0 ||
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

  // 排序學生數據
  const sortStudents = (students: any[]) => {
    if (!sortField) {
      // 如果沒有指定排序欄位，保持原有的試堂學生排序邏輯
      return [...students].sort((a, b) => {
        // 檢查是否選中了試堂課程
        if (selectedCourses && selectedCourses.length > 0 && selectedCourses.includes('試堂')) {
          const dateA = a.lesson_date ? new Date(a.lesson_date).getTime() : 0
          const dateB = b.lesson_date ? new Date(b.lesson_date).getTime() : 0
          return dateB - dateA // 從新到舊排序
        }
        return 0
      })
    }

    return [...students].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // 處理特殊欄位的排序
      switch (sortField) {
        case 'student_age':
          // 年齡按數字排序
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
          break
        case 'remaining_lessons':
          // 剩餘堂數按數字排序
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
          break
        case 'regular_weekday':
          // 上課日按數字排序
          aValue = Array.isArray(aValue) ? Math.min(...aValue.map(Number)) : Number(aValue) || 0
          bValue = Array.isArray(bValue) ? Math.min(...bValue.map(Number)) : Number(bValue) || 0
          break
        case 'student_dob':
        case 'started_date':
        case 'lesson_date':
        case 'inactive_date':
          // 日期按日期排序
          aValue = aValue ? new Date(aValue).getTime() : 0
          bValue = bValue ? new Date(bValue).getTime() : 0
          break
        case 'regular_timeslot':
        case 'actual_timeslot':
          // 時間按時間排序
          aValue = aValue ? aValue.replace(':', '') : ''
          bValue = bValue ? bValue.replace(':', '') : ''
          break
        default:
          // 其他欄位按字符串排序
          aValue = String(aValue || '').toLowerCase()
          bValue = String(bValue || '').toLowerCase()
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // 對試堂學生進行排序
  const sortedStudents = sortStudents([...filteredStudents])

  // 排序功能
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 如果點擊的是同一個欄位，切換排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 如果點擊的是新欄位，設置為升序
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 獲取排序圖標
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col items-center space-y-0.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3L3 10h14L10 3z" />
          </svg>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 17L3 10h14L10 17z" />
          </svg>
        </div>
      )
    }
    return sortDirection === 'asc' ? 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3L3 10h14L10 3z" />
      </svg> : 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 17L3 10h14L10 17z" />
      </svg>
  }

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">學生資料管理</h1>

        {/* 操作按鈕區域 */}
        {selectedStudents.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#2B3A3B]">
                  已選中 {selectedStudents.length} 位學生
                </span>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="text-xs text-[#A68A64] hover:text-[#8B7355] underline"
                >
                  取消選擇
                </button>
              </div>
              <div className="flex gap-2">
                {isShowingInactiveStudents ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleRestoreStudents}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full border border-green-200 hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>回復學生</span>
                    </button>
                    <button
                      onClick={handleDeleteInactiveStudents}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>刪除學生</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 檢查選中的學生中是否包含試堂學生 */}
                    {(() => {
                      const selectedStudentData = students.filter(s => selectedStudents.includes(s.id))
                      const hasTrialStudents = selectedStudentData.some(s => s.student_type === '試堂')
                      const hasRegularStudents = selectedStudentData.some(s => s.student_type !== '試堂')
                      
                      return (
                        <>
                          {/* 只有當選中的學生包含常規學生時才顯示停用按鈕 */}
                          {hasRegularStudents && (
                            <button
                              onClick={handleInactiveStudents}
                              disabled={isLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-[#FDE6B8] text-[#A64B2A] rounded-full border border-[#EAC29D] hover:bg-[#fce2c8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserX className="w-4 h-4" />
                              <span>停用學生</span>
                            </button>
                          )}
                          <button
                            onClick={handleDeleteStudents}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>刪除學生</span>
                          </button>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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
                    { label: '停用學生', value: '停用學生' },
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
                const isInactiveStudent = student.is_inactive === true
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

                // 如果是停用學生，添加停用日期信息
                if (isInactiveStudent && student.inactive_date) {
                  cardFields.push({
                    icon: CalendarClock,
                    label: '停用日期',
                    value: new Date(student.inactive_date).toLocaleDateString('zh-HK'),
                  })
                }

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
                    {!isInactiveStudent && (
                      <div
                        className="absolute top-2 left-2 z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          // 對於停用學生，使用 inactive_student_list 的 ID
                          const studentId = isInactiveStudent ? student.id : student.id
                          router.push(`/admin/students/${studentId}`)
                        }}
                      >
                        <img
                          src="/icons/edit-pencil.png"
                          alt="編輯"
                          className="w-7 h-7 cursor-pointer hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    {selectedStudents.includes(student.id) && !isInactiveStudent && (
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
                      isInactive={isInactiveStudent}
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
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_oid')}
                    >
                      <div className="flex items-center gap-1">
                        學生編號
                        {getSortIcon('student_oid')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('full_name') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center gap-1">
                        姓名
                        {getSortIcon('full_name')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_age') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_age')}
                    >
                      <div className="flex items-center gap-1">
                        年齡
                        {getSortIcon('student_age')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('gender') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('gender')}
                    >
                      <div className="flex items-center gap-1">
                        性別
                        {getSortIcon('gender')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_dob') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_dob')}
                    >
                      <div className="flex items-center gap-1">
                        生日
                        {getSortIcon('student_dob')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_type') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_type')}
                    >
                      <div className="flex items-center gap-1">
                        類型
                        {getSortIcon('student_type')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('course_type') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('course_type')}
                    >
                      <div className="flex items-center gap-1">
                        課程
                        {getSortIcon('course_type')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('school') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('school')}
                    >
                      <div className="flex items-center gap-1">
                        學校
                        {getSortIcon('school')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('address') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center gap-1">
                        地址
                        {getSortIcon('address')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_teacher') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_teacher')}
                    >
                      <div className="flex items-center gap-1">
                        負責老師
                        {getSortIcon('student_teacher')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_preference') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_preference')}
                    >
                      <div className="flex items-center gap-1">
                        偏好
                        {getSortIcon('student_preference')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('regular_weekday') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('regular_weekday')}
                    >
                      <div className="flex items-center gap-1">
                        上課日
                        {getSortIcon('regular_weekday')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('regular_timeslot') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('regular_timeslot')}
                    >
                      <div className="flex items-center gap-1">
                        上課時間
                        {getSortIcon('regular_timeslot')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('remaining_lessons') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('remaining_lessons')}
                    >
                      <div className="flex items-center gap-1">
                        剩餘堂數
                        {getSortIcon('remaining_lessons')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('started_date') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('started_date')}
                    >
                      <div className="flex items-center gap-1">
                        入學日期
                        {getSortIcon('started_date')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('duration_months') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('duration_months')}
                    >
                      <div className="flex items-center gap-1">
                        報讀時長
                        {getSortIcon('duration_months')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('contact_number') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('contact_number')}
                    >
                      <div className="flex items-center gap-1">
                        聯絡電話
                        {getSortIcon('contact_number')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('parent_email') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('parent_email')}
                    >
                      <div className="flex items-center gap-1">
                        家長 Email
                        {getSortIcon('parent_email')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('health_notes') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('health_notes')}
                    >
                      <div className="flex items-center gap-1">
                        健康備註
                        {getSortIcon('health_notes')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('lesson_date') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('lesson_date')}
                    >
                      <div className="flex items-center gap-1">
                        試堂日期
                        {getSortIcon('lesson_date')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('actual_timeslot') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('actual_timeslot')}
                    >
                      <div className="flex items-center gap-1">
                        試堂時間
                        {getSortIcon('actual_timeslot')}
                      </div>
                    </th>
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
                                  // 對於停用學生，使用 inactive_student_list 的 ID
                                  const studentId = student.is_inactive ? student.id : student.id
                                  router.push(`/admin/students/${studentId}`)
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
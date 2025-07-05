// app/admin/students/[id]/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentBasicInfo from '@/components/ui/StudentBasicInfo'
import StudentLessonPanel from '@/components/ui/StudentLessonPanel'
import { useUser } from '@/lib/useUser'
import { PopupSelect } from '@/components/ui/PopupSelect'
import LessonEditorModal from '@/components/ui/LessonEditorModal'
import { Lesson } from '@/types'
import BackButton from '@/components/ui/BackButton'

export default function StudentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, role, loading } = useUser()
  const [student, setStudent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)
  const [statusPopupOpen, setStatusPopupOpen] = useState<string | null>(null)
  const [showCategoryPopup, setShowCategoryPopup] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all'])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [tempCategoryFilter, setTempCategoryFilter] = useState<string[]>(['all'])
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  const [isInactiveStudent, setIsInactiveStudent] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  
  // 添加防抖機制
  const dataFetchedRef = useRef(false)
  const currentIdRef = useRef<string | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    // 如果正在載入或沒有用戶，不執行
    if (loading || !user) return
    
    // 如果用戶不是管理員，重定向
    if (role !== 'admin') {
      alert('無權限訪問')
      router.push('/admin/login')
      return
    }

    // 如果 ID 沒有變化且已經載入過，不重複載入
    if (currentIdRef.current === id && dataFetchedRef.current) return
    
    // 防止重複載入
    if (loadingRef.current) return
    loadingRef.current = true
    
    // 更新當前 ID
    currentIdRef.current = id as string
    
    setPageLoading(true);
    setStudent(null);
    setError(null);
    setIsInactiveStudent(false);

    const checkAuth = async () => {
      try {
        // 先檢查是否為停用學生
        const { data: inactiveData, error: inactiveError } = await supabase
          .from('inactive_student_list')
          .select('*')
          .eq('id', id as string)
          .single()

        if (inactiveData) {
          // 將停用學生資料轉換為標準格式
          const convertedStudent = {
            ...inactiveData,
            id: inactiveData.original_id, // 使用原始ID
            original_id: inactiveData.original_id, // 保留original_id欄位
            student_type: inactiveData.student_type === 'regular' ? '常規' : '試堂',
            is_inactive: true,
            inactive_date: inactiveData.inactive_date,
            inactive_reason: inactiveData.inactive_reason
          }
          setStudent(convertedStudent)
          setIsInactiveStudent(true)
          setPageLoading(false)
          dataFetchedRef.current = true
          loadingRef.current = false
          
          // 檢查課堂資料
          await checkLessonData(convertedStudent.id)
          return
        }

        // 檢查是否為試堂學生
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .eq('id', id as string)
          .single()

        if (trialData) {
          setStudent(trialData)
          setPageLoading(false)
          dataFetchedRef.current = true
          loadingRef.current = false
          
          // 檢查課堂資料
          await checkLessonData(trialData.id)
          return
        }

        // 如果不是試堂學生，則從常規學生表中獲取數據
        const { data: studentData, error: studentError } = await supabase
          .from('Hanami_Students')
          .select('*')
          .eq('id', id as string)
          .single()

        if (studentError) {
          console.error('Error fetching student:', studentError)
          setError('無法獲取學生資料')
          setPageLoading(false)
          loadingRef.current = false
          return
        }

        setStudent(studentData)
        setPageLoading(false)
        dataFetchedRef.current = true
        loadingRef.current = false
        
        // 檢查課堂資料
        await checkLessonData(studentData.id)
      } catch (err) {
        console.error('Error:', err)
        setError('發生錯誤，請稍後再試')
        setPageLoading(false)
        loadingRef.current = false
      }
    }

    // 檢查課堂資料的輔助函數
    const checkLessonData = async (studentId: string) => {
      try {
        console.log('🔍 檢查課堂資料表...')
        
        // 檢查表是否存在資料
        const { data: allLessons, error: allError } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .limit(5)
        
        console.log('📊 課堂資料表檢查:', { 
          hasData: allLessons && allLessons.length > 0,
          totalRecords: allLessons?.length || 0,
          sampleData: allLessons?.slice(0, 2).map(l => ({ id: l.id, student_id: l.student_id, lesson_date: l.lesson_date })),
          error: allError?.message || '無錯誤'
        })
        
        // 檢查特定學生的課堂資料
        const { data: studentLessons, error: studentError } = await supabase
          .from('hanami_student_lesson')
          .select('id, lesson_date, course_type, student_id')
          .eq('student_id', studentId)
          .limit(5)
        
        console.log('📋 學生課堂資料檢查:', {
          studentId,
          lessonCount: studentLessons?.length || 0,
          lessons: studentLessons?.map(l => ({ id: l.id, date: l.lesson_date, type: l.course_type, student_id: l.student_id })),
          error: studentError?.message || '無錯誤'
        })
        
        // 檢查是否有其他學生的課堂資料
        if (!studentLessons || studentLessons.length === 0) {
          const { data: otherLessons, error: otherError } = await supabase
            .from('hanami_student_lesson')
            .select('student_id, lesson_date')
            .limit(3)
          
          console.log('🔍 其他學生課堂資料:', {
            otherLessons: otherLessons?.map(l => ({ student_id: l.student_id, date: l.lesson_date })),
            error: otherError?.message || '無錯誤'
          })
        }
        
      } catch (err) {
        console.error('❌ 檢查課堂資料失敗:', err)
      }
    }

    checkAuth()
  }, [user, role, loading, id]) // 移除 router 依賴

  // 當 ID 變化時重置防抖狀態
  useEffect(() => {
    if (currentIdRef.current !== id) {
      dataFetchedRef.current = false
      loadingRef.current = false
    }
  }, [id])

  // 回復學生功能
  const handleRestoreStudent = async () => {
    if (!student || !isInactiveStudent) return
    
    if (!confirm('確定要回復此學生嗎？')) {
      return
    }

    setIsRestoring(true)
    try {
      // 將學生資料移回原表
      const studentData = {
        id: student.original_id,
        full_name: student.full_name,
        student_age: student.student_age,
        student_preference: student.student_preference,
        course_type: student.course_type,
        regular_weekday: student.regular_weekday, // 從inactive_student_list恢復
        gender: student.gender,
        student_oid: student.student_oid,
        contact_number: student.contact_number,
        regular_timeslot: student.regular_timeslot, // 從inactive_student_list恢復
        health_notes: student.health_notes,
        student_dob: student.student_dob,
        parent_email: student.parent_email,
        address: student.address,
        school: student.school,
        started_date: student.started_date,
        duration_months: student.duration_months,
        access_role: student.access_role,
        student_email: student.student_email,
        student_password: student.student_password,
        ongoing_lessons: student.ongoing_lessons,
        upcoming_lessons: student.upcoming_lessons,
        student_teacher: student.student_teacher,
        nick_name: student.nick_name,
        student_remarks: student.student_remarks
      }

      // 使用 upsert 而不是 insert
      const { error: restoreError } = await supabase
        .from('Hanami_Students')
        .upsert(studentData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
      
      if (restoreError) {
        console.error('Error restoring student:', restoreError)
        alert(`回復學生時發生錯誤: ${restoreError.message}`)
        return
      }

      // 從 inactive_student_list 表中刪除
      const { error: deleteError } = await supabase
        .from('inactive_student_list')
        .delete()
        .eq('id', id as string)

      if (deleteError) {
        console.error('Error deleting from inactive list:', deleteError)
        alert(`從停用列表刪除時發生錯誤: ${deleteError.message}`)
        return
      }

      alert('成功回復學生')
      router.push('/admin/students')
    } catch (error) {
      console.error('Error restoring student:', error)
      alert(`回復學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsRestoring(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD58B] mx-auto"></div>
          <p className="mt-4 text-[#2B3A3B]">載入中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#2B3A3B]">找不到學生資料</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        {/* 停用學生警告 */}
        {isInactiveStudent && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    此學生已停用
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>停用日期：{new Date(student.inactive_date).toLocaleDateString('zh-HK')}</p>
                    <p>停用原因：{student.inactive_reason}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRestoreStudent}
                disabled={isRestoring}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? '回復中...' : '回復學生'}
              </button>
            </div>
          </div>
        )}

        <StudentBasicInfo 
          student={student} 
          onUpdate={(newData) => {
            setStudent(newData)
          }}
          isInactive={isInactiveStudent}
        />
        {student && student.student_type !== '試堂' && (
          <div className="mt-8">
            {(() => {
              const lessonStudentId = isInactiveStudent ? student.original_id || student.id : student.id
              console.log('🎯 準備載入課堂資料:', {
                lessonStudentId: lessonStudentId,
                isInactiveStudent,
                studentOriginalId: student.original_id,
                currentStudentId: student.id,
                studentType: student.student_type
              })
              return (
                <StudentLessonPanel 
                  studentId={lessonStudentId} 
                  studentType={student.student_type}
                />
              )
            })()}
          </div>
        )}
        <LessonEditorModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          lesson={editingLesson}
          onSaved={() => {
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          studentId={student.id}
          mode={editingLesson ? 'edit' : 'add'}
        />
      </div>
    </div>
  )
}

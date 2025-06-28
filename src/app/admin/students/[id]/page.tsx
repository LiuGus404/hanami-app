// app/admin/students/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentBasicInfo from '@/components/ui/StudentBasicInfo'
import StudentLessonPanel from '@/components/ui/StudentLessonPanel'
import { useUser } from '@/lib/useUser'
import { PopupSelect } from '@/components/ui/PopupSelect'
import LessonEditorModal from '@/components/ui/LessonEditorModal'
import { Lesson } from '@/types'

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

  useEffect(() => {
    setPageLoading(true);
    setStudent(null);
    setError(null);
    setIsInactiveStudent(false);

    const checkAuth = async () => {
      if (loading) return

      if (!user || role !== 'admin') {
        alert('無權限訪問')
        router.push('/admin/login')
        return
      }

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
            student_type: inactiveData.student_type === 'regular' ? '常規' : '試堂',
            is_inactive: true,
            inactive_date: inactiveData.inactive_date,
            inactive_reason: inactiveData.inactive_reason
          }
          setStudent(convertedStudent)
          setIsInactiveStudent(true)
          setPageLoading(false)
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
          return
        }

        setStudent(studentData)
        setPageLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('發生錯誤，請稍後再試')
        setPageLoading(false)
      }
    }

    checkAuth()
  }, [user, role, loading, id, router])

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
    <div className="min-h-screen bg-[#FFFCF2] p-6">
      <div className="max-w-4xl mx-auto">
        {/* 停用學生警告 */}
        {isInactiveStudent && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
          </div>
        )}

        <StudentBasicInfo 
          student={student} 
          onUpdate={(newData) => {
            setStudent(newData)
          }}
          isInactive={isInactiveStudent}
        />
        {student && student.student_type !== '試堂' && !isInactiveStudent && (
          <div className="mt-8">
            <StudentLessonPanel studentId={student.id} />
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

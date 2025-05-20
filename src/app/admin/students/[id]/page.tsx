// app/admin/students/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentBasicInfo from '@/components/ui/StudentBasicInfo'
import StudentLessonPanel from '@/components/ui/StudentLessonPanel'
import { useUser } from '@/lib/useUser'

export default function StudentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, role, loading } = useUser()
  const [student, setStudent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    setPageLoading(true);
    setStudent(null);
    setError(null);

    const checkAuth = async () => {
      if (loading) return

      if (!user || role !== 'admin') {
        alert('無權限訪問')
        router.push('/admin/login')
        return
      }

      try {
        // 先檢查是否為試堂學生
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
        <StudentBasicInfo 
          student={student} 
          onUpdate={(newData) => {
            setStudent(newData)
          }}
        />
        {student && student.student_type !== '試堂' && (
          <div className="mt-8">
            <StudentLessonPanel studentId={student.id} />
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function LessonAvailabilityPage() {
  const router = useRouter()

  const insertTestData = async () => {
    try {
      // 先檢查是否有現有的教師資料
      const { data: teachers, error: teacherError } = await supabase
        .from('hanami_employee')
        .select('id')
        .limit(1)

      if (teacherError) {
        console.error('查詢教師資料失敗:', teacherError)
        alert('查詢教師資料失敗: ' + teacherError.message)
        return
      }

      if (!teachers || teachers.length === 0) {
        alert('沒有找到教師資料，請先新增教師')
        return
      }

      const teacherId = teachers[0].id

      // 插入測試資料到 teacher_schedule 表
      const testData = [
        { teacher_id: teacherId, scheduled_date: '2024-01-01', start_time: '09:00', end_time: '09:45' },
        { teacher_id: teacherId, scheduled_date: '2024-01-01', start_time: '10:00', end_time: '10:45' },
        { teacher_id: teacherId, scheduled_date: '2024-01-02', start_time: '14:00', end_time: '15:00' },
        { teacher_id: teacherId, scheduled_date: '2024-01-03', start_time: '16:00', end_time: '16:45' },
      ]

      const { data, error } = await supabase
        .from('teacher_schedule')
        .insert(testData)

      if (error) {
        console.error('插入測試資料失敗:', error)
        alert('插入測試資料失敗: ' + error.message)
      } else {
        console.log('插入測試資料成功:', data)
        alert('插入測試資料成功！請重新整理頁面查看結果。')
        window.location.reload()
      }
    } catch (err) {
      console.error('插入測試資料時發生錯誤:', err)
      alert('插入測試資料時發生錯誤')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-end pr-4 gap-3">
          <button
            onClick={() => router.push('/admin/schedule-management')}
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border border-[#EADBC8] px-4 py-2 rounded-full text-sm transition-colors"
          >
            管理課程
          </button>
          <button
            onClick={insertTestData}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-200"
          >
            插入測試資料
          </button>
          <Link 
            href="/admin/trial-queue"
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
          >
            輪候學生列表
          </Link>
          <Link 
            href="/admin/add-trial-students"
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
          >
            新增輪候學生
          </Link>
        </div>
        

        
        <LessonAvailabilityDashboard />
      </div>
    </div>
  )
}

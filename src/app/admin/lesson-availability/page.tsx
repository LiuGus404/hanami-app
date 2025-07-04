'use client'

import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard'
import ClassManagementPanel from '@/components/ui/ClassManagementPanel'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function LessonAvailabilityPage() {
  const [showManagement, setShowManagement] = useState(false)

  const insertTestData = async () => {
    try {
      // 插入測試資料到 hanami_schedule 表
      const testData = [
        { weekday: 1, timeslot: '09:00', max_students: 4, duration: '00:45' }, // 星期一 9:00
        { weekday: 1, timeslot: '10:00', max_students: 4, duration: '00:45' }, // 星期一 10:00
        { weekday: 2, timeslot: '14:00', max_students: 3, duration: '01:00' }, // 星期二 14:00
        { weekday: 3, timeslot: '16:00', max_students: 5, duration: '00:45' }, // 星期三 16:00
        { weekday: 4, timeslot: '15:00', max_students: 4, duration: '01:00' }, // 星期四 15:00
        { weekday: 5, timeslot: '17:00', max_students: 3, duration: '00:45' }, // 星期五 17:00
        { weekday: 6, timeslot: '10:30', max_students: 6, duration: '01:00' }, // 星期六 10:30
        { weekday: 0, timeslot: '11:00', max_students: 4, duration: '00:45' }, // 星期日 11:00
      ]

      const { data, error } = await supabase
        .from('hanami_schedule')
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
            onClick={() => setShowManagement(!showManagement)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              showManagement 
                ? 'bg-[#4B4036] text-white' 
                : 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border border-[#EADBC8]'
            }`}
          >
            {showManagement ? '隱藏管理' : '班別時段管理'}
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
        
        {showManagement && (
          <div className="mb-6">
            <ClassManagementPanel />
          </div>
        )}
        
        <LessonAvailabilityDashboard />
      </div>
    </div>
  )
}

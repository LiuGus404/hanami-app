'use client'

import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard'
import CopyAvailableTimesModal from '@/components/ui/CopyAvailableTimesModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LessonAvailabilityPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-end pr-4 gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
          >
            複製有位時間
          </button>
          <button
            onClick={() => router.push('/admin/schedule-management')}
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
          >
            管理課程
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
        
        <CopyAvailableTimesModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  )
}

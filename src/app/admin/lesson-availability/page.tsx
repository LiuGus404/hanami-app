'use client'

import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard'
import Link from 'next/link'

export default function LessonAvailabilityPage() {
  return (
    <div className="min-h-screen bg-[#FFFCEB] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-end pr-4 gap-3">
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

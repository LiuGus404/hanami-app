'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import CopyAvailableTimesModal from '@/components/ui/CopyAvailableTimesModal';
import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard';

export default function LessonAvailabilityPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-end pr-4 gap-3">
          <button
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
            onClick={() => setIsModalOpen(true)}
          >
            複製有位時間
          </button>
          <button
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
            onClick={() => router.push('/admin/schedule-management')}
          >
            管理課程
          </button>
          <Link 
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
            href="/admin/trial-queue"
          >
            輪候學生列表
          </Link>
          <Link 
            className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
            href="/admin/add-trial-students"
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
  );
}

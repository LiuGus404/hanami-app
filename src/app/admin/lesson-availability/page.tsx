'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import CopyAvailableTimesModal from '@/components/ui/CopyAvailableTimesModal';
import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard';
import MultiCourseAvailabilityDashboard from '@/components/ui/MultiCourseAvailabilityDashboard';

export default function LessonAvailabilityPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'traditional' | 'multi-course'>('multi-course');

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-between items-center pr-4">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                viewMode === 'multi-course'
                  ? 'bg-[#A68A64] text-white'
                  : 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border border-[#EADBC8]'
              }`}
              onClick={() => setViewMode('multi-course')}
            >
              多課程視圖
            </button>
            <button
              className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                viewMode === 'traditional'
                  ? 'bg-[#A68A64] text-white'
                  : 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border border-[#EADBC8]'
              }`}
              onClick={() => setViewMode('traditional')}
            >
              傳統視圖
            </button>
          </div>
          
          <div className="flex gap-3">
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
        </div>
        
        {viewMode === 'multi-course' ? (
          <MultiCourseAvailabilityDashboard />
        ) : (
          <LessonAvailabilityDashboard />
        )}
        
        <CopyAvailableTimesModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import CopyAvailableTimesModal from '@/components/ui/CopyAvailableTimesModal';
import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard';
import MultiCourseAvailabilityDashboard from '@/components/ui/MultiCourseAvailabilityDashboard';
import { getUserSession } from '@/lib/authUtils';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default function LessonAvailabilityPage() {
  const router = useRouter();
  const pathname = usePathname();
  // 從會話中獲取機構信息（admin 頁面可能沒有 OrganizationProvider）
  const session = getUserSession();
  const currentOrganization = session?.organization || null;
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) {
      return null;
    }
    return UUID_REGEX.test(currentOrganization.id) ? currentOrganization.id : null;
  }, [currentOrganization?.id]);
  
  const isAllowedOrg = validOrgId === 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';
  
  // 根據當前路徑決定導航目標
  const scheduleManagementPath = useMemo(() => {
    if (pathname?.includes('/teacher-link/create/')) {
      return '/aihome/teacher-link/create/schedule-management';
    }
    return '/admin/schedule-management';
  }, [pathname]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'traditional' | 'multi-course'>('multi-course');

  const handleTrialQueueClick = (e: React.MouseEvent) => {
    if (!isAllowedOrg) {
      e.preventDefault();
      toast.error('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
    }
  };

  const handleAddTrialClick = (e: React.MouseEvent) => {
    if (!isAllowedOrg) {
      e.preventDefault();
      toast.error('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
    }
  };

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
              onClick={() => router.push(scheduleManagementPath)}
            >
              管理課程
            </button>
            <Link 
              className={`font-semibold py-2 px-4 rounded-full border shadow-sm transition-colors duration-200 ${
                isAllowedOrg
                  ? 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border-[#EADBC8]'
                  : 'bg-gray-400 opacity-60 text-white border-gray-400 cursor-pointer'
              }`}
              href="/admin/trial-queue"
              onClick={handleTrialQueueClick}
            >
              輪候學生列表
            </Link>
            <Link 
              className={`font-semibold py-2 px-4 rounded-full border shadow-sm transition-colors duration-200 ${
                isAllowedOrg
                  ? 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border-[#EADBC8]'
                  : 'bg-gray-400 opacity-60 text-white border-gray-400 cursor-pointer'
              }`}
              href="/admin/add-trial-students"
              onClick={handleAddTrialClick}
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

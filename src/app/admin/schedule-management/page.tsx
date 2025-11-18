'use client';

import { useState } from 'react';

import ScheduleManagementPanel from '@/components/ui/ScheduleManagementPanel';
import MultiCourseScheduleManagementPanel from '@/components/ui/MultiCourseScheduleManagementPanel';
import BackButton from '@/components/ui/BackButton';

export default function ScheduleManagementPage() {
  const [viewMode, setViewMode] = useState<'traditional' | 'multi-course'>('multi-course');

  return (
    <div className="flex h-screen bg-[#FFFDF7]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BackButton href="/aihome/teacher-link/create" label="返回老師主頁" />
                <BackButton href="/admin/teachers" label="返回老師管理頁面" />
                <h1 className="text-2xl font-bold text-[#4B4036]">管理課堂面板</h1>
              </div>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                    viewMode === 'multi-course'
                      ? 'bg-[#A68A64] text-white'
                      : 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border border-[#EADBC8]'
                  }`}
                  onClick={() => setViewMode('multi-course')}
                >
                  多課程管理
                </button>
                <button
                  className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                    viewMode === 'traditional'
                      ? 'bg-[#A68A64] text-white'
                      : 'bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] border border-[#EADBC8]'
                  }`}
                  onClick={() => setViewMode('traditional')}
                >
                  傳統管理
                </button>
              </div>
            </div>
            <p className="text-[#87704e] mt-2">
              {viewMode === 'multi-course' 
                ? '管理課程代碼和多課程時間表設定，支援同一時間段的多個課程'
                : '管理班別類型和課堂時段設定，這些設定會影響課堂情況的顯示'
              }
            </p>
          </div>
          {viewMode === 'multi-course' ? (
            <MultiCourseScheduleManagementPanel />
          ) : (
            <ScheduleManagementPanel />
          )}
        </div>
      </div>
    </div>
  );
} 
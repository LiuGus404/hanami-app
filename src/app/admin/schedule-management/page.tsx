'use client';

import { useState } from 'react';

import ScheduleManagementPanel from '@/components/ui/ScheduleManagementPanel';

export default function ScheduleManagementPage() {
  return (
    <div className="flex h-screen bg-[#FFFDF7]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#4B4036]">管理課堂面板</h1>
            </div>
            <p className="text-[#87704e] mt-2">
              管理班別類型和課堂時段設定，這些設定會影響課堂情況的顯示
            </p>
          </div>
          <ScheduleManagementPanel />
        </div>
      </div>
    </div>
  );
} 
'use client';

import Link from 'next/link';

import ClassManagementPanel from '@/components/ui/ClassManagementPanel';

export default function ClassManagementPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#4B4036]">班別管理</h1>
            <Link 
              className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
              href="/admin/lesson-availability"
            >
              返回課堂空缺
            </Link>
          </div>
          <p className="text-[#87704e] mt-2">
            管理班別類型設定
          </p>
        </div>
        
        <ClassManagementPanel />
      </div>
    </div>
  );
} 
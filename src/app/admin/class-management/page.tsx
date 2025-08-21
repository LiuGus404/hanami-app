'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import ClassManagementPanel from '@/components/ui/ClassManagementPanel';

export default function ClassManagementPage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-quicksand">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#4B4036]">課程管理</h1>
            <Link 
              className="bg-[#FFFDF8] hover:bg-[#F3EFE3] text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] shadow-sm transition-colors duration-200"
              href="/admin/lesson-availability"
            >
              返回課堂空缺
            </Link>
          </div>
          <p className="text-[#87704e] mt-2">
            管理課程和課堂活動
          </p>
        </div>

        {/* 導航標籤 */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-[#EADBC8]">
          <Link
            href="/admin/class-management"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/admin/class-management'
                ? 'bg-hanami-primary text-hanami-text shadow-sm'
                : 'text-hanami-text-secondary hover:text-hanami-text hover:bg-[#FFF9F2]'
            }`}
          >
            📚 班別管理
          </Link>
          <Link
            href="/admin/class-activities"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/admin/class-activities'
                ? 'bg-hanami-primary text-hanami-text shadow-sm'
                : 'text-hanami-text-secondary hover:text-hanami-text hover:bg-[#FFF9F2]'
            }`}
          >
            🎯 課堂活動管理
          </Link>
        </div>
        
        <ClassManagementPanel />
      </div>
    </div>
  );
} 
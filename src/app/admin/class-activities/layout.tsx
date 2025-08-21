'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ClassActivitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-quicksand">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#4B4036]">課程管理</h1>
          </div>
          <p className="text-[#87704e] mt-2">
            管理課程和課堂活動
          </p>
        </div>
        
        {children}
      </div>
    </div>
  );
} 
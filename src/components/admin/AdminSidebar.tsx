'use client';

import { ChevronUp, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

import { clearUserSession } from '@/lib/authUtils';

export default function AdminSidebar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/admin/login') return null;

  const handleGoBack = () => {
    // 檢查是否有上一頁的歷史記錄
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果沒有歷史記錄，回到管理員首頁
      router.push('/admin');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      <button
        className="w-14 h-14 rounded-full bg-[#FFEEDB] shadow-md flex items-center justify-center hover:scale-105 transition-transform"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="text-[#2B3A3B]" size={28} /> : <ChevronUp className="text-[#2B3A3B]" size={28} />}
      </button>

      {open && (
        <>
          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={handleGoBack}
          >
            <span className="mr-2 text-lg">←</span>
            上一頁
          </button>

          {isLoggedIn && (
            <button
              className="flex items-center px-5 py-3 rounded-xl bg-[#FFE0E0] text-[#2B3A3B] text-sm font-semibold shadow"
              onClick={async () => {
                clearUserSession();
                router.push('/admin/login');
              }}
            >
              <span className="mr-2">🚪</span>
              登出
            </button>
          )}
        </>
      )}
    </div>
  );
}

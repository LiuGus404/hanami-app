'use client';

import { ChevronUp, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

import { clearUserSession } from '@/lib/authUtils';

export default function AdminSidebar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/admin/login') return null;
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
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFD59A] text-[#2B3A3B] text-sm font-semibold shadow border-2 border-[#EAC29D]"
            onClick={() => router.push('/admin')}
          >
            <Image alt="管理面板" className="mr-2 w-6 h-6" height={24} src="/owlui.png" width={24} />
            管理面板
          </button>

          {pathname?.startsWith('/admin/students') && (
            <button
              className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
              onClick={() => router.push('/admin/students/new')}
            >
              <Image alt="新增學生" className="mr-2 w-6 h-6" height={24} src="/boy.png" width={24} />
              新增學生
            </button>
          )}

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/permissions')}
          >
            <span className="mr-2 text-lg">👥</span>
            帳戶管理
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/registration-requests')}
          >
            <span className="mr-2 text-lg">📝</span>
            註冊申請
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/ai-select')}
          >
            <Image alt="AI Chatbot" className="mr-2 w-6 h-6" height={24} src="/foxcat.png" width={24} />
            AI Chatbot
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/control')}
          >
            <Image alt="AI 任務列表" className="mr-2 w-6 h-6" height={24} src="/owlui.png" width={24} />
            AI 任務列表
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/class-management')}
          >
            <Image alt="班別管理" className="mr-2 w-6 h-6" height={24} src="/icons/book-elephant.PNG" width={24} />
            班別管理
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/schedule-management')}
          >
            <Image alt="管理課程" className="mr-2 w-6 h-6" height={24} src="/icons/clock.PNG" width={24} />
            管理課程
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/lesson-availability')}
          >
            <Image alt="課堂空缺" className="mr-2 w-6 h-6" height={24} src="/rabbit.png" width={24} />
            課堂空缺
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/student-progress/dashboard')}
          >
            <Image alt="學生進度" className="mr-2 w-6 h-6" height={24} src="/icons/book-elephant.PNG" width={24} />
            學生進度
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/student-progress/growth-trees')}
          >
            <span className="mr-2 text-lg">🌳</span>
            成長樹管理
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/student-progress/abilities')}
          >
            <span className="mr-2 text-lg">📊</span>
            發展能力
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => router.push('/admin/student-progress/activities')}
          >
            <span className="mr-2 text-lg">🎮</span>
            教學活動
          </button>

          <button
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            onClick={() => {
              router.back();
              setTimeout(() => window.location.reload(), 500);
            }}
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

// ⚠️ 請記得在 /app/(admin)/layout.tsx 或根目錄的 layout.tsx 中引入 <AdminSidebar isLoggedIn={true} /> 元件，確保它出現在所有頁面中。
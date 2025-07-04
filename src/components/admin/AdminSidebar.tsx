'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { ChevronUp, X } from 'lucide-react'
import { clearUserSession } from '@/lib/authUtils'

export default function AdminSidebar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/admin/login') return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#FFEEDB] shadow-md flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X size={28} className="text-[#2B3A3B]" /> : <ChevronUp size={28} className="text-[#2B3A3B]" />}
      </button>

      {open && (
        <>
          {pathname?.startsWith('/admin/students') && (
            <button
              onClick={() => router.push('/admin/students/new')}
              className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
            >
              <Image src="/boy.png" alt="新增學生" width={24} height={24} className="mr-2 w-6 h-6" />
              新增學生
            </button>
          )}

          <button
            onClick={() => router.push('/admin')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <Image src="/girl.png" alt="中心總覽" width={24} height={24} className="mr-2 w-6 h-6" />
            中心總覽
          </button>

          <button
            onClick={() => router.push('/admin/permissions')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <span className="mr-2 text-lg">👥</span>
            帳戶管理
          </button>

          <button
            onClick={() => router.push('/admin/registration-requests')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <span className="mr-2 text-lg">📝</span>
            註冊申請
          </button>

          <button
            onClick={() => router.push('/admin/ai-select')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <Image src="/foxcat.png" alt="AI Chatbot" width={24} height={24} className="mr-2 w-6 h-6" />
            AI Chatbot
          </button>

          <button
            onClick={() => router.push('/admin/control')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <Image src="/owlui.png" alt="AI 任務列表" width={24} height={24} className="mr-2 w-6 h-6" />
            AI 任務列表
          </button>

          <button
            onClick={() => router.push('/admin/class-management')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <Image src="/icons/book-elephant.PNG" alt="班別管理" width={24} height={24} className="mr-2 w-6 h-6" />
            班別管理
          </button>

          <button
            onClick={() => router.push('/admin/lesson-availability')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <Image src="/rabbit.png" alt="課堂空缺" width={24} height={24} className="mr-2 w-6 h-6" />
            課堂空缺
          </button>

          <button
            onClick={() => router.push('/admin/student-progress')}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <Image src="/icons/book-elephant.PNG" alt="學生進度" width={24} height={24} className="mr-2 w-6 h-6" />
            學生進度
          </button>

          <button
            onClick={() => {
              router.back()
              setTimeout(() => window.location.reload(), 500)
            }}
            className="flex items-center px-5 py-3 rounded-xl bg-[#FFF3E0] text-[#2B3A3B] text-sm font-semibold shadow"
          >
            <span className="mr-2 text-lg">←</span>
            上一頁
          </button>

          {isLoggedIn && (
            <button
              onClick={async () => {
                clearUserSession()
                router.push('/admin/login')
              }}
              className="flex items-center px-5 py-3 rounded-xl bg-[#FFE0E0] text-[#2B3A3B] text-sm font-semibold shadow"
            >
              <span className="mr-2">🚪</span>
              登出
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ⚠️ 請記得在 /app/(admin)/layout.tsx 或根目錄的 layout.tsx 中引入 <AdminSidebar isLoggedIn={true} /> 元件，確保它出現在所有頁面中。
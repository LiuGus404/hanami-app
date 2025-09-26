'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import AdminSidebar from '@/components/admin/AdminSidebar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Spinner } from '@/components/ui/spinner';
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import '../globals.css';

// 動態設定頁面標題
const setPageTitle = (pathname: string) => {
  const titleMap: Record<string, string> = {
    '/admin': '管理面板 - Hanami 教育管理系統',
    '/admin/students': '學生管理 - Hanami 教育管理系統',
    '/admin/teachers': '老師管理 - Hanami 教育管理系統',
    '/admin/permission-management': '權限管理 - Hanami 教育管理系統',
    '/admin/hanami-tc': '課堂管理 - Hanami 教育管理系統',
    '/admin/ai-select': 'AI 助理 - Hanami 教育管理系統',
    '/admin/lesson-availability': '課堂空缺 - Hanami 教育管理系統',
  };
  
  const title = titleMap[pathname] || '管理面板 - Hanami 教育管理系統';
  if (typeof document !== 'undefined') {
    document.title = title;
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(false);
  const sessionChecked = useRef(false);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    mounted.current = true;

    // 設定頁面標題
    setPageTitle(pathname);

    const checkAuth = async () => {
      // 防止重複檢查
      if (sessionChecked.current) return;
      sessionChecked.current = true;

      try {
        // 檢查用戶會話
        const userSession = getUserSession();
        
        if (!userSession || userSession.role !== 'admin') {
          // 清除無效會話
          if (userSession) {
            clearUserSession();
          }
          
          if (!isLoginPage && mounted.current) {
            router.replace('/admin/login');
          }
        } else if (isLoginPage && mounted.current) {
          // 如果已登入且當前在登入頁面，重定向到管理面板
          router.replace('/admin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        clearUserSession();
        if (!isLoginPage && mounted.current) {
          router.replace('/admin/login');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted.current = false;
    };
  }, []); // 移除 router 和 isLoginPage 依賴

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF9F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-[#2B3A3B]">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果是登入頁面，直接顯示內容
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#FFF9F2]">
        {children}
      </div>
    );
  }

  // 檢查是否有有效的管理員會話
  const userSession = getUserSession();
  if (!userSession || userSession.role !== 'admin') {
    return null;
  }

  // 顯示管理員頁面內容
  return (
    <div className="min-h-screen bg-[#FFF9F2]">
      {/* 麵包屑導航 */}
      <div className="pt-4">
        <Breadcrumb />
      </div>
      
      {/* 主要內容 */}
      <main className="pb-20">
        {children}
      </main>
      
      <AdminSidebar isLoggedIn={true} />
      
      {/* 響應式底部導航 - 只在手機/平板/窄螢幕時顯示 */}
      <MobileBottomNavigation />
    </div>
  );
}
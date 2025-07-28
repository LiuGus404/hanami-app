'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getUserSession, clearUserSession } from '@/lib/authUtils';

export default function PermissionsPage() {
  const router = useRouter();

  useEffect(() => {
    // 檢查用戶會話
    const userSession = getUserSession();
    console.log('Permissions Page - User Session:', userSession);
    
    if (!userSession || userSession.role !== 'admin') {
      console.log('Permissions Page - Invalid session, redirecting to login');
      clearUserSession();
      router.replace('/admin/login');
      return;
    }

    // 重定向到新的權限管理頁面
    console.log('Redirecting to new permission management page');
    router.replace('/admin/permission-management');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A64B2A] mx-auto"></div>
          <p className="mt-4 text-brown-600">正在重定向到新的權限管理頁面...</p>
        </div>
      </div>
    </div>
  );
} 
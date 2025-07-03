'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import PermissionManagementPanel from '@/components/admin/PermissionManagementPanel';

export default function PermissionsPage() {
  const router = useRouter();
  const sessionChecked = useRef(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // 檢查用戶會話
    const userSession = getUserSession();
    console.log('Permissions Page - User Session:', userSession);
    
    if (!userSession || userSession.role !== 'admin') {
      console.log('Permissions Page - Invalid session, redirecting to login');
      clearUserSession();
      router.replace('/admin/login');
      return;
    }
  }, []);

  const handleBackToDashboard = () => {
            router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="bg-[#FDE6B8] text-[#A64B2A] font-semibold px-4 py-2 rounded-full border border-[#EAC29D] shadow hover:bg-[#fce2c8] transition"
              >
                ← 返回儀表板
              </button>
              <h1 className="text-3xl font-bold text-[#2B3A3B]">權限管理系統</h1>
            </div>
          </div>
          <p className="text-[#555] mt-2">管理用戶權限和資料訪問控制</p>
        </div>

        {/* 權限管理面板 */}
        <PermissionManagementPanel />
      </div>
    </div>
  );
} 
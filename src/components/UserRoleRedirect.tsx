'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { getUserSession, getDashboardPath } from '@/lib/authUtils';

export default function UserRoleRedirect() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const sessionChecked = useRef(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    checkUserAndRedirect();
  }, []); // 移除 router 依賴

  const checkUserAndRedirect = async () => {
    try {
      // 使用自定義會話系統
      const userSession = getUserSession();
      
      if (!userSession) {
        // 未登入，留在首頁
        setLoading(false);
        return;
      }

      // 根據角色重定向到對應的儀表板
      const dashboardPath = getDashboardPath(userSession.role);
      
      // 使用 replace 而不是 push 來避免歷史記錄堆疊
      router.replace(dashboardPath);
    } catch (error) {
      console.error('Error checking user role:', error);
      setError('檢查用戶身份時發生錯誤');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">檢查用戶身份中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => router.push('/')}
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// 用戶角色檢查 Hook
export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionChecked = useRef(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const userSession = getUserSession();
      setRole(userSession?.role || null);
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  return { role, loading };
}

// 角色保護組件
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">您沒有權限訪問此頁面</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 
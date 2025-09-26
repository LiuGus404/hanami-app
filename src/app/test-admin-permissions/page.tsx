'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestAdminPermissionsPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    const checkPermissions = () => {
      const result: any = {
        saasSession: null,
        hanamiSession: null,
        hasAdminRole: false,
        timestamp: new Date().toISOString()
      };

      // 檢查 SaaS 系統
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const saasData = JSON.parse(saasSession);
          result.saasSession = {
            exists: true,
            user: saasData.user,
            hasAdminRole: saasData.user && saasData.user.role === 'admin'
          };
        } else {
          result.saasSession = { exists: false };
        }
      } catch (error) {
        result.saasSession = { exists: false, error: error instanceof Error ? error.message : String(error) };
      }

      // 檢查 Hanami 系統
      try {
        const { getUserSession } = require('@/lib/authUtils');
        const userSession = getUserSession();
        result.hanamiSession = {
          exists: !!userSession,
          user: userSession,
          hasAdminRole: userSession && userSession.role === 'admin'
        };
      } catch (error) {
        result.hanamiSession = { exists: false, error: error instanceof Error ? error.message : String(error) };
      }

      // 總體評估
      result.hasAdminRole = 
        (result.saasSession.hasAdminRole) || 
        (result.hanamiSession.hasAdminRole);

      setPermissions(result);
    };

    checkPermissions();
  }, []);

  const clearSessions = () => {
    localStorage.removeItem('saas_user_session');
    localStorage.removeItem('hanami_user_session');
    document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">管理員權限測試</h1>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">權限狀態</h2>
          
          {permissions ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SaaS 系統 */}
                <div className="border border-[#EADBC8] rounded-lg p-4">
                  <h3 className="font-medium text-[#4B4036] mb-2">SaaS 系統</h3>
                  <div className="text-sm space-y-1">
                    <p>會話存在: {permissions.saasSession.exists ? '✅' : '❌'}</p>
                    {permissions.saasSession.exists && (
                      <>
                        <p>用戶: {permissions.saasSession.user?.email || '未知'}</p>
                        <p>角色: {permissions.saasSession.user?.role || '未知'}</p>
                        <p>管理員權限: {permissions.saasSession.hasAdminRole ? '✅' : '❌'}</p>
                      </>
                    )}
                    {permissions.saasSession.error && (
                      <p className="text-red-500">錯誤: {permissions.saasSession.error}</p>
                    )}
                  </div>
                </div>

                {/* Hanami 系統 */}
                <div className="border border-[#EADBC8] rounded-lg p-4">
                  <h3 className="font-medium text-[#4B4036] mb-2">Hanami 系統</h3>
                  <div className="text-sm space-y-1">
                    <p>會話存在: {permissions.hanamiSession.exists ? '✅' : '❌'}</p>
                    {permissions.hanamiSession.exists && (
                      <>
                        <p>用戶: {permissions.hanamiSession.user?.email || '未知'}</p>
                        <p>角色: {permissions.hanamiSession.user?.role || '未知'}</p>
                        <p>管理員權限: {permissions.hanamiSession.hasAdminRole ? '✅' : '❌'}</p>
                      </>
                    )}
                    {permissions.hanamiSession.error && (
                      <p className="text-red-500">錯誤: {permissions.hanamiSession.error}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 總體狀態 */}
              <div className="border-2 border-[#EADBC8] rounded-lg p-4 bg-[#FFF8E7]">
                <h3 className="font-medium text-[#4B4036] mb-2">總體狀態</h3>
                <p className="text-lg font-semibold">
                  管理員權限: {permissions.hasAdminRole ? '✅ 有權限' : '❌ 無權限'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  檢查時間: {permissions.timestamp}
                </p>
              </div>

              {/* 測試按鈕 */}
              <div className="flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                >
                  重新檢查
                </button>
                <button
                  onClick={clearSessions}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  清除所有會話
                </button>
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  嘗試訪問 Admin
                </button>
              </div>
            </div>
          ) : (
            <p>載入中...</p>
          )}
        </div>
      </div>
    </div>
  );
}

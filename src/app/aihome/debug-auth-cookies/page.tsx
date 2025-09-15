'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function DebugAuthCookiesPage() {
  const [cookies, setCookies] = useState<Record<string, string>>({});
  const { user, loading } = useSaasAuth();

  useEffect(() => {
    // 獲取所有 cookies
    const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    setCookies(allCookies);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">認證狀態調試</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cookies 信息 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">Cookies</h2>
            <div className="space-y-2">
              {Object.entries(cookies).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-[#2B3A3B]">{key}:</span>
                  <span className="ml-2 text-gray-600 break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supabase 會話信息 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">Supabase 會話</h2>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-[#2B3A3B]">載入狀態:</span>
                <span className="ml-2 text-gray-600">{loading ? '載入中...' : '已完成'}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-[#2B3A3B]">會話狀態:</span>
                <span className="ml-2 text-gray-600">{user ? '已登入' : '未登入'}</span>
              </div>
              {user && (
                <>
                  <div className="text-sm">
                    <span className="font-medium text-[#2B3A3B]">用戶 ID:</span>
                    <span className="ml-2 text-gray-600">{user.id}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-[#2B3A3B]">郵箱:</span>
                    <span className="ml-2 text-gray-600">{user.email}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-[#2B3A3B]">暱稱:</span>
                    <span className="ml-2 text-gray-600">{user.full_name || '未設置'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 中間件檢查的 Cookie */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">中間件檢查的 Cookie</h2>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">sb-hanamiecho-auth-token:</span>
              <span className="ml-2 text-gray-600">{cookies['sb-hanamiecho-auth-token'] || '未找到'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">sb-hanamiecho-auth-refresh-token:</span>
              <span className="ml-2 text-gray-600">{cookies['sb-hanamiecho-auth-refresh-token'] || '未找到'}</span>
            </div>
          </div>
        </div>

        {/* 測試按鈕 */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試功能</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
            >
              重新載入
            </button>
            <button
              onClick={() => {
                // 清除所有 cookies
                document.cookie.split(";").forEach((c) => {
                  const eqPos = c.indexOf("=");
                  const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              清除 Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

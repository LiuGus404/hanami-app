'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    // 清除所有本地存儲
    localStorage.clear();
    sessionStorage.clear();
    
    // 清除所有相關的 cookie
    document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'hanami_user_session=; path=/aihome; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'saas_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'saas_user_session=; path=/aihome; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    console.log('所有數據已清除，準備跳轉到登入頁面...');
    
    // 延遲跳轉，確保清除完成
    setTimeout(() => {
      window.location.href = '/aihome/auth/login';
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
        <p className="text-[#4B4036]">正在登出...</p>
      </div>
    </div>
  );
}

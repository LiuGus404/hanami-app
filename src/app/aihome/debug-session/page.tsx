'use client';

import { useState, useEffect } from 'react';
import { getUserSession, clearUserSession } from '@/lib/authUtils';

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [localStorageInfo, setLocalStorageInfo] = useState<string>('');
  const [cookieInfo, setCookieInfo] = useState<string>('');

  useEffect(() => {
    // 檢查會話信息
    const session = getUserSession();
    setSessionInfo(session);

    // 檢查 localStorage
    if (typeof window !== 'undefined') {
      const localSession = localStorage.getItem('hanami_user_session');
      setLocalStorageInfo(localSession || 'No localStorage session');

      // 檢查 cookies
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('hanami_user_session='));
      setCookieInfo(sessionCookie || 'No cookie session');
    }
  }, []);

  const handleClearSession = () => {
    clearUserSession();
    setSessionInfo(null);
    setLocalStorageInfo('No localStorage session');
    setCookieInfo('No cookie session');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">會話調試頁面</h1>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">會話狀態</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">LocalStorage</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {localStorageInfo}
          </pre>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">Cookie</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {cookieInfo}
          </pre>
        </div>

        <div className="text-center">
          <button
            onClick={handleClearSession}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            清除會話
          </button>
        </div>
      </div>
    </div>
  );
}

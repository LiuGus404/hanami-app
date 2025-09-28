'use client';

import { useState, useEffect } from 'react';
import { setUserSession, getUserSession, clearUserSession } from '@/lib/authUtils';

export default function TestSessionPage() {
  const [session, setSession] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // 檢查當前會話
    const currentSession = getUserSession();
    setSession(currentSession);
    
    // 檢查 localStorage
    if (typeof window !== 'undefined') {
      const rawData = localStorage.getItem('hanami_user_session');
      setLocalStorageData(rawData || 'No data');
    }
  }, []);

  const handleCreateSession = () => {
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'parent' as const,
      name: '測試用戶',
      relatedIds: []
    };

    console.log('創建會話:', testUser);
    setUserSession(testUser);
    
    // 立即檢查
    const newSession = getUserSession();
    setSession(newSession);
    
    if (typeof window !== 'undefined') {
      const rawData = localStorage.getItem('hanami_user_session');
      setLocalStorageData(rawData || 'No data');
    }
    
    setTestResult('會話創建完成');
  };

  const handleClearSession = () => {
    clearUserSession();
    setSession(null);
    setLocalStorageData('No data');
    setTestResult('會話已清除');
  };

  const handleTestRead = () => {
    const readSession = getUserSession();
    setSession(readSession);
    setTestResult(`讀取結果: ${readSession ? '成功' : '失敗'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">會話測試頁面</h1>
        
        <div className="space-y-6">
          {/* 測試按鈕 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">測試操作</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleCreateSession}
                className="px-6 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
              >
                創建測試會話
              </button>
              <button
                onClick={handleTestRead}
                className="px-6 py-3 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors"
              >
                讀取會話
              </button>
              <button
                onClick={handleClearSession}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                清除會話
              </button>
            </div>
            {testResult && (
              <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-blue-800">{testResult}</p>
              </div>
            )}
          </div>

          {/* 會話狀態 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">會話狀態</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[#4B4036] mb-2">getUserSession() 結果:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium text-[#4B4036] mb-2">localStorage 原始數據:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {localStorageData}
                </pre>
              </div>
            </div>
          </div>

          {/* 測試個人資料頁面 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">測試頁面</h2>
            <p className="text-[#4B4036] mb-4">
              創建會話後，點擊下面的按鈕測試個人資料頁面：
            </p>
            <a
              href="/aihome/profile"
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              測試個人資料頁面
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}




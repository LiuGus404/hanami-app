'use client';

import { useState } from 'react';
import { setUserSession } from '@/lib/authUtils';

export default function CreateTestSessionPage() {
  const [created, setCreated] = useState(false);

  const handleCreateTestSession = () => {
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'parent' as const,
      name: '測試用戶',
      relatedIds: [] // 可選的相關ID列表
    };

    setUserSession(testUser);
    setCreated(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">創建測試會話</h1>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-[#EADBC8] p-6">
          <p className="text-[#4B4036] mb-4">
            點擊按鈕創建一個測試用戶會話，這樣您就可以訪問個人資料和設置頁面了。
          </p>
          
          <button
            onClick={handleCreateTestSession}
            className="px-6 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
          >
            創建測試會話
          </button>
          
          {created && (
            <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-800">測試會話已創建！現在您可以訪問個人資料和設置頁面了。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

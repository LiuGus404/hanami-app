'use client';

import { useState, useEffect } from 'react';
import { createSaasClient } from '@/lib/supabase-saas';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('初始化中...');
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        setStatus('創建 Supabase 客戶端...');
        const supabase = createSaasClient();
        
        setStatus('檢查會話...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(`會話檢查錯誤: ${error.message}`);
          setStatus('錯誤');
          return;
        }
        
        setSession(session);
        setStatus('完成');
        
        if (session) {
          setStatus(`完成 - 已登入 (${session.user.email})`);
        } else {
          setStatus('完成 - 未登入');
        }
        
      } catch (err) {
        setError(`測試失敗: ${err}`);
        setStatus('錯誤');
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">Supabase 客戶端測試</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試狀態</h2>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-[#2B3A3B]">狀態:</span>
              <span className="ml-2 text-gray-600">{status}</span>
            </div>
            {error && (
              <div className="text-sm">
                <span className="font-medium text-red-600">錯誤:</span>
                <span className="ml-2 text-red-600">{error}</span>
              </div>
            )}
            {session && (
              <div className="text-sm">
                <span className="font-medium text-[#2B3A3B]">會話:</span>
                <span className="ml-2 text-gray-600">{session.user.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試按鈕</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
            >
              重新測試
            </button>
            <button
              onClick={() => window.location.href = '/aihome/auth/login'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              前往登入
            </button>
            <button
              onClick={() => window.location.href = '/aihome/simple-dashboard'}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              前往簡單儀表板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

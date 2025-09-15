'use client';

import { useState, useEffect } from 'react';
import { createSaasClient } from '@/lib/supabase-saas';

export default function SimpleAuthTestPage() {
  const [status, setStatus] = useState<string>('初始化中...');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        setStatus('創建 Supabase 客戶端...');
        const supabase = createSaasClient();
        
        setStatus('檢查會話...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`會話檢查錯誤: ${sessionError.message}`);
          setStatus('錯誤');
          return;
        }
        
        if (!session) {
          setStatus('未登入');
          return;
        }
        
        setStatus('已登入，獲取用戶信息...');
        
        // 直接使用會話中的用戶信息，不查詢 saas_users 表
        const simpleUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || '',
          nickname: session.user.user_metadata?.nickname || '',
          phone: session.user.user_metadata?.phone || '',
          avatar_url: session.user.user_metadata?.avatar_url || '',
          role: 'user',
          subscription_status: 'free',
          created_at: session.user.created_at,
          updated_at: session.user.updated_at
        };
        
        setUser(simpleUser);
        setStatus('完成 - 已登入');
        
      } catch (err) {
        setError(`測試失敗: ${err}`);
        setStatus('錯誤');
      }
    };

    testAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">簡單認證測試</h1>
        
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
                  <span className="ml-2 text-gray-600">{user.nickname || '未設置'}</span>
                </div>
              </>
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

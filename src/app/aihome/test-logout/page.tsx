'use client';

import { useState } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function TestLogoutPage() {
  const { user, loading, logout } = useSaasAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testLogout = async () => {
    setTestResult('開始測試登出...');
    console.log('測試登出開始');
    
    try {
      await logout();
      setTestResult('登出成功！');
      console.log('測試登出成功');
    } catch (error) {
      setTestResult(`登出失敗: ${error}`);
      console.error('測試登出失敗:', error);
    }
  };

  const testDirectLogout = async () => {
    setTestResult('開始直接登出測試...');
    console.log('直接登出測試開始');
    
    try {
      // 直接調用 Supabase 登出
      const { createSaasClient } = await import('@/lib/supabase-saas');
      const supabase = createSaasClient();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setTestResult(`直接登出失敗: ${error.message}`);
        console.error('直接登出失敗:', error);
      } else {
        setTestResult('直接登出成功！');
        console.log('直接登出成功');
        
        // 清除本地存儲
        localStorage.removeItem('saas_user_session');
        sessionStorage.clear();
        
        // 跳轉到登入頁
        window.location.href = '/aihome/auth/login';
      }
    } catch (error) {
      setTestResult(`直接登出錯誤: ${error}`);
      console.error('直接登出錯誤:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-2xl mx-auto">
        <HanamiCard className="p-6">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">登出功能測試</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-[#2B3A3B] mb-2">當前用戶狀態:</p>
              <p className="text-sm text-[#4B4036] bg-[#FFD59A]/20 p-2 rounded">
                {user ? `已登入: ${user.email}` : '未登入'}
              </p>
            </div>
            
            <div>
              <p className="text-[#2B3A3B] mb-2">測試結果:</p>
              <p className="text-sm text-[#4B4036] bg-[#EBC9A4]/20 p-2 rounded min-h-[50px]">
                {testResult || '尚未測試'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <HanamiButton
                onClick={testLogout}
                disabled={!user}
                className="flex-1"
              >
                測試 Hook 登出
              </HanamiButton>
              
              <HanamiButton
                onClick={testDirectLogout}
                disabled={!user}
                variant="secondary"
                className="flex-1"
              >
                測試直接登出
              </HanamiButton>
            </div>
            
            <div className="pt-4 border-t border-[#EADBC8]">
              <p className="text-sm text-[#2B3A3B]">
                請打開瀏覽器開發者工具的控制台查看詳細日誌
              </p>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
}


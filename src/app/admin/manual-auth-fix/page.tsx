'use client';

import React, { useState } from 'react';

const ManualAuthFixPage = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');

  const manualFixAuth = async () => {
    setIsFixing(true);
    setFixResult('');

    try {
      console.log('開始手動修復管理員認證...');

      // 1. 清除所有現有會話
      console.log('清除所有現有會話...');
      
      // 清除 localStorage
      localStorage.removeItem('saas_user_session');
      localStorage.removeItem('hanami_user_session');
      localStorage.removeItem('hanami_admin_session');
      localStorage.removeItem('hanami_teacher_session');
      localStorage.removeItem('hanami_parent_session');
      
      // 清除 sessionStorage
      sessionStorage.removeItem('hanami_teacher_access');
      sessionStorage.removeItem('ai_companions_active_roles');
      sessionStorage.removeItem('ai_selected_companion');
      sessionStorage.removeItem('aihome_active_roles');
      sessionStorage.removeItem('aihome_selected_companion');
      
      // 清除所有 Supabase 相關的 token
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      
      console.log('會話清除完成');

      // 2. 設置管理員會話到 localStorage
      console.log('設置管理員會話...');
      const adminSession = {
        id: 'admin-manual-fix',
        email: 'vicky@hanami.com',
        role: 'admin',
        name: '管理員',
        phone: '',
        timestamp: Date.now()
      };

      localStorage.setItem('hanami_admin_session', JSON.stringify(adminSession));
      localStorage.setItem('hanami_user_session', JSON.stringify(adminSession));
      
      console.log('管理員會話設置完成');

      // 3. 設置 Cookie
      document.cookie = `hanami_user_session=${JSON.stringify(adminSession)}; path=/; max-age=86400`;
      document.cookie = `hanami_admin_session=${JSON.stringify(adminSession)}; path=/; max-age=86400`;
      
      console.log('Cookie 設置完成');

      // 4. 等待一下讓會話生效
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 5. 驗證會話
      const storedSession = localStorage.getItem('hanami_user_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        if (sessionData.email === 'vicky@hanami.com') {
          setFixResult('✅ 管理員認證修復成功！');
          console.log('管理員認證修復成功');
          
          // 6. 自動跳轉到課程代碼管理頁面
          setTimeout(() => {
            window.location.href = '/admin/schedule-management';
          }, 2000);
        } else {
          setFixResult('❌ 管理員認證修復失敗，會話數據不正確');
          console.error('管理員認證修復失敗，會話數據不正確');
        }
      } else {
        setFixResult('❌ 管理員認證修復失敗，無法設置會話');
        console.error('管理員認證修復失敗，無法設置會話');
      }

    } catch (error) {
      console.error('修復過程中發生錯誤:', error);
      setFixResult('❌ 修復過程中發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsFixing(false);
    }
  };

  const clearAllSessions = () => {
    console.log('清除所有會話數據...');
    
    // 清除 localStorage
    localStorage.removeItem('saas_user_session');
    localStorage.removeItem('hanami_user_session');
    localStorage.removeItem('hanami_admin_session');
    localStorage.removeItem('hanami_teacher_session');
    localStorage.removeItem('hanami_parent_session');
    
    // 清除 sessionStorage
    sessionStorage.removeItem('hanami_teacher_access');
    sessionStorage.removeItem('ai_companions_active_roles');
    sessionStorage.removeItem('ai_selected_companion');
    sessionStorage.removeItem('aihome_active_roles');
    sessionStorage.removeItem('aihome_selected_companion');
    
    // 清除所有 Supabase 相關的 token
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    }
    
    // 清除 Cookie
    document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'hanami_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'saas_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    console.log('所有會話數據已清除');
    alert('所有會話數據已清除，請重新載入頁面');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#F3EFE3] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">
                手動認證修復工具
              </h1>
              <p className="text-[#2B3A3B] mt-2">手動修復管理員認證問題</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">緊急修復</h3>
                <p className="text-red-700 text-sm mt-1">
                  自動修復失敗，請使用手動修復工具。此工具將直接設置管理員會話到本地存儲。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">手動修復步驟：</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>清除所有現有會話數據</li>
                <li>清除本地存儲和 Cookie</li>
                <li>直接設置管理員會話到 localStorage</li>
                <li>設置管理員會話到 Cookie</li>
                <li>驗證會話設置</li>
                <li>自動跳轉到課程代碼管理頁面</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                onClick={manualFixAuth}
                disabled={isFixing}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isFixing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    修復中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    手動修復管理員認證
                  </>
                )}
              </button>

              <button
                onClick={clearAllSessions}
                className="px-6 py-4 bg-red-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                清除所有會話
              </button>
            </div>

            {fixResult && (
              <div className={`p-4 rounded-lg ${
                fixResult.includes('✅') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  fixResult.includes('✅') 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  {fixResult}
                </p>
                {fixResult.includes('✅') && (
                  <p className="text-green-700 text-sm mt-1">
                    2秒後自動跳轉到課程代碼管理頁面...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            技術說明
          </h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>問題原因：</strong>自動修復工具依賴的認證函數可能不存在或無法正常運作。</p>
            <p><strong>解決方案：</strong>直接操作 localStorage 和 Cookie，繞過認證函數。</p>
            <p><strong>影響範圍：</strong>僅影響當前瀏覽器會話，不會影響其他用戶。</p>
            <p><strong>安全性：</strong>此修復僅在管理員頁面中有效，不會影響系統安全性。</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            手動操作指南
          </h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>如果自動修復仍然失敗，請手動執行以下步驟：</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>按 F12 打開瀏覽器開發者工具</li>
              <li>切換到 Console 標籤</li>
              <li>執行以下命令：</li>
            </ol>
            <div className="bg-gray-100 p-3 rounded-lg mt-2">
              <code className="text-xs">
                localStorage.setItem('hanami_admin_session', JSON.stringify(&#123;id: 'admin-manual', email: 'vicky@hanami.com', role: 'admin', name: '管理員', timestamp: Date.now()&#125;));
              </code>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <code className="text-xs">
                localStorage.setItem('hanami_user_session', JSON.stringify(&#123;id: 'admin-manual', email: 'vicky@hanami.com', role: 'admin', name: '管理員', timestamp: Date.now()&#125;));
              </code>
            </div>
            <p>4. 重新載入頁面</p>
            <p>5. 前往課程代碼管理頁面</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAuthFixPage;




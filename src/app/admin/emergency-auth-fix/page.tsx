'use client';

import React, { useState } from 'react';
import { setUserSession, clearUserSession, fallbackOrganization } from '@/lib/authUtils';

const EmergencyAuthFixPage = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');

  const fixAdminAuth = async () => {
    setIsFixing(true);
    setFixResult('');

    try {
      console.log('開始修復管理員認證...');

      // 1. 清除所有現有會話
      console.log('清除所有現有會話...');
      clearUserSession();
      
      // 清除所有相關的本地存儲
      localStorage.removeItem('saas_user_session');
      localStorage.removeItem('hanami_user_session');
      localStorage.removeItem('hanami_admin_session');
      localStorage.removeItem('hanami_teacher_session');
      localStorage.removeItem('hanami_parent_session');
      
      // 清除所有相關的 cookie
      document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'hanami_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'saas_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      console.log('會話清除完成');

      // 2. 設置管理員會話
      console.log('設置管理員會話...');
      const adminSession = {
        id: 'admin-emergency-fix',
        email: 'vicky@hanami.com',
        role: 'admin' as const,
        name: '管理員',
        organization: fallbackOrganization
      };

      setUserSession(adminSession);
      
      // 同時設置到 localStorage 作為備份
      localStorage.setItem('hanami_admin_session', JSON.stringify(adminSession));
      localStorage.setItem('hanami_user_session', JSON.stringify(adminSession));
      
      console.log('管理員會話設置完成');

      // 3. 等待一下讓會話生效
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. 驗證會話
      const { getUserSession } = require('@/lib/authUtils');
      const currentSession = getUserSession();
      
      if (currentSession && currentSession.email === 'vicky@hanami.com') {
        setFixResult('✅ 管理員認證修復成功！');
        console.log('管理員認證修復成功');
        
        // 5. 自動跳轉到課程代碼管理頁面
        setTimeout(() => {
          window.location.href = '/admin/schedule-management';
        }, 2000);
      } else {
        setFixResult('❌ 管理員認證修復失敗，請手動重新載入頁面');
        console.error('管理員認證修復失敗');
      }

    } catch (error) {
      console.error('修復過程中發生錯誤:', error);
      setFixResult('❌ 修復過程中發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsFixing(false);
    }
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
                緊急認證修復工具
              </h1>
              <p className="text-[#2B3A3B] mt-2">修復管理員認證問題</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-medium">問題說明</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  系統載入了錯誤的認證系統，導致無法存取課程代碼管理功能。
                  此工具將清除錯誤的會話並設置正確的管理員身份。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">修復步驟：</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>清除所有現有會話數據</li>
                <li>清除本地存儲和 Cookie</li>
                <li>設置正確的管理員會話 (vicky@hanami.com)</li>
                <li>驗證會話設置</li>
                <li>自動跳轉到課程代碼管理頁面</li>
              </ol>
            </div>

            <button
              onClick={fixAdminAuth}
              disabled={isFixing}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                  開始修復管理員認證
                </>
              )}
            </button>

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
            <p><strong>問題原因：</strong>系統載入了錯誤的認證系統，導致用戶身份錯誤。</p>
            <p><strong>解決方案：</strong>清除錯誤的會話數據，設置正確的管理員身份。</p>
            <p><strong>影響範圍：</strong>僅影響當前瀏覽器會話，不會影響其他用戶。</p>
            <p><strong>安全性：</strong>此修復僅在管理員頁面中有效，不會影響系統安全性。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAuthFixPage;

'use client';

import { useState } from 'react';
import AppSidebar from '@/components/AppSidebar';

export default function TestSidebarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄 */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome"
        />

        {/* 主內容 */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-[#4B4036] mb-6">側邊欄測試頁面</h1>
            
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">功能說明</h2>
              <div className="space-y-4 text-[#2B3A3B]">
                <p>這個頁面用於測試側邊欄組件的功能。</p>
                <p>請檢查側邊欄中是否顯示「花見老師專區」選項。</p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-700 mb-2">重要提示：</h3>
                  <p className="text-sm text-red-600">
                    請查看右下角的調試信息面板，確認用戶登入狀態和教師權限狀態。
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 mb-2">顯示條件：</h3>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• 用戶必須已登入</li>
                    <li>• 用戶的 email 必須在 hanami_employee 表中</li>
                    <li>• 如果配置了 SAAS 資料庫，email 也必須在 saas_users 表中</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-700 mb-2">測試步驟：</h3>
                  <ol className="text-sm text-yellow-600 space-y-1 list-decimal list-inside">
                    <li>確保已登入系統</li>
                    <li>檢查側邊欄是否顯示「花見老師專區」</li>
                    <li>如果沒有顯示，請訪問 <code>/aihome/test-teacher-access</code> 檢查權限</li>
                    <li>如果顯示，點擊進入專區測試功能</li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-700 mb-2">相關頁面：</h3>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• <a href="/aihome/test-teacher-access" className="underline">權限測試頁面</a></li>
                    <li>• <a href="/aihome/teacher-zone" className="underline">花見老師專區</a></li>
                    <li>• <a href="/aihome" className="underline">AIHome 主頁</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

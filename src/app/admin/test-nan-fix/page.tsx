'use client';

import { useState } from 'react';
import MultiCourseScheduleManagementPanel from '@/components/ui/MultiCourseScheduleManagementPanel';

export default function TestNaNFixPage() {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            NaN 錯誤修復測試
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">數字輸入修復</div>
                <div className="w-8 h-8 bg-[#87CEEB] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">🔧 修復</div>
              <div className="text-sm text-[#87704e] mt-1">處理 null/undefined 值</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">介面定義更新</div>
                <div className="w-8 h-8 bg-[#FFB6C1] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">📝 更新</div>
              <div className="text-sm text-[#87704e] mt-1">max_students 允許 null</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">資料處理優化</div>
                <div className="w-8 h-8 bg-[#EBC9A4] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">⚡ 優化</div>
              <div className="text-sm text-[#87704e] mt-1">預設值處理</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
              onClick={() => setShowPanel(!showPanel)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {showPanel ? '隱藏' : '顯示'} 管理面板
            </button>
          </div>
        </div>

        {showPanel && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#4B4036] mb-4">NaN 錯誤修復測試</h2>
            <MultiCourseScheduleManagementPanel />
          </div>
        )}

        <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">修復詳情</h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#F3EFE3] to-[#E8DCC6] p-4 rounded-lg border border-[#EADBC8]">
              <h4 className="font-semibold text-[#4B4036] mb-2">🔧 數字輸入框修復</h4>
              <ul className="text-sm text-[#87704e] space-y-1">
                <li>• <code className="bg-white px-2 py-1 rounded">value=&#123;editingCourseCode.max_students || ''&#125;</code> 處理 null 值</li>
                <li>• <code className="bg-white px-2 py-1 rounded">parseInt(e.target.value) || 0</code> 防止 NaN</li>
                <li>• 所有數字輸入框都添加了預設值處理</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3]">
              <h4 className="font-semibold text-[#4B4036] mb-2">📝 介面定義更新</h4>
              <ul className="text-sm text-[#87704e] space-y-1">
                <li>• <code className="bg-white px-2 py-1 rounded">max_students: number | null</code> 允許 null 值</li>
                <li>• 與資料庫欄位定義保持一致</li>
                <li>• 避免 TypeScript 類型錯誤</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#E0F2E0] to-[#D1E7D1] p-4 rounded-lg border border-[#B3E6B3]">
              <h4 className="font-semibold text-[#4B4036] mb-2">⚡ 資料處理優化</h4>
              <ul className="text-sm text-[#87704e] space-y-1">
                <li>• <code className="bg-white px-2 py-1 rounded">max_students: course.max_students || 8</code> 預設值</li>
                <li>• 在資料獲取時就處理 null 值</li>
                <li>• 確保前端顯示的一致性</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#E6F3FF] to-[#CCE7FF] p-4 rounded-lg border border-[#B3D9FF]">
              <h4 className="font-semibold text-[#4B4036] mb-2">✅ 測試步驟</h4>
              <ol className="text-sm text-[#87704e] space-y-1 list-decimal list-inside">
                <li>點擊「課程代碼管理」按鈕</li>
                <li>嘗試編輯現有的課程代碼</li>
                <li>檢查容量欄位是否正常顯示</li>
                <li>修改容量值並保存</li>
                <li>確認沒有 NaN 錯誤</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

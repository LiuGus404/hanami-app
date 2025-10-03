'use client';

import React from 'react';
import MultiCourseAvailabilityDashboard from '@/components/ui/MultiCourseAvailabilityDashboard';

export default function TestScheduleTrialRegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">
            測試：時段試堂和報名控制功能
          </h1>
          <p className="text-[#4B4036] text-lg">
            測試新增的試堂開放和報名開放控制功能
          </p>
        </div>

        {/* 功能說明 */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-[#EADBC8] shadow-sm">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">功能說明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-[#4B4036] flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                試堂開放控制
              </h3>
              <ul className="text-sm text-[#87704e] space-y-1 ml-5">
                <li>• 控制時段是否開放試堂預約</li>
                <li>• 綠色指示器表示開放，紅色表示關閉</li>
                <li>• 可在時段詳情中切換狀態</li>
                <li>• 影響學生是否可以預約試堂</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-[#4B4036] flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                報名開放控制
              </h3>
              <ul className="text-sm text-[#87704e] space-y-1 ml-5">
                <li>• 控制時段是否開放正式課程報名</li>
                <li>• 藍色指示器表示開放，橙色表示關閉</li>
                <li>• 可在時段詳情中切換狀態</li>
                <li>• 影響學生是否可以報名正式課程</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 測試步驟 */}
        <div className="bg-gradient-to-br from-[#E8F5E8] to-[#C8E6C9] rounded-2xl p-6 mb-8 border border-[#4CAF50]/20">
          <h2 className="text-xl font-semibold text-[#2E7D32] mb-4">測試步驟</h2>
          <ol className="text-sm text-[#1B5E20] space-y-2">
            <li><strong>步驟 1:</strong> 點擊任意時段卡片打開詳情</li>
            <li><strong>步驟 2:</strong> 在「時段控制」區域找到試堂和報名開關</li>
            <li><strong>步驟 3:</strong> 切換試堂開放狀態，觀察主時間表的綠色/紅色指示器變化</li>
            <li><strong>步驟 4:</strong> 切換報名開放狀態，觀察主時間表的藍色/橙色指示器變化</li>
            <li><strong>步驟 5:</strong> 驗證狀態變更是否正確保存到資料庫</li>
          </ol>
        </div>

        {/* 多課程時間表組件 */}
        <div className="bg-white rounded-2xl p-6 border border-[#EADBC8] shadow-sm">
          <MultiCourseAvailabilityDashboard />
        </div>

        {/* 技術細節 */}
        <div className="bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] rounded-2xl p-6 mt-8 border border-[#FF9800]/20">
          <h2 className="text-xl font-semibold text-[#E65100] mb-4">技術實現細節</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#BF360C]">
            <div>
              <h3 className="font-medium mb-2">資料庫變更</h3>
              <ul className="space-y-1">
                <li>• 新增 is_trial_open 欄位 (BOOLEAN)</li>
                <li>• 新增 is_registration_open 欄位 (BOOLEAN)</li>
                <li>• 預設值為 true (開放狀態)</li>
                <li>• 添加相應索引優化查詢</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">前端功能</h3>
              <ul className="space-y-1">
                <li>• 時段詳情中的切換按鈕</li>
                <li>• 主時間表的視覺指示器</li>
                <li>• 狀態圖例說明</li>
                <li>• 即時狀態更新和同步</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import MultiCourseAvailabilityDashboard from '@/components/ui/MultiCourseAvailabilityDashboard';

export default function TestImprovedDashboardPage() {
  const [showDashboard, setShowDashboard] = useState(true);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            改善後的多課程儀表板
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">滾動修復</div>
                <div className="w-8 h-8 bg-[#87CEEB] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">✅ 完成</div>
              <div className="text-sm text-[#87704e] mt-1">添加了 overflow-y-auto 和 max-h-screen</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">動感按鈕</div>
                <div className="w-8 h-8 bg-[#FFB6C1] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">✨ 升級</div>
              <div className="text-sm text-[#87704e] mt-1">漸層背景、懸停動畫、圖標</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">美觀設計</div>
                <div className="w-8 h-8 bg-[#EBC9A4] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">🎨 美化</div>
              <div className="text-sm text-[#87704e] mt-1">漸層背景、陰影效果、動畫</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
              onClick={() => setShowDashboard(!showDashboard)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {showDashboard ? '隱藏' : '顯示'} 儀表板
            </button>
          </div>
        </div>

        {showDashboard && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#4B4036] mb-4">改善效果預覽</h2>
            <MultiCourseAvailabilityDashboard />
          </div>
        )}

        <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">改善詳情</h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#F3EFE3] to-[#E8DCC6] p-4 rounded-lg border border-[#EADBC8]">
              <h4 className="font-semibold text-[#4B4036] mb-2">🔧 滾動修復</h4>
              <ul className="text-sm text-[#87704e] space-y-1">
                <li>• 添加 <code className="bg-white px-2 py-1 rounded">overflow-y-auto</code> 支援垂直滾動</li>
                <li>• 設置 <code className="bg-white px-2 py-1 rounded">max-h-screen</code> 限制最大高度</li>
                <li>• 添加 <code className="bg-white px-2 py-1 rounded">pb-20</code> 底部間距避免被遮擋</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3]">
              <h4 className="font-semibold text-[#4B4036] mb-2">✨ 動感按鈕</h4>
              <ul className="text-sm text-[#87704e] space-y-1">
                <li>• 漸層背景效果 <code className="bg-white px-2 py-1 rounded">bg-gradient-to-r</code></li>
                <li>• 懸停縮放動畫 <code className="bg-white px-2 py-1 rounded">hover:scale-105</code></li>
                <li>• 陰影效果 <code className="bg-white px-2 py-1 rounded">hover:shadow-lg</code></li>
                <li>• SVG 圖標增強視覺效果</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#E0F2E0] to-[#D1E7D1] p-4 rounded-lg border border-[#B3E6B3]">
              <h4 className="font-semibold text-[#4B4036] mb-2">🎨 美觀設計</h4>
              <ul className="text-sm text-[#87704e] space-y-1">
                <li>• 統計卡片漸層背景和懸停動畫</li>
                <li>• 時間段卡片立體陰影效果</li>
                <li>• 學生卡片懸停縮放和分層設計</li>
                <li>• 標題漸層文字和動畫效果</li>
                <li>• 統一設計語言和色彩搭配</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function TestComprehensiveNaNFixPage() {
  const [showResults, setShowResults] = useState(false);

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
            全面 NaN 錯誤修復測試
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">課程管理面板</div>
                <div className="w-8 h-8 bg-[#87CEEB] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">✅ 修復</div>
              <div className="text-sm text-[#87704e] mt-1">MultiCourseScheduleManagementPanel</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">班別管理面板</div>
                <div className="w-8 h-8 bg-[#FFB6C1] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">✅ 修復</div>
              <div className="text-sm text-[#87704e] mt-1">ClassManagementPanel</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">教師基本資料</div>
                <div className="w-8 h-8 bg-[#EBC9A4] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">✅ 修復</div>
              <div className="text-sm text-[#87704e] mt-1">TeacherBasicInfo</div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[#87704e] font-medium">成長樹模態框</div>
                <div className="w-8 h-8 bg-[#A68A64] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4B4036]">✅ 修復</div>
              <div className="text-sm text-[#87704e] mt-1">AddGrowthTreeModal</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
              onClick={() => setShowResults(!showResults)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {showResults ? '隱藏' : '顯示'} 修復詳情
            </button>
          </div>
        </div>

        {showResults && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#4B4036] mb-4">修復詳情</h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#F3EFE3] to-[#E8DCC6] p-4 rounded-lg border border-[#EADBC8]">
                <h3 className="font-semibold text-[#4B4036] mb-3">🔧 MultiCourseScheduleManagementPanel.tsx</h3>
                <ul className="text-sm text-[#87704e] space-y-2">
                  <li>• 編輯課程代碼容量欄位：<code className="bg-white px-2 py-1 rounded">value=&#123;editingCourseCode.max_students || ''&#125;</code></li>
                  <li>• 新增時段容量欄位：<code className="bg-white px-2 py-1 rounded">parseInt(e.target.value) || 10</code></li>
                  <li>• 新增課程代碼容量欄位：<code className="bg-white px-2 py-1 rounded">parseInt(e.target.value) || 8</code></li>
                  <li>• 介面定義更新：<code className="bg-white px-2 py-1 rounded">max_students: number | null</code></li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3]">
                <h3 className="font-semibold text-[#4B4036] mb-3">🔧 ClassManagementPanel.tsx</h3>
                <ul className="text-sm text-[#87704e] space-y-2">
                  <li>• 新增時段最大學生數：<code className="bg-white px-2 py-1 rounded">parseInt(e.target.value) || 10</code></li>
                  <li>• 編輯時段最大學生數：<code className="bg-white px-2 py-1 rounded">parseInt(e.target.value) || 10</code></li>
                  <li>• 確保數字輸入框不會產生 NaN 值</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-[#E0F2E0] to-[#D1E7D1] p-4 rounded-lg border border-[#B3E6B3]">
                <h3 className="font-semibold text-[#4B4036] mb-3">🔧 TeacherBasicInfo.tsx</h3>
                <ul className="text-sm text-[#87704e] space-y-2">
                  <li>• 時薪欄位：<code className="bg-white px-2 py-1 rounded">value=&#123;formData.teacher_hsalary ?? ''&#125;</code></li>
                  <li>• 月薪欄位：<code className="bg-white px-2 py-1 rounded">value=&#123;formData.teacher_msalary ?? ''&#125;</code></li>
                  <li>• 使用空值合併運算符避免 NaN</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-[#E6F3FF] to-[#CCE7FF] p-4 rounded-lg border border-[#B3D9FF]">
                <h3 className="font-semibold text-[#4B4036] mb-3">🔧 AddGrowthTreeModal.tsx</h3>
                <ul className="text-sm text-[#87704e] space-y-2">
                  <li>• 樹等級輸入：<code className="bg-white px-2 py-1 rounded">Number(e.target.value) || 1</code></li>
                  <li>• 進度最大值輸入：<code className="bg-white px-2 py-1 rounded">Number(e.target.value) || 20</code></li>
                  <li>• 提供合理的預設值</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-[#FFF0E6] to-[#FFE6CC] p-4 rounded-lg border border-[#FFCC99]">
                <h3 className="font-semibold text-[#4B4036] mb-3">🔧 LearningPathBuilder.tsx</h3>
                <ul className="text-sm text-[#87704e] space-y-2">
                  <li>• 節點時長輸入：<code className="bg-white px-2 py-1 rounded">value=&#123;selectedNode.duration || ''&#125;</code></li>
                  <li>• 編輯節點時長：<code className="bg-white px-2 py-1 rounded">value=&#123;editedNode.duration || ''&#125;</code></li>
                  <li>• 防止 undefined 值導致的 NaN</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-[#F0F8FF] to-[#E6F3FF] p-4 rounded-lg border border-[#B3D9FF]">
              <h3 className="font-semibold text-[#4B4036] mb-3">✅ 修復策略總結</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#87704e]">
                <div>
                  <h4 className="font-medium text-[#4B4036] mb-2">輸入框層面</h4>
                  <ul className="space-y-1">
                    <li>• 使用 <code className="bg-white px-1 rounded">|| ''</code> 提供空字串預設值</li>
                    <li>• 使用 <code className="bg-white px-1 rounded">?? ''</code> 處理 null/undefined</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[#4B4036] mb-2">處理層面</h4>
                  <ul className="space-y-1">
                    <li>• 使用 <code className="bg-white px-1 rounded">parseInt() || defaultValue</code></li>
                    <li>• 使用 <code className="bg-white px-1 rounded">Number() || defaultValue</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">測試步驟</h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#F3EFE3] to-[#E8DCC6] p-4 rounded-lg border border-[#EADBC8]">
              <h4 className="font-semibold text-[#4B4036] mb-2">1. 課程代碼管理測試</h4>
              <ol className="text-sm text-[#87704e] space-y-1 list-decimal list-inside">
                <li>訪問 <code className="bg-white px-2 py-1 rounded">/admin/schedule-management</code></li>
                <li>切換到「多課程管理」模式</li>
                <li>點擊「課程代碼管理」</li>
                <li>嘗試編輯現有課程代碼</li>
                <li>檢查容量欄位是否正常顯示</li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3]">
              <h4 className="font-semibold text-[#4B4036] mb-2">2. 班別管理測試</h4>
              <ol className="text-sm text-[#87704e] space-y-1 list-decimal list-inside">
                <li>訪問 <code className="bg-white px-2 py-1 rounded">/admin/class-management</code></li>
                <li>嘗試新增時段</li>
                <li>修改最大學生數</li>
                <li>確認沒有 NaN 錯誤</li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-[#E0F2E0] to-[#D1E7D1] p-4 rounded-lg border border-[#B3E6B3]">
              <h4 className="font-semibold text-[#4B4036] mb-2">3. 教師資料測試</h4>
              <ol className="text-sm text-[#87704e] space-y-1 list-decimal list-inside">
                <li>訪問 <code className="bg-white px-2 py-1 rounded">/admin/teachers</code></li>
                <li>編輯教師資料</li>
                <li>修改時薪和月薪</li>
                <li>確認輸入框正常顯示</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

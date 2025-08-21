'use client';

import { useState } from 'react';

export default function TestScheduleDisplayPage() {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">教師排班時間顯示測試</h1>
        
        {/* 控制按鈕 */}
        <div className="mb-6">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              editMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-[#A68A64] text-white hover:bg-[#937654]'
            }`}
          >
            {editMode ? '退出編輯模式' : '進入編輯模式'}
          </button>
        </div>

        {/* 測試區域 */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm text-[#2B3A3B]">
          {/* 星期標題 */}
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="font-semibold border-b border-[#EADBC8] pb-1">
              {day}
            </div>
          ))}
          
          {/* 測試格子 */}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i + 1;
            const hasTeacher = day % 3 === 0; // 每3天有一個老師
            
            return (
                             <div
                 key={i}
                 className={`relative border border-[#EADBC8] rounded p-1 flex flex-col justify-between min-h-[130px] ${
                   editMode ? 'cursor-default' : 'cursor-pointer hover:bg-[#FFFCF5]'
                 }`}
                 style={{ overflow: 'hidden' }}
               >
                <div className="absolute top-0 left-1 text-xs font-semibold text-[#2B3A3B]">
                  {day}
                </div>
                
                <div className="flex flex-col gap-0.5 mt-4 w-full">
                  {hasTeacher ? (
                    <div
                      className={`w-full max-w-full bg-gradient-to-br from-[#FFE8C2] to-[#FFD59A] rounded-md shadow-lg flex flex-col items-center p-1 overflow-hidden border border-[#EADBC8] min-w-0 transform hover:scale-105 transition-all duration-300 hover:shadow-xl ${
                        editMode ? 'p-1.5' : 'p-1'
                      }`}
                      style={{ zIndex: 10, marginBottom: 2 }}
                                          >
                       <div className="flex flex-col items-center w-full gap-1">
                         {/* 老師名字 */}
                         <span className="text-xs font-bold w-full text-center bg-white bg-opacity-80 rounded-full px-2 py-0.5 shadow-sm transform hover:scale-110 transition-all duration-200 text-[#4B4036]">
                           {editMode && (
                             <img alt="confirmed" className="w-3 h-3 inline mr-1 animate-pulse" src="/leaf-sprout.png" />
                           )}
                           王老師
                         </span>
                         
                         {/* 編輯模式按鈕 */}
                         {editMode && (
                           <div className="flex gap-1 pointer-events-auto">
                             <button
                               className="w-5 h-5 text-green-600 hover:text-green-800 flex items-center justify-center rounded-full border border-green-200 bg-white text-xs shadow-sm transform hover:scale-125 hover:shadow-md transition-all duration-200 hover:bg-green-50"
                               title="確認"
                             >
                               <span className="animate-pulse">✓</span>
                             </button>
                             <button
                               className="w-5 h-5 text-[#A68A64] hover:text-red-600 flex items-center justify-center rounded-full border border-[#EADBC8] bg-white text-xs shadow-sm transform hover:scale-125 hover:shadow-md transition-all duration-200 hover:bg-red-50"
                               title="取消"
                             >
                               <span className="hover:animate-bounce">×</span>
                             </button>
                           </div>
                         )}
                       </div>
                      
                                             {/* 時間顯示區域 */}
                       <div className="flex flex-col items-center gap-1 mt-1 w-full px-1">
                         {/* 編輯模式：24小時制時間輸入框 */}
                         {editMode && (
                           <div className="flex flex-col items-center gap-1 w-full">
                             {/* 起始時間 */}
                             <div className="w-full relative">
                               <input
                                 className="w-full text-[9px] sm:text-[10px] px-1 py-1 bg-white border border-[#EADBC8] rounded text-center flex-shrink-0 min-w-[50px]"
                                 type="text"
                                 pattern="[0-9]{2}:[0-9]{2}"
                                 placeholder="HH:MM"
                                 value="09:00"
                                 readOnly
                               />
                             </div>
                             {/* 分隔符號 */}
                             <span className="text-[9px] sm:text-[10px] text-[#A68A64] flex-shrink-0">-</span>
                             {/* 結束時間 */}
                             <div className="w-full relative">
                               <input
                                 className="w-full text-[9px] sm:text-[10px] px-1 py-1 bg-white border border-[#EADBC8] rounded text-center flex-shrink-0 min-w-[50px]"
                                 type="text"
                                 pattern="[0-9]{2}:[0-9]{2}"
                                 placeholder="HH:MM"
                                 value="18:00"
                                 readOnly
                               />
                             </div>
                           </div>
                         )}
                         {/* 美化時間文字顯示 - 編輯和非編輯模式都顯示 */}
                         <div className="text-[8px] sm:text-[9px] text-center w-full mt-1">
                           <div className="bg-gradient-to-r from-[#FFE8C2] to-[#FFD59A] rounded-full px-2 py-0.5 shadow-sm border border-[#EADBC8] transform hover:scale-105 transition-all duration-200">
                             <span className="text-[#4B4036] font-medium">09:00</span>
                             <span className="text-[#A68A64] mx-1">→</span>
                             <span className="text-[#4B4036] font-medium">18:00</span>
                           </div>
                         </div>
                       </div>
                    </div>
                  ) : (
                    <span className="text-[#aaa] text-xs">無</span>
                  )}
                </div>
                
                <div className="text-xs mt-2 flex items-center justify-center gap-1">
                  <img alt="girl icon" className="w-4 h-4" src="/icons/penguin-face.PNG" />
                  {hasTeacher ? '3' : '0'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 說明 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">測試說明</h3>
          <div className="text-blue-700 space-y-1">
            <p>• 點擊「進入編輯模式」按鈕來測試編輯模式下的時間顯示</p>
            <p>• 每3天會顯示一個老師的排班記錄</p>
            <p>• 時間輸入框應該完整顯示時間，不被遮蓋</p>
            <p>• 在手機和桌面設備上都應該正常顯示</p>
          </div>
        </div>

                 {/* 修復內容 */}
         <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
           <h3 className="font-bold text-green-800 mb-2">修復內容</h3>
           <div className="text-green-700 space-y-1">
             <p>• 改為24小時制顯示時間</p>
             <p>• 自定義時間輸入框強制使用24小時制（HH:MM格式）</p>
             <p>• 解決瀏覽器自動12小時制格式的問題</p>
             <p>• <strong>擴展輸入框寬度</strong>：從 w-20 改為 w-24，確保完整顯示時:分</p>
             <p>• <strong>添加最小寬度</strong>：min-w-[50px] 防止輸入框被壓縮</p>
             <p>• <strong>強制換行佈局</strong>：改為 flex-col，確保起始和結束時間都能顯示</p>
             <p>• <strong>移除響應式切換</strong>：統一使用垂直排列，避免空間不足問題</p>
             <p>• 增加日曆格子最小高度：從 min-h-[90px] 改為 min-h-[130px]</p>
             <p>• 添加時間文字顯示，確保時間信息完整可見</p>
             <p>• 優化輸入框內邊距：從 px-2 改為 px-1 增加顯示空間</p>
             <p>• 添加時間格式驗證和自動格式化功能</p>
             <p>• 輸入框支援直接輸入數字，自動格式化為 HH:MM</p>
           </div>
         </div>

         {/* 美化效果 */}
         <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
           <h3 className="font-bold text-purple-800 mb-2">美化效果</h3>
           <div className="text-purple-700 space-y-1">
             <p>• <strong>漸層背景</strong>：排班卡片使用漸層背景 from-[#FFE8C2] to-[#FFD59A]</p>
             <p>• <strong>懸停動畫</strong>：卡片懸停時放大 105% 並增強陰影</p>
             <p>• <strong>時間顯示美化</strong>：時間顯示使用圓角膠囊設計，帶有漸層背景</p>
             <p>• <strong>箭頭指示</strong>：使用 → 箭頭替代 - 分隔符，更有動感</p>
             <p>• <strong>老師名字美化</strong>：半透明白色背景，懸停時放大效果，完整顯示名字</p>
             <p>• <strong>按鈕佈局優化</strong>：確認和取消按鈕移至第二行，避免與名字重疊</p>
             <p>• <strong>按鈕動畫</strong>：確認按鈕脈衝動畫，取消按鈕懸停彈跳效果</p>
             <p>• <strong>確認狀態</strong>：已確認的排班使用綠色漸層背景</p>
             <p>• <strong>日曆格子美化</strong>：有排班的格子使用微妙的漸層背景</p>
             <p>• <strong>平滑過渡</strong>：所有動畫使用 200-300ms 的平滑過渡</p>
           </div>
         </div>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { PopupSelect } from '@/components/ui/PopupSelect';

export default function TestModalBackgroundFixPage() {
  const [showPopupSelect, setShowPopupSelect] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  const testOptions = [
    { label: '選項 1', value: 'option1' },
    { label: '選項 2', value: 'option2' },
    { label: '選項 3', value: 'option3' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">模態框背景修復測試</h1>
          <p className="text-[#87704e] mb-4">
            測試各種模態框的背景是否已改為透明
          </p>
          
          <div className="space-y-4">
            <button
              className="bg-[#A68A64] hover:bg-[#8f7350] text-white px-4 py-2 rounded-full text-sm transition-colors"
              onClick={() => setShowPopupSelect(true)}
            >
              測試 PopupSelect 模態框
            </button>
          </div>
        </div>

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
          <h3 className="text-lg font-bold text-[#4B4036] mb-2">修復說明</h3>
          <div className="text-sm text-[#87704e] space-y-2">
            <p>✅ <strong>MultiCourseScheduleManagementPanel</strong> - 所有模態框背景改為透明</p>
            <p>✅ <strong>ClassManagementPanel</strong> - 編輯班別模態框背景改為透明</p>
            <p>✅ <strong>TeacherMobileSidebar</strong> - 移動端側邊欄背景改為透明</p>
            <p>✅ <strong>PopupSelect</strong> - 彈出選擇器背景改為透明</p>
          </div>
        </div>

        <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
          <h3 className="text-lg font-bold text-[#4B4036] mb-2">測試結果</h3>
          <div className="text-sm text-[#87704e] space-y-2">
            <p>🎯 點擊「測試 PopupSelect 模態框」按鈕</p>
            <p>🎯 檢查彈出的模態框背景是否為透明</p>
            <p>🎯 確認背景不會遮擋後方內容</p>
          </div>
        </div>
      </div>

      {/* PopupSelect 測試 */}
      {showPopupSelect && (
        <PopupSelect
          mode="single"
          options={testOptions}
          selected={selectedValue}
          title="測試透明背景"
          onCancel={() => setShowPopupSelect(false)}
          onChange={(value) => {
            setSelectedValue(value as string);
            setShowPopupSelect(false);
          }}
          onConfirm={() => setShowPopupSelect(false)}
        />
      )}
    </div>
  );
}


'use client';

import { useState } from 'react';
import { SimpleAbilityAssessmentModal } from '@/components/ui';

export default function TestAbilityAssessmentPage() {
  const [showModal, setShowModal] = useState(false);

  const handleAssessmentSubmit = (assessment: any) => {
    console.log('能力評估提交:', assessment);
    alert('能力評估已提交！請查看控制台查看詳細資料。');
    setShowModal(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">能力評估功能測試</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <h2 className="text-lg font-medium text-blue-800 mb-2">測試說明</h2>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>點擊下方按鈕開啟能力評估模組</li>
          <li>選擇一個已分配成長樹的學生</li>
          <li>查看調試信息，確認資料載入正確</li>
          <li>測試目標選擇和能力評估功能</li>
          <li>提交評估並查看結果</li>
        </ul>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors"
      >
        開啟能力評估模組
      </button>

      {showModal && (
        <SimpleAbilityAssessmentModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAssessmentSubmit}
        />
      )}
    </div>
  );
} 
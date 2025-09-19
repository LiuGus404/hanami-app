'use client';

import React from 'react';

// 逐步測試導入
console.log('1. 開始測試導入...');

try {
  console.log('2. 測試 HanamiButton 導入...');
  const { HanamiButton } = require('../../../../components/ui');
  console.log('HanamiButton:', HanamiButton);
} catch (error) {
  console.error('HanamiButton 導入失敗:', error);
}

try {
  console.log('3. 測試 HanamiCard 導入...');
  const { HanamiCard } = require('../../../../components/ui');
  console.log('HanamiCard:', HanamiCard);
} catch (error) {
  console.error('HanamiCard 導入失敗:', error);
}

try {
  console.log('4. 測試 framer-motion 導入...');
  const { motion } = require('framer-motion');
  console.log('motion:', motion);
} catch (error) {
  console.error('framer-motion 導入失敗:', error);
}

try {
  console.log('5. 測試 heroicons 導入...');
  const { ChatBubbleLeftRightIcon } = require('@heroicons/react/24/outline');
  console.log('ChatBubbleLeftRightIcon:', ChatBubbleLeftRightIcon);
} catch (error) {
  console.error('heroicons 導入失敗:', error);
}

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          AI 伙伴系統 - 調試頁面
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h2 className="font-medium text-gray-900 mb-2">基礎 React 組件測試</h2>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              原生按鈕測試
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h2 className="font-medium text-gray-900 mb-2">檢查控制台</h2>
            <p className="text-sm text-gray-600">
              打開瀏覽器開發者工具的控制台，查看導入測試結果
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
            <h2 className="font-medium text-yellow-800 mb-2">常見問題</h2>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 檢查組件是否正確導出</li>
              <li>• 檢查依賴是否正確安裝</li>
              <li>• 檢查 TypeScript 型別錯誤</li>
              <li>• 檢查循環導入問題</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


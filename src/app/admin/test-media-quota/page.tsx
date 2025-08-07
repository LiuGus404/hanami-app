'use client';

import { useState } from 'react';
import { MediaQuotaSettingsModal } from '@/components/ui';
import { HanamiButton } from '@/components/ui';

export default function TestMediaQuotaPage() {
  const [showModal, setShowModal] = useState(false);

  const handleSettingsUpdated = () => {
    console.log('配額設定已更新');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">媒體配額設定測試</h1>
          <p className="text-gray-600 mb-6">
            此頁面用於測試媒體配額設定功能。點擊下方按鈕開啟配額設定模態視窗。
          </p>
          
          <HanamiButton
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            開啟配額設定
          </HanamiButton>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">功能說明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 新增配額等級：設定不同級數的媒體配額</li>
              <li>• 編輯配額等級：修改現有配額等級的設定</li>
              <li>• 啟用/停用配額等級：控制配額等級的可用性</li>
              <li>• 刪除配額等級：移除不需要的配額等級</li>
              <li>• 配額包含：影片數量、相片數量、儲存空間限制</li>
            </ul>
          </div>
        </div>

        <MediaQuotaSettingsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </div>
    </div>
  );
} 
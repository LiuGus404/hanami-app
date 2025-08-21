'use client';

import React, { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import toast from 'react-hot-toast';

export default function SetupClassActivitiesPage() {
  const [loading, setLoading] = useState(false);

  const setupClassActivitiesTable = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/class-activities/setup-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '設置失敗');
      }

      toast.success('課堂活動管理表設置成功！');
    } catch (error) {
      console.error('設置失敗:', error);
      toast.error(error instanceof Error ? error.message : '設置失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <HanamiCard className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-hanami-text mb-2">
              課堂活動管理設置
            </h1>
            <p className="text-hanami-text-secondary">
              初始化課堂活動分配系統
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">設置內容</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 創建學生課堂活動分配表</li>
                <li>• 設置資料庫索引</li>
                <li>• 配置 RLS 安全政策</li>
                <li>• 建立資料完整性約束</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 此操作只需要執行一次</li>
                <li>• 設置完成後即可使用課堂活動管理功能</li>
                <li>• 如果表已存在，不會重複創建</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <HanamiButton
              variant="primary"
              size="lg"
              onClick={setupClassActivitiesTable}
              disabled={loading}
            >
              {loading ? '設置中...' : '開始設置'}
            </HanamiButton>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-hanami-text-secondary">
              設置完成後，您可以在管理員側邊欄找到「課堂活動管理」功能
            </p>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import toast from 'react-hot-toast';

export default function TestClassActivitiesPage() {
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

  const testClassActivitiesAPI = async () => {
    try {
      setLoading(true);
      
      // 先測試基本連接
      const testResponse = await fetch('/api/class-activities/test');
      const testResult = await testResponse.json();
      
      if (!testResponse.ok) {
        throw new Error(testResult.error || '基本測試失敗');
      }

      toast.success(`基本測試成功！獲取到 ${testResult.data.lessonsCount} 堂課，${testResult.data.treeActivitiesCount} 個活動`);
      
      // 獲取本週的日期範圍
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      const weekStart = start.toISOString().split('T')[0];
      const weekEnd = end.toISOString().split('T')[0];
      
      const response = await fetch(`/api/class-activities?weekStart=${weekStart}&weekEnd=${weekEnd}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'API 測試失敗');
      }

      toast.success(`完整 API 測試成功！獲取到 ${result.data.lessons.length} 堂課，${result.data.treeActivities.length} 個活動`);
      console.log('API 測試結果:', result);
    } catch (error) {
      console.error('API 測試失敗:', error);
      toast.error(error instanceof Error ? error.message : 'API 測試失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <HanamiCard className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🧪</div>
            <h1 className="text-2xl font-bold text-hanami-text mb-2">
              課堂活動管理測試
            </h1>
            <p className="text-hanami-text-secondary">
              測試和設置課堂活動管理功能
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">測試步驟</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. 首先點擊「設置資料表」創建必要的資料庫表</li>
                <li>2. 然後點擊「測試 API」驗證功能是否正常</li>
                <li>3. 最後可以訪問課堂活動管理頁面</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <HanamiButton
              variant="primary"
              size="lg"
              onClick={setupClassActivitiesTable}
              disabled={loading}
            >
              {loading ? '設置中...' : '設置資料表'}
            </HanamiButton>
            
            <HanamiButton
              variant="secondary"
              size="lg"
              onClick={testClassActivitiesAPI}
              disabled={loading}
            >
              {loading ? '測試中...' : '測試 API'}
            </HanamiButton>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-hanami-text-secondary">
              設置完成後，您可以在 Hanami TC 中找到「課堂活動管理」按鈕
            </p>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
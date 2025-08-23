'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function SetupLessonPlanActivitiesPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string>('');

  const setupTable = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/lesson-plan-activities/setup-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ 成功: ${data.message}`);
      } else {
        setResult(`❌ 失敗: ${data.error}\n\n${data.instructions || ''}`);
      }
    } catch (error) {
      console.error('Error setting up table:', error);
      setResult(`❌ 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTableStatus = async () => {
    setChecking(true);
    setResult('');

    try {
      const response = await fetch('/api/lesson-plan-activities/setup-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.tableExists) {
        setResult(`✅ 資料表狀態: ${data.message}`);
      } else {
        setResult(`❌ 資料表狀態: ${data.message}\n\n${data.instructions || ''}`);
      }
    } catch (error) {
      console.error('Error checking table status:', error);
      setResult(`❌ 檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">
          設置班別活動分配表
        </h1>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#4B4036]">
            功能說明
          </h2>
          <ul className="space-y-2 text-sm text-[#2B3A3B]">
            <li>• 創建 <code className="bg-[#F3F0E5] px-1 rounded">hanami_lesson_plan_activities</code> 表</li>
            <li>• 設置索引以提高查詢性能</li>
            <li>• 創建唯一約束防止重複分配</li>
            <li>• 設置更新時間戳觸發器</li>
            <li>• 配置RLS安全政策</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <HanamiButton
            onClick={checkTableStatus}
            disabled={checking}
            className="bg-[#FFD59A] hover:bg-[#FFC97A] text-[#4B4036]"
          >
            {checking ? '檢查中...' : '檢查資料表狀態'}
          </HanamiButton>
          <HanamiButton
            onClick={setupTable}
            disabled={loading}
            className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
          >
            {loading ? '設置中...' : '創建資料表'}
          </HanamiButton>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${
            result.includes('成功') 
              ? 'bg-[#E0F2E0] border-green-300 text-green-800' 
              : 'bg-[#FFE0E0] border-red-300 text-red-800'
          }`}>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 
 
 
 
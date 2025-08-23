'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function TestLessonPlanActivitiesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testAPI = async () => {
    setLoading(true);
    setResult('');

    try {
      // 測試 GET API
      const getResponse = await fetch('/api/lesson-plan-activities?lessonDate=2024-12-20&timeslot=09:00-10:00&courseType=鋼琴');
      const getData = await getResponse.json();
      
      let resultText = `GET API 測試結果:\n`;
      resultText += `狀態碼: ${getResponse.status}\n`;
      resultText += `成功: ${getData.success}\n`;
      resultText += `訊息: ${getData.message || getData.error || '無訊息'}\n`;
      
      if (getData.tableMissing) {
        resultText += `\n⚠️ 資料表不存在，請前往設置頁面創建資料表\n`;
        resultText += `設置頁面: ${getData.setupUrl}\n`;
      }
      
      if (getData.data) {
        resultText += `\n資料數量: ${getData.data.length}\n`;
        if (getData.data.length > 0) {
          resultText += `第一個活動: ${JSON.stringify(getData.data[0], null, 2)}\n`;
        }
      }

      setResult(resultText);
    } catch (error) {
      console.error('Error testing API:', error);
      setResult(`❌ 測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTableStatus = async () => {
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

      let resultText = `資料表狀態檢查:\n`;
      resultText += `狀態碼: ${response.status}\n`;
      resultText += `成功: ${data.success}\n`;
      resultText += `訊息: ${data.message}\n`;
      resultText += `資料表存在: ${data.tableExists ? '是' : '否'}\n`;

      if (!data.tableExists && data.instructions) {
        resultText += `\n📋 創建說明:\n${data.instructions}\n`;
      }

      setResult(resultText);
    } catch (error) {
      console.error('Error checking table status:', error);
      setResult(`❌ 檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">
          班別活動 API 測試頁面
        </h1>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#4B4036]">
            功能說明
          </h2>
          <ul className="space-y-2 text-sm text-[#2B3A3B]">
            <li>• 測試 <code className="bg-[#F3F0E5] px-1 rounded">/api/lesson-plan-activities</code> API</li>
            <li>• 檢查資料表是否存在</li>
            <li>• 驗證 API 響應格式</li>
            <li>• 診斷常見問題</li>
          </ul>
        </div>

        <div className="flex gap-4 mb-6">
          <HanamiButton
            onClick={checkTableStatus}
            disabled={loading}
            className="bg-[#FFD59A] hover:bg-[#FFC97A] text-[#4B4036]"
          >
            {loading ? '檢查中...' : '檢查資料表狀態'}
          </HanamiButton>
          <HanamiButton
            onClick={testAPI}
            disabled={loading}
            className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
          >
            {loading ? '測試中...' : '測試 API'}
          </HanamiButton>
          <a href="/admin/setup-lesson-plan-activities">
            <HanamiButton className="bg-[#FFB6C1] hover:bg-[#FFA5B8] text-[#4B4036]">
              前往設置頁面
            </HanamiButton>
          </a>
        </div>

        {result && (
          <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-[#4B4036]">測試結果</h3>
            <pre className="whitespace-pre-wrap text-sm text-[#2B3A3B] bg-[#F3F0E5] p-3 rounded overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 
 
 
 
'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function TestLessonPlanSavePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSave = async () => {
    setLoading(true);
    setResult(null);

    try {
      const testData = {
        lesson_date: '2025-08-21',
        timeslot: '10:00:00',
        course_type: '鋼琴',
        topic: '測試主題',
        objectives: ['測試目標1', '測試目標2'],
        materials: ['測試材料1'],
        remarks: '測試備註',
        teacher_ids_1: ['test-teacher-id'],
        teacher_ids_2: JSON.stringify(['test-teacher-id-2']),
        created_at: new Date().toISOString(),
      };

      const response = await fetch('/api/test-lesson-plan-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, data });
      } else {
        setResult({ success: false, error: data.error, details: data.details });
      }
    } catch (error) {
      console.error('Error testing save:', error);
      setResult({ success: false, error: '測試失敗', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">
          測試教案保存功能
        </h1>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#4B4036]">
            功能說明
          </h2>
          <p className="text-sm text-[#2B3A3B] mb-4">
            此頁面用於測試教案保存功能，驗證欄位名稱是否正確。
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <HanamiButton
            onClick={testSave}
            disabled={loading}
            className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
          >
            {loading ? '測試中...' : '測試教案保存'}
          </HanamiButton>
        </div>

        {result && (
          <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#4B4036]">
              測試結果
            </h3>
            
            <div className="space-y-4">
              <div>
                <strong>狀態:</strong> {result.success ? '✅ 成功' : '❌ 失敗'}
              </div>
              
              {result.success && result.data && (
                <div>
                  <strong>保存的資料:</strong>
                  <pre className="mt-2 bg-[#F3F0E5] p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {!result.success && (
                <div className="text-red-600">
                  <strong>錯誤:</strong> {result.error}
                  {result.details && (
                    <div className="text-sm mt-1">
                      <strong>詳細:</strong> {result.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
 
 
 
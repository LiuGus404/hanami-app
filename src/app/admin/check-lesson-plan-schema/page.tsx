'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function CheckLessonPlanSchemaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkSchema = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/check-lesson-plan-schema');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setResult({ error: data.error, details: data.details });
      }
    } catch (error) {
      console.error('Error checking schema:', error);
      setResult({ error: '檢查失敗', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">
          檢查教案表結構
        </h1>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#4B4036]">
            功能說明
          </h2>
          <p className="text-sm text-[#2B3A3B] mb-4">
            此頁面用於檢查 hanami_lesson_plan 表的結構，幫助診斷欄位名稱問題。
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <HanamiButton
            onClick={checkSchema}
            disabled={loading}
            className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
          >
            {loading ? '檢查中...' : '檢查表結構'}
          </HanamiButton>
        </div>

        {result && (
          <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#4B4036]">
              檢查結果
            </h3>
            
            <div className="space-y-4">
              <div>
                <strong>表存在:</strong> {result.tableExists ? '✅ 是' : '❌ 否'}
              </div>
              
              {result.message && (
                <div>
                  <strong>訊息:</strong> {result.message}
                </div>
              )}
              
              {result.error && (
                <div className="text-red-600">
                  <strong>錯誤:</strong> {result.error}
                  {result.details && (
                    <div className="text-sm mt-1">
                      <strong>詳細:</strong> {result.details}
                    </div>
                  )}
                </div>
              )}
              
              {result.columns && result.columns.length > 0 && (
                <div>
                  <strong>欄位列表:</strong>
                  <div className="mt-2 bg-[#F3F0E5] p-4 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2">欄位名稱</th>
                          <th className="text-left py-2">資料類型</th>
                          <th className="text-left py-2">可為空</th>
                          <th className="text-left py-2">預設值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.columns.map((col: any, index: number) => (
                          <tr key={index} className="border-b border-[#EADBC8]">
                            <td className="py-2 font-mono">{col.column_name}</td>
                            <td className="py-2">{col.data_type}</td>
                            <td className="py-2">{col.is_nullable === 'YES' ? '是' : '否'}</td>
                            <td className="py-2">{col.column_default || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
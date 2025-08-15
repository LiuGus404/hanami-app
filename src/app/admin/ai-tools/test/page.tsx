'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AIToolsTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 測試API端點
  const testAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-tools');
      const data = await response.json();
      setTestResult(data);
      toast.success('API測試成功');
    } catch (error) {
      console.error('API測試失敗:', error);
      toast.error('API測試失敗');
    } finally {
      setLoading(false);
    }
  };

  // 測試內容生成
  const testContentGeneration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-tools/content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: '測試內容生成',
          template_id: 'test-template',
          student_id: 'test-student',
          user_email: 'test@example.com'
        }),
      });
      const data = await response.json();
      setTestResult(data);
      toast.success('內容生成測試成功');
    } catch (error) {
      console.error('內容生成測試失敗:', error);
      toast.error('內容生成測試失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2B3A3B] mb-8">AI工具功能測試</h1>
        
        <div className="space-y-6">
          {/* 測試按鈕 */}
          <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
            <h2 className="text-xl font-bold text-[#2B3A3B] mb-4">功能測試</h2>
            <div className="flex gap-4">
              <button
                onClick={testAPI}
                disabled={loading}
                className="px-6 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? '測試中...' : '測試API端點'}
              </button>
              <button
                onClick={testContentGeneration}
                disabled={loading}
                className="px-6 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? '測試中...' : '測試內容生成'}
              </button>
            </div>
          </div>

          {/* 測試結果 */}
          {testResult && (
            <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
              <h2 className="text-xl font-bold text-[#2B3A3B] mb-4">測試結果</h2>
              <pre className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-4 overflow-auto max-h-96 text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
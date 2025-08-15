'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function FixAIToolRLSPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fixRLS = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fix-ai-tool-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('RLS修復結果:', result);

      if (result.success) {
        setResults(result.results);
        toast.success('RLS修復完成');
      } else {
        toast.error(`RLS修復失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('RLS修復失敗:', error);
      toast.error('RLS修復失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">修復AI工具表RLS問題</h1>
      
      <div className="space-y-6">
        {/* 修復按鈕 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">執行修復</h2>
          <button
            onClick={fixRLS}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '修復中...' : '修復RLS問題'}
          </button>
        </div>

        {/* 結果顯示 */}
        {results && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">修復結果</h2>
            
            <div className="space-y-4">
              {/* 表存在檢查 */}
              <div>
                <h3 className="font-medium text-gray-700">表存在檢查</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(results.tableExists, null, 2)}
                </pre>
              </div>

              {/* RLS狀態 */}
              <div>
                <h3 className="font-medium text-gray-700">RLS狀態</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(results.rlsStatus, null, 2)}
                </pre>
              </div>

              {/* RLS政策 */}
              <div>
                <h3 className="font-medium text-gray-700">RLS政策</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(results.policies, null, 2)}
                </pre>
              </div>

              {/* 測試結果 */}
              <div>
                <h3 className="font-medium text-gray-700">CRUD測試結果</h3>
                <div className="space-y-2">
                  {results.testResults?.map((test: any, index: number) => (
                    <div key={index} className="p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {test.operation}
                        </span>
                        <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                          {test.success ? '成功' : '失敗'}
                        </span>
                      </div>
                      {test.error && (
                        <div className="mt-1 text-sm text-red-600">
                          錯誤: {test.error}
                        </div>
                      )}
                      {test.data && (
                        <div className="mt-1 text-sm text-gray-600">
                          數據: {JSON.stringify(test.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 最終狀態 */}
              <div>
                <h3 className="font-medium text-gray-700">最終狀態</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(results.finalStatus, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
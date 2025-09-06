'use client';

import { useState } from 'react';

export default function CreateStudentActivitiesTablePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-student-activities-table', {
        method: 'POST'
      });
      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('創建表失敗:', error);
      setResult({ success: false, error: '創建表失敗' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">創建學生活動表</h1>
      
      <div className="mb-6">
        <button
          onClick={createTable}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '處理中...' : '獲取創建表的 SQL 腳本'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">創建表結果:</h2>
          {result.success ? (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">操作步驟:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {result.instructions?.map((instruction: string, index: number) => (
                    <li key={index} className="text-sm">{instruction}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">SQL 腳本:</h3>
                <pre className="bg-white p-4 rounded border text-xs overflow-x-auto">
                  {result.sqlScript}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              <p>錯誤: {result.error}</p>
              {result.details && <p>詳情: {result.details}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

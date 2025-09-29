'use client';

import { useState } from 'react';

export default function TestMessagesAPI() {
  const [phoneNumber, setPhoneNumber] = useState('68740668');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('測試 API，電話號碼:', phoneNumber);
      const response = await fetch(`/api/messages/${encodeURIComponent(phoneNumber)}`);
      console.log('API 響應狀態:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API 響應數據:', data);
        setResult(data);
      } else {
        const errorText = await response.text();
        console.error('API 錯誤:', response.status, errorText);
        setError(`API 錯誤: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('請求錯誤:', err);
      setError(`請求錯誤: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">測試對話記錄 API</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">電話號碼:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="px-3 py-2 border rounded flex-1"
            placeholder="輸入電話號碼"
          />
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '測試中...' : '測試 API'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-medium text-red-800">錯誤:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 border border-green-300 rounded">
            <h3 className="font-medium text-green-800">API 響應成功</h3>
            <p className="text-green-700">電話號碼: {result.phone}</p>
            <p className="text-green-700">總記錄數: {result.totalCount}</p>
          </div>

          {result.messages && result.messages.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-3">對話記錄 ({result.messages.length} 條):</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.messages.map((msg: any, index: number) => (
                  <div key={index} className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {msg.sender === 'parent' ? '家長' : '用戶'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(msg.timestamp).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>內容:</strong> {msg.content || '(無內容)'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      方向: {msg.direction} | ID: {msg.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-yellow-800">沒有找到對話記錄</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-medium text-blue-800 mb-2">測試說明:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 輸入電話號碼並點擊"測試 API"</li>
          <li>• 檢查 Console 中的調試信息</li>
          <li>• 查看是否有錯誤或數據</li>
          <li>• 嘗試不同的電話號碼格式</li>
        </ul>
      </div>
    </div>
  );
}




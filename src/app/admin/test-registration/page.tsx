'use client';

import { useState } from 'react';

export default function TestRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testCreateRegistration = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test.${Date.now()}@example.com`,
          full_name: `測試用戶 ${Date.now()}`,
          phone: '55147485',
          role: 'teacher',
          additional_info: { reason: '測試申請' }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 成功創建註冊申請: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 創建失敗: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetRegistrations = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/registration-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 成功獲取註冊申請: ${data.data?.length || 0} 條記錄\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 獲取失敗: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-brown-700 mb-6">註冊申請功能測試</h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testCreateRegistration}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試創建註冊申請'}
            </button>
            
            <button
              onClick={testGetRegistrations}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 ml-4"
            >
              {loading ? '測試中...' : '測試獲取註冊申請'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-2">測試結果:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
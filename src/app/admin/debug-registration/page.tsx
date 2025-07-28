'use client';

import { useState } from 'react';

export default function DebugRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');

  const testAPI = async () => {
    setLoading(true);
    setResult('');
    setRawResponse('');

    try {
      console.log('開始測試 API...');
      
      const response = await fetch('/api/registration-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('響應狀態:', response.status);
      console.log('響應頭:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      setRawResponse(responseText);
      console.log('原始響應:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('解析後的數據:', data);
      } catch (parseError) {
        console.error('JSON 解析錯誤:', parseError);
        setResult(`❌ JSON 解析失敗: ${parseError}`);
        return;
      }

      if (response.ok) {
        setResult(`✅ 成功! 狀態: ${response.status}\n數據: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 失敗! 狀態: ${response.status}\n錯誤: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('請求錯誤:', error);
      setResult(`❌ 請求錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectSupabase = async () => {
    setLoading(true);
    setResult('');
    setRawResponse('');

    try {
      console.log('開始直接測試 Supabase...');
      
      // 直接測試 Supabase 連接
      const response = await fetch('/api/test-supabase-connection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      setRawResponse(responseText);
      console.log('Supabase 測試響應:', responseText);

      const data = JSON.parse(responseText);
      setResult(`Supabase 連接測試: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Supabase 測試錯誤:', error);
      setResult(`❌ Supabase 測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-brown-700 mb-6">註冊申請 API 調試</h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試註冊申請 API'}
            </button>
            
            <button
              onClick={testDirectSupabase}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 ml-4"
            >
              {loading ? '測試中...' : '測試 Supabase 連接'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">測試結果:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          {rawResponse && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-2">原始響應:</h3>
              <pre className="text-sm whitespace-pre-wrap bg-white p-2 rounded border">{rawResponse}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
 
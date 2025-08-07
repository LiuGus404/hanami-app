'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';

export default function TestEnvPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const checkEnvVars = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/test-env');
      const result = await response.json();
      setResult(`環境變數檢查結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`環境變數檢查錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">環境變數檢查</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測試控制面板 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">檢查操作</h2>
          
          <div className="space-y-4">
            <HanamiButton
              variant="primary"
              onClick={checkEnvVars}
              disabled={loading}
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查環境變數'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 測試結果 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">檢查結果</h2>
          
          {result ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">{result}</pre>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">點擊上方按鈕開始檢查</p>
            </div>
          )}
        </HanamiCard>
      </div>
      
      <div className="mt-8">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">環境變數說明</h2>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>必需環境變數:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
            <p><strong>檢查內容:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>環境變數是否存在</li>
              <li>Supabase 連接是否正常</li>
              <li>資料表是否可以訪問</li>
            </ul>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
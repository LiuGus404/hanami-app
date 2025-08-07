'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';

export default function TestGetFixPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGetLevels = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('開始測試 GET 請求...');
      const response = await fetch('/api/media-quota-levels');
      console.log('GET 請求狀態碼:', response.status);
      
      const result = await response.json();
      console.log('GET 請求結果:', result);
      
      setResult(`GET 測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('GET 測試錯誤:', error);
      setResult(`GET 測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetActiveOnly = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('開始測試 GET 請求 (active_only=true)...');
      const response = await fetch('/api/media-quota-levels?active_only=true');
      console.log('GET 請求狀態碼:', response.status);
      
      const result = await response.json();
      console.log('GET 請求結果:', result);
      
      setResult(`GET (active_only) 測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('GET 測試錯誤:', error);
      setResult(`GET 測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">GET 請求修復測試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測試控制面板 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">測試操作</h2>
          
          <div className="space-y-4">
            <HanamiButton
              variant="primary"
              onClick={testGetLevels}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試 GET 請求 (所有記錄)'}
            </HanamiButton>
            
            <HanamiButton
              variant="secondary"
              onClick={testGetActiveOnly}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試 GET 請求 (僅啟用記錄)'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 測試結果 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">測試結果</h2>
          
          {result ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">{result}</pre>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">點擊上方按鈕開始測試</p>
            </div>
          )}
        </HanamiCard>
      </div>
      
      <div className="mt-8">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">修復說明</h2>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>問題:</strong> GET 方法中仍在使用舊的 supabase 客戶端</p>
            <p><strong>修復:</strong> 將所有 supabase 調用改為 supabaseAdmin</p>
            <p><strong>修改位置:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>GET 方法中的查詢</li>
              <li>createDefaultQuotaLevels 函數</li>
            </ul>
            <p><strong>預期結果:</strong> GET 請求應該成功返回資料</p>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';

export default function TestSimpleUpdatePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSimpleUpdate = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // 測試更新基礎版
      const response = await fetch('/api/media-quota-levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'b4eef4c7-6e07-41b4-90f4-0d196162a717',
          photo_limit: 15, // 只更新一個欄位
        }),
      });
      
      const result = await response.json();
      setResult(`簡單更新測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      setResult(`簡單更新測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testToggleActive = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // 測試切換狀態
      const response = await fetch('/api/media-quota-levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'b4eef4c7-6e07-41b4-90f4-0d196162a717',
          is_active: false,
        }),
      });
      
      const result = await response.json();
      setResult(`切換狀態測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      setResult(`切換狀態測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateLevel = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // 測試創建新等級
      const response = await fetch('/api/media-quota-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level_name: '測試等級',
          video_limit: 10,
          photo_limit: 20,
          storage_limit_mb: 500,
          video_size_limit_mb: 50,
          photo_size_limit_mb: 10,
          description: '測試用配額等級',
        }),
      });
      
      const result = await response.json();
      setResult(`創建測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      setResult(`創建測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">簡單更新測試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測試控制面板 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">測試操作</h2>
          
          <div className="space-y-4">
            <HanamiButton
              variant="primary"
              onClick={testSimpleUpdate}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試簡單更新'}
            </HanamiButton>
            
            <HanamiButton
              variant="secondary"
              onClick={testToggleActive}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試切換狀態'}
            </HanamiButton>
            
            <HanamiButton
              variant="danger"
              onClick={testCreateLevel}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試創建等級'}
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">測試說明</h2>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>簡單更新測試:</strong> 只更新 photo_limit 欄位，測試最小化更新</p>
            <p><strong>切換狀態測試:</strong> 只更新 is_active 欄位，測試布林值更新</p>
            <p><strong>創建等級測試:</strong> 創建新的配額等級，測試 POST 方法</p>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
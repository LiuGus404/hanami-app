'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function TestPermissionDeletePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testDelete = async () => {
    setLoading(true);
    setResult('');

    try {
      // 首先獲取一個用戶權限記錄來測試刪除
      const response = await fetch('/api/permissions?type=user_permissions');
      const data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        setResult('沒有找到可測試的權限記錄');
        return;
      }

      const testPermission = data.data[0];
      setResult(`找到測試記錄: ${testPermission.user_email} (ID: ${testPermission.id})\n`);

      // 測試刪除
      const deleteResponse = await fetch('/api/permissions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'user_permission',
          id: testPermission.id
        })
      });

      const deleteResult = await deleteResponse.json();
      
      if (deleteResponse.ok) {
        setResult(prev => prev + `✅ 刪除成功: ${JSON.stringify(deleteResult, null, 2)}`);
      } else {
        setResult(prev => prev + `❌ 刪除失敗: ${JSON.stringify(deleteResult, null, 2)}`);
      }

    } catch (error) {
      console.error('測試錯誤:', error);
      setResult(`❌ 測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetPermissions = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/permissions?type=user_permissions');
      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ 獲取權限記錄成功:\n${JSON.stringify(data.data, null, 2)}`);
      } else {
        setResult(`❌ 獲取權限記錄失敗: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('獲取錯誤:', error);
      setResult(`❌ 獲取錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">權限刪除測試</h1>
      
      <div className="flex gap-4 mb-6">
        <HanamiButton
          onClick={testGetPermissions}
          variant="secondary"
          disabled={loading}
        >
          {loading ? '載入中...' : '獲取權限記錄'}
        </HanamiButton>
        
        <HanamiButton
          onClick={testDelete}
          variant="danger"
          disabled={loading}
        >
          {loading ? '測試中...' : '測試刪除'}
        </HanamiButton>
      </div>

      {result && (
        <HanamiCard className="p-4">
          <h2 className="text-lg font-semibold text-[#4B4036] mb-2">測試結果</h2>
          <pre className="text-sm text-[#2B3A3B] whitespace-pre-wrap bg-gray-50 p-3 rounded">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
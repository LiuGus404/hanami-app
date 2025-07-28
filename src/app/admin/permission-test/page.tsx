'use client';

import { useState, useEffect } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function PermissionTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setTestResults(prev => [...prev, { test: testName, status: 'pending', message: '測試中...' }]);
    
    try {
      const result = await testFunction();
      setTestResults(prev => 
        prev.map(r => 
          r.test === testName 
            ? { ...r, status: 'success', message: '測試成功', data: result }
            : r
        )
      );
    } catch (error) {
      setTestResults(prev => 
        prev.map(r => 
          r.test === testName 
            ? { ...r, status: 'error', message: `測試失敗: ${error}` }
            : r
        )
      );
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    // 測試1: 權限系統完整性檢查
    await runTest('權限系統完整性檢查', async () => {
      const response = await fetch('/api/test-permissions');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });

    // 測試2: 檢查權限管理API
    await runTest('權限管理API', async () => {
      const response = await fetch('/api/permissions?type=roles');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });

    // 測試3: 檢查權限檢查API
    await runTest('權限檢查API', async () => {
      const response = await fetch('/api/permissions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: 'test@example.com',
          resource_type: 'page',
          operation: 'view'
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">權限系統測試</h1>
      
      <HanamiCard className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#2B3A3B]">系統測試</h2>
          <p className="text-[#2B3A3B] mb-4">
            點擊下方按鈕開始測試權限系統的各個組件
          </p>
          
          <HanamiButton
            onClick={runAllTests}
            disabled={loading}
            className="bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#2B3A3B]"
          >
            {loading ? '測試中...' : '開始測試'}
          </HanamiButton>
        </div>
      </HanamiCard>

      {testResults.length > 0 && (
        <HanamiCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#2B3A3B]">測試結果</h3>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border border-[#EADBC8] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <span className="font-medium text-[#2B3A3B]">{result.test}</span>
                    </div>
                    <span className={`font-medium ${getStatusColor(result.status)}`}>
                      {result.status === 'success' ? '成功' : 
                       result.status === 'error' ? '失敗' : '進行中'}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-[#2B3A3B]">{result.message}</p>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-[#FFB6C1] hover:text-[#EBC9A4]">
                        查看詳細資料
                      </summary>
                      <pre className="mt-2 p-2 bg-[#FFFDF8] border border-[#EADBC8] rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </HanamiCard>
      )}

      <div className="mt-6">
        <HanamiCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#2B3A3B]">下一步操作</h3>
            <div className="space-y-2 text-sm text-[#2B3A3B]">
              <p>1. 確保已在Supabase中執行 <code className="bg-[#FFF3E0] px-2 py-1 rounded">permission_system_tables.sql</code></p>
              <p>2. 訪問 <a href="/admin/permission-management" className="text-[#FFB6C1] hover:underline">權限管理頁面</a> 進行功能測試</p>
              <p>3. 檢查資料庫中是否已創建權限相關表</p>
              <p>4. 測試權限申請和審核流程</p>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
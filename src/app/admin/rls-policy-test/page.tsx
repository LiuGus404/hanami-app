'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

interface TestResult {
  test_name: string;
  success: boolean;
  message: string;
  details?: any;
}

interface TestSummary {
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  success_rate: number;
}

export default function RLSPolicyTestPage() {
  const { user } = useUser();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [customTestParams, setCustomTestParams] = useState({
    user_email: '',
    resource_type: 'data',
    operation: 'view',
    resource_id: '',
    table_name: 'Hanami_Students'
  });

  const runRLSTests = async () => {
    setLoading(true);
    setTestResults([]);
    setTestSummary(null);

    try {
      const response = await fetch('/api/test-rls-policies');
      const data = await response.json();

      if (data.success) {
        setTestResults(data.results);
        setTestSummary(data.summary);
      } else {
        setTestResults([{
          test_name: 'RLS政策測試',
          success: false,
          message: data.error || '測試失敗',
          details: data
        }]);
      }
    } catch (error) {
      setTestResults([{
        test_name: 'RLS政策測試',
        success: false,
        message: error instanceof Error ? error.message : '測試失敗',
        details: error
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runCustomPermissionTest = async () => {
    if (!customTestParams.user_email) {
      alert('請輸入用戶郵箱');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/test-rls-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_permission_check',
          user_email: customTestParams.user_email,
          resource_type: customTestParams.resource_type,
          operation: customTestParams.operation,
          resource_id: customTestParams.resource_id || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`權限檢查結果: ${data.permission_result ? '有權限' : '無權限'}`);
      } else {
        alert(`權限檢查失敗: ${data.message}`);
      }
    } catch (error) {
      alert(`測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const runTableAccessTest = async () => {
    if (!customTestParams.table_name) {
      alert('請輸入表名');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/test-rls-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_rls_policy',
          table_name: customTestParams.table_name
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`表訪問測試結果: ${data.accessible ? '可訪問' : '不可訪問'}\n記錄數: ${data.record_count}`);
      } else {
        alert(`表訪問測試失敗: ${data.error}`);
      }
    } catch (error) {
      alert(`測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getSummaryColor = (successRate: number) => {
    if (successRate >= 80) return 'text-green-600';
    if (successRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFF3E0] flex items-center justify-center p-4">
        <HanamiCard className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[#4B4036] mb-2">
            請先登入
          </h1>
          <p className="text-[#2B3A3B]">
            您需要登入才能進行RLS政策測試
          </p>
        </HanamiCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFF3E0] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">
            RLS政策測試
          </h1>
          <p className="text-[#2B3A3B] mb-4">
            測試Row Level Security政策和權限檢查功能
          </p>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[#4B4036] mb-2">當前用戶資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">郵箱:</span> {user.email}
              </div>
              <div>
                <span className="font-medium">角色:</span> {user.role}
              </div>
              <div>
                <span className="font-medium">姓名:</span> {user.name}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 測試控制面板 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">
              測試控制
            </h2>
            
            <div className="space-y-4">
              <HanamiButton
                onClick={runRLSTests}
                disabled={loading}
                variant="primary"
                className="w-full"
              >
                {loading ? '測試中...' : '執行RLS政策測試'}
              </HanamiButton>

              <HanamiButton
                onClick={() => {
                  setTestResults([]);
                  setTestSummary(null);
                }}
                variant="secondary"
                className="w-full"
              >
                清除結果
              </HanamiButton>
            </div>

            {/* 測試摘要 */}
            {testSummary && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-[#4B4036] mb-2">
                  測試摘要
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">總測試數:</span> {testSummary.total_tests}
                  </div>
                  <div>
                    <span className="font-medium">成功測試:</span> {testSummary.successful_tests}
                  </div>
                  <div>
                    <span className="font-medium">失敗測試:</span> {testSummary.failed_tests}
                  </div>
                  <div className={`font-medium ${getSummaryColor(testSummary.success_rate)}`}>
                    成功率: {testSummary.success_rate}%
                  </div>
                </div>
              </div>
            )}
          </HanamiCard>

          {/* 自訂測試 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">
              自訂測試
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  用戶郵箱
                </label>
                <input
                  type="email"
                  value={customTestParams.user_email}
                  onChange={(e) => setCustomTestParams(prev => ({
                    ...prev,
                    user_email: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  placeholder="輸入用戶郵箱"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">
                    資源類型
                  </label>
                  <select
                    value={customTestParams.resource_type}
                    onChange={(e) => setCustomTestParams(prev => ({
                      ...prev,
                      resource_type: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  >
                    <option value="page">頁面</option>
                    <option value="feature">功能</option>
                    <option value="data">資料</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">
                    操作
                  </label>
                  <select
                    value={customTestParams.operation}
                    onChange={(e) => setCustomTestParams(prev => ({
                      ...prev,
                      operation: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  >
                    <option value="view">查看</option>
                    <option value="create">創建</option>
                    <option value="edit">編輯</option>
                    <option value="delete">刪除</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  資源ID (可選)
                </label>
                <input
                  type="text"
                  value={customTestParams.resource_id}
                  onChange={(e) => setCustomTestParams(prev => ({
                    ...prev,
                    resource_id: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  placeholder="輸入資源ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <HanamiButton
                  onClick={runCustomPermissionTest}
                  disabled={loading}
                  variant="cute"
                  className="w-full"
                >
                  測試權限檢查
                </HanamiButton>

                <HanamiButton
                  onClick={runTableAccessTest}
                  disabled={loading}
                  variant="cute"
                  className="w-full"
                >
                  測試表訪問
                </HanamiButton>
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 測試結果 */}
        {testResults.length > 0 && (
          <HanamiCard className="mt-6 p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">
              測試結果
            </h2>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#4B4036]">{result.test_name}</span>
                    <span className={`text-lg ${getStatusColor(result.success)}`}>
                      {getStatusIcon(result.success)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${getStatusColor(result.success)}`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        查看詳情
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </HanamiCard>
        )}

        {/* 使用說明 */}
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">
            使用說明
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#4B4036] mb-2">RLS政策測試</h3>
              <ul className="text-sm text-[#2B3A3B] space-y-1">
                <li>• 權限配置驗證 - 檢查預設角色和函數</li>
                <li>• RLS政策狀態 - 檢查表的RLS啟用狀態</li>
                <li>• 權限檢查函數 - 驗證權限檢查函數</li>
                <li>• 權限統計視圖 - 檢查統計視圖</li>
                <li>• 權限檢查觸發器 - 驗證觸發器</li>
                <li>• 權限使用統計表 - 檢查統計表</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#4B4036] mb-2">自訂測試</h3>
              <ul className="text-sm text-[#2B3A3B] space-y-1">
                <li>• 權限檢查測試 - 測試特定權限</li>
                <li>• 表訪問測試 - 測試表的RLS政策</li>
                <li>• 支援多種資源類型</li>
                <li>• 支援多種操作類型</li>
                <li>• 詳細的測試結果</li>
              </ul>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
 
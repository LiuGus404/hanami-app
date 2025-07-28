'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { 
  PermissionGuard, 
  PagePermissionGuard, 
  FeaturePermissionGuard, 
  DataPermissionGuard,
  PermissionButton,
  PermissionLink,
  PermissionDisplay 
} from '@/components/PermissionGuard';
import { checkUserPermission } from '@/lib/permissionUtils';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

export default function PermissionIntegrationTestPage() {
  const { user } = useUser();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      const result = await testFunction();
      setTestResults(prev => [...prev, {
        test: testName,
        success: true,
        message: '測試通過',
        details: result
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: testName,
        success: false,
        message: error instanceof Error ? error.message : '測試失敗',
        details: error
      }]);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    // 測試1: 基本權限檢查
    await runTest('基本權限檢查', async () => {
      if (!user?.email) throw new Error('用戶未登入');
      
      const result = await checkUserPermission(user.email, 'page', 'view', '/admin/students');
      
      return result;
    });

    // 測試2: 頁面權限檢查
    await runTest('頁面權限檢查', async () => {
      if (!user?.email) throw new Error('用戶未登入');
      
      const result = await checkUserPermission(user.email, 'page', 'view', '/admin/permission-management');
      
      return result;
    });

    // 測試3: 功能權限檢查
    await runTest('功能權限檢查', async () => {
      if (!user?.email) throw new Error('用戶未登入');
      
      const result = await checkUserPermission(user.email, 'feature', 'view', 'user_management');
      
      return result;
    });

    // 測試4: 資料權限檢查
    await runTest('資料權限檢查', async () => {
      if (!user?.email) throw new Error('用戶未登入');
      
      const result = await checkUserPermission(user.email, 'data', 'view', 'students');
      
      return result;
    });

    setLoading(false);
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
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
            您需要登入才能進行權限測試
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
            權限系統整合測試
          </h1>
          <p className="text-[#2B3A3B] mb-4">
            測試權限系統的各種功能和組件
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
                onClick={runAllTests}
                disabled={loading}
                variant="primary"
                className="w-full"
              >
                {loading ? '測試中...' : '執行所有測試'}
              </HanamiButton>

              <HanamiButton
                onClick={() => setTestResults([])}
                variant="secondary"
                className="w-full"
              >
                清除結果
              </HanamiButton>
            </div>

            {/* 測試結果 */}
            {testResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#4B4036] mb-3">
                  測試結果
                </h3>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.test}</span>
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
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </HanamiCard>

          {/* 權限組件演示 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">
              權限組件演示
            </h2>
            
            <div className="space-y-4">
              {/* 頁面權限保護 */}
              <div className="border border-[#EADBC8] rounded-lg p-4">
                <h3 className="font-semibold text-[#4B4036] mb-2">頁面權限保護</h3>
                <PagePermissionGuard
                  page_path="/admin/students"
                  fallback={<div className="text-red-500 text-sm">無權限訪問學生管理頁面</div>}
                >
                  <div className="text-green-600 text-sm">✅ 有權限訪問學生管理頁面</div>
                </PagePermissionGuard>
              </div>

              {/* 功能權限保護 */}
              <div className="border border-[#EADBC8] rounded-lg p-4">
                <h3 className="font-semibold text-[#4B4036] mb-2">功能權限保護</h3>
                <FeaturePermissionGuard
                  feature_name="user_management"
                  operation="view"
                  fallback={<div className="text-red-500 text-sm">無權限使用用戶管理功能</div>}
                >
                  <div className="text-green-600 text-sm">✅ 有權限使用用戶管理功能</div>
                </FeaturePermissionGuard>
              </div>

              {/* 資料權限保護 */}
              <div className="border border-[#EADBC8] rounded-lg p-4">
                <h3 className="font-semibold text-[#4B4036] mb-2">資料權限保護</h3>
                <DataPermissionGuard
                  data_type="students"
                  operation="view"
                  fallback={<div className="text-red-500 text-sm">無權限查看學生資料</div>}
                >
                  <div className="text-green-600 text-sm">✅ 有權限查看學生資料</div>
                </DataPermissionGuard>
              </div>

              {/* 權限按鈕 */}
              <div className="border border-[#EADBC8] rounded-lg p-4">
                <h3 className="font-semibold text-[#4B4036] mb-2">權限按鈕</h3>
                <PermissionButton
                  resource_type="feature"
                  operation="create"
                  resource_id="new_student"
                  onClick={() => alert('創建新學生功能')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  創建新學生
                </PermissionButton>
              </div>

              {/* 權限顯示 */}
              <div className="border border-[#EADBC8] rounded-lg p-4">
                <h3 className="font-semibold text-[#4B4036] mb-2">權限顯示</h3>
                <PermissionDisplay
                  resource_type="feature"
                  operation="view"
                  resource_id="financial_data"
                  fallback={<div className="text-red-500 text-sm">無權限查看財務資料</div>}
                >
                  <div className="text-green-600 text-sm">✅ 財務資料: ¥50,000</div>
                </PermissionDisplay>
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 使用說明 */}
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">
            使用說明
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#4B4036] mb-2">權限檢查函數</h3>
              <ul className="text-sm text-[#2B3A3B] space-y-1">
                <li>• <code>checkUserPermission()</code> - 基本權限檢查</li>
                <li>• <code>checkPagePermission()</code> - 頁面權限檢查</li>
                <li>• <code>checkFeaturePermission()</code> - 功能權限檢查</li>
                <li>• <code>checkDataPermission()</code> - 資料權限檢查</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#4B4036] mb-2">權限保護組件</h3>
              <ul className="text-sm text-[#2B3A3B] space-y-1">
                <li>• <code>PermissionGuard</code> - 通用權限保護</li>
                <li>• <code>PagePermissionGuard</code> - 頁面權限保護</li>
                <li>• <code>FeaturePermissionGuard</code> - 功能權限保護</li>
                <li>• <code>DataPermissionGuard</code> - 資料權限保護</li>
                <li>• <code>PermissionButton</code> - 權限按鈕</li>
                <li>• <code>PermissionDisplay</code> - 權限顯示</li>
              </ul>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
 
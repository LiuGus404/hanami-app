'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function TestLiugushkAccessPage() {
  const { user } = useSaasAuth();
  const { 
    teacherAccess, 
    hasTeacherAccess, 
    checkTeacherAccess,
    clearTeacherAccess
  } = useTeacherAccess();
  const router = useRouter();
  const [testResults, setTestResults] = useState<any[]>([]);

  // 添加測試結果
  const addTestResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, {
      test,
      result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // 測試 1: 檢查用戶狀態
  const testUserStatus = () => {
    const result = {
      email: user?.email,
      isLoggedIn: !!user,
      expectedEmail: 'liugushk@gmail.com'
    };
    addTestResult('用戶狀態檢查', result);
  };

  // 測試 2: 檢查 SessionStorage
  const testSessionStorage = () => {
    try {
      const stored = sessionStorage.getItem('hanami_teacher_access');
      const result = {
        hasStoredData: !!stored,
        data: stored ? JSON.parse(stored) : null
      };
      addTestResult('SessionStorage 檢查', result);
    } catch (error) {
      addTestResult('SessionStorage 檢查', { error: error instanceof Error ? error.message : '未知錯誤' });
    }
  };

  // 測試 3: 檢查 Hook 狀態
  const testHookStatus = () => {
    const result = {
      hasTeacherAccess,
      teacherAccess: teacherAccess ? '有數據' : '無數據',
      employeeData: teacherAccess?.employeeData ? '有' : '無',
      message: teacherAccess?.message
    };
    addTestResult('Hook 狀態檢查', result);
  };

  // 測試 4: 手動設置正確的權限數據
  const testManualFix = () => {
    try {
      const correctData = {
        success: true,
        email: 'liugushk@gmail.com',
        hasTeacherAccess: true,
        employeeData: {
          id: 'dde10af1-7e33-47e1-b9d5-1984cc859640',
          teacher_nickname: 'LiuLiu',
          teacher_email: 'liugushk@gmail.com',
          teacher_fullname: 'LiuLiu',
          teacher_role: 'teacher',
          teacher_status: 'active'
        },
        saasUserData: null,
        message: '✓ 已驗證花見老師身份',
        mode: 'manual_test',
        timestamp: Date.now()
      };

      sessionStorage.setItem('hanami_teacher_access', JSON.stringify(correctData));
      addTestResult('手動修復測試', { success: true, message: '已設置正確的權限數據' });
      
      // 重新檢查權限
      setTimeout(() => {
        checkTeacherAccess('liugushk@gmail.com');
      }, 1000);
      
    } catch (error) {
      addTestResult('手動修復測試', { error: error instanceof Error ? error.message : '未知錯誤' });
    }
  };

  // 測試 5: 清除所有數據
  const testClearAll = () => {
    try {
      sessionStorage.removeItem('hanami_teacher_access');
      clearTeacherAccess();
      addTestResult('清除數據測試', { success: true, message: '已清除所有權限數據' });
    } catch (error) {
      addTestResult('清除數據測試', { error: error instanceof Error ? error.message : '未知錯誤' });
    }
  };

  // 運行所有測試
  const runAllTests = () => {
    setTestResults([]);
    testUserStatus();
    testSessionStorage();
    testHookStatus();
  };

  // 測試跳轉到教師專區
  const testTeacherZoneAccess = () => {
    if (hasTeacherAccess) {
      router.push('/aihome/teacher-zone');
    } else {
      addTestResult('教師專區訪問測試', { 
        success: false, 
        message: '權限不足，無法訪問教師專區',
        hasTeacherAccess 
      });
    }
  };

  useEffect(() => {
    if (user?.email === 'liugushk@gmail.com') {
      runAllTests();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-hanami-border shadow-lg">
          <h1 className="text-3xl font-bold text-hanami-text mb-6 text-center">
            🧪 liugushk@gmail.com 權限測試
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>用戶:</strong> {user?.email || '未登入'}</p>
              <p><strong>教師權限:</strong> 
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                  hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasTeacherAccess ? '✓ 有權限' : '✗ 無權限'}
                </span>
              </p>
              <p><strong>權限數據:</strong> {teacherAccess ? '已載入' : '未載入'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">測試操作</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <HanamiButton 
                onClick={testUserStatus}
                variant="secondary"
                className="text-sm"
              >
                檢查用戶狀態
              </HanamiButton>
              
              <HanamiButton 
                onClick={testSessionStorage}
                variant="secondary"
                className="text-sm"
              >
                檢查 SessionStorage
              </HanamiButton>
              
              <HanamiButton 
                onClick={testHookStatus}
                variant="secondary"
                className="text-sm"
              >
                檢查 Hook 狀態
              </HanamiButton>
              
              <HanamiButton 
                onClick={testManualFix}
                variant="cute"
                className="text-sm"
              >
                手動修復權限
              </HanamiButton>
              
              <HanamiButton 
                onClick={testClearAll}
                variant="danger"
                className="text-sm"
              >
                清除所有數據
              </HanamiButton>
              
              <HanamiButton 
                onClick={runAllTests}
                variant="primary"
                className="text-sm"
              >
                運行所有測試
              </HanamiButton>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">測試結果</h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">尚未運行任何測試</p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{result.test}</h4>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <HanamiButton 
              onClick={testTeacherZoneAccess}
              disabled={!hasTeacherAccess}
              variant="cute"
            >
              測試教師專區訪問
            </HanamiButton>
            
            <HanamiButton 
              onClick={() => router.push('/aihome/quick-fix-teacher-access')}
              variant="primary"
            >
              快速修復頁面
            </HanamiButton>
            
            <HanamiButton 
              onClick={() => router.push('/aihome')}
              variant="secondary"
            >
              返回首頁
            </HanamiButton>
          </div>
        </div>
      </div>
    </div>
  );
}

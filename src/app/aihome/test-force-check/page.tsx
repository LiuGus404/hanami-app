'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function TestForceCheckPage() {
  const { user } = useSaasAuth();
  const { 
    teacherAccess, 
    hasTeacherAccess, 
    loading,
    checkTeacherAccess,
    clearTeacherAccess
  } = useTeacherAccess();
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // 強制檢查權限
  const forceCheck = async () => {
    if (!user?.email) {
      addLog('錯誤：用戶未登入');
      return;
    }

    addLog(`開始強制檢查用戶 ${user.email} 的教師權限`);
    
    try {
      // 清除現有數據
      clearTeacherAccess();
      sessionStorage.removeItem('hanami_teacher_access');
      addLog('已清除現有的權限數據');
      
      // 強制檢查
      await checkTeacherAccess(user.email, true);
      addLog('強制檢查完成');
      
    } catch (error) {
      addLog(`強制檢查失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 測試 API 直接調用
  const testDirectApi = async () => {
    if (!user?.email) {
      addLog('錯誤：用戶未登入');
      return;
    }

    addLog(`測試直接 API 調用: /api/force-check-teacher-access`);
    
    try {
      const response = await fetch(`/api/force-check-teacher-access?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      addLog(`API 響應狀態: ${response.status}`);
      addLog(`API 響應數據: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      addLog(`API 調用失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 清除所有數據
  const clearAll = () => {
    clearTeacherAccess();
    sessionStorage.removeItem('hanami_teacher_access');
    setLogs([]);
    addLog('已清除所有數據和日誌');
  };

  useEffect(() => {
    addLog('頁面已載入');
    if (user) {
      addLog(`當前用戶: ${user.email}`);
    }
  }, [user]);

  useEffect(() => {
    if (teacherAccess) {
      addLog(`權限檢查完成: ${teacherAccess.hasTeacherAccess ? '有權限' : '無權限'}`);
    }
  }, [teacherAccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-hanami-border shadow-lg">
          <h1 className="text-3xl font-bold text-hanami-text mb-6 text-center">
            🔧 強制權限檢查測試
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>用戶:</strong> {user?.email || '未登入'}</p>
              <p><strong>載入中:</strong> {loading ? '是' : '否'}</p>
              <p><strong>教師權限:</strong> 
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                  hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasTeacherAccess ? '✓ 有權限' : '✗ 無權限'}
                </span>
              </p>
              <p><strong>權限數據:</strong> {teacherAccess ? '已載入' : '未載入'}</p>
              {teacherAccess && (
                <p><strong>消息:</strong> {teacherAccess.message}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">測試操作</h2>
            <div className="flex flex-wrap gap-4">
              <HanamiButton 
                onClick={forceCheck}
                disabled={!user || loading}
                variant="cute"
              >
                {loading ? '檢查中...' : '強制檢查權限'}
              </HanamiButton>
              
              <HanamiButton 
                onClick={testDirectApi}
                disabled={!user}
                variant="primary"
              >
                測試直接 API
              </HanamiButton>
              
              <HanamiButton 
                onClick={clearAll}
                variant="danger"
              >
                清除所有數據
              </HanamiButton>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">操作日誌</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">暫無日誌</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">權限數據詳情</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {teacherAccess ? (
                <pre className="text-xs overflow-auto max-h-48">
                  {JSON.stringify(teacherAccess, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">暫無權限數據</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <HanamiButton 
              onClick={() => router.push('/aihome/teacher-zone')}
              disabled={!hasTeacherAccess}
              variant="cute"
            >
              測試教師專區訪問
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

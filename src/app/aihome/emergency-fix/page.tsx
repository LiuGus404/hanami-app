'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function EmergencyFixPage() {
  const { user } = useSaasAuth();
  const {
    teacherAccess,
    hasTeacherAccess,
    loading,
    checkTeacherAccess,
    clearTeacherAccess,
    forceRefreshState
  } = useTeacherAccess();
  const router = useRouter();
  const [isFixing, setIsFixing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  // 緊急修復函數
  const emergencyFix = async () => {
    if (!user?.email) {
      addLog('錯誤：用戶未登入');
      toast.error('請先登入');
      return;
    }

    setIsFixing(true);
    addLog(`開始緊急修復，用戶: ${user.email}`);

    try {
      // 步驟 1: 清除所有現有數據
      addLog('步驟 1: 清除所有現有數據');
      clearTeacherAccess();
      sessionStorage.removeItem('hanami_teacher_access');

      // 步驟 2: 直接調用 API
      addLog('步驟 2: 直接調用強制檢查 API');
      const response = await fetch(`/api/force-check-teacher-access?email=${encodeURIComponent(user.email)}`);

      if (!response.ok) {
        throw new Error(`API 調用失敗: ${response.status}`);
      }

      const data = await response.json();
      addLog(`API 響應: ${JSON.stringify(data, null, 2)}`);

      if (!data.success) {
        throw new Error(`API 返回失敗: ${data.message}`);
      }

      // 步驟 3: 手動設置會話存儲
      addLog('步驟 3: 手動設置會話存儲');
      const sessionData = {
        ...data,
        timestamp: Date.now()
      };
      sessionStorage.setItem('hanami_teacher_access', JSON.stringify(sessionData));
      addLog('會話存儲已設置');

      // 步驟 4: 強制刷新 Hook 狀態
      addLog('步驟 4: 強制刷新 Hook 狀態');
      setTimeout(() => {
        forceRefreshState();
        addLog('Hook 狀態已刷新');

        // 步驟 5: 驗證修復結果
        setTimeout(() => {
          addLog('步驟 5: 驗證修復結果');
          if (data.hasTeacherAccess) {
            addLog('✓ 修復成功！用戶有教師權限');
            toast.success('緊急修復成功！');

            // 自動跳轉到教師專區
            setTimeout(() => {
              addLog('自動跳轉到教師專區');
              router.push('/aihome/teacher-zone');
            }, 2000);
          } else {
            addLog('✗ 修復失敗：用戶沒有教師權限');
            toast.error('用戶沒有教師權限');
          }
        }, 1000);
      }, 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      addLog(`修復失敗: ${errorMessage}`);
      toast.error(`修復失敗: ${errorMessage}`);
    } finally {
      setIsFixing(false);
    }
  };

  // 手動設置權限數據
  const manualSetAccess = () => {
    if (!user?.email) {
      addLog('錯誤：用戶未登入');
      return;
    }

    addLog('手動設置教師權限數據');

    const manualData = {
      success: true,
      email: user.email,
      hasTeacherAccess: true,
      employeeData: {
        id: 'dde10af1-7e33-47e1-b9d5-1984cc859640',
        teacher_nickname: 'LiuLiu',
        teacher_email: user.email,
        teacher_fullname: 'LiuLiu',
        teacher_role: 'teacher',
        teacher_status: 'active'
      },
      saasUserData: null,
      message: '✓ 已驗證花見老師身份',
      mode: 'manual_emergency_fix',
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem('hanami_teacher_access', JSON.stringify(manualData));
      addLog('手動數據已設置到會話存儲');

      setTimeout(() => {
        forceRefreshState();
        addLog('Hook 狀態已刷新');
        toast.success('手動設置成功！');
      }, 500);

    } catch (error) {
      addLog(`手動設置失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      toast.error('手動設置失敗');
    }
  };

  // 清除所有數據
  const clearAll = () => {
    addLog('清除所有數據');
    clearTeacherAccess();
    sessionStorage.removeItem('hanami_teacher_access');
    setLogs([]);
    toast.success('已清除所有數據');
  };

  useEffect(() => {
    addLog('緊急修復頁面已載入');
    if (user) {
      addLog(`當前用戶: ${user.email}`);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-hanami-border shadow-lg">
          <h1 className="text-3xl font-bold text-hanami-text mb-6 text-center">
            🚨 緊急權限修復工具
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>用戶:</strong> {user?.email || '未登入'}</p>
              <p><strong>載入中:</strong> {loading ? '是' : '否'}</p>
              <p><strong>教師權限:</strong>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
            <h2 className="text-xl font-semibold text-hanami-text mb-4">緊急修復操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HanamiButton
                onClick={emergencyFix}
                disabled={!user || isFixing}
                variant="cute"
                className="w-full"
              >
                {isFixing ? '修復中...' : '🚨 緊急修復權限'}
              </HanamiButton>

              <HanamiButton
                onClick={manualSetAccess}
                disabled={!user}
                variant="primary"
                className="w-full"
              >
                🔧 手動設置權限
              </HanamiButton>

              <HanamiButton
                onClick={clearAll}
                variant="danger"
                className="w-full"
              >
                🗑️ 清除所有數據
              </HanamiButton>

              <HanamiButton
                onClick={() => router.push('/aihome/check-state')}
                variant="secondary"
                className="w-full"
              >
                📊 狀態檢查
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

          <div className="flex space-x-4">
            <HanamiButton
              onClick={() => router.push('/aihome/teacher-zone')}
              disabled={!hasTeacherAccess}
              variant="cute"
            >
              測試教師專區訪問
            </HanamiButton>

            <HanamiButton
              onClick={() => router.push('/')}
              variant="secondary"
            >
              返回首頁
            </HanamiButton>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">緊急修復說明</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 緊急修復會清除所有現有數據並重新檢查權限</li>
              <li>• 手動設置會直接設置教師權限數據</li>
              <li>• 修復成功後會自動跳轉到教師專區</li>
              <li>• 如果修復失敗，請檢查控制台日誌</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

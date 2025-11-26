'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function DirectSupabaseCheckPage() {
  const { user } = useSaasAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  // 直接使用 supabase 查詢 hanami_employee 表
  const directSupabaseCheck = async () => {
    if (!user?.email) {
      addLog('錯誤：用戶未登入');
      toast.error('請先登入');
      return;
    }

    setIsChecking(true);
    addLog(`開始直接 Supabase 查詢，用戶: ${user.email}`);

    try {
      // 步驟 1: 直接查詢 hanami_employee 表
      addLog('步驟 1: 查詢 hanami_employee 表');
      const { data: employeeData, error: employeeError } = await (supabase
        .from('hanami_employee') as any)
        .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
        .eq('teacher_email', user.email)
        .single();

      addLog(`查詢結果: ${JSON.stringify({ employeeData, employeeError }, null, 2)}`);

      if (employeeError) {
        if (employeeError.code === 'PGRST116') {
          // 沒有找到記錄
          addLog('結果：用戶不在教師表中');
          setCheckResult({
            success: false,
            hasTeacherAccess: false,
            message: '您不具備花見老師專區訪問權限',
            employeeData: null,
            error: '用戶不在 hanami_employee 表中'
          });
          toast.error('您不在教師表中，無法訪問教師專區');
          return;
        } else {
          // 其他錯誤
          throw new Error(`資料庫查詢錯誤: ${employeeError.message}`);
        }
      }

      if (!employeeData) {
        addLog('結果：沒有找到員工數據');
        setCheckResult({
          success: false,
          hasTeacherAccess: false,
          message: '您不具備花見老師專區訪問權限',
          employeeData: null,
          error: '沒有找到員工數據'
        });
        toast.error('沒有找到員工數據');
        return;
      }

      // 步驟 2: 檢查教師狀態
      addLog('步驟 2: 檢查教師狀態');
      if (employeeData.teacher_status !== 'active') {
        addLog(`教師狀態不是 active: ${employeeData.teacher_status}`);
        setCheckResult({
          success: false,
          hasTeacherAccess: false,
          message: '您的教師帳號未啟用',
          employeeData,
          error: `教師狀態: ${employeeData.teacher_status}`
        });
        toast.error('您的教師帳號未啟用');
        return;
      }

      // 步驟 3: 成功 - 設置權限數據
      addLog('步驟 3: 教師權限驗證成功');
      const successResult = {
        success: true,
        hasTeacherAccess: true,
        message: '✓ 已驗證花見老師身份',
        employeeData,
        mode: 'direct_supabase_check',
        timestamp: Date.now()
      };

      setCheckResult(successResult);

      // 步驟 4: 保存到會話存儲
      addLog('步驟 4: 保存權限數據到會話存儲');
      try {
        const sessionData = {
          ...successResult,
          email: user.email
        };
        sessionStorage.setItem('hanami_teacher_access', JSON.stringify(sessionData));
        addLog('權限數據已保存到會話存儲');
      } catch (error) {
        addLog(`保存會話存儲失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }

      // 步驟 5: 教師權限驗證完成（不再顯示通知）
      addLog('步驟 5: 教師權限驗證完成');

      // 延遲跳轉
      setTimeout(() => {
        addLog('自動跳轉到教師專區');
        router.push('/aihome/teacher-zone');
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      addLog(`查詢失敗: ${errorMessage}`);
      setCheckResult({
        success: false,
        hasTeacherAccess: false,
        message: '查詢教師權限失敗',
        employeeData: null,
        error: errorMessage
      });
      toast.error(`查詢失敗: ${errorMessage}`);
    } finally {
      setIsChecking(false);
    }
  };

  // 清除所有數據
  const clearAll = () => {
    addLog('清除所有數據');
    setCheckResult(null);
    sessionStorage.removeItem('hanami_teacher_access');
    setLogs([]);
    toast.success('已清除所有數據');
  };

  // 手動設置權限（基於已知數據）
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
      mode: 'manual_set',
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem('hanami_teacher_access', JSON.stringify(manualData));
      addLog('手動數據已設置到會話存儲');
      setCheckResult(manualData);
      toast.success('手動設置成功！');

      setTimeout(() => {
        router.push('/aihome/teacher-zone');
      }, 1500);

    } catch (error) {
      addLog(`手動設置失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      toast.error('手動設置失敗');
    }
  };

  useEffect(() => {
    addLog('直接 Supabase 檢查頁面已載入');
    if (user) {
      addLog(`當前用戶: ${user.email}`);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-hanami-border shadow-lg">
          <h1 className="text-3xl font-bold text-hanami-text mb-6 text-center">
            🔍 直接 Supabase 教師權限檢查
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>用戶:</strong> {user?.email || '未登入'}</p>
              <p><strong>檢查中:</strong> {isChecking ? '是' : '否'}</p>
              <p><strong>檢查結果:</strong> {checkResult ? '已獲取' : '未檢查'}</p>
              {checkResult && (
                <>
                  <p><strong>教師權限:</strong>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${checkResult.hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {checkResult.hasTeacherAccess ? '✓ 有權限' : '✗ 無權限'}
                    </span>
                  </p>
                  <p><strong>消息:</strong> {checkResult.message}</p>
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">檢查操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HanamiButton
                onClick={directSupabaseCheck}
                disabled={!user || isChecking}
                variant="cute"
                className="w-full"
              >
                {isChecking ? '檢查中...' : '🔍 直接 Supabase 檢查'}
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
                onClick={() => router.push('/aihome/teacher-zone')}
                disabled={!checkResult?.hasTeacherAccess}
                variant="secondary"
                className="w-full"
              >
                測試教師專區訪問
              </HanamiButton>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">檢查結果</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {checkResult ? (
                <pre className="text-xs overflow-auto max-h-64">
                  {JSON.stringify(checkResult, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">尚未執行檢查</p>
              )}
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
              onClick={() => router.push('/aihome')}
              variant="secondary"
            >
              返回首頁
            </HanamiButton>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">直接 Supabase 檢查說明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 直接使用 supabase 客戶端查詢 hanami_employee 表</li>
              <li>• 與課堂活動管理頁面使用相同的資料庫查詢方式</li>
              <li>• 不依賴 API 端點或複雜的權限檢查邏輯</li>
              <li>• 檢查教師狀態是否為 active</li>
              <li>• 成功後自動保存權限數據到會話存儲</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

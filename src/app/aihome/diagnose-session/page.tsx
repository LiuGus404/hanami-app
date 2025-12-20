'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function DiagnoseSessionPage() {
  const { user } = useSaasAuth();
  const {
    teacherAccess,
    loading,
    error,
    hasTeacherAccess,
    checkTeacherAccess,
    clearTeacherAccess,
    employeeData,
    saasUserData
  } = useTeacherAccess();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  const [manualCheckResult, setManualCheckResult] = useState<any>(null);
  const [directDbCheckResult, setDirectDbCheckResult] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);

  // 檢查 sessionStorage 中的數據
  const checkSessionStorage = () => {
    try {
      const stored = sessionStorage.getItem('hanami_teacher_access');
      if (stored) {
        const data = JSON.parse(stored);
        setSessionData(data);
        return data;
      } else {
        setSessionData(null);
        return null;
      }
    } catch (error) {
      console.error('檢查 sessionStorage 失敗:', error);
      setSessionData(null);
      return null;
    }
  };

  // 手動檢查教師權限（強制重新檢查）
  const handleManualCheck = async () => {
    if (!user?.email) {
      alert('請先登入');
      return;
    }

    console.log('手動檢查教師權限:', user.email);

    // 清除會話存儲
    sessionStorage.removeItem('hanami_teacher_access');

    // 重新檢查
    await checkTeacherAccess(user.email);

    // 檢查結果
    setTimeout(() => {
      checkSessionStorage();
    }, 2000);
  };

  // 直接調用 API 檢查
  const handleDirectApiCheck = async () => {
    if (!user?.email) {
      alert('請先登入');
      return;
    }

    try {
      setManualCheckResult({ loading: true, message: '檢查中...' });

      // 嘗試完整版本 API
      let response = await fetch(`/api/check-teacher-access?email=${encodeURIComponent(user.email)}`);
      let apiData = await response.json();

      if (!response.ok) {
        console.warn('完整版本 API 失敗，嘗試簡化版本');
        response = await fetch(`/api/check-teacher-access-simple?email=${encodeURIComponent(user.email)}`);
        apiData = await response.json();
      }

      setManualCheckResult({
        loading: false,
        data: apiData,
        status: response.status,
        ok: response.ok
      });

    } catch (error) {
      setManualCheckResult({
        loading: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  };

  // 直接查詢資料庫
  const handleDirectDbCheck = async () => {
    if (!user?.email) {
      alert('請先登入');
      return;
    }

    try {
      setDirectDbCheckResult({ loading: true, message: '直接查詢資料庫中...' });

      const response = await fetch(`/api/check-employee-direct?email=${encodeURIComponent(user.email)}`);
      const apiData = await response.json();

      setDirectDbCheckResult({
        loading: false,
        data: apiData,
        status: response.status,
        ok: response.ok
      });

    } catch (error) {
      setDirectDbCheckResult({
        loading: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  };

  // 修復教師權限
  const handleFixAccess = async () => {
    if (!user?.email) {
      alert('請先登入');
      return;
    }

    try {
      setFixResult({ loading: true, message: '修復中...' });

      const response = await fetch('/api/fix-teacher-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const apiData = await response.json();

      setFixResult({
        loading: false,
        data: apiData,
        status: response.status,
        ok: response.ok
      });

      // 如果修復成功，自動應用修復
      if (response.ok && apiData.success && apiData.fixedData) {
        try {
          sessionStorage.setItem('hanami_teacher_access', JSON.stringify(apiData.fixedData));
          console.log('權限修復數據已保存到 sessionStorage');

          // 重新檢查權限
          setTimeout(() => {
            checkTeacherAccess(user.email);
            checkSessionStorage();
          }, 1000);

        } catch (error) {
          console.error('保存修復數據失敗:', error);
        }
      }

    } catch (error) {
      setFixResult({
        loading: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  };

  // 清除所有會話數據
  const handleClearAll = () => {
    sessionStorage.removeItem('hanami_teacher_access');
    clearTeacherAccess();
    setSessionData(null);
    setManualCheckResult(null);
    setDirectDbCheckResult(null);
    setFixResult(null);
    console.log('已清除所有會話數據');
  };

  useEffect(() => {
    checkSessionStorage();
  }, [teacherAccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg p-6 border border-hanami-border">
          <h1 className="text-3xl font-bold text-hanami-text mb-6">
            🔍 會話診斷工具
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前用戶</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {user ? (
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.full_name}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </div>
              ) : (
                <p className="text-gray-500">未登入</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">SessionStorage 數據</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {sessionData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Email:</strong> {sessionData.email}</p>
                      <p><strong>有教師權限:</strong>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${sessionData.hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {sessionData.hasTeacherAccess ? '是' : '否'}
                        </span>
                      </p>
                      <p><strong>成功:</strong> {sessionData.success ? '是' : '否'}</p>
                    </div>
                    <div>
                      <p><strong>時間戳:</strong> {sessionData.timestamp ? new Date(sessionData.timestamp).toLocaleString() : '無'}</p>
                      <p><strong>消息:</strong> {sessionData.message || '無'}</p>
                      <p><strong>模式:</strong> {sessionData.mode || '無'}</p>
                    </div>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-blue-600">查看完整 SessionStorage 數據</summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(sessionData, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-gray-500">SessionStorage 中沒有數據</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">Hook 狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>載入中:</strong> {loading ? '是' : '否'}</p>
                  <p><strong>有教師權限:</strong>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {hasTeacherAccess ? '是' : '否'}
                    </span>
                  </p>
                  <p><strong>權限數據:</strong> {teacherAccess ? '有' : '無'}</p>
                </div>
                <div>
                  <p><strong>錯誤:</strong> {error || '無'}</p>
                  <p><strong>員工數據:</strong> {employeeData ? '有' : '無'}</p>
                  <p><strong>SAAS 數據:</strong> {saasUserData ? '有' : '無'}</p>
                </div>
              </div>

              {teacherAccess && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-blue-600">查看完整 Hook 數據</summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(teacherAccess, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">直接資料庫檢查</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {directDbCheckResult ? (
                <div className="space-y-3">
                  {directDbCheckResult.loading ? (
                    <p className="text-blue-600">檢查中...</p>
                  ) : directDbCheckResult.error ? (
                    <div>
                      <p className="text-red-600"><strong>錯誤:</strong> {directDbCheckResult.error}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <p><strong>狀態碼:</strong> {directDbCheckResult.status}</p>
                        <p><strong>請求成功:</strong> {directDbCheckResult.ok ? '是' : '否'}</p>
                        <p><strong>精確匹配:</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${directDbCheckResult.data?.exactMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {directDbCheckResult.data?.exactMatch ? '是' : '否'}
                          </span>
                        </p>
                        <p><strong>模糊匹配:</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${directDbCheckResult.data?.fuzzyMatch ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {directDbCheckResult.data?.fuzzyMatch ? '是' : '否'}
                          </span>
                        </p>
                      </div>

                      {directDbCheckResult.data?.employeeData && (
                        <div className="mb-3">
                          <h4 className="font-semibold text-sm">精確匹配的員工數據:</h4>
                          <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-auto">
                            {JSON.stringify(directDbCheckResult.data.employeeData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {directDbCheckResult.data?.fuzzyResults && directDbCheckResult.data.fuzzyResults.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-semibold text-sm">模糊匹配結果:</h4>
                          <pre className="mt-1 p-2 bg-yellow-50 rounded text-xs overflow-auto">
                            {JSON.stringify(directDbCheckResult.data.fuzzyResults, null, 2)}
                          </pre>
                        </div>
                      )}

                      <details>
                        <summary className="cursor-pointer text-sm text-blue-600">查看完整資料庫檢查結果</summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(directDbCheckResult.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">尚未執行直接資料庫檢查</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">手動 API 檢查</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {manualCheckResult ? (
                <div className="space-y-3">
                  {manualCheckResult.loading ? (
                    <p className="text-blue-600">檢查中...</p>
                  ) : manualCheckResult.error ? (
                    <div>
                      <p className="text-red-600"><strong>錯誤:</strong> {manualCheckResult.error}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <p><strong>狀態碼:</strong> {manualCheckResult.status}</p>
                        <p><strong>請求成功:</strong> {manualCheckResult.ok ? '是' : '否'}</p>
                      </div>

                      <details>
                        <summary className="cursor-pointer text-sm text-blue-600">查看 API 響應數據</summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(manualCheckResult.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">尚未執行手動檢查</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">權限修復</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {fixResult ? (
                <div className="space-y-3">
                  {fixResult.loading ? (
                    <p className="text-blue-600">修復中...</p>
                  ) : fixResult.error ? (
                    <div>
                      <p className="text-red-600"><strong>錯誤:</strong> {fixResult.error}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <p><strong>狀態碼:</strong> {fixResult.status}</p>
                        <p><strong>修復成功:</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${fixResult.data?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {fixResult.data?.success ? '是' : '否'}
                          </span>
                        </p>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">
                        <strong>消息:</strong> {fixResult.data?.message}
                      </p>

                      {fixResult.data?.instructions && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <h4 className="font-semibold text-sm text-blue-800 mb-2">修復步驟:</h4>
                          <ol className="text-xs text-blue-700 space-y-1">
                            <li>1. {fixResult.data.instructions.step1}</li>
                            <li>2. {fixResult.data.instructions.step2}</li>
                            <li>3. {fixResult.data.instructions.step3}</li>
                          </ol>
                        </div>
                      )}

                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-blue-600">查看完整修復結果</summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(fixResult.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">尚未執行權限修復</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">測試操作</h2>
            <div className="flex flex-wrap gap-4">
              <HanamiButton
                onClick={handleFixAccess}
                variant="cute"
                disabled={!user}
              >
                修復教師權限
              </HanamiButton>

              <HanamiButton
                onClick={handleDirectDbCheck}
                variant="cute"
              >
                直接資料庫檢查
              </HanamiButton>

              <HanamiButton
                onClick={handleManualCheck}
                disabled={!user || loading}
              >
                強制重新檢查權限
              </HanamiButton>

              <HanamiButton
                onClick={handleDirectApiCheck}
                variant="cute"
              >
                直接 API 檢查
              </HanamiButton>

              <HanamiButton
                onClick={handleClearAll}
                variant="danger"
              >
                清除所有數據
              </HanamiButton>

              <HanamiButton
                onClick={() => checkSessionStorage()}
                variant="secondary"
              >
                刷新 SessionStorage
              </HanamiButton>
            </div>
          </div>

          <div className="flex space-x-4">
            <HanamiButton
              onClick={() => router.push('/aihome/teacher-zone')}
              variant="cute"
            >
              測試花見老師專區
            </HanamiButton>

            <HanamiButton
              onClick={() => router.push('/')}
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

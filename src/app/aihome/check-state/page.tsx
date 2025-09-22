'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function CheckStatePage() {
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
  const [sessionData, setSessionData] = useState<any>(null);

  // 檢查 SessionStorage
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
      console.error('檢查 SessionStorage 失敗:', error);
      setSessionData(null);
      return null;
    }
  };

  // 強制檢查並刷新
  const forceCheckAndRefresh = async () => {
    if (!user?.email) return;
    
    console.log('開始強制檢查並刷新');
    
    // 清除現有狀態
    clearTeacherAccess();
    
    // 強制檢查
    await checkTeacherAccess(user.email, true);
    
    // 等待一下然後強制刷新
    setTimeout(() => {
      console.log('強制刷新狀態');
      forceRefreshState();
    }, 500);
  };

  useEffect(() => {
    checkSessionStorage();
  }, [teacherAccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-hanami-border shadow-lg">
          <h1 className="text-3xl font-bold text-hanami-text mb-6 text-center">
            🔍 狀態檢查工具
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Hook 狀態 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-hanami-text mb-4">Hook 狀態</h2>
              <div className="space-y-2 text-sm">
                <p><strong>用戶:</strong> {user?.email || '未登入'}</p>
                <p><strong>載入中:</strong> {loading ? '是' : '否'}</p>
                <p><strong>教師權限:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {hasTeacherAccess ? '✓ 有' : '✗ 無'}
                  </span>
                </p>
                <p><strong>權限數據:</strong> {teacherAccess ? '有' : '無'}</p>
                {teacherAccess && (
                  <>
                    <p><strong>成功:</strong> {teacherAccess.success ? '是' : '否'}</p>
                    <p><strong>消息:</strong> {teacherAccess.message}</p>
                  </>
                )}
              </div>
            </div>

            {/* SessionStorage 狀態 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-hanami-text mb-4">SessionStorage 狀態</h2>
              <div className="space-y-2 text-sm">
                {sessionData ? (
                  <>
                    <p><strong>有數據:</strong> ✓ 是</p>
                    <p><strong>Email:</strong> {sessionData.email}</p>
                    <p><strong>教師權限:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        sessionData.hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sessionData.hasTeacherAccess ? '✓ 有' : '✗ 無'}
                      </span>
                    </p>
                    <p><strong>成功:</strong> {sessionData.success ? '是' : '否'}</p>
                    <p><strong>消息:</strong> {sessionData.message}</p>
                    <p><strong>時間戳:</strong> {sessionData.timestamp ? new Date(sessionData.timestamp).toLocaleString() : '無'}</p>
                  </>
                ) : (
                  <p className="text-gray-500">無數據</p>
                )}
              </div>
            </div>
          </div>

          {/* 狀態對比 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-hanami-text mb-4">狀態對比</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              {sessionData && teacherAccess ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Hook vs SessionStorage 權限狀態:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      hasTeacherAccess === sessionData.hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hasTeacherAccess === sessionData.hasTeacherAccess ? '✓ 一致' : '✗ 不一致'}
                    </span>
                  </p>
                  <p><strong>Hook 權限:</strong> {hasTeacherAccess ? '有' : '無'}</p>
                  <p><strong>SessionStorage 權限:</strong> {sessionData.hasTeacherAccess ? '有' : '無'}</p>
                </div>
              ) : (
                <p className="text-gray-500">無法對比，缺少數據</p>
              )}
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-wrap gap-4 mb-6">
            <HanamiButton 
              onClick={forceCheckAndRefresh}
              disabled={!user || loading}
              variant="cute"
            >
              {loading ? '處理中...' : '強制檢查並刷新'}
            </HanamiButton>
            
            <HanamiButton 
              onClick={() => forceRefreshState()}
              variant="primary"
            >
              強制刷新狀態
            </HanamiButton>
            
            <HanamiButton 
              onClick={() => checkSessionStorage()}
              variant="secondary"
            >
              刷新 SessionStorage
            </HanamiButton>
            
            <HanamiButton 
              onClick={() => clearTeacherAccess()}
              variant="danger"
            >
              清除所有狀態
            </HanamiButton>
          </div>

          {/* 詳細數據 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-hanami-text mb-4">詳細數據</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Hook 數據</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(teacherAccess, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">SessionStorage 數據</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* 測試按鈕 */}
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

'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function DebugTeacherAccessPage() {
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
  const [sessionStorageData, setSessionStorageData] = useState<any>(null);

  // 檢查 sessionStorage 中的數據
  const checkSessionStorage = () => {
    try {
      const stored = sessionStorage.getItem('hanami_teacher_access');
      if (stored) {
        const data = JSON.parse(stored);
        setSessionStorageData(data);
        return data;
      } else {
        setSessionStorageData(null);
        return null;
      }
    } catch (error) {
      console.error('檢查 sessionStorage 失敗:', error);
      setSessionStorageData(null);
      return null;
    }
  };

  // 手動檢查教師權限
  const handleCheckAccess = async () => {
    if (!user?.email) {
      alert('請先登入');
      return;
    }
    
    console.log('手動檢查教師權限:', user.email);
    await checkTeacherAccess(user.email);
    checkSessionStorage();
  };

  // 清除教師權限狀態
  const handleClearAccess = () => {
    clearTeacherAccess();
    setSessionStorageData(null);
    console.log('已清除教師權限狀態');
  };

  useEffect(() => {
    checkSessionStorage();
  }, [teacherAccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg p-6 border border-hanami-border">
          <h1 className="text-3xl font-bold text-hanami-text mb-6">
            🔍 教師權限調試頁面
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">用戶狀態</h2>
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
            <h2 className="text-xl font-semibold text-hanami-text mb-4">教師權限狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>載入中:</strong> {loading ? '是' : '否'}</p>
              <p><strong>有教師權限:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasTeacherAccess ? '是' : '否'}
                </span>
              </p>
              {error && <p><strong>錯誤:</strong> <span className="text-red-600">{error}</span></p>}
              {teacherAccess && (
                <div className="mt-4">
                  <p><strong>消息:</strong> {teacherAccess.message}</p>
                  <p><strong>成功:</strong> {teacherAccess.success ? '是' : '否'}</p>
                  <p><strong>時間戳:</strong> {teacherAccess.timestamp ? new Date(teacherAccess.timestamp).toLocaleString() : '無'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">教師資料</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {employeeData ? (
                <div className="space-y-2">
                  <p><strong>姓名:</strong> {employeeData.teacher_fullname}</p>
                  <p><strong>暱稱:</strong> {employeeData.teacher_nickname}</p>
                  <p><strong>角色:</strong> {employeeData.teacher_role}</p>
                  <p><strong>狀態:</strong> {employeeData.teacher_status}</p>
                  <p><strong>Email:</strong> {employeeData.teacher_email}</p>
                </div>
              ) : (
                <p className="text-gray-500">無教師資料</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">SAAS 用戶資料</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {saasUserData ? (
                <div className="space-y-2">
                  <p><strong>姓名:</strong> {saasUserData.name}</p>
                  <p><strong>角色:</strong> {saasUserData.role}</p>
                  <p><strong>訂閱狀態:</strong> {saasUserData.subscription_status}</p>
                  <p><strong>Email:</strong> {saasUserData.email}</p>
                </div>
              ) : (
                <p className="text-gray-500">無 SAAS 用戶資料</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">SessionStorage 數據</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {sessionStorageData ? (
                <div className="space-y-2">
                  <p><strong>Email:</strong> {sessionStorageData.email}</p>
                  <p><strong>權限:</strong> {sessionStorageData.hasTeacherAccess ? '有' : '無'}</p>
                  <p><strong>時間戳:</strong> {new Date(sessionStorageData.timestamp).toLocaleString()}</p>
                  <p><strong>消息:</strong> {sessionStorageData.message}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">查看完整數據</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(sessionStorageData, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-gray-500">SessionStorage 中沒有數據</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">測試操作</h2>
            <div className="flex space-x-4">
              <HanamiButton 
                onClick={handleCheckAccess}
                disabled={!user || loading}
              >
                檢查教師權限
              </HanamiButton>
              
              <HanamiButton 
                onClick={handleClearAccess}
                variant="danger"
              >
                清除權限狀態
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

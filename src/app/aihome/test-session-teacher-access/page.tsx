'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { HanamiCard } from '@/components/ui';
import toast from 'react-hot-toast';

export default function TestSessionTeacherAccessPage() {
  const { user, logout } = useSaasAuth();
  const { 
    teacherAccess, 
    loading, 
    error, 
    hasTeacherAccess, 
    checkTeacherAccess, 
    clearTeacherAccess 
  } = useTeacherAccess();
  
  const [sessionStorageData, setSessionStorageData] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

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

  // 添加測試結果
  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]); // 只保留最近10條
  };

  // 手動檢查教師權限
  const handleCheckAccess = async () => {
    if (!user?.email) {
      toast.error('請先登入');
      return;
    }
    
    addTestResult(`開始檢查教師權限: ${user.email}`);
    await checkTeacherAccess(user.email);
  };

  // 清除教師權限狀態
  const handleClearAccess = () => {
    clearTeacherAccess();
    setSessionStorageData(null);
    addTestResult('已清除教師權限狀態');
    toast.success('已清除教師權限狀態');
  };

  // 模擬頁面重新載入
  const handleSimulateReload = () => {
    addTestResult('模擬頁面重新載入，檢查狀態恢復');
    checkSessionStorage();
  };

  // 測試會話持久化
  const handleTestSessionPersistence = async () => {
    if (!user?.email) {
      toast.error('請先登入');
      return;
    }

    addTestResult('開始測試會話持久化');
    
    // 1. 清除現有狀態
    clearTeacherAccess();
    setSessionStorageData(null);
    addTestResult('步驟1: 清除現有狀態');
    
    // 2. 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. 檢查教師權限（應該會調用 API）
    addTestResult('步驟2: 檢查教師權限（應該調用 API）');
    await checkTeacherAccess(user.email);
    
    // 4. 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. 再次檢查（應該使用 sessionStorage）
    addTestResult('步驟3: 再次檢查（應該使用 sessionStorage）');
    await checkTeacherAccess(user.email);
    
    // 6. 檢查 sessionStorage
    checkSessionStorage();
    addTestResult('步驟4: 檢查 sessionStorage 內容');
  };

  // 初始載入時檢查 sessionStorage
  useEffect(() => {
    checkSessionStorage();
  }, []);

  // 當 teacherAccess 變化時更新 sessionStorage 顯示
  useEffect(() => {
    checkSessionStorage();
  }, [teacherAccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <HanamiCard className="p-6">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-6">
            🔍 會話級別教師權限測試
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">用戶狀態</h2>
            <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
              {user ? (
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.full_name}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <HanamiButton 
                    variant="danger" 
                    size="sm" 
                    onClick={logout}
                    className="mt-2"
                  >
                    登出
                  </HanamiButton>
                </div>
              ) : (
                <p className="text-gray-500">未登入</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">教師權限狀態</h2>
            <div className="bg-white rounded-lg p-4 border border-[#EADBC8] space-y-2">
              <p><strong>狀態:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasTeacherAccess ? '✓ 有教師權限' : '✗ 無教師權限'}
                </span>
              </p>
              <p><strong>載入中:</strong> {loading ? '是' : '否'}</p>
              {error && <p><strong>錯誤:</strong> <span className="text-red-600">{error}</span></p>}
              {teacherAccess && (
                <div className="mt-4">
                  <p><strong>消息:</strong> {teacherAccess.message}</p>
                  <p><strong>時間戳:</strong> {teacherAccess.timestamp ? new Date(teacherAccess.timestamp).toLocaleString() : '無'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">SessionStorage 數據</h2>
            <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
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
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <HanamiButton 
                onClick={handleCheckAccess}
                disabled={!user || loading}
                className="w-full"
              >
                檢查教師權限
              </HanamiButton>
              
              <HanamiButton 
                onClick={handleClearAccess}
                variant="danger"
                className="w-full"
              >
                清除權限狀態
              </HanamiButton>
              
              <HanamiButton 
                onClick={handleSimulateReload}
                variant="secondary"
                className="w-full"
              >
                模擬重新載入
              </HanamiButton>
              
              <HanamiButton 
                onClick={handleTestSessionPersistence}
                disabled={!user || loading}
                variant="cute"
                className="w-full md:col-span-2 lg:col-span-3"
              >
                🧪 完整會話持久化測試
              </HanamiButton>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試結果日誌</h2>
            <div className="bg-white rounded-lg p-4 border border-[#EADBC8] max-h-60 overflow-y-auto">
              {testResults.length > 0 ? (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono text-gray-700">
                      {result}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暫無測試結果</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">測試說明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>檢查教師權限:</strong> 手動觸發教師權限檢查</li>
              <li>• <strong>清除權限狀態:</strong> 清除內存和 sessionStorage 中的狀態</li>
              <li>• <strong>模擬重新載入:</strong> 檢查 sessionStorage 中的數據</li>
              <li>• <strong>完整測試:</strong> 自動執行完整的會話持久化測試流程</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-4">
            <h3 className="font-semibold text-green-800 mb-2">預期行為</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 首次檢查時會調用 API 並顯示 toast 通知</li>
              <li>• 第二次檢查時直接使用 sessionStorage，不調用 API</li>
              <li>• 頁面重新載入後狀態會自動恢復</li>
              <li>• 登出時會清除所有會話數據</li>
            </ul>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
}

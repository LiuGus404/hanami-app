'use client';

import { useState, useEffect } from 'react';
import { useDirectTeacherAccess } from '@/hooks/saas/useDirectTeacherAccess';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestTeacherSchedulePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useSaasAuth();
  const { 
    teacherAccess: directTeacherAccess,
    hasTeacherAccess,
    loading: directLoading,
    checkTeacherAccess: directCheckTeacherAccess
  } = useDirectTeacherAccess();

  // 自動檢查教師權限
  useEffect(() => {
    if (user?.email && !directTeacherAccess && !directLoading) {
      console.log('測試頁面：自動檢查教師權限:', user.email);
      directCheckTeacherAccess(user.email).catch((error) => {
        console.error('測試頁面：教師權限檢查失敗:', error);
      });
    }
  }, [user?.email, directTeacherAccess, directLoading, directCheckTeacherAccess]);

  const testTeacherSchedule = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      const teacherId = directTeacherAccess?.employeeData?.id;
      const apiUrl = `/api/test-teacher-schedule${teacherId ? `?teacherId=${teacherId}` : ''}`;
      
      console.log('測試API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      console.log('測試結果:', result);
      setTestResult(result);
      
    } catch (error) {
      console.error('測試失敗:', error);
      setTestResult({
        success: false,
        error: '測試失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-6">
            教師排程測試
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前教師信息</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm">
                {JSON.stringify({
                  userEmail: user?.email || '未登入',
                  teacherId: directTeacherAccess?.employeeData?.id || '無教師ID',
                  email: directTeacherAccess?.employeeData?.teacher_email || '無郵箱',
                  name: directTeacherAccess?.employeeData?.teacher_fullname || '無姓名',
                  hasTeacherAccess,
                  directLoading,
                  teacherAccessExists: !!directTeacherAccess,
                  fullTeacherAccess: directTeacherAccess,
                  sessionStorage: typeof window !== 'undefined' ? sessionStorage.getItem('hanami_teacher_access') : 'N/A'
                }, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => {
                if (user?.email) {
                  console.log('手動檢查教師權限:', user.email);
                  directCheckTeacherAccess(user.email);
                } else {
                  console.log('用戶未登入，無法檢查教師權限');
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-4 hover:bg-blue-600"
            >
              手動檢查教師權限
            </button>
            <button
              onClick={() => {
                console.log('清除教師權限狀態');
                // 清除會話存儲
                sessionStorage.removeItem('hanami_teacher_access');
                // 重新檢查
                if (user?.email) {
                  directCheckTeacherAccess(user.email);
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              清除並重新檢查
            </button>
          </div>

          <button
            onClick={testTeacherSchedule}
            disabled={loading}
            className="bg-gradient-to-r from-hanami-primary to-hanami-accent text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '測試中...' : '測試教師排程'}
          </button>

          {testResult && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-hanami-text mb-4">測試結果</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

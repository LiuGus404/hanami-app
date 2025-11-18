'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession, setUserSession, clearUserSession, UserProfile, fallbackOrganization } from '@/lib/authUtils';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function TestAutoRedirectPage() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<UserProfile | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // 載入當前會話狀態
    const session = getUserSession();
    setCurrentSession(session);
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testAutoRedirect = async () => {
    addTestResult('開始測試自動跳轉功能...');
    
    // 檢查當前會話
    const session = getUserSession();
    if (session) {
      addTestResult(`發現已登入用戶: ${session.role} (${session.email})`);
      
      // 根據角色跳轉
      switch (session.role) {
        case 'admin':
          addTestResult('跳轉到管理員儀表板');
          router.push('/admin');
          break;
        case 'teacher':
          addTestResult('跳轉到教師儀表板');
          router.push('/teacher/dashboard');
          break;
        case 'parent':
          addTestResult('跳轉到家長儀表板');
          router.push('/parent/dashboard');
          break;
        case 'student':
          addTestResult('跳轉到學生儀表板（使用家長儀表板）');
          router.push('/parent/dashboard');
          break;
        default:
          addTestResult(`未知角色: ${session.role}，跳轉到登入頁面`);
          router.push('/login');
      }
    } else {
      addTestResult('未找到有效會話，跳轉到登入頁面');
      router.push('/login');
    }
  };

  const simulateAdminLogin = () => {
    const mockAdminSession: UserProfile = {
      id: 'test-admin-123',
      email: 'admin@test.com',
      role: 'admin',
      name: '測試管理員',
      relatedIds: [],
      organization: fallbackOrganization,
    };
    
    setUserSession(mockAdminSession);
    setCurrentSession(mockAdminSession);
    addTestResult('已設置管理員測試會話');
  };

  const simulateTeacherLogin = () => {
    const mockTeacherSession: UserProfile = {
      id: 'test-teacher-123',
      email: 'teacher@test.com',
      role: 'teacher',
      name: '測試教師',
      relatedIds: [],
      organization: fallbackOrganization,
    };
    
    setUserSession(mockTeacherSession);
    setCurrentSession(mockTeacherSession);
    addTestResult('已設置教師測試會話');
  };

  const simulateParentLogin = () => {
    const mockParentSession: UserProfile = {
      id: 'test-parent-123',
      email: 'parent@test.com',
      role: 'parent',
      name: '測試家長',
      relatedIds: [],
      organization: fallbackOrganization,
    };
    
    setUserSession(mockParentSession);
    setCurrentSession(mockParentSession);
    addTestResult('已設置家長測試會話');
  };

  const clearSession = () => {
    clearUserSession();
    setCurrentSession(null);
    addTestResult('已清除用戶會話');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">🎯 自動跳轉功能測試</h1>
          <p className="text-[#2B3A3B]">測試已登入用戶點擊「花見音樂」時的自動跳轉功能</p>
        </div>

        {/* 當前會話狀態 */}
        <HanamiCard className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">當前會話狀態</h2>
          {currentSession ? (
            <div className="bg-[#E0F2E0] p-4 rounded-xl">
              <p><strong>角色:</strong> {currentSession.role}</p>
              <p><strong>Email:</strong> {currentSession.email}</p>
              <p><strong>姓名:</strong> {currentSession.name}</p>
              <p><strong>所屬機構:</strong> {currentSession.organization?.name}</p>
            </div>
          ) : (
            <div className="bg-[#FFE0E0] p-4 rounded-xl">
              <p>❌ 未登入</p>
            </div>
          )}
        </HanamiCard>

        {/* 測試按鈕 */}
        <HanamiCard className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">模擬登入測試</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <HanamiButton
              onClick={simulateAdminLogin}
              variant="primary"
              className="w-full"
            >
              🎯 模擬管理員登入
            </HanamiButton>
            <HanamiButton
              onClick={simulateTeacherLogin}
              variant="secondary"
              className="w-full"
            >
              🎯 模擬教師登入
            </HanamiButton>
            <HanamiButton
              onClick={simulateParentLogin}
              variant="soft"
              className="w-full"
            >
              🎯 模擬家長登入
            </HanamiButton>
            <HanamiButton
              onClick={clearSession}
              variant="danger"
              className="w-full"
            >
              🎯 清除會話
            </HanamiButton>
          </div>
          
          <div className="border-t pt-4">
            <HanamiButton
              onClick={testAutoRedirect}
              variant="cute"
              size="lg"
              className="w-full"
            >
              🎯 測試自動跳轉功能
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 測試結果 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試結果</h2>
          <div className="bg-[#F8F9FA] p-4 rounded-xl max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-[#6B7280]">尚未進行測試</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <p key={index} className="text-sm text-[#4B4036] font-mono">
                    {result}
                  </p>
                ))}
              </div>
            )}
          </div>
        </HanamiCard>

        {/* 返回按鈕 */}
        <div className="mt-6 text-center">
          <HanamiButton
            onClick={() => router.push('/')}
            variant="secondary"
          >
            返回主頁
          </HanamiButton>
        </div>
      </div>
    </div>
  );
}

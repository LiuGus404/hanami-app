'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function TestTeacherAccessPage() {
  const { user, loading: authLoading } = useSaasAuth();
  const { 
    teacherAccess, 
    loading: teacherLoading, 
    error, 
    checkTeacherAccess, 
    clearTeacherAccess,
    hasTeacherAccess,
    employeeData,
    saasUserData
  } = useTeacherAccess();
  const [testEmail, setTestEmail] = useState('');
  const [envConfig, setEnvConfig] = useState<any>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [user]);

  const handleTestAccess = async () => {
    if (!testEmail.trim()) {
      alert('請輸入 email');
      return;
    }
    await checkTeacherAccess(testEmail.trim());
  };

  const handleClearResults = () => {
    clearTeacherAccess();
  };

  const handleCheckEnvConfig = async () => {
    try {
      setLoadingEnv(true);
      const response = await fetch('/api/check-env-config');
      const data = await response.json();
      setEnvConfig(data);
    } catch (error) {
      console.error('檢查環境配置錯誤:', error);
      alert('檢查環境配置失敗');
    } finally {
      setLoadingEnv(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-2">教師權限測試頁面</h1>
          <p className="text-[#2B3A3B]">測試跨資料庫教師權限檢查功能</p>
        </div>

        {/* 當前用戶資訊 */}
        <HanamiCard className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">當前用戶資訊</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.full_name || '未設定'}</p>
            </div>
          ) : (
            <p className="text-[#2B3A3B]">未登入</p>
          )}
        </HanamiCard>

        {/* 環境配置檢查 */}
        <HanamiCard className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">環境配置檢查</h2>
          <div className="space-y-4">
            <p className="text-[#2B3A3B] text-sm">
              檢查資料庫連接配置，確認是否可以正常使用教師權限功能
            </p>
            <div className="flex space-x-4">
              <HanamiButton
                onClick={handleCheckEnvConfig}
                loading={loadingEnv}
                variant="secondary"
              >
                檢查環境配置
              </HanamiButton>
            </div>
            
            {envConfig && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-[#4B4036] mb-2">配置狀態</h3>
                  <div className="space-y-1 text-sm">
                    <p>主資料庫: {envConfig.configuration.mainDatabase.configured ? '✅ 已配置' : '❌ 未配置'}</p>
                    <p>SAAS 資料庫: {envConfig.configuration.saasDatabase.configured ? '✅ 已配置' : '❌ 未配置'}</p>
                    <p>推薦模式: {envConfig.configuration.overall.recommendedMode}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-[#4B4036] mb-2">建議</h3>
                  <ul className="text-sm space-y-1">
                    {envConfig.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </HanamiCard>

        {/* 測試表單 */}
        <HanamiCard className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">權限檢查測試</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                測試 Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                placeholder="輸入要測試的 email"
              />
            </div>
            <div className="flex space-x-4">
              <HanamiButton
                onClick={handleTestAccess}
                loading={teacherLoading}
                disabled={!testEmail.trim()}
              >
                檢查權限
              </HanamiButton>
              <HanamiButton
                onClick={handleClearResults}
                variant="secondary"
                disabled={!teacherAccess}
              >
                清除結果
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>

        {/* 錯誤顯示 */}
        {error && (
          <HanamiCard className="p-6 mb-6 border-red-200 bg-red-50">
            <h2 className="text-xl font-semibold text-red-600 mb-2">錯誤</h2>
            <p className="text-red-700">{error}</p>
          </HanamiCard>
        )}

        {/* 檢查結果 */}
        {teacherAccess && (
          <div className="space-y-6">
            {/* 總體結果 */}
            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">檢查結果</h2>
              
              {/* 顯示模式信息 */}
              {(teacherAccess as any).mode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>模式:</strong> {(teacherAccess as any).mode}
                  </p>
                  {(teacherAccess as any).note && (
                    <p className="text-blue-600 text-xs mt-1">
                      {(teacherAccess as any).note}
                    </p>
                  )}
                </div>
              )}
              
              {/* 警告信息 */}
              {(teacherAccess as any).warning && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm">
                    <strong>警告:</strong> {(teacherAccess as any).warning}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#FFD59A] bg-opacity-20 rounded-lg">
                  <div className="text-2xl font-bold text-[#4B4036] mb-2">
                    {hasTeacherAccess ? '✅ 有權限' : '❌ 無權限'}
                  </div>
                  <div className="text-sm text-[#2B3A3B]">花見老師專區</div>
                </div>
                <div className="text-center p-4 bg-[#EBC9A4] bg-opacity-20 rounded-lg">
                  <div className="text-lg font-semibold text-[#4B4036] mb-2">
                    {teacherAccess.email}
                  </div>
                  <div className="text-sm text-[#2B3A3B]">檢查的 Email</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-[#FFF9F2] rounded-lg">
                <p className="text-[#2B3A3B]">{teacherAccess.message}</p>
              </div>
            </HanamiCard>

            {/* 教師資料 */}
            {employeeData && (
              <HanamiCard className="p-6">
                <h2 className="text-xl font-semibold text-[#4B4036] mb-4">教師資料 (hanami_employee)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>ID:</strong> {employeeData.id}</p>
                    <p><strong>Email:</strong> {employeeData.teacher_email}</p>
                    <p><strong>姓名:</strong> {employeeData.teacher_fullname || '未設定'}</p>
                    <p><strong>暱稱:</strong> {employeeData.teacher_nickname}</p>
                  </div>
                  <div>
                    <p><strong>角色:</strong> {employeeData.teacher_role || '未設定'}</p>
                    <p><strong>狀態:</strong> {employeeData.teacher_status || '未設定'}</p>
                  </div>
                </div>
              </HanamiCard>
            )}

            {/* SAAS 用戶資料 */}
            {saasUserData && (
              <HanamiCard className="p-6">
                <h2 className="text-xl font-semibold text-[#4B4036] mb-4">SAAS 用戶資料 (saas_users)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>ID:</strong> {saasUserData.id}</p>
                    <p><strong>Email:</strong> {saasUserData.email}</p>
                    <p><strong>姓名:</strong> {saasUserData.name || '未設定'}</p>
                  </div>
                  <div>
                    <p><strong>角色:</strong> {saasUserData.role || '未設定'}</p>
                    <p><strong>訂閱狀態:</strong> {saasUserData.subscription_status || '未設定'}</p>
                  </div>
                </div>
              </HanamiCard>
            )}

            {/* 無資料提示 */}
            {!employeeData && !saasUserData && (
              <HanamiCard className="p-6">
                <h2 className="text-xl font-semibold text-[#4B4036] mb-4">資料狀態</h2>
                <div className="text-center py-8">
                  <p className="text-[#2B3A3B] mb-2">❌ 該 email 不在任一資料庫中</p>
                  <p className="text-sm text-[#87704e]">
                    請確保 email 同時存在於 hanami_employee 和 saas_users 表中
                  </p>
                </div>
              </HanamiCard>
            )}
          </div>
        )}

        {/* 使用說明 */}
        <HanamiCard className="p-6 mt-8">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">使用說明</h2>
          <div className="space-y-3 text-[#2B3A3B]">
            <div>
              <h3 className="font-medium text-[#4B4036] mb-1">步驟 1: 檢查環境配置</h3>
              <p className="text-sm">點擊「檢查環境配置」按鈕，確認資料庫連接是否正常</p>
            </div>
            <div>
              <h3 className="font-medium text-[#4B4036] mb-1">步驟 2: 測試權限</h3>
              <p className="text-sm">輸入要測試的 email 地址，點擊「檢查權限」按鈕</p>
            </div>
            <div>
              <h3 className="font-medium text-[#4B4036] mb-1">步驟 3: 查看結果</h3>
              <p className="text-sm">查看檢查結果和詳細資料，確認權限狀態</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-700 mb-1">注意事項</h3>
              <ul className="text-sm text-yellow-600 space-y-1">
                <li>• 如果 SAAS 資料庫未配置，系統會自動使用簡化模式</li>
                <li>• 簡化模式只檢查 hanami_employee 表</li>
                <li>• 完整模式需要同時配置兩個資料庫</li>
                <li>• 如果顯示「有權限」，該用戶就可以看到「花見老師專區」選項</li>
              </ul>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
}

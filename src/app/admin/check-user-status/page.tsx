'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function CheckUserStatusPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('tqfea12@gmail.com');

  const checkUserStatus = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('檢查用戶完整狀態:', email);

      const response = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`檢查失敗: ${response.status}`);
      }

      const data = await response.json();
      
      let statusInfo = `=== 用戶完整狀態檢查 ===\n`;
      statusInfo += `郵箱: ${email}\n`;
      statusInfo += `檢查時間: ${new Date().toLocaleString()}\n\n`;

      // 檢查註冊申請
      statusInfo += `=== 註冊申請 ===\n`;
      if (data.registration_requests?.found) {
        const requests = data.registration_requests.data;
        const request = Array.isArray(requests) ? requests[0] : requests;
        statusInfo += `✅ 找到註冊申請\n`;
        statusInfo += `- ID: ${request?.id || 'N/A'}\n`;
        statusInfo += `- 狀態: ${request?.status || 'N/A'}\n`;
        statusInfo += `- 角色: ${request?.role || 'N/A'}\n`;
        statusInfo += `- 姓名: ${request?.full_name || 'N/A'}\n`;
        statusInfo += `- 創建時間: ${request?.created_at || 'N/A'}\n`;
        statusInfo += `- 密碼: ${request?.additional_info?.password ? '✅ 已記錄' : '❌ 未記錄'}\n`;
      } else {
        statusInfo += `❌ 未找到註冊申請\n`;
      }

      // 檢查權限記錄
      statusInfo += `\n=== 權限記錄 ===\n`;
      if (data.hanami_user_permissions_v2?.found) {
        const permissions = data.hanami_user_permissions_v2.data;
        const permission = Array.isArray(permissions) ? permissions[0] : permissions;
        statusInfo += `✅ 找到權限記錄\n`;
        statusInfo += `- ID: ${permission?.id || 'N/A'}\n`;
        statusInfo += `- 狀態: ${permission?.status || 'N/A'}\n`;
        statusInfo += `- 角色: ${permission?.hanami_roles?.role_name || 'N/A'}\n`;
        statusInfo += `- 創建時間: ${permission?.created_at || 'N/A'}\n`;
        statusInfo += `- 是否激活: ${permission?.is_active ? '✅ 是' : '❌ 否'}\n`;
      } else {
        statusInfo += `❌ 未找到權限記錄\n`;
      }

      // 檢查用戶帳號
      statusInfo += `\n=== 用戶帳號 ===\n`;
      
      if (data.hanami_admin?.found) {
        const admin = data.hanami_admin.data;
        statusInfo += `✅ 找到管理員帳號\n`;
        statusInfo += `- ID: ${admin?.id || 'N/A'}\n`;
        statusInfo += `- 姓名: ${admin?.admin_name || 'N/A'}\n`;
        statusInfo += `- 密碼: ${admin?.admin_password ? '✅ 已設置' : '❌ 未設置'}\n`;
        statusInfo += `- 創建時間: ${admin?.created_at || 'N/A'}\n`;
      } else if (data.hanami_employee?.found) {
        const employee = data.hanami_employee.data;
        statusInfo += `✅ 找到教師帳號\n`;
        statusInfo += `- ID: ${employee?.id || 'N/A'}\n`;
        statusInfo += `- 姓名: ${employee?.teacher_fullname || 'N/A'}\n`;
        statusInfo += `- 暱稱: ${employee?.teacher_nickname || 'N/A'}\n`;
        statusInfo += `- 狀態: ${employee?.teacher_status || 'N/A'}\n`;
        statusInfo += `- 密碼: ${employee?.teacher_password ? '✅ 已設置' : '❌ 未設置'}\n`;
        statusInfo += `- 創建時間: ${employee?.created_at || 'N/A'}\n`;
      } else if (data.Hanami_Students?.found) {
        const student = data.Hanami_Students.data;
        statusInfo += `✅ 找到學生帳號\n`;
        statusInfo += `- ID: ${student?.id || 'N/A'}\n`;
        statusInfo += `- 姓名: ${student?.full_name || 'N/A'}\n`;
        statusInfo += `- 密碼: ${student?.student_password ? '✅ 已設置' : '❌ 未設置'}\n`;
        statusInfo += `- 創建時間: ${student?.created_at || 'N/A'}\n`;
      } else {
        statusInfo += `❌ 未找到任何用戶帳號\n`;
      }

      // 問題診斷
      statusInfo += `\n=== 問題診斷 ===\n`;
      
      const hasPermissions = data.hanami_user_permissions_v2?.found;
      const hasAccount = data.hanami_admin?.found || data.hanami_employee?.found || data.Hanami_Students?.found;
      const hasRequest = data.registration_requests?.found;

      if (hasPermissions && hasAccount) {
        statusInfo += `✅ 狀態正常：權限記錄和用戶帳號都存在\n`;
        statusInfo += `💡 用戶應該可以正常登入\n`;
      } else if (!hasPermissions) {
        statusInfo += `❌ 問題：沒有權限記錄\n`;
        statusInfo += `💡 需要創建權限記錄\n`;
      } else if (!hasAccount) {
        statusInfo += `❌ 問題：沒有用戶帳號\n`;
        statusInfo += `💡 需要創建用戶帳號\n`;
      }

      if (hasRequest) {
        statusInfo += `⚠️ 註冊申請仍然存在（應該被刪除）\n`;
      }

      setResult(statusInfo);

    } catch (error) {
      console.error('檢查用戶狀態錯誤:', error);
      setResult(`❌ 檢查用戶狀態失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('測試用戶登入:', email);

      // 嘗試不同的密碼
      const passwords = ['hanami123', 'real123456', 'password123', '123456'];
      let loginSuccess = false;
      let loginResult = '';

      loginResult += `=== 登入測試 ===\n`;
      loginResult += `郵箱: ${email}\n\n`;

      for (const password of passwords) {
        try {
          const loginResponse = await fetch('/api/auth/login-table-based', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              password: password
            })
          });

          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            loginSuccess = true;
            loginResult += `✅ 登入成功！\n`;
            loginResult += `使用的密碼: ${password}\n`;
            loginResult += `用戶信息:\n`;
            loginResult += `- ID: ${loginData.user?.id || 'N/A'}\n`;
            loginResult += `- 郵箱: ${loginData.user?.email || 'N/A'}\n`;
            loginResult += `- 角色: ${loginData.user?.role || 'N/A'}\n`;
            loginResult += `- 姓名: ${loginData.user?.name || 'N/A'}\n`;
            break;
          } else {
            loginResult += `❌ 密碼 ${password} 登入失敗: ${loginData.error || '未知錯誤'}\n`;
          }
        } catch (error) {
          loginResult += `❌ 密碼 ${password} 登入錯誤: ${error instanceof Error ? error.message : '未知錯誤'}\n`;
        }
      }

      if (!loginSuccess) {
        loginResult += `\n❌ 所有密碼都登入失敗\n`;
        loginResult += `💡 可能需要檢查用戶帳號是否正確創建\n`;
      } else {
        loginResult += `\n🎉 登入測試成功！\n`;
      }

      setResult(loginResult);

    } catch (error) {
      console.error('登入測試錯誤:', error);
      setResult(`❌ 登入測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">用戶狀態檢查</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">檢查設置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入要檢查的郵箱地址"
              />
            </div>
          </div>
        </HanamiCard>

        {/* 操作區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">檢查操作</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={checkUserStatus}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查用戶完整狀態'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testLogin}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '測試中...' : '測試用戶登入'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">檢查結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
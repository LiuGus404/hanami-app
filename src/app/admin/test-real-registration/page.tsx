'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestRealRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('real-test@example.com');

  const testRealRegistration = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('開始測試真實註冊流程:', email);

      // 1. 創建真實註冊申請（模擬註冊頁面）
      const registerResponse = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          full_name: '真實測試教師',
          phone: '987654321',
          role: 'teacher',
          additional_info: {
            password: 'real123456',
            teacherBackground: '真實背景',
            teacherBankId: 'REAL123',
            teacherAddress: '真實地址'
          }
        })
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(`註冊失敗: ${errorData.error || '未知錯誤'}`);
      }

      const registerData = await registerResponse.json();
      console.log('註冊成功:', registerData);

      setResult(`✅ 註冊申請創建成功！\n\n註冊詳情:\n${JSON.stringify(registerData, null, 2)}\n\n現在可以測試批准流程了！`);

    } catch (error) {
      console.error('註冊測試錯誤:', error);
      setResult(`❌ 註冊測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testRealApproval = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('測試真實批准流程:', email);

      // 1. 獲取註冊申請
      const getResponse = await fetch('/api/registration-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        throw new Error(`獲取申請列表失敗: ${getResponse.status}`);
      }

      const getData = await getResponse.json();
      const request = getData.data?.find((r: any) => r.email === email);

      if (!request) {
        setResult('❌ 找不到註冊申請，請先創建一個');
        return;
      }

      console.log('找到申請:', request);

      // 2. 批准申請（使用修復後的流程）
      const approveResponse = await fetch('/api/registration-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.id,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        }),
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json();
        throw new Error(`批准失敗: ${errorData.error || '未知錯誤'}`);
      }

      const approveData = await approveResponse.json();
      console.log('批准結果:', approveData);

      setResult(`✅ 真實批准流程測試完成！\n\n批准詳情:\n${JSON.stringify(approveData, null, 2)}\n\n現在檢查用戶帳號是否已創建...`);

    } catch (error) {
      console.error('批准流程測試錯誤:', error);
      setResult(`❌ 批准流程測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRealUserAccount = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('檢查真實用戶帳號:', email);

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
      
      let statusInfo = `=== 真實用戶帳號檢查 ===\n`;
      statusInfo += `郵箱: ${email}\n\n`;

      // 檢查權限記錄
      statusInfo += `=== 權限記錄 ===\n`;
      if (data.hanami_user_permissions_v2?.found) {
        const permissions = data.hanami_user_permissions_v2.data;
        const permission = Array.isArray(permissions) ? permissions[0] : permissions;
        statusInfo += `✅ 找到權限記錄\n`;
        statusInfo += `- 狀態: ${permission?.status || 'N/A'}\n`;
        statusInfo += `- 角色: ${permission?.hanami_roles?.role_name || 'N/A'}\n`;
        statusInfo += `- 創建時間: ${permission?.created_at || 'N/A'}\n`;
      } else {
        statusInfo += `❌ 未找到權限記錄\n`;
      }

      // 檢查用戶帳號
      statusInfo += `\n=== 用戶帳號 ===\n`;
      if (data.hanami_employee?.found) {
        const employees = data.hanami_employee.data;
        const employee = Array.isArray(employees) ? employees[0] : employees;
        statusInfo += `✅ 找到教師帳號\n`;
        statusInfo += `- 姓名: ${employee?.teacher_fullname || 'N/A'}\n`;
        statusInfo += `- 暱稱: ${employee?.teacher_nickname || 'N/A'}\n`;
        statusInfo += `- 狀態: ${employee?.teacher_status || 'N/A'}\n`;
        statusInfo += `- 密碼: ${employee?.teacher_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      } else {
        statusInfo += `❌ 未找到教師帳號\n`;
      }

      // 檢查註冊申請
      statusInfo += `\n=== 註冊申請 ===\n`;
      if (data.registration_requests?.found) {
        statusInfo += `⚠️ 註冊申請仍然存在（應該被刪除）\n`;
      } else {
        statusInfo += `✅ 註冊申請已刪除（正確）\n`;
      }

      // 問題診斷
      statusInfo += `\n=== 問題診斷 ===\n`;
      if (data.hanami_user_permissions_v2?.found && data.hanami_employee?.found) {
        statusInfo += `✅ 狀態正常：權限記錄和用戶帳號都存在\n`;
        statusInfo += `💡 現在可以測試登入了！\n`;
      } else if (!data.hanami_user_permissions_v2?.found) {
        statusInfo += `❌ 問題：沒有權限記錄\n`;
      } else if (!data.hanami_employee?.found) {
        statusInfo += `❌ 問題：沒有用戶帳號\n`;
      }

      setResult(statusInfo);

    } catch (error) {
      console.error('檢查用戶帳號錯誤:', error);
      setResult(`❌ 檢查用戶帳號失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testRealLogin = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('測試真實登入:', email);

      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: 'real123456'
        })
      });

      const data = await response.json();
      
      let loginInfo = `=== 真實登入測試結果 ===\n`;
      loginInfo += `郵箱: ${email}\n`;
      loginInfo += `密碼: real123456\n`;
      loginInfo += `狀態碼: ${response.status}\n`;
      loginInfo += `成功: ${response.ok}\n`;
      loginInfo += `響應數據:\n${JSON.stringify(data, null, 2)}\n`;

      if (response.ok) {
        loginInfo += `\n🎉 恭喜！真實註冊流程測試成功！\n`;
        loginInfo += `✅ 註冊 → 批准 → 登入 完整流程都正常工作！\n`;
      } else {
        loginInfo += `\n❌ 登入失敗，需要進一步調試\n`;
      }

      setResult(loginInfo);

    } catch (error) {
      console.error('登入測試錯誤:', error);
      setResult(`❌ 登入測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">真實註冊流程測試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試設置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入郵箱地址"
              />
            </div>
          </div>
        </HanamiCard>

        {/* 操作區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試操作</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={testRealRegistration}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '註冊中...' : '1. 測試真實註冊'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testRealApproval}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '批准中...' : '2. 測試真實批准'}
            </HanamiButton>
            
            <HanamiButton
              onClick={checkRealUserAccount}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? '檢查中...' : '3. 檢查用戶帳號'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testRealLogin}
              disabled={loading}
              variant="soft"
              className="w-full"
            >
              {loading ? '測試中...' : '4. 測試真實登入'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
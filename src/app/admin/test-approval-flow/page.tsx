'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestApprovalFlowPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('test-teacher@example.com');

  const createTestRequest = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('創建測試註冊申請:', email);

      const response = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          full_name: '測試教師',
          phone: '123456789',
          role: 'teacher',
          additional_info: {
            password: 'test123456',
            teacherBackground: '測試背景',
            teacherBankId: 'TEST123',
            teacherAddress: '測試地址'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`創建失敗: ${errorData.error || '未知錯誤'}`);
      }

      const data = await response.json();
      console.log('創建結果:', data);

      setResult(`✅ 測試註冊申請創建成功！\n\n申請詳情:\n${JSON.stringify(data, null, 2)}\n\n現在可以測試批准流程了！`);

    } catch (error) {
      console.error('創建測試申請錯誤:', error);
      setResult(`❌ 創建測試申請失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testApprovalFlow = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('測試批准流程:', email);

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
        setResult('❌ 找不到測試註冊申請，請先創建一個');
        return;
      }

      console.log('找到申請:', request);

      // 2. 批准申請
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

      setResult(`✅ 批准流程測試完成！\n\n批准詳情:\n${JSON.stringify(approveData, null, 2)}\n\n現在檢查用戶帳號是否已創建...`);

    } catch (error) {
      console.error('批准流程測試錯誤:', error);
      setResult(`❌ 批准流程測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccount = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('檢查用戶帳號:', email);

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
      
      let statusInfo = `=== 用戶帳號檢查 ===\n`;
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

      setResult(statusInfo);

    } catch (error) {
      console.error('檢查用戶帳號錯誤:', error);
      setResult(`❌ 檢查用戶帳號失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
      console.log('測試登入:', email);

      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: 'test123456'
        })
      });

      const data = await response.json();
      
      let loginInfo = `=== 登入測試結果 ===\n`;
      loginInfo += `郵箱: ${email}\n`;
      loginInfo += `密碼: test123456\n`;
      loginInfo += `狀態碼: ${response.status}\n`;
      loginInfo += `成功: ${response.ok}\n`;
      loginInfo += `響應數據:\n${JSON.stringify(data, null, 2)}\n`;

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
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">批准流程測試工具</h1>
      
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
              onClick={createTestRequest}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試申請'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testApprovalFlow}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '測試中...' : '測試批准流程'}
            </HanamiButton>
            
            <HanamiButton
              onClick={checkUserAccount}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查用戶帳號'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testLogin}
              disabled={loading}
              variant="soft"
              className="w-full"
            >
              {loading ? '測試中...' : '測試登入'}
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
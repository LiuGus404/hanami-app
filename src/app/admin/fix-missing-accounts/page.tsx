'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function FixMissingAccountsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('liugushk@gmail.com');

  const fixMissingAccount = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('開始修復缺少的用戶帳號:', email);

      // 1. 檢查當前狀態
      const statusResponse = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!statusResponse.ok) {
        throw new Error(`檢查狀態失敗: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log('當前狀態:', statusData);

      // 2. 檢查是否有權限記錄但沒有用戶帳號
      if (statusData.hanami_user_permissions_v2?.found && !statusData.hanami_employee?.found) {
        console.log('發現問題：有權限記錄但沒有用戶帳號');
        
        // 3. 使用新的直接創建API
        const createResponse = await fetch('/api/create-teacher-account-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: email,
            password: '12543256c' // 使用已知的密碼
          })
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(`創建失敗: ${errorData.error || '未知錯誤'}`);
        }

        const createData = await createResponse.json();
        console.log('創建結果:', createData);

        setResult(`✅ 修復完成！\n\n創建詳情:\n${JSON.stringify(createData, null, 2)}\n\n現在用戶應該可以登入了！`);

      } else if (!statusData.hanami_user_permissions_v2?.found) {
        setResult('❌ 沒有找到權限記錄，無法修復');
      } else if (statusData.hanami_employee?.found) {
        setResult('✅ 用戶帳號已存在，無需修復');
      } else {
        setResult('❌ 狀態異常，請檢查詳細信息');
      }

    } catch (error) {
      console.error('修復錯誤:', error);
      setResult(`❌ 修復失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`檢查狀態失敗: ${response.status}`);
      }

      const data = await response.json();
      
      let statusInfo = `=== 用戶狀態檢查 ===\n`;
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

      if (data.hanami_admin?.found) {
        const admins = data.hanami_admin.data;
        const admin = Array.isArray(admins) ? admins[0] : admins;
        statusInfo += `✅ 找到管理員帳號\n`;
        statusInfo += `- 姓名: ${admin?.admin_name || 'N/A'}\n`;
        statusInfo += `- 密碼: ${admin?.admin_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      }

      if (data.Hanami_Students?.found) {
        const students = data.Hanami_Students.data;
        const student = Array.isArray(students) ? students[0] : students;
        statusInfo += `✅ 找到學生帳號\n`;
        statusInfo += `- 姓名: ${student?.full_name || 'N/A'}\n`;
        statusInfo += `- 密碼: ${student?.student_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      }

      // 問題診斷
      statusInfo += `\n=== 問題診斷 ===\n`;
      if (data.hanami_user_permissions_v2?.found && !data.hanami_employee?.found && !data.hanami_admin?.found && !data.Hanami_Students?.found) {
        statusInfo += `⚠️ 發現問題：有權限記錄但沒有用戶帳號\n`;
        statusInfo += `💡 建議：使用修復功能創建缺少的用戶帳號\n`;
      } else if (data.hanami_user_permissions_v2?.found && (data.hanami_employee?.found || data.hanami_admin?.found || data.Hanami_Students?.found)) {
        statusInfo += `✅ 狀態正常：權限記錄和用戶帳號都存在\n`;
      } else if (!data.hanami_user_permissions_v2?.found) {
        statusInfo += `❌ 問題：沒有權限記錄\n`;
      }

      setResult(statusInfo);

    } catch (error) {
      console.error('檢查狀態錯誤:', error);
      setResult(`❌ 檢查狀態失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const manualCreateAccount = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('手動創建用戶帳號:', email);

      // 使用 create-user-account-manual API
      const response = await fetch('/api/create-user-account-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          fullName: 'dsa', // 使用已知的姓名
          role: 'teacher',
          password: '12543256c' // 使用已知的密碼
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`創建失敗: ${errorData.error || '未知錯誤'}`);
      }

      const data = await response.json();
      console.log('創建結果:', data);

      setResult(`✅ 手動創建成功！\n\n創建詳情:\n${JSON.stringify(data, null, 2)}\n\n現在用戶應該可以登入了！`);

    } catch (error) {
      console.error('手動創建錯誤:', error);
      setResult(`❌ 手動創建失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">修復缺少的用戶帳號</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">用戶信息</h2>
          
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
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">操作選項</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={checkStatus}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查用戶狀態'}
            </HanamiButton>
            
            <HanamiButton
              onClick={fixMissingAccount}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '修復中...' : '自動修復帳號'}
            </HanamiButton>
            
            <HanamiButton
              onClick={manualCreateAccount}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? '創建中...' : '手動創建帳號'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">操作結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
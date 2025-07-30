'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestRegistrationFlowPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('');

  // 安全的 JSON 序列化函數，處理循環引用
  const safeStringify = (obj: any, space?: number): string => {
    try {
      return JSON.stringify(obj, (key, value) => {
        // 過濾掉函數和循環引用
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (value === undefined) {
          return '[Undefined]';
        }
        return value;
      }, space);
    } catch (error) {
      return `[無法序列化: ${error instanceof Error ? error.message : '未知錯誤'}]`;
    }
  };

  const testRegistrationFlow = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      let debugInfo = `=== 註冊流程測試 ===\n`;
      debugInfo += `郵箱: ${email}\n\n`;

      // 1. 檢查註冊申請
      debugInfo += `步驟 1: 檢查註冊申請...\n`;
      const regResponse = await fetch(`/api/test-check-registration-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (!regResponse.ok) {
        const errorData = await regResponse.json();
        throw new Error(`API 請求失敗: ${regResponse.status} - ${errorData.error || '未知錯誤'}`);
      }
      
      const regData = await regResponse.json();

      if (regData.registration_requests?.found) {
        const requests = regData.registration_requests.data;
        debugInfo += `✅ 找到 ${requests.length} 個註冊申請:\n`;
        
        requests.forEach((req: any, index: number) => {
          debugInfo += `\n申請 ${index + 1}:\n`;
          debugInfo += `- ID: ${req.id || 'N/A'}\n`;
          debugInfo += `- 狀態: ${req.status || 'N/A'}\n`;
          debugInfo += `- 角色: ${req.role || 'N/A'}\n`;
          debugInfo += `- 姓名: ${req.full_name || 'N/A'}\n`;
          debugInfo += `- 電話: ${req.phone || 'N/A'}\n`;
          debugInfo += `- 創建時間: ${req.created_at || 'N/A'}\n`;
          
          // 安全處理 additional_info
          try {
            const additionalInfo = req.additional_info || {};
            debugInfo += `- 額外信息: ${safeStringify(additionalInfo, 2)}\n`;
            
            if (additionalInfo.password) {
              debugInfo += `- 密碼: ✅ 已記錄 (${additionalInfo.password.length} 字符)\n`;
            } else {
              debugInfo += `- 密碼: ❌ 未記錄\n`;
            }
          } catch (error) {
            debugInfo += `- 額外信息: [處理錯誤]\n`;
            debugInfo += `- 密碼: ❌ 無法檢查\n`;
          }
        });
      } else {
        debugInfo += `❌ 未找到註冊申請\n`;
        setResult(debugInfo);
        return;
      }

      // 2. 檢查權限記錄
      debugInfo += `\n步驟 2: 檢查權限記錄...\n`;
      if (regData.hanami_user_permissions_v2?.found) {
        const permissions = regData.hanami_user_permissions_v2.data;
        debugInfo += `✅ 找到 ${permissions.length} 個權限記錄:\n`;
        permissions.forEach((perm: any, index: number) => {
          debugInfo += `\n權限記錄 ${index + 1}:\n`;
          debugInfo += `- ID: ${perm.id || 'N/A'}\n`;
          debugInfo += `- 狀態: ${perm.status || 'N/A'}\n`;
          debugInfo += `- 角色: ${perm.hanami_roles?.role_name || 'N/A'}\n`;
          debugInfo += `- 創建時間: ${perm.created_at || 'N/A'}\n`;
        });
      } else {
        debugInfo += `❌ 未找到權限記錄\n`;
      }

      // 3. 檢查用戶帳號
      debugInfo += `\n步驟 3: 檢查用戶帳號...\n`;
      
      // 管理員帳號
      if (regData.hanami_admin?.found) {
        const adminData = regData.hanami_admin.data;
        debugInfo += `✅ 找到管理員帳號:\n`;
        debugInfo += `- ID: ${adminData.id || 'N/A'}\n`;
        debugInfo += `- 姓名: ${adminData.admin_name || 'N/A'}\n`;
        debugInfo += `- 密碼: ${adminData.admin_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      } else {
        debugInfo += `❌ 未找到管理員帳號\n`;
      }

      // 教師帳號
      if (regData.hanami_employee?.found) {
        const teacherData = regData.hanami_employee.data;
        debugInfo += `✅ 找到教師帳號:\n`;
        debugInfo += `- ID: ${teacherData.id || 'N/A'}\n`;
        debugInfo += `- 姓名: ${teacherData.teacher_fullname || 'N/A'}\n`;
        debugInfo += `- 暱稱: ${teacherData.teacher_nickname || 'N/A'}\n`;
        debugInfo += `- 密碼: ${teacherData.teacher_password ? '✅ 已設置' : '❌ 未設置'}\n`;
        debugInfo += `- 角色: ${teacherData.teacher_role || 'N/A'}\n`;
        debugInfo += `- 狀態: ${teacherData.teacher_status || 'N/A'}\n`;
      } else {
        debugInfo += `❌ 未找到教師帳號\n`;
      }

      // 學生帳號
      if (regData.Hanami_Students?.found) {
        const studentData = regData.Hanami_Students.data;
        debugInfo += `✅ 找到學生帳號:\n`;
        debugInfo += `- ID: ${studentData.id || 'N/A'}\n`;
        debugInfo += `- 姓名: ${studentData.full_name || 'N/A'}\n`;
        debugInfo += `- 密碼: ${studentData.student_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      } else {
        debugInfo += `❌ 未找到學生帳號\n`;
      }

      // 4. 分析問題
      debugInfo += `\n步驟 4: 問題分析...\n`;
      try {
        const request = regData.registration_requests.data[0];
        
        if (request && request.status === 'approved') {
          debugInfo += `✅ 註冊申請已批准\n`;
          
          if (regData.hanami_user_permissions_v2?.found) {
            debugInfo += `✅ 權限記錄已創建\n`;
          } else {
            debugInfo += `❌ 權限記錄未創建\n`;
          }
          
          const hasUserAccount = regData.hanami_admin?.found || 
                               regData.hanami_employee?.found || 
                               regData.Hanami_Students?.found;
          
          if (hasUserAccount) {
            debugInfo += `✅ 用戶帳號已創建\n`;
          } else {
            debugInfo += `❌ 用戶帳號未創建 - 這是問題所在！\n`;
            debugInfo += `可能原因:\n`;
            debugInfo += `1. createUserAccount 函數沒有被調用\n`;
            debugInfo += `2. createUserAccount 函數執行失敗\n`;
            debugInfo += `3. 資料庫約束問題\n`;
            debugInfo += `4. RLS 政策阻止插入\n`;
          }
        } else {
          debugInfo += `⚠️ 註冊申請狀態: ${request?.status || '未知'}\n`;
        }
      } catch (error) {
        debugInfo += `❌ 問題分析失敗: ${error instanceof Error ? error.message : '未知錯誤'}\n`;
      }

      setResult(debugInfo);

    } catch (error) {
      console.error('測試註冊流程錯誤:', error);
      setResult(`❌ 測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testTeacherInsert = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/test-teacher-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          fullName: '測試教師',
          phone: '12345678',
          password: 'test123456'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 教師插入測試成功:\n${safeStringify(data, 2)}`);
      } else {
        setResult(`❌ 教師插入測試失敗:\n${safeStringify(data, 2)}`);
      }

    } catch (error) {
      console.error('教師插入測試錯誤:', error);
      setResult(`❌ 教師插入測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const fixApprovedAccount = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/fix-approved-accounts-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 修復成功:\n${safeStringify(data, 2)}`);
      } else {
        setResult(`❌ 修復失敗:\n${safeStringify(data, 2)}`);
      }

    } catch (error) {
      console.error('修復帳號錯誤:', error);
      setResult(`❌ 修復帳號錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">註冊流程測試工具</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測試輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試輸入</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入要測試的郵箱"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <HanamiButton
                onClick={testRegistrationFlow}
                disabled={loading || !email}
                variant="primary"
              >
                {loading ? '測試中...' : '測試註冊流程'}
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>

        {/* 測試工具區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試工具</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={testTeacherInsert}
              disabled={loading || !email}
              variant="cute"
              className="w-full"
            >
              {loading ? '測試中...' : '測試教師插入'}
            </HanamiButton>
            
            <HanamiButton
              onClick={fixApprovedAccount}
              disabled={loading || !email}
              variant="danger"
              className="w-full"
            >
              {loading ? '修復中...' : '修復已批准帳號'}
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
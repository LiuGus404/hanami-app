'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function DebugRegistrationPage() {
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

  const debugRegistration = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      // 1. 檢查註冊申請
      const regResponse = await fetch(`/api/test-check-registration-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      const regData = await regResponse.json();

      let debugInfo = `=== 註冊申請調試 ===\n`;
      debugInfo += `郵箱: ${email}\n\n`;

      // 2. 檢查註冊申請詳情
      if (regData.registration_requests?.found) {
        const requests = regData.registration_requests.data;
        debugInfo += `找到 ${requests.length} 個註冊申請:\n`;
        
        requests.forEach((req: any, index: number) => {
          debugInfo += `\n申請 ${index + 1}:\n`;
          debugInfo += `- ID: ${req.id}\n`;
          debugInfo += `- 狀態: ${req.status}\n`;
          debugInfo += `- 角色: ${req.role}\n`;
          debugInfo += `- 姓名: ${req.full_name}\n`;
          debugInfo += `- 電話: ${req.phone}\n`;
          debugInfo += `- 創建時間: ${req.created_at}\n`;
          debugInfo += `- 額外信息: ${safeStringify(req.additional_info || {}, 2)}\n`;
          
          // 檢查密碼是否存在
          if (req.additional_info?.password) {
            debugInfo += `- 密碼: ✅ 已記錄 (${req.additional_info.password.length} 字符)\n`;
          } else {
            debugInfo += `- 密碼: ❌ 未記錄\n`;
          }
        });
      } else {
        debugInfo += `❌ 未找到註冊申請\n`;
      }

      // 3. 檢查權限記錄
      debugInfo += `\n=== 權限記錄檢查 ===\n`;
      if (regData.hanami_user_permissions_v2?.found) {
        const permissions = regData.hanami_user_permissions_v2.data;
        debugInfo += `找到 ${permissions.length} 個權限記錄:\n`;
        permissions.forEach((perm: any, index: number) => {
          debugInfo += `\n權限記錄 ${index + 1}:\n`;
          debugInfo += `- ID: ${perm.id}\n`;
          debugInfo += `- 狀態: ${perm.status}\n`;
          debugInfo += `- 角色: ${perm.hanami_roles?.role_name}\n`;
          debugInfo += `- 創建時間: ${perm.created_at}\n`;
        });
      } else {
        debugInfo += `❌ 未找到權限記錄\n`;
      }

      // 4. 檢查用戶帳號
      debugInfo += `\n=== 用戶帳號檢查 ===\n`;
      
      // 管理員帳號
      if (regData.hanami_admin?.found) {
        debugInfo += `✅ 找到管理員帳號:\n`;
        debugInfo += `- ID: ${regData.hanami_admin.data.id}\n`;
        debugInfo += `- 姓名: ${regData.hanami_admin.data.admin_name}\n`;
        debugInfo += `- 密碼: ${regData.hanami_admin.data.admin_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      } else {
        debugInfo += `❌ 未找到管理員帳號\n`;
      }

      // 教師帳號
      if (regData.hanami_employee?.found) {
        debugInfo += `✅ 找到教師帳號:\n`;
        debugInfo += `- ID: ${regData.hanami_employee.data.id}\n`;
        debugInfo += `- 姓名: ${regData.hanami_employee.data.teacher_fullname}\n`;
        debugInfo += `- 密碼: ${regData.hanami_employee.data.teacher_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      } else {
        debugInfo += `❌ 未找到教師帳號\n`;
      }

      // 學生帳號
      if (regData.Hanami_Students?.found) {
        debugInfo += `✅ 找到學生帳號:\n`;
        debugInfo += `- ID: ${regData.Hanami_Students.data.id}\n`;
        debugInfo += `- 姓名: ${regData.Hanami_Students.data.full_name}\n`;
        debugInfo += `- 密碼: ${regData.Hanami_Students.data.student_password ? '✅ 已設置' : '❌ 未設置'}\n`;
      } else {
        debugInfo += `❌ 未找到學生帳號\n`;
      }

      setResult(debugInfo);

    } catch (error) {
      console.error('調試註冊錯誤:', error);
      setResult(`❌ 調試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateUser = async (role: 'admin' | 'teacher' | 'parent') => {
    setLoading(true);
    setResult('');

    try {
      const testEmail = `test_${role}_${Date.now()}@example.com`;
      const testPassword = 'test123456';

      const response = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          full_name: `測試${role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}`,
          phone: '12345678',
          role: role,
          additional_info: {
            password: testPassword
          }
        })
      });

      const regData = await response.json();
      
      if (response.ok) {
        setResult(`✅ 測試註冊申請創建成功:\n角色: ${role}\n郵箱: ${testEmail}\n密碼: ${testPassword}\n\n${safeStringify(regData, 2)}`);
        
        // 自動填入測試郵箱
        setEmail(testEmail);
      } else {
        setResult(`❌ 測試註冊申請創建失敗:\n${safeStringify(regData, 2)}`);
      }

    } catch (error) {
      console.error('創建測試用戶錯誤:', error);
      setResult(`❌ 創建測試用戶錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const approveTestUser = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/registration-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: email, // 這裡需要實際的申請 ID，暫時用郵箱
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
      });

      const approveData = await response.json();
      
      if (response.ok) {
        setResult(`✅ 測試用戶批准成功:\n${safeStringify(approveData, 2)}`);
      } else {
        setResult(`❌ 測試用戶批准失敗:\n${safeStringify(approveData, 2)}`);
      }

    } catch (error) {
      console.error('批准測試用戶錯誤:', error);
      setResult(`❌ 批准測試用戶錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">註冊申請調試工具</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 調試輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試輸入</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(value) => setEmail(value)}
                placeholder="請輸入要調試的郵箱"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <HanamiButton
                onClick={debugRegistration}
                disabled={loading || !email}
                variant="primary"
              >
                {loading ? '調試中...' : '調試註冊申請'}
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>

        {/* 測試工具區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試工具</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={() => testCreateUser('admin')}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試管理員申請'}
            </HanamiButton>
            
            <HanamiButton
              onClick={() => testCreateUser('teacher')}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試教師申請'}
            </HanamiButton>
            
            <HanamiButton
              onClick={() => testCreateUser('parent')}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試家長申請'}
            </HanamiButton>
            
            <HanamiButton
              onClick={approveTestUser}
              disabled={loading || !email}
              variant="success"
              className="w-full"
            >
              {loading ? '批准中...' : '批准測試用戶'}
            </HanamiButton>
            
            <HanamiButton
              onClick={fixApprovedAccount}
              disabled={loading || !email}
              variant="danger"
              className="w-full"
            >
              {loading ? '修復中...' : '修復已批准帳號'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testTeacherInsert}
              disabled={loading || !email}
              variant="soft"
              className="w-full"
            >
              {loading ? '測試中...' : '測試教師插入'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
}
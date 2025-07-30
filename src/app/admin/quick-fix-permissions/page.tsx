'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function QuickFixPermissionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('');

  const quickFixPermissions = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('快速修復權限記錄:', email);

      // 1. 檢查用戶狀態
      const checkResponse = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!checkResponse.ok) {
        throw new Error(`檢查失敗: ${checkResponse.status}`);
      }

      const checkData = await checkResponse.json();
      
      let fixInfo = `=== 快速修復權限記錄 ===\n`;
      fixInfo += `郵箱: ${email}\n\n`;

      // 檢查現有狀態
      fixInfo += `=== 當前狀態檢查 ===\n`;
      
      const hasPermissions = checkData.hanami_user_permissions_v2?.found;
      const hasAdminAccount = checkData.hanami_admin?.found;
      const hasTeacherAccount = checkData.hanami_employee?.found;
      const hasStudentAccount = checkData.Hanami_Students?.found;

      fixInfo += `權限記錄: ${hasPermissions ? '✅ 存在' : '❌ 缺失'}\n`;
      fixInfo += `管理員帳號: ${hasAdminAccount ? '✅ 存在' : '❌ 不存在'}\n`;
      fixInfo += `教師帳號: ${hasTeacherAccount ? '✅ 存在' : '❌ 不存在'}\n`;
      fixInfo += `學生帳號: ${hasStudentAccount ? '✅ 存在' : '❌ 不存在'}\n\n`;

      // 確定角色
      let role = 'teacher'; // 默認
      if (hasAdminAccount) {
        role = 'admin';
      } else if (hasTeacherAccount) {
        role = 'teacher';
      } else if (hasStudentAccount) {
        role = 'parent';
      }

      fixInfo += `檢測到的角色: ${role}\n\n`;

      // 2. 如果沒有權限記錄，創建一個
      if (!hasPermissions) {
        fixInfo += `=== 創建權限記錄 ===\n`;
        
        const createResponse = await fetch('/api/create-permissions-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            role: role
          })
        });

        const createData = await createResponse.json();
        
        fixInfo += `創建請求狀態: ${createResponse.status}\n`;
        fixInfo += `創建響應:\n${JSON.stringify(createData, null, 2)}\n`;

        if (createResponse.ok) {
          fixInfo += `\n✅ 權限記錄創建成功！\n`;
        } else {
          fixInfo += `\n❌ 權限記錄創建失敗！\n`;
          fixInfo += `錯誤: ${createData.error || '未知錯誤'}\n`;
        }
      } else {
        fixInfo += `✅ 權限記錄已存在，無需創建\n`;
      }

      // 3. 測試登入
      fixInfo += `\n=== 測試登入 ===\n`;
      
      // 嘗試不同的密碼
      const passwords = ['hanami123', 'real123456', 'password123'];
      let loginSuccess = false;
      let loginResult = '';

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
            loginResult = `✅ 登入成功！\n`;
            loginResult += `使用的密碼: ${password}\n`;
            loginResult += `用戶信息: ${JSON.stringify(loginData.user, null, 2)}\n`;
            break;
          } else {
            loginResult += `❌ 密碼 ${password} 登入失敗: ${loginData.error || '未知錯誤'}\n`;
          }
        } catch (error) {
          loginResult += `❌ 密碼 ${password} 登入錯誤: ${error instanceof Error ? error.message : '未知錯誤'}\n`;
        }
      }

      fixInfo += loginResult;

      if (loginSuccess) {
        fixInfo += `\n🎉 修復成功！用戶現在可以正常登入了！\n`;
      } else {
        fixInfo += `\n⚠️ 權限記錄已修復，但登入仍失敗，可能需要檢查密碼\n`;
      }

      setResult(fixInfo);

    } catch (error) {
      console.error('快速修復錯誤:', error);
      setResult(`❌ 快速修復失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const batchFixAll = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('批量修復所有用戶權限記錄');

      // 1. 獲取所有用戶帳號
      const response = await fetch('/api/batch-fix-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`批量修復失敗: ${response.status}`);
      }

      const data = await response.json();
      
      let batchInfo = `=== 批量修復權限記錄 ===\n\n`;
      batchInfo += `修復結果:\n${JSON.stringify(data, null, 2)}\n`;

      if (data.success) {
        batchInfo += `\n🎉 批量修復完成！\n`;
        batchInfo += `✅ 成功修復: ${data.results?.success || 0} 個\n`;
        batchInfo += `❌ 修復失敗: ${data.results?.error || 0} 個\n`;
        batchInfo += `⏭️ 跳過: ${data.results?.skipped || 0} 個\n`;
      } else {
        batchInfo += `\n❌ 批量修復失敗！\n`;
        batchInfo += `錯誤: ${data.error || '未知錯誤'}\n`;
      }

      setResult(batchInfo);

    } catch (error) {
      console.error('批量修復錯誤:', error);
      setResult(`❌ 批量修復失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">快速修復權限記錄</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">修復設置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入需要修復的郵箱地址"
              />
            </div>
          </div>
        </HanamiCard>

        {/* 操作區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">修復操作</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={quickFixPermissions}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '修復中...' : '快速修復單個用戶'}
            </HanamiButton>
            
            <HanamiButton
              onClick={batchFixAll}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '批量修復中...' : '批量修復所有用戶'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">修復結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
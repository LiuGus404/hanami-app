'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function DebugPermissionCreationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('real-test@example.com');

  const debugPermissionCreation = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('調試權限記錄創建:', email);

      // 1. 檢查是否已有權限記錄
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
      
      let debugInfo = `=== 權限記錄創建調試 ===\n`;
      debugInfo += `郵箱: ${email}\n\n`;

      // 檢查現有權限記錄
      debugInfo += `=== 現有權限記錄檢查 ===\n`;
      if (checkData.hanami_user_permissions_v2?.found) {
        const permissions = checkData.hanami_user_permissions_v2.data;
        const permission = Array.isArray(permissions) ? permissions[0] : permissions;
        debugInfo += `⚠️ 已存在權限記錄:\n`;
        debugInfo += `- ID: ${permission?.id || 'N/A'}\n`;
        debugInfo += `- 狀態: ${permission?.status || 'N/A'}\n`;
        debugInfo += `- 角色: ${permission?.hanami_roles?.role_name || 'N/A'}\n`;
        debugInfo += `- 創建時間: ${permission?.created_at || 'N/A'}\n`;
        debugInfo += `\n💡 這可能是權限記錄創建失敗的原因！\n`;
      } else {
        debugInfo += `✅ 沒有現有權限記錄，可以創建\n`;
      }

      // 2. 測試權限記錄創建
      debugInfo += `\n=== 測試權限記錄創建 ===\n`;
      
      const createResponse = await fetch('/api/create-permissions-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          role: 'teacher'
        })
      });

      const createData = await createResponse.json();
      
      debugInfo += `創建請求狀態: ${createResponse.status}\n`;
      debugInfo += `創建響應:\n${JSON.stringify(createData, null, 2)}\n`;

      if (createResponse.ok) {
        debugInfo += `\n✅ 權限記錄創建成功！\n`;
      } else {
        debugInfo += `\n❌ 權限記錄創建失敗！\n`;
        debugInfo += `錯誤: ${createData.error || '未知錯誤'}\n`;
      }

      // 3. 再次檢查權限記錄
      debugInfo += `\n=== 創建後權限記錄檢查 ===\n`;
      
      const checkAfterResponse = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (checkAfterResponse.ok) {
        const checkAfterData = await checkAfterResponse.json();
        
        if (checkAfterData.hanami_user_permissions_v2?.found) {
          const permissions = checkAfterData.hanami_user_permissions_v2.data;
          const permission = Array.isArray(permissions) ? permissions[0] : permissions;
          debugInfo += `✅ 權限記錄已創建:\n`;
          debugInfo += `- ID: ${permission?.id || 'N/A'}\n`;
          debugInfo += `- 狀態: ${permission?.status || 'N/A'}\n`;
          debugInfo += `- 角色: ${permission?.hanami_roles?.role_name || 'N/A'}\n`;
          debugInfo += `- 創建時間: ${permission?.created_at || 'N/A'}\n`;
        } else {
          debugInfo += `❌ 權限記錄仍未創建\n`;
        }
      }

      setResult(debugInfo);

    } catch (error) {
      console.error('調試權限創建錯誤:', error);
      setResult(`❌ 調試權限創建失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectCreation = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('測試直接創建權限記錄:', email);

      // 直接調用創建權限記錄的 API
      const response = await fetch('/api/create-permissions-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          role: 'teacher'
        })
      });

      const data = await response.json();
      
      let testInfo = `=== 直接權限記錄創建測試 ===\n`;
      testInfo += `郵箱: ${email}\n`;
      testInfo += `角色: teacher\n`;
      testInfo += `狀態碼: ${response.status}\n`;
      testInfo += `成功: ${response.ok}\n`;
      testInfo += `響應數據:\n${JSON.stringify(data, null, 2)}\n`;

      if (response.ok) {
        testInfo += `\n🎉 直接創建成功！\n`;
        testInfo += `✅ 這說明 create-permissions-direct API 工作正常\n`;
        testInfo += `💡 問題可能在於批准流程中的調用方式\n`;
      } else {
        testInfo += `\n❌ 直接創建失敗\n`;
        testInfo += `💡 這說明問題在於 API 本身\n`;
      }

      setResult(testInfo);

    } catch (error) {
      console.error('直接創建測試錯誤:', error);
      setResult(`❌ 直接創建測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">權限記錄創建調試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試設置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(value) => setEmail(value)}
                placeholder="請輸入郵箱地址"
              />
            </div>
          </div>
        </HanamiCard>

        {/* 操作區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試操作</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={debugPermissionCreation}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '調試中...' : '詳細調試權限創建'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testDirectCreation}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '測試中...' : '測試直接創建 API'}
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
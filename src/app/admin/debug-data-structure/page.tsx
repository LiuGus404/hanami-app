'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function DebugDataStructurePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('liugushk@gmail.com');

  const debugDataStructure = async () => {
    if (!email) {
      setResult('❌ 請先輸入郵箱地址');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('開始調試數據結構:', email);

      const response = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`API請求失敗: ${response.status}`);
      }

      const data = await response.json();
      
      // 安全序列化函數
      const safeStringify = (obj: any, space = 2) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          if (typeof value === 'function') {
            return '[Function]';
          }
          if (typeof value === 'undefined') {
            return '[Undefined]';
          }
          return value;
        }, space);
      };

      let debugInfo = `=== 數據結構調試 ===\n`;
      debugInfo += `郵箱: ${email}\n`;
      debugInfo += `時間戳: ${data.timestamp}\n\n`;

      // 1. 註冊申請數據結構
      debugInfo += `=== 註冊申請數據結構 ===\n`;
      debugInfo += `found: ${data.registration_requests?.found}\n`;
      debugInfo += `count: ${data.registration_requests?.count}\n`;
      debugInfo += `error: ${data.registration_requests?.error || 'null'}\n`;
      debugInfo += `data type: ${typeof data.registration_requests?.data}\n`;
      debugInfo += `data is array: ${Array.isArray(data.registration_requests?.data)}\n`;
      if (data.registration_requests?.data) {
        debugInfo += `data length: ${Array.isArray(data.registration_requests.data) ? data.registration_requests.data.length : 'N/A'}\n`;
        debugInfo += `data content:\n${safeStringify(data.registration_requests.data)}\n`;
      }
      debugInfo += `\n`;

      // 2. 權限記錄數據結構
      debugInfo += `=== 權限記錄數據結構 ===\n`;
      debugInfo += `found: ${data.hanami_user_permissions_v2?.found}\n`;
      debugInfo += `count: ${data.hanami_user_permissions_v2?.count}\n`;
      debugInfo += `error: ${data.hanami_user_permissions_v2?.error || 'null'}\n`;
      debugInfo += `data type: ${typeof data.hanami_user_permissions_v2?.data}\n`;
      debugInfo += `data is array: ${Array.isArray(data.hanami_user_permissions_v2?.data)}\n`;
      if (data.hanami_user_permissions_v2?.data) {
        debugInfo += `data length: ${Array.isArray(data.hanami_user_permissions_v2.data) ? data.hanami_user_permissions_v2.data.length : 'N/A'}\n`;
        debugInfo += `data content:\n${safeStringify(data.hanami_user_permissions_v2.data)}\n`;
      }
      debugInfo += `\n`;

      // 3. 教師帳號數據結構
      debugInfo += `=== 教師帳號數據結構 ===\n`;
      debugInfo += `found: ${data.hanami_employee?.found}\n`;
      debugInfo += `error: ${data.hanami_employee?.error || 'null'}\n`;
      debugInfo += `data type: ${typeof data.hanami_employee?.data}\n`;
      debugInfo += `data is array: ${Array.isArray(data.hanami_employee?.data)}\n`;
      if (data.hanami_employee?.data) {
        debugInfo += `data length: ${Array.isArray(data.hanami_employee.data) ? data.hanami_employee.data.length : 'N/A'}\n`;
        debugInfo += `data content:\n${safeStringify(data.hanami_employee.data)}\n`;
      }
      debugInfo += `\n`;

      // 4. 管理員帳號數據結構
      debugInfo += `=== 管理員帳號數據結構 ===\n`;
      debugInfo += `found: ${data.hanami_admin?.found}\n`;
      debugInfo += `error: ${data.hanami_admin?.error || 'null'}\n`;
      debugInfo += `data type: ${typeof data.hanami_admin?.data}\n`;
      debugInfo += `data is array: ${Array.isArray(data.hanami_admin?.data)}\n`;
      if (data.hanami_admin?.data) {
        debugInfo += `data length: ${Array.isArray(data.hanami_admin.data) ? data.hanami_admin.data.length : 'N/A'}\n`;
        debugInfo += `data content:\n${safeStringify(data.hanami_admin.data)}\n`;
      }
      debugInfo += `\n`;

      // 5. 學生帳號數據結構
      debugInfo += `=== 學生帳號數據結構 ===\n`;
      debugInfo += `found: ${data.Hanami_Students?.found}\n`;
      debugInfo += `error: ${data.Hanami_Students?.error || 'null'}\n`;
      debugInfo += `data type: ${typeof data.Hanami_Students?.data}\n`;
      debugInfo += `data is array: ${Array.isArray(data.Hanami_Students?.data)}\n`;
      if (data.Hanami_Students?.data) {
        debugInfo += `data length: ${Array.isArray(data.Hanami_Students.data) ? data.Hanami_Students.data.length : 'N/A'}\n`;
        debugInfo += `data content:\n${safeStringify(data.Hanami_Students.data)}\n`;
      }

      setResult(debugInfo);

    } catch (error) {
      console.error('調試錯誤:', error);
      setResult(`❌ 調試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
          password: '12543256c' // 使用已知的密碼
        })
      });

      const data = await response.json();
      
      let loginInfo = `=== 登入測試結果 ===\n`;
      loginInfo += `郵箱: ${email}\n`;
      loginInfo += `密碼: 12543256c\n`;
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
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">數據結構調試工具</h1>
      
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
              onClick={debugDataStructure}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '調試中...' : '調試數據結構'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testLogin}
              disabled={loading}
              variant="cute"
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
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
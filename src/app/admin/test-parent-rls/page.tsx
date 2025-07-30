'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestParentRLSPage() {
  const [email, setEmail] = useState('test.parent1@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testParentAuthentication = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'authenticate',
          email,
          password
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testParentStatistics = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/parents?action=statistics');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testParentList = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/parents?action=list');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testParentLinks = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/parents?action=links');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testCreateParentAccount = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_account',
          email: 'test.parent.rls@example.com',
          name: 'RLS測試家長',
          phone: '0987654321',
          password: 'rls123456',
          address: '台北市RLS測試地址',
          notes: 'RLS測試帳戶'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testCreateParentPermission = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_permission',
          email: 'test.parent.rls@example.com',
          phone: '0987654321',
          approved_by: 'admin@example.com'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">家長 RLS 和權限管理測試</h1>
        <p className="text-[#2B3A3B]">測試家長帳戶系統的 RLS 策略和權限管理功能</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 家長登入測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長登入驗證測試</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                郵箱地址
              </label>
              <HanamiInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="輸入家長郵箱"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                密碼
              </label>
              <HanamiInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼"
              />
            </div>

            <HanamiButton
              variant="primary"
              onClick={testParentAuthentication}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試家長登入驗證'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 家長統計測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長統計測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試獲取家長帳戶系統的統計資訊
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testParentStatistics}
              disabled={loading}
              className="w-full"
            >
              {loading ? '獲取中...' : '獲取家長統計'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 家長列表測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長列表測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試獲取所有家長帳戶列表
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testParentList}
              disabled={loading}
              className="w-full"
            >
              {loading ? '獲取中...' : '獲取家長列表'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 家長連結測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長連結測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試獲取家長-學生連結列表
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testParentLinks}
              disabled={loading}
              className="w-full"
            >
              {loading ? '獲取中...' : '獲取連結列表'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 創建家長帳戶測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">創建家長帳戶測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試創建新的家長帳戶（test.parent.rls@example.com）
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testCreateParentAccount}
              disabled={loading}
              className="w-full"
            >
              {loading ? '創建中...' : '創建家長帳戶'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 創建家長權限測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">創建家長權限測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試為家長創建權限記錄
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testCreateParentPermission}
              disabled={loading}
              className="w-full"
            >
              {loading ? '創建中...' : '創建家長權限'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 測試結果 */}
      {result && (
        <HanamiCard className="mt-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試結果</h2>
          
          <div className="bg-[#FFF9F2] p-4 rounded-lg">
            <pre className="text-sm text-[#2B3A3B] whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </HanamiCard>
      )}

      {/* 使用說明 */}
      <HanamiCard className="mt-6">
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">RLS 策略說明</h2>
        
        <div className="space-y-4 text-[#2B3A3B]">
          <div>
            <h3 className="font-semibold text-[#4B4036]">1. 家長表 RLS 策略</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>家長只能查看和更新自己的資料</li>
              <li>管理員可以查看和管理所有家長資料</li>
              <li>基於 JWT token 中的用戶資訊進行驗證</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">2. 家長-學生連結表 RLS 策略</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>家長只能查看和管理自己相關的連結</li>
              <li>管理員可以管理所有連結</li>
              <li>防止家長訪問其他家長的學生資料</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">3. 學生表 RLS 策略</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>家長只能查看自己連結的學生資料</li>
              <li>通過家長-學生連結表進行權限控制</li>
              <li>確保資料隔離和安全性</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">4. 實用函數</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>check_parent_permission()</code> - 檢查家長權限</li>
              <li><code>check_parent_student_permission()</code> - 檢查家長對學生的權限</li>
              <li><code>authenticate_parent()</code> - 家長登入驗證</li>
              <li><code>create_parent_permission()</code> - 創建家長權限</li>
              <li><code>create_parent_account()</code> - 創建家長帳戶</li>
              <li><code>create_parent_student_link()</code> - 創建家長-學生連結</li>
              <li><code>get_parent_statistics()</code> - 獲取家長統計</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">5. 測試步驟</h3>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>先執行「創建家長帳戶測試」</li>
              <li>再執行「創建家長權限測試」</li>
              <li>執行「家長登入驗證測試」</li>
              <li>查看「家長統計測試」和「家長列表測試」</li>
              <li>在家長管理頁面創建家長-學生連結</li>
              <li>執行「家長連結測試」查看結果</li>
            </ol>
          </div>
        </div>
      </HanamiCard>
    </div>
  );
} 
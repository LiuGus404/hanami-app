'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function TestRLSFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testParentCreation = async () => {
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
          email: 'test.rls.fix@example.com',
          name: 'RLS修復測試家長',
          phone: '0912345678',
          password: 'rlsfix123',
          address: '台北市RLS修復測試地址',
          notes: 'RLS修復測試帳戶'
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

  const testParentPermissionCreation = async () => {
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
          email: 'test.rls.fix@example.com',
          phone: '0912345678',
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
          email: 'test.rls.fix@example.com',
          password: 'rlsfix123'
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

  const testExistingParentAuthentication = async () => {
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
          email: 'test.parent1@example.com',
          password: 'password123'
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

  const testRLSStatus = async () => {
    try {
      setLoading(true);
      setResult(null);

      // 測試創建一個簡單的記錄來檢查 RLS 狀態
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_account',
          email: 'rls.test@example.com',
          name: 'RLS狀態測試',
          phone: '0000000000',
          password: 'test123',
          address: '測試地址',
          notes: 'RLS狀態測試帳戶'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: 'RLS 狀態正常，可以創建家長帳戶',
          data: data
        });
      } else {
        setResult({
          success: false,
          message: 'RLS 可能有問題',
          error: data.error
        });
      }
    } catch (error) {
      setResult({ 
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        message: 'RLS 測試失敗'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">RLS 修復測試</h1>
        <p className="text-[#2B3A3B]">測試家長帳戶系統的 RLS 修復是否成功</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 創建家長帳戶測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">創建家長帳戶測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試創建新的家長帳戶（test.rls.fix@example.com）
            </p>

            <HanamiButton
              variant="primary"
              onClick={testParentCreation}
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
              onClick={testParentPermissionCreation}
              disabled={loading}
              className="w-full"
            >
              {loading ? '創建中...' : '創建家長權限'}
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

        {/* 新家長登入測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">新家長登入測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試新創建的家長帳戶登入
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testParentAuthentication}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試新家長登入'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 現有家長登入測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">現有家長登入測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試現有的家長帳戶登入（test.parent1@example.com）
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testExistingParentAuthentication}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試現有家長登入'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* RLS 狀態測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">RLS 狀態測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試 RLS 是否正常工作，能否創建家長帳戶
            </p>

            <HanamiButton
              variant="primary"
              onClick={testRLSStatus}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試 RLS 狀態'}
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

      {/* 修復說明 */}
      <HanamiCard className="mt-6">
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">RLS 修復說明</h2>
        
        <div className="space-y-4 text-[#2B3A3B]">
          <div>
            <h3 className="font-semibold text-[#4B4036]">問題原因</h3>
            <p className="text-sm">
              原始的 RLS 策略太嚴格，沒有允許服務端創建家長帳戶，導致在註冊流程中出現 "new row violates row-level security policy" 錯誤。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">修復方案</h3>
            <ol className="list-decimal list-inside ml-4 space-y-1 text-sm">
              <li>執行 <code>fix_parent_rls_issue.sql</code> 設置寬鬆的測試策略</li>
              <li>測試家長帳戶創建和權限管理功能</li>
              <li>確認功能正常後，執行 <code>secure_parent_rls.sql</code> 設置安全策略</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">測試步驟</h3>
            <ol className="list-decimal list-inside ml-4 space-y-1 text-sm">
              <li>先執行「創建家長帳戶測試」</li>
              <li>再執行「創建家長權限測試」</li>
              <li>執行「新家長登入測試」</li>
              <li>執行「現有家長登入測試」</li>
              <li>如果所有測試都成功，說明 RLS 修復成功</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">下一步</h3>
            <p className="text-sm">
              如果測試成功，可以嘗試在註冊頁面註冊家長帳戶，然後在權限管理頁面批准申請，看看是否能正常創建家長帳戶。
            </p>
          </div>
        </div>
      </HanamiCard>
    </div>
  );
} 
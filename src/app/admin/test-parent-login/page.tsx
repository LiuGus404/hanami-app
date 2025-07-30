'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import { validateUserCredentials } from '@/lib/authUtils';

export default function TestParentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testLogin = async () => {
    if (!email || !password) {
      setResult({ error: '請輸入帳號和密碼' });
      return;
    }

    setLoading(true);
    try {
      console.log('開始測試家長登入:', { email, password });
      
      const loginResult = await validateUserCredentials(email, password);
      
      console.log('登入結果:', loginResult);
      
      setResult({
        success: loginResult.success,
        message: loginResult.success ? '登入成功！' : '登入失敗',
        data: loginResult
      });

    } catch (error) {
      console.error('登入測試錯誤:', error);
      setResult({ 
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤' 
      });
    } finally {
      setLoading(false);
    }
  };

  const testTableBasedLogin = async () => {
    if (!email || !password) {
      setResult({ error: '請輸入帳號和密碼' });
      return;
    }

    setLoading(true);
    try {
      console.log('開始測試表單登入:', { email, password });
      
      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: 'parent'
        }),
      });

      const data = await response.json();
      
      console.log('表單登入結果:', data);
      
      setResult({
        success: data.success,
        message: data.success ? '表單登入成功！' : '表單登入失敗',
        data: data
      });

    } catch (error) {
      console.error('表單登入測試錯誤:', error);
      setResult({ 
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤' 
      });
    } finally {
      setLoading(false);
    }
  };

  const checkParentAccount = async () => {
    if (!email) {
      setResult({ error: '請輸入帳號' });
      return;
    }

    setLoading(true);
    try {
      console.log('檢查家長帳戶:', { email });
      
      // 檢查權限記錄
      const response1 = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list',
          email: email
        }),
      });

      const data1 = await response1.json();
      
      // 檢查家長表
      const response2 = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_account',
          email: email
        }),
      });

      const data2 = await response2.json();
      
      setResult({
        success: true,
        message: '帳戶檢查完成',
        permission_data: data1,
        parent_data: data2
      });

    } catch (error) {
      console.error('帳戶檢查錯誤:', error);
      setResult({ 
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">家長登入測試</h1>

      {/* 登入表單 */}
      <HanamiCard>
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長登入測試</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2B3A3B] mb-2">家長帳號</label>
            <HanamiInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入家長帳號"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B3A3B] mb-2">密碼</label>
            <HanamiInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              type="password"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HanamiButton
              onClick={testLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試 validateUserCredentials'}
            </HanamiButton>

            <HanamiButton
              onClick={testTableBasedLogin}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? '測試中...' : '測試表單登入 API'}
            </HanamiButton>

            <HanamiButton
              onClick={checkParentAccount}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查家長帳戶'}
            </HanamiButton>
          </div>
        </div>
      </HanamiCard>

      {/* 結果顯示 */}
      {result && (
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試結果</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
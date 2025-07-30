'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestParentSystemPage() {
  const [email, setEmail] = useState('test.parent1@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testParentLogin = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testParentRegistration = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/auth/register-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test.parent.new@example.com',
          full_name: '新測試家長',
          phone: '0987654321',
          role: 'parent',
          additional_info: {
            password: 'newpassword123',
            address: '台北市新地址',
            notes: '測試家長帳戶'
          }
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
        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">家長帳戶系統測試</h1>
        <p className="text-[#2B3A3B]">測試家長帳戶的註冊、登入和連結功能</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 家長登入測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長登入測試</h2>
          
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
              onClick={testParentLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? '測試中...' : '測試家長登入'}
            </HanamiButton>
          </div>
        </HanamiCard>

        {/* 家長註冊測試 */}
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長註冊測試</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-[#2B3A3B]">
              測試創建新的家長帳戶，郵箱: test.parent.new@example.com
            </p>

            <HanamiButton
              variant="secondary"
              onClick={testParentRegistration}
              disabled={loading}
              className="w-full"
            >
              {loading ? '註冊中...' : '測試家長註冊'}
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
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">使用說明</h2>
        
        <div className="space-y-4 text-[#2B3A3B]">
          <div>
            <h3 className="font-semibold text-[#4B4036]">1. 家長帳戶系統特點</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>獨立的家長帳戶表 (hanami_parents)</li>
              <li>家長可以連結到多個學生</li>
              <li>支援不同關係類型：家長、監護人、緊急聯絡人</li>
              <li>可以設置主要聯絡人</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">2. 測試步驟</h3>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>先執行家長註冊測試，創建新帳戶</li>
              <li>在權限管理頁面批准註冊申請</li>
              <li>在家長管理頁面創建家長-學生連結</li>
              <li>使用家長登入測試驗證登入功能</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#4B4036]">3. 相關頁面</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><a href="/admin/permission-management" className="text-blue-600 hover:underline">權限管理</a> - 批准家長註冊申請</li>
              <li><a href="/admin/parent-management" className="text-blue-600 hover:underline">家長管理</a> - 管理家長帳戶和學生連結</li>
              <li><a href="/admin/registration-requests" className="text-blue-600 hover:underline">註冊申請</a> - 查看所有註冊申請</li>
            </ul>
          </div>
        </div>
      </HanamiCard>
    </div>
  );
} 
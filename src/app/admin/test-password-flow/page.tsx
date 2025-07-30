'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestPasswordFlowPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('hanami123');

  const testTableBasedLogin = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 表格認證登入成功:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 表格認證登入失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('表格認證登入測試錯誤:', error);
      setResult(`❌ 表格認證登入測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccount = async () => {
    setLoading(true);
    setResult('');

    try {
      // 檢查各個表中的用戶記錄
      const results = [];

      // 1. 檢查註冊申請
      const regResponse = await fetch(`/api/check-registration-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      const regData = await regResponse.json();
      results.push(`=== 註冊申請檢查 ===\n${JSON.stringify(regData, null, 2)}`);

      // 2. 檢查管理員表
      const adminResponse = await fetch(`/api/test-db?table=hanami_admin&email=${email}`);
      const adminData = await adminResponse.json();
      results.push(`=== 管理員表檢查 ===\n${JSON.stringify(adminData, null, 2)}`);

      // 3. 檢查教師表
      const teacherResponse = await fetch(`/api/test-db?table=hanami_employee&email=${email}`);
      const teacherData = await teacherResponse.json();
      results.push(`=== 教師表檢查 ===\n${JSON.stringify(teacherData, null, 2)}`);

      // 4. 檢查學生表
      const studentResponse = await fetch(`/api/test-db?table=Hanami_Students&email=${email}`);
      const studentData = await studentResponse.json();
      results.push(`=== 學生表檢查 ===\n${JSON.stringify(studentData, null, 2)}`);

      setResult(results.join('\n\n'));

    } catch (error) {
      console.error('檢查用戶帳號錯誤:', error);
      setResult(`❌ 檢查用戶帳號錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async (role: 'admin' | 'teacher' | 'parent') => {
    setLoading(true);
    setResult('');

    try {
      const timestamp = Date.now();
      const testEmail = `test.${role}.${timestamp}@example.com`;
      const testPassword = 'test123456';

      const response = await fetch('/api/create-user-account-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          full_name: `測試${role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}`,
          phone: '12345678',
          role: role,
          password: testPassword,
          additional_info: {
            password: testPassword
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 測試用戶創建成功:\n角色: ${role}\n郵箱: ${testEmail}\n密碼: ${testPassword}\n\n${JSON.stringify(data, null, 2)}`);
        
        // 自動填入測試帳號
        setEmail(testEmail);
        setPassword(testPassword);
      } else {
        setResult(`❌ 測試用戶創建失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('創建測試用戶錯誤:', error);
      setResult(`❌ 創建測試用戶錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">密碼流程測試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測試輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試輸入</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                帳號
              </label>
              <HanamiInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入測試帳號"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                密碼
              </label>
              <HanamiInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入測試密碼"
                type="password"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <HanamiButton
                onClick={testTableBasedLogin}
                disabled={loading || !email || !password}
                variant="primary"
              >
                {loading ? '測試中...' : '測試表格認證登入'}
              </HanamiButton>
              
              <HanamiButton
                onClick={checkUserAccount}
                disabled={loading || !email}
                variant="secondary"
              >
                {loading ? '檢查中...' : '檢查用戶帳號'}
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>

        {/* 創建測試用戶區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">創建測試用戶</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={() => createTestUser('admin')}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試管理員'}
            </HanamiButton>
            
            <HanamiButton
              onClick={() => createTestUser('teacher')}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試教師'}
            </HanamiButton>
            
            <HanamiButton
              onClick={() => createTestUser('parent')}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '創建中...' : '創建測試家長'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">測試結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
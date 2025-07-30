'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function TestUserAccountPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('hanami123');

  const testUserCreation = async () => {
    setLoading(true);
    setResult('');

    try {
      // 檢查 hanami_user_permissions_v2 表
      const permissionResponse = await fetch(`/api/permissions?type=user_permissions&user_email=${email}`);
      const permissionData = await permissionResponse.json();
      
      setResult(`=== 權限記錄檢查 ===\n`);
      if (permissionData.success && permissionData.data && permissionData.data.length > 0) {
        setResult(prev => prev + `✅ 找到權限記錄:\n${JSON.stringify(permissionData.data[0], null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ 未找到權限記錄\n\n`);
      }

      // 檢查 hanami_admin 表
      const adminResponse = await fetch(`/api/test-db?table=hanami_admin&email=${email}`);
      const adminData = await adminResponse.json();
      
      setResult(prev => prev + `=== 管理員表檢查 ===\n`);
      if (adminData.success && adminData.data && adminData.data.length > 0) {
        setResult(prev => prev + `✅ 找到管理員記錄:\n${JSON.stringify(adminData.data[0], null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ 未找到管理員記錄\n\n`);
      }

      // 檢查 hanami_employee 表
      const teacherResponse = await fetch(`/api/test-db?table=hanami_employee&email=${email}`);
      const teacherData = await teacherResponse.json();
      
      setResult(prev => prev + `=== 教師表檢查 ===\n`);
      if (teacherData.success && teacherData.data && teacherData.data.length > 0) {
        setResult(prev => prev + `✅ 找到教師記錄:\n${JSON.stringify(teacherData.data[0], null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ 未找到教師記錄\n\n`);
      }

      // 檢查 Hanami_Students 表
      const studentResponse = await fetch(`/api/test-db?table=Hanami_Students&email=${email}`);
      const studentData = await studentResponse.json();
      
      setResult(prev => prev + `=== 學生表檢查 ===\n`);
      if (studentData.success && studentData.data && studentData.data.length > 0) {
        setResult(prev => prev + `✅ 找到學生記錄:\n${JSON.stringify(studentData.data[0], null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ 未找到學生記錄\n\n`);
      }

    } catch (error) {
      console.error('測試錯誤:', error);
      setResult(`❌ 測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/auth/login', {
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
        setResult(`✅ 登入測試成功:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 登入測試失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('登入測試錯誤:', error);
      setResult(`❌ 登入測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationRequests = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/registration-requests');
      const data = await response.json();
      
      if (data.success) {
        const userRequests = data.data.filter((req: any) => req.email === email);
        setResult(`=== 註冊申請檢查 ===\n`);
        if (userRequests.length > 0) {
          setResult(prev => prev + `✅ 找到註冊申請:\n${JSON.stringify(userRequests[0], null, 2)}`);
        } else {
          setResult(prev => prev + `❌ 未找到註冊申請`);
        }
      } else {
        setResult(`❌ 獲取註冊申請失敗: ${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('檢查錯誤:', error);
      setResult(`❌ 檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccount = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`/api/check-user-account?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setResult(`=== 用戶帳號詳細檢查 ===\n${JSON.stringify(data.results, null, 2)}`);
      } else {
        setResult(`❌ 檢查用戶帳號失敗: ${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('檢查用戶帳號錯誤:', error);
      setResult(`❌ 檢查用戶帳號錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const createUserAccount = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/create-user-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          role: 'teacher' // 根據權限記錄，這個用戶是教師角色
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 用戶帳號創建成功:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 創建用戶帳號失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('創建用戶帳號錯誤:', error);
      setResult(`❌ 創建用戶帳號錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanupAndCreateUser = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/cleanup-and-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 清理並創建用戶帳號成功:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 清理並創建用戶帳號失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('清理並創建用戶帳號錯誤:', error);
      setResult(`❌ 清理並創建用戶帳號錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const quickApprove = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/quick-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 快速批准成功:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 快速批准失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('快速批准錯誤:', error);
      setResult(`❌ 快速批准錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">用戶帳號測試</h1>
      
      <div className="mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              用戶郵箱
            </label>
            <HanamiInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="輸入要測試的郵箱"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              密碼
            </label>
            <HanamiInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              type="password"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <HanamiButton
          onClick={checkRegistrationRequests}
          variant="secondary"
          disabled={loading || !email}
        >
          {loading ? '檢查中...' : '檢查註冊申請'}
        </HanamiButton>
        
        <HanamiButton
          onClick={testUserCreation}
          variant="secondary"
          disabled={loading || !email}
        >
          {loading ? '檢查中...' : '檢查表結構'}
        </HanamiButton>
        
        <HanamiButton
          onClick={checkUserAccount}
          variant="secondary"
          disabled={loading || !email}
        >
          {loading ? '檢查中...' : '檢查用戶帳號'}
        </HanamiButton>
        
        <HanamiButton
          onClick={createUserAccount}
          variant="success"
          disabled={loading || !email}
        >
          {loading ? '創建中...' : '創建用戶帳號'}
        </HanamiButton>
        
        <HanamiButton
          onClick={cleanupAndCreateUser}
          variant="danger"
          disabled={loading || !email}
        >
          {loading ? '清理中...' : '清理並創建'}
        </HanamiButton>
        
        <HanamiButton
          onClick={quickApprove}
          variant="cute"
          disabled={loading || !email}
        >
          {loading ? '批准中...' : '快速批准'}
        </HanamiButton>
        
        <HanamiButton
          onClick={testLogin}
          variant="primary"
          disabled={loading || !email || !password}
        >
          {loading ? '測試中...' : '測試登入'}
        </HanamiButton>
      </div>

      {result && (
        <HanamiCard className="p-4">
          <h2 className="text-lg font-semibold text-[#4B4036] mb-2">測試結果</h2>
          <pre className="text-sm text-[#2B3A3B] whitespace-pre-wrap bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 
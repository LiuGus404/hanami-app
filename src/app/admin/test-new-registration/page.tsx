'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';

export default function TestNewRegistrationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'parent'>('teacher');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const testNewRegistration = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: fullName,
          phone: phone,
          role: role,
          additional_info: {
            teacherBackground: '測試背景',
            teacherBankId: 'TEST123',
            teacherAddress: '測試地址'
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 新註冊流程成功:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 新註冊流程失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('新註冊流程錯誤:', error);
      setResult(`❌ 新註冊流程錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    setLoading(true);
    setResult('');

    try {
      // 檢查註冊申請
      const registrationResponse = await fetch(`/api/registration-requests?email=${email}`);
      const registrationData = await registrationResponse.json();

      // 檢查權限記錄
      const permissionResponse = await fetch(`/api/permissions/check?email=${email}`);
      const permissionData = await permissionResponse.json();

      // 檢查用戶帳號
      const userResponse = await fetch('/api/check-user-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      const userData = await userResponse.json();

      setResult(`=== 註冊狀態檢查 ===\n
註冊申請: ${JSON.stringify(registrationData, null, 2)}

權限記錄: ${JSON.stringify(permissionData, null, 2)}

用戶帳號: ${JSON.stringify(userData, null, 2)}`);

    } catch (error) {
      console.error('檢查註冊狀態錯誤:', error);
      setResult(`❌ 檢查註冊狀態錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">新註冊流程測試</h1>
      
      <HanamiCard className="mb-6">
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">註冊信息</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              郵箱
            </label>
            <HanamiInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="輸入郵箱"
            />
          </div>
          
          <div>
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
          
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              姓名
            </label>
            <HanamiInput
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="輸入姓名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              電話
            </label>
            <HanamiInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="輸入電話"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#4B4036] mb-2">
            角色
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'teacher' | 'parent')}
            className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]"
          >
            <option value="admin">管理員</option>
            <option value="teacher">教師</option>
            <option value="parent">家長</option>
          </select>
        </div>
      </HanamiCard>

      <div className="flex gap-4 mb-6">
        <HanamiButton
          onClick={testNewRegistration}
          variant="primary"
          disabled={loading || !email || !password || !fullName}
        >
          {loading ? '註冊中...' : '測試新註冊'}
        </HanamiButton>
        
        <HanamiButton
          onClick={checkRegistrationStatus}
          variant="secondary"
          disabled={loading || !email}
        >
          {loading ? '檢查中...' : '檢查註冊狀態'}
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
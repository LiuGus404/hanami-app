'use client';

import { useState } from 'react';

export default function TestSimpleRegistrationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'parent'>('teacher');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const testSimpleRegistration = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/auth/register-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone,
          role,
          additional_info: {
            teacherBackground: '音樂教育背景',
            teacherBankId: '123456789',
            teacherAddress: '香港',
            teacherDob: '1990-01-01'
          }
        })
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/check-registration-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSupabaseAuthConfig = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/check-supabase-auth-config', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseAuthRegistration = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/test-supabase-auth-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const simplifyEmployeeRLS = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/simplify-employee-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const simplifyAllRLS = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/simplify-all-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createUserAccountManual = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/create-user-account-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone,
          role,
          additional_info: {
            teacherBackground: '音樂教育背景',
            teacherBankId: '123456789',
            teacherAddress: '香港',
            teacherDob: '1990-01-01'
          }
        })
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fixApprovedAccounts = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/fix-approved-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthRegistration = async () => {
    try {
      setLoading(true);
      setResult('');

      const response = await fetch('/api/auth/register-with-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone,
          role,
          additional_info: {
            teacherBackground: '音樂教育背景',
            teacherBankId: '123456789',
            teacherAddress: '香港',
            teacherDob: '1990-01-01'
          }
        })
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

    } catch (error) {
      setResult(`錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">簡化註冊流程測試</h1>
      
      <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">註冊信息</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              郵箱 *
            </label>
            <input
              type="email"
              placeholder="請輸入郵箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200 bg-white text-[#2B3A3B] placeholder-[#999]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              密碼 *
            </label>
            <input
              type="password"
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200 bg-white text-[#2B3A3B] placeholder-[#999]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              姓名 *
            </label>
            <input
              type="text"
              placeholder="請輸入姓名"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200 bg-white text-[#2B3A3B] placeholder-[#999]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              電話
            </label>
            <input
              type="tel"
              placeholder="請輸入電話"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200 bg-white text-[#2B3A3B] placeholder-[#999]"
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
            className="w-full px-4 py-3 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-[#4B4036]"
          >
            <option value="admin">管理員</option>
            <option value="teacher">教師</option>
            <option value="parent">家長</option>
          </select>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={testAuthRegistration}
            disabled={loading || !email || !password || !fullName}
            className="px-4 py-2.5 bg-gradient-to-br from-[#FFB6C1] to-[#FFC0CB] text-[#A64B2A] border border-[#EAC29D] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '註冊中...' : '測試Auth註冊流程'}
          </button>

          <button
            onClick={testSimpleRegistration}
            disabled={loading || !email || !password || !fullName}
            className="px-4 py-2.5 bg-gradient-to-br from-[#FDE6B8] to-[#FCE2C8] text-[#A64B2A] border border-[#EAC29D] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '註冊中...' : '測試簡化註冊'}
          </button>
          
          <button
            onClick={checkRegistrationStatus}
            disabled={loading || !email}
            className="px-4 py-2.5 bg-gradient-to-br from-white to-[#FFFCEB] text-[#2B3A3B] border border-[#EADBC8] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '檢查中...' : '檢查註冊狀態'}
          </button>

          <button
            onClick={checkSupabaseAuthConfig}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-br from-[#B8E6FD] to-[#C8E2FC] text-[#2B3A3B] border border-[#C8E8FA] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '檢查中...' : '檢查Auth配置'}
          </button>

          <button
            onClick={testSupabaseAuthRegistration}
            disabled={loading || !email || !password}
            className="px-4 py-2.5 bg-gradient-to-br from-[#FDB8E6] to-[#FCC8E2] text-[#2B3A3B] border border-[#FAC8E8] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '測試中...' : '測試Auth註冊'}
          </button>

          <button
            onClick={createUserAccountManual}
            disabled={loading || !email || !password || !fullName}
            className="px-4 py-2.5 bg-gradient-to-br from-[#B8FDE6] to-[#C8FCE2] text-[#2B3A3B] border border-[#C8EAC8] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '創建中...' : '手動創建帳號'}
          </button>

          <button
            onClick={fixApprovedAccounts}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-br from-[#E6B8FD] to-[#E2C8FC] text-[#2B3A3B] border border-[#E8C8FA] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '修復中...' : '修復已批准帳號'}
          </button>

          <button
            onClick={simplifyEmployeeRLS}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-br from-[#FFE0E0] to-[#FFD4D4] text-[#A64B2A] border border-[#EAC29D] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '簡化中...' : '簡化教師表RLS'}
          </button>

          <button
            onClick={simplifyAllRLS}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-br from-[#E0F2E0] to-[#D4F2D4] text-[#2B3A3B] border border-[#C8EAC8] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '簡化中...' : '簡化所有表RLS'}
          </button>
        </div>
      </div>
      
      {result && (
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">結果</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 
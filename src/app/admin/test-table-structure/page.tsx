'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function TestTableStructurePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testTableStructure = async () => {
    setLoading(true);
    setResult('');

    try {
      // 測試 hanami_admin 表
      setResult('=== 測試 hanami_admin 表 ===\n');
      
      const adminResponse = await fetch('/api/test-table?table=hanami_admin');
      const adminData = await adminResponse.json();
      
      if (adminResponse.ok) {
        setResult(prev => prev + `✅ hanami_admin 表正常:\n${JSON.stringify(adminData, null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ hanami_admin 表錯誤:\n${JSON.stringify(adminData, null, 2)}\n\n`);
      }

      // 測試 hanami_employee 表
      setResult(prev => prev + '=== 測試 hanami_employee 表 ===\n');
      
      const employeeResponse = await fetch('/api/test-table?table=hanami_employee');
      const employeeData = await employeeResponse.json();
      
      if (employeeResponse.ok) {
        setResult(prev => prev + `✅ hanami_employee 表正常:\n${JSON.stringify(employeeData, null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ hanami_employee 表錯誤:\n${JSON.stringify(employeeData, null, 2)}\n\n`);
      }

      // 測試 Hanami_Students 表
      setResult(prev => prev + '=== 測試 Hanami_Students 表 ===\n');
      
      const studentsResponse = await fetch('/api/test-table?table=Hanami_Students');
      const studentsData = await studentsResponse.json();
      
      if (studentsResponse.ok) {
        setResult(prev => prev + `✅ Hanami_Students 表正常:\n${JSON.stringify(studentsData, null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ Hanami_Students 表錯誤:\n${JSON.stringify(studentsData, null, 2)}\n\n`);
      }

      // 測試 hanami_user_permissions_v2 表
      setResult(prev => prev + '=== 測試 hanami_user_permissions_v2 表 ===\n');
      
      const permissionsResponse = await fetch('/api/test-table?table=hanami_user_permissions_v2');
      const permissionsData = await permissionsResponse.json();
      
      if (permissionsResponse.ok) {
        setResult(prev => prev + `✅ hanami_user_permissions_v2 表正常:\n${JSON.stringify(permissionsData, null, 2)}\n\n`);
      } else {
        setResult(prev => prev + `❌ hanami_user_permissions_v2 表錯誤:\n${JSON.stringify(permissionsData, null, 2)}\n\n`);
      }

    } catch (error) {
      console.error('測試錯誤:', error);
      setResult(`❌ 測試錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testRLSStatus = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/rls-check');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`=== RLS 狀態檢查 ===\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ RLS 檢查失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('RLS檢查錯誤:', error);
      setResult(`❌ RLS檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleQuery = async () => {
    setLoading(true);
    setResult('');

    try {
      // 使用服務端API進行簡單查詢
      const response = await fetch('/api/test-simple-query');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`=== 簡單查詢測試 ===\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 簡單查詢失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('簡單查詢錯誤:', error);
      setResult(`❌ 簡單查詢錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const fixAuthRLS = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/fix-auth-rls', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(`=== 修復認證RLS政策 ===\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 修復RLS政策失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('修復RLS錯誤:', error);
      setResult(`❌ 修復RLS錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const fixRegistrationRLS = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/fix-registration-rls', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(`=== 修復註冊申請RLS政策 ===\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 修復註冊申請RLS政策失敗:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('修復註冊申請RLS錯誤:', error);
      setResult(`❌ 修復註冊申請RLS錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">表結構測試</h1>
      
      <div className="flex gap-4 mb-6">
        <HanamiButton
          onClick={testTableStructure}
          variant="secondary"
          disabled={loading}
        >
          {loading ? '測試中...' : '測試表結構'}
        </HanamiButton>
        
        <HanamiButton
          onClick={testRLSStatus}
          variant="secondary"
          disabled={loading}
        >
          {loading ? '檢查中...' : '檢查RLS狀態'}
        </HanamiButton>
        
        <HanamiButton
          onClick={testSimpleQuery}
          variant="secondary"
          disabled={loading}
        >
          {loading ? '查詢中...' : '簡單查詢測試'}
        </HanamiButton>
        
        <HanamiButton
          onClick={fixAuthRLS}
          variant="primary"
          disabled={loading}
        >
          {loading ? '修復中...' : '修復認證RLS'}
        </HanamiButton>
        
        <HanamiButton
          onClick={fixRegistrationRLS}
          variant="primary"
          disabled={loading}
        >
          {loading ? '修復中...' : '修復註冊RLS'}
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
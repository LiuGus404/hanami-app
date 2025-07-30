'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function DebugRolesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const checkRoles = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('檢查 hanami_roles 表...');

      const response = await fetch('/api/test-check-registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'debug-roles@example.com',
          debug_roles: true 
        })
      });

      if (!response.ok) {
        throw new Error(`檢查失敗: ${response.status}`);
      }

      const data = await response.json();
      
      let debugInfo = `=== hanami_roles 表檢查 ===\n\n`;
      
      if (data.debug_roles) {
        debugInfo += `✅ 找到 ${data.debug_roles.length} 個角色:\n\n`;
        data.debug_roles.forEach((role: any, index: number) => {
          debugInfo += `角色 ${index + 1}:\n`;
          debugInfo += `- ID: ${role.id}\n`;
          debugInfo += `- 名稱: ${role.role_name}\n`;
          debugInfo += `- 顯示名稱: ${role.display_name}\n`;
          debugInfo += `- 創建時間: ${role.created_at}\n`;
          debugInfo += `- 權限: ${JSON.stringify(role.permissions, null, 2)}\n\n`;
        });
      } else {
        debugInfo += `❌ 沒有找到角色數據\n`;
      }

      setResult(debugInfo);

    } catch (error) {
      console.error('檢查角色錯誤:', error);
      setResult(`❌ 檢查角色失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const testRoleQuery = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('測試角色查詢...');

      const response = await fetch('/api/debug-role-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role_name: 'teacher'
        })
      });

      if (!response.ok) {
        throw new Error(`查詢失敗: ${response.status}`);
      }

      const data = await response.json();
      
      let queryInfo = `=== 角色查詢測試 ===\n\n`;
      queryInfo += `查詢角色: teacher\n`;
      queryInfo += `結果: ${JSON.stringify(data, null, 2)}\n`;

      setResult(queryInfo);

    } catch (error) {
      console.error('角色查詢錯誤:', error);
      setResult(`❌ 角色查詢失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">角色表調試工具</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 操作區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">調試操作</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={checkRoles}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查 hanami_roles 表'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testRoleQuery}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '查詢中...' : '測試角色查詢'}
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
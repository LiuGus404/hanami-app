'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

interface RLSStatus {
  table_name: string;
  rls_enabled: boolean;
  policies: PolicyInfo[];
}

interface PolicyInfo {
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

export default function RLSCheckerPage() {
  const [rlsStatus, setRlsStatus] = useState<RLSStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRLSStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rls-check');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '檢查RLS狀態失敗');
      }
      
      setRlsStatus(result.data || []);
      
      // 顯示統計資訊
      if (result.total_tables > 0) {
        console.log(`📊 RLS統計: 總表數 ${result.total_tables}, 已啟用 ${result.enabled_tables}, 已停用 ${result.disabled_tables}`);
      }
    } catch (err: any) {
      console.error('檢查RLS狀態失敗:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enableRLS = async (tableName: string) => {
    try {
      const response = await fetch('/api/rls-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable_rls', table_name: tableName })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '啟用RLS失敗');
      }
      
      alert(result.message);
      await checkRLSStatus();
    } catch (err: any) {
      alert(`啟用RLS失敗: ${err.message}`);
    }
  };

  const disableRLS = async (tableName: string) => {
    if (!confirm(`確定要為表 ${tableName} 停用RLS嗎？這將移除所有相關的權限政策。`)) {
      return;
    }

    try {
      const response = await fetch('/api/rls-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_rls', table_name: tableName })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '停用RLS失敗');
      }
      
      alert(result.message);
      await checkRLSStatus();
    } catch (err: any) {
      alert(`停用RLS失敗: ${err.message}`);
    }
  };

  const createBasicPolicy = async (tableName: string) => {
    try {
      const response = await fetch('/api/rls-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_basic_policy', table_name: tableName })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '創建政策失敗');
      }
      
      alert(result.message);
      await checkRLSStatus();
    } catch (err: any) {
      alert(`創建政策失敗: ${err.message}`);
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (enabled: boolean) => {
    return enabled ? '已啟用' : '已停用';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">RLS 權限檢查工具</h1>
        <p className="text-[#2B3A3B]">檢查和管理資料庫的 Row Level Security 設定</p>
      </div>

      <div className="mb-6">
        <HanamiButton 
          onClick={checkRLSStatus} 
          disabled={loading}
          variant="primary"
        >
          {loading ? '檢查中...' : '檢查 RLS 狀態'}
        </HanamiButton>
      </div>

      {error && (
        <HanamiCard className="mb-6 border-red-200 bg-red-50">
          <div className="text-red-600">
            <strong>錯誤:</strong> {error}
          </div>
        </HanamiCard>
      )}

      {rlsStatus.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#4B4036]">RLS 狀態報告</h2>
          
          {rlsStatus.map((table) => (
            <HanamiCard key={table.table_name} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-[#4B4036]">
                    {table.table_name}
                  </h3>
                  <p className={`text-sm font-medium ${getStatusColor(table.rls_enabled)}`}>
                    RLS: {getStatusText(table.rls_enabled)}
                  </p>
                  <p className="text-sm text-[#2B3A3B]">
                    政策數量: {table.policies.length}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {!table.rls_enabled ? (
                    <HanamiButton
                      size="sm"
                      variant="success"
                      onClick={() => enableRLS(table.table_name)}
                    >
                      啟用 RLS
                    </HanamiButton>
                  ) : (
                    <HanamiButton
                      size="sm"
                      variant="danger"
                      onClick={() => disableRLS(table.table_name)}
                    >
                      停用 RLS
                    </HanamiButton>
                  )}
                  
                  {table.rls_enabled && table.policies.length === 0 && (
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => createBasicPolicy(table.table_name)}
                    >
                      創建基本政策
                    </HanamiButton>
                  )}
                </div>
              </div>

              {table.policies.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-[#4B4036] mb-2">現有政策:</h4>
                  <div className="space-y-2">
                    {table.policies.map((policy, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-[#4B4036]">
                              {policy.policyname}
                            </p>
                            <p className="text-xs text-[#2B3A3B]">
                              操作: {policy.cmd} | 角色: {policy.roles.join(', ')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            policy.permissive === 'PERMISSIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {policy.permissive}
                          </span>
                        </div>
                        
                        {policy.qual && (
                          <div className="mt-2">
                            <p className="text-xs text-[#2B3A3B] font-medium">條件:</p>
                            <p className="text-xs text-[#2B3A3B] bg-white p-2 rounded border">
                              {policy.qual}
                            </p>
                          </div>
                        )}
                        
                        {policy.with_check && (
                          <div className="mt-2">
                            <p className="text-xs text-[#2B3A3B] font-medium">檢查條件:</p>
                            <p className="text-xs text-[#2B3A3B] bg-white p-2 rounded border">
                              {policy.with_check}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </HanamiCard>
          ))}
        </div>
      )}

      {rlsStatus.length === 0 && !loading && (
        <HanamiCard className="text-center py-8">
          <p className="text-[#2B3A3B]">點擊「檢查 RLS 狀態」按鈕開始檢查</p>
        </HanamiCard>
      )}
    </div>
  );
} 
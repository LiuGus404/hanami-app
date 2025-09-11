'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  TableCellsIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

interface TableStatus {
  table_name: string;
  exists: boolean;
  status: string;
}

interface SaasUsersStructure {
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
  }>;
  column_count: number;
}

interface SupabaseStructure {
  success: boolean;
  summary: {
    total_tables: number;
    hanami_tables: number;
    saas_tables: number;
    required_tables: number;
    existing_required_tables: number;
    missing_required_tables: number;
  };
  tables: {
    all: string[];
    hanami: string[];
    saas: string[];
  };
  required_tables_status: TableStatus[];
  saas_users_structure: SaasUsersStructure | null;
  errors: {
    hanami?: string;
    saas?: string;
    all?: string;
  };
}

export default function CheckSupabaseStructurePage() {
  const [structure, setStructure] = useState<SupabaseStructure | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStructure = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-all-saas-tables');
      const data = await response.json();
      
      if (data.success) {
        setStructure(data);
      } else {
        setError(data.error || '檢查失敗');
      }
    } catch (err) {
      setError('網路錯誤');
      console.error('檢查結構時發生錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSaasUsersStructure = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-saas-users-structure');
      const data = await response.json();
      
      if (data.success) {
        console.log('saas_users 表結構:', data);
        // 可以在這裡顯示詳細的 saas_users 結構
      } else {
        setError(data.error || '檢查 saas_users 結構失敗');
      }
    } catch (err) {
      setError('網路錯誤');
      console.error('檢查 saas_users 結構時發生錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStructure();
  }, []);

  const getStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircleIcon className="w-5 h-5 text-green-500" />
    ) : (
      <XCircleIcon className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusColor = (exists: boolean) => {
    return exists ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">
            Supabase 架構檢查
          </h1>
          <p className="text-[#2B3A3B] text-lg">
            檢查現有的 Supabase 資料庫結構，確認 HanamiEcho 所需的表結構
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 操作按鈕 */}
          <HanamiCard className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ServerIcon className="w-6 h-6 text-[#FFD59A]" />
              <h2 className="text-xl font-semibold text-[#4B4036]">操作</h2>
            </div>
            <div className="space-y-3">
              <HanamiButton
                onClick={checkStructure}
                disabled={loading}
                className="w-full"
              >
                {loading ? '檢查中...' : '檢查所有表結構'}
              </HanamiButton>
              <HanamiButton
                onClick={checkSaasUsersStructure}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                檢查 saas_users 結構
              </HanamiButton>
            </div>
          </HanamiCard>

          {/* 統計摘要 */}
          {structure && (
            <HanamiCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TableCellsIcon className="w-6 h-6 text-[#FFD59A]" />
                <h2 className="text-xl font-semibold text-[#4B4036]">統計摘要</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">總表數:</span>
                  <span className="font-semibold text-[#4B4036]">{structure.summary.total_tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">Hanami 表:</span>
                  <span className="font-semibold text-[#4B4036]">{structure.summary.hanami_tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">SAAS 表:</span>
                  <span className="font-semibold text-[#4B4036]">{structure.summary.saas_tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">需要表數:</span>
                  <span className="font-semibold text-[#4B4036]">{structure.summary.required_tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">已存在:</span>
                  <span className="font-semibold text-green-600">{structure.summary.existing_required_tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">缺少:</span>
                  <span className="font-semibold text-red-600">{structure.summary.missing_required_tables}</span>
                </div>
              </div>
            </HanamiCard>
          )}

          {/* saas_users 表結構 */}
          {structure?.saas_users_structure && (
            <HanamiCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <InformationCircleIcon className="w-6 h-6 text-[#FFD59A]" />
                <h2 className="text-xl font-semibold text-[#4B4036]">saas_users 表</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">欄位數:</span>
                  <span className="font-semibold text-[#4B4036]">{structure.saas_users_structure.column_count}</span>
                </div>
                <div className="text-sm text-[#2B3A3B]">
                  <div className="font-medium mb-2">現有欄位:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {structure.saas_users_structure.columns.map((column, index) => (
                      <div key={index} className="text-xs bg-[#FFFDF8] p-1 rounded">
                        <span className="font-mono">{column.column_name}</span>
                        <span className="text-[#8B7D6B] ml-2">({column.data_type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}
        </div>

        {/* 錯誤顯示 */}
        {error && (
          <HanamiCard className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <XCircleIcon className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">錯誤</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </HanamiCard>
        )}

        {/* 表狀態列表 */}
        {structure && (
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
              HanamiEcho 所需表狀態
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {structure.required_tables_status.map((table, index) => (
                <motion.div
                  key={table.table_name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center space-x-3 p-3 bg-[#FFFDF8] rounded-lg border"
                >
                  {getStatusIcon(table.exists)}
                  <div className="flex-1">
                    <div className="font-medium text-[#4B4036] text-sm">
                      {table.table_name}
                    </div>
                    <div className={`text-xs ${getStatusColor(table.exists)}`}>
                      {table.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </HanamiCard>
        )}

        {/* 現有表列表 */}
        {structure && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                現有 Hanami 表
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {structure.tables.hanami.map((table, index) => (
                  <div key={index} className="text-sm bg-[#FFFDF8] p-2 rounded">
                    <span className="font-mono text-[#4B4036]">{table}</span>
                  </div>
                ))}
              </div>
            </HanamiCard>

            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                現有 SAAS 表
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {structure.tables.saas.map((table, index) => (
                  <div key={index} className="text-sm bg-[#FFFDF8] p-2 rounded">
                    <span className="font-mono text-[#4B4036]">{table}</span>
                  </div>
                ))}
              </div>
            </HanamiCard>
          </div>
        )}
      </div>
    </div>
  );
}


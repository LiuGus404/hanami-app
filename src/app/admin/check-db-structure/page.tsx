'use client';

import React, { useState, useEffect } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

export default function CheckDBStructurePage() {
  const { user, loading: userLoading } = useUser();
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDBStructure = async () => {
    try {
      setLoading(true);
      
      // 直接嘗試查詢表，如果失敗說明表不存在
      const { data: sampleData, error: dataError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .limit(1);
      
      console.log('表存在檢查:', { sampleData, dataError });
      
      if (dataError) {
        if (dataError.code === '42P01') {
          // 表不存在
          setDbInfo({ 
            error: '表不存在', 
            details: 'hanami_learning_paths 表不存在，需要先創建表',
            tableExists: false
          });
        } else {
          // 其他錯誤
          setDbInfo({ 
            error: '檢查表失敗', 
            details: dataError,
            tableExists: false
          });
        }
        return;
      }
      
      // 表存在，檢查表結構
      const { data: allData, error: allDataError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .limit(5);
      
      if (allDataError) {
        console.error('獲取表數據失敗:', allDataError);
        setDbInfo({ 
          error: '獲取表數據失敗', 
          details: allDataError,
          tableExists: true
        });
        return;
      }
      
      // 分析表結構（通過檢查數據推斷）
      const columns: any[] = [];
      if (allData && allData.length > 0) {
        const sample = allData[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          columns.push({
            column_name: key,
            data_type: Array.isArray(value) ? 'array' : typeof value,
            is_nullable: value === null ? 'YES' : 'NO',
            column_default: null
          });
        });
      }
      
      setDbInfo({
        tableExists: true,
        columns: columns,
        sampleData: allData,
        tableError: null,
        columnsError: null,
        dataError: null
      });
      
    } catch (error) {
      console.error('檢查資料庫結構時發生錯誤:', error);
      setDbInfo({ error: '檢查失敗', details: error });
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    try {
      setLoading(true);
      
      // 創建正確的表結構
      const { error } = await supabase.rpc('create_learning_paths_table_simple');
      
      if (error) {
        console.error('創建表失敗:', error);
        setDbInfo({ error: '創建表失敗', details: error });
      } else {
        setDbInfo({ success: '表創建成功' });
        // 重新檢查
        setTimeout(checkDBStructure, 1000);
      }
    } catch (error) {
      console.error('創建表時發生錯誤:', error);
      setDbInfo({ error: '創建表失敗', details: error });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanami-primary mx-auto mb-4"></div>
            <p className="text-hanami-text-secondary">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-hanami-text mb-2">需要登入</h2>
            <p className="text-hanami-text-secondary mb-4">請先登入系統以檢查資料庫結構</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            資料庫結構檢查
          </h1>
          <p className="text-hanami-text-secondary">
            檢查 hanami_learning_paths 表的結構和狀態
          </p>
        </div>

        <div className="space-y-6">
          <HanamiCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-hanami-text">
                資料庫檢查工具
              </h2>
              <div className="flex gap-2">
                <HanamiButton
                  variant="primary"
                  onClick={checkDBStructure}
                  disabled={loading}
                >
                  {loading ? '檢查中...' : '檢查資料庫結構'}
                </HanamiButton>
                <HanamiButton
                  variant="cute"
                  onClick={createTable}
                  disabled={loading}
                >
                  {loading ? '創建中...' : '創建學習路徑表'}
                </HanamiButton>
                                <HanamiButton
                  variant="soft"
                  onClick={() => {
                    const sql = `-- 在 Supabase SQL Editor 中執行以下腳本：
-- 1. 創建表
CREATE TABLE IF NOT EXISTS public.hanami_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tree_id UUID,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_node_id TEXT NOT NULL DEFAULT 'start',
  end_node_id TEXT NOT NULL DEFAULT 'end',
  total_duration INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 禁用 RLS
ALTER TABLE public.hanami_learning_paths DISABLE ROW LEVEL SECURITY;`;
                    
                    navigator.clipboard.writeText(sql);
                    alert('SQL 腳本已複製到剪貼板！請在 Supabase SQL Editor 中執行。');
                  }}
                >
                  複製 SQL 腳本
                </HanamiButton>
                <HanamiButton
                  variant="secondary"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      
                      // 測試保存功能
                      const testPath = {
                        name: '測試學習路徑',
                        description: '這是一個測試學習路徑',
                        tree_id: 'test-tree-id',
                        nodes: [
                          {
                            id: 'start',
                            type: 'start',
                            title: '開始學習',
                            position: { x: 100, y: 200 }
                          },
                          {
                            id: 'end',
                            type: 'end',
                            title: '完成學習',
                            position: { x: 300, y: 200 }
                          }
                        ],
                        startNodeId: 'start',
                        endNodeId: 'end',
                        totalDuration: 30,
                        difficulty: 1,
                        tags: ['測試']
                      };
                      
                      const response = await fetch('/api/learning-paths', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-User-Email': user?.email || '',
                          'X-User-ID': user?.id || '',
                          'X-User-Role': user?.role || 'unknown',
                        },
                        body: JSON.stringify(testPath),
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || '保存失敗');
                      }
                      
                      const result = await response.json();
                      alert(`測試保存成功！ID: ${result.data?.id}`);
                      
                      // 重新檢查
                      setTimeout(checkDBStructure, 1000);
                      
                    } catch (error) {
                      console.error('測試保存失敗:', error);
                      alert(`測試保存失敗：${error instanceof Error ? error.message : String(error)}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  測試保存功能
                </HanamiButton>
              </div>
            </div>
          </HanamiCard>

          {dbInfo && (
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-hanami-text mb-4">
                檢查結果
              </h3>
              
              {dbInfo.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="text-red-800 font-medium">錯誤</div>
                  <div className="text-red-700 text-sm">{dbInfo.error}</div>
                  {dbInfo.details && (
                    <pre className="text-red-600 text-xs mt-2 bg-red-100 p-2 rounded overflow-auto">
                      {JSON.stringify(dbInfo.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {dbInfo.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="text-green-800 font-medium">成功</div>
                  <div className="text-green-700">{dbInfo.success}</div>
                </div>
              )}

              {dbInfo.tableExists && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-hanami-text mb-2">表狀態</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-green-800">✅ hanami_learning_paths 表存在</span>
                    </div>
                  </div>

                  {dbInfo.columns && (
                    <div>
                      <h4 className="font-medium text-hanami-text mb-2">表結構</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left p-2">欄位名</th>
                              <th className="text-left p-2">類型</th>
                              <th className="text-left p-2">可空</th>
                              <th className="text-left p-2">預設值</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dbInfo.columns.map((column: any, index: number) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="p-2 font-mono">{column.column_name}</td>
                                <td className="p-2">{column.data_type}</td>
                                <td className="p-2">{column.is_nullable === 'YES' ? '是' : '否'}</td>
                                <td className="p-2">{column.column_default || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {dbInfo.sampleData && (
                    <div>
                      <h4 className="font-medium text-hanami-text mb-2">樣本數據</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(dbInfo.sampleData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {dbInfo.rlsStatus && (
                    <div>
                      <h4 className="font-medium text-hanami-text mb-2">RLS 狀態</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(dbInfo.rlsStatus, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </HanamiCard>
          )}
        </div>
      </div>
    </div>
  );
}

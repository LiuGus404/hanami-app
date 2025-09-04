'use client';

import React, { useState, useEffect } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

export default function CheckTriggersPage() {
  const { user, loading: userLoading } = useUser();
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !userLoading) {
      checkTriggers();
    }
  }, [user, userLoading]);

  const checkTriggers = async () => {
    try {
      setLoading(true);
      setError(null);

      // 檢查 hanami_growth_goals 表上的觸發器
      const { data, error: triggerError } = await supabase
        .rpc('get_table_triggers', { table_name: 'hanami_growth_goals' });

      if (triggerError) {
        // 如果 RPC 函數不存在，嘗試直接查詢
        console.log('RPC 函數不存在，嘗試直接查詢觸發器...');
        
        // 使用 SQL 查詢觸發器
        const { data: sqlData, error: sqlError } = await supabase
          .from('information_schema.triggers')
          .select('*')
          .eq('event_object_table', 'hanami_growth_goals');

        if (sqlError) {
          throw new Error(`查詢觸發器失敗: ${sqlError.message}`);
        }

        setTriggers(sqlData || []);
      } else {
        setTriggers(data || []);
      }

      console.log('觸發器檢查結果:', triggers);
    } catch (error) {
      console.error('檢查觸發器失敗:', error);
      setError(error instanceof Error ? error.message : '檢查觸發器失敗');
    } finally {
      setLoading(false);
    }
  };

  const removeProblematicTrigger = async (triggerName: string) => {
    try {
      setLoading(true);
      
      // 嘗試刪除有問題的觸發器
      const { error } = await supabase.rpc('drop_trigger_if_exists', {
        trigger_name: triggerName,
        table_name: 'hanami_growth_goals'
      });

      if (error) {
        // 如果 RPC 函數不存在，提供 SQL 語句
        console.log('RPC 函數不存在，請手動執行以下 SQL:');
        console.log(`DROP TRIGGER IF EXISTS ${triggerName} ON hanami_growth_goals;`);
        setError(`觸發器刪除失敗，請手動執行 SQL: DROP TRIGGER IF EXISTS ${triggerName} ON hanami_growth_goals;`);
      } else {
        setError('觸發器刪除成功，請重新檢查');
        await checkTriggers();
      }
    } catch (error) {
      console.error('刪除觸發器失敗:', error);
      setError(error instanceof Error ? error.message : '刪除觸發器失敗');
    } finally {
      setLoading(false);
    }
  };

  const checkVersionChangeLogsTable = async () => {
    try {
      setLoading(true);
      
      // 檢查 hanami_version_change_logs 表是否存在
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'hanami_version_change_logs')
        .eq('table_schema', 'public');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // 表存在，檢查結構
        const { data: columns, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_name', 'hanami_version_change_logs')
          .eq('table_schema', 'public');

        if (columnError) {
          throw columnError;
        }

        console.log('hanami_version_change_logs 表結構:', columns);
        setError(`表存在，但可能缺少 version_id 欄位。欄位列表: ${columns?.map(c => c.column_name).join(', ')}`);
      } else {
        setError('hanami_version_change_logs 表不存在');
      }
    } catch (error) {
      console.error('檢查版本變更日誌表失敗:', error);
      setError(error instanceof Error ? error.message : '檢查版本變更日誌表失敗');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-hanami-text-secondary">請先登入</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-4">檢查觸發器</h1>
          <p className="text-hanami-text-secondary">
            診斷 hanami_growth_goals 表上的觸發器問題
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4">觸發器檢查</h3>
            <HanamiButton
              onClick={checkTriggers}
              disabled={loading}
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查觸發器'}
            </HanamiButton>
          </HanamiCard>

          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4">版本變更日誌表檢查</h3>
            <HanamiButton
              onClick={checkVersionChangeLogsTable}
              disabled={loading}
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查版本變更日誌表'}
            </HanamiButton>
          </HanamiCard>
        </div>

        {error && (
          <HanamiCard className="p-6 mb-6 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-red-600 mb-2">錯誤信息</h3>
            <p className="text-red-600">{error}</p>
          </HanamiCard>
        )}

        {triggers.length > 0 && (
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4">
              發現的觸發器 ({triggers.length})
            </h3>
            <div className="space-y-4">
              {triggers.map((trigger, index) => (
                <div key={index} className="border border-hanami-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-hanami-text mb-2">
                        觸發器名稱: {trigger.trigger_name}
                      </h4>
                      <div className="text-sm text-hanami-text-secondary space-y-1">
                        <p>事件: {trigger.event_manipulation}</p>
                        <p>時機: {trigger.action_timing}</p>
                        <p>動作: {trigger.action_statement}</p>
                        {trigger.event_object_schema && (
                          <p>對象模式: {trigger.event_object_schema}</p>
                        )}
                        {trigger.event_object_table && (
                          <p>對象表: {trigger.event_object_table}</p>
                        )}
                      </div>
                    </div>
                    <HanamiButton
                      variant="danger"
                      size="sm"
                      onClick={() => removeProblematicTrigger(trigger.trigger_name)}
                      disabled={loading}
                    >
                      刪除
                    </HanamiButton>
                  </div>
                </div>
              ))}
            </div>
          </HanamiCard>
        )}

        {triggers.length === 0 && !loading && !error && (
          <HanamiCard className="p-6 text-center">
            <p className="text-hanami-text-secondary">沒有發現觸發器</p>
          </HanamiCard>
        )}
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import { useUser } from '@/hooks/useUser';

export default function FixTriggerIssuePage() {
  const { user, loading: userLoading } = useUser();
  const [showSolution, setShowSolution] = useState(false);

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
          <h1 className="text-3xl font-bold text-hanami-text mb-4">修復觸發器問題</h1>
          <p className="text-hanami-text-secondary">
            解決 "column 'version_id' of relation 'hanami_version_change_logs' does not exist" 錯誤
          </p>
        </div>

        <HanamiCard className="p-6 mb-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold text-orange-600 mb-2">問題描述</h3>
          <p className="text-hanami-text-secondary mb-4">
            當嘗試切換成長樹目標的完成狀態時，系統出現錯誤：
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              column "version_id" of relation "hanami_version_change_logs" does not exist
            </code>
          </p>
          <p className="text-hanami-text-secondary">
            這個錯誤通常是由於資料庫中存在有問題的觸發器，或者缺少必要的表結構造成的。
          </p>
        </HanamiCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4">解決方案 1：刪除有問題的觸發器</h3>
            <p className="text-hanami-text-secondary mb-4">
              如果不需要版本變更日誌功能，可以直接刪除觸發器：
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <code className="text-sm">
                DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
              </code>
            </div>
            <p className="text-xs text-hanami-text-secondary">
              這會移除觸發器，但不會影響成長樹目標的正常功能。
            </p>
          </HanamiCard>

          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4">解決方案 2：創建缺失的表</h3>
            <p className="text-hanami-text-secondary mb-4">
              如果需要版本變更日誌功能，可以創建缺失的表：
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <code className="text-sm">
                CREATE TABLE IF NOT EXISTS hanami_version_change_logs (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  version_id UUID,
                  table_name TEXT NOT NULL,
                  record_id UUID,
                  change_type TEXT NOT NULL,
                  old_data JSONB,
                  new_data JSONB,
                  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  changed_by UUID
                );
              </code>
            </div>
            <p className="text-xs text-hanami-text-secondary">
              這會創建一個基本的版本變更日誌表。
            </p>
          </HanamiCard>
        </div>

        <HanamiCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-hanami-text mb-4">推薦操作步驟</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-hanami-text">備份資料庫</p>
                <p className="text-sm text-hanami-text-secondary">
                  在執行任何修復操作前，建議先備份資料庫。
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-hanami-text">選擇解決方案</p>
                <p className="text-sm text-hanami-text-secondary">
                  根據您的需求選擇刪除觸發器或創建缺失的表。
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-hanami-text">執行 SQL</p>
                <p className="text-sm text-hanami-text-secondary">
                  在 Supabase SQL 編輯器中執行選擇的解決方案。
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium text-hanami-text">測試功能</p>
                <p className="text-sm text-hanami-text-secondary">
                  測試成長樹目標的完成狀態切換功能是否正常。
                </p>
              </div>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h3 className="text-lg font-semibold text-hanami-text mb-4">預防措施</h3>
          <div className="space-y-3">
            <p className="text-hanami-text-secondary">
              • 在創建觸發器前，確保所有相關的表和欄位都存在
            </p>
            <p className="text-hanami-text-secondary">
              • 使用 IF NOT EXISTS 和 IF EXISTS 語句來避免錯誤
            </p>
            <p className="text-hanami-text-secondary">
              • 定期檢查資料庫結構的一致性
            </p>
            <p className="text-hanami-text-secondary">
              • 在部署前在測試環境中驗證所有資料庫變更
            </p>
          </div>
        </HanamiCard>

        <div className="mt-8 text-center">
          <p className="text-sm text-hanami-text-secondary">
            如果您需要技術支援或有其他問題，請聯繫系統管理員。
          </p>
        </div>
      </div>
    </div>
  );
}

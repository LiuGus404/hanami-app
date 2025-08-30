'use client';

import React, { useState, useEffect } from 'react';
import { HanamiButton, HanamiCard } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { VersionDisplay } from '@/components/ui/VersionDisplay';

export default function TestVersionSystemPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(full_name),
          tree:hanami_growth_trees(tree_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('載入評估記錄錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const testVersionInfo = async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/assessment-version-info?assessmentId=${assessmentId}`);
      const result = await response.json();
      
      if (result.success) {
        setVersionInfo(result.data);
        console.log('版本資訊:', result.data);
      } else {
        console.error('獲取版本資訊失敗:', result.error);
        alert('獲取版本資訊失敗: ' + result.error);
      }
    } catch (error) {
      console.error('測試版本資訊錯誤:', error);
      alert('測試版本資訊時發生錯誤');
    }
  };

  const createTestVersion = async () => {
    try {
      const response = await fetch('/api/assessment-version-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treeId: '9e8ffd02-de23-481a-b2b1-1b42d0eb481d', // 使用現有的樹ID
          version: '2.0',
          versionName: '測試版本 2.0',
          versionDescription: '這是一個測試版本，用於驗證版本控制系統',
          changesSummary: '新增了版本控制功能，改進了目標匹配邏輯',
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('測試版本創建成功！');
        console.log('創建的版本ID:', result.data.versionId);
      } else {
        alert('測試版本創建失敗: ' + result.error);
      }
    } catch (error) {
      console.error('創建測試版本錯誤:', error);
      alert('創建測試版本時發生錯誤');
    }
  };

  const testVersionFunctions = async () => {
    try {
      setTesting(true);
      
      // 暫時顯示提示訊息，因為相關函數可能不存在
      alert('版本系統測試功能正在開發中，請稍後再試。');
      
    } catch (error) {
      console.error('測試失敗:', error);
      alert('測試失敗: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">版本控制系統測試</h1>

      {/* 測試按鈕 */}
      <HanamiCard className="p-4">
        <h2 className="text-lg font-semibold mb-3">測試功能</h2>
        <div className="flex gap-2">
          <HanamiButton onClick={createTestVersion}>
            創建測試版本
          </HanamiButton>
          <HanamiButton onClick={testVersionFunctions}>
            測試資料庫函數
          </HanamiButton>
        </div>
      </HanamiCard>

      {/* 評估記錄列表 */}
      <HanamiCard className="p-4">
        <h2 className="text-lg font-semibold mb-3">評估記錄列表</h2>
        <div className="space-y-2">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">
                  {assessment.student?.full_name || '未知學生'}
                </div>
                <div className="text-sm text-gray-600">
                  {assessment.tree?.tree_name || '未知成長樹'}
                </div>
                <div className="text-xs text-gray-500">
                  評估日期: {assessment.assessment_date}
                </div>
                <div className="text-xs text-gray-500">
                  版本: {assessment.tree_version || '1.0'}
                </div>
              </div>
              <div className="flex gap-2">
                <HanamiButton
                  size="sm"
                  onClick={() => {
                    setSelectedAssessment(assessment);
                    testVersionInfo(assessment.id);
                  }}
                >
                  測試版本資訊
                </HanamiButton>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 版本資訊顯示 */}
      {selectedAssessment && versionInfo && (
        <HanamiCard className="p-4">
          <h2 className="text-lg font-semibold mb-3">版本資訊測試結果</h2>
          <VersionDisplay
            versionInfo={versionInfo}
            assessmentDate={selectedAssessment.assessment_date}
          />
        </HanamiCard>
      )}

      {/* 原始資料顯示 */}
      {versionInfo && (
        <HanamiCard className="p-4">
          <h2 className="text-lg font-semibold mb-3">原始版本資訊資料</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(versionInfo, null, 2)}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
}

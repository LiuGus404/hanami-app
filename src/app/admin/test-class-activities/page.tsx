'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui';

export default function TestClassActivitiesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testClassActivitiesAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 測試本週的日期範圍
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // 週日
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // 週六

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      console.log('Testing with date range:', { weekStartStr, weekEndStr });

      const response = await fetch(`/api/class-activities?weekStart=${weekStartStr}&weekEnd=${weekEndStr}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${data.error || 'Unknown error'}`);
      }

      setResult(data);
      console.log('API Response:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseTables = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 檢查各個表的狀態
      const tables = [
        'hanami_student_lesson',
        'hanami_tree_activities', 
        'hanami_teaching_activities',
        'hanami_growth_trees',
        'Hanami_Students'
      ];

      const results: any = {};

      for (const table of tables) {
        try {
          const response = await fetch(`/api/test-table?table=${table}`);
          const data = await response.json();
          results[table] = data;
        } catch (err: any) {
          results[table] = { error: err.message };
        }
      }

      setResult({ tableChecks: results });
      console.log('Table check results:', results);
    } catch (err: any) {
      setError(err.message);
      console.error('Table check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">課堂活動 API 測試</h1>
      
      <div className="space-y-4 mb-6">
        <HanamiButton
          onClick={testClassActivitiesAPI}
          disabled={loading}
          className="mr-4"
        >
          {loading ? '測試中...' : '測試 Class Activities API'}
        </HanamiButton>

        <HanamiButton
          onClick={checkDatabaseTables}
          disabled={loading}
          variant="secondary"
        >
          {loading ? '檢查中...' : '檢查資料庫表狀態'}
        </HanamiButton>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-medium mb-2">錯誤</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-medium mb-2">測試結果</h3>
          <pre className="text-green-700 text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 
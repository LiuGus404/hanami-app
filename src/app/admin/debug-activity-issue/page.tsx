'use client';

import { useState, useEffect } from 'react';
import { HanamiCard } from '@/components/ui';

export default function DebugActivityIssuePage() {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-env');
      const result = await response.json();
      setEnvStatus(result);
    } catch (error) {
      setEnvStatus({ error: (error as Error).message });
    }
    setLoading(false);
  };

  const testStudentActivitiesAPI = async () => {
    setLoading(true);
    try {
      // 測試學生活動 API
      const response = await fetch('/api/student-activities?studentId=test&lessonDate=2025-01-01');
      const result = await response.json();
      setApiTest(result);
    } catch (error) {
      setApiTest({ error: (error as Error).message });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#2B3A3B] mb-6">
        活動管理問題診斷
      </h1>

      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">
          環境變數檢查
        </h2>
        <button
          onClick={checkEnvironment}
          disabled={loading}
          className="px-4 py-2 bg-[#E8B4A0] text-white rounded-lg hover:bg-[#D4A5A5] transition-colors"
        >
          {loading ? '檢查中...' : '檢查環境變數'}
        </button>
        
        {envStatus && (
          <div className="mt-4 p-4 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
            <h3 className="font-medium text-[#2B3A3B] mb-2">環境變數狀態:</h3>
            <pre className="text-sm text-[#8B7355] overflow-auto">
              {JSON.stringify(envStatus, null, 2)}
            </pre>
          </div>
        )}
      </HanamiCard>

      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">
          API 測試
        </h2>
        <button
          onClick={testStudentActivitiesAPI}
          disabled={loading}
          className="px-4 py-2 bg-[#E8B4A0] text-white rounded-lg hover:bg-[#D4A5A5] transition-colors"
        >
          {loading ? '測試中...' : '測試學生活動 API'}
        </button>
        
        {apiTest && (
          <div className="mt-4 p-4 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
            <h3 className="font-medium text-[#2B3A3B] mb-2">API 測試結果:</h3>
            <pre className="text-sm text-[#8B7355] overflow-auto">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          </div>
        )}
      </HanamiCard>

      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">
          常見問題解決方案
        </h2>
        <div className="space-y-4 text-[#2B3A3B]">
          <div>
            <h3 className="font-medium text-[#A68A64]">1. 環境變數問題</h3>
            <p className="text-sm text-[#8B7355]">
              確保在 Vercel 專案設定中正確配置了以下環境變數：
            </p>
            <ul className="text-sm text-[#8B7355] ml-4 mt-2">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-[#A68A64]">2. 資料庫表問題</h3>
            <p className="text-sm text-[#8B7355]">
              確保以下資料表存在且可訪問：
            </p>
            <ul className="text-sm text-[#8B7355] ml-4 mt-2">
              <li>• hanami_student_activities</li>
              <li>• hanami_teaching_activities</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-[#A68A64]">3. 權限問題</h3>
            <p className="text-sm text-[#8B7355]">
              檢查 Supabase RLS 政策和 API 權限設定
            </p>
          </div>
        </div>
      </HanamiCard>
    </div>
  );
}

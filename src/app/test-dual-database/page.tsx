'use client';

import { useState, useEffect } from 'react';
import { supabase, getSaasSupabaseClient } from '@/lib/supabase';

export default function TestDualDatabasePage() {
  const [newSystemData, setNewSystemData] = useState<any[]>([]);
  const [legacySystemData, setLegacySystemData] = useState<any[]>([]);
  const [newSystemError, setNewSystemError] = useState<string | null>(null);
  const [legacySystemError, setLegacySystemError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testDualDatabase();
  }, []);

  const testDualDatabase = async () => {
    setLoading(true);

    // 測試新的 SaaS 系統
    try {
      console.log('測試新 SaaS 系統...');
      const saasSupabase = getSaasSupabaseClient();
      const { data: newData, error: newError } = await saasSupabase
        .from('ai_rooms')
        .select('*')
        .limit(5);

      if (newError) {
        setNewSystemError(`新系統錯誤: ${newError.message}`);
        console.error('新系統錯誤:', newError);
      } else {
        setNewSystemData(newData || []);
        console.log('新系統資料:', newData);
      }
    } catch (error) {
      setNewSystemError(`新系統異常: ${error}`);
      console.error('新系統異常:', error);
    }

    // 測試舊的學生管理系統（現在是主要系統）
    try {
      console.log('測試學生管理系統...');
      const { data: legacyData, error: legacyError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .limit(5);

      if (legacyError) {
        setLegacySystemError(`學生系統錯誤: ${legacyError.message}`);
        console.error('學生系統錯誤:', legacyError);
      } else {
        setLegacySystemData(legacyData || []);
        console.log('學生系統資料:', legacyData);
      }
    } catch (error) {
      setLegacySystemError(`學生系統異常: ${error}`);
      console.error('學生系統異常:', error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">
          雙資料庫系統測試
        </h1>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB6C1]"></div>
            <p className="mt-2 text-[#4B4036]">正在測試資料庫連接...</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* 新 SaaS 系統 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-[#4B4036] mb-4 flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              新 SaaS 系統 (hanami-saas-system)
            </h2>
            
            {newSystemError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">{newSystemError}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-600 text-sm">✅ 連接成功</p>
                <p className="text-sm text-gray-600">找到 {newSystemData.length} 筆 AI 聊天室資料</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium text-[#4B4036]">AI 聊天室資料:</h3>
              {newSystemData.length > 0 ? (
                newSystemData.map((room, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p><strong>ID:</strong> {room.id}</p>
                    <p><strong>標題:</strong> {room.title || '未命名'}</p>
                    <p><strong>創建時間:</strong> {new Date(room.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">無資料或載入中...</p>
              )}
            </div>
          </div>

          {/* 舊學生管理系統 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-[#4B4036] mb-4 flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              舊學生管理系統 (Hanami-AI-Student-Database)
            </h2>
            
            {legacySystemError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">{legacySystemError}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-600 text-sm">✅ 連接成功</p>
                <p className="text-sm text-gray-600">找到 {legacySystemData.length} 筆學生資料</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium text-[#4B4036]">學生資料:</h3>
              {legacySystemData.length > 0 ? (
                legacySystemData.map((student, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p><strong>ID:</strong> {student.id}</p>
                    <p><strong>姓名:</strong> {student.full_name || '未命名'}</p>
                    <p><strong>課程類型:</strong> {student.course_type || '未指定'}</p>
                    <p><strong>學生類型:</strong> {student.student_type || '未指定'}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">無資料或載入中...</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={testDualDatabase}
            className="px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            重新測試連接
          </button>
        </div>

        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[#4B4036] mb-4">系統說明</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#2B3A3B]">
            <div>
              <h4 className="font-medium mb-2">新 SaaS 系統用途:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>AI 聊天室管理</li>
                <li>AI 角色配置</li>
                <li>使用統計追蹤</li>
                <li>新功能開發</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">舊學生管理系統用途:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>學生資料管理</li>
                <li>課程記錄</li>
                <li>教師管理</li>
                <li>家長連結</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

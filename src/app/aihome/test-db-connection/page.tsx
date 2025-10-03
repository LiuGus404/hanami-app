'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDbConnectionPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // 測試基本連接
      const { data: connectionTest, error: connectionError } = await supabase
        .from('hanami_trial_queue')
        .select('count', { count: 'exact', head: true });

      console.log('連接測試結果:', { connectionTest, connectionError });

      // 測試插入權限
      const testData = {
        full_name: '測試用戶',
        phone_no: '+85212345678',
        school: '測試學校',
        school_schedule: 'morning',
        prefer_time: ['星期一-上午'],
        notes: '這是測試資料',
        status: 'test'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('hanami_trial_queue')
        .insert(testData)
        .select();

      console.log('插入測試結果:', { insertData, insertError });

      // 如果插入成功，刪除測試資料
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from('hanami_trial_queue')
          .delete()
          .eq('id', insertData[0].id);

        console.log('刪除測試資料結果:', { deleteError });
      }

      setTestResult({
        connection: { success: !connectionError, error: connectionError },
        insert: { success: !insertError, error: insertError, data: insertData },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('測試錯誤:', error);
      setTestResult({
        error: error instanceof Error ? error.message : '未知錯誤',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testTableStructure = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // 查詢表結構
      const { data, error } = await supabase
        .from('hanami_trial_queue')
        .select('*')
        .limit(1);

      console.log('表結構測試結果:', { data, error });

      setTestResult({
        tableStructure: { success: !error, error, sampleData: data },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('表結構測試錯誤:', error);
      setTestResult({
        error: error instanceof Error ? error.message : '未知錯誤',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">
          資料庫連接測試
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* 測試按鈕 */}
          <div className="flex gap-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試連接和插入'}
            </button>
            <button
              onClick={testTableStructure}
              disabled={loading}
              className="px-6 py-3 bg-white text-[#4B4036] border-2 border-[#EADBC8] rounded-lg font-semibold hover:border-[#FFD59A] transition-all duration-200 disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試表結構'}
            </button>
          </div>

          {/* 結果顯示 */}
          {testResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#4B4036] mb-2">測試結果</h3>
              <pre className="text-sm text-gray-700 overflow-auto max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {/* 環境信息 */}
          <div className="bg-[#FFF9F2] rounded-lg p-4">
            <h3 className="font-semibold text-[#4B4036] mb-2">環境信息</h3>
            <div className="text-sm text-[#2B3A3B] space-y-1">
              <p>• Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '已設置' : '未設置'}</p>
              <p>• Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已設置' : '未設置'}</p>
              <p>• 當前時間: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* 調試提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">調試提示</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. 打開瀏覽器開發者工具的控制台</p>
              <p>2. 點擊測試按鈕查看詳細日誌</p>
              <p>3. 檢查 Supabase 控制台的資料庫權限</p>
              <p>4. 確認表結構是否正確創建</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

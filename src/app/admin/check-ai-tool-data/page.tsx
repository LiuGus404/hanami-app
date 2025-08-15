'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function CheckAIToolDataPage() {
  const [loading, setLoading] = useState(false);
  const [dataInfo, setDataInfo] = useState<any>(null);

  // 檢查資料
  const checkData = async () => {
    try {
      setLoading(true);
      
      // 1. 檢查表是否存在
      console.log('檢查表是否存在...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('ai_tasks')
        .select('count')
        .limit(1);

      if (tableError) {
        console.error('表檢查失敗:', tableError);
        setDataInfo({
          tableExists: false,
          error: tableError.message,
          recordCount: 0,
          records: []
        });
        return;
      }

      console.log('表存在，檢查記錄數量...');

      // 2. 獲取記錄數量
      const { count, error: countError } = await supabase
        .from('ai_tasks')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('獲取記錄數量失敗:', countError);
        setDataInfo({
          tableExists: true,
          error: countError.message,
          recordCount: 0,
          records: []
        });
        return;
      }

      console.log('記錄數量:', count);

      // 3. 獲取最近記錄
      const { data: records, error: recordsError } = await supabase
        .from('ai_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recordsError) {
        console.error('獲取記錄失敗:', recordsError);
        setDataInfo({
          tableExists: true,
          recordCount: count,
          error: recordsError.message,
          records: []
        });
        return;
      }

      console.log('獲取到的記錄:', records);

      setDataInfo({
        tableExists: true,
        recordCount: count,
        records: records || [],
        error: null
      });

      toast.success(`檢查完成：找到 ${count} 筆記錄`);

    } catch (error) {
      console.error('檢查資料失敗:', error);
      toast.error('檢查資料失敗');
      setDataInfo({
        tableExists: false,
        error: error instanceof Error ? error.message : String(error),
        recordCount: 0,
        records: []
      });
    } finally {
      setLoading(false);
    }
  };

  // 創建測試資料
  const createTestData = async () => {
    try {
      setLoading(true);
      
      const testRecords = [
        {
          status: 'completed',
          title: '內容生成測試 1',
          model: 'gpt-4',
          prompt: '測試提示 1',
          result: '測試結果 1',
          assigned_model: 'gpt-4',
          memory_id: 'test-memory-1'
        },
        {
          status: 'processing',
          title: '內容生成測試 2',
          model: 'gpt-3.5-turbo',
          prompt: '測試提示 2',
          result: '測試結果 2',
          assigned_model: 'gpt-3.5-turbo',
          memory_id: 'test-memory-2'
        },
        {
          status: 'queued',
          title: '內容生成測試 3',
          model: 'claude-3',
          prompt: '測試提示 3',
          result: '測試結果 3',
          assigned_model: 'claude-3',
          memory_id: 'test-memory-3'
        },
        {
          status: 'failed',
          title: '內容生成測試 4',
          model: 'gpt-4',
          prompt: '測試提示 4',
          result: '測試結果 4',
          error_message: '測試錯誤訊息',
          assigned_model: 'gpt-4',
          memory_id: 'test-memory-4'
        }
      ];

      console.log('創建測試資料...');
      const { data, error } = await supabase
        .from('ai_tasks')
        .insert(testRecords)
        .select();

      if (error) {
        console.error('創建測試資料失敗:', error);
        toast.error(`創建測試資料失敗: ${error.message}`);
        return;
      }

      console.log('測試資料創建成功:', data);
      toast.success(`成功創建 ${data.length} 筆測試資料`);

      // 重新檢查資料
      await checkData();

    } catch (error) {
      console.error('創建測試資料異常:', error);
      toast.error('創建測試資料異常');
    } finally {
      setLoading(false);
    }
  };

  // 清空所有資料
  const clearAllData = async () => {
    if (!confirm('確定要清空所有AI工具使用記錄嗎？此操作無法撤銷。')) {
      return;
    }

    try {
      setLoading(true);
      
      console.log('清空所有資料...');
      const { error } = await supabase
        .from('ai_tasks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 刪除所有記錄

      if (error) {
        console.error('清空資料失敗:', error);
        toast.error(`清空資料失敗: ${error.message}`);
        return;
      }

      console.log('資料清空成功');
      toast.success('所有資料已清空');

      // 重新檢查資料
      await checkData();

    } catch (error) {
      console.error('清空資料異常:', error);
      toast.error('清空資料異常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">檢查AI工具資料</h1>
      
      <div className="space-y-6">
        {/* 操作按鈕 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">資料操作</h2>
          <div className="flex gap-4">
            <button
              onClick={checkData}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '檢查中...' : '檢查資料'}
            </button>
            <button
              onClick={createTestData}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建測試資料'}
            </button>
            <button
              onClick={clearAllData}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? '清空中...' : '清空所有資料'}
            </button>
          </div>
        </div>

        {/* 資料資訊 */}
        {dataInfo && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">資料資訊</h2>
            
            <div className="space-y-4">
              {/* 基本資訊 */}
              <div>
                <h3 className="font-medium text-gray-700">基本資訊</h3>
                <div className="mt-2 space-y-1">
                  <div>表存在: <span className={dataInfo.tableExists ? 'text-green-600' : 'text-red-600'}>
                    {dataInfo.tableExists ? '是' : '否'}
                  </span></div>
                  <div>記錄數量: <span className="font-medium">{dataInfo.recordCount}</span></div>
                  {dataInfo.error && (
                    <div className="text-red-600">錯誤: {dataInfo.error}</div>
                  )}
                </div>
              </div>

              {/* 記錄列表 */}
              {dataInfo.records && dataInfo.records.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700">最近記錄</h3>
                  <div className="mt-2 space-y-2">
                    {dataInfo.records.map((record: any) => (
                      <div key={record.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">ID: {record.id}</div>
                            <div className="text-sm text-gray-600">
                              工具: {record.tool_id} | 狀態: {record.status} | 用戶: {record.user_email}
                            </div>
                            <div className="text-sm text-gray-500">
                              創建時間: {new Date(record.created_at).toLocaleString()}
                            </div>
                            {record.error_message && (
                              <div className="text-sm text-red-600">
                                錯誤: {record.error_message}
                              </div>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            record.status === 'completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'queued' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 無資料提示 */}
              {dataInfo.recordCount === 0 && !dataInfo.error && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-2">暫無資料</div>
                  <div className="text-gray-500">點擊「創建測試資料」來添加一些測試記錄</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
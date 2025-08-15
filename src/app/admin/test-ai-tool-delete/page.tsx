'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function TestAIToolDeletePage() {
  const [toolId, setToolId] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  // 載入所有記錄
  const loadRecords = async () => {
    try {
      setLoading(true);
      // 使用 ai_tasks 表，因為 hanami_ai_tool_usage 表可能不存在
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('載入記錄失敗:', error);
      toast.error('載入記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 測試刪除
  const testDelete = async () => {
    if (!toolId) {
      toast.error('請輸入工具ID');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/test-ai-tool-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      });

      const result = await response.json();
      console.log('刪除結果:', result);

      if (result.success) {
        toast.success('刪除成功');
        loadRecords(); // 重新載入記錄
      } else {
        toast.error(`刪除失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('測試刪除失敗:', error);
      toast.error('測試刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">測試AI工具刪除功能</h1>
      
      <div className="space-y-6">
        {/* 載入記錄 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">載入記錄</h2>
          <button
            onClick={loadRecords}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '載入中...' : '載入最近10筆記錄'}
          </button>
        </div>

        {/* 測試刪除 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">測試刪除</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              placeholder="輸入工具ID"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={testDelete}
              disabled={loading || !toolId}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? '刪除中...' : '測試刪除'}
            </button>
          </div>
        </div>

        {/* 記錄列表 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">記錄列表</h2>
          {records.length === 0 ? (
            <p className="text-gray-500">暫無記錄</p>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="p-3 border rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>ID:</strong> {record.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-sm">
                      <strong>工具:</strong> {record.tool_id} | 
                      <strong>狀態:</strong> {record.status} | 
                      <strong>用戶:</strong> {record.user_email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
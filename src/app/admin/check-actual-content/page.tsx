'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function CheckActualContentPage() {
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordData, setRecordData] = useState<any>(null);

  const handleCheckContent = async () => {
    if (!requestId.trim()) {
      toast.error('請輸入請求ID');
      return;
    }

    try {
      setLoading(true);

      // 直接查詢Supabase
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('查詢失敗:', error);
        toast.error(`查詢失敗: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error('找不到對應的記錄');
        return;
      }

      setRecordData(data);
      console.log('完整的記錄數據:', JSON.stringify(data, null, 2));

      // 檢查result的結構
      if (data.result) {
        console.log('result內容:', data.result);
        console.log('result長度:', data.result.length);
        console.log('result前200字符:', data.result.substring(0, 200));
        
        try {
          const parsedResult = JSON.parse(data.result);
          console.log('解析後的result結構:', Object.keys(parsedResult));
          
          if (parsedResult.generated_content) {
            console.log('generated_content內容:', parsedResult.generated_content);
          }
          
          if (parsedResult.ai_stats) {
            console.log('ai_stats:', parsedResult.ai_stats);
          }
        } catch (e) {
          console.log('result不是有效的JSON格式');
        }
      }

      toast.success('查詢成功！請查看控制台輸出');

    } catch (error) {
      console.error('檢查內容錯誤:', error);
      toast.error('檢查內容時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">檢查實際保存的內容</h1>
      
      <div className="bg-white p-6 rounded-lg border max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">檢查Supabase中的實際數據</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請求ID
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="輸入要檢查的記錄請求ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleCheckContent}
            disabled={loading || !requestId.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '查詢中...' : '檢查內容'}
          </button>
        </div>
        
        {recordData && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">記錄詳情</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">基本信息</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">ID:</span> {recordData.id}</div>
                  <div><span className="font-medium">工具ID:</span> {recordData.tool_id}</div>
                  <div><span className="font-medium">狀態:</span> {recordData.status}</div>
                  <div><span className="font-medium">創建時間:</span> {new Date(recordData.created_at).toLocaleString()}</div>
                  <div><span className="font-medium">完成時間:</span> {recordData.completed_at ? new Date(recordData.completed_at).toLocaleString() : '未完成'}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">統計信息</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">處理時間:</span> {recordData.processing_time_ms}ms</div>
                  <div><span className="font-medium">Token數:</span> {recordData.token_count}</div>
                  <div><span className="font-medium">成本:</span> ${recordData.cost_estimate}</div>
                </div>
              </div>
            </div>
            
            {recordData.output_data && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">輸出數據結構</h4>
                <div className="text-sm bg-gray-100 p-3 rounded">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(recordData.output_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {recordData.input_data && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">輸入數據</h4>
                <div className="text-sm bg-gray-100 p-3 rounded">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(recordData.input_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• 此工具直接查詢Supabase數據庫</p>
          <p>• 可以看到實際保存的完整數據結構</p>
          <p>• 幫助診斷內容保存問題</p>
          <p>• 請查看瀏覽器控制台獲取詳細信息</p>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DebugN8nRawData() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testN8nRawData = async () => {
    setLoading(true);
    try {
      // 模擬n8n可能發送的不同數據格式
      const testCases = [
        {
          name: "標準數組格式",
          data: {
            request_id: "test_001",
            tool_id: "content-generation",
            status: "completed",
            result: [
              {
                message: {
                  content: "這是標準格式的音樂星際冒險故事內容..."
                },
                usage: { total_tokens: 100 },
                citations: ["url1", "url2"],
                model: "sonar"
              }
            ]
          }
        },
        {
          name: "直接內容格式",
          data: {
            request_id: "test_002",
            tool_id: "content-generation",
            status: "completed",
            result: [
              {
                content: "這是直接內容格式的音樂星際冒險故事...",
                usage: { total_tokens: 100 },
                citations: ["url1", "url2"],
                model: "sonar"
              }
            ]
          }
        },
        {
          name: "choices格式",
          data: {
            request_id: "test_003",
            tool_id: "content-generation",
            status: "completed",
            result: [
              {
                choices: [
                  {
                    message: {
                      content: "這是choices格式的音樂星際冒險故事..."
                    }
                  }
                ],
                usage: { total_tokens: 100 },
                citations: ["url1", "url2"],
                model: "sonar"
              }
            ]
          }
        },
        {
          name: "混合格式",
          data: {
            request_id: "test_004",
            tool_id: "content-generation",
            status: "completed",
            result: [
              {
                message: {
                  content: "這是混合格式的音樂星際冒險故事..."
                },
                content: "這是不會被使用的內容",
                choices: [
                  {
                    message: {
                      content: "這也不會被使用"
                    }
                  }
                ],
                usage: { total_tokens: 100 },
                citations: ["url1", "url2"],
                model: "sonar"
              }
            ]
          }
        }
      ];

      const results = [];

      for (const testCase of testCases) {
        console.log(`測試 ${testCase.name}:`, JSON.stringify(testCase.data, null, 2));

        const response = await fetch('/api/webhook/receive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.data),
        });

        const responseData = await response.json();
        
        results.push({
          testCase: testCase.name,
          success: response.ok,
          response: responseData,
          sent_data: testCase.data
        });

        // 等待一下再發送下一個
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setResult({
        testResults: results,
        message: '所有測試案例完成'
      });

      toast.success('測試完成！');

    } catch (error) {
      console.error('測試失敗:', error);
      toast.error('測試失敗');
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const checkAllSavedData = async () => {
    try {
      const response = await fetch('/api/ai-tools/status?limit=20');
      const data = await response.json();
      
      if (data.success) {
        const testRecords = data.data.tool_statuses.filter(
          (tool: any) => tool.output_data?.request_id?.startsWith('test_')
        );
        
        setResult({
          found: testRecords.length > 0,
          test_records: testRecords.map((record: any) => ({
            request_id: record.output_data?.request_id,
            generated_content_preview: record.output_data?.generated_content?.substring(0, 100),
            ai_stats: record.output_data?.ai_stats
          })),
          message: `找到 ${testRecords.length} 個測試記錄`
        });
      }
    } catch (error) {
      console.error('檢查失敗:', error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">調試N8n原始數據格式</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">調試說明</h2>
          <p>此頁面將測試n8n可能發送的不同數據格式，幫助我們找出為什麼生成內容沒有被正確提取。</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={testN8nRawData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '測試中...' : '測試不同數據格式'}
          </button>
          
          <button
            onClick={checkAllSavedData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            檢查所有測試記錄
          </button>
        </div>

        {result && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">調試結果</h3>
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 
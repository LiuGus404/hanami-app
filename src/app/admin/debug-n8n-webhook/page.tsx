'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DebugN8nWebhookPage() {
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const handleDebugWebhook = async () => {
    if (!requestId.trim()) {
      toast.error('請輸入請求ID');
      return;
    }

    try {
      setLoading(true);

      // 模擬n8n可能回傳的各種數據格式
      const testFormats = [
        {
          name: '格式1：標準數組格式',
          data: {
            request_id: requestId,
            tool_id: 'content-generation',
            status: 'completed',
            result: [
              {
                message: {
                  content: "這是AI生成的太空故事：小明今天去了太空博物館，看到了火箭模型。"
                },
                usage: { cost: { total_tokens: 100 } },
                model: "sonar",
                citations: ["https://test1.com"],
                search_results: [{ title: "測試1", url: "https://test1.com" }]
              }
            ]
          }
        },
        {
          name: '格式2：直接對象格式',
          data: {
            request_id: requestId,
            tool_id: 'content-generation',
            status: 'completed',
            result: {
              message: {
                content: "這是AI生成的火箭故事：小明對火箭很感興趣。"
              },
              usage: { cost: { total_tokens: 100 } },
              model: "sonar",
              citations: ["https://test2.com"],
              search_results: [{ title: "測試2", url: "https://test2.com" }]
            }
          }
        },
        {
          name: '格式3：choices格式',
          data: {
            request_id: requestId,
            tool_id: 'content-generation',
            status: 'completed',
            result: {
              choices: [
                {
                  message: {
                    content: "這是AI生成的宇宙故事：小明夢想著探索宇宙。"
                  }
                }
              ],
              usage: { cost: { total_tokens: 100 } },
              model: "sonar"
            }
          }
        },
        {
          name: '格式4：直接content格式',
          data: {
            request_id: requestId,
            tool_id: 'content-generation',
            status: 'completed',
            result: {
              content: "這是AI生成的星球故事：小明想要去其他星球旅行。",
              usage: { cost: { total_tokens: 100 } },
              model: "sonar"
            }
          }
        }
      ];

      const results = [];

      for (const format of testFormats) {
        console.log(`\n=== 測試 ${format.name} ===`);
        console.log('發送數據:', JSON.stringify(format.data, null, 2));

        try {
          const response = await fetch('/api/webhook/receive', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(format.data),
          });

          const result = await response.json();
          console.log('API回應:', result);

          if (result.success) {
            // 檢查保存的內容
            const checkResponse = await fetch(`/api/ai-tools/status?request_id=${requestId}`);
            const checkResult = await checkResponse.json();
            
            if (checkResult.success && checkResult.data.tool_statuses.length > 0) {
              const savedRecord = checkResult.data.tool_statuses[0];
              const savedContent = savedRecord.output_data?.generated_content;
              const savedCitations = savedRecord.output_data?.ai_stats?.citations;
              
              results.push({
                format: format.name,
                success: true,
                savedContent: savedContent?.substring(0, 100) + '...',
                savedCitations: savedCitations?.length || 0,
                isCorrect: savedContent && !savedContent.includes('基於「繪本活動範本」')
              });
            } else {
              results.push({
                format: format.name,
                success: false,
                error: '找不到保存的記錄'
              });
            }
          } else {
            results.push({
              format: format.name,
              success: false,
              error: result.error
            });
          }

          // 等待一秒再測試下一個格式
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`測試 ${format.name} 失敗:`, error);
          results.push({
            format: format.name,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      setDebugData(results);
      console.log('所有測試結果:', results);
      toast.success('調試完成！請查看控制台和結果');

    } catch (error) {
      console.error('調試錯誤:', error);
      toast.error('調試時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">調試n8n Webhook數據格式</h1>
      
      <div className="bg-white p-6 rounded-lg border max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">測試不同的n8n數據格式</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請求ID
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="輸入請求ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleDebugWebhook}
            disabled={loading || !requestId.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? '調試中...' : '開始調試'}
          </button>
        </div>
        
        {debugData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">調試結果</h3>
            <div className="space-y-4">
              {debugData.map((result: any, index: number) => (
                <div key={index} className="border rounded p-4">
                  <h4 className="font-medium mb-2">{result.format}</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">狀態:</span>
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? '成功' : '失敗'}
                      </span>
                    </div>
                    {result.success ? (
                      <>
                        <div>
                          <span className="font-medium">保存的內容:</span>
                          <div className="text-xs bg-gray-100 p-2 rounded mt-1">
                            {result.savedContent}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">引用數量:</span>
                          <span>{result.savedCitations}</span>
                        </div>
                        <div>
                          <span className="font-medium">內容正確:</span>
                          <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {result.isCorrect ? '是' : '否'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="font-medium">錯誤:</span>
                        <span className="text-red-600">{result.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• 此工具測試不同的n8n數據格式</p>
          <p>• 幫助找出正確的數據結構</p>
          <p>• 檢查webhook處理邏輯</p>
          <p>• 請查看瀏覽器控制台獲取詳細信息</p>
        </div>
      </div>
    </div>
  );
} 
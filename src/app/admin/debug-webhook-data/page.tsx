'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DebugWebhookData() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhookWithRealData = async () => {
    setLoading(true);
    try {
      // 使用您提供的真實n8n數據
      const webhookData = {
        request_id: "cg_1755089043556_39u5n5ted",
        tool_id: "content-generation",
        status: "completed",
        result: [
          {
            "citations": [
              "https://dayofme100.com/space-song-rocket-ride/",
              "https://www.books.com.tw/products/0010748060",
              "https://cavessharing.cavesbooks.com.tw/2024/07/11/%E5%AD%A9%E5%AD%90%E7%9A%84%E5%A4%AA%E7%A9%BA%E5%86%92%E9%9A%AA%E4%B9%8B%E6%97%85%EF%BC%9A%E3%80%8Aspace-song-rocket-ride%E3%80%8B%E6%9C%89%E8%81%B2%E6%9B%B8%E7%B9%AA%E6%9C%AC%E6%8E%A8%E8%96%A6/",
              "https://www.clps.tp.edu.tw/uploads/1665041121505ldotFoGF.xlsx",
              "https://www.books.com.tw/products/0010968185"
            ],
            "search_results": [
              {
                "title": "孩子的太空冒險之旅：《Space Song Rocket Ride》有聲書 ...",
                "url": "https://dayofme100.com/space-song-rocket-ride/",
                "date": "2024-07-10",
                "last_updated": "2025-07-27"
              },
              {
                "title": "點點玩聲音",
                "url": "https://www.books.com.tw/products/0010748060",
                "date": "2024-08-18",
                "last_updated": "2024-11-26"
              },
              {
                "title": "孩子的太空冒險之旅：《Space Song Rocket Ride》有聲書 ...",
                "url": "https://cavessharing.cavesbooks.com.tw/2024/07/11/%E5%AD%A9%E5%AD%90%E7%9A%84%E5%A4%AA%E7%A9%BA%E5%86%92%E9%9A%AA%E4%B9%8B%E6%97%85%EF%BC%9A%E3%80%8Aspace-song-rocket-ride%E3%80%8B%E6%9C%89%E8%81%B2%E6%9B%B8%E7%B9%AA%E6%9C%AC%E6%8E%A8%E8%96%A6/",
                "date": "2024-07-11",
                "last_updated": "2025-07-24"
              },
              {
                "title": "吉林國小推薦書單整理",
                "url": "https://www.clps.tp.edu.tw/uploads/1665041121505ldotFoGF.xlsx",
                "date": null,
                "last_updated": "2025-08-13"
              },
              {
                "title": "最值得收藏的古典音樂繪本套書（韋瓦第四季音樂故事＋柴可 ...",
                "url": "https://www.books.com.tw/products/0010968185",
                "date": "2023-09-28",
                "last_updated": "2024-12-29"
              }
            ],
            "message": {
              "content": "在遙遠的宇宙裡，有一艘由三個孩子和他們的動物朋友用紙箱打造的音樂火箭。他們乘坐火箭，唱著《綠草如茵歌》的旋律，開始了一次奇妙的星際音樂冒險。火箭從銀河系出發，穿越熱烈的太陽，經過八大行星，每到一顆星球，他們便用不同的樂器奏出那裡的獨特音符，感受宇宙的和諧與神秘。\n\n在月亮旁，他們聆聽到了星星閃爍的輕聲細語，像是在為他們伴奏。每個星球上的音樂風格都不一樣，有的輕柔如風，有的激昂如火，孩子們學會了不一樣的旋律和節奏，並用心感受聲音的力量。音樂成為他們跨越星際的橋樑，激發了他們的想像力與創造力。\n\n最後，火箭帶著滿載音樂與回憶的孩子們返回地球。他們將這段星際冒險用音符記錄下來，分享給更多的小朋友。這是一場讓音樂與太空交織的夢幻旅程，帶領孩子們在聲音的宇宙中自由飛翔，啟發探索的心與無限的想像力[1][3]。"
            },
            "usage": {
              "cost": {
                "prompt_tokens": 174,
                "completion_tokens": 320,
                "total_tokens": 494,
                "search_context_size": "low",
                "cost": {
                  "input_tokens_cost": 0.000174,
                  "output_tokens_cost": 0.00032,
                  "request_cost": 0.005,
                  "total_cost": 0.005494
                }
              }
            },
            "model": "sonar"
          }
        ],
        error_message: null,
        processing_time_ms: 65000
      };

      console.log('發送webhook數據:', JSON.stringify(webhookData, null, 2));

      const response = await fetch('/api/webhook/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      const responseData = await response.json();
      console.log('Webhook回應:', responseData);

      if (response.ok && responseData.success) {
        toast.success('Webhook處理成功！');
        setResult({
          success: true,
          response: responseData,
          sent_data: webhookData
        });
      } else {
        toast.error(`Webhook處理失敗: ${responseData.error || '未知錯誤'}`);
        setResult({
          success: false,
          error: responseData.error,
          response: responseData,
          sent_data: webhookData
        });
      }
    } catch (error) {
      console.error('測試失敗:', error);
      toast.error('測試失敗');
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const checkSavedData = async () => {
    try {
      const response = await fetch('/api/ai-tools/status?limit=10');
      const data = await response.json();
      
      if (data.success) {
        const savedRecord = data.data.tool_statuses.find(
          (tool: any) => tool.output_data?.request_id === "cg_1755089043556_39u5n5ted"
        );
        
        if (savedRecord) {
          setResult({
            found: true,
            saved_data: savedRecord.output_data,
            message: '找到保存的記錄'
          });
        } else {
          setResult({
            found: false,
            message: '未找到保存的記錄',
            all_records: data.data.tool_statuses.map((tool: any) => ({
              id: tool.id,
              request_id: tool.output_data?.request_id,
              generated_content_preview: tool.output_data?.generated_content?.substring(0, 100)
            }))
          });
        }
      }
    } catch (error) {
      console.error('檢查失敗:', error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">調試Webhook數據處理</h1>
      
      <div className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">調試說明</h2>
          <p>此頁面將使用您提供的真實n8n數據來測試webhook處理邏輯，並詳細記錄每個步驟。</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={testWebhookWithRealData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '處理中...' : '發送真實n8n數據'}
          </button>
          
          <button
            onClick={checkSavedData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            檢查保存的數據
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
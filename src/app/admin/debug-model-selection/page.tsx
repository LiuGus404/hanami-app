'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DebugModelSelectionPage() {
  const [selectedModel, setSelectedModel] = useState('sonar-deep-research');
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDebugModelSelection = async () => {
    try {
      setLoading(true);
      setDebugLog([]);

      addLog(`開始測試，選擇的模型: ${selectedModel}`);

      // 模擬完整的內容生成請求
      const testPayload = {
        input_text: '測試宇宙主題繪本故事',
        template_id: 'test-template-id',
        age_group_id: 'test-age-group-id',
        selected_model: selectedModel,
        user_email: 'admin@hanami.com'
      };

      addLog(`準備發送的payload: ${JSON.stringify(testPayload, null, 2)}`);

      const response = await fetch('/api/ai-tools/content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      addLog(`API回應狀態: ${response.status}`);

      const result = await response.json();
      addLog(`API回應: ${JSON.stringify(result, null, 2)}`);

      if (result.success) {
        toast.success(`模型選擇測試成功！選擇的模型: ${selectedModel}`);
        addLog(`✅ 測試成功，請求ID: ${result.request_id}`);
      } else {
        toast.error(`測試失敗: ${result.error}`);
        addLog(`❌ 測試失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('測試模型選擇錯誤:', error);
      toast.error('測試模型選擇時發生錯誤');
      addLog(`❌ 錯誤: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">調試模型選擇</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：控制面板 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">模型選擇測試</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇模型
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sonar-deep-research">sonar-deep-research</option>
                <option value="sonar-reasoning-pro">sonar-reasoning-pro</option>
                <option value="sonar-reasoning">sonar-reasoning</option>
                <option value="sonar-pro">sonar-pro</option>
                <option value="sonar">sonar</option>
              </select>
            </div>
            
            <button
              onClick={handleDebugModelSelection}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '測試中...' : '開始調試測試'}
            </button>

            <button
              onClick={clearLog}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清除日誌
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• 此調試會顯示完整的請求流程</p>
            <p>• 包含發送的payload和API回應</p>
            <p>• 請查看右側日誌確認模型是否正確發送</p>
            <p>• 選擇的模型: <strong>{selectedModel}</strong></p>
          </div>
        </div>

        {/* 右側：調試日誌 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">調試日誌</h2>
          
          <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
            {debugLog.length === 0 ? (
              <p className="text-gray-500">點擊「開始調試測試」開始追蹤...</p>
            ) : (
              <div className="space-y-2">
                {debugLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
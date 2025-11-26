'use client';

import { useState, useEffect } from 'react';
import { getSaasSupabaseClient } from '@/lib/supabase';

interface ModelConfig {
  id: string;
  model_id: string;
  display_name: string;
  description: string;
  input_cost_usd: number;
  output_cost_usd: number;
  context_window: number;
  model_type: string;
  price_tier: string;
  is_free: boolean;
  provider: string;
}

export default function TestModelConfigsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSaasSupabaseClient();
      
      // 測試 available_models 視圖
      const { data, error } = await supabase
        .from('available_models')
        .select('*')
        .order('is_free', { ascending: false })
        .order('input_cost_usd', { ascending: true });

      if (error) {
        console.error('載入模型配置錯誤:', error);
        setError(`載入錯誤: ${error.message}`);
        
        // 嘗試直接查詢 model_configs 表
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('model_configs')
          .select('*')
          .eq('is_active', true)
          .eq('is_available', true)
          .order('input_cost_usd', { ascending: true });

        if (fallbackError) {
          setError(`備用查詢也失敗: ${fallbackError.message}`);
        } else {
          setModels((fallbackData || []) as any);
          setTestResult('使用備用查詢成功載入模型配置');
        }
      } else {
        setModels((data || []) as any);
        setTestResult(`成功載入 ${data?.length || 0} 個模型配置`);
      }
    } catch (err) {
      console.error('載入模型配置異常:', err);
      setError(`異常: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const testFoodCostCalculation = async () => {
    try {
      const supabase = getSaasSupabaseClient();
      
      // 測試食量計算函數
      const { data, error } = await (supabase as any).rpc('calculate_food_cost', {
        input_tokens: 10000,
        output_tokens: 5000,
        model_id: 'openai/gpt-4o-mini'
      });

      if (error) {
        setTestResult(`食量計算測試失敗: ${error.message}`);
      } else {
        setTestResult(`食量計算測試成功: ${data} 食量 (10K輸入 + 5K輸出 tokens)`);
      }
    } catch (err) {
      setTestResult(`食量計算測試異常: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">模型配置整合測試</h1>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={loadModels}
              disabled={loading}
              className="px-4 py-2 bg-[#FFB6C1] hover:bg-[#FFA0B4] text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '載入中...' : '重新載入模型'}
            </button>
            
            <button
              onClick={testFoodCostCalculation}
              className="px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg font-medium"
            >
              測試食量計算
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-medium mb-2">錯誤</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {testResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-green-800 font-medium mb-2">測試結果</h3>
              <p className="text-green-700">{testResult}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div key={model.id} className="bg-[#FFF9F2] border border-[#EADBC8] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[#4B4036]">{model.display_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    model.price_tier === '免費' ? 'bg-green-100 text-green-800' :
                    model.price_tier === '經濟' ? 'bg-blue-100 text-blue-800' :
                    model.price_tier === '標準' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {model.price_tier}
                  </span>
                </div>
                
                <p className="text-sm text-[#2B3A3B] mb-2">{model.description}</p>
                
                <div className="text-xs text-[#2B3A3B] space-y-1">
                  <div>模型ID: {model.model_id}</div>
                  <div>提供商: {model.provider}</div>
                  <div>類型: {model.model_type}</div>
                  <div>上下文: {model.context_window?.toLocaleString()} tokens</div>
                  {model.input_cost_usd > 0 && (
                    <div>成本: ${model.input_cost_usd}/1M (輸入) • ${model.output_cost_usd}/1M (輸出)</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {models.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-[#2B3A3B]">沒有找到模型配置</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

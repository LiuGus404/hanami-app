
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { ContentGenerationTool } from '@/components/admin/ContentGenerationTool';
import { AIToolsStatusPanel } from '@/components/admin/AIToolsStatusPanel';
import { supabase } from '@/lib/supabase';

export default function ContentGenerationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);

  // 載入活動範本
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/activity-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        console.error('載入範本失敗');
        toast.error('載入活動範本失敗');
      }
    } catch (error) {
      console.error('載入範本錯誤:', error);
      toast.error('載入活動範本失敗');
    }
  };



  // 計算token數的函數
  const calculateTokenCount = (text: string): number => {
    // 簡單的token計算：中文字符算1個token，英文單詞算1個token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (text.match(/\d+/g) || []).length;
    const punctuation = (text.match(/[^\w\s\u4e00-\u9fff]/g) || []).length;
    
    return chineseChars + englishWords + numbers + punctuation;
  };

  // 載入年齡組發展資料
  const loadAgeGroups = async () => {
    try {
      // 由於 hanami_child_development_milestones 表可能不存在，直接使用預設資料
      setAgeGroups([
        { id: '6-12', age_months: 6, age_description: '6-12個月', development_data: {} },
        { id: '12-18', age_months: 12, age_description: '12-18個月', development_data: {} },
        { id: '18-24', age_months: 18, age_description: '18-24個月', development_data: {} },
        { id: '24-36', age_months: 24, age_description: '2-3歲', development_data: {} },
        { id: '36-48', age_months: 36, age_description: '3-4歲', development_data: {} },
        { id: '48-60', age_months: 48, age_description: '4-5歲', development_data: {} },
        { id: '60-72', age_months: 60, age_description: '5-6歲', development_data: {} }
      ]);
    } catch (error) {
      console.error('載入年齡組發展資料失敗:', error);
      // 如果出錯，使用預設資料
      setAgeGroups([
        { id: '6-12', age_months: 6, age_description: '6-12個月', development_data: {} },
        { id: '12-18', age_months: 12, age_description: '12-18個月', development_data: {} },
        { id: '18-24', age_months: 18, age_description: '18-24個月', development_data: {} },
        { id: '24-36', age_months: 24, age_description: '2-3歲', development_data: {} },
        { id: '36-48', age_months: 36, age_description: '3-4歲', development_data: {} },
        { id: '48-60', age_months: 48, age_description: '4-5歲', development_data: {} },
        { id: '60-72', age_months: 60, age_description: '5-6歲', development_data: {} }
      ]);
    }
  };



  // 處理內容生成
  const handleContentGeneration = async (formData: {
    input_text: string;
    template_id: string;
    age_group_id: string;
    selected_model: string;
  }) => {
    try {
      setLoading(true);
      setGenerationStatus('processing');

      const selectedTemplate = templates.find(t => t.id === formData.template_id);
      const selectedAgeGroup = ageGroups.find(a => a.id === formData.age_group_id);

      // 準備發送到API的資料
      const payload = {
        input_text: formData.input_text,
        template_id: formData.template_id,
        age_group_id: formData.age_group_id,
        selected_model: formData.selected_model,
        user_email: 'admin@hanami.com' // 後續從session獲取
      };

      // 計算輸入token數
      const inputTokenCount = calculateTokenCount(formData.input_text);
      const templateTokenCount = selectedTemplate ? calculateTokenCount(JSON.stringify(selectedTemplate)) : 0;
      const ageGroupTokenCount = selectedAgeGroup ? calculateTokenCount(JSON.stringify(selectedAgeGroup)) : 0;
      const totalInputTokens = inputTokenCount + templateTokenCount + ageGroupTokenCount;
      
      setTokenCount(totalInputTokens);
      
      console.log('Token計算:', {
        inputTokenCount,
        templateTokenCount,
        ageGroupTokenCount,
        totalInputTokens
      });

      console.log('發送到API的資料:', payload);
      console.log('選擇的模型:', formData.selected_model);
      console.log('選中的範本:', selectedTemplate);
      console.log('選中的年齡組:', selectedAgeGroup);

      // 通過後端API發送請求
      const response = await fetch('/api/ai-tools/content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API回應錯誤: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('API回應:', responseData);

      if (responseData.success && responseData.request_id) {
        // 開始輪詢檢查生成狀態
        const requestId = responseData.request_id;
        console.log('開始監控生成狀態，請求ID:', requestId);
        
        // 設置輪詢間隔
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/ai-tools/content-generation?request_id=${requestId}`);
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('狀態檢查結果:', statusData);
              
              if (statusData.success) {
                if (statusData.status === 'completed' && statusData.result) {
                  // 生成完成
                  clearInterval(pollInterval);
                  
                  // 計算輸出token數
                  const outputTokenCount = calculateTokenCount(statusData.result.generated_content);
                  const totalTokens = tokenCount + outputTokenCount;
                  
                  // 添加token資訊到結果
                  const resultWithTokens = {
                    ...statusData.result,
                    token_info: {
                      input_tokens: tokenCount,
                      output_tokens: outputTokenCount,
                      total_tokens: totalTokens
                    }
                  };
                  
                  setResult(resultWithTokens);
                  setGenerationStatus('completed');
                  setLoading(false);
                  
                  console.log('Token統計:', {
                    input_tokens: tokenCount,
                    output_tokens: outputTokenCount,
                    total_tokens: totalTokens
                  });
                  
                  toast.success('內容生成完成！');
                  
                } else if (statusData.status === 'failed') {
                  // 生成失敗
                  clearInterval(pollInterval);
                  setGenerationStatus('error');
                  setLoading(false);
                  toast.error('內容生成失敗');
                  
                } else if (statusData.status === 'processing') {
                  // 仍在處理中，繼續等待
                  console.log('仍在處理中，隊列位置:', statusData.queue_position);
                  
                } else if (statusData.status === 'queued') {
                  // 在隊列中等待
                  console.log('在隊列中等待，隊列位置:', statusData.queue_position);
                }
              } else {
                // 狀態檢查失敗
                clearInterval(pollInterval);
                setGenerationStatus('error');
                setLoading(false);
                toast.error('檢查生成狀態失敗');
              }
            } else {
              // 狀態檢查請求失敗
              clearInterval(pollInterval);
              setGenerationStatus('error');
              setLoading(false);
              toast.error('檢查生成狀態失敗');
            }
          } catch (pollError) {
            console.error('輪詢檢查失敗:', pollError);
            clearInterval(pollInterval);
            setGenerationStatus('error');
            setLoading(false);
            toast.error('檢查生成狀態失敗');
          }
        }, 2000); // 每2秒檢查一次
        
        // 設置超時（5分鐘）
        setTimeout(() => {
          clearInterval(pollInterval);
          if (generationStatus === 'processing') {
            setGenerationStatus('error');
            setLoading(false);
            toast.error('生成超時，請稍後再試');
          }
        }, 300000); // 5分鐘
        
      } else {
        throw new Error(responseData.error || '生成失敗');
      }

    } catch (error) {
      console.error('內容生成失敗:', error);
      setGenerationStatus('error');
      setLoading(false);
      toast.error('內容生成失敗，請稍後再試');
    }
  };

          useEffect(() => {
          loadTemplates();
          loadAgeGroups();
        }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/admin/ai-tools')}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回工具列表</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">內容生成工具</h1>
          <p className="text-[#4B4036]">基於教學活動範本和年齡發展參考生成個性化內容</p>
        </div>

        {/* 工具狀態指示器 */}
        <div className="mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#EADBC8] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[#4B4036] font-medium">工具狀態：可用</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#4B4036]">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>當前用戶：3</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>平均等待：45秒</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI工具狀態面板 */}
        <div className="mb-8">
          <AIToolsStatusPanel />
        </div>

        {/* 內容生成工具 */}
        <ContentGenerationTool
          templates={templates}
          ageGroups={ageGroups}
          onGenerate={handleContentGeneration}
          loading={loading}
          generationStatus={generationStatus}
          result={result}
        />
      </div>
    </div>
  );
} 
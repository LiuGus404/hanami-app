'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  FileText, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Save,
  Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { PopupSelect } from '@/components/ui/PopupSelect';
import { QuickEditAgeGroupModal } from './QuickEditAgeGroupModal';
import { supabase } from '@/lib/supabase';

interface ContentGenerationToolProps {
  templates: any[];
  ageGroups: any[];
  onGenerate: (formData: {
    input_text: string;
    template_id: string;
    age_group_id: string;
    selected_model: string;
  }) => void;
  loading: boolean;
  generationStatus: 'idle' | 'processing' | 'completed' | 'error';
  result: any;
}

export function ContentGenerationTool({
  templates,
  ageGroups,
  onGenerate,
  loading,
  generationStatus,
  result
}: ContentGenerationToolProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    input_text: '',
    template_id: '',
    age_group_id: '',
    selected_model: 'sonar-deep-research'
  });

  // 彈窗狀態
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [showAgeGroupSelect, setShowAgeGroupSelect] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [selectedAgeGroupForEdit, setSelectedAgeGroupForEdit] = useState<any>(null);

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.input_text.trim()) {
      toast.error('請輸入文字內容');
      return;
    }
    
    if (!formData.template_id) {
      toast.error('請選擇活動範本');
      return;
    }

    if (!formData.age_group_id) {
      toast.error('請選擇參考年齡組');
      return;
    }

    onGenerate(formData);
  };

  // 複製結果到剪貼簿
  const copyToClipboard = async () => {
    if (!result?.generated_content) return;
    
    try {
      await navigator.clipboard.writeText(result.generated_content);
      toast.success('已複製到剪貼簿');
    } catch (error) {
      console.error('複製失敗:', error);
      toast.error('複製失敗');
    }
  };

  // 下載結果
  const downloadResult = () => {
    if (!result?.generated_content) return;
    
    const blob = new Blob([result.generated_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `內容生成結果_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('已下載結果');
  };

  // 儲存結果到Supabase
  const saveToSupabase = async () => {
    if (!result?.generated_content) return;
    
    try {
      // 跳過插入，因為 hanami_ai_tool_usage 表不存在於類型定義中
      const { error } = await (supabase
        .from('ai_tasks') as any)
        .insert({
          status: 'completed',
          title: 'content-generation',
          model: 'sonar',
          prompt: formData.input_text,
          result: result,
          finished_at: new Date().toISOString()
        } as any);

      if (error) throw error;
      toast.success('已儲存結果');
    } catch (error) {
      console.error('儲存失敗:', error);
      toast.error('儲存失敗');
    }
  };

  // 獲取選中的範本名稱
  const getSelectedTemplateName = () => {
    const template = templates.find(t => t.id === formData.template_id);
    return template?.template_name || template?.name || '請選擇活動範本';
  };

  // 獲取選中的年齡組描述
  const getSelectedAgeGroupDescription = () => {
    const ageGroup = ageGroups.find(a => a.id === formData.age_group_id);
    return ageGroup?.age_description || '請選擇參考年齡組';
  };

  // 獲取選中的模型描述
  const getSelectedModelDescription = () => {
    const modelOptions = [
                  { value: 'sonar-deep-research', label: 'sonar-deep-research' },
            { value: 'sonar-reasoning-pro', label: 'sonar-reasoning-pro' },
            { value: 'sonar-reasoning', label: 'sonar-reasoning' },
            { value: 'sonar-pro', label: 'sonar-pro' },
            { value: 'sonar', label: 'sonar' }
    ];
    const selectedModel = modelOptions.find(m => m.value === formData.selected_model);
    return selectedModel?.label || '請選擇模型';
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

  // 處理快速編輯
  const handleQuickEdit = () => {
    const selectedAgeGroup = ageGroups.find(a => a.id === formData.age_group_id);
    if (selectedAgeGroup) {
      setSelectedAgeGroupForEdit(selectedAgeGroup);
      setShowQuickEditModal(true);
    } else {
      toast.error('請先選擇一個年齡組');
    }
  };

  // 處理年齡組更新
  const handleAgeGroupUpdate = (updatedAgeGroup: any) => {
    // 更新本地狀態
    const updatedAgeGroups = ageGroups.map(ag => 
      ag.id === updatedAgeGroup.id ? updatedAgeGroup : ag
    );
    // 這裡需要通知父組件更新ageGroups
    // 暫時重新載入頁面來更新資料
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左側：輸入表單 */}
      <div className="bg-white rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="p-6 border-b border-[#EADBC8]">
          <h2 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            輸入內容
          </h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 文字輸入 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#4B4036]">
                  文字內容 *
                </label>
                <span className="text-xs text-[#4B4036]">
                  Token: {calculateTokenCount(formData.input_text)}
                </span>
              </div>
              <textarea
                value={formData.input_text}
                onChange={(e) => setFormData({ ...formData, input_text: e.target.value })}
                placeholder="請輸入您想要生成的內容描述..."
                className="w-full h-32 p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] resize-none"
                disabled={loading}
              />
            </div>

            {/* 活動範本選擇 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                活動範本 *
              </label>
              <button
                type="button"
                onClick={() => setShowTemplateSelect(true)}
                disabled={loading}
                className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-left text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] disabled:opacity-50"
              >
                {getSelectedTemplateName()}
              </button>
            </div>

            {/* 年齡組選擇 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#4B4036]">
                  參考年齡組 *
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleQuickEdit}
                    className="flex items-center gap-1 px-2 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors text-xs"
                  >
                    <Edit className="w-3 h-3" />
                    <span>快速編輯</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/admin/child-development-milestones')}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-lg transition-colors text-xs"
                  >
                    <span>管理全部</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAgeGroupSelect(true)}
                disabled={loading}
                className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-left text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] disabled:opacity-50"
              >
                {getSelectedAgeGroupDescription()}
              </button>
            </div>

            {/* 模型選擇 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                選擇模型
              </label>
              <button
                type="button"
                onClick={() => setShowModelSelect(true)}
                disabled={loading}
                className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-left text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] disabled:opacity-50"
              >
                {getSelectedModelDescription()}
              </button>
            </div>

            {/* 生成按鈕 */}
            <button
              type="submit"
              disabled={loading || !formData.input_text.trim() || !formData.template_id || !formData.age_group_id}
              className="w-full py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>開始生成</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 右側：結果顯示 */}
      <div className="bg-white rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="p-6 border-b border-[#EADBC8]">
          <h2 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            生成結果
          </h2>
        </div>
        
        <div className="p-6">
          {generationStatus === 'idle' && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-[#4B4036]">請填寫左側表單並點擊生成按鈕</p>
            </div>
          )}

          {generationStatus === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-[#FFD59A] animate-spin mx-auto mb-4" />
              <p className="text-[#4B4036] font-medium mb-2">正在生成內容...</p>
              <p className="text-sm text-[#4B4036] opacity-70">請稍候，這可能需要幾分鐘時間</p>
            </div>
          )}

          {generationStatus === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-[#4B4036] font-medium mb-2">生成失敗</p>
              <p className="text-sm text-[#4B4036] opacity-70">請稍後再試或聯繫技術支援</p>
            </div>
          )}

          {generationStatus === 'completed' && result && (
            <div className="space-y-4">
              {/* 結果資訊 */}
              <div className="bg-gradient-to-br from-[#FFFDF8] to-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#4B4036]">生成資訊</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-1 text-sm text-[#4B4036]">
                  <div>範本：{result.template_used}</div>
                  <div>年齡組：{result.age_group_reference}</div>
                  <div>時間：{new Date(result.generated_at).toLocaleString()}</div>
                  {result.token_info && (
                    <div className="mt-2 pt-2 border-t border-[#EADBC8]">
                      <div className="text-xs text-[#4B4036] font-medium">Token統計：</div>
                      <div className="text-xs text-[#4B4036]">
                        輸入：{result.token_info.input_tokens} | 
                        輸出：{result.token_info.output_tokens} | 
                        總計：{result.token_info.total_tokens}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 生成內容 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  生成內容
                </label>
                <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-[#4B4036] font-sans">
                    {result.generated_content}
                  </pre>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-2 pt-4 border-t border-[#EADBC8]">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>複製</span>
                </button>
                <button
                  onClick={downloadResult}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>下載</span>
                </button>
                <button
                  onClick={saveToSupabase}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>儲存</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 活動範本選擇彈窗 */}
      {showTemplateSelect && (
        <PopupSelect
          mode="single"
          options={templates.map(template => ({
            label: template.template_name || template.name || '未命名範本',
            value: template.id,
            description: template.template_description || template.description
          }))}
          selected={formData.template_id}
          title="選擇活動範本"
          onCancel={() => setShowTemplateSelect(false)}
          onChange={(value) => setFormData({ ...formData, template_id: value as string })}
          onConfirm={() => setShowTemplateSelect(false)}
        />
      )}

      {/* 模型選擇彈窗 */}
      {showModelSelect && (
        <PopupSelect
          mode="single"
          options={[
            { value: 'sonar-deep-research', label: 'sonar-deep-research' },
            { value: 'sonar-reasoning-pro', label: 'sonar-reasoning-pro' },
            { value: 'sonar-reasoning', label: 'sonar-reasoning' },
            { value: 'sonar-pro', label: 'sonar-pro' },
            { value: 'sonar', label: 'sonar' }
          ]}
          selected={formData.selected_model}
          title="選擇AI模型"
          onCancel={() => setShowModelSelect(false)}
          onChange={(value) => setFormData({ ...formData, selected_model: value as string })}
          onConfirm={() => setShowModelSelect(false)}
        />
      )}

      {/* 年齡組選擇彈窗 */}
      {showAgeGroupSelect && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2B3A3B]">選擇參考年齡組</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/admin/child-development-milestones')}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-lg transition-colors text-sm"
                  >
                    <span>管理全部年齡組</span>
                  </button>
                  <button
                    onClick={() => setShowAgeGroupSelect(false)}
                    className="text-[#4B4036] hover:text-[#2B3A3B]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ageGroups.map((ageGroup) => (
                  <div
                    key={ageGroup.id}
                    onClick={() => {
                      setFormData({ ...formData, age_group_id: ageGroup.id });
                      setShowAgeGroupSelect(false);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.age_group_id === ageGroup.id
                        ? 'border-[#FFD59A] bg-[#FFFDF8]'
                        : 'border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFFDF8]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[#2B3A3B]">{ageGroup.age_description}</h3>
                      {formData.age_group_id === ageGroup.id && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-[#4B4036] mb-2">
                      {ageGroup.age_range_min}-{ageGroup.age_range_max}個月
                    </p>
                    <div className="space-y-1 text-xs text-[#4B4036]">
                      <div className="flex justify-between">
                        <span>音樂興趣:</span>
                        <span className="font-medium">{ageGroup.music_interest || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>專注力:</span>
                        <span className="font-medium">{ageGroup.attention_span || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>小肌發展:</span>
                        <span className="font-medium">{ageGroup.fine_motor || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>社交互動:</span>
                        <span className="font-medium">{ageGroup.social_interaction || '未設定'}</span>
                      </div>
                    </div>
                    {ageGroup.recommended_activities && ageGroup.recommended_activities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-[#4B4036] mb-1">建議活動:</p>
                        <div className="flex flex-wrap gap-1">
                          {ageGroup.recommended_activities.slice(0, 2).map((activity: any, index: number) => (
                            <span
                              key={index}
                              className="px-1 py-0.5 bg-[#FFD59A] text-[#4B4036] text-xs rounded"
                            >
                              {activity}
                            </span>
                          ))}
                          {ageGroup.recommended_activities.length > 2 && (
                            <span className="px-1 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                              +{ageGroup.recommended_activities.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-[#EADBC8]">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAgeGroupSelect(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
              )}

        {/* 快速編輯年齡組彈窗 */}
        <QuickEditAgeGroupModal
          ageGroup={selectedAgeGroupForEdit}
          isOpen={showQuickEditModal}
          onClose={() => setShowQuickEditModal(false)}
          onSave={handleAgeGroupUpdate}
        />
      </div>
    );
  } 
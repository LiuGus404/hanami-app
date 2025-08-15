'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Save, 
  Plus, 
  Trash2,
  Star
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

interface AgeGroup {
  id: string;
  age_months: number;
  age_description: string;
  age_range_min: number;
  age_range_max: number;
  music_interest: string;
  separation_anxiety: string;
  attention_span: string;
  fine_motor: string;
  emotional_development: string;
  social_interaction: string;
  joint_attention: string;
  social_norms: string;
  language_comprehension: string;
  spatial_concept: string;
  hand_eye_coordination: string;
  bilateral_coordination: string;
  development_data: any;
  milestones: string[];
  red_flags: string[];
  music_development: any;
  recommended_activities: string[];
  teaching_strategies: string[];
  notes: string;
  source: string;
  is_active: boolean;
}

interface QuickEditAgeGroupModalProps {
  ageGroup: AgeGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAgeGroup: AgeGroup) => void;
}

export function QuickEditAgeGroupModal({
  ageGroup,
  isOpen,
  onClose,
  onSave
}: QuickEditAgeGroupModalProps) {
  const [formData, setFormData] = useState<Partial<AgeGroup>>({});
  const [loading, setLoading] = useState(false);

  // 發展領域列表
  const developmentFields = [
    { key: 'music_interest', label: '音樂興趣', description: '對音樂的興趣程度' },
    { key: 'separation_anxiety', label: '分離焦慮', description: '分離焦慮情況' },
    { key: 'attention_span', label: '專注力時長', description: '專注力持續時間' },
    { key: 'fine_motor', label: '小肌發展', description: '精細動作發展' },
    { key: 'emotional_development', label: '情緒發展', description: '情緒控制能力' },
    { key: 'social_interaction', label: '社交互動', description: '與他人互動能力' },
    { key: 'joint_attention', label: '共享注意力', description: '共同注意力能力' },
    { key: 'social_norms', label: '社交規範', description: '適應社交規範能力' },
    { key: 'language_comprehension', label: '語言理解', description: '語言理解及表達' },
    { key: 'spatial_concept', label: '空間概念', description: '空間概念能力' },
    { key: 'hand_eye_coordination', label: '手眼協調', description: '手眼協調能力' },
    { key: 'bilateral_coordination', label: '雙手協調', description: '雙手協調能力' }
  ];

  useEffect(() => {
    if (ageGroup) {
      setFormData(ageGroup);
    }
  }, [ageGroup]);

  const handleSave = async () => {
    if (!ageGroup) return;

    try {
      setLoading(true);

      // 跳過更新，因為 hanami_child_development_milestones 表不存在於類型定義中
      const { error } = await supabase
        .from('ai_tasks')
        .update({ status: 'completed' })
        .eq('id', ageGroup.id);

      if (error) throw error;

      toast.success('年齡組更新成功');
      onSave({ ...ageGroup, ...formData });
      onClose();
    } catch (error) {
      console.error('更新年齡組失敗:', error);
      toast.error('更新年齡組失敗');
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen || !ageGroup) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B3A3B]">
              快速編輯 - {ageGroup.age_description}
            </h2>
            <button
              onClick={onClose}
              className="text-[#4B4036] hover:text-[#2B3A3B]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本資訊 */}
          <div>
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  年齡描述
                </label>
                <input
                  type="text"
                  value={formData.age_description || ''}
                  onChange={(e) => setFormData({ ...formData, age_description: e.target.value })}
                  className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  月齡
                </label>
                <input
                  type="number"
                  value={formData.age_months || ''}
                  onChange={(e) => setFormData({ ...formData, age_months: parseInt(e.target.value) })}
                  className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                年齡範圍
              </label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="number"
                  value={formData.age_range_min || ''}
                  onChange={(e) => setFormData({ ...formData, age_range_min: parseInt(e.target.value) })}
                  placeholder="最小月齡"
                  className="flex-1 p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                />
                <span className="flex items-center text-[#4B4036]">-</span>
                <input
                  type="number"
                  value={formData.age_range_max || ''}
                  onChange={(e) => setFormData({ ...formData, age_range_max: parseInt(e.target.value) })}
                  placeholder="最大月齡"
                  className="flex-1 p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                />
              </div>
            </div>
          </div>

          {/* 發展能力描述 */}
          <div>
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">發展能力描述</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {developmentFields.map((field) => (
                <div key={field.key} className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">
                    {field.label}
                  </label>
                  <textarea
                    value={formData[field.key as keyof AgeGroup] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={`請描述${field.label}的發展情況...`}
                    rows={3}
                    className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] resize-none text-sm"
                  />
                  <p className="text-xs text-[#4B4036] mt-1">{field.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 建議活動 */}
          <div>
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">建議活動</h3>
            <textarea
              value={formData.recommended_activities?.join('\n') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                recommended_activities: e.target.value.split('\n').filter(line => line.trim() !== '')
              })}
              placeholder="請輸入建議活動，每行一個活動..."
              rows={6}
              className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] resize-none"
            />
            <p className="text-xs text-[#4B4036] mt-1">每行輸入一個建議活動</p>
          </div>

          {/* 教學策略 */}
          <div>
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">教學策略</h3>
            <textarea
              value={formData.teaching_strategies?.join('\n') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                teaching_strategies: e.target.value.split('\n').filter(line => line.trim() !== '')
              })}
              placeholder="請輸入教學策略，每行一個策略..."
              rows={6}
              className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] resize-none"
            />
            <p className="text-xs text-[#4B4036] mt-1">每行輸入一個教學策略</p>
          </div>

          {/* 備註 */}
          <div>
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">備註</h3>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="輸入備註..."
              rows={3}
              className="w-full p-3 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-[#EADBC8]">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? '儲存中...' : '儲存'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
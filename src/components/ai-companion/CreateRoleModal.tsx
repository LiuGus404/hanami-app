'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: any) => void;
  userId: string;
}

export function CreateRoleModal({ isOpen, onClose, onSave, userId }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general' as 'general' | 'professional' | 'creative' | 'educational' | 'entertainment',
    avatar_url: '',
    default_model: 'openai/gpt-4o-mini',
    system_prompt: '',
    tone: '',
    temperature: 0.7
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = [
    { value: 'general', label: '通用', emoji: '🌟' },
    { value: 'professional', label: '專業', emoji: '💼' },
    { value: 'creative', label: '創意', emoji: '🎨' },
    { value: 'educational', label: '教育', emoji: '📚' },
    { value: 'entertainment', label: '娛樂', emoji: '🎭' }
  ];
  
  const models = [
    { value: 'openai/gpt-4o', label: 'GPT-4 Omni' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4 Omni Mini' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash' },
    { value: 'deepseek/deepseek-chat-v3.1', label: 'DeepSeek Chat V3' }
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('請輸入角色名稱');
      return;
    }
    
    if (!formData.system_prompt.trim()) {
      toast.error('請輸入系統提示詞');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = getSaasSupabaseClient();
      
      const { data, error } = await supabase
        .from('ai_roles')
        .insert({
          name: formData.name.trim(),
          slug: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: formData.description.trim(),
          category: formData.category,
          avatar_url: formData.avatar_url.trim() || null,
          default_model: formData.default_model,
          system_prompt: formData.system_prompt.trim(),
          tone: formData.tone.trim(),
          temperature: formData.temperature,
          creator_user_id: userId,
          is_public: false,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('角色創建成功！');
      onSave(data);
      onClose();
      
      // 重置表單
      setFormData({
        name: '',
        description: '',
        category: 'general',
        avatar_url: '',
        default_model: 'openai/gpt-4o-mini',
        system_prompt: '',
        tone: '',
        temperature: 0.7
      });
      
    } catch (error) {
      console.error('創建角色錯誤:', error);
      toast.error(error instanceof Error ? error.message : '創建失敗');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* 標題欄 */}
            <div className="sticky top-0 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#4B4036]">🎭 創建自訂角色</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
              </button>
            </div>
            
            {/* 表單內容 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 角色名稱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：數據分析師、創意寫手..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  required
                />
              </div>
              
              {/* 角色描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="簡要描述這個角色的特點和用途..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>
              
              {/* 分類和模型 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分類
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI 模型
                  </label>
                  <select
                    value={formData.default_model}
                    onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  >
                    {models.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 系統提示詞 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系統提示詞 (System Prompt) *
                </label>
                <textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="你是一個...\n你的專長是...\n你應該..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  定義這個角色的行為、專長和回應風格
                </p>
              </div>
              
              {/* 語氣 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  語氣風格
                </label>
                <input
                  type="text"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="例如：專業、友善、幽默、嚴謹..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>
              
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  創造力 (Temperature): {formData.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>精確 (0)</span>
                  <span>平衡 (1)</span>
                  <span>創意 (2)</span>
                </div>
              </div>
              
              {/* 按鈕 */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-bold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '創建中...' : '創建角色'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


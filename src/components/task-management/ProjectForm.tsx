'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Project, CreateProjectForm, UpdateProjectForm } from '@/types/task-management';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: CreateProjectForm | UpdateProjectForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectForm({ project, onSubmit, onCancel, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectForm>({
    name: '',
    description: '',
    is_public: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        is_public: project.is_public
      });
    }
  }, [project]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '項目名稱為必填項目';
    }

    if (formData.name.length > 100) {
      newErrors.name = '項目名稱不能超過 100 個字符';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '項目描述不能超過 500 個字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-[#2B3A3B] mb-6">
        {project ? '編輯項目' : '創建新項目'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 項目名稱 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
            項目名稱 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.name ? 'border-red-300' : 'border-[#EADBC8]'
            } focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent`}
            placeholder="輸入項目名稱..."
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.name.length}/100 字符
          </p>
        </div>

        {/* 項目描述 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
            項目描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.description ? 'border-red-300' : 'border-[#EADBC8]'
            } focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent`}
            placeholder="輸入項目描述..."
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description?.length || 0}/500 字符
          </p>
        </div>

        {/* 公開設定 */}
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-5 h-5 text-[#FFD59A] border-[#EADBC8] rounded focus:ring-[#FFD59A] mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-[#2B3A3B]">
                設為公開項目
              </span>
              <p className="text-xs text-gray-500 mt-1">
                公開項目可以被任何人查看和加入，私人項目需要邀請碼才能加入
              </p>
            </div>
          </label>
        </div>

        {/* 項目類型說明 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">項目類型說明</h4>
          <div className="space-y-2 text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <span>🌍</span>
              <span><strong>公開項目:</strong> 任何人都可以查看和加入，適合團隊協作</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span><strong>私人項目:</strong> 只有受邀成員可以查看，適合敏感任務</span>
            </div>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#EADBC8]">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-[#2B3A3B] border border-[#EADBC8] rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#FFD59A] text-[#2B3A3B] rounded-xl hover:bg-[#EBC9A4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '處理中...' : (project ? '更新項目' : '創建項目')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

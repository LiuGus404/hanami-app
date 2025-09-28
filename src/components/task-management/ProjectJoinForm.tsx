'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ProjectInviteForm } from '@/types/task-management';

interface ProjectJoinFormProps {
  onSubmit: (data: ProjectInviteForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectJoinForm({ onSubmit, onCancel, isLoading = false }: ProjectJoinFormProps) {
  const [formData, setFormData] = useState<ProjectInviteForm>({
    invite_code: '',
    role: 'member'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invite_code.trim()) {
      newErrors.invite_code = '邀請碼為必填項目';
    }

    if (formData.invite_code.length !== 8) {
      newErrors.invite_code = '邀請碼必須為 8 位字符';
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

  const handleInviteCodeChange = (value: string) => {
    // 自動轉換為大寫並限制長度
    const upperValue = value.toUpperCase().slice(0, 8);
    setFormData(prev => ({ ...prev, invite_code: upperValue }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-[#2B3A3B] mb-6 text-center">
        加入項目
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 邀請碼 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
            邀請碼 *
          </label>
          <input
            type="text"
            value={formData.invite_code}
            onChange={(e) => handleInviteCodeChange(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border text-center text-lg font-mono tracking-widest ${
              errors.invite_code ? 'border-red-300' : 'border-[#EADBC8]'
            } focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent`}
            placeholder="輸入 8 位邀請碼"
            maxLength={8}
          />
          {errors.invite_code && (
            <p className="mt-1 text-sm text-red-600">{errors.invite_code}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 text-center">
            請輸入項目管理員提供的 8 位邀請碼
          </p>
        </div>

        {/* 角色選擇 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
            加入角色
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
            className="w-full px-4 py-3 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
          >
            <option value="member">成員 - 可以查看和編輯任務</option>
            <option value="observer">觀察者 - 只能查看任務</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            管理員角色需要項目所有者手動分配
          </p>
        </div>

        {/* 說明 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">加入說明</h4>
          <div className="space-y-1 text-xs text-blue-700">
            <p>• 加入後您將能夠查看和參與項目中的任務</p>
            <p>• 您可以隨時離開項目</p>
            <p>• 項目管理員可以管理成員權限</p>
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
            {isLoading ? '加入中...' : '加入項目'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}



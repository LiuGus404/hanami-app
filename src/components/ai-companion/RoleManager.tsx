// ========================================
// AI 角色管理組件
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CpuChipIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAIRoles } from '../../hooks/useAICompanion';
import { HanamiButton, HanamiCard, HanamiInput, HanamiSelect } from '../ui';
import type { AIRole, CreateRoleRequest } from '../../types/ai-companion';

interface RoleManagerProps {
  onRoleSelect?: (role: AIRole) => void;
  onRoleEdit?: (role: AIRole) => void;
  selectedRoleId?: string;
  showCreateForm?: boolean;
  className?: string;
}

export function RoleManager({ 
  onRoleSelect, 
  onRoleEdit,
  selectedRoleId,
  showCreateForm = false,
  className = '' 
}: RoleManagerProps) {
  const [viewMode, setViewMode] = useState<'public' | 'personal'>('public');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showForm, setShowForm] = useState(showCreateForm);

  const { roles, is_loading: isLoading, error, createRole, updateRole, deleteRole } = useAIRoles({
    is_public: viewMode === 'public',
    category: categoryFilter || undefined,
  });

  // 篩選角色
  const filteredRoles = roles.filter(role => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query) ||
        role.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // 角色分類
  const categories = Array.from(new Set(roles.map(r => r.category)));

  const handleCreateRole = useCallback(async (roleData: CreateRoleRequest) => {
    try {
      await createRole(roleData);
      setShowForm(false);
    } catch (error) {
      console.error('創建角色失敗:', error);
    }
  }, [createRole]);

  const handleDeleteRole = useCallback(async (roleId: string) => {
    if (window.confirm('確定要刪除這個角色嗎？此操作無法撤銷。')) {
      try {
        await deleteRole(roleId);
      } catch (error) {
        console.error('刪除角色失敗:', error);
      }
    }
  }, [deleteRole]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-hanami-primary border-t-transparent rounded-full"
        />
        <span className="ml-3 text-hanami-text-secondary">載入角色中...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hanami-text">AI 角色管理</h2>
          <p className="text-hanami-text-secondary">管理和配置你的 AI 助手角色</p>
        </div>

        <div className="flex items-center space-x-3">
          <HanamiButton
            variant="soft"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            創建角色
          </HanamiButton>
        </div>
      </div>

      {/* 篩選與搜尋 */}
      <HanamiCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 視圖模式 */}
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-2">
              角色類型
            </label>
            <div className="flex rounded-lg bg-hanami-surface p-1">
              <button
                onClick={() => setViewMode('public')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-all ${
                  viewMode === 'public'
                    ? 'bg-white text-hanami-primary shadow-sm'
                    : 'text-hanami-text-secondary hover:text-hanami-text'
                }`}
              >
                <UserGroupIcon className="w-4 h-4 mr-1 inline" />
                公開角色
              </button>
              <button
                onClick={() => setViewMode('personal')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-all ${
                  viewMode === 'personal'
                    ? 'bg-white text-hanami-primary shadow-sm'
                    : 'text-hanami-text-secondary hover:text-hanami-text'
                }`}
              >
                <CpuChipIcon className="w-4 h-4 mr-1 inline" />
                我的角色
              </button>
            </div>
          </div>

          {/* 分類篩選 */}
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-2">
              分類篩選
            </label>
            <HanamiSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: '', label: '全部分類' },
                ...categories.map(cat => ({ value: cat, label: cat })),
              ]}
            />
          </div>

          {/* 搜尋 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-hanami-text mb-2">
              搜尋角色
            </label>
            <HanamiInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜尋角色名稱、描述或分類..."
              className="w-full"
            />
          </div>
        </div>
      </HanamiCard>

      {/* 角色網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isSelected={selectedRoleId === role.id}
              onSelect={() => onRoleSelect?.(role)}
              onEdit={() => onRoleEdit?.(role)}
              onDelete={() => handleDeleteRole(role.id)}
              showActions={viewMode === 'personal'}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 空狀態 */}
      {filteredRoles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <CpuChipIcon className="w-16 h-16 text-hanami-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-hanami-text mb-2">
            {searchQuery || categoryFilter ? '沒有找到符合條件的角色' : '還沒有角色'}
          </h3>
          <p className="text-hanami-text-secondary mb-4">
            {searchQuery || categoryFilter 
              ? '嘗試調整搜尋條件或篩選器'
              : '創建你的第一個 AI 角色開始使用'
            }
          </p>
          {!searchQuery && !categoryFilter && (
            <HanamiButton onClick={() => setShowForm(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              創建角色
            </HanamiButton>
          )}
        </div>
      )}

      {/* 創建角色表單 */}
      <AnimatePresence>
        {showForm && (
          <RoleCreateForm
            onSubmit={handleCreateRole}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// 角色卡片組件
// ========================================

interface RoleCardProps {
  role: AIRole;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

function RoleCard({ 
  role, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  showActions = false 
}: RoleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`relative ${isSelected ? 'ring-2 ring-hanami-primary' : ''}`}
    >
      <HanamiCard 
        className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'bg-hanami-primary bg-opacity-5' : ''
        }`}
        onClick={onSelect}
      >
        {/* 角色頭像與基本資訊 */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0">
            {role.avatar_url ? (
              <img
                src={role.avatar_url}
                alt={role.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-hanami-accent rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-hanami-text truncate">
                {role.name}
              </h3>
              {role.is_public && (
                <div className="flex items-center text-yellow-500">
                  <StarSolidIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{role.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-hanami-surface text-hanami-text">
                <TagIcon className="w-3 h-3 mr-1" />
                {role.category}
              </span>
              <span className="text-xs text-hanami-text-secondary">
                v{role.version}
              </span>
            </div>
          </div>
        </div>

        {/* 角色描述 */}
        {role.description && (
          <p className="text-sm text-hanami-text-secondary mb-4 line-clamp-3">
            {role.description}
          </p>
        )}

        {/* 技術資訊 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-hanami-text-secondary">預設模型:</span>
            <span className="text-hanami-text font-medium">{role.default_model}</span>
          </div>
          
          {role.tools && role.tools.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-hanami-text-secondary">工具:</span>
              <span className="text-hanami-text">{role.tools.length} 個</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-hanami-text-secondary">使用次數:</span>
            <span className="text-hanami-text">{role.usage_count}</span>
          </div>
        </div>

        {/* 狀態與時間 */}
        <div className="flex items-center justify-between text-xs text-hanami-text-secondary mb-4">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              role.status === 'active' ? 'bg-green-500' : 
              role.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-500'
            }`} />
            <span>{role.status}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-3 h-3" />
            <span>{new Date(role.created_at).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>

        {/* 操作按鈕 */}
        {showActions && (
          <div className="flex items-center space-x-2">
            <HanamiButton
              size="sm"
              variant="soft"
              onClick={() => {
                onEdit?.();
              }}
              className="flex-1"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              編輯
            </HanamiButton>
            
            <HanamiButton
              size="sm"
              variant="danger"
              onClick={() => {
                onDelete?.();
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </HanamiButton>
          </div>
        )}

        {!showActions && onSelect && (
          <HanamiButton
            size="sm"
            variant="soft"
            onClick={() => {
              onSelect();
            }}
            className="w-full"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            選擇角色
          </HanamiButton>
        )}
      </HanamiCard>
    </motion.div>
  );
}

// ========================================
// 角色創建表單組件
// ========================================

interface RoleCreateFormProps {
  onSubmit: (data: CreateRoleRequest) => Promise<void>;
  onCancel: () => void;
}

function RoleCreateForm({ onSubmit, onCancel }: RoleCreateFormProps) {
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    slug: '',
    description: '',
    category: 'general',
    system_prompt: '',
    default_model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    tools: [],
    is_public: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '角色名稱為必填項';
    if (!formData.slug.trim()) newErrors.slug = '角色代碼為必填項';
    if (!formData.system_prompt.trim()) newErrors.system_prompt = '系統提示為必填項';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('創建角色失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CreateRoleRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-hanami-text mb-6">創建新角色</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <HanamiInput
                  label="角色名稱"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  error={errors.name}
                  required
                  placeholder="例: 貓頭鷹研究員"
                />
              </div>
              
              <div>
                <HanamiInput
                  label="角色代碼"
                  value={formData.slug}
                  onChange={(value) => updateField('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  error={errors.slug}
                  required
                  placeholder="例: owl-researcher"
                />
              </div>
            </div>

            <div>
              <HanamiInput
                label="角色描述"
                value={formData.description || ''}
                onChange={(value) => updateField('description', value)}
                placeholder="簡短描述這個角色的特色和用途..."
              />
            </div>

            {/* AI 配置 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <HanamiSelect
                  label="分類"
                  value={formData.category}
                  onChange={(value) => updateField('category', value)}
                  options={[
                    { value: 'general', label: '通用' },
                    { value: 'research', label: '研究' },
                    { value: 'creative', label: '創意' },
                    { value: 'technical', label: '技術' },
                    { value: 'education', label: '教育' },
                    { value: 'business', label: '商務' },
                  ]}
                />
              </div>

              <div>
                <HanamiSelect
                  label="預設模型"
                  value={formData.default_model}
                  onChange={(value) => updateField('default_model', value)}
                  options={[
                    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                    { value: 'gpt-4o', label: 'GPT-4o' },
                    { value: 'deepseek-r1', label: 'DeepSeek R1' },
                    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                  ]}
                />
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">
                    溫度
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                    value={formData.temperature?.toString() || '0.7'}
                    onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                    min={0}
                    max={2}
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* 系統提示 */}
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                系統提示 *
              </label>
              <textarea
                value={formData.system_prompt}
                onChange={(e) => updateField('system_prompt', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-hanami-primary focus:border-transparent ${
                  errors.system_prompt ? 'border-red-500' : 'border-hanami-border'
                }`}
                rows={6}
                placeholder="定義這個角色的性格、專長和行為方式..."
              />
              {errors.system_prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.system_prompt}</p>
              )}
            </div>

            {/* 設定選項 */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => updateField('is_public', e.target.checked)}
                  className="mr-2 rounded border-hanami-border focus:ring-hanami-primary"
                />
                <span className="text-sm text-hanami-text">公開角色（其他用戶可以使用）</span>
              </label>
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-hanami-border">
              <HanamiButton
                type="button"
                variant="soft"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                取消
              </HanamiButton>
              
              <HanamiButton
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  '創建角色'
                )}
              </HanamiButton>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default RoleManager;

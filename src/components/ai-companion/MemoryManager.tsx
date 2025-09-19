// ========================================
// AI 記憶管理組件
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CpuChipIcon as BrainIcon,
  TagIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useMemory } from '../../hooks/useAICompanion';
import { HanamiButton, HanamiCard, HanamiInput, HanamiSelect } from '../ui';
import type { MemoryItem, MemoryScope, MemoryType, CreateMemoryRequest } from '../../types/ai-companion';

interface MemoryManagerProps {
  roomId?: string;
  userId?: string;
  scope?: MemoryScope;
  className?: string;
}

export function MemoryManager({ 
  roomId, 
  userId, 
  scope,
  className = '' 
}: MemoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<MemoryScope | ''>('');
  const [selectedType, setSelectedType] = useState<MemoryType | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'importance' | 'confidence' | 'access_count'>('created_at');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);

  const { 
    memories, 
    is_loading: isLoading, 
    error, 
    createMemory, 
    updateMemory, 
    deleteMemory, 
    searchMemory 
  } = useMemory({ room_id: roomId, user_id: userId, scope });

  // 篩選和排序記憶
  const filteredMemories = memories
    .filter(memory => {
      if (selectedScope && memory.scope !== selectedScope) return false;
      if (selectedType && memory.memory_type !== selectedType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          memory.key?.toLowerCase().includes(query) ||
          memory.value.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'importance':
          return b.importance - a.importance;
        case 'confidence':
          return b.confidence - a.confidence;
        case 'access_count':
          return b.access_count - a.access_count;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // 執行語義搜尋
  const handleSemanticSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchMemory({
        query: searchQuery,
        room_id: roomId,
        user_id: userId,
        scope: selectedScope || undefined,
        memory_type: selectedType || undefined,
        limit: 20,
        similarity_threshold: 0.7,
      });

      // 這裡可以顯示搜尋結果或更新狀態
      console.log('語義搜尋結果:', results);
    } catch (error) {
      console.error('語義搜尋失敗:', error);
    }
  }, [searchQuery, roomId, userId, selectedScope, selectedType, searchMemory]);

  const handleCreateMemory = useCallback(async (memoryData: CreateMemoryRequest) => {
    try {
      await createMemory(memoryData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('創建記憶失敗:', error);
    }
  }, [createMemory]);

  const handleUpdateMemory = useCallback(async (id: string, updates: Partial<MemoryItem>) => {
    try {
      await updateMemory(id, updates);
      setEditingMemory(null);
    } catch (error) {
      console.error('更新記憶失敗:', error);
    }
  }, [updateMemory]);

  const handleDeleteMemory = useCallback(async (id: string) => {
    if (window.confirm('確定要刪除這個記憶嗎？此操作無法撤銷。')) {
      try {
        await deleteMemory(id);
      } catch (error) {
        console.error('刪除記憶失敗:', error);
      }
    }
  }, [deleteMemory]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-hanami-primary border-t-transparent rounded-full"
        />
        <span className="ml-3 text-hanami-text-secondary">載入記憶中...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hanami-text flex items-center">
            <BrainIcon className="w-8 h-8 mr-3 text-hanami-primary" />
            記憶管理
          </h2>
          <p className="text-hanami-text-secondary">管理 AI 的學習記憶和知識庫</p>
        </div>

        <div className="flex items-center space-x-3">
          <HanamiButton
            variant="soft"
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            新增記憶
          </HanamiButton>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <HanamiCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* 搜尋框 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-hanami-text mb-2">
              搜尋記憶
            </label>
            <div className="flex space-x-2">
              <HanamiInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜尋記憶內容..."
                className="flex-1"
              />
              <HanamiButton
                size="sm"
                onClick={handleSemanticSearch}
                disabled={!searchQuery.trim()}
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </HanamiButton>
            </div>
          </div>

          {/* 範圍篩選 */}
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-2">
              記憶範圍
            </label>
            <HanamiSelect
              value={selectedScope}
              onChange={(value) => setSelectedScope(value as MemoryScope | '')}
              options={[
                { value: '', label: '全部範圍' },
                { value: 'global', label: '全局記憶' },
                { value: 'role', label: '角色記憶' },
                { value: 'user', label: '用戶記憶' },
                { value: 'room', label: '房間記憶' },
                { value: 'session', label: '會話記憶' },
                { value: 'task', label: '任務記憶' },
              ]}
            />
          </div>

          {/* 類型篩選 */}
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-2">
              記憶類型
            </label>
            <HanamiSelect
              value={selectedType}
              onChange={(value) => setSelectedType(value as MemoryType | '')}
              options={[
                { value: '', label: '全部類型' },
                { value: 'fact', label: '事實' },
                { value: 'preference', label: '偏好' },
                { value: 'skill', label: '技能' },
                { value: 'constraint', label: '約束' },
                { value: 'context', label: '上下文' },
                { value: 'relationship', label: '關係' },
              ]}
            />
          </div>

          {/* 排序 */}
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-2">
              排序方式
            </label>
            <HanamiSelect
              value={sortBy}
              onChange={(value) => setSortBy(value as 'created_at' | 'importance' | 'confidence' | 'access_count')}
              options={[
                { value: 'created_at', label: '建立時間' },
                { value: 'importance', label: '重要性' },
                { value: 'confidence', label: '信心度' },
                { value: 'access_count', label: '使用次數' },
              ]}
            />
          </div>
        </div>
      </HanamiCard>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <HanamiCard className="p-4">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-hanami-text-secondary">總記憶數</p>
              <p className="text-2xl font-bold text-hanami-text">{memories.length}</p>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-4">
          <div className="flex items-center">
            <StarIcon className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-hanami-text-secondary">高重要性</p>
              <p className="text-2xl font-bold text-hanami-text">
                {memories.filter(m => m.importance >= 0.8).length}
              </p>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-4">
          <div className="flex items-center">
            <EyeIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-hanami-text-secondary">常用記憶</p>
              <p className="text-2xl font-bold text-hanami-text">
                {memories.filter(m => m.access_count > 5).length}
              </p>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-4">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-hanami-text-secondary">近期新增</p>
              <p className="text-2xl font-bold text-hanami-text">
                {memories.filter(m => 
                  new Date(m.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                ).length}
              </p>
            </div>
          </div>
        </HanamiCard>
      </div>

      {/* 記憶列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onEdit={() => setEditingMemory(memory)}
              onDelete={() => handleDeleteMemory(memory.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 空狀態 */}
      {filteredMemories.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BrainIcon className="w-16 h-16 text-hanami-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-hanami-text mb-2">
            {searchQuery || selectedScope || selectedType ? '沒有找到符合條件的記憶' : '還沒有記憶'}
          </h3>
          <p className="text-hanami-text-secondary mb-4">
            {searchQuery || selectedScope || selectedType 
              ? '嘗試調整搜尋條件或篩選器'
              : 'AI 會在對話過程中自動學習和記憶重要資訊'
            }
          </p>
          {!searchQuery && !selectedScope && !selectedType && (
            <HanamiButton onClick={() => setShowCreateForm(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              手動新增記憶
            </HanamiButton>
          )}
        </div>
      )}

      {/* 創建記憶表單 */}
      <AnimatePresence>
        {showCreateForm && (
          <MemoryCreateForm
            roomId={roomId}
            userId={userId}
            onSubmit={handleCreateMemory}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>

      {/* 編輯記憶表單 */}
      <AnimatePresence>
        {editingMemory && (
          <MemoryEditForm
            memory={editingMemory}
            onSubmit={(updates) => handleUpdateMemory(editingMemory.id, updates)}
            onCancel={() => setEditingMemory(null)}
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
// 記憶卡片組件
// ========================================

interface MemoryCardProps {
  memory: MemoryItem;
  onEdit: () => void;
  onDelete: () => void;
}

function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  const getScopeColor = (scope: MemoryScope) => {
    const colors = {
      global: 'bg-purple-100 text-purple-800',
      role: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      room: 'bg-yellow-100 text-yellow-800',
      session: 'bg-indigo-100 text-indigo-800',
      task: 'bg-pink-100 text-pink-800',
    };
    return colors[scope] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: MemoryType) => {
    const colors = {
      fact: 'bg-blue-100 text-blue-800',
      preference: 'bg-green-100 text-green-800',
      skill: 'bg-purple-100 text-purple-800',
      constraint: 'bg-red-100 text-red-800',
      context: 'bg-yellow-100 text-yellow-800',
      relationship: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <HanamiCard className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* 標題與標籤 */}
            <div className="flex items-center space-x-3 mb-3">
              {memory.key && (
                <h3 className="text-lg font-semibold text-hanami-text truncate">
                  {memory.key}
                </h3>
              )}
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(memory.scope)}`}>
                  {memory.scope}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(memory.memory_type)}`}>
                  {memory.memory_type}
                </span>
              </div>
            </div>

            {/* 記憶內容 */}
            <p className="text-hanami-text mb-4 leading-relaxed">
              {memory.value}
            </p>

            {/* JSON 內容 */}
            {memory.value_json && (
              <div className="mb-4 p-3 bg-hanami-surface rounded-lg">
                <div className="text-sm font-medium text-hanami-text mb-2">結構化資料:</div>
                <pre className="text-xs text-hanami-text-secondary overflow-x-auto">
                  {JSON.stringify(memory.value_json, null, 2)}
                </pre>
              </div>
            )}

            {/* 統計資訊 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <StarSolidIcon className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-hanami-text">重要性</span>
                </div>
                <div className="text-lg font-bold text-hanami-primary">
                  {(memory.importance * 100).toFixed(0)}%
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium text-hanami-text">信心度</span>
                </div>
                <div className="text-lg font-bold text-hanami-primary">
                  {(memory.confidence * 100).toFixed(0)}%
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <EyeIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-hanami-text">使用次數</span>
                </div>
                <div className="text-lg font-bold text-hanami-primary">
                  {memory.access_count}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <ClockIcon className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm font-medium text-hanami-text">建立時間</span>
                </div>
                <div className="text-sm text-hanami-text">
                  {new Date(memory.created_at).toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>

            {/* 來源資訊 */}
            {memory.source && Object.keys(memory.source).length > 0 && (
              <div className="text-xs text-hanami-text-secondary">
                來源: {JSON.stringify(memory.source)}
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center space-x-2 ml-4">
            <HanamiButton
              size="sm"
              variant="soft"
              onClick={onEdit}
            >
              <PencilIcon className="w-4 h-4" />
            </HanamiButton>
            
            <HanamiButton
              size="sm"
              variant="danger"
              onClick={onDelete}
            >
              <TrashIcon className="w-4 h-4" />
            </HanamiButton>
          </div>
        </div>
      </HanamiCard>
    </motion.div>
  );
}

// ========================================
// 記憶創建表單組件
// ========================================

interface MemoryCreateFormProps {
  roomId?: string;
  userId?: string;
  onSubmit: (data: CreateMemoryRequest) => Promise<void>;
  onCancel: () => void;
}

function MemoryCreateForm({ roomId, userId, onSubmit, onCancel }: MemoryCreateFormProps) {
  const [formData, setFormData] = useState<CreateMemoryRequest>({
    scope: 'room',
    room_id: roomId,
    user_id: userId,
    key: '',
    value: '',
    memory_type: 'fact',
    importance: 0.8,
    confidence: 0.9,
    source: {
      created_by: 'manual',
      timestamp: new Date().toISOString(),
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證
    const newErrors: Record<string, string> = {};
    if (!formData.value.trim()) newErrors.value = '記憶內容為必填項';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('創建記憶失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CreateMemoryRequest, value: any) => {
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
          <h2 className="text-2xl font-bold text-hanami-text mb-6">新增記憶</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <HanamiSelect
                  label="記憶範圍"
                  value={formData.scope}
                  onChange={(value) => updateField('scope', value)}
                  options={[
                    { value: 'global', label: '全局記憶' },
                    { value: 'role', label: '角色記憶' },
                    { value: 'user', label: '用戶記憶' },
                    { value: 'room', label: '房間記憶' },
                    { value: 'session', label: '會話記憶' },
                  ]}
                />
              </div>

              <div>
                <HanamiSelect
                  label="記憶類型"
                  value={formData.memory_type}
                  onChange={(value) => updateField('memory_type', value)}
                  options={[
                    { value: 'fact', label: '事實' },
                    { value: 'preference', label: '偏好' },
                    { value: 'skill', label: '技能' },
                    { value: 'constraint', label: '約束' },
                    { value: 'context', label: '上下文' },
                    { value: 'relationship', label: '關係' },
                  ]}
                />
              </div>
            </div>

            <div>
              <HanamiInput
                label="記憶標題"
                value={formData.key || ''}
                onChange={(value) => updateField('key', value)}
                placeholder="簡短描述這個記憶的主題..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                記憶內容 *
              </label>
              <textarea
                value={formData.value}
                onChange={(e) => updateField('value', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-hanami-primary focus:border-transparent ${
                  errors.value ? 'border-red-500' : 'border-hanami-border'
                }`}
                rows={4}
                placeholder="詳細記錄需要記住的內容..."
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value}</p>
              )}
            </div>

            {/* 重要性和信心度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                重要性: {((formData.importance || 0.8) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.importance || 0.8}
                onChange={(e) => updateField('importance', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                信心度: {((formData.confidence || 0.9) * 100).toFixed(0)}%
              </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.confidence || 0.9}
                  onChange={(e) => updateField('confidence', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
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
                  '新增記憶'
                )}
              </HanamiButton>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// 記憶編輯表單組件
// ========================================

interface MemoryEditFormProps {
  memory: MemoryItem;
  onSubmit: (updates: Partial<MemoryItem>) => Promise<void>;
  onCancel: () => void;
}

function MemoryEditForm({ memory, onSubmit, onCancel }: MemoryEditFormProps) {
  const [formData, setFormData] = useState({
    key: memory.key || '',
    value: memory.value,
    memory_type: memory.memory_type,
    importance: memory.importance,
    confidence: memory.confidence,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('更新記憶失敗:', error);
    } finally {
      setIsSubmitting(false);
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
          <h2 className="text-2xl font-bold text-hanami-text mb-6">編輯記憶</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <HanamiInput
                label="記憶標題"
                value={formData.key}
                onChange={(value) => setFormData(prev => ({ ...prev, key: value }))}
                placeholder="記憶標題..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                記憶內容
              </label>
              <textarea
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-4 py-3 border border-hanami-border rounded-lg resize-none focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                rows={4}
              />
            </div>

            <div>
              <HanamiSelect
                label="記憶類型"
                value={formData.memory_type}
                onChange={(value) => setFormData(prev => ({ ...prev, memory_type: value as MemoryType }))}
                options={[
                  { value: 'fact', label: '事實' },
                  { value: 'preference', label: '偏好' },
                  { value: 'skill', label: '技能' },
                  { value: 'constraint', label: '約束' },
                  { value: 'context', label: '上下文' },
                  { value: 'relationship', label: '關係' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  重要性: {(formData.importance * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.importance}
                  onChange={(e) => setFormData(prev => ({ ...prev, importance: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  信心度: {(formData.confidence * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.confidence}
                  onChange={(e) => setFormData(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>

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
                  '更新記憶'
                )}
              </HanamiButton>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default MemoryManager;

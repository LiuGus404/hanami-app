'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard, HanamiInput } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface MediaQuotaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
}

interface QuotaLevel {
  id: string;
  level_name: string;
  video_limit: number;
  photo_limit: number;
  storage_limit_mb: number;
  video_size_limit_mb: number;
  photo_size_limit_mb: number;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function MediaQuotaSettingsModal({ 
  isOpen, 
  onClose, 
  onSettingsUpdated 
}: MediaQuotaSettingsModalProps) {
  const [quotaLevels, setQuotaLevels] = useState<QuotaLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLevel, setEditingLevel] = useState<QuotaLevel | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 新增配額等級的表單狀態
  const [newLevel, setNewLevel] = useState({
    level_name: '',
    video_limit: 5,
    photo_limit: 10,
    storage_limit_mb: 250,
    video_size_limit_mb: 20,
    photo_size_limit_mb: 1,
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadQuotaLevels();
    }
  }, [isOpen]);

  const loadQuotaLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media-quota-levels');
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404 && errorData.error === '獲取配額等級失敗') {
          // 可能是資料表不存在，嘗試初始化
          await initializeQuotaLevels();
          return;
        }
        throw new Error(errorData.error || '載入配額等級失敗');
      }
      
      const result = await response.json();
      if (result.success) {
        setQuotaLevels(result.data || []);
      } else {
        throw new Error(result.error || '載入配額等級失敗');
      }
    } catch (error) {
      console.error('載入配額等級錯誤:', error);
      toast.error(error instanceof Error ? error.message : '載入配額等級失敗');
    } finally {
      setLoading(false);
    }
  };

  const initializeQuotaLevels = async () => {
    try {
      const response = await fetch('/api/init-media-quota-levels', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === '資料表不存在') {
          toast.error('請先在Supabase中創建資料表，詳見控制台訊息');
          console.error('請在Supabase SQL編輯器中執行以下SQL腳本：', errorData.sql);
          return;
        }
        throw new Error(errorData.error || '初始化配額等級失敗');
      }
      
      const result = await response.json();
      if (result.success) {
        toast.success('配額等級初始化成功！');
        setQuotaLevels(result.data || []);
      } else {
        throw new Error(result.error || '初始化配額等級失敗');
      }
    } catch (error) {
      console.error('初始化配額等級錯誤:', error);
      toast.error(error instanceof Error ? error.message : '初始化配額等級失敗');
    }
  };

  const handleAddLevel = async () => {
    if (!newLevel.level_name.trim()) {
      toast.error('請輸入等級名稱');
      return;
    }

    if (newLevel.video_limit <= 0 || newLevel.photo_limit <= 0 || newLevel.storage_limit_mb <= 0 || 
        newLevel.video_size_limit_mb <= 0 || newLevel.photo_size_limit_mb <= 0) {
      toast.error('配額數量必須大於0');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/media-quota-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level_name: newLevel.level_name.trim(),
          video_limit: newLevel.video_limit,
          photo_limit: newLevel.photo_limit,
          storage_limit_mb: newLevel.storage_limit_mb,
          video_size_limit_mb: newLevel.video_size_limit_mb,
          photo_size_limit_mb: newLevel.photo_size_limit_mb,
          description: newLevel.description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '新增配額等級失敗');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('新增配額等級成功！');
        setNewLevel({
          level_name: '',
          video_limit: 5,
          photo_limit: 10,
          storage_limit_mb: 250,
          video_size_limit_mb: 20,
          photo_size_limit_mb: 1,
          description: '',
        });
        setShowAddForm(false);
        loadQuotaLevels();
        onSettingsUpdated();
      } else {
        throw new Error(result.error || '新增配額等級失敗');
      }
    } catch (error) {
      console.error('新增配額等級錯誤:', error);
      toast.error(error instanceof Error ? error.message : '新增配額等級失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLevel = async (level: QuotaLevel) => {
    console.log('開始更新配額等級:', level);
    
    if (!level.level_name.trim()) {
      toast.error('請輸入等級名稱');
      return;
    }

    if (level.video_limit <= 0 || level.photo_limit <= 0 || level.storage_limit_mb <= 0 || 
        level.video_size_limit_mb <= 0 || level.photo_size_limit_mb <= 0) {
      toast.error('配額數量必須大於0');
      return;
    }

    setSaving(true);
    try {
      const requestData = {
        id: level.id,
        level_name: level.level_name.trim(),
        video_limit: level.video_limit,
        photo_limit: level.photo_limit,
        storage_limit_mb: level.storage_limit_mb,
        video_size_limit_mb: level.video_size_limit_mb,
        photo_size_limit_mb: level.photo_size_limit_mb,
        description: level.description.trim(),
      };
      
      console.log('發送更新請求:', requestData);
      
      const response = await fetch('/api/media-quota-levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('收到回應:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 錯誤回應:', errorData);
        throw new Error(errorData.error || `更新配額等級失敗 (${response.status})`);
      }

      const result = await response.json();
      console.log('API 成功回應:', result);
      
      if (result.success) {
        toast.success('更新配額等級成功！');
        setEditingLevel(null);
        loadQuotaLevels();
        onSettingsUpdated();
      } else {
        throw new Error(result.error || '更新配額等級失敗');
      }
    } catch (error) {
      console.error('更新配額等級錯誤:', error);
      console.error('錯誤詳情:', {
        message: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined,
        level: level
      });
      toast.error(error instanceof Error ? error.message : '更新配額等級失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('確定要刪除此配額等級嗎？此操作無法復原。')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/media-quota-levels?id=${levelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除配額等級失敗');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('刪除配額等級成功！');
        loadQuotaLevels();
        onSettingsUpdated();
      } else {
        throw new Error(result.error || '刪除配額等級失敗');
      }
    } catch (error) {
      console.error('刪除配額等級錯誤:', error);
      toast.error(error instanceof Error ? error.message : '刪除配額等級失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (level: QuotaLevel) => {
    setSaving(true);
    try {
      const response = await fetch('/api/media-quota-levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: level.id,
          is_active: !level.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '切換狀態失敗');
      }

      const result = await response.json();
      if (result.success) {
        toast.success(`${level.is_active ? '停用' : '啟用'}配額等級成功！`);
        loadQuotaLevels();
        onSettingsUpdated();
      } else {
        throw new Error(result.error || '切換狀態失敗');
      }
    } catch (error) {
      console.error('切換狀態錯誤:', error);
      toast.error(error instanceof Error ? error.message : '切換狀態失敗');
    } finally {
      setSaving(false);
    }
  };

  const formatStorageSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-6 w-6 text-hanami-primary" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">媒體配額設定</h2>
              <p className="text-gray-600 mt-1">管理不同級數的媒體上傳配額</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6">
          {/* 新增配額等級按鈕 */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">配額等級列表</h3>
            <HanamiButton
              variant="primary"
              onClick={() => setShowAddForm(true)}
              disabled={saving}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新增配額等級
            </HanamiButton>
          </div>

          {/* 新增配額等級表單 */}
          {showAddForm && (
            <HanamiCard className="p-6 mb-6 border-2 border-hanami-primary">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">新增配額等級</h4>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    等級名稱 *
                  </label>
                  <HanamiInput
                    value={newLevel.level_name}
                    onChange={(value) => setNewLevel(prev => ({ ...prev, level_name: value }))}
                    placeholder="例如：基礎版、進階版"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    影片配額 *
                  </label>
                  <HanamiInput
                    type="number"
                    value={newLevel.video_limit}
                    onChange={(value) => setNewLevel(prev => ({ ...prev, video_limit: parseInt(value) || 0 }))}
                    placeholder="影片數量"
                    min={1}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    相片配額 *
                  </label>
                  <HanamiInput
                    type="number"
                    value={newLevel.photo_limit}
                    onChange={(value) => setNewLevel(prev => ({ ...prev, photo_limit: parseInt(value) || 0 }))}
                    placeholder="相片數量"
                    min={1}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    儲存空間 (MB) *
                  </label>
                  <HanamiInput
                    type="number"
                    value={newLevel.storage_limit_mb}
                    onChange={(value) => setNewLevel(prev => ({ ...prev, storage_limit_mb: parseInt(value) || 0 }))}
                    placeholder="儲存空間"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    單個影片大小限制 (MB) *
                  </label>
                  <HanamiInput
                    type="number"
                    value={newLevel.video_size_limit_mb}
                    onChange={(value) => setNewLevel(prev => ({ ...prev, video_size_limit_mb: parseInt(value) || 0 }))}
                    placeholder="影片大小限制"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    單個相片大小限制 (MB) *
                  </label>
                  <HanamiInput
                    type="number"
                    value={newLevel.photo_size_limit_mb}
                    onChange={(value) => setNewLevel(prev => ({ ...prev, photo_size_limit_mb: parseInt(value) || 0 }))}
                    placeholder="相片大小限制"
                    min={1}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <HanamiInput
                  value={newLevel.description}
                  onChange={(value) => setNewLevel(prev => ({ ...prev, description: value }))}
                  placeholder="配額等級的詳細描述"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <HanamiButton
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                  disabled={saving}
                >
                  取消
                </HanamiButton>
                <HanamiButton
                  variant="primary"
                  onClick={handleAddLevel}
                  disabled={saving}
                >
                  {saving ? '新增中...' : '新增配額等級'}
                </HanamiButton>
              </div>
            </HanamiCard>
          )}

          {/* 配額等級列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary"></div>
            </div>
          ) : quotaLevels.length === 0 ? (
            <div className="text-center py-12">
              <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">尚未設定配額等級</h3>
              <p className="text-gray-600 mb-4">點擊下方按鈕初始化預設配額等級</p>
              <HanamiButton
                variant="primary"
                onClick={initializeQuotaLevels}
                disabled={saving}
              >
                {saving ? '初始化中...' : '初始化預設配額等級'}
              </HanamiButton>
            </div>
          ) : (
            <div className="space-y-4">
              {quotaLevels.map((level) => (
                <HanamiCard key={level.id} className="p-6">
                  {editingLevel?.id === level.id ? (
                    // 編輯模式
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            等級名稱 *
                          </label>
                          <HanamiInput
                            value={editingLevel.level_name}
                            onChange={(value) => setEditingLevel(prev => prev ? { ...prev, level_name: value } : null)}
                            placeholder="等級名稱"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            影片配額 *
                          </label>
                          <HanamiInput
                            type="number"
                            value={editingLevel.video_limit}
                            onChange={(value) => setEditingLevel(prev => prev ? { ...prev, video_limit: parseInt(value) || 0 } : null)}
                            placeholder="影片數量"
                            min={1}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            相片配額 *
                          </label>
                          <HanamiInput
                            type="number"
                            value={editingLevel.photo_limit}
                            onChange={(value) => setEditingLevel(prev => prev ? { ...prev, photo_limit: parseInt(value) || 0 } : null)}
                            placeholder="相片數量"
                            min={1}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            儲存空間 (MB) *
                          </label>
                          <HanamiInput
                            type="number"
                            value={editingLevel.storage_limit_mb}
                            onChange={(value) => setEditingLevel(prev => prev ? { ...prev, storage_limit_mb: parseInt(value) || 0 } : null)}
                            placeholder="儲存空間"
                            min={1}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            單個影片大小限制 (MB) *
                          </label>
                          <HanamiInput
                            type="number"
                            value={editingLevel.video_size_limit_mb}
                            onChange={(value) => setEditingLevel(prev => prev ? { ...prev, video_size_limit_mb: parseInt(value) || 0 } : null)}
                            placeholder="影片大小限制"
                            min={1}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            單個相片大小限制 (MB) *
                          </label>
                          <HanamiInput
                            type="number"
                            value={editingLevel.photo_size_limit_mb}
                            onChange={(value) => setEditingLevel(prev => prev ? { ...prev, photo_size_limit_mb: parseInt(value) || 0 } : null)}
                            placeholder="相片大小限制"
                            min={1}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          描述
                        </label>
                        <HanamiInput
                          value={editingLevel.description}
                          onChange={(value) => setEditingLevel(prev => prev ? { ...prev, description: value } : null)}
                          placeholder="配額等級的詳細描述"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <HanamiButton
                          variant="secondary"
                          onClick={() => setEditingLevel(null)}
                          disabled={saving}
                        >
                          取消
                        </HanamiButton>
                        <HanamiButton
                          variant="primary"
                          onClick={() => handleUpdateLevel(editingLevel)}
                          disabled={saving}
                        >
                          {saving ? '更新中...' : '更新'}
                        </HanamiButton>
                      </div>
                    </div>
                  ) : (
                    // 顯示模式
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {level.level_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            level.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {level.is_active ? '啟用中' : '已停用'}
                          </span>
                        </div>
                        
                        {level.description && (
                          <p className="text-gray-600 text-sm mb-3">{level.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">影片配額:</span>
                            <span className="ml-2 font-medium text-blue-600">
                              {level.video_limit} 個
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">相片配額:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {level.photo_limit} 張
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">儲存空間:</span>
                            <span className="ml-2 font-medium text-purple-600">
                              {formatStorageSize(level.storage_limit_mb)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">影片大小限制:</span>
                            <span className="ml-2 font-medium text-orange-600">
                              {level.video_size_limit_mb} MB
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">相片大小限制:</span>
                            <span className="ml-2 font-medium text-pink-600">
                              {level.photo_size_limit_mb} MB
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <HanamiButton
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingLevel(level)}
                          disabled={saving}
                        >
                          編輯
                        </HanamiButton>
                        
                        <HanamiButton
                          variant={level.is_active ? "soft" : "primary"}
                          size="sm"
                          onClick={() => handleToggleActive(level)}
                          disabled={saving}
                        >
                          {level.is_active ? '停用' : '啟用'}
                        </HanamiButton>
                        
                        <HanamiButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteLevel(level.id)}
                          disabled={saving}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </HanamiButton>
                      </div>
                    </div>
                  )}
                </HanamiCard>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <HanamiButton
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            關閉
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 
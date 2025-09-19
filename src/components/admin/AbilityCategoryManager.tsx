'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { supabase } from '@/lib/supabase';

interface AbilityCategoryManagerProps {
  onClose: () => void;
  onCategoryChange: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
}

export default function AbilityCategoryManager({ 
  onClose, 
  onCategoryChange 
}: AbilityCategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryOption | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // 載入自訂能力類別（使用 activity_type 並過濾發展相關）
      const { data: customData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .like('option_name', '%發展%')
        .order('sort_order');

      const defaultCategories = [
        { id: 'physical', name: '身體發展', is_default: true, sort_order: 1 },
        { id: 'cognitive', name: '認知發展', is_default: true, sort_order: 2 },
        { id: 'emotional', name: '情緒發展', is_default: true, sort_order: 3 },
        { id: 'language', name: '語言發展', is_default: true, sort_order: 4 },
        { id: 'artistic', name: '藝術發展', is_default: true, sort_order: 5 },
      ];

      const customCategories = (customData || []).map(item => ({
        id: item.option_value,
        name: item.option_name,
        is_default: false,
        sort_order: item.sort_order,
      }));

      setCategories([...defaultCategories, ...customCategories]);
    } catch (err) {
      console.error('載入類別失敗：', err);
      toast.error('載入類別失敗');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const optionValue = newCategoryName.toLowerCase().replace(/\s+/g, '_');
      
      // 儲存到資料庫（使用 activity_type）
      const { error } = await supabase
        .from('hanami_custom_options')
        .insert({
          option_type: 'activity_type',
          option_name: newCategoryName.trim(),
          option_value: optionValue,
          sort_order: categories.length + 100, // 使用較高的排序值避免衝突
          is_active: true,
        });

      if (error) throw error;

      // 重新載入類別
      await loadCategories();
      setNewCategoryName('');
      setShowAddForm(false);
      onCategoryChange();
      toast.success('新增類別成功！');
    } catch (err) {
      console.error('新增類別失敗：', err);
      toast.error('新增失敗，請重試');
    }
  };

  const updateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      if (editingCategory.is_default) {
        // 預設類別：更新本地狀態，不更新資料庫
        setCategories(prev => prev.map(cat =>
          cat.id === editingCategory.id ? { ...cat, name: newCategoryName.trim() } : cat,
        ));
        toast.success('更新預設類別成功！');
      } else {
        // 自訂類別：更新資料庫
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({
            option_name: newCategoryName.trim(),
          })
          .eq('option_type', 'activity_type')
          .eq('option_value', editingCategory.id);

        if (error) throw error;

        // 重新載入類別
        await loadCategories();
        toast.success('更新類別成功！');
      }

      setNewCategoryName('');
      setEditingCategory(null);
      onCategoryChange();
    } catch (err) {
      console.error('更新類別失敗：', err);
      toast.error('更新失敗，請重試');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const categoryToDelete = categories.find(cat => cat.id === categoryId);
      
      if (categoryToDelete?.is_default) {
        // 預設類別：只更新本地狀態，不更新資料庫
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        toast.success('刪除預設類別成功！');
      } else {
        // 自訂類別：軟刪除（設為非活躍）
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({ is_active: false })
          .eq('option_type', 'activity_type')
          .eq('option_value', categoryId);

        if (error) throw error;

        // 重新載入類別
        await loadCategories();
        toast.success('刪除類別成功！');
      }

      onCategoryChange();
    } catch (err) {
      console.error('刪除類別失敗：', err);
      toast.error('刪除失敗，請重試');
    }
  };

  const handleEdit = (category: CategoryOption) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#FFF9F2]/80 to-[#FFD59A]/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-hanami-text">
            能力類別管理
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-hanami-text-secondary" />
          </button>
        </div>

        {/* 類別列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {categories.map((category) => (
            <HanamiCard key={category.id} className="p-4">
              {editingCategory?.id === category.id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-hanami-text-secondary">
                      排序: {category.sort_order}
                    </span>
                    <div className="flex gap-2">
                      <HanamiButton
                        size="sm"
                        variant="primary"
                        onClick={updateCategory}
                      >
                        儲存
                      </HanamiButton>
                      <HanamiButton
                        size="sm"
                        variant="secondary"
                        onClick={handleCancelEdit}
                      >
                        取消
                      </HanamiButton>
                    </div>
                  </div>
                  <HanamiInput
                    label="類別名稱"
                    value={newCategoryName}
                    onChange={value => setNewCategoryName(value)}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-hanami-text-secondary">
                        排序: {category.sort_order}
                      </span>
                      {category.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          預設
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <HanamiButton
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(category)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </HanamiButton>
                      <HanamiButton
                        size="sm"
                        variant="danger"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </HanamiButton>
                    </div>
                  </div>
                  <h3 className="font-semibold text-hanami-text">
                    {category.name}
                  </h3>
                </div>
              )}
            </HanamiCard>
          ))}
        </div>

        {/* 新增類別表單 */}
        {showAddForm ? (
          <HanamiCard className="p-4 mb-6">
            <h3 className="font-semibold text-hanami-text mb-4">新增類別</h3>
            <div className="space-y-4">
              <HanamiInput
                label="類別名稱"
                placeholder="例如：身體發展"
                value={newCategoryName}
                onChange={value => setNewCategoryName(value)}
              />
              <div className="flex gap-3">
                <HanamiButton
                  variant="primary"
                  onClick={createCategory}
                  disabled={!newCategoryName.trim()}
                >
                  新增類別
                </HanamiButton>
                <HanamiButton
                  variant="secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategoryName('');
                  }}
                >
                  取消
                </HanamiButton>
              </div>
            </div>
          </HanamiCard>
        ) : (
          <div className="text-center">
            <HanamiButton
              variant="primary"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              新增類別
            </HanamiButton>
          </div>
        )}
      </div>
    </div>
  );
} 
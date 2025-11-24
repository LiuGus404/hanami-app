'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { DevelopmentAbility, AbilityCategory } from '@/types/progress';
import { toast } from 'react-hot-toast';

interface AbilityEditModalProps {
  ability: DevelopmentAbility;
  onClose: () => void;
  onUpdate: (updatedAbility: DevelopmentAbility) => void;
}

export default function AbilityEditModal({ 
  ability, 
  onClose, 
  onUpdate 
}: AbilityEditModalProps) {
  const [categories, setCategories] = useState<AbilityCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAbility, setEditingAbility] = useState<DevelopmentAbility>(ability);

  // 彈出選擇相關狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);

  // 自訂管理相關狀態
  const [showCustomManager, setShowCustomManager] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [customOptions, setCustomOptions] = useState<{ [key: string]: any[] }>({
    ability_categories: [
      { id: 'physical', name: '身體發展', is_default: true },
      { id: 'cognitive', name: '認知發展', is_default: true },
      { id: 'emotional', name: '情緒發展', is_default: true },
      { id: 'language', name: '語言發展', is_default: true },
      { id: 'artistic', name: '藝術發展', is_default: true },
    ],
  });
  const [editingOption, setEditingOption] = useState<any>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [isDefaultOption, setIsDefaultOption] = useState(false);

  useEffect(() => {
    loadCategories();
    loadCustomOptions();
  }, []);

  const loadCategories = async () => {
    try {
      // 載入自訂能力類別（使用 activity_type 並過濾發展相關）
      const { data: customData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .like('option_name', '%發展%')
        .order('sort_order');

      const defaultCategories: AbilityCategory[] = [
        { 
          id: 'physical', 
          category_name: '身體發展', 
          category_description: '身體發展相關能力',
          category_color: '#FFB6C1',
          sort_order: 1,
          created_at: new Date().toISOString()
        },
        { 
          id: 'cognitive', 
          category_name: '認知發展', 
          category_description: '認知發展相關能力',
          category_color: '#87CEEB',
          sort_order: 2,
          created_at: new Date().toISOString()
        },
        { 
          id: 'emotional', 
          category_name: '情緒發展', 
          category_description: '情緒發展相關能力',
          category_color: '#98FB98',
          sort_order: 3,
          created_at: new Date().toISOString()
        },
        { 
          id: 'language', 
          category_name: '語言發展', 
          category_description: '語言發展相關能力',
          category_color: '#DDA0DD',
          sort_order: 4,
          created_at: new Date().toISOString()
        },
        { 
          id: 'artistic', 
          category_name: '藝術發展', 
          category_description: '藝術發展相關能力',
          category_color: '#F0E68C',
          sort_order: 5,
          created_at: new Date().toISOString()
        },
      ];

      const customCategories: AbilityCategory[] = (customData || []).map(item => ({
        id: item.option_value,
        category_name: item.option_name,
        category_description: '',
        category_color: '#3B82F6',
        sort_order: item.sort_order || 100,
        created_at: item.created_at || new Date().toISOString()
      }));

      setCategories([...defaultCategories, ...customCategories]);
    } catch (err) {
      console.error('載入類別失敗：', err);
    }
  };

  const loadCustomOptions = async () => {
    try {
      console.log('開始載入自訂選項...');
      // 載入自訂能力類別（移除過濾條件，載入所有 activity_type）
      const { data: customData, error } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('載入自訂選項錯誤:', error);
        return;
      }

      console.log('載入到的自訂資料:', customData);

      // 從 localStorage 載入用戶修改的預設類別
      const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
      console.log('用戶修改的預設類別:', userModifiedDefaults);

      const defaultCategories = [
        { 
          id: 'physical', 
          category_name: '身體發展', 
          category_description: '身體發展相關能力',
          category_color: '#FFB6C1',
          sort_order: 1,
          created_at: new Date().toISOString(),
          is_default: true 
        },
        { 
          id: 'cognitive', 
          category_name: '認知發展', 
          category_description: '認知發展相關能力',
          category_color: '#87CEEB',
          sort_order: 2,
          created_at: new Date().toISOString(),
          is_default: true 
        },
        { 
          id: 'emotional', 
          category_name: '情緒發展', 
          category_description: '情緒發展相關能力',
          category_color: '#98FB98',
          sort_order: 3,
          created_at: new Date().toISOString(),
          is_default: true 
        },
        { 
          id: 'language', 
          category_name: '語言發展', 
          category_description: '語言發展相關能力',
          category_color: '#DDA0DD',
          sort_order: 4,
          created_at: new Date().toISOString(),
          is_default: true 
        },
        { 
          id: 'artistic', 
          category_name: '藝術發展', 
          category_description: '藝術發展相關能力',
          category_color: '#F0E68C',
          sort_order: 5,
          created_at: new Date().toISOString(),
          is_default: true 
        },
      ];

      // 應用用戶的修改
      const modifiedDefaultCategories = defaultCategories
        .filter(cat => !userModifiedDefaults[cat.id]?.deleted) // 過濾被刪除的
        .map(cat => ({
          ...cat,
          category_name: userModifiedDefaults[cat.id]?.name || cat.category_name, // 應用修改的名稱
        }));

      // 載入自訂預設類別
      const customDefaultCategories = Object.entries(userModifiedDefaults)
        .filter(([id, data]: [string, any]) => data.is_custom_default && !data.deleted)
        .map(([id, data]: [string, any]) => ({
          id,
          category_name: data.name,
          category_description: '自訂預設類別',
          category_color: '#3B82F6',
          sort_order: 100,
          created_at: new Date().toISOString(),
          is_default: true,
        }));

      console.log('修改後的預設類別:', modifiedDefaultCategories);
      console.log('自訂預設類別:', customDefaultCategories);
      
      const customCategories: AbilityCategory[] = (customData || []).map(item => ({
        id: item.option_value,
        category_name: item.option_name,
        category_description: '',
        category_color: '#3B82F6',
        sort_order: item.sort_order || 100,
        created_at: item.created_at || new Date().toISOString()
      }));

      const allCategories = [...modifiedDefaultCategories, ...customDefaultCategories, ...customCategories];
      console.log('合併後的所有類別:', allCategories);

      setCustomOptions(prev => ({
        ...prev,
        ability_categories: allCategories,
      }));
    } catch (error) {
      console.error('載入自訂選項失敗:', error);
    }
  };

  const updateAbility = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hanami_development_abilities')
        .update({
          ability_name: editingAbility.ability_name,
          ability_description: editingAbility.ability_description,
          // ability_color: editingAbility.ability_color, // 移除，因為該屬性不存在於類型定義中
          max_level: editingAbility.max_level,
          // category: editingAbility.category, // 移除，因為該屬性不存在於類型定義中
        })
        .eq('id', editingAbility.id)
        .select()
        .single();

      if (error) throw error;
      
      // 修正 null 欄位為 undefined
      const fixedData = {
        ...data,
        ability_description: data.ability_description ?? undefined,
        ability_icon: data.ability_icon ?? undefined,
        ability_color: data.ability_color ?? undefined,
        category: data.category ?? undefined,
        is_active: true, // 新更新的能力預設為啟用狀態
      };
      
      onUpdate(fixedData);
      onClose();
    } catch (err) {
      console.error('更新能力失敗：', err);
    } finally {
      setLoading(false);
    }
  };

  // 彈出選擇相關函數
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    // 跳過類別查找，因為 category 屬性不存在於類型定義中
    const currentCategory = null;
    setPopupSelected('');
  };

  const handlePopupConfirm = () => {
    // 根據選中的 ID 找到對應的類別名稱
    const selectedCategory = customOptions.ability_categories.find(cat => cat.id === popupSelected);
    // 跳過設置 category，因為該屬性不存在於類型定義中
    // setEditingAbility({
    //   ...editingAbility,
    //   category: selectedCategory?.category_name || '',
    // });
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    // 找到當前選中類別的 ID
    // 跳過類別查找，因為 category 屬性不存在於類型定義中
    const currentCategory = null;
    setPopupSelected('');
    setShowPopup({ field: '', open: false });
  };

  // 自訂管理相關函數
  const handleCustomManagerOpen = (field: string) => {
    setShowCustomManager({ field, open: true });
    setNewOptionName('');
    setEditingOption(null);
  };

  const handleCustomManagerClose = () => {
    setShowCustomManager({ field: '', open: false });
    setNewOptionName('');
    setEditingOption(null);
  };

  const handleAddCustomOption = async () => {
    if (!newOptionName.trim()) return;

    try {
      console.log('=== 開始新增操作 ===');
      console.log('新增類別名稱:', newOptionName.trim());
      console.log('是否設為預設:', isDefaultOption);
      
      if (isDefaultOption) {
        // 新增為預設類別：保存到 localStorage
        const newId = `custom_${Date.now()}`;
        const newDefaultCategory = {
          id: newId,
          category_name: newOptionName.trim(),
          is_default: true,
        };
        
        // 保存到 localStorage
        const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
        userModifiedDefaults[newId] = { 
          name: newOptionName.trim(),
          is_custom_default: true // 標記為自訂預設
        };
        localStorage.setItem('hanami_modified_defaults', JSON.stringify(userModifiedDefaults));
        console.log('已保存新預設類別到 localStorage:', userModifiedDefaults);
        
        setCustomOptions(prev => {
          const newCategories = [...prev.ability_categories, newDefaultCategory];
          console.log('新增後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設類別新增完成');
        toast.success(`已新增預設類別「${newOptionName.trim()}」！`);
      } else {
        // 新增為自訂類別：保存到資料庫
        const { data, error } = await supabase
          .from('hanami_custom_options')
          .insert({
            option_type: 'activity_type',
            option_name: newOptionName.trim(),
            option_value: `custom_${Date.now()}`,
            sort_order: 999,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error('資料庫新增錯誤:', error);
          throw error;
        }

        // 更新本地狀態
        setCustomOptions(prev => {
          const newCategory = {
            id: data.option_value,
            category_name: data.option_name,
            is_default: false,
          };
          const newCategories = [...prev.ability_categories, newCategory];
          console.log('新增後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('自訂類別新增完成');
        toast.success('新增類別成功！');
      }

      setNewOptionName('');
      setIsDefaultOption(false);
      console.log('=== 新增操作完成 ===');
    } catch (error) {
      console.error('新增類別失敗:', error);
      toast.error('新增失敗，請重試');
    }
  };

  const handleEditCustomOption = async () => {
    if (!editingOption || !newOptionName.trim()) return;

    try {
      console.log('=== 開始編輯操作 ===');
      console.log('編輯選項:', editingOption);
      console.log('新名稱:', newOptionName.trim());
      console.log('當前所有類別:', customOptions.ability_categories);
      
      if (editingOption.is_default) {
        // 預設選項：保存到 localStorage
        console.log('編輯預設選項:', editingOption.name);
        
        // 保存編輯操作到 localStorage
        const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
        userModifiedDefaults[editingOption.id] = { 
          ...userModifiedDefaults[editingOption.id],
          name: newOptionName.trim() 
        };
        localStorage.setItem('hanami_modified_defaults', JSON.stringify(userModifiedDefaults));
        console.log('已保存編輯操作到 localStorage:', userModifiedDefaults);
        
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.map(option =>
            option.id === editingOption.id ? { ...option, category_name: newOptionName.trim() } : option
          );
          console.log('編輯後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設選項編輯完成');
        toast.success(`已更新預設類別「${editingOption.name}」為「${newOptionName.trim()}」！`);
      } else {
        // 自訂選項：更新資料庫
        console.log('編輯自訂選項:', editingOption.name);
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({
            option_name: newOptionName.trim(),
          })
          .eq('option_type', 'activity_type')
          .eq('option_value', editingOption.id);

        if (error) {
          console.error('資料庫更新錯誤:', error);
          throw error;
        }

        // 更新本地狀態
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.map(option =>
            option.id === editingOption.id ? { ...option, category_name: newOptionName.trim() } : option
          );
          console.log('編輯後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('自訂選項編輯完成');
        toast.success('更新類別成功！');
      }

      setNewOptionName('');
      setEditingOption(null);
      console.log('=== 編輯操作完成 ===');
    } catch (error) {
      console.error('更新類別失敗:', error);
      toast.error('更新失敗，請重試');
    }
  };

  const handleDeleteCustomOption = async (optionId: string) => {
    try {
      const optionToDelete = customOptions.ability_categories.find(option => option.id === optionId);
      
      if (!optionToDelete) {
        console.error('未找到要刪除的選項！');
        toast.error('未找到要刪除的選項');
        return;
      }

      // 刪除確認對話框
      const confirmMessage = optionToDelete.is_default 
        ? `確定要刪除預設類別「${optionToDelete.category_name}」嗎？\n\n注意：此操作會將該類別從預設列表中移除，但可以通過「重置預設」按鈕恢復。`
        : `確定要刪除類別「${optionToDelete.category_name}」嗎？\n\n此操作無法撤銷。`;
      
      const isConfirmed = confirm(confirmMessage);
      if (!isConfirmed) {
        console.log('用戶取消刪除操作');
        return;
      }

      console.log('=== 開始刪除操作 ===');
      console.log('刪除選項 ID:', optionId);
      console.log('當前所有類別:', customOptions.ability_categories);
      console.log('找到要刪除的選項:', optionToDelete);
      
      if (optionToDelete.is_default) {
        // 預設選項：保存到 localStorage
        console.log('刪除預設選項:', optionToDelete.category_name);
        
        // 保存刪除操作到 localStorage
        const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
        userModifiedDefaults[optionToDelete.id] = { deleted: true };
        localStorage.setItem('hanami_modified_defaults', JSON.stringify(userModifiedDefaults));
        console.log('已保存刪除操作到 localStorage:', userModifiedDefaults);
        
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.filter(option => option.id !== optionId);
          console.log('刪除後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設選項刪除完成');
        toast.success(`已刪除預設類別「${optionToDelete.category_name}」！`);
      } else {
        // 自訂選項：軟刪除
        console.log('刪除自訂選項:', optionToDelete.category_name);
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({ is_active: false })
          .eq('option_type', 'activity_type')
          .eq('option_value', optionId);

        if (error) {
          console.error('資料庫刪除錯誤:', error);
          throw error;
        }

        // 更新本地狀態
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.filter(option => option.id !== optionId);
          console.log('刪除後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('自訂選項刪除完成');
        toast.success('刪除類別成功！');
      }
      
      console.log('=== 刪除操作完成 ===');
    } catch (error) {
      console.error('刪除類別失敗:', error);
      toast.error('刪除失敗，請重試');
    }
  };

  const startEditOption = (option: any) => {
    console.log('開始編輯選項:', option);
    setEditingOption(option);
    setNewOptionName(option.category_name);
    setIsDefaultOption(option.is_default); // 設置預設選中狀態
    console.log('設置編輯狀態完成');
  };

  const modalContent = (
    <>
      {/* 彈出選擇組件 */}
      {showPopup.open && (
        <PopupSelect
          mode="single"
          options={customOptions.ability_categories.map(cat => ({ value: cat.id, label: cat.category_name }))}
          selected={popupSelected}
          title="選擇能力類別"
          onCancel={handlePopupCancel}
          onChange={(value: string | string[]) => setPopupSelected(value)}
          onConfirm={handlePopupConfirm}
        />
      )}

      {/* 自訂管理彈出視窗 */}
      {showCustomManager.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-hanami-text">
                  管理能力類別
                </h2>
                <button
                  className="text-sm text-red-600 hover:text-red-800 underline"
                  onClick={() => {
                    if (confirm('確定要重置所有預設類別嗎？這將恢復所有預設類別到原始狀態。')) {
                      localStorage.removeItem('hanami_modified_defaults');
                      loadCustomOptions();
                      toast.success('已重置所有預設類別！');
                    }
                  }}
                >
                  重置預設
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* 新增/編輯表單 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-hanami-text mb-4">
                  {editingOption ? '編輯類別' : '新增類別'}
                </h3>
                <div className="space-y-4">
                  <HanamiInput
                    label="類別名稱 *"
                    placeholder="例如：身體發展、認知發展"
                    value={newOptionName}
                    onChange={(value) => setNewOptionName(value)}
                  />
                  
                  {/* 預設類別選擇 */}
                  {!editingOption && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefaultOption"
                        checked={isDefaultOption}
                        onChange={(e) => setIsDefaultOption(e.target.checked)}
                        className="rounded border-gray-300 text-hanami-primary focus:ring-hanami-primary"
                      />
                      <label htmlFor="isDefaultOption" className="text-sm text-hanami-text">
                        設為預設類別
                      </label>
                      <span className="text-xs text-hanami-text-secondary">
                        (預設類別會在所有能力編輯中優先顯示)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <HanamiButton
                      className="bg-hanami-primary hover:bg-hanami-accent"
                      disabled={!newOptionName.trim()}
                      onClick={editingOption ? handleEditCustomOption : handleAddCustomOption}
                    >
                      {editingOption ? '更新' : '新增'}
                    </HanamiButton>
                    {editingOption && (
                      <HanamiButton
                        variant="secondary"
                        onClick={() => {
                          setEditingOption(null);
                          setNewOptionName('');
                          setIsDefaultOption(false);
                        }}
                      >
                        取消編輯
                      </HanamiButton>
                    )}
                  </div>
                </div>
              </div>

              {/* 現有選項列表 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-4">現有類別</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customOptions.ability_categories.map((option: any) => (
                    <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.category_name}</span>
                        {option.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">預設</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                          onClick={() => {
                            console.log('編輯模態框：編輯按鈕被點擊！選項:', option);
                            startEditOption(option);
                          }}
                        >
                          編輯
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                          onClick={() => {
                            console.log('編輯模態框：刪除按鈕被點擊！選項 ID:', option.id);
                            handleDeleteCustomOption(option.id);
                          }}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-200 flex justify-end">
              <HanamiButton
                variant="secondary"
                onClick={handleCustomManagerClose}
              >
                關閉
              </HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 主編輯模態框 */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-hanami-text">
              編輯發展能力
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-hanami-text-secondary" />
            </button>
          </div>

          <div className="space-y-4">
            <HanamiInput
              required
              label="能力名稱"
              placeholder="例如：小肌發展"
              value={editingAbility.ability_name}
              onChange={value => setEditingAbility({
                ...editingAbility,
                ability_name: value
              })}
            />

            <HanamiInput
              label="能力描述"
              placeholder="能力的詳細描述"
              value={editingAbility.ability_description || ''}
              onChange={value => setEditingAbility({
                ...editingAbility,
                ability_description: value
              })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  主題色彩
                </label>
                <input
                  className="w-full h-10 rounded-lg border border-hanami-border"
                  type="color"
                  value="#FFB6C1"
                  onChange={e => {
                    // 跳過設置 ability_color，因為該屬性不存在於類型定義中
                    console.log('Color changed:', e.target.value);
                  }}
                />
              </div>

              <HanamiInput
                label="最高等級"
                type="number"
                placeholder="1~10"
                min={1}
                max={10}
                value={(editingAbility.max_level || 5).toString()}
                onChange={value => setEditingAbility({
                  ...editingAbility,
                  max_level: parseInt(value) || 5
                })}
              />
            </div>

            {/* 能力類別選擇 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-hanami-text">
                  能力類別
                </label>
                <button
                  className="text-sm text-hanami-primary hover:text-hanami-accent underline"
                  type="button"
                  onClick={() => handleCustomManagerOpen('ability_category')}
                >
                  管理選項
                </button>
              </div>
              <button
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
                type="button"
                onClick={() => handlePopupOpen('category')}
              >
                {/* 跳過類別顯示，因為 category 屬性不存在於類型定義中 */}
                '請選擇能力類別'
              </button>
            </div>

            {/* 預覽 */}
            <HanamiCard className="p-4">
              <h3 className="font-semibold text-hanami-text mb-2">預覽</h3>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FFB6C1' }}
                >
                  <span className="text-white font-bold text-lg">★</span>
                </div>
                <div>
                  <h4 className="font-semibold text-hanami-text">
                    {editingAbility.ability_name || '能力名稱'}
                  </h4>
                  <p className="text-sm text-hanami-text-secondary">
                    {editingAbility.ability_description || '能力描述'}
                  </p>
                  {/* 跳過類別顯示，因為 category 屬性不存在於類型定義中 */}
                  {/* {editingAbility.category && (
                    <span className="inline-block px-2 py-1 text-xs bg-hanami-primary text-white rounded-full mt-1">
                      {editingAbility.category}
                    </span>
                  )} */}
                </div>
              </div>
            </HanamiCard>

            <div className="flex gap-3 pt-4">
              <HanamiButton
                className="flex-1"
                variant="secondary"
                onClick={onClose}
              >
                取消
              </HanamiButton>
              <HanamiButton
                className="flex-1"
                disabled={!editingAbility.ability_name || loading}
                variant="primary"
                onClick={updateAbility}
              >
                {loading ? '更新中...' : '更新能力'}
              </HanamiButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // 使用 createPortal 將模態視窗渲染到 document.body
  if (typeof window === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(modalContent, document.body);
} 
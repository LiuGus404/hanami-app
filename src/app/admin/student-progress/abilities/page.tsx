'use client';

import { 
  ChartBarIcon, 
  UserGroupIcon, 
  StarIcon,
  PlusIcon,
  EyeIcon,
  Cog6ToothIcon,
  PencilIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import HanamiButton from '@/components/ui/HanamiButton';
import HanamiCard from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';
import AbilityLevelManager from '@/components/admin/AbilityLevelManager';
import AbilityCategoryManager from '@/components/admin/AbilityCategoryManager';
import AbilityEditModal from '@/components/admin/AbilityEditModal';
import { supabase } from '@/lib/supabase';
import { DevelopmentAbility, StudentAbility, DEVELOPMENT_ABILITIES } from '@/types/progress';
import { PopupSelect } from '@/components/ui/PopupSelect';

export default function AbilitiesPage() {
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [studentAbilities, setStudentAbilities] = useState<StudentAbility[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [growthTrees, setGrowthTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLevelManager, setShowLevelManager] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<DevelopmentAbility | null>(null);
  const [editingAbility, setEditingAbility] = useState<DevelopmentAbility | null>(null);
  
  // 刪除確認狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [abilityToDelete, setAbilityToDelete] = useState<DevelopmentAbility | null>(null);

  // 新增能力表單狀態
  const [newAbility, setNewAbility] = useState({
    ability_name: '',
    ability_description: '',
    ability_color: '#FFB6C1',
    max_level: 5,
    category: '',
  });

  const [categories, setCategories] = useState<any[]>([]);

  // 搜尋和篩選狀態
  const [filters, setFilters] = useState({
    search: '',
    categories: [] as string[],
    ability_levels: [] as number[],
    growth_trees: [] as string[],
  });

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
  const [editingOption, setEditingOption] = useState<{ id: string, name: string, is_default: boolean } | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [isDefaultOption, setIsDefaultOption] = useState(false);

  useEffect(() => {
    loadData();
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

      const defaultCategories = [
        { id: 'physical', name: '身體發展' },
        { id: 'cognitive', name: '認知發展' },
        { id: 'emotional', name: '情緒發展' },
        { id: 'language', name: '語言發展' },
        { id: 'artistic', name: '藝術發展' },
      ];

      const customCategories = (customData || []).map(item => ({
        id: item.option_value,
        name: item.option_name,
      }));

      setCategories([...defaultCategories, ...customCategories]);
    } catch (err) {
      console.error('載入類別失敗：', err);
    }
  };

  const loadCustomOptions = async () => {
    try {
      console.log('能力頁面：開始載入自訂選項...');
      // 載入自訂能力類別（移除過濾條件，載入所有 activity_type）
      const { data: customData, error } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('能力頁面：載入自訂選項錯誤:', error);
        return;
      }

      console.log('能力頁面：載入到的自訂資料:', customData);

      // 從 localStorage 載入用戶修改的預設類別
      const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
      console.log('能力頁面：用戶修改的預設類別:', userModifiedDefaults);

      const defaultCategories = [
        { id: 'physical', name: '身體發展', is_default: true },
        { id: 'cognitive', name: '認知發展', is_default: true },
        { id: 'emotional', name: '情緒發展', is_default: true },
        { id: 'language', name: '語言發展', is_default: true },
        { id: 'artistic', name: '藝術發展', is_default: true },
      ];

      // 應用用戶的修改
      const modifiedDefaultCategories = defaultCategories
        .filter(cat => !userModifiedDefaults[cat.id]?.deleted) // 過濾被刪除的
        .map(cat => ({
          ...cat,
          name: userModifiedDefaults[cat.id]?.name || cat.name, // 應用修改的名稱
        }));

      // 載入自訂預設類別
      const customDefaultCategories = Object.entries(userModifiedDefaults)
        .filter(([id, data]: [string, any]) => data.is_custom_default && !data.deleted) // 過濾被刪除的
        .map(([id, data]: [string, any]) => ({
          id,
          name: data.name,
          is_default: true,
        }));

      console.log('能力頁面：修改後的預設類別:', modifiedDefaultCategories);
      console.log('能力頁面：自訂預設類別:', customDefaultCategories);
      
      const customCategories = (customData || []).map(item => ({
        id: item.option_value,
        name: item.option_name,
        is_default: false,
      }));

      const allCategories = [...modifiedDefaultCategories, ...customDefaultCategories, ...customCategories];
      console.log('能力頁面：合併後的所有類別:', allCategories);

      setCustomOptions(prev => ({
        ...prev,
        ability_categories: allCategories,
      }));
    } catch (error) {
      console.error('能力頁面：載入自訂選項失敗:', error);
    }
  };

  // 彈出選擇相關函數
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    // 找到當前選中類別的 ID
    const currentCategory = customOptions.ability_categories.find(cat => cat.name === newAbility.category);
    setPopupSelected(currentCategory?.id || '');
  };

  const handlePopupConfirm = () => {
    // 根據選中的 ID 找到對應的類別名稱
    const selectedCategory = customOptions.ability_categories.find(cat => cat.id === popupSelected);
    setNewAbility({
      ...newAbility,
      category: selectedCategory?.name || '',
    });
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    // 找到當前選中類別的 ID
    const currentCategory = customOptions.ability_categories.find(cat => cat.name === newAbility.category);
    setPopupSelected(currentCategory?.id || '');
    setShowPopup({ field: '', open: false });
  };

  // 篩選處理函數
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 彈出選擇處理函數
  const handleFilterPopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    const currentValue = filters[field as keyof typeof filters] || [];
    // 如果是數字陣列，轉換為字串陣列
    if (Array.isArray(currentValue) && typeof currentValue[0] === 'number') {
      setPopupSelected(currentValue.map(String));
    } else {
      setPopupSelected(currentValue as string | string[]);
    }
  };

  const handleFilterPopupConfirm = () => {
    let convertedValue: any = popupSelected;
    if (showPopup.field === 'ability_levels' && Array.isArray(popupSelected)) {
      convertedValue = (popupSelected as string[]).map(Number);
    }
    setFilters(prev => ({
      ...prev,
      [showPopup.field]: convertedValue
    }));
    setShowPopup({ field: '', open: false });
  };

  const handleFilterPopupCancel = () => {
    const currentValue = filters[showPopup.field as keyof typeof filters] || [];
    if (Array.isArray(currentValue) && typeof currentValue[0] === 'number') {
      setPopupSelected(currentValue.map(String));
    } else {
      setPopupSelected(currentValue as string | string[]);
    }
    setShowPopup({ field: '', open: false });
  };

  // 清除篩選
  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      ability_levels: [],
      growth_trees: [],
    });
  };

  // 獲取篩選後的能力
  const getFilteredAbilities = () => {
    return abilities.filter(ability => {
      // 搜尋篩選
      if (filters.search && !ability.ability_name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(ability.ability_description && ability.ability_description.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }

      // 類別篩選
      if (filters.categories.length > 0 && !filters.categories.includes(ability.category || '')) {
        return false;
      }

      // 能力等級篩選
      if (filters.ability_levels.length > 0 && !filters.ability_levels.includes(ability.max_level)) {
        return false;
      }

      // 成長樹篩選
      if (filters.growth_trees.length > 0) {
        const treesForAbility = getGrowthTreesForAbility(ability.id);
        const hasMatchingTree = treesForAbility.some(tree => 
          filters.growth_trees.includes(tree.id)
        );
        if (!hasMatchingTree) {
          return false;
        }
      }

      return true;
    });
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
          name: newOptionName.trim(),
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
        const optionValue = newOptionName.toLowerCase().replace(/\s+/g, '_');
        
        const { error } = await supabase
          .from('hanami_custom_options')
          .insert({
            option_type: 'activity_type',
            option_name: newOptionName.trim(),
            option_value: optionValue,
            sort_order: customOptions.ability_categories.length + 100,
            is_active: true,
          });

        if (error) throw error;

        // 更新本地狀態
        const newOption = {
          id: optionValue,
          name: newOptionName.trim(),
          is_default: false,
        };

        setCustomOptions(prev => ({
          ...prev,
          ability_categories: [...prev.ability_categories, newOption],
        }));
        
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
      console.log('=== 能力頁面：開始編輯操作 ===');
      console.log('編輯選項:', editingOption);
      console.log('新名稱:', newOptionName.trim());
      console.log('當前所有類別:', customOptions.ability_categories);
      
      if (editingOption.is_default) {
        // 預設類別：保存到 localStorage
        console.log('編輯預設類別:', editingOption.name);
        
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
            option.id === editingOption.id ? { ...option, name: newOptionName.trim() } : option,
          );
          console.log('編輯後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設類別編輯完成');
        toast.success(`已更新預設類別「${editingOption.name}」為「${newOptionName.trim()}」！`);
      } else {
        // 自訂類別：更新資料庫
        console.log('編輯自訂類別:', editingOption.name);
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
            option.id === editingOption.id ? { ...option, name: newOptionName.trim(), is_default: editingOption.is_default } : option,
          );
          console.log('編輯後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('自訂類別編輯完成');
        toast.success('更新類別成功！');
      }

      setNewOptionName('');
      setEditingOption(null);
      console.log('=== 能力頁面：編輯操作完成 ===');
    } catch (error) {
      console.error('更新類別失敗:', error);
      toast.error('更新失敗，請重試');
    }
  };

  const handleDeleteCustomOption = async (optionId: string) => {
    try {
      const optionToDelete = customOptions.ability_categories.find(opt => opt.id === optionId);
      
      if (!optionToDelete) {
        console.error('未找到要刪除的選項！');
        toast.error('未找到要刪除的選項');
        return;
      }

      // 刪除確認對話框
      const confirmMessage = optionToDelete.is_default 
        ? `確定要刪除預設類別「${optionToDelete.name}」嗎？\n\n注意：此操作會將該類別從預設列表中移除，但可以通過「重置預設」按鈕恢復。`
        : `確定要刪除類別「${optionToDelete.name}」嗎？\n\n此操作無法撤銷。`;
      
      const isConfirmed = confirm(confirmMessage);
      if (!isConfirmed) {
        console.log('用戶取消刪除操作');
        return;
      }

      console.log('=== 能力頁面：開始刪除操作 ===');
      console.log('刪除選項 ID:', optionId);
      console.log('當前所有類別:', customOptions.ability_categories);
      console.log('找到要刪除的選項:', optionToDelete);
      
      if (optionToDelete.is_default) {
        // 預設類別：保存到 localStorage
        console.log('刪除預設類別:', optionToDelete.name);
        
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
        
        console.log('預設類別刪除完成');
        toast.success(`已刪除預設類別「${optionToDelete.name}」！`);
      } else {
        // 自訂類別：軟刪除（設為非活躍）
        console.log('刪除自訂類別:', optionToDelete.name);
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
        
        console.log('自訂類別刪除完成');
        toast.success('刪除類別成功！');
      }
      
      console.log('=== 能力頁面：刪除操作完成 ===');
    } catch (error) {
      console.error('刪除類別失敗:', error);
      toast.error('刪除失敗，請重試');
    }
  };

  const startEditOption = (option: any) => {
    console.log('能力頁面：開始編輯選項:', option);
    setEditingOption(option);
    setNewOptionName(option.name);
    setIsDefaultOption(option.is_default); // 設置預設選中狀態
    console.log('能力頁面：設置編輯狀態完成');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 載入發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('*')
        .order('ability_name');

      if (abilitiesError) throw abilitiesError;
      // 修正 null 欄位為 undefined
      const fixedAbilities = (abilitiesData || []).map((a: any) => ({
        ...a,
        ability_description: a.ability_description ?? undefined,
        ability_icon: a.ability_icon ?? undefined,
        ability_color: a.ability_color ?? undefined,
        category: a.category ?? undefined,
      }));
      setAbilities(fixedAbilities);

      // 載入學生
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, nick_name, student_age, course_type')
        .order('full_name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // 載入學生能力記錄
      const { data: studentAbilitiesData, error: studentAbilitiesError } = await supabase
        .from('hanami_student_abilities')
        .select(`
          *,
          ability:hanami_development_abilities(*)
        `);

      if (studentAbilitiesError) throw studentAbilitiesError;
      // 修正欄位名稱與 null 欄位
      const fixedStudentAbilities = (studentAbilitiesData || []).map((a: any) => ({
        ...a,
        last_updated: a.last_assessment_date ?? a.updated_at ?? '',
        notes: a.notes ?? undefined,
      }));
      setStudentAbilities(fixedStudentAbilities);

      // 載入成長樹和成長目標
      const { data: growthTreesData, error: growthTreesError } = await supabase
        .from('hanami_growth_trees')
        .select(`
          *,
          goals:hanami_growth_goals(
            id,
            goal_name,
            required_abilities
          )
        `)
        .eq('is_active', true)
        .order('tree_name');

      if (growthTreesError) throw growthTreesError;
      setGrowthTrees(growthTreesData || []);

    } catch (err) {
      console.error('載入資料失敗：', err);
      setError('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const createAbility = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_development_abilities')
        .insert([{
          ...newAbility,
          category: newAbility.category || null,
        }])
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
      };
      setAbilities([...abilities, fixedData]);
      setShowCreateModal(false);
      setNewAbility({
        ability_name: '',
        ability_description: '',
        ability_color: '#FFB6C1',
        max_level: 5,
        category: '',
      });
    } catch (err) {
      console.error('建立能力失敗：', err);
      setError('建立能力失敗');
    }
  };

  // 刪除能力函數
  const deleteAbility = async (ability: DevelopmentAbility) => {
    try {
      // 檢查是否有學生正在使用此能力
      const { data: studentAbilitiesData, error: checkError } = await supabase
        .from('hanami_student_abilities')
        .select('id')
        .eq('ability_id', ability.id)
        .limit(1);

      if (checkError) throw checkError;

      if (studentAbilitiesData && studentAbilitiesData.length > 0) {
        toast.error('無法刪除：已有學生正在使用此能力');
        return;
      }

      // 檢查是否有成長樹正在使用此能力
      const { data: growthTreesData, error: treesError } = await supabase
        .from('hanami_growth_goals')
        .select('id, goal_name')
        .contains('required_abilities', [ability.id]);

      if (treesError) throw treesError;

      if (growthTreesData && growthTreesData.length > 0) {
        toast.error(`無法刪除：此能力正在被以下成長目標使用：${growthTreesData.map(g => g.goal_name).join(', ')}`);
        return;
      }

      // 執行刪除
      const { error: deleteError } = await supabase
        .from('hanami_development_abilities')
        .delete()
        .eq('id', ability.id);

      if (deleteError) throw deleteError;

      // 從本地狀態中移除
      setAbilities(abilities.filter(a => a.id !== ability.id));
      setShowDeleteConfirm(false);
      setAbilityToDelete(null);
      toast.success('能力刪除成功！');
    } catch (err) {
      console.error('刪除能力失敗：', err);
      toast.error('刪除失敗，請重試');
    }
  };

  // 處理刪除確認
  const handleDeleteClick = (ability: DevelopmentAbility) => {
    setAbilityToDelete(ability);
    setShowDeleteConfirm(true);
  };

  const getStudentAbility = (studentId: string, abilityId: string) => {
    return studentAbilities.find(sa => 
      sa.student_id === studentId && sa.ability_id === abilityId,
    );
  };

  // 獲取需要特定能力的成長樹
  const getGrowthTreesForAbility = (abilityId: string) => {
    return growthTrees.filter(tree => {
      if (!tree.goals || !Array.isArray(tree.goals)) return false;
      
      return tree.goals.some((goal: any) => {
        if (!goal.required_abilities || !Array.isArray(goal.required_abilities)) return false;
        return goal.required_abilities.includes(abilityId);
      });
    });
  };

  // 獲取成長樹中需要特定能力的目標數量
  const getAbilityRequirementCount = (treeId: string, abilityId: string) => {
    const tree = growthTrees.find(t => t.id === treeId);
    if (!tree || !tree.goals || !Array.isArray(tree.goals)) return 0;
    
    return tree.goals.filter((goal: any) => {
      if (!goal.required_abilities || !Array.isArray(goal.required_abilities)) return false;
      return goal.required_abilities.includes(abilityId);
    }).length;
  };

  const getAbilityLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAbilityLevelText = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return '優秀';
    if (percentage >= 60) return '良好';
    if (percentage >= 40) return '一般';
    return '需要加強';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hanami-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-hanami-text flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-hanami-primary" />
            學生發展能力管理
          </h1>
          <p className="text-hanami-text-secondary mt-2">
            追蹤和管理學生的八大核心發展能力
          </p>
        </div>
        <div className="flex gap-3">
          <HanamiButton
            className="flex items-center gap-2"
            variant="secondary"
            onClick={() => setShowCategoryManager(true)}
          >
            <TagIcon className="h-5 w-5" />
            類別管理
          </HanamiButton>
          <HanamiButton
            className="flex items-center gap-2"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-5 w-5" />
            新增能力
          </HanamiButton>
        </div>
      </div>

      {/* 學生進度管理導航按鈕區域 */}
      <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/student-progress/dashboard'}
          >
            <BarChart3 className="w-4 h-4" />
            進度儀表板
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/student-progress/growth-trees'}
          >
            <TreePine className="w-4 h-4" />
            成長樹管理
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
            onClick={() => window.location.href = '/admin/student-progress/abilities'}
          >
            <TrendingUp className="w-4 h-4" />
            發展能力圖卡
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/student-progress/activities'}
          >
            <Gamepad2 className="w-4 h-4" />
            教學活動管理
          </button>
                      <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress'}
            >
              <FileText className="w-4 h-4" />
              進度記錄管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/ability-assessments'}
            >
              <AcademicCapIcon className="w-4 h-4" />
              能力評估管理
            </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/students'}
          >
            <Users className="w-4 h-4" />
            返回學生管理
          </button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 搜尋和篩選工具列 */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-hanami-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* 搜尋和篩選 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <HanamiInput
                className="pl-10"
                placeholder="搜尋能力名稱或描述..."
                value={filters.search}
                onChange={(value) => handleFilterChange('search', value)}
              />
            </div>
            
            {/* 能力類別多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
                type="button"
                onClick={() => handleFilterPopupOpen('categories')}
              >
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">能力類別</span>
                {filters.categories.length > 0 && (
                  <span className="ml-auto bg-hanami-primary text-white text-xs rounded-full px-2 py-1">
                    {filters.categories.length}
                  </span>
                )}
              </button>
            </div>

            {/* 能力等級多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
                type="button"
                onClick={() => handleFilterPopupOpen('ability_levels')}
              >
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">能力等級</span>
                {filters.ability_levels.length > 0 && (
                  <span className="ml-auto bg-hanami-secondary text-white text-xs rounded-full px-2 py-1">
                    {filters.ability_levels.length}
                  </span>
                )}
              </button>
            </div>

            {/* 成長樹多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
                type="button"
                onClick={() => handleFilterPopupOpen('growth_trees')}
              >
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">成長樹</span>
                {filters.growth_trees.length > 0 && (
                  <span className="ml-auto bg-hanami-accent text-white text-xs rounded-full px-2 py-1">
                    {filters.growth_trees.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 清除篩選按鈕 */}
          <div className="flex items-center gap-2">
            <HanamiButton
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              清除篩選
            </HanamiButton>
          </div>
        </div>

        {/* 已選擇的篩選條件顯示 */}
        {(filters.categories.length > 0 || filters.ability_levels.length > 0 || filters.growth_trees.length > 0) && (
          <div className="mt-4 pt-4 border-t border-hanami-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">已選擇的篩選條件：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.categories.map(category => (
                <span key={category} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-primary text-white text-xs rounded-full">
                  {category}
                  <button
                    onClick={() => handleFilterChange('categories', filters.categories.filter(c => c !== category))}
                    className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {filters.ability_levels.map(level => (
                <span key={level} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-secondary text-white text-xs rounded-full">
                  等級 {level}
                  <button
                    onClick={() => handleFilterChange('ability_levels', filters.ability_levels.filter(l => l !== level))}
                    className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {filters.growth_trees.map(treeId => {
                const tree = growthTrees.find(t => t.id === treeId);
                return (
                  <span key={treeId} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-accent text-white text-xs rounded-full">
                    {tree?.tree_name || treeId}
                    <button
                      onClick={() => handleFilterChange('growth_trees', filters.growth_trees.filter(t => t !== treeId))}
                      className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <HanamiCard className="p-6 text-center">
          <div className="text-2xl font-bold text-hanami-text mb-2">
            {getFilteredAbilities().length}
          </div>
          <div className="text-sm text-hanami-text-secondary">總能力數</div>
        </HanamiCard>
        
        <HanamiCard className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {getFilteredAbilities().filter(a => a.category).length}
          </div>
          <div className="text-sm text-hanami-text-secondary">已分類</div>
        </HanamiCard>
        
        <HanamiCard className="p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {growthTrees.length}
          </div>
          <div className="text-sm text-hanami-text-secondary">成長樹</div>
        </HanamiCard>
        
        <HanamiCard className="p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {customOptions.ability_categories.length}
          </div>
          <div className="text-sm text-hanami-text-secondary">能力類別</div>
        </HanamiCard>
      </div>

      {/* 能力概覽 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {getFilteredAbilities().map((ability) => (
          <HanamiCard key={ability.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
            <div className="p-4 text-center">
              {/* 能力圖標 */}
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                style={{ backgroundColor: ability.ability_color || '#FFB6C1' }}
              >
                <StarIcon className="h-8 w-8 text-white" />
              </div>
              
              {/* 能力名稱 */}
              <h3 className="font-bold text-base text-hanami-text mb-2">
                {ability.ability_name}
              </h3>
              
              {/* 能力描述 */}
              <p className="text-xs text-hanami-text-secondary mb-3 leading-relaxed line-clamp-2">
                {ability.ability_description}
              </p>
              
              {/* 能力類別標籤 */}
              {ability.category && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 text-xs bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30 rounded-full">
                    {ability.category}
                  </span>
                </div>
              )}
              
              {/* 操作按鈕 */}
              <div className="mb-3 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => {
                    setSelectedAbility(ability);
                    setShowLevelManager(true);
                  }}
                  className="p-1.5 text-[#A68A64] hover:bg-[#FFF9F2] rounded-full transition-colors"
                  title="等級管理"
                >
                  <Cog6ToothIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingAbility(ability);
                    setShowEditModal(true);
                  }}
                  className="p-1.5 text-[#A64B2A] hover:bg-[#FFF9F2] rounded-full transition-colors"
                  title="編輯能力"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(ability)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="刪除能力"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                </button>
              </div>
              
              {/* 需要此能力的成長樹 */}
              <div className="space-y-1 pt-2 border-t border-[#EADBC8]/50">
                <div className="text-xs text-hanami-text-secondary font-medium mb-1">相關成長樹</div>
                {(() => {
                  const treesForAbility = getGrowthTreesForAbility(ability.id);
                  return (
                    <>
                      {treesForAbility.slice(0, 2).map((tree) => {
                        const requirementCount = getAbilityRequirementCount(tree.id, ability.id);
                        return (
                          <div key={tree.id} className="flex items-center justify-between text-xs">
                            <span className="truncate text-[#87704e]">
                              {tree.tree_name}
                            </span>
                            <span className="font-medium text-hanami-primary bg-hanami-primary/10 px-1.5 py-0.5 rounded-full text-xs">
                              {requirementCount}
                            </span>
                          </div>
                        );
                      })}
                      {treesForAbility.length > 2 && (
                        <div className="text-xs text-hanami-text-secondary">
                          +{treesForAbility.length - 2} 個
                        </div>
                      )}
                      {treesForAbility.length === 0 && (
                        <div className="text-xs text-hanami-text-secondary">
                          暫無相關
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </HanamiCard>
        ))}
      </div>

      {/* 彈出選擇組件 */}
      {showPopup.open && (
        <PopupSelect
          mode="multiple"
          options={
            showPopup.field === 'categories' 
              ? customOptions.ability_categories.map(cat => ({ value: cat.name, label: cat.name }))
              : showPopup.field === 'ability_levels'
              ? [1, 2, 3, 4, 5].map(level => ({ value: level, label: `等級 ${level}` }))
              : showPopup.field === 'growth_trees'
              ? growthTrees.map(tree => ({ value: tree.id, label: tree.tree_name }))
              : []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'categories' ? '選擇能力類別' :
            showPopup.field === 'ability_levels' ? '選擇能力等級' :
            showPopup.field === 'growth_trees' ? '選擇成長樹' : '選擇'
          }
          onCancel={handleFilterPopupCancel}
          onChange={(value: string | string[]) => setPopupSelected(value)}
          onConfirm={handleFilterPopupConfirm}
        />
      )}

      {/* 新增能力模態框 */}
      {showCreateModal && (
        <>
          {/* 彈出選擇組件 */}
          {showPopup.open && (
            <PopupSelect
              mode="single"
              options={customOptions.ability_categories.map(cat => ({ value: cat.id, label: cat.name }))}
              selected={popupSelected}
              title="選擇能力類別"
              onCancel={handlePopupCancel}
              onChange={(value: string | string[]) => setPopupSelected(value)}
              onConfirm={handlePopupConfirm}
            />
          )}

          {/* 自訂管理彈出視窗 */}
          {showCustomManager.open && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-[60]">
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
                  {(editingOption || !customOptions.ability_categories.length) && (
                    <HanamiCard className="p-4">
                      <h3 className="text-lg font-semibold text-hanami-text mb-4">
                        {editingOption ? '編輯類別' : '新增類別'}
                      </h3>
                      <div className="space-y-3">
                        <HanamiInput
                          label="類別名稱"
                          placeholder="請輸入類別名稱"
                          value={newOptionName}
                          onChange={(e) => setNewOptionName(e.target.value)}
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
                            variant="primary"
                            onClick={editingOption ? handleEditCustomOption : handleAddCustomOption}
                            disabled={!newOptionName.trim()}
                          >
                            {editingOption ? '更新' : '新增'}
                          </HanamiButton>
                          <HanamiButton 
                            variant="secondary" 
                            onClick={() => {
                              setEditingOption(null);
                              setNewOptionName('');
                              setIsDefaultOption(false);
                            }}
                          >
                            取消
                          </HanamiButton>
                        </div>
                      </div>
                    </HanamiCard>
                  )}

                  {/* 新增按鈕 */}
                  {!editingOption && customOptions.ability_categories.length > 0 && (
                    <HanamiButton
                      variant="primary"
                      onClick={() => setEditingOption({ id: '', name: '', is_default: false })}
                      className="w-full"
                    >
                      + 新增類別
                    </HanamiButton>
                  )}

                  {/* 現有類別列表 */}
                  <div>
                    <h3 className="text-lg font-semibold text-hanami-text mb-4">現有類別</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customOptions.ability_categories.map((option) => (
                        <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.name}</span>
                            {option.is_default && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">預設</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                              onClick={() => {
                                console.log('編輯按鈕被點擊！選項:', option);
                                startEditOption(option);
                              }}
                            >
                              編輯
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                              onClick={() => {
                                console.log('刪除按鈕被點擊！選項 ID:', option.id);
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

          {/* 主新增模態框 */}
          <div className="fixed inset-0 bg-gradient-to-br from-[#FFF9F2]/80 to-[#FFD59A]/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-hanami-text mb-4">
                新增發展能力
              </h2>
              
              <div className="space-y-4">
                <HanamiInput
                  required
                  label="能力名稱"
                  placeholder="例如：小肌發展"
                  value={newAbility.ability_name}
                  onChange={e => setNewAbility({ ...newAbility, ability_name: e.target.value })}
                />

                <HanamiInput
                  label="能力描述"
                  placeholder="能力的詳細描述"
                  value={newAbility.ability_description}
                  onChange={e => setNewAbility({ ...newAbility, ability_description: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <HanamiInput
                    label="最大等級"
                    placeholder="1~10"
                    type="number"
                    min={1}
                    max={10}
                    value={newAbility.max_level.toString()}
                    onChange={e => setNewAbility({ ...newAbility, max_level: parseInt(e.target.value) || 5 })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-hanami-text mb-2">
                      主題色彩
                    </label>
                    <input
                      className="w-full h-10 rounded-lg border border-hanami-border"
                      type="color"
                      value={newAbility.ability_color}
                      onChange={e => setNewAbility({ ...newAbility, ability_color: e.target.value })}
                    />
                  </div>
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
                    {newAbility.category ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                        {newAbility.category}
                      </span>
                    ) : (
                      '請選擇能力類別'
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <HanamiButton
                  className="flex-1"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </HanamiButton>
                <HanamiButton
                  className="flex-1"
                  disabled={!newAbility.ability_name}
                  variant="primary"
                  onClick={createAbility}
                >
                  建立
                </HanamiButton>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 等級管理模態框 */}
      {showLevelManager && selectedAbility && (
        <AbilityLevelManager
          abilityId={selectedAbility.id}
          abilityName={selectedAbility.ability_name}
          maxLevel={selectedAbility.max_level}
          onClose={() => {
            setShowLevelManager(false);
            setSelectedAbility(null);
          }}
        />
      )}

      {/* 類別管理模態框 */}
      {showCategoryManager && (
        <AbilityCategoryManager
          onClose={() => setShowCategoryManager(false)}
          onCategoryChange={() => {
            loadCategories();
          }}
        />
      )}

      {/* 編輯能力模態框 */}
      {showEditModal && editingAbility && (
        <AbilityEditModal
          ability={editingAbility}
          onClose={() => {
            setShowEditModal(false);
            setEditingAbility(null);
          }}
          onUpdate={(updatedAbility) => {
            setAbilities(abilities.map(a => a.id === updatedAbility.id ? updatedAbility : a));
            setShowEditModal(false);
            setEditingAbility(null);
          }}
        />
      )}

      {/* 刪除確認模態框 */}
      {showDeleteConfirm && abilityToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                確認刪除能力
              </h3>
              <p className="text-gray-600 mb-6">
                您確定要刪除能力「<span className="font-semibold text-red-600">{abilityToDelete.ability_name}</span>」嗎？
                <br />
                <span className="text-sm text-gray-500">
                  此操作無法復原，請謹慎操作。
                </span>
              </p>
              <div className="flex gap-3">
                <HanamiButton
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAbilityToDelete(null);
                  }}
                  className="flex-1"
                >
                  取消
                </HanamiButton>
                <HanamiButton
                  variant="danger"
                  onClick={() => deleteAbility(abilityToDelete)}
                  className="flex-1"
                >
                  確認刪除
                </HanamiButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
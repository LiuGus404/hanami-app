'use client';

import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import HanamiButton from '@/components/ui/HanamiButton';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';

interface ActivityFormProps {
  activity?: any;
  template?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

interface FormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

// 統一取得範本欄位的函數
function getTemplateFields(template: any) {
  if (!template) return [];
  
  // 如果 template_schema 是物件且有 fields 屬性
  if (template.template_schema && typeof template.template_schema === 'object' && template.template_schema.fields) {
    return template.template_schema.fields;
  }
  
  // 如果 template_schema 是陣列
  if (Array.isArray(template.template_schema)) {
    return template.template_schema;
  }
  
  // 如果 template_schema 是物件但沒有 fields 屬性，嘗試其他可能的屬性
  if (template.template_schema && typeof template.template_schema === 'object') {
    // 嘗試找到包含欄位定義的屬性
    for (const key in template.template_schema) {
      if (Array.isArray(template.template_schema[key])) {
        return template.template_schema[key];
      }
    }
  }
  
  return [];
}

export default function ActivityForm({ activity, template, onSubmit, onCancel, mode }: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateFieldsLoaded, setTemplateFieldsLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 彈出選擇相關狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);

  // 自訂管理相關狀態
  const [showCustomManager, setShowCustomManager] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [customOptions, setCustomOptions] = useState<{ [key: string]: any[] }>({
    activity_types: [
      { id: 'game', name: '遊戲活動', is_default: true },
      { id: 'training', name: '訓練活動', is_default: true },
      { id: 'exercise', name: '練習活動', is_default: true },
      { id: 'storybook', name: '繪本活動', is_default: true },
      { id: 'performance', name: '表演活動', is_default: true },
    ],
    statuses: [
      { id: 'draft', name: '草稿', is_default: true },
      { id: 'published', name: '已發布', is_default: true },
      { id: 'archived', name: '已封存', is_default: true },
    ],
  });
  const [editingOption, setEditingOption] = useState<{ id: string, name: string, is_default: boolean } | null>(null);
  const [newOptionName, setNewOptionName] = useState('');

  const [formData, setFormData] = useState(() => {
    // 初始化 formData，確保陣列欄位正確初始化
    const initialData = {
      activity_name: '',
      activity_types: [] as string[], // 多選
      categories: [] as string[],    // 多選
      statuses: [] as string[],      // 多選
      difficulty_level: 1,
      estimated_duration: 0,
      activity_description: '',
      materials_needed: [] as string[],
      tags: [] as string[],
      instructions: '',
      template_id: '',
      custom_fields: {} as Record<string, any>,
    };

    // 如果有現有活動資料，正確處理陣列欄位
    if (activity) {
      console.log('初始化編輯模式的 formData，activity:', activity);
      
      // 處理陣列欄位，確保它們是陣列格式
      // 注意：資料庫使用單數形式，表單使用複數形式
      const processedActivity = {
        ...activity,
        // 從單數欄位轉換為複數陣列
        activity_types: activity.activity_type ? [activity.activity_type] : 
          (Array.isArray(activity.activity_types) ? activity.activity_types : []),
        categories: activity.category ? [activity.category] : 
          (Array.isArray(activity.categories) ? activity.categories : []),
        statuses: activity.status ? [activity.status] : 
          (Array.isArray(activity.statuses) ? activity.statuses : []),
        tags: Array.isArray(activity.tags) ? activity.tags : [],
        materials_needed: Array.isArray(activity.materials_needed) ? activity.materials_needed : [],
      };
      
      // 處理 custom_fields 中的範本欄位資料
      if (activity.custom_fields && typeof activity.custom_fields === 'object') {
        console.log('載入 custom_fields:', activity.custom_fields);
        Object.entries(activity.custom_fields).forEach(([key, value]) => {
          if (key !== 'custom_fields') { // 避免重複
            processedActivity[key] = value;
            console.log(`載入範本欄位 ${key}:`, value);
          }
        });
      }
      
      console.log('處理後的 formData:', processedActivity);
      return { ...initialData, ...processedActivity };
    }
    
    return initialData;
  });

  // 載入初始資料
  const loadInitialData = async () => {
    try {
      // 載入範本 - 使用 API 路由
      const response = await fetch('/api/activity-templates');
      if (response.ok) {
        const templatesData = await response.json();
        setTemplates(templatesData);
        console.log('載入的範本:', templatesData);
        
        // 如果是編輯模式且有 template_id，自動選擇範本
        if (mode === 'edit' && formData.template_id) {
          const selectedTemplateData = templatesData.find((t: any) => t.id === formData.template_id);
          if (selectedTemplateData) {
            console.log('自動選擇範本:', selectedTemplateData);
            setSelectedTemplate(selectedTemplateData);
            setTemplateFieldsLoaded(true);
          }
        }
      }

      // 載入分類
      const { data: categoriesData } = await supabase
        .from('hanami_resource_categories')
        .select('*')
        .eq('is_active', true);
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // 載入標籤
      const { data: tagsData } = await supabase
        .from('hanami_resource_tags')
        .select('*')
        .eq('is_active', true);
      
      if (tagsData) {
        setTags(tagsData);
      }

      // 載入自訂選項
      await loadCustomOptions();
    } catch (error) {
      console.error('載入初始資料失敗:', error);
    }
  };

  // 載入自訂選項
  const loadCustomOptions = async () => {
    try {
      // 載入自訂活動類型
      const { data: activityTypesData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .order('sort_order');

      if (activityTypesData) {
        const defaultTypes = [
          { id: 'game', name: '遊戲活動', is_default: true },
          { id: 'training', name: '訓練活動', is_default: true },
          { id: 'exercise', name: '練習活動', is_default: true },
          { id: 'storybook', name: '繪本活動', is_default: true },
          { id: 'performance', name: '表演活動', is_default: true },
        ];
        const customTypes = activityTypesData.map(item => ({
          id: item.option_value,
          name: item.option_name,
          is_default: false,
        }));
        setCustomOptions(prev => ({
          ...prev,
          activity_types: [...defaultTypes, ...customTypes],
        }));
      }

      // 載入自訂狀態
      const { data: statusesData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'status')
        .eq('is_active', true)
        .order('sort_order');

      if (statusesData) {
        const defaultStatuses = [
          { id: 'draft', name: '草稿', is_default: true },
          { id: 'published', name: '已發布', is_default: true },
          { id: 'archived', name: '已封存', is_default: true },
        ];
        const customStatuses = statusesData.map(item => ({
          id: item.option_value,
          name: item.option_name,
          is_default: false,
        }));
        setCustomOptions(prev => ({
          ...prev,
          statuses: [...defaultStatuses, ...customStatuses],
        }));
      }
    } catch (error) {
      console.error('載入自訂選項失敗:', error);
    }
  };

  // 分類管理相關函數
  const handleAddCategory = async () => {
    if (!newOptionName.trim()) return;

    try {
      // 儲存到資料庫
      const { error } = await supabase
        .from('hanami_resource_categories')
        .insert({
          category_name: newOptionName.trim(),
          category_description: '',
          sort_order: categories.length,
          is_active: true,
        });

      if (error) throw error;

      // 重新載入分類
      await loadInitialData();
      setNewOptionName('');
      toast.success('新增分類成功！');
    } catch (error) {
      console.error('新增分類失敗:', error);
      toast.error('新增失敗，請重試');
    }
  };

  const handleEditCategory = async () => {
    if (!editingOption || !newOptionName.trim()) return;

    try {
      // 更新資料庫
      const { error } = await supabase
        .from('hanami_resource_categories')
        .update({
          category_name: newOptionName.trim(),
        })
        .eq('id', editingOption.id);

      if (error) throw error;

      // 重新載入分類
      await loadInitialData();
      setNewOptionName('');
      setEditingOption(null);
      toast.success('更新分類成功！');
    } catch (error) {
      console.error('更新分類失敗:', error);
      toast.error('更新失敗，請重試');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // 軟刪除（設為非活躍）
      const { error } = await supabase
        .from('hanami_resource_categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      if (error) throw error;

      // 重新載入分類
      await loadInitialData();
      toast.success('刪除分類成功！');
    } catch (error) {
      console.error('刪除分類失敗:', error);
      toast.error('刪除失敗，請重試');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 當有現有活動資料且包含 template_id 時，自動載入範本欄位
  useEffect(() => {
    if (activity?.template_id && !templateFieldsLoaded) {
      const template = templates.find(t => t.id === activity.template_id);
      if (template) {
        console.log('自動載入範本欄位，template:', template);
        setSelectedTemplate(template);
        setTemplateFieldsLoaded(true);
      }
    }
  }, [activity, templates, templateFieldsLoaded]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    
    // 清除錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleTemplateChange = (templateId: string) => {
    console.log('選擇範本 ID:', templateId);
    handleInputChange('template_id', templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      console.log('找到的範本:', template);
      setSelectedTemplate(template);
      setTemplateFieldsLoaded(false);
      
      // 清除之前的範本欄位資料
      const templateFields = getTemplateFields(template);
      const clearedData = { ...formData, template_id: templateId };
      templateFields.forEach((field: any) => {
        const fieldName = field.title || field.name || field.id;
        clearedData[fieldName] = '';
      });
      setFormData(clearedData);
    } else {
      setSelectedTemplate(null);
      setTemplateFieldsLoaded(false);
    }
  };

  const loadTemplateFields = () => {
    console.log('載入範本欄位');
    setTemplateFieldsLoaded(true);
    
    // 初始化範本欄位的預設值
    const templateFields = getTemplateFields(selectedTemplate);
    const updatedData = { ...formData };
    
    templateFields.forEach((field: any) => {
      const fieldName = field.title || field.name || field.id;
      if (!updatedData[fieldName]) {
        if (field.type === 'array') {
          updatedData[fieldName] = [];
        } else if (field.type === 'checkbox') {
          updatedData[fieldName] = false;
        } else {
          updatedData[fieldName] = '';
        }
      }
    });
    
    setFormData(updatedData);
  };

  const handleArrayChange = (field: string, value: string) => {
    if (!value.trim()) return;
    
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field]?.filter((_: any, i: number) => i !== index) || [],
    }));
  };

  const validateForm = () => {
    console.log('=== validateForm 開始 ===');
    console.log('formData:', formData);
    console.log('activity_types 類型:', typeof formData.activity_types, '值:', formData.activity_types);
    console.log('categories 類型:', typeof formData.categories, '值:', formData.categories);
    console.log('statuses 類型:', typeof formData.statuses, '值:', formData.statuses);
    
    const newErrors: Record<string, string> = {};
    
    // 基本欄位驗證
    if (!formData.activity_name?.trim()) {
      newErrors.activity_name = '請輸入活動名稱';
      console.log('活動名稱驗證失敗');
    }
    
    // 確保陣列欄位是陣列格式
    const activityTypes = Array.isArray(formData.activity_types) ? formData.activity_types : [];
    const categories = Array.isArray(formData.categories) ? formData.categories : [];
    const statuses = Array.isArray(formData.statuses) ? formData.statuses : [];
    
    console.log('處理後的陣列:', { activityTypes, categories, statuses });
    
    if (activityTypes.length === 0) {
      newErrors.activity_types = '請選擇至少一個活動類型';
      console.log('活動類型驗證失敗');
    }

    if (categories.length === 0) {
      newErrors.categories = '請選擇至少一個分類';
      console.log('分類驗證失敗');
    }

    if (statuses.length === 0) {
      newErrors.statuses = '請選擇至少一個狀態';
      console.log('狀態驗證失敗');
    }
    
    // 範本欄位驗證
    if (selectedTemplate && templateFieldsLoaded) {
      const templateFields = getTemplateFields(selectedTemplate);
      templateFields.forEach((field: any) => {
        const fieldName = field.title || field.name || field.id;
        const fieldRequired = field.required || false;
        
        if (fieldRequired) {
          const value = formData[fieldName];
          if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())) {
            newErrors[fieldName] = `請填寫${fieldName}`;
          }
        }
      });
    }
    
    console.log('驗證結果 - 錯誤數量:', Object.keys(newErrors).length);
    console.log('驗證錯誤:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('=== validateForm 結束，結果:', isValid, '===');
    return isValid;
  };

  // 遞迴移除指定 key
  function deepOmit(obj: any, keyToOmit: string): any {
    if (Array.isArray(obj)) {
      return obj.map(item => deepOmit(item, keyToOmit));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: any = {};
      for (const key in obj) {
        if (key !== keyToOmit) {
          newObj[key] = deepOmit(obj[key], keyToOmit);
        }
      }
      return newObj;
    }
    return obj;
  }

  const handleSubmit = async () => {
    console.log('handleSubmit 被呼叫，mode:', mode);
    
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      // 收集自訂欄位資料
      const customFields: Record<string, any> = {};
      if (selectedTemplate && templateFieldsLoaded) {
        const templateFields = getTemplateFields(selectedTemplate);
        
        templateFields.forEach((field: any) => {
          // 嘗試多種可能的欄位名稱
          const fieldNames = [field.name, field.title, field.id, field.label];
          let fieldValue = null;
          
          for (const fieldName of fieldNames) {
            if (fieldName && formData[fieldName] !== undefined) {
              fieldValue = formData[fieldName];
              break;
            }
          }
          
          if (fieldValue !== null && fieldValue !== undefined) {
            // 使用第一個找到的欄位名稱作為 key
            const fieldKey = fieldNames.find(name => name) || field.id;
            customFields[fieldKey] = fieldValue;
          }
        });
      }
      
      const submitData = {
        ...formData,
        custom_fields: customFields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // 準備提交資料，包含 estimated_duration
      const cleanedData = {
        ...submitData,
        estimated_duration: submitData.estimated_duration || submitData.duration || 0,
      };
    
      // 修正 template_id 空字串問題
      if (cleanedData.template_id === '' || cleanedData.template_id === undefined) {
        cleanedData.template_id = null;
      }
    
      // 將陣列欄位轉為單一值（用於資料庫儲存）
      if (Array.isArray(cleanedData.activity_types) && cleanedData.activity_types.length > 0) {
        cleanedData.activity_type = cleanedData.activity_types[0];
      }
      if (Array.isArray(cleanedData.categories) && cleanedData.categories.length > 0) {
        cleanedData.category = cleanedData.categories[0];
      }
      if (Array.isArray(cleanedData.statuses) && cleanedData.statuses.length > 0) {
        cleanedData.status = cleanedData.statuses[0];
      }
    
      // 確保單數欄位有值（如果陣列為空，使用預設值）
      if (!cleanedData.activity_type) {
        cleanedData.activity_type = 'game'; // 預設值
      }
      if (!cleanedData.category) {
        cleanedData.category = '基礎訓練'; // 預設值
      }
      if (!cleanedData.status) {
        cleanedData.status = 'draft'; // 預設值
      }
    
      // 移除多餘欄位
      delete cleanedData.activity_types;
      delete cleanedData.categories;
      delete cleanedData.statuses;

      onSubmit(cleanedData);
    } catch (error) {
      console.error('提交失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 彈出選擇相關函數
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    // 根據欄位類型設置初始值
    if (field === 'template_id') {
      setPopupSelected(formData[field] || '');
    } else {
      setPopupSelected(formData[field] || []);
    }
  };

  const handlePopupConfirm = () => {
    if (['activity_types', 'categories', 'statuses', 'tags'].includes(showPopup.field)) {
      // 多選欄位
      handleInputChange(showPopup.field, Array.isArray(popupSelected) ? popupSelected : []);
    } else if (showPopup.field === 'template_id') {
      // 單選欄位
      handleTemplateChange(typeof popupSelected === 'string' ? popupSelected : '');
    }
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    // 根據欄位類型設置正確的初始值
    if (showPopup.field === 'template_id') {
      setPopupSelected(formData[showPopup.field] || '');
    } else {
      setPopupSelected(formData[showPopup.field] || []);
    }
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

    const field = showCustomManager.field;
    
    if (field === 'tag') {
      // 新增標籤
      try {
        const { error } = await supabase
          .from('hanami_resource_tags')
          .insert({
            tag_name: newOptionName.trim(),
            tag_description: '',
            tag_color: '#10B981', // 預設綠色
            is_active: true,
          });

        if (error) throw error;

        // 更新本地狀態
        const newTag = {
          id: newOptionName.trim(),
          tag_name: newOptionName.trim(),
          tag_description: '',
          tag_color: '#10B981',
          is_active: true,
        };

        setTags(prev => [...prev, newTag]);
        setNewOptionName('');
        toast.success('新增標籤成功！');
      } catch (error) {
        console.error('新增標籤失敗:', error);
        toast.error('新增標籤失敗，請重試');
      }
    } else {
      // 新增活動類型或狀態
      const optionType = field === 'activity_type' ? 'activity_type' : 'status';
      const optionValue = newOptionName.toLowerCase().replace(/\s+/g, '_');

      try {
        // 儲存到資料庫
        const { error } = await supabase
          .from('hanami_custom_options')
          .insert({
            option_type: optionType,
            option_name: newOptionName.trim(),
            option_value: optionValue,
            sort_order: customOptions[field === 'activity_type' ? 'activity_types' : 'statuses'].length,
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
          [field === 'activity_type' ? 'activity_types' : 'statuses']: [...prev[field === 'activity_type' ? 'activity_types' : 'statuses'], newOption],
        }));

        setNewOptionName('');
        toast.success('新增成功！');
      } catch (error) {
        console.error('新增選項失敗:', error);
        toast.error('新增失敗，請重試');
      }
    }
  };

  const handleEditCustomOption = async () => {
    if (!editingOption || !newOptionName.trim()) return;

    const field = showCustomManager.field;
    
    if (field === 'tag') {
      // 編輯標籤
      try {
        const { error } = await supabase
          .from('hanami_resource_tags')
          .update({
            tag_name: newOptionName.trim(),
          })
          .eq('id', editingOption.id);

        if (error) throw error;

        // 更新本地狀態
        setTags(prev => prev.map(tag =>
          tag.id === editingOption.id ? { ...tag, tag_name: newOptionName.trim() } : tag,
        ));

        setNewOptionName('');
        setEditingOption(null);
        toast.success('更新標籤成功！');
      } catch (error) {
        console.error('更新標籤失敗:', error);
        toast.error('更新標籤失敗，請重試');
      }
    } else {
      // 編輯活動類型或狀態
      const optionType = field === 'activity_type' ? 'activity_type' : 'status';

      try {
        // 更新資料庫
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({
            option_name: newOptionName.trim(),
          })
          .eq('option_type', optionType)
          .eq('option_value', editingOption.id);

        if (error) throw error;

        // 更新本地狀態
        setCustomOptions(prev => ({
          ...prev,
          [field === 'activity_type' ? 'activity_types' : 'statuses']: prev[field === 'activity_type' ? 'activity_types' : 'statuses'].map(option =>
            option.id === editingOption.id ? { ...option, name: newOptionName.trim(), is_default: editingOption.is_default } : option,
          ),
        }));

        setNewOptionName('');
        setEditingOption(null);
        toast.success('更新成功！');
      } catch (error) {
        console.error('更新選項失敗:', error);
        toast.error('更新失敗，請重試');
      }
    }
  };

  const handleDeleteCustomOption = async (optionId: string) => {
    const field = showCustomManager.field;
    
    if (field === 'tag') {
      // 刪除標籤
      try {
        // 軟刪除（設為非活躍）
        const { error } = await supabase
          .from('hanami_resource_tags')
          .update({ is_active: false })
          .eq('id', optionId);

        if (error) throw error;

        // 更新本地狀態
        setTags(prev => prev.filter(tag => tag.id !== optionId));

        toast.success('刪除標籤成功！');
      } catch (error) {
        console.error('刪除標籤失敗:', error);
        toast.error('刪除標籤失敗，請重試');
      }
    } else {
      // 刪除活動類型或狀態
      const optionType = field === 'activity_type' ? 'activity_type' : 'status';

      try {
        // 軟刪除（設為非活躍）
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({ is_active: false })
          .eq('option_type', optionType)
          .eq('option_value', optionId);

        if (error) throw error;

        // 更新本地狀態
        setCustomOptions(prev => ({
          ...prev,
          [field === 'activity_type' ? 'activity_types' : 'statuses']: prev[field === 'activity_type' ? 'activity_types' : 'statuses'].filter(option => option.id !== optionId),
        }));

        toast.success('刪除成功！');
      } catch (error) {
        console.error('刪除選項失敗:', error);
        toast.error('刪除失敗，請重試');
      }
    }
  };

  const startEditOption = (option: any) => {
    setEditingOption(option);
    setNewOptionName(option.name || option.category_name || option.tag_name);
  };

  // 插入測試資料
  const fillTestData = () => {
    const testData = {
      activity_name: '測試音樂活動',
      activity_types: ['game'],
      categories: ['遊戲活動'],
      statuses: ['published'],
      difficulty_level: 1,
      estimated_duration: 30,
      activity_description: '這是一個測試用的音樂教學活動，用於驗證系統功能。',
      materials_needed: ['樂器', '節奏棒', '音樂播放器'],
      tags: ['節奏訓練', '團體活動', '初學者'],
      instructions: '1. 播放音樂\n2. 學生跟隨節奏拍手\n3. 分組進行節奏遊戲\n4. 總結活動心得',
      custom_fields: {
        title: '測試音樂活動',
        description: '這是一個測試用的音樂教學活動，用於驗證系統功能。',
        activity_type: '遊戲活動',
        difficulty_level: 1,
        duration: 30,
        objectives: ['培養節奏感', '提升音樂欣賞能力', '增進團體合作'],
        materials: ['樂器', '節奏棒', '音樂播放器'],
        instructions: '1. 播放音樂\n2. 學生跟隨節奏拍手\n3. 分組進行節奏遊戲\n4. 總結活動心得',
        notes: '適合 3-6 歲兒童，注意音量控制',
      },
    };
    
    setFormData(testData);
    toast.success('已自動填入測試資料！');
  };

  // 渲染基本欄位
  const renderBasicFields = () => (
    <div className="grid grid-cols-1 gap-4">
      <HanamiInput
        error={errors.activity_name}
        label="活動名稱 *"
        placeholder="請輸入活動名稱"
        value={formData.activity_name || ''}
        onChange={(e) => handleInputChange('activity_name', e.target.value)}
      />
      {/* 活動類型多選 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-hanami-text">
            活動類型 *
          </label>
          <button
            className="text-sm text-hanami-primary hover:text-hanami-accent underline"
            type="button"
            onClick={() => handleCustomManagerOpen('activity_type')}
          >
            管理選項
          </button>
        </div>
        <button
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
          type="button"
          onClick={() => handlePopupOpen('activity_types')}
        >
          {formData.activity_types.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.activity_types.map((id: string) => {
                const option = customOptions.activity_types.find(t => t.id === id);
                return option ? (
                  <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                    {option.label}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            '請選擇活動類型'
          )}
        </button>
        {errors.activity_types && (
          <p className="text-red-500 text-sm mt-1">{errors.activity_types}</p>
        )}
      </div>
      {/* 分類多選 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-hanami-text">
            分類
          </label>
          <button
            className="text-sm text-hanami-primary hover:text-hanami-accent underline"
            type="button"
            onClick={() => handleCustomManagerOpen('category')}
          >
            管理選項
          </button>
        </div>
        <button
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
          type="button"
          onClick={() => handlePopupOpen('categories')}
        >
          {formData.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.categories.map((cid: string) => {
                const category = categories.find(c => c.category_name === cid);
                return category ? (
                  <span key={cid} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-secondary/20 text-hanami-text border border-hanami-secondary/30">
                    {category.category_name}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            '請選擇分類'
          )}
        </button>
      </div>
      {/* 狀態多選 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-hanami-text">
            狀態
          </label>
          <button
            className="text-sm text-hanami-primary hover:text-hanami-accent underline"
            type="button"
            onClick={() => handleCustomManagerOpen('status')}
          >
            管理選項
          </button>
        </div>
        <button
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
          type="button"
          onClick={() => handlePopupOpen('statuses')}
        >
          {formData.statuses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.statuses.map((sid: string) => {
                const status = customOptions.statuses.find(s => s.id === sid);
                return status ? (
                  <span key={sid} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-accent/20 text-hanami-text border border-hanami-accent/30">
                    {status.label}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            '請選擇狀態'
          )}
        </button>
      </div>

      <HanamiInput
        error={errors.difficulty_level}
        label="難度等級"
        max={5}
        min={1}
        type="number"
        value={formData.difficulty_level?.toString() || '1'}
        onChange={(e) => handleInputChange('difficulty_level', parseInt(e.target.value) || 1)}
      />

      <HanamiInput
        error={errors.estimated_duration}
        label="預估時長 (分鐘)"
        min={0}
        type="number"
        value={formData.estimated_duration?.toString() || '0'}
        onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
      />
    </div>
  );

  // 渲染範本選擇
  const renderTemplateSelection = () => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-hanami-text mb-4">選擇範本</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-2">
              活動範本
            </label>
            <button
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
              type="button"
              onClick={() => handlePopupOpen('template_id')}
            >
              {formData.template_id ? 
                templates.find(t => t.id === formData.template_id)?.template_name || '未知範本'
                : '不使用範本'}
            </button>
          </div>
          
          {selectedTemplate && !templateFieldsLoaded && (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-hanami-text">
                  {selectedTemplate.template_name}
                </h4>
                <p className="text-sm text-hanami-text-secondary">
                  {selectedTemplate.template_description}
                </p>
                {selectedTemplate.template_schema?.fields && (
                  <p className="text-sm text-hanami-text-secondary mt-1">
                    包含 {selectedTemplate.template_schema.fields.length} 個欄位
                  </p>
                )}
              </div>
              <HanamiButton
                className="bg-hanami-primary hover:bg-hanami-accent w-full md:w-auto"
                onClick={loadTemplateFields}
              >
                載入欄目
              </HanamiButton>
            </div>
          )}
          
          {selectedTemplate && templateFieldsLoaded && (
            <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-700">
                範本欄位已載入
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染範本欄位
  const renderTemplateFields = () => {
    const templateFields = getTemplateFields(selectedTemplate);
    if (!templateFields.length || !templateFieldsLoaded) {
      return null;
    }
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-hanami-text mb-4">範本欄位</h3>
        <div className="grid grid-cols-1 gap-4">
          {templateFields.map((field: any, index: number) => {
            const fieldName = field.title || field.name || field.id;
            const fieldType = field.type || 'text';
            const fieldRequired = field.required || false;
            const fieldPlaceholder = field.placeholder || `請輸入${fieldName}`;
            const fieldOptions = field.options || [];
            
            return (
              <div key={fieldName}>
                {fieldType === 'text' && (
                  <HanamiInput
                    error={errors[fieldName]}
                    label={`${fieldName}${fieldRequired ? ' *' : ''}`}
                    placeholder={fieldPlaceholder}
                    value={formData[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  />
                )}
                
                {fieldType === 'select' && (
                  <HanamiSelect
                    error={errors[fieldName]}
                    label={`${fieldName}${fieldRequired ? ' *' : ''}`}
                    options={[
                      { value: '', label: `選擇${fieldName}` },
                      ...(fieldOptions.map((opt: string) => ({ value: opt, label: opt }))),
                    ]}
                    value={formData[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  />
                )}
                
                {fieldType === 'textarea' && (
                  <div>
                    <label className="block text-sm font-medium text-hanami-text mb-2">
                      {fieldName}{fieldRequired ? ' *' : ''}
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                      placeholder={fieldPlaceholder}
                      rows={3}
                      value={formData[fieldName] || ''}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                    />
                    {errors[fieldName] && (
                      <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
                    )}
                  </div>
                )}
                
                {fieldType === 'number' && (
                  <HanamiInput
                    error={errors[fieldName]}
                    label={`${fieldName}${fieldRequired ? ' *' : ''}`}
                    placeholder={fieldPlaceholder}
                    type="number"
                    value={formData[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
                  />
                )}
                
                {fieldType === 'checkbox' && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        checked={formData[fieldName] || false}
                        className="rounded"
                        type="checkbox"
                        onChange={(e) => handleInputChange(fieldName, e.target.checked)}
                      />
                      <span className="text-sm font-medium text-hanami-text">
                        {fieldName}{fieldRequired ? ' *' : ''}
                      </span>
                    </label>
                    {errors[fieldName] && (
                      <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
                    )}
                  </div>
                )}
                
                {fieldType === 'array' && (
                  <div>
                    <label className="block text-sm font-medium text-hanami-text mb-2">
                      {fieldName}{fieldRequired ? ' *' : ''}
                    </label>
                    <div className="space-y-2">
                      {formData[fieldName]?.map((item: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="flex-1 p-2 bg-gray-50 rounded border">
                            {item}
                          </span>
                          <button
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                            type="button"
                            onClick={() => removeArrayItem(fieldName, index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-col md:flex-row gap-2">
                        <input
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                          placeholder={fieldPlaceholder || `新增${fieldName}`}
                          type="text"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleArrayChange(fieldName, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          className="px-4 py-2 bg-hanami-primary text-white rounded hover:bg-hanami-accent w-full md:w-auto"
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            handleArrayChange(fieldName, input.value);
                            input.value = '';
                          }}
                        >
                          新增
                        </button>
                      </div>
                    </div>
                    {errors[fieldName] && (
                      <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
                    )}
                  </div>
                )}
                
                {/* 處理 multiple_choice 欄位類型 */}
                {fieldType === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-hanami-text mb-2">
                      {fieldName}{fieldRequired ? ' *' : ''}
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                      value={formData[fieldName] || ''}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                    >
                      <option value="">請選擇</option>
                      {fieldOptions.map((option: string, index: number) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors[fieldName] && (
                      <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
                    )}
                  </div>
                )}
                
                {/* 處理 title 欄位類型 */}
                {fieldType === 'title' && (
                  <HanamiInput
                    error={errors[fieldName]}
                    label={`${fieldName}${fieldRequired ? ' *' : ''}`}
                    placeholder={fieldPlaceholder}
                    value={formData[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  />
                )}
                
                {/* 處理 short_answer 欄位類型 */}
                {fieldType === 'short_answer' && (
                  <HanamiInput
                    error={errors[fieldName]}
                    label={`${fieldName}${fieldRequired ? ' *' : ''}`}
                    placeholder={fieldPlaceholder}
                    value={formData[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  />
                )}
                
                {/* 預設文字輸入，處理未知的欄位類型 */}
                {!['text', 'select', 'textarea', 'number', 'checkbox', 'array', 'title', 'short_answer', 'multiple_choice'].includes(fieldType) && (
                  <HanamiInput
                    error={errors[fieldName]}
                    label={`${fieldName} (${fieldType})${fieldRequired ? ' *' : ''}`}
                    placeholder={fieldPlaceholder}
                    value={formData[fieldName] || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染陣列欄位
  const renderArrayFields = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-hanami-text mb-4">所需道具</h3>
      <div className="space-y-2">
        {formData.materials_needed?.map((item: string, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex-1 p-2 bg-gray-50 rounded border">
              {item}
            </span>
            <button
              className="p-2 text-red-500 hover:bg-red-50 rounded"
              type="button"
              onClick={() => removeArrayItem('materials_needed', index)}
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
            placeholder="新增道具"
            type="text"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayChange('materials_needed', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button
            className="px-4 py-2 bg-hanami-primary text-white rounded hover:bg-hanami-accent w-full md:w-auto"
            type="button"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              handleArrayChange('materials_needed', input.value);
              input.value = '';
            }}
          >
            新增
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染標籤選擇
  const renderTagSelection = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-hanami-text mb-4">標籤</h3>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-hanami-text">
            標籤
          </label>
          <button
            className="text-sm text-hanami-primary hover:text-hanami-accent underline"
            type="button"
            onClick={() => handleCustomManagerOpen('tag')}
          >
            管理選項
          </button>
        </div>
        <button
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
          type="button"
          onClick={() => handlePopupOpen('tags')}
        >
          {formData.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tagName: string) => {
                const tag = tags.find(t => t.tag_name === tagName);
                return tag ? (
                  <span key={tagName} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-success/20 text-hanami-text border border-hanami-success/30">
                    {tag.tag_name}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            '請選擇標籤'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {console.log('ActivityForm render, showCustomManager:', showCustomManager)}
      
      {/* 彈出選擇組件 */}
      {showPopup.open && (
        <PopupSelect
          mode={showPopup.field === 'template_id' ? 'single' : 'multi'}
          options={
            showPopup.field === 'activity_types' ? [
              ...customOptions.activity_types.map(t => ({ value: t.id, label: t.name })),
            ] :
              showPopup.field === 'categories' ? [
                ...categories.map(c => ({ value: c.category_name, label: c.category_name })),
              ] :
                showPopup.field === 'statuses' ? [
                  ...customOptions.statuses.map(s => ({ value: s.id, label: s.name })),
                ] :
                  showPopup.field === 'tags' ? [
                    ...tags.map(t => ({ value: t.tag_name, label: t.tag_name })),
                  ] :
                    showPopup.field === 'template_id' ? [
                      { value: '', label: '不使用範本' },
                      ...templates.map(t => ({ value: t.id, label: t.template_name })),
                    ] : []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'activity_types' ? '選擇活動類型' :
              showPopup.field === 'categories' ? '選擇分類' :
                showPopup.field === 'statuses' ? '選擇狀態' :
                  showPopup.field === 'tags' ? '選擇標籤' :
                    showPopup.field === 'template_id' ? '選擇範本' :
                      '選擇選項'
          }
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
              <h2 className="text-xl md:text-2xl font-bold text-hanami-text">
                {showCustomManager.field === 'activity_type' ? '管理活動類型' :
                  showCustomManager.field === 'category' ? '管理分類' :
                    showCustomManager.field === 'status' ? '管理狀態' :
                      showCustomManager.field === 'tag' ? '管理標籤' : '管理選項'}
              </h2>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* 新增/編輯表單 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-hanami-text mb-4">
                  {editingOption ? '編輯選項' : '新增選項'}
                </h3>
                <div className="space-y-4">
                  <HanamiInput
                    label="選項名稱 *"
                    placeholder="例如：戶外活動、線上課程、團體活動"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                  />
                  
                  {/* 預設設定 */}
                  <div className="flex items-center gap-2">
                    <input
                      checked={editingOption?.is_default || false}
                      className="rounded border-gray-300 text-hanami-primary focus:ring-hanami-primary"
                      id="isDefault"
                      type="checkbox"
                      onChange={(e) => {
                        if (editingOption) {
                          setEditingOption({
                            ...editingOption,
                            is_default: e.target.checked,
                          });
                        }
                      }}
                    />
                    <label className="text-sm text-hanami-text" htmlFor="isDefault">
                      設為預設選項
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <HanamiButton
                      className="bg-hanami-primary hover:bg-hanami-accent"
                      disabled={!newOptionName.trim()}
                      onClick={
                        showCustomManager.field === 'category' ? 
                          (editingOption ? handleEditCategory : handleAddCategory) :
                          (editingOption ? handleEditCustomOption : handleAddCustomOption)
                      }
                    >
                      {editingOption ? '更新' : '新增'}
                    </HanamiButton>
                    {editingOption && (
                      <HanamiButton
                        variant="secondary"
                        onClick={() => {
                          setEditingOption(null);
                          setNewOptionName('');
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
                <h3 className="text-lg font-semibold text-hanami-text mb-4">現有選項</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(showCustomManager.field === 'activity_type' ? customOptions.activity_types :
                    showCustomManager.field === 'status' ? customOptions.statuses :
                      showCustomManager.field === 'tag' ? tags :
                        categories).map((option: any) => (
                          <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.name || option.category_name || option.tag_name}</span>
                              {option.is_default && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">預設</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <HanamiButton
                                className="text-xs px-3 py-1"
                                size="sm"
                                variant="secondary"
                                onClick={() => startEditOption(option)}
                              >
                                編輯
                              </HanamiButton>
                              <HanamiButton
                                className="text-xs px-3 py-1"
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  if (confirm(`確定要刪除「${option.name || option.category_name || option.tag_name}」嗎？`)) {
                                    if (showCustomManager.field === 'category') {
                                      handleDeleteCategory(option.id);
                                    } else if (showCustomManager.field === 'tag') {
                                      handleDeleteCustomOption(option.id);
                                    } else {
                                      handleDeleteCustomOption(option.id);
                                    }
                                  }
                                }}
                              >
                                刪除
                              </HanamiButton>
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

      {/* 主表單彈出視窗 */}
      <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg md:max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-hanami-text">
                {mode === 'create' ? '新增教學活動' : '編輯教學活動'}
              </h2>
              <HanamiButton
                className="bg-gradient-to-r from-green-500 to-green-600"
                variant="cute"
                onClick={fillTestData}
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                插入測試資料
              </HanamiButton>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* 範本選擇 */}
            {renderTemplateSelection()}

            {/* 基本欄位 */}
            <div>
              <h3 className="text-lg font-semibold text-hanami-text mb-4">基本資訊</h3>
              {renderBasicFields()}
            </div>

            {/* 活動描述 */}
            <div>
              <h3 className="text-lg font-semibold text-hanami-text mb-4">活動描述</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                placeholder="請描述活動內容、目標和流程..."
                rows={4}
                value={formData.activity_description || ''}
                onChange={(e) => handleInputChange('activity_description', e.target.value)}
              />
            </div>

            {/* 範本欄位 */}
            {renderTemplateFields()}

            {/* 所需道具 */}
            {renderArrayFields()}

            {/* 標籤選擇 */}
            {renderTagSelection()}

            {/* 注意事項 */}
            <div>
              <h3 className="text-lg font-semibold text-hanami-text mb-4">注意事項</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                placeholder="請輸入活動注意事項、安全提醒等..."
                rows={3}
                value={formData.instructions || ''}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row justify-end gap-3">
            <HanamiButton
              className="w-full md:w-auto"
              disabled={loading}
              variant="secondary"
              onClick={onCancel}
            >
              取消
            </HanamiButton>
            <HanamiButton
              className="bg-hanami-primary hover:bg-hanami-accent w-full md:w-auto"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? '處理中...' : (mode === 'create' ? '新增活動' : '更新活動')}
            </HanamiButton>
          </div>
        </div>
      </div>
    </>
  );
} 
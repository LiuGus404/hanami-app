'use client';

import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { ActivityTemplateBuilder } from './ActivityTemplateBuilder';
import { DynamicActivityForm } from './DynamicActivityForm';
import { TemplateManagement } from './TemplateManagement';
import { TemplateSelector } from './TemplateSelector';

import { HanamiButton, HanamiInput, HanamiSelect, HanamiCard } from '@/components/ui';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';


// 使用統一的 ActivityTemplate 類型
import { ActivityTemplate } from '@/types/template';

interface TeachingActivity {
  id: string;
  activity_name: string;
  activity_description: string | null;
  activity_type: string;
  difficulty_level: number | null;
  target_abilities: string[] | null;
  materials_needed: string[] | null;
  duration_minutes: number | null;
  age_range_min: number | null;
  age_range_max: number | null;
  notion_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  template_id?: string;
  custom_fields?: any;
  status?: string;
  tags?: string[];
  category?: string;
  version?: number;
  created_by?: string;
  updated_by?: string;
  estimated_duration?: number;
  instructions?: string;
  notes?: string;
}

interface TemplateField {
  id: string;
  label: string;
  title?: string; // 加入這個欄位
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'array';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
}

export function TeachingActivityManagement() {
  const [activities, setActivities] = useState<TeachingActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<TeachingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 多選篩選狀態
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSort, setFilterSort] = useState<string>('last_updated');
  
  // 彈窗狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);
  const [showPopupSort, setShowPopupSort] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelectedSort, setPopupSelectedSort] = useState<string | string[]>([]);
  
  // 篩選選項狀態
  const [activityTypeOptions, setActivityTypeOptions] = useState<{ value: string, label: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ value: string, label: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ value: string, label: string }[]>([]);
  
  // 排序選項
  const sortOptions = [
    { value: 'last_updated', label: '最後更新時間' },
    { value: 'activity_type', label: '活動類型' },
    { value: 'status', label: '狀態' },
    { value: 'tags', label: '標籤' },
    { value: 'duration', label: '時長' },
  ];
  
  // 新增活動相關狀態
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  
  // 編輯活動相關狀態
  const [editingActivity, setEditingActivity] = useState<TeachingActivity | null>(null);
  const [viewingActivity, setViewingActivity] = useState<TeachingActivity | null>(null);

  // 分頁資料
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // 載入活動資料
  const loadActivities = async () => {
    try {
      setLoading(true);
      // 這裡應該調用實際的 API
      const response = await fetch('/api/teaching-activities');
      const data = await response.json();
      setActivities(data);
      setFilteredActivities(data);
    } catch (error) {
      console.error('載入活動失敗:', error);
      toast.error('載入活動失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入範本資料
  const loadTemplates = async () => {
    try {
      console.log('開始載入範本...');
      // 這裡應該調用實際的 API
      const response = await fetch('/api/activity-templates');
      console.log('API 回應狀態:', response.status);
      
      if (!response.ok) {
        throw new Error(`API 回應錯誤: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('載入的範本資料:', data);
      setTemplates(data);
    } catch (error) {
      console.error('載入範本失敗:', error);
    }
  };

  useEffect(() => {
    loadActivities();
    loadTemplates();
    loadMasterOptions();
  }, []);

  // 載入 master list
  const loadMasterOptions = async () => {
    try {
      // 活動類型 - 使用預設選項，暫時不查詢資料庫
      const defaultTypes = [
        { value: 'game', label: '遊戲活動' },
        { value: 'training', label: '訓練活動' },
        { value: 'exercise', label: '練習活動' },
        { value: 'storybook', label: '繪本活動' },
        { value: 'performance', label: '表演活動' },
      ];
      setActivityTypeOptions(defaultTypes);

      // 狀態 - 使用預設選項
      const defaultStatuses = [
        { value: 'draft', label: '草稿' },
        { value: 'published', label: '已發布' },
        { value: 'archived', label: '已封存' },
      ];
      setStatusOptions(defaultStatuses);

      // 標籤 - 使用預設選項
      const defaultTags = [
        { value: '節奏訓練', label: '節奏訓練' },
        { value: '音感訓練', label: '音感訓練' },
        { value: '創作活動', label: '創作活動' },
        { value: '團體活動', label: '團體活動' },
        { value: '個別指導', label: '個別指導' },
        { value: '初學者', label: '初學者' },
        { value: '進階', label: '進階' },
      ];
      setTagOptions(defaultTags);
    } catch (error) {
      console.error('載入篩選選項失敗:', error);
    }
  };

  // 篩選和排序
  useEffect(() => {
    let filtered = activities;

    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.activity_description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 多選活動類型篩選
    if (filterTypes.length > 0) {
      filtered = filtered.filter(activity => filterTypes.includes(activity.activity_type));
    }

    // 多選狀態篩選
    if (filterStatuses.length > 0) {
      filtered = filtered.filter(activity => filterStatuses.includes(activity.status || 'draft'));
    }

    // 多選標籤篩選
    if (filterTags.length > 0) {
      filtered = filtered.filter(activity => 
        (activity.tags || []).some(tag => filterTags.includes(tag)),
      );
    }

    // 排序：以最後更新時間（updated_at > created_at）倒序
    filtered.sort((a, b) => {
      if (filterSort === 'last_updated') {
        const aTime = new Date(a.updated_at || a.created_at || '').getTime();
        const bTime = new Date(b.updated_at || b.created_at || '').getTime();
        return bTime - aTime;
      }
      // 其他欄位排序
      let aValue = a[filterSort as keyof TeachingActivity];
      let bValue = b[filterSort as keyof TeachingActivity];
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredActivities(filtered);
  }, [activities, searchQuery, filterTypes, filterStatuses, filterTags, filterSort]);

  // 分頁資料
  const pagedActivities = filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredActivities.length / pageSize);

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

  // 新增活動
  const handleAddActivity = async (formData: any) => {
    try {
      console.log('收到的表單資料:', formData);
      // 準備提交資料，使用正確的資料庫欄位名稱
      const newActivity = {
        activity_name: formData.activity_name || formData.title || '未命名活動',
        activity_description: formData.activity_description || formData.description || '',
        activity_type: formData.activity_types?.[0] || formData.activity_type || 'general',
        difficulty_level: formData.difficulty_level || 1,
        duration_minutes: formData.duration_minutes || formData.duration || formData.estimated_duration || 30,
        materials_needed: formData.materials_needed || formData.materials || [],
        target_abilities: formData.target_abilities || formData.objectives || [],
        instructions: formData.instructions || '',
        notes: formData.notes || '',
        template_id: selectedTemplate?.id || null,
        custom_fields: formData.custom_fields || formData,
        status: formData.statuses?.[0] || formData.status || 'draft',
        tags: formData.tags || [],
        category: formData.categories?.[0] || formData.category || '',
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        estimated_duration: formData.estimated_duration || formData.duration || 30,
      };
      
      console.log('準備提交的資料:', newActivity);
      // 調用 API
      const response = await fetch('/api/teaching-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });
      if (response.ok) {
        const result = await response.json();
        console.log('新增成功:', result);
        toast.success('活動新增成功');
        setShowAddForm(false);
        setSelectedTemplate(null);
        loadActivities();
      } else {
        const errorData = await response.json();
        console.error('API 錯誤:', errorData);
        throw new Error(`新增失敗: ${response.status}`);
      }
    } catch (error) {
      console.error('新增活動失敗:', error);
      toast.error('新增活動失敗');
    }
  };

  // 更新活動
  const handleUpdateActivity = async (formData: any) => {
    if (!editingActivity) return;

    try {
      const updatedActivity = {
        ...editingActivity,
        ...formData,
        updated_at: new Date().toISOString(),
      };

      // 這裡應該調用實際的 API
      const response = await fetch(`/api/teaching-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedActivity),
      });

      if (response.ok) {
        toast.success('活動更新成功');
        setEditingActivity(null);
        loadActivities();
      } else {
        throw new Error('更新失敗');
      }
    } catch (error) {
      console.error('更新活動失敗:', error);
      toast.error('更新活動失敗');
    }
  };

  // 刪除活動
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('確定要刪除此活動嗎？')) return;

    try {
      // 這裡應該調用實際的 API
      const response = await fetch(`/api/teaching-activities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('活動刪除成功');
        loadActivities();
      } else {
        throw new Error('刪除失敗');
      }
    } catch (error) {
      console.error('刪除活動失敗:', error);
      toast.error('刪除活動失敗');
    }
  };

  // 複製活動
  const handleCopyActivity = async (activity: TeachingActivity) => {
    try {
      const copiedActivity = {
        ...activity,
        id: undefined,
        activity_name: `${activity.activity_name} (複製)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 這裡應該調用實際的 API
      const response = await fetch('/api/teaching-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copiedActivity),
      });

      if (response.ok) {
        toast.success('活動複製成功');
        loadActivities();
      } else {
        throw new Error('複製失敗');
      }
    } catch (error) {
      console.error('複製活動失敗:', error);
      toast.error('複製活動失敗');
    }
  };

  // 選擇範本
  const handleTemplateSelect = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    setShowAddForm(true);
  };

  // 彈窗處理函數
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    switch (field) {
      case 'types':
        setPopupSelected(filterTypes);
        break;
      case 'statuses':
        setPopupSelected(filterStatuses);
        break;
      case 'tags':
        setPopupSelected(filterTags);
        break;
    }
  };

  const handlePopupConfirm = () => {
    const selected = Array.isArray(popupSelected) ? popupSelected : [popupSelected];
    switch (showPopup.field) {
      case 'types':
        setFilterTypes(selected);
        break;
      case 'statuses':
        setFilterStatuses(selected);
        break;
      case 'tags':
        setFilterTags(selected);
        break;
    }
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    setShowPopup({ field: '', open: false });
  };

  // 排序彈窗處理
  const handleSortPopupOpen = () => {
    setShowPopupSort({ field: 'sort', open: true });
    setPopupSelectedSort(filterSort);
  };

  const handleSortPopupConfirm = () => {
    setFilterSort(popupSelectedSort as string);
    setShowPopupSort({ field: '', open: false });
  };

  const handleSortPopupCancel = () => {
    setShowPopupSort({ field: '', open: false });
  };

  // 新增自訂範本
  const handleSaveTemplate = async (template: ActivityTemplate) => {
    try {
      // 這裡應該調用實際的 API
      const response = await fetch('/api/activity-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        toast.success('範本儲存成功');
        setShowTemplateBuilder(false);
        loadTemplates();
      } else {
        throw new Error('儲存失敗');
      }
    } catch (error) {
      console.error('儲存範本失敗:', error);
      toast.error('儲存範本失敗');
    }
  };

  // 插入測試資料
  const insertTestData = async () => {
    try {
      console.log('開始插入測試資料...');
      
      // 首先創建一個包含所有新欄位類型的測試範本
      const testTemplate = {
        template_name: '完整欄位類型測試範本',
        template_description: '包含所有欄位類型的測試範本',
        template_type: 'custom',
        template_schema: {
          fields: [
            {
              id: 'title_field',
              type: 'title',
              title: '活動標題',
              required: true,
              placeholder: '請輸入活動標題'
            },
            {
              id: 'short_answer_field',
              type: 'short_answer',
              title: '簡短回答',
              required: true,
              placeholder: '請輸入簡短回答'
            },
            {
              id: 'paragraph_field',
              type: 'paragraph',
              title: '詳細描述',
              required: false,
              placeholder: '請輸入詳細描述'
            },
            {
              id: 'multiple_choice_field',
              type: 'multiple_choice',
              title: '單選題',
              required: true,
              options: ['選項A', '選項B', '選項C', '選項D']
            },
            {
              id: 'checkboxes_field',
              type: 'checkboxes',
              title: '多選題',
              required: true,
              options: ['選項1', '選項2', '選項3', '選項4']
            },
            {
              id: 'dropdown_field',
              type: 'dropdown',
              title: '下拉選單',
              required: true,
              options: ['選項一', '選項二', '選項三']
            },
            {
              id: 'linear_scale_field',
              type: 'linear_scale',
              title: '線性評分',
              required: true,
              min_scale: 1,
              max_scale: 5,
              scale_labels: { min: '非常不滿意', max: '非常滿意' }
            },
            {
              id: 'rating_field',
              type: 'rating',
              title: '星級評分',
              required: true
            },
            {
              id: 'multiple_choice_grid_field',
              type: 'multiple_choice_grid',
              title: '單選網格',
              required: true,
              grid_columns: ['非常同意', '同意', '不同意', '非常不同意'],
              grid_rows: ['問題1', '問題2', '問題3']
            },
            {
              id: 'tick_box_grid_field',
              type: 'tick_box_grid',
              title: '多選網格',
              required: true,
              grid_columns: ['選項A', '選項B', '選項C'],
              grid_rows: ['項目1', '項目2', '項目3']
            },
            {
              id: 'file_upload_field',
              type: 'file_upload',
              title: '檔案上傳',
              required: false,
              allowed_types: ['pdf', 'jpg', 'png'],
              max_size: 10485760,
              multiple_files: true
            },
            {
              id: 'date_field',
              type: 'date',
              title: '日期選擇',
              required: true
            },
            {
              id: 'time_field',
              type: 'time',
              title: '時間選擇',
              required: true
            },
            {
              id: 'url_field',
              type: 'url',
              title: '網址連結',
              required: false,
              placeholder: 'https://example.com'
            },
            {
              id: 'email_field',
              type: 'email',
              title: '電子郵件',
              required: true,
              placeholder: 'example@email.com'
            },
            {
              id: 'phone_field',
              type: 'phone',
              title: '電話號碼',
              required: false,
              placeholder: '0912345678'
            },
            {
              id: 'number_field',
              type: 'number',
              title: '數字輸入',
              required: true,
              placeholder: '請輸入數字'
            }
          ],
          metadata: {
            version: "1.0",
            author: "Hanami System",
            last_updated: new Date().toISOString()
          }
        },
        template_category: 'test',
        is_active: true,
        is_public: false
      };

      // 創建測試範本
      const templateResponse = await fetch('/api/activity-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testTemplate),
      });

      if (!templateResponse.ok) {
        throw new Error('創建測試範本失敗');
      }

      const createdTemplate = await templateResponse.json();
      console.log('創建的測試範本:', createdTemplate);

      // 準備測試活動資料
      const testActivity = {
        activity_name: '完整欄位類型測試活動',
        activity_description: '這是一個測試所有欄位類型的教學活動，用於驗證系統功能。',
        activity_type: 'game',
        difficulty_level: 1,
        duration_minutes: 30,
        materials_needed: ['樂器', '節奏棒', '音樂播放器'],
        objectives: ['培養節奏感', '提升音樂欣賞能力', '增進團體合作'],
        instructions: '1. 播放音樂\n2. 學生跟隨節奏拍手\n3. 分組進行節奏遊戲\n4. 總結活動心得',
        notes: '適合 3-6 歲兒童，注意音量控制',
        template_id: createdTemplate.id,
        custom_fields: {
          title_field: '測試活動標題',
          short_answer_field: '這是簡短回答',
          paragraph_field: '這是詳細描述內容',
          multiple_choice_field: '選項B',
          checkboxes_field: ['選項1', '選項3'],
          dropdown_field: ['選項二', '選項三'],
          linear_scale_field: 4,
          rating_field: 5,
          multiple_choice_grid_field: {
            '問題1': '非常同意',
            '問題2': '同意',
            '問題3': '不同意'
          },
          tick_box_grid_field: {
            '項目1': ['選項A', '選項B'],
            '項目2': ['選項C'],
            '項目3': ['選項A', '選項C']
          },
          file_upload_field: [],
          date_field: new Date().toISOString().split('T')[0],
          time_field: '14:30',
          url_field: 'https://example.com',
          email_field: 'test@example.com',
          phone_field: '0912345678',
          number_field: 42
        },
        status: 'published',
        tags: ['節奏訓練', '團體活動', '初學者'],
        category: '遊戲活動',
      };

      console.log('準備插入的測試資料:', testActivity);

      // 創建測試活動
      const response = await fetch('/api/teaching-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testActivity),
      });

      if (response.ok) {
        toast.success('測試資料插入成功！');
        loadActivities();
        loadTemplates();
      } else {
        const errorData = await response.json();
        console.error('插入失敗:', errorData);
        throw new Error(`插入失敗: ${errorData.message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('插入測試資料失敗:', error);
      toast.error(`插入測試資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 活動卡片
  const renderActivityCard = (activity: TeachingActivity) => {
    // Debug: 檢查 activity 資料
    console.log(`渲染活動卡片: ${activity.activity_name}`);
    console.log('activity.id:', activity.id, 'updated_at:', activity.updated_at, 'created_at:', activity.created_at, 'dayjs(updated_at):', dayjs(activity.updated_at).isValid(), 'dayjs(created_at):', dayjs(activity.created_at).isValid());
    
    const lastUpdated = dayjs(activity.updated_at || activity.created_at).format('YYYY-MM-DD HH:mm');
    console.log('最後更新時間:', lastUpdated);
    
    return (
      <HanamiCard key={activity.id} className="p-4 hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.activity_name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{activity.activity_description}</p>
            </div>
            <div className="flex gap-1 ml-4">
              <HanamiButton className="tooltip" data-tooltip="查看" size="sm" variant="soft" onClick={() => setViewingActivity(activity)}><EyeIcon className="h-4 w-4" /></HanamiButton>
              <HanamiButton className="tooltip" data-tooltip="編輯" size="sm" variant="soft" onClick={() => setEditingActivity(activity)}><PencilIcon className="h-4 w-4" /></HanamiButton>
              <HanamiButton className="tooltip" data-tooltip="複製" size="sm" variant="soft" onClick={() => handleCopyActivity(activity)}><DocumentDuplicateIcon className="h-4 w-4" /></HanamiButton>
              <HanamiButton className="tooltip" data-tooltip="刪除" size="sm" variant="danger" onClick={() => handleDeleteActivity(activity.id)}><TrashIcon className="h-4 w-4" /></HanamiButton>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{activity.activity_type}</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">{activity.difficulty_level === 1 ? '初級' : activity.difficulty_level === 2 ? '中級' : activity.difficulty_level === 3 ? '高級' : activity.difficulty_level}</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">{activity.duration_minutes} 分鐘</span>
          </div>
          {/* 其他內容可加在這裡 */}
        </div>
        {/* 最底部顯示最後更新時間 */}
        <div className="mt-4 pt-2 border-t border-gray-100 text-xs text-right text-gray-500">
          最後更新（原始）：{activity.updated_at || activity.created_at}
        </div>
      </HanamiCard>
    );
  };

  if (showTemplateManagement) {
    return (
      <TemplateManagement
        onBack={() => setShowTemplateManagement(false)}
      />
    );
  }

  if (showTemplateBuilder) {
    return (
      <ActivityTemplateBuilder
        onCancel={() => setShowTemplateBuilder(false)}
        onSave={handleSaveTemplate}
      />
    );
  }

  if (showTemplateSelector) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">選擇活動範本</h2>
          <HanamiButton variant="secondary" onClick={() => setShowTemplateSelector(false)}>
            返回
          </HanamiButton>
        </div>
        
        <TemplateSelector
          templates={templates}
          onAddNew={() => {
            setShowTemplateSelector(false);
            setShowTemplateBuilder(true);
          }}
          onDelete={(templateId) => {
            // 暫時不支援刪除
            console.log('刪除範本:', templateId);
          }}
          onEdit={(template) => {
            // 暫時不支援編輯，直接選擇
            handleTemplateSelect(template);
          }}
          onSelect={handleTemplateSelect}
        />
      </div>
    );
  }

  if (showAddForm && selectedTemplate) {
    return (
      <DynamicActivityForm
        template={selectedTemplate}
        onCancel={() => {
          setShowAddForm(false);
          setSelectedTemplate(null);
        }}
        onSubmit={handleAddActivity}
      />
    );
  }

  if (editingActivity) {
    const template = templates.find(t => t.id === editingActivity.template_id);
    if (template) {
      return (
        <DynamicActivityForm
          initialData={editingActivity.custom_fields || editingActivity}
          template={template}
          onCancel={() => setEditingActivity(null)}
          onSubmit={handleUpdateActivity}
        />
      );
    }
  }

  if (viewingActivity) {
    // 找到對應的範本
    const template = templates.find(t => t.id === viewingActivity.template_id);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">查看活動</h2>
          <HanamiButton variant="secondary" onClick={() => setViewingActivity(null)}>
            返回
          </HanamiButton>
        </div>
        
        <HanamiCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">{viewingActivity.activity_name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">活動類型</h4>
              <p className="text-gray-600">{viewingActivity.activity_type}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">難度等級</h4>
              <p className="text-gray-600">{viewingActivity.difficulty_level}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">時長</h4>
              <p className="text-gray-600">{viewingActivity.duration_minutes} 分鐘</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">描述</h4>
              <p className="text-gray-600">{viewingActivity.activity_description}</p>
            </div>
            {viewingActivity.materials_needed && viewingActivity.materials_needed.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">所需材料</h4>
                <ul className="list-disc list-inside text-gray-600">
                  {viewingActivity.materials_needed.map((material, index) => (
                    <li key={`material-${index}-${material}`}>{material}</li>
                  ))}
                </ul>
              </div>
            )}
            {viewingActivity.instructions && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">活動說明</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{viewingActivity.instructions}</p>
              </div>
            )}
            {viewingActivity.notes && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">備註</h4>
                <p className="text-gray-600">{viewingActivity.notes}</p>
              </div>
            )}
            
            {/* 範本欄位顯示 */}
            {template && viewingActivity.custom_fields && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">範本欄位</h4>
                <div className="bg-gradient-to-br from-[#FFFDF8] to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8]">
                  <div className="mb-4 p-3 bg-[#FFD59A] rounded-lg">
                    <span className="text-sm font-semibold text-[#4B4036]">使用範本：</span>
                    <span className="text-sm text-[#4B4036] ml-2 font-medium">{template.name || template.template_name}</span>
                  </div>
                  <div className="space-y-4">
                    {/* 按照範本中保存的欄位順序顯示 */}
                    {template.fields && template.fields.map((field, index) => {
                      // 改進欄位值匹配邏輯，與 ActivityForm 的保存邏輯保持一致
                      let fieldValue = null;
                      const fieldKey = field.title || field.id;
                      
                      // 嘗試多種可能的鍵名匹配，與 ActivityForm 的邏輯一致
                      const fieldNames = [field.title, field.id];
                      for (const fieldName of fieldNames) {
                        if (fieldName && viewingActivity.custom_fields[fieldName] !== undefined) {
                          fieldValue = viewingActivity.custom_fields[fieldName];
                          break;
                        }
                      }
                      
                      // 如果沒有找到對應的值，跳過這個欄位
                      if (fieldValue === null || fieldValue === undefined) {
                        console.log(`未找到欄位值: ${fieldKey} (${field.id})`);
                        return null;
                      }
                      
                      console.log(`顯示欄位 ${index + 1}: ${fieldKey} =`, fieldValue);
                      
                      return (
                        <div key={field.id} className="bg-white p-4 rounded-lg border border-[#EADBC8] shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#FFD59A] text-[#4B4036] px-2 py-1 rounded-full text-xs font-medium">
                              {index + 1}
                            </span>
                            <div className="text-sm font-semibold text-[#4B4036]">
                              {field.title || field.id}
                            </div>
                            <span className="px-2 py-1 bg-[#EADBC8] rounded-full text-xs text-[#A68A64]">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                必填
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-[#4B4036] bg-[#FFF9F2] p-3 rounded-lg border border-[#EADBC8]">
                            {Array.isArray(fieldValue) ? (
                              <ul className="list-disc list-inside space-y-1">
                                {fieldValue.map((item: string, itemIndex: number) => (
                                  <li key={`${field.id}-${itemIndex}-${item}`} className="text-[#4B4036]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="whitespace-pre-wrap">{String(fieldValue)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 調試信息 - 僅在開發環境顯示 */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                      <div className="font-semibold mb-2">調試信息：</div>
                      <div>範本欄位數量: {template.fields?.length || 0}</div>
                      <div>自訂欄位數量: {Object.keys(viewingActivity.custom_fields || {}).length}</div>
                      <div>自訂欄位鍵名: {Object.keys(viewingActivity.custom_fields || {}).join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 最後更新時間 */}
            <div className="md:col-span-2 text-xs text-right text-gray-500 pt-4 border-t border-gray-200">
              最後更新：{dayjs(viewingActivity.updated_at || viewingActivity.created_at).format('YYYY-MM-DD HH:mm')}
            </div>
          </div>
        </HanamiCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題和操作按鈕 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">教學活動管理</h1>
        <div className="flex gap-3 items-center">
          {/* 每頁顯示數量選擇 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">每頁顯示</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">個活動</span>
          </div>
          <HanamiButton className="bg-gradient-to-r from-blue-500 to-blue-600" onClick={() => setShowTemplateSelector(true)}><PlusIcon className="h-5 w-5 mr-2" />新增活動</HanamiButton>
          <HanamiButton variant="secondary" onClick={() => setShowTemplateManagement(true)}><Cog6ToothIcon className="h-5 w-5 mr-2" />管理範本</HanamiButton>
          <HanamiButton className="bg-gradient-to-r from-green-500 to-green-600" variant="cute" onClick={insertTestData}><DocumentDuplicateIcon className="h-5 w-5 mr-2" />插入測試資料</HanamiButton>
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <HanamiCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <HanamiInput
              className="pl-10"
              placeholder="搜尋活動..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* 活動類型多選篩選 */}
          <div className="relative">
            <div
              className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => handlePopupOpen('types')}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {filterTypes.length === 0 ? (
                  <span className="text-gray-500">活動類型</span>
                ) : (
                  filterTypes.map((type, index) => (
                    <span
                      key={`${type}-${index}`}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {activityTypeOptions.find(opt => opt.value === type)?.label || type}
                    </span>
                  ))
                )}
              </div>
              <FunnelIcon className="h-4 w-4 text-gray-400 ml-2" />
            </div>
          </div>
          
          {/* 狀態多選篩選 */}
          <div className="relative">
            <div
              className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => handlePopupOpen('statuses')}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {filterStatuses.length === 0 ? (
                  <span className="text-gray-500">狀態</span>
                ) : (
                  filterStatuses.map((status, index) => (
                    <span
                      key={`${status}-${index}`}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {statusOptions.find(opt => opt.value === status)?.label || status}
                    </span>
                  ))
                )}
              </div>
              <FunnelIcon className="h-4 w-4 text-gray-400 ml-2" />
            </div>
          </div>
          
          {/* 標籤多選篩選 */}
          <div className="relative">
            <div
              className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => handlePopupOpen('tags')}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {filterTags.length === 0 ? (
                  <span className="text-gray-500">標籤</span>
                ) : (
                  filterTags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                )}
              </div>
              <FunnelIcon className="h-4 w-4 text-gray-400 ml-2" />
            </div>
          </div>
          
          {/* 排序選擇 */}
          <div className="relative">
            <div
              className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              onClick={handleSortPopupOpen}
            >
              <span className="text-gray-700">
                {sortOptions.find(opt => opt.value === filterSort)?.label || '排序'}
              </span>
              <FunnelIcon className="h-4 w-4 text-gray-400 ml-2" />
            </div>
          </div>
        </div>
        
        {/* 清除篩選按鈕 */}
        <div className="mt-4 flex justify-end">
          <HanamiButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearchQuery('');
              setFilterTypes([]);
              setFilterStatuses([]);
              setFilterTags([]);
              setFilterSort('last_updated');
            }}
          >
            清除篩選
          </HanamiButton>
        </div>
      </HanamiCard>

      {/* 活動列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <HanamiCard className="p-12 text-center">
          <div className="text-gray-500">
            <FunnelIcon className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">沒有找到活動</p>
            <p className="text-sm">嘗試調整搜尋條件或新增新活動</p>
          </div>
        </HanamiCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedActivities.map(renderActivityCard)}
          </div>
          {/* 分頁按鈕 */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button className="px-3 py-1 rounded border bg-white disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>上一頁</button>
            <span className="text-sm text-gray-700">第 {currentPage} / {totalPages} 頁</span>
            <button className="px-3 py-1 rounded border bg-white disabled:opacity-50" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>下一頁</button>
          </div>
        </>
      )}

      {/* 篩選彈窗 */}
      {showPopup.open && (
        <PopupSelect
          mode="multi"
          options={
            showPopup.field === 'types' ? activityTypeOptions :
              showPopup.field === 'statuses' ? statusOptions :
                showPopup.field === 'tags' ? tagOptions : []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'types' ? '選擇活動類型' :
              showPopup.field === 'statuses' ? '選擇狀態' :
                showPopup.field === 'tags' ? '選擇標籤' : '選擇'
          }
          onCancel={handlePopupCancel}
          onChange={setPopupSelected}
          onConfirm={handlePopupConfirm}
        />
      )}

      {/* 排序彈窗 */}
      {showPopupSort.open && (
        <PopupSelect
          mode="single"
          options={sortOptions}
          selected={popupSelectedSort}
          title="選擇排序方式"
          onCancel={handleSortPopupCancel}
          onChange={setPopupSelectedSort}
          onConfirm={handleSortPopupConfirm}
        />
      )}
    </div>
  );
} 
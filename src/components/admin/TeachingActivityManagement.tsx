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
  title: string;
  description: string;
  activity_type: string;
  difficulty_level: number;
  duration: number;
  materials: string[];
  objectives: string[];
  instructions: string;
  notes: string;
  created_at: string;
  updated_at: string;
  template_id?: string;
  custom_fields?: any;
  status?: string;
  tags?: string[];
  category?: string;
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
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()),
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
        const aTime = new Date(a.updated_at || a.created_at).getTime();
        const bTime = new Date(b.updated_at || b.created_at).getTime();
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
      // 準備提交資料，確保欄位名稱正確且不包含 estimated_duration
      const newActivity = {
        title: formData.activity_name || formData.title,
        description: formData.activity_description || formData.description,
        activity_type: formData.activity_types?.[0] || formData.activity_type,
        difficulty_level: formData.difficulty_level,
        duration: formData.duration || formData.estimated_duration || 0,
        materials: formData.materials_needed || formData.materials || [],
        objectives: formData.objectives || [],
        instructions: formData.instructions,
        notes: formData.notes,
        template_id: selectedTemplate?.id,
        custom_fields: formData.custom_fields || formData,
        status: formData.statuses?.[0] || formData.status || 'draft',
        tags: formData.tags || [],
        category: formData.categories?.[0] || formData.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // 準備提交資料，包含 estimated_duration
      const cleanActivity = {
        title: newActivity.title,
        description: newActivity.description,
        activity_type: newActivity.activity_type,
        difficulty_level: newActivity.difficulty_level,
        duration: newActivity.duration,
        estimated_duration: newActivity.duration, // 同時設置 estimated_duration
        materials: newActivity.materials,
        objectives: newActivity.objectives,
        instructions: newActivity.instructions,
        notes: newActivity.notes,
        template_id: newActivity.template_id,
        custom_fields: newActivity.custom_fields,
        status: newActivity.status,
        tags: newActivity.tags,
        category: newActivity.category,
        created_at: newActivity.created_at,
        updated_at: newActivity.updated_at,
      };
      console.log('準備提交的資料:', cleanActivity);
      // 調用 API
      const response = await fetch('/api/teaching-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanActivity),
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
        title: `${activity.title} (複製)`,
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
      
      // 首先確保有標準教案範本
      const standardTemplate = templates.find(t => 
        t.template_name === '標準教案範本' || t.name === '標準教案範本',
      );
      
      if (!standardTemplate) {
        toast.error('找不到標準教案範本，請先確保範本已載入');
        return;
      }

      // 準備測試活動資料
      const testActivity = {
        title: '測試音樂活動',
        description: '這是一個測試用的音樂教學活動，用於驗證系統功能。',
        activity_type: 'game',
        difficulty_level: 1,
        duration: 30,
        materials: ['樂器', '節奏棒', '音樂播放器'],
        objectives: ['培養節奏感', '提升音樂欣賞能力', '增進團體合作'],
        instructions: '1. 播放音樂\n2. 學生跟隨節奏拍手\n3. 分組進行節奏遊戲\n4. 總結活動心得',
        notes: '適合 3-6 歲兒童，注意音量控制',
        template_id: standardTemplate.id,
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
        status: 'published',
        tags: ['節奏訓練', '團體活動', '初學者'],
        category: '遊戲活動',
      };

      console.log('準備插入的測試資料:', testActivity);

      // 調用 API 創建活動
      const response = await fetch('/api/teaching-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testActivity),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('測試資料插入成功:', result);
        toast.success('測試資料插入成功！');
        loadActivities(); // 重新載入活動列表
      } else {
        const errorData = await response.json();
        console.error('API 錯誤:', errorData);
        throw new Error(`API 錯誤: ${response.status}`);
      }
    } catch (error) {
      console.error('插入測試資料失敗:', error);
      toast.error('插入測試資料失敗');
    }
  };

  // 活動卡片
  const renderActivityCard = (activity: TeachingActivity) => {
    // Debug: 檢查 activity 資料
    console.log(`渲染活動卡片: ${activity.title}`);
    console.log('activity.id:', activity.id, 'updated_at:', activity.updated_at, 'created_at:', activity.created_at, 'dayjs(updated_at):', dayjs(activity.updated_at).isValid(), 'dayjs(created_at):', dayjs(activity.created_at).isValid());
    
    const lastUpdated = dayjs(activity.updated_at || activity.created_at).format('YYYY-MM-DD HH:mm');
    console.log('最後更新時間:', lastUpdated);
    
    return (
      <HanamiCard key={activity.id} className="p-4 hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{activity.description}</p>
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
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">{activity.duration} 分鐘</span>
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
          <h3 className="text-xl font-semibold mb-4">{viewingActivity.title}</h3>
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
              <p className="text-gray-600">{viewingActivity.duration} 分鐘</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">描述</h4>
              <p className="text-gray-600">{viewingActivity.description}</p>
            </div>
            {viewingActivity.materials && viewingActivity.materials.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">所需材料</h4>
                <ul className="list-disc list-inside text-gray-600">
                  {viewingActivity.materials.map((material, index) => (
                    <li key={index}>{material}</li>
                  ))}
                </ul>
              </div>
            )}
            {viewingActivity.objectives && viewingActivity.objectives.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">學習目標</h4>
                <ul className="list-disc list-inside text-gray-600">
                  {viewingActivity.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
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
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">使用範本：</span>
                    <span className="text-sm text-gray-600 ml-2">{template.name || template.template_name}</span>
                  </div>
                  <div className="space-y-3">
                    {template.fields && template.fields.map((field) => {
                      const fieldValue = viewingActivity.custom_fields[field.title || field.id];
                      if (!fieldValue) return null;
                      
                      return (
                        <div key={field.id} className="border-b border-gray-200 pb-2 last:border-b-0">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {field.title || field.id}:
                          </div>
                          <div className="text-sm text-gray-600">
                            {Array.isArray(fieldValue) ? (
                              <ul className="list-disc list-inside">
                                {fieldValue.map((item: string, index: number) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <span>{String(fieldValue)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  filterTypes.map((type) => (
                    <span
                      key={type}
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
                  filterStatuses.map((status) => (
                    <span
                      key={status}
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
                  filterTags.map((tag) => (
                    <span
                      key={tag}
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
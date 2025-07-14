'use client';

import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { HanamiCard, HanamiButton, HanamiInput, HanamiSelect } from '@/components/ui';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { TeachingActivity } from '@/types/progress';


interface Template {
  id: string;
  template_name: string;
  template_category: string;
  template_description: string | null;
  template_schema: any;
}

interface Category {
  id: string;
  category_name: string;
  category_description: string | null;
}

interface Tag {
  id: string;
  tag_name: string;
  tag_color: string;
}

interface ActivityFilters {
  template_id?: string[];
  categories?: string[];
  tags?: string[];
  activity_types?: string[];
  statuses?: string[];
  difficulty_level?: number;
  search?: string;
}

export default function ResourceActivitiesPage() {
  // 狀態管理
  const [activities, setActivities] = useState<TeachingActivity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 模態框狀態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<TeachingActivity | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // 彈出選擇狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);

  // 載入資料
  useEffect(() => {
    loadInitialData();
  }, []);

  // 載入初始資料
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActivities(),
        loadTemplates(),
        loadCategories(),
        loadTags(),
        loadActivityTypes(),
        loadStatuses(),
      ]);
    } catch (error) {
      console.error('載入資料失敗:', error);
      toast.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入教學活動
  const loadActivities = async () => {
    try {
      let query = supabase
        .from('hanami_teaching_activities')
        .select(`
          *,
          hanami_resource_templates!inner(template_name, template_category)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // 應用篩選器
      if (filters.template_id && filters.template_id.length > 0) {
        query = query.in('template_id', filters.template_id);
      }
      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }
      if (filters.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }
      if (filters.search) {
        query = query.or(`activity_name.ilike.%${filters.search}%,activity_description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 處理資料
      const processedActivities = (data || []).map((activity: any) => ({
        ...activity,
        estimated_duration: activity.estimated_duration ?? activity.duration_minutes ?? 0,
        activity_description: activity.activity_description ?? '',
        materials_needed: activity.materials_needed ?? [],
        tags: activity.tags ?? [],
        custom_fields: activity.custom_fields ?? {},
        status: activity.status ?? 'draft',
      }));

      setActivities(processedActivities);
    } catch (error) {
      console.error('載入教學活動失敗:', error);
      toast.error('載入教學活動失敗');
    }
  };

  // 載入範本
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_resource_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(
        (data || []).map((item: any) => ({
          id: item.id,
          template_name: item.template_name,
          template_category: item.template_category || '',
          template_description: item.template_description,
          template_schema: item.template_schema,
        }))
      );
    } catch (error) {
      console.error('載入範本失敗:', error);
    }
  };

  // 載入分類
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_resource_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('載入分類失敗:', error);
    }
  };

  // 載入標籤
  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_resource_tags')
        .select('*')
        .eq('is_active', true)
        .order('tag_name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('載入標籤失敗:', error);
    }
  };

  // 載入活動類型
  const loadActivityTypes = async () => {
    try {
      // 載入自訂活動類型
      const { data: customData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .order('sort_order');

      const defaultTypes = [
        { id: 'game', name: '遊戲活動' },
        { id: 'training', name: '訓練活動' },
        { id: 'exercise', name: '練習活動' },
        { id: 'storybook', name: '繪本活動' },
        { id: 'performance', name: '表演活動' },
      ];

      const customTypes = customData?.map(item => ({
        id: item.option_value,
        name: item.option_name,
      })) || [];

      setActivityTypes([...defaultTypes, ...customTypes]);
    } catch (error) {
      console.error('載入活動類型失敗:', error);
    }
  };

  // 載入狀態
  const loadStatuses = async () => {
    try {
      // 載入自訂狀態
      const { data: customData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'status')
        .eq('is_active', true)
        .order('sort_order');

      const defaultStatuses = [
        { id: 'draft', name: '草稿' },
        { id: 'published', name: '已發布' },
        { id: 'archived', name: '已封存' },
      ];

      const customStatuses = customData?.map(item => ({
        id: item.option_value,
        name: item.option_name,
      })) || [];

      setStatuses([...defaultStatuses, ...customStatuses]);
    } catch (error) {
      console.error('載入狀態失敗:', error);
    }
  };

  // 篩選活動
  const filteredActivities = activities.filter(activity => {
    // 搜尋篩選
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = activity.activity_name?.toLowerCase().includes(searchLower);
      const descMatch = activity.activity_description?.toLowerCase().includes(searchLower);
      if (!nameMatch && !descMatch) return false;
    }

    // 標籤篩選
    if (filters.tags && filters.tags.length > 0) {
      const activityTags = activity.tags || [];
      const hasMatchingTag = filters.tags.some(tag => activityTags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    // 分類篩選
    if (filters.categories && filters.categories.length > 0) {
      const activityCategory = activity.category;
      if (!activityCategory || !filters.categories.includes(activityCategory)) return false;
    }

    // 活動類型篩選
    if (filters.activity_types && filters.activity_types.length > 0) {
      const activityType = activity.activity_type;
      if (!activityType || !filters.activity_types.includes(activityType)) return false;
    }

    // 狀態篩選
    if (filters.statuses && filters.statuses.length > 0) {
      const activityStatus = activity.status || 'draft';
      if (!filters.statuses.includes(activityStatus)) return false;
    }

    return true;
  });

  // 處理篩選器變更
  const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 彈出選擇相關函數
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    setPopupSelected(() => {
      const value = filters[field as keyof ActivityFilters];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      return [];
    });
  };

  const handlePopupConfirm = () => {
    if (['activity_types', 'categories', 'statuses', 'tags'].includes(showPopup.field)) {
      handleFilterChange(showPopup.field as keyof ActivityFilters, Array.isArray(popupSelected) ? popupSelected : []);
    }
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    setPopupSelected(() => {
      const value = filters[showPopup.field as keyof ActivityFilters];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      return [];
    });
    setShowPopup({ field: '', open: false });
  };

  // 清除篩選器
  const clearFilters = () => {
    setFilters({});
  };

  // 應用篩選器
  const applyFilters = () => {
    loadActivities();
  };

  // 選擇活動
  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId],
    );
  };

  // 批量操作
  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedActivities.length === 0) {
      toast.error('請選擇要操作的活動');
      return;
    }

    if (action === 'delete' && !confirm('確定要刪除選中的活動嗎？')) {
      return;
    }

    try {
      let updates: any = {};
      
      switch (action) {
        case 'publish':
          updates = { status: 'published' };
          break;
        case 'archive':
          updates = { status: 'archived' };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('hanami_teaching_activities')
            .delete()
            .in('id', selectedActivities);
          
          if (deleteError) throw deleteError;
          toast.success('成功刪除選中的活動');
          break;
      }

      if (action !== 'delete') {
        const { error } = await supabase
          .from('hanami_teaching_activities')
          .update(updates)
          .in('id', selectedActivities);
        
        if (error) throw error;
        toast.success(`成功${action === 'publish' ? '發布' : '封存'}選中的活動`);
      }

      setSelectedActivities([]);
      await loadActivities();
    } catch (error) {
      console.error('批量操作失敗:', error);
      toast.error('批量操作失敗');
    }
  };

  // 複製活動
  const handleDuplicateActivity = async (activity: TeachingActivity) => {
    try {
      const { id, created_at, updated_at, ...activityData } = activity;
      const newActivity = {
        title: `${activity.activity_name} (複製)`,
        description: activity.activity_description || '',
        activity_type: activity.activity_type,
        difficulty_level: activity.difficulty_level,
        duration: activity.estimated_duration,
        materials: activity.materials_needed || [],
        objectives: [], // 若有對應欄位請補上
        instructions: activity.instructions || '',
        notes: '', // 若有對應欄位請補上
        template_id: activity.template_id || null,
        custom_fields: activity.custom_fields || {},
        tags: activity.tags || [],
        category: activity.category || '',
        status: 'draft',
      };

      const { error } = await supabase
        .from('hanami_teaching_activities')
        .insert([newActivity]);

      if (error) throw error;
      
      toast.success('成功複製活動');
      await loadActivities();
    } catch (error) {
      console.error('複製活動失敗:', error);
      toast.error('複製活動失敗');
    }
  };

  // 刪除活動
  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('確定要刪除此活動嗎？')) return;

    try {
      const { error } = await supabase
        .from('hanami_teaching_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      
      toast.success('成功刪除活動');
      await loadActivities();
    } catch (error) {
      console.error('刪除活動失敗:', error);
      toast.error('刪除活動失敗');
    }
  };

  // 渲染活動卡片
  const renderActivityCard = (activity: TeachingActivity) => {
    const isSelected = selectedActivities.includes(activity.id);
    const template = templates.find(t => t.id === activity.template_id);

    return (
      <HanamiCard 
        key={activity.id} 
        className={`p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${
          isSelected ? 'ring-2 ring-hanami-primary bg-hanami-primary/5' : ''
        }`}
        onClick={() => toggleActivitySelection(activity.id)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-hanami-text">
                {activity.activity_name}
              </h3>
              {activity.status === 'published' && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  已發布
                </span>
              )}
              {activity.status === 'archived' && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  已封存
                </span>
              )}
            </div>
            
            <p className="text-sm text-hanami-text-secondary mb-3 line-clamp-2">
              {activity.activity_description}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {template && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {template.template_name}
                </span>
              )}
              {activity.category && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                  {activity.category}
                </span>
              )}
              {activity.tags?.map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex space-x-1">
            <button
              className="p-2 rounded-full bg-hanami-primary hover:bg-hanami-accent transition-colors"
              title="查看詳情"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedActivity(activity);
                setShowViewModal(true);
              }}
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-full bg-hanami-secondary hover:bg-hanami-accent transition-colors"
              title="編輯"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedActivity(activity);
                setShowEditModal(true);
              }}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
              title="複製"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateActivity(activity);
              }}
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
              title="刪除"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteActivity(activity.id);
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-hanami-text-secondary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {activity.estimated_duration}分鐘
            </span>
            <span className="flex items-center gap-1">
              <StarIcon className="w-4 h-4" />
              難度 {activity.difficulty_level}
            </span>
          </div>
          <span className="text-xs">
            {new Date(activity.created_at).toLocaleDateString()}
          </span>
        </div>
      </HanamiCard>
    );
  };

  // 渲染活動列表
  const renderActivityList = (activity: TeachingActivity) => {
    const isSelected = selectedActivities.includes(activity.id);
    const template = templates.find(t => t.id === activity.template_id);

    return (
      <div 
        key={activity.id}
        className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
          isSelected ? 'ring-2 ring-hanami-primary bg-hanami-primary/5' : 'bg-white'
        }`}
        onClick={() => toggleActivitySelection(activity.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-hanami-text">
                  {activity.activity_name}
                </h3>
                {activity.status === 'published' && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    已發布
                  </span>
                )}
                {activity.status === 'archived' && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    已封存
                  </span>
                )}
              </div>
              
              <p className="text-sm text-hanami-text-secondary mb-2">
                {activity.activity_description}
              </p>

              <div className="flex items-center gap-4 text-sm text-hanami-text-secondary">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {activity.estimated_duration}分鐘
                </span>
                <span className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4" />
                  難度 {activity.difficulty_level}
                </span>
                {template && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {template.template_name}
                  </span>
                )}
                {activity.category && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                    {activity.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-hanami-text-secondary">
              {new Date(activity.created_at).toLocaleDateString()}
            </span>
            
            <div className="flex space-x-1">
              <button
                className="p-2 rounded-full bg-hanami-primary hover:bg-hanami-accent transition-colors"
                title="查看詳情"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedActivity(activity);
                  setShowViewModal(true);
                }}
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-full bg-hanami-secondary hover:bg-hanami-accent transition-colors"
                title="編輯"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedActivity(activity);
                  setShowEditModal(true);
                }}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
                title="複製"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicateActivity(activity);
                }}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                title="刪除"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteActivity(activity.id);
                }}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hanami-text mb-2">
              教學活動管理
            </h1>
            <p className="text-hanami-text-secondary">
              管理教學遊戲、訓練和練習活動，支援多種範本和動態表單
            </p>
          </div>
          
          <div className="flex gap-3">
            <HanamiButton
              className="bg-gradient-to-r from-hanami-primary to-hanami-accent hover:from-hanami-accent hover:to-hanami-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增活動
            </HanamiButton>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <HanamiCard className="p-6 text-center">
            <div className="text-2xl font-bold text-hanami-text mb-2">
              {activities.length}
            </div>
            <div className="text-sm text-hanami-text-secondary">總活動數</div>
          </HanamiCard>
          
          <HanamiCard className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {activities.filter(a => a.status === 'published').length}
            </div>
            <div className="text-sm text-hanami-text-secondary">已發布</div>
          </HanamiCard>
          
          <HanamiCard className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {templates.length}
            </div>
            <div className="text-sm text-hanami-text-secondary">可用範本</div>
          </HanamiCard>
          
          <HanamiCard className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {categories.length}
            </div>
            <div className="text-sm text-hanami-text-secondary">活動分類</div>
          </HanamiCard>
        </div>

        {/* 工具列 */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-hanami-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 搜尋和篩選 */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <HanamiInput
                  className="pl-10"
                  placeholder="搜尋活動名稱或描述..."
                  value={filters.search || ''}
                  onChange={(value) => handleFilterChange('search', value)}
                />
              </div>
              
              {/* 活動類型多選篩選 */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
                  type="button"
                  onClick={() => handlePopupOpen('activity_types')}
                >
                  <FunnelIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">活動類型</span>
                  {filters.activity_types && filters.activity_types.length > 0 && (
                    <span className="ml-auto bg-hanami-primary text-white text-xs rounded-full px-2 py-1">
                      {filters.activity_types.length}
                    </span>
                  )}
                </button>
              </div>

              {/* 分類多選篩選 */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[120px]"
                  type="button"
                  onClick={() => handlePopupOpen('categories')}
                >
                  <FunnelIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">分類</span>
                  {filters.categories && filters.categories.length > 0 && (
                    <span className="ml-auto bg-hanami-secondary text-white text-xs rounded-full px-2 py-1">
                      {filters.categories.length}
                    </span>
                  )}
                </button>
              </div>

              {/* 狀態多選篩選 */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                  type="button"
                  onClick={() => handlePopupOpen('statuses')}
                >
                  <FunnelIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">狀態</span>
                  {filters.statuses && filters.statuses.length > 0 && (
                    <span className="ml-auto bg-hanami-accent text-white text-xs rounded-full px-2 py-1">
                      {filters.statuses.length}
                    </span>
                  )}
                </button>
              </div>

              {/* 標籤多選篩選 */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                  type="button"
                  onClick={() => handlePopupOpen('tags')}
                >
                  <FunnelIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">標籤</span>
                  {filters.tags && filters.tags.length > 0 && (
                    <span className="ml-auto bg-hanami-success text-white text-xs rounded-full px-2 py-1">
                      {filters.tags.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 視圖模式和排序 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-hanami-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-hanami-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" fillRule="evenodd" />
                  </svg>
                </button>
              </div>

              <HanamiSelect
                className="w-40"
                options={[
                  { value: 'created_at', label: '創建時間' },
                  { value: 'activity_name', label: '活動名稱' },
                  { value: 'difficulty_level', label: '難度等級' },
                  { value: 'estimated_duration', label: '時長' },
                ]}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              />

              <button
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>
            </div>
          </div>

          {/* 已選擇的篩選條件顯示 */}
          {(Boolean(filters.activity_types && filters.activity_types.length > 0) ||
            Boolean(filters.categories && filters.categories.length > 0) ||
            Boolean(filters.statuses && filters.statuses.length > 0) ||
            Boolean(filters.tags && filters.tags.length > 0)) && (
            <div className="mt-4 pt-4 border-t border-hanami-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-hanami-text">已選擇的篩選條件：</span>
                <button
                  className="text-sm text-hanami-text-secondary hover:text-hanami-text underline"
                  onClick={clearFilters}
                >
                  清除全部
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* 活動類型標籤 */}
                {filters.activity_types?.map(typeId => {
                  const type = activityTypes.find(t => t.id === typeId);
                  return type ? (
                    <span key={typeId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                      {type.name}
                      <button
                        className="ml-2 text-hanami-primary hover:text-hanami-accent"
                        onClick={() => handleFilterChange('activity_types', filters.activity_types?.filter(id => id !== typeId) || [])}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}

                {/* 分類標籤 */}
                {filters.categories?.map(categoryName => {
                  const category = categories.find(c => c.category_name === categoryName);
                  return category ? (
                    <span key={categoryName} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-secondary/20 text-hanami-text border border-hanami-secondary/30">
                      {category.category_name}
                      <button
                        className="ml-2 text-hanami-secondary hover:text-hanami-accent"
                        onClick={() => handleFilterChange('categories', filters.categories?.filter(name => name !== categoryName) || [])}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}

                {/* 狀態標籤 */}
                {filters.statuses?.map(statusId => {
                  const status = statuses.find(s => s.id === statusId);
                  return status ? (
                    <span key={statusId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-accent/20 text-hanami-text border border-hanami-accent/30">
                      {status.name}
                      <button
                        className="ml-2 text-hanami-accent hover:text-hanami-primary"
                        onClick={() => handleFilterChange('statuses', filters.statuses?.filter(id => id !== statusId) || [])}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}

                {/* 標籤 */}
                {filters.tags?.map(tagName => {
                  const tag = tags.find(t => t.tag_name === tagName);
                  return tag ? (
                    <span key={tagName} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-success/20 text-hanami-text border border-hanami-success/30">
                      {tag.tag_name}
                      <button
                        className="ml-2 text-hanami-success hover:text-hanami-accent"
                        onClick={() => handleFilterChange('tags', filters.tags?.filter(name => name !== tagName) || [])}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* 批量操作工具列 */}
        {selectedActivities.length > 0 && (
          <div className="bg-hanami-primary/10 rounded-xl p-4 mb-6 border border-hanami-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-hanami-text">
                  已選擇 {selectedActivities.length} 個活動
                </span>
                <button
                  className="text-sm text-hanami-text-secondary hover:text-hanami-text"
                  onClick={() => setSelectedActivities([])}
                >
                  取消選擇
                </button>
              </div>
              
              <div className="flex gap-2">
                <HanamiButton
                  size="sm"
                  variant="success"
                  onClick={() => handleBulkAction('publish')}
                >
                  批量發布
                </HanamiButton>
                <HanamiButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBulkAction('archive')}
                >
                  批量封存
                </HanamiButton>
                <HanamiButton
                  size="sm"
                  variant="danger"
                  onClick={() => handleBulkAction('delete')}
                >
                  批量刪除
                </HanamiButton>
              </div>
            </div>
          </div>
        )}

        {/* 活動列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <HanamiCard className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-hanami-text mb-2">
              沒有找到活動
            </h3>
            <p className="text-hanami-text-secondary mb-6">
              嘗試調整篩選條件或創建新的教學活動
            </p>
            <HanamiButton
              className="bg-hanami-primary hover:bg-hanami-accent"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              創建第一個活動
            </HanamiButton>
          </HanamiCard>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredActivities.map(activity => 
              viewMode === 'grid' ? renderActivityCard(activity) : renderActivityList(activity),
            )}
          </div>
        )}
      </div>

      {/* 彈出選擇組件 */}
      {showPopup.open && (
        <PopupSelect
          mode="multi"
          options={
            showPopup.field === 'activity_types' ? [
              ...activityTypes.map(t => ({ value: t.id, label: t.name })),
            ] :
              showPopup.field === 'categories' ? [
                ...categories.map(c => ({ value: c.category_name, label: c.category_name })),
              ] :
                showPopup.field === 'statuses' ? [
                  ...statuses.map(s => ({ value: s.id, label: s.name })),
                ] :
                  showPopup.field === 'tags' ? [
                    ...tags.map(t => ({ value: t.tag_name, label: t.tag_name })),
                  ] : []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'activity_types' ? '選擇活動類型' :
              showPopup.field === 'categories' ? '選擇分類' :
                showPopup.field === 'statuses' ? '選擇狀態' :
                  showPopup.field === 'tags' ? '選擇標籤' :
                    '選擇選項'
          }
          onCancel={handlePopupCancel}
          onChange={(value: string | string[]) => setPopupSelected(value)}
          onConfirm={handlePopupConfirm}
        />
      )}

      {/* 模態框將在後續組件中實現 */}
      {/* TODO: 實現 CreateActivityModal, EditActivityModal, ViewActivityModal */}
    </div>
  );
} 
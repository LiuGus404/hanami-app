'use client';

import { 
  ClockIcon, 
  EyeIcon, 
  PencilIcon, 
  PlusIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  StarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users, Database, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

import ActivityDetailModal from '@/components/admin/ActivityDetailModal';
import ActivityForm from '@/components/admin/ActivityForm';
import { HanamiCard, HanamiButton, HanamiInput, HanamiSelect } from '@/components/ui';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { TeachingActivity } from '@/types/progress';

export default function TeachingActivitiesPage() {
  // 基本狀態
  const [activities, setActivities] = useState<TeachingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('activity_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 模態框狀態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<TeachingActivity | null>(null);
  const [editingActivity, setEditingActivity] = useState<TeachingActivity | null>(null);

  // Notion 相關狀態
  const [notionData, setNotionData] = useState<any[]>([]);
  const [notionLoading, setNotionLoading] = useState(false);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [showDatabaseSelect, setShowDatabaseSelect] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [nextCursor, setNextCursor] = useState<string>('');
  const [getPageContent, setGetPageContent] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [autoLoadAll, setAutoLoadAll] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [filteredNotionData, setFilteredNotionData] = useState<any[]>([]);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [loadComplete, setLoadComplete] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  
  // 使用 useRef 來避免閉包問題
  const autoLoadingRef = useRef(false);
  const nextCursorRef = useRef('');

  // 篩選狀態
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSort, setFilterSort] = useState<string>('created_at');
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);
  const [showPopupSort, setShowPopupSort] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelectedSort, setPopupSelectedSort] = useState<string | string[]>([]);

  // 篩選 master list 狀態
  const [activityTypeOptions, setActivityTypeOptions] = useState<{ value: string, label: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ value: string, label: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ value: string, label: string }[]>([]);
  // 排序欄位
  const sortOptions = [
    { value: 'created_at', label: '建立時間' },
    { value: 'activity_type', label: '活動類型' },
    { value: 'status', label: '狀態' },
    { value: 'tags', label: '標籤' },
    { value: 'estimated_duration', label: '時長' },
  ];

  const NOTION_TOKEN = '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';

  useEffect(() => {
    loadActivities();
  }, []);

  // 載入 master list
  useEffect(() => {
    const loadMasterOptions = async () => {
      try {
        // 活動類型 - 包含預設和自訂選項
        const { data: typeData } = await supabase
          .from('hanami_custom_options')
          .select('*')
          .eq('option_type', 'activity_type')
          .eq('is_active', true)
          .order('sort_order');

        const defaultTypes = [
          { value: 'game', label: '遊戲活動' },
          { value: 'training', label: '訓練活動' },
          { value: 'exercise', label: '練習活動' },
          { value: 'storybook', label: '繪本活動' },
          { value: 'performance', label: '表演活動' },
        ];
        const customTypes = (typeData || []).map((item: any) => ({ 
          value: item.option_value, 
          label: item.option_name, 
        }));
        setActivityTypeOptions([...defaultTypes, ...customTypes]);

        // 狀態 - 包含預設和自訂選項
        const { data: statusData } = await supabase
          .from('hanami_custom_options')
          .select('*')
          .eq('option_type', 'status')
          .eq('is_active', true)
          .order('sort_order');

        const defaultStatuses = [
          { value: 'draft', label: '草稿' },
          { value: 'published', label: '已發布' },
          { value: 'archived', label: '已封存' },
        ];
        const customStatuses = (statusData || []).map((item: any) => ({ 
          value: item.option_value, 
          label: item.option_name, 
        }));
        setStatusOptions([...defaultStatuses, ...customStatuses]);

        // 標籤
        const { data: tagData } = await supabase
          .from('hanami_resource_tags')
          .select('*')
          .eq('is_active', true)
          .order('tag_name');
        setTagOptions(
          (tagData || []).map((item: any) => ({ value: item.tag_name, label: item.tag_name })),
        );
      } catch (error) {
        console.error('載入篩選選項失敗:', error);
      }
    };
    loadMasterOptions();
  }, []);

  // 搜尋功能
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotionData(notionData);
    } else {
      const filtered = notionData.filter((item) => {
        const properties = item.properties || {};
        
        // 搜尋標題
        const title = properties['名稱']?.title?.[0]?.plain_text || 
                      properties.Name?.title?.[0]?.plain_text || 
                      properties.Title?.title?.[0]?.plain_text || 
                      properties['活動名稱']?.title?.[0]?.plain_text || '';
        
        // 搜尋 ID
        const id = properties['ID']?.unique_id?.number?.toString() || '';
        
        // 搜尋其他文字欄位
        const notes = properties['備註']?.rich_text?.map((text: any) => text.plain_text).join(' ') || '';
        const tags = properties['Tags']?.multi_select?.map((tag: any) => tag.name).join(' ') || '';
        
        const searchLower = searchTerm.toLowerCase();
        return title.toLowerCase().includes(searchLower) ||
               id.includes(searchLower) ||
               notes.toLowerCase().includes(searchLower) ||
               tags.toLowerCase().includes(searchLower);
      });
      setFilteredNotionData(filtered);
    }
  }, [notionData, searchTerm]);

  // 載入教學活動
  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .order('activity_name');

      if (error) throw error;
      
      // 欄位轉換與 null 處理
      const fixedActivities = (data || []).map((a: any) => ({
        ...a,
        estimated_duration: a.estimated_duration ?? a.duration_minutes ?? 0,
        activity_description: a.activity_description ?? undefined,
        materials_needed: a.materials_needed ?? [],
        instructions: a.instructions ?? undefined,
      }));
      setActivities(fixedActivities);
    } catch (error) {
      console.error('載入教學活動失敗:', error);
      toast.error('載入教學活動失敗');
    } finally {
      setLoading(false);
    }
  };

  // 篩選和排序活動
  const getFilteredAndSortedActivities = () => {
    const filtered = activities.filter(activity => {
      const matchesSearch = !searchTerm || 
        activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.activity_description?.toLowerCase().includes(searchTerm.toLowerCase());
      // 多選活動類型
      const matchesType = filterTypes.length === 0 || filterTypes.includes(activity.activity_type);
      // 多選狀態
      const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(activity.status ?? '');
      // 多選標籤
      const matchesTags = filterTags.length === 0 || (activity.tags || []).some(tag => filterTags.includes(tag));
      return matchesSearch && matchesType && matchesStatus && matchesTags;
    });
    // 單選排序
    filtered.sort((a, b) => {
      let aValue = a[filterSort as keyof TeachingActivity];
      let bValue = b[filterSort as keyof TeachingActivity];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  };

  // 新增活動
  const handleAddActivity = async (activityData: Partial<TeachingActivity>) => {
    try {
      const response = await fetch('/api/teaching-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '新增失敗');
      }

      await loadActivities();
      setShowAddModal(false);
      toast.success('活動新增成功！');
    } catch (error) {
      console.error('新增教學活動失敗:', error);
      toast.error('新增教學活動失敗');
    }
  };

  // 更新活動
  const handleUpdateActivity = async (activityData: Partial<TeachingActivity>) => {
    if (!editingActivity) return;
    
    try {
      const response = await fetch(`/api/teaching-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失敗');
      }

      await loadActivities();
      setEditingActivity(null);
      setShowAddModal(false);
      toast.success('活動更新成功！');
    } catch (error) {
      console.error('更新教學活動失敗:', error);
      toast.error('更新教學活動失敗');
    }
  };

  // 刪除活動
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('確定要刪除此教學活動嗎？此操作無法復原。')) return;

    try {
      const { error } = await supabase
        .from('hanami_teaching_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadActivities();
      setShowDetailModal(false);
      setSelectedActivity(null);
      toast.success('活動刪除成功！');
    } catch (error) {
      console.error('刪除教學活動失敗:', error);
      toast.error('刪除教學活動失敗');
    }
  };

  // 複製活動
  const handleDuplicateActivity = async (activity: TeachingActivity) => {
    try {
      const newActivityData = {
        activity_name: `${activity.activity_name} (複製)`,
        activity_description: activity.activity_description || '',
        activity_type: activity.activity_type,
        difficulty_level: activity.difficulty_level,
        estimated_duration: activity.estimated_duration,
        materials_needed: activity.materials_needed || [],
        instructions: activity.instructions || '',
        template_id: activity.template_id || null,
        custom_fields: activity.custom_fields || {},
        tags: activity.tags || [],
        category: activity.category || '',
        status: 'draft',
      };

      const { error } = await supabase
        .from('hanami_teaching_activities')
        .insert([newActivityData]);

      if (error) throw error;
      
      await loadActivities();
      toast.success('活動複製成功！');
    } catch (error) {
      console.error('複製教學活動失敗:', error);
      toast.error('複製教學活動失敗');
    }
  };

  // 查看活動詳情
  const handleViewActivity = (activity: TeachingActivity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  // 編輯活動
  const handleEditActivity = (activity: TeachingActivity) => {
    setEditingActivity(activity);
    setShowAddModal(true);
  };

  // Notion API 相關函數
  const fetchDatabases = async () => {
    setNotionLoading(true);
    try {
      const response = await fetch('/api/notion/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: NOTION_TOKEN,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }

      const data = await response.json();
      setDatabases(data.databases || []);
      setShowDatabaseSelect(true);
    } catch (error) {
      console.error('載入資料庫列表失敗:', error);
      toast.error('載入資料庫列表失敗，請檢查 API 設定');
    } finally {
      setNotionLoading(false);
    }
  };

  const fetchNotionData = async (databaseId?: string, loadMore = false) => {
    setNotionLoading(true);
    try {
      const dbId = databaseId || selectedDatabase;
      if (!dbId) {
        toast.error('請先選擇一個資料庫');
        return;
      }

      if (loadMore && !nextCursor) {
        console.log('沒有更多資料可載入');
        setHasMoreData(false);
        return;
      }

      if (loadMore && notionLoading) {
        console.log('正在載入中，請稍候...');
        return;
      }

      const response = await fetch('/api/notion/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: NOTION_TOKEN,
          databaseId: dbId,
          startCursor: loadMore ? nextCursor : undefined,
          getPageContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 錯誤: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (loadMore) {
        setNotionData(prev => {
          const newData = [...prev, ...data.results];
          return newData;
        });
        setTotalLoaded(prev => prev + data.results.length);
      } else {
        setNotionData(data.results || []);
        setTotalLoaded(data.results?.length || 0);
      }
      
      setHasMoreData(data.has_more || false);
      setNextCursor(data.next_cursor || '');
      
      if (!loadMore) {
        setShowNotionModal(true);
        setShowDatabaseSelect(false);
      }
      
    } catch (error) {
      console.error('載入 Notion 資料失敗:', error);
      toast.error(`載入 Notion 資料失敗: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoadingAll(false);
      setAutoLoadAll(false);
    } finally {
      setNotionLoading(false);
    }
  };

  // 自動載入所有資料
  const toggleAutoLoad = async () => {
    if (autoLoadingRef.current) {
      autoLoadingRef.current = false;
      setIsAutoLoading(false);
      setIsLoadingAll(false);
      setAutoLoadAll(false);
      console.log('已停止自動載入');
    } else {
      if (!selectedDatabase) {
        toast.error('請先選擇一個資料庫');
        return;
      }
      
      autoLoadingRef.current = true;
      setIsAutoLoading(true);
      setIsLoadingAll(true);
      setAutoLoadAll(true);
      setLoadComplete(false);
      setLoadSuccess(false);
      nextCursorRef.current = nextCursor;
      console.log('開始自動載入所有資料...');
      
      setTimeout(() => {
        autoLoadAllData();
      }, 100);
    }
  };

  const autoLoadAllData = async () => {
    if (!autoLoadingRef.current) {
      console.log('自動載入已停止');
      return;
    }
    
    try {
      const currentCursor = nextCursorRef.current;
      
      const response = await fetch('/api/notion/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: NOTION_TOKEN,
          databaseId: selectedDatabase,
          startCursor: currentCursor || undefined,
          getPageContent,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      
      setNotionData(prev => {
        const newData = [...prev, ...data.results];
        return newData;
      });
      
      setTotalLoaded(prev => prev + data.results.length);
      setHasMoreData(data.has_more || false);
      setNextCursor(data.next_cursor || '');
      nextCursorRef.current = data.next_cursor || '';
      
      if (data.has_more && data.next_cursor && autoLoadingRef.current) {
        setTimeout(() => {
          autoLoadAllData();
        }, 1000);
      } else {
        console.log('自動載入完成！');
        autoLoadingRef.current = false;
        setIsAutoLoading(false);
        setIsLoadingAll(false);
        setAutoLoadAll(false);
        setLoadComplete(true);
        setLoadSuccess(true);
        
        setTimeout(() => {
          toast.success(`載入完成！共載入 ${totalLoaded + data.results.length} 筆資料`);
        }, 500);
      }
      
    } catch (error) {
      console.error('自動載入失敗:', error);
      autoLoadingRef.current = false;
      setIsAutoLoading(false);
      setIsLoadingAll(false);
      setAutoLoadAll(false);
      setLoadComplete(true);
      setLoadSuccess(false);
      toast.error(`自動載入失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const renderNotionPage = (page: any) => {
    const properties = page.properties || {};
    
    const title = properties['名稱']?.title?.[0]?.plain_text || 
                  properties.Name?.title?.[0]?.plain_text || 
                  properties.Title?.title?.[0]?.plain_text || 
                  properties['活動名稱']?.title?.[0]?.plain_text ||
                  '無標題';
    
    const status = properties['狀態']?.status?.name || '';
    const tags = properties['Tags']?.multi_select?.map((tag: any) => tag.name).join(', ') || '';
    const category = properties['類別']?.multi_select?.map((cat: any) => cat.name).join(', ') || '';
    const importance = properties['重要性']?.select?.name || '';
    const duration = properties['所需時間 mins']?.number || '';
    const usageCount = properties['使用次數']?.number || '';
    const notes = properties['備註']?.rich_text?.map((text: any) => text.plain_text).join(' ') || '';
    const completed = properties['已完成教具']?.checkbox || false;
    const id = properties['ID']?.unique_id?.number || '';
    const url = properties['URL']?.url || '';
    const responsible = properties['負責人']?.people?.map((person: any) => person.name).join(', ') || '';

    return (
      <div key={page.id} className="border border-[#EADBC8] rounded-lg p-4 bg-[#FFFDF8] hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-[#2B3A3B] mb-1">{title}</h3>
            {id && (
              <p className="text-xs text-[#A68A64] mb-2">ID: HM{id}</p>
            )}
          </div>
          {completed && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              已完成
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {status && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              狀態: {status}
            </span>
          )}
          {category && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              類別: {category}
            </span>
          )}
          {tags && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              標籤: {tags}
            </span>
          )}
          {importance && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              重要性: {importance}
            </span>
          )}
          {duration && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              時長: {duration}分鐘
            </span>
          )}
          {usageCount && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              使用次數: {usageCount}
            </span>
          )}
        </div>

        {responsible && (
          <div className="mb-3">
            <p className="text-sm font-medium text-[#2B3A3B] mb-1">負責人:</p>
            <p className="text-sm text-[#A68A64]">{responsible}</p>
          </div>
        )}

        {notes && (
          <div className="mb-3">
            <p className="text-sm font-medium text-[#2B3A3B] mb-1">備註:</p>
            <p className="text-sm text-[#A68A64]">{notes}</p>
          </div>
        )}
        
        <div className="mt-3 text-xs text-[#A68A64]">
          頁面 ID: {page.id}
        </div>
      </div>
    );
  };

  const filteredActivities = getFilteredAndSortedActivities();

  // 彈窗選擇邏輯
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    if (field === 'activity_types') setPopupSelected(Array.isArray(filterTypes) ? filterTypes : []);
    if (field === 'statuses') setPopupSelected(Array.isArray(filterStatuses) ? filterStatuses : []);
    if (field === 'tags') setPopupSelected(Array.isArray(filterTags) ? filterTags : []);
    if (field === 'sort') setPopupSelected(typeof filterSort === 'string' ? filterSort : 'created_at');
  };
  const handlePopupConfirm = () => {
    if (showPopup.field === 'activity_types') setFilterTypes(Array.isArray(popupSelected) ? popupSelected : []);
    if (showPopup.field === 'statuses') setFilterStatuses(Array.isArray(popupSelected) ? popupSelected : []);
    if (showPopup.field === 'tags') setFilterTags(Array.isArray(popupSelected) ? popupSelected : []);
    if (showPopup.field === 'sort') setFilterSort(typeof popupSelected === 'string' ? popupSelected : popupSelected[0] || 'created_at');
    setShowPopup({ field: '', open: false });
  };
  const handlePopupCancel = () => {
    setShowPopup({ field: '', open: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-hanami-text">載入中...</div>
        </div>
      </div>
    );
  }

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
              管理教學遊戲、訓練和練習活動
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <HanamiButton
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                disabled={notionLoading}
                onClick={fetchDatabases}
              >
                <Database className="h-5 w-5 mr-2" />
                {notionLoading ? '載入中...' : '載入 Notion 資料'}
              </HanamiButton>
              
              {showDatabaseSelect && databases.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#EADBC8] z-50">
                  <div className="p-3 border-b border-[#EADBC8]">
                    <h3 className="font-semibold text-[#2B3A3B]">選擇資料庫</h3>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          checked={getPageContent}
                          className="rounded"
                          type="checkbox"
                          onChange={(e) => setGetPageContent(e.target.checked)}
                        />
                        <span>載入頁面內容（較慢但包含教案區塊）</span>
                      </label>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {databases.map((db) => (
                      <button
                        key={db.id}
                        className="w-full p-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                        disabled={isLoadingAll || isAutoLoading}
                        onClick={() => {
                          setSelectedDatabase(db.id);
                          fetchNotionData(db.id);
                        }}
                      >
                        <div className="font-medium text-[#2B3A3B]">
                          {db.title?.[0]?.plain_text || '無標題資料庫'}
                        </div>
                        <div className="text-xs text-[#A68A64] mt-1">
                          ID: {db.id}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-3 border-t border-[#EADBC8]">
                    <button
                      className="text-sm text-[#A68A64] hover:text-[#8B7355]"
                      onClick={() => setShowDatabaseSelect(false)}
                    >
                      關閉
                    </button>
                  </div>
                </div>
              )}
            </div>
            <HanamiButton
              className="bg-gradient-to-r from-hanami-primary to-hanami-secondary"
              onClick={() => setShowAddModal(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              新增活動
            </HanamiButton>
            <HanamiButton
              variant="secondary"
              onClick={() => window.location.href = '/admin/template-management'}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              管理範本
            </HanamiButton>
          </div>
        </div>

        {/* 導航按鈕 */}
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/abilities'}
            >
              <TrendingUp className="w-4 h-4" />
              發展能力圖卡
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
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
              onClick={() => window.location.href = '/admin/students'}
            >
              <Users className="w-4 h-4" />
              返回學生管理
            </button>
          </div>
        </div>

        {/* 篩選和搜尋區域 */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <HanamiInput
                  className="pl-10"
                  placeholder="搜尋活動名稱或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* 多選篩選按鈕 */}
            <div className="flex gap-3">
              {/* 活動類型多選 */}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 min-w-[100px]" type="button" onClick={() => handlePopupOpen('activity_types')}>
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">活動類型</span>
                {filterTypes.length > 0 && <span className="ml-1 bg-hanami-primary text-white text-xs rounded-full px-2 py-1">{filterTypes.length}</span>}
              </button>
              {/* 狀態多選 */}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 min-w-[100px]" type="button" onClick={() => handlePopupOpen('statuses')}>
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">狀態</span>
                {filterStatuses.length > 0 && <span className="ml-1 bg-hanami-secondary text-white text-xs rounded-full px-2 py-1">{filterStatuses.length}</span>}
              </button>
              {/* 標籤多選 */}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 min-w-[100px]" type="button" onClick={() => handlePopupOpen('tags')}>
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">標籤</span>
                {filterTags.length > 0 && <span className="ml-1 bg-hanami-success text-white text-xs rounded-full px-2 py-1">{filterTags.length}</span>}
              </button>
              {/* 排序單選 */}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 min-w-[100px]" type="button" onClick={() => handlePopupOpen('sort')}>
                <ChevronDown className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{(() => {
                  const opt = sortOptions.find(o => o.value === filterSort);
                  return opt ? opt.label : '排序';
                })()}
                </span>
              </button>
              <button className="px-3 py-2 bg-hanami-primary hover:bg-hanami-secondary rounded-lg transition-colors" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>{sortOrder === 'asc' ? '↑' : '↓'}</button>
            </div>
          </div>
          {/* 已選擇的篩選條件顯示 */}
          {(filterTypes.length > 0 || filterStatuses.length > 0 || filterTags.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filterTypes.map(type => (
                <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                  {activityTypeOptions.find(o => o.value === type)?.label || type}
                  <button className="ml-2 text-hanami-primary hover:text-hanami-accent" onClick={() => setFilterTypes(filterTypes.filter(t => t !== type))}>×</button>
                </span>
              ))}
              {filterStatuses.map(status => (
                <span key={status} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-secondary/20 text-hanami-text border border-hanami-secondary/30">
                  {statusOptions.find(o => o.value === status)?.label || status}
                  <button className="ml-2 text-hanami-secondary hover:text-hanami-accent" onClick={() => setFilterStatuses(filterStatuses.filter(s => s !== status))}>×</button>
                </span>
              ))}
              {filterTags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-success/20 text-hanami-text border border-hanami-success/30">
                  {tagOptions.find(o => o.value === tag)?.label || tag}
                  <button className="ml-2 text-hanami-success hover:text-hanami-accent" onClick={() => setFilterTags(filterTags.filter(t => t !== tag))}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 text-sm text-hanami-text-secondary">
            共 {filteredActivities.length} 個活動
            {(searchTerm || filterTypes.length > 0 || filterStatuses.length > 0 || filterTags.length > 0) && (
              <span className="ml-2 text-hanami-accent">(已篩選)</span>
            )}
          </div>
        </div>
        {/* PopupSelect 彈窗 */}
        {showPopup.open && (
          <PopupSelect
            errorMsg={
              (showPopup.field === 'activity_types' && activityTypeOptions.length === 0) ||
              (showPopup.field === 'statuses' && statusOptions.length === 0) ||
              (showPopup.field === 'tags' && tagOptions.length === 0)
                ? '目前無可選項目' : undefined
            }
            mode={showPopup.field === 'sort' ? 'single' : 'multi'}
            options={
              showPopup.field === 'activity_types' ? activityTypeOptions :
                showPopup.field === 'statuses' ? statusOptions :
                  showPopup.field === 'tags' ? tagOptions :
                    showPopup.field === 'sort' ? sortOptions :
                      []
            }
            selected={popupSelected || (showPopup.field === 'sort' ? 'created_at' : [])}
            title={
              showPopup.field === 'activity_types' ? '選擇活動類型' :
                showPopup.field === 'statuses' ? '選擇狀態' :
                  showPopup.field === 'tags' ? '選擇標籤' :
                    showPopup.field === 'sort' ? '選擇排序方式' :
                      '選擇'
            }
            onCancel={handlePopupCancel}
            onChange={setPopupSelected}
            onConfirm={handlePopupConfirm}
          />
        )}

        {/* 活動列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <HanamiCard key={activity.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-hanami-text mb-2">
                    {activity.activity_name}
                  </h3>
                  <p className="text-sm text-hanami-text-secondary mb-3 line-clamp-2">
                    {activity.activity_description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 rounded-full bg-hanami-primary hover:bg-hanami-accent shadow text-hanami-text"
                    title="查看詳情"
                    onClick={() => handleViewActivity(activity)}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-hanami-secondary hover:bg-hanami-accent shadow text-hanami-text"
                    title="編輯"
                    onClick={() => handleEditActivity(activity)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-green-100 hover:bg-green-200 shadow text-green-700"
                    title="複製"
                    onClick={() => handleDuplicateActivity(activity)}
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-hanami-danger hover:bg-red-400 shadow text-hanami-text"
                    title="刪除"
                    onClick={() => handleDeleteActivity(activity.id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-hanami-text-secondary gap-4">
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    {activity.activity_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4" />
                    等級 {activity.difficulty_level}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {activity.estimated_duration}分鐘
                  </span>
                </div>
              </div>
              
              {activity.materials_needed && activity.materials_needed.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-hanami-text mb-2">所需材料:</p>
                  <div className="flex flex-wrap gap-1">
                    {activity.materials_needed.slice(0, 3).map((material, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-hanami-surface text-hanami-text-secondary text-xs rounded-full"
                      >
                        {material}
                      </span>
                    ))}
                    {activity.materials_needed.length > 3 && (
                      <span className="px-2 py-1 bg-hanami-surface text-hanami-text-secondary text-xs rounded-full">
                        +{activity.materials_needed.length - 3} 更多
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {activity.instructions && (
                <div>
                  <p className="text-sm font-medium text-hanami-text mb-2">操作說明:</p>
                  <p className="text-sm text-hanami-text-secondary line-clamp-2">
                    {activity.instructions}
                  </p>
                </div>
              )}
            </HanamiCard>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-hanami-text-secondary text-lg mb-2">
              {searchTerm || filterTypes.length > 0 || filterStatuses.length > 0 || filterTags.length > 0 ? '沒有符合條件的活動' : '尚無教學活動'}
            </p>
            <p className="text-hanami-text-secondary">
              {searchTerm || filterTypes.length > 0 || filterStatuses.length > 0 || filterTags.length > 0 ? '請調整搜尋條件' : '點擊「新增活動」開始建立'}
            </p>
          </div>
        )}

        {/* 新增/編輯活動模態框 */}
        {showAddModal && (
          <ActivityForm
            activity={editingActivity}
            mode={editingActivity ? 'edit' : 'create'}
            onCancel={() => {
              setShowAddModal(false);
              setEditingActivity(null);
            }}
            onSubmit={editingActivity ? handleUpdateActivity : handleAddActivity}
          />
        )}

        {/* 活動詳情模態框 */}
        {showDetailModal && selectedActivity && (
          <ActivityDetailModal
            activity={selectedActivity}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedActivity(null);
            }}
            onDelete={() => handleDeleteActivity(selectedActivity.id)}
            onDuplicate={() => handleDuplicateActivity(selectedActivity)}
            onEdit={() => {
              setShowDetailModal(false);
              handleEditActivity(selectedActivity);
            }}
          />
        )}

        {/* Notion 資料顯示模態框 */}
        {showNotionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
              {/* 標題欄 */}
              <div className="bg-[#FFF9F2] px-6 py-4 border-b border-[#EADBC8]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#2B3A3B]">Notion 教學活動資料</h2>
                  <div className="flex items-center gap-3">
                    <button
                      className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                        isAutoLoading 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={!selectedDatabase || notionLoading}
                      onClick={toggleAutoLoad}
                    >
                      {isAutoLoading ? '⏹️ 停止載入' : '▶️ 開始載入'}
                    </button>
                    <button
                      className="text-[#A68A64] hover:text-[#8B7355] transition-colors"
                      onClick={() => setShowNotionModal(false)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* 搜尋框 */}
                <div className="mt-3">
                  <div className="relative">
                    <input
                      className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#2B3A3B] placeholder-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      placeholder="搜尋名稱、ID、備註或標籤..."
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A68A64] hover:text-[#8B7355]"
                        onClick={() => setSearchTerm('')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-[#A68A64]">
                  {isAutoLoading ? (
                    <span className="text-green-600 font-medium">
                      🔄 自動載入中... 已載入 {totalLoaded} 筆資料
                    </span>
                  ) : (
                    <>
                      共載入 {totalLoaded} 筆資料
                      {searchTerm && (
                        <span className="ml-2 text-blue-600">
                          • 搜尋結果: {filteredNotionData.length} 筆
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* 內容區域 */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredNotionData.length > 0 ? (
                  <div className="space-y-4">
                    {filteredNotionData.map((item, index) => (
                      <div key={`${item.id}-${index}`}>
                        {renderNotionPage(item)}
                      </div>
                    ))}
                    {hasMoreData && nextCursor && (
                      <div className="text-center py-6 border-t border-[#EADBC8] mt-6">
                        <button
                          className="px-6 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={notionLoading}
                          onClick={() => fetchNotionData(selectedDatabase, true)}
                        >
                          {notionLoading ? '載入中...' : '載入更多資料'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#A68A64]">暫無 Notion 資料</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
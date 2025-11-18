import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  XMarkIcon, 
  CheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useOrganization } from '@/contexts/OrganizationContext';

const getDifficultyColor = (level: number) => {
  switch (level) {
    case 1: return 'bg-green-100 text-green-800';
    case 2: return 'bg-blue-100 text-blue-800';
    case 3: return 'bg-yellow-100 text-yellow-800';
    case 4: return 'bg-orange-100 text-orange-800';
    case 5: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface TreeActivity {
  id: string;
  activity_name: string;
  activity_description?: string;
  activity_type: string;
  difficulty_level: number;
  estimated_duration?: number;
  materials_needed?: string[];
  instructions?: string;
  learning_objectives?: string[];
  tree_id: string;
  tree_name?: string;
  is_active: boolean;
  // 新增：成長樹相關資訊
  tree?: {
    id: string;
    tree_name: string;
    tree_description?: string;
  };
}

interface ActivitySelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (activities: TreeActivity[]) => void;
  selectedActivities?: TreeActivity[];
  mode?: 'single' | 'multiple';
  activityType?: 'current' | 'ongoing';
  studentId?: string; // 新增：學生ID參數
}

const ActivitySelectionModal: React.FC<ActivitySelectionModalProps> = ({
  open,
  onClose,
  onSelect,
  selectedActivities = [],
  mode = 'multiple',
  activityType = 'current',
  studentId
}) => {
  const { currentOrganization } = useOrganization();
  
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const PLACEHOLDER_ORG_IDS = new Set(['default-org', 'unassigned-org-placeholder']);
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) return null;
    return UUID_REGEX.test(currentOrganization.id) && !PLACEHOLDER_ORG_IDS.has(currentOrganization.id)
      ? currentOrganization.id
      : null;
  }, [currentOrganization?.id]);
  
  const [activities, setActivities] = useState<TreeActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState<TreeActivity[]>([]);
  const tempSelectedRef = useRef<TreeActivity[]>([]);
  const initializedRef = useRef(false);

  // 同步 ref 和 state
  useEffect(() => {
    tempSelectedRef.current = tempSelected;
  }, [tempSelected]);

  useEffect(() => {
    if (open && !initializedRef.current) {
      // 只在第一次打開時初始化 tempSelected
      setTempSelected(selectedActivities);
      initializedRef.current = true;
    } else if (!open) {
      // 當關閉時重置初始化狀態
      initializedRef.current = false;
    }
  }, [open, selectedActivities]); // 只依賴 open 和 selectedActivities

  // 當篩選條件變化時，重新獲取資料
  useEffect(() => {
    if (open) {
      const updateActivities = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.append('is_active', 'true');
          
          // 添加 orgId 參數
          if (validOrgId) {
            params.append('orgId', validOrgId);
          }

          console.log('Fetching activities with params:', params.toString());
          const response = await fetch(`/api/teaching-activities?${params.toString()}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // 轉換數據格式以匹配 TreeActivity 接口
              const convertedActivities = result.data.map((activity: any) => ({
                id: activity.id,
                activity_name: activity.activity_name,
                activity_description: activity.activity_description,
                activity_type: activity.activity_type,
                difficulty_level: activity.difficulty_level || 1,
                estimated_duration: activity.duration_minutes,
                materials_needed: activity.materials_needed || [],
                instructions: activity.instructions || '',
                learning_objectives: [],
                tree_id: '', // 教學活動沒有 tree_id
                tree_name: '',
                is_active: activity.is_active || true
              }));
              setActivities(convertedActivities);
              console.log('Fetched activities:', convertedActivities);
            }
          }
        } catch (error) {
          console.error('獲取活動失敗:', error);
          setActivities([]);
        } finally {
          setLoading(false);
        }
      };
      updateActivities();
    }
  }, [open, validOrgId]); // 在打開時或 orgId 變化時獲取

  // 移除成長樹載入邏輯，因為我們直接使用教學活動

  const handleFilter = useCallback(() => {
    // 篩選條件變化時會自動重新獲取，這裡不需要做任何事情
    // 或者可以顯示一個提示
    console.log('篩選條件已自動應用');
  }, []); // 移除所有依賴項

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 移除成長樹選擇邏輯

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleActivityToggle = useCallback((activity: TreeActivity) => {
    if (mode === 'single') {
      setTempSelected([activity]);
    } else {
      setTempSelected(prev => {
        const isSelected = prev.some(a => a.id === activity.id);
        if (isSelected) {
          return prev.filter(a => a.id !== activity.id);
        } else {
          return [...prev, activity];
        }
      });
    }
  }, [mode]); // 只依賴 mode

  const handleConfirm = useCallback(() => {
    onSelect(tempSelectedRef.current);
    onClose();
  }, [onSelect, onClose]); // 移除 tempSelected 依賴項

  const filteredActivities = useMemo(() => {
    return activities.filter(activity =>
      (activity.activity_name && activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activity.activity_description && activity.activity_description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activities, searchTerm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-[#FFFDF8] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#4B4036]">
            {activityType === 'current' ? '選擇本次課堂活動' : '選擇正在學習的活動'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#EADBC8] rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
          </button>
        </div>

        {/* 篩選器 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋活動..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-[#EADBC8] rounded-lg bg-[#FFFDF8] text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] transition-all hover:border-[#DDBA90] placeholder-[#8B7D6B]"
            />
          </div>
          
          {/* 移除成長樹選擇器 */}
          
          <button
            onClick={handleFilter}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#DDBA90] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 shadow-sm"
          >
            <FunnelIcon className="w-4 h-4" />
            篩選
          </button>
        </div>

        {/* 活動列表 */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto"></div>
              <p className="text-sm text-[#4B4036] mt-2">載入活動中...</p>
            </div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const isSelected = tempSelected.some(a => a.id === activity.id);
              return (
                <div
                  key={activity.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#FFD59A] bg-[#FFF3E0]' 
                      : 'border-[#EADBC8] bg-white hover:border-[#FFD59A] hover:bg-[#FFFDF8]'
                  }`}
                  onClick={() => handleActivityToggle(activity)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-[#4B4036]">{activity.activity_name || '未命名活動'}</h3>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-[#FFD59A]" />
                        )}
                      </div>
                      
                      {activity.activity_description && (
                        <p className="text-sm text-[#2B3A3B] mb-3 line-clamp-2">
                          {activity.activity_description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {activity.tree_name && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {activity.tree_name}
                          </span>
                        )}
                        {activity.estimated_duration && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {activity.estimated_duration}分鐘
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[#4B4036]">沒有找到符合條件的活動</p>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EADBC8]">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[#EADBC8] bg-white text-[#4B4036] rounded-lg hover:bg-[#FFFDF8] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={tempSelected.length === 0}
            className="px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#DDBA90] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            確認選擇 ({tempSelected.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitySelectionModal; 
'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard } from '@/components/ui';
import HanamiInput from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { PopupSelect } from '@/components/ui/PopupSelect';
import TeachingActivityDetailModal from '@/components/ui/TeachingActivityDetailModal';
import { supabase } from '@/lib/supabase';
import { TreeActivity, CreateTreeActivityRequest, ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, DIFFICULTY_LEVELS, DIFFICULTY_LEVEL_LABELS } from '@/types/progress';
import toast from 'react-hot-toast';

interface GrowthTreeActivitiesPanelProps {
  treeId: string;
  treeName: string;
  onClose?: () => void;
}

interface TeachingActivity {
  id: string;
  activity_name: string;
  activity_description?: string;
  activity_type: string;
  difficulty_level?: number;
  duration_minutes?: number;
  materials_needed?: string[];
  instructions?: string;
}

export default function GrowthTreeActivitiesPanel({ 
  treeId, 
  treeName,
  onClose 
}: GrowthTreeActivitiesPanelProps) {
  const [activities, setActivities] = useState<TreeActivity[]>([]);
  const [teachingActivities, setTeachingActivities] = useState<TeachingActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<TreeActivity | null>(null);
  const [formData, setFormData] = useState<CreateTreeActivityRequest>({
    tree_id: treeId,
    activity_source: 'teaching',
    activity_id: '',
    activity_type: 'teaching',
    difficulty_level: 1,
    estimated_duration: 30,
    materials_needed: [],
    instructions: '',
    learning_objectives: [],
    target_abilities: [],
    prerequisites: [],
    is_required: false
  });
  
  // 載入活動列表和教學活動
  useEffect(() => {
    if (treeId) {
      loadActivities();
      loadTeachingActivities();
    }
  }, [treeId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('hanami_tree_activities')
        .select(`
          *,
          hanami_teaching_activities (
            id,
            activity_name,
            activity_description,
            activity_type,
            difficulty_level,
            duration_minutes,
            materials_needed,
            instructions,
            custom_fields,
            template_id,
            status,
            tags,
            category,
            created_at
          )
        `)
        .eq('tree_id', treeId)
        .eq('is_active', true)
        .order('activity_order', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('載入活動失敗:', error);
      toast.error('載入活動失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachingActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .eq('is_active', true)
        .order('activity_name');

      if (error) throw error;
      setTeachingActivities(data as TeachingActivity[] || []);
    } catch (error) {
      console.error('載入教學活動失敗:', error);
      toast.error('載入教學活動失敗');
    }
  };

  const handleCreateActivity = async () => {
    try {
      setLoading(true);
      
      if (selectedActivityIds.length === 0) {
        toast.error('請選擇至少一個教學活動');
        return;
      }

      // 批量添加選中的教學活動
      const promises = selectedActivityIds.map(async (activityId) => {
        const submitData = {
          tree_id: treeId,
          activity_source: 'teaching',
          activity_id: activityId,
          priority_order: 1,
          activity_order: 0,
          is_required: false
        };

        const response = await fetch('/api/tree-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || result.details || '創建活動失敗');
        }

        return response.json();
      });

      await Promise.all(promises);

      toast.success(`成功添加 ${selectedActivityIds.length} 個活動！`);
      setShowCreateForm(false);
      resetForm();
      loadActivities();
    } catch (error) {
      console.error('創建活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '創建活動失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('確定要移除此活動嗎？')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tree-activities?id=${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '移除活動失敗');
      }

      toast.success('活動移除成功！');
      loadActivities();
    } catch (error) {
      console.error('移除活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '移除活動失敗');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tree_id: treeId,
      activity_source: 'teaching',
      activity_id: '',
      activity_type: 'teaching',
      difficulty_level: 1,
      estimated_duration: 30,
      materials_needed: [],
      instructions: '',
      learning_objectives: [],
      target_abilities: [],
      prerequisites: [],
      is_required: false
    });
    setSelectedActivityIds([]);
  };

  const getActivityDisplayName = (activity: TreeActivity) => {
    if (activity.activity_source === 'custom') {
      return activity.custom_activity_name || '未命名活動';
    } else if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
      return activity.hanami_teaching_activities.activity_name;
    }
    return '未知活動';
  };

  const getActivityDisplayDescription = (activity: TreeActivity) => {
    if (activity.activity_source === 'custom') {
      return activity.custom_activity_description || '';
    } else if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
      return activity.hanami_teaching_activities.activity_description || '';
    }
    return '';
  };

  // 新增：獲取教學活動的完整詳情
  const getTeachingActivityDetails = (activity: TreeActivity) => {
    if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
      const teachingActivity = activity.hanami_teaching_activities as any;
      return {
        ...teachingActivity,
        custom_fields: teachingActivity.custom_fields || {},
        template_id: teachingActivity.template_id,
        status: teachingActivity.status || 'draft'
      };
    }
    return null;
  };

  // 檢查活動是否已經被添加到成長樹中
  const isActivityAlreadyAdded = (activityId: string) => {
    return activities.some(activity => activity.activity_id === activityId);
  };

  // 過濾掉已經添加的教學活動
  const availableTeachingActivities = teachingActivities.filter(ta => !isActivityAlreadyAdded(ta.id));

  // 處理活動選擇
  const handleActivitySelection = (activityId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedActivityIds(prev => [...prev, activityId]);
    } else {
      setSelectedActivityIds(prev => prev.filter(id => id !== activityId));
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題和操作按鈕 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-hanami-text">
          成長樹活動 ({activities.length})
        </h3>
        <div className="flex gap-2">
          <HanamiButton
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            disabled={loading}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            添加活動
          </HanamiButton>
          {onClose && (
            <HanamiButton
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              關閉
            </HanamiButton>
          )}
        </div>
      </div>

      {/* 活動列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary mx-auto"></div>
            <p className="text-hanami-text-secondary mt-2">載入中...</p>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <HanamiCard key={activity.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-hanami-text">
                      {getActivityDisplayName(activity)}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.activity_source === 'custom' 
                        ? 'bg-blue-100 text-blue-800' 
                        : activity.activity_source === 'teaching'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {activity.activity_source === 'custom' ? '自訂' :
                       activity.activity_source === 'teaching' ? '教學' : '模板'}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      等級 {activity.difficulty_level}
                    </span>
                  </div>
                  
                  {getActivityDisplayDescription(activity) && (
                    <p className="text-sm text-hanami-text-secondary mb-2">
                      {getActivityDisplayDescription(activity)}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-hanami-text-secondary">
                    <span>類型: {ACTIVITY_TYPE_LABELS[activity.activity_type]}</span>
                    {activity.estimated_duration && (
                      <span>時長: {activity.estimated_duration}分鐘</span>
                    )}
                    <span>優先級: {activity.priority_order}</span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <HanamiButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </HanamiButton>
                  <HanamiButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    disabled={loading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </HanamiButton>
                </div>
              </div>
            </HanamiCard>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-hanami-text-secondary">暫無活動</p>
            <p className="text-sm text-hanami-text-secondary mt-1">
              點擊「添加活動」來選擇教學活動
            </p>
          </div>
        )}
      </div>

      {/* 添加活動表單 */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-hanami-text">選擇教學活動</h3>
                <button
                  className="text-hanami-text hover:text-hanami-text-secondary transition-colors"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* 教學活動選擇 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選擇教學活動 ({selectedActivityIds.length} 個已選擇)
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-[#EADBC8] rounded-lg p-2 bg-[#FFF9F2]">
                    {availableTeachingActivities.length > 0 ? (
                      availableTeachingActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                            selectedActivityIds.includes(activity.id)
                              ? 'bg-hanami-primary/20 border border-hanami-primary'
                              : 'bg-white hover:bg-[#FFF9F2] border border-[#EADBC8]'
                          }`}
                          onClick={() => handleActivitySelection(activity.id, !selectedActivityIds.includes(activity.id))}
                        >
                          <input
                            type="checkbox"
                            checked={selectedActivityIds.includes(activity.id)}
                            onChange={(e) => handleActivitySelection(activity.id, e.target.checked)}
                            className="mr-3 h-4 w-4 text-hanami-primary border-[#EADBC8] rounded focus:ring-hanami-primary"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-hanami-text">{activity.activity_name}</div>
                            <div className="text-sm text-hanami-text-secondary">
                              {activity.activity_type} • 等級 {activity.difficulty_level || '未設定'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        沒有可用的教學活動
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#EADBC8] flex justify-end gap-2">
              <HanamiButton
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                disabled={loading}
              >
                取消
              </HanamiButton>
              <HanamiButton
                variant="primary"
                onClick={handleCreateActivity}
                disabled={loading || selectedActivityIds.length === 0}
              >
                {loading ? '添加中...' : `添加 ${selectedActivityIds.length} 個活動`}
              </HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 教學活動選擇彈窗 */}
      {/* Removed PopupSelect for activity selection */}

      {/* 活動詳情模態框 */}
      {selectedActivity && selectedActivity.activity_source === 'teaching' && getTeachingActivityDetails(selectedActivity) && (
        <TeachingActivityDetailModal
          activity={getTeachingActivityDetails(selectedActivity)!}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
} 
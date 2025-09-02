'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon, EyeIcon, PuzzlePieceIcon, MapIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard } from '@/components/ui';
import HanamiInput from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { PopupSelect } from '@/components/ui/PopupSelect';
import TeachingActivityDetailModal from '@/components/ui/TeachingActivityDetailModal';
import { LearningPathBuilder } from '@/components/ui';
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
  const [showLearningPathBuilder, setShowLearningPathBuilder] = useState(false);
  const [showPathList, setShowPathList] = useState(false);
  const [learningPathData, setLearningPathData] = useState<any>(null);
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

  // 載入成長樹活動
  const loadActivities = useCallback(async () => {
    if (!treeId) return;
    
    setLoading(true);
    try {
      console.log('開始載入成長樹活動，treeId:', treeId);
      const { data, error } = await (supabase as any)
        .from('hanami_tree_activities')
        .select(`
          id,
          tree_id,
          activity_id,
          activity_source,
          custom_activity_name,
          custom_activity_description,
          activity_type,
          difficulty_level,
          estimated_duration,
          priority_order,
          activity_order,
          is_required,
          is_active,
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
      
      if (error) {
        console.error('載入成長樹活動錯誤:', error);
        throw error;
      }
      
      console.log('載入成長樹活動成功，數量:', data?.length || 0);
      setActivities(data || []);
      
      // 載入保存的學習路線數據
      const storageKey = `learning_path_${treeId}`;
      const savedPathData = localStorage.getItem(storageKey);
      if (savedPathData) {
        try {
          const parsedPath = JSON.parse(savedPathData);
          setLearningPathData(parsedPath);
          console.log('載入保存的學習路線:', parsedPath);
        } catch (parseError) {
          console.error('解析保存的學習路線失敗:', parseError);
        }
      }
      
    } catch (error) {
      console.error('載入活動失敗:', error);
      toast.error('載入活動失敗');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  const loadTeachingActivities = async () => {
    try {
      console.log('開始載入教學活動...');
      const { data, error } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .eq('is_active', true)
        .order('activity_name');

      if (error) {
        console.error('載入教學活動錯誤:', error);
        throw error;
      }
      
      console.log('載入教學活動成功，數量:', data?.length || 0);
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

  // 處理學習路線保存
  const handleLearningPathSave = async (path: any) => {
    try {
      console.log('保存學習路線:', path);
      
      // 保存到 localStorage 作為臨時解決方案
      const storageKey = `learning_path_${treeId}`;
      localStorage.setItem(storageKey, JSON.stringify(path));
      
      // 更新本地狀態
      setLearningPathData(path);
      
      // 這裡可以保存到資料庫
      // 暫時顯示成功訊息
      toast.success('學習路線保存成功！');
      // 移除自動關閉模態框的行為
      // setShowLearningPathBuilder(false);
      
      // 可以選擇重新載入活動列表
      // await loadActivities();
    } catch (error) {
      console.error('保存學習路線失敗:', error);
      toast.error('保存學習路線失敗');
    }
  };

  // 處理學習路線預覽
  const handleLearningPathPreview = (path: any) => {
    setLearningPathData(path);
    // 可以在這裡顯示預覽模態框
    console.log('預覽學習路線:', path);
  };

  // 打開學習路線構建器
  const openLearningPathBuilder = () => {
    setShowLearningPathBuilder(true);
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
          <HanamiButton
            variant="cute"
            size="sm"
            onClick={openLearningPathBuilder}
            disabled={loading || activities.length === 0}
          >
            <MapIcon className="h-4 w-4 mr-1" />
            安排關卡
          </HanamiButton>
          <HanamiButton
            variant="soft"
            size="sm"
            onClick={() => setShowPathList(true)}
            disabled={loading || !learningPathData}
          >
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            活動流程
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

      {/* 學習路線構建器模態框 */}
      {showLearningPathBuilder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapIcon className="h-6 w-6 text-hanami-text" />
                  <h3 className="text-xl font-bold text-hanami-text">
                    {treeName} - 學習路線構建器
                  </h3>
                </div>
                <button
                  className="text-hanami-text hover:text-hanami-text-secondary transition-colors"
                  onClick={() => setShowLearningPathBuilder(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <LearningPathBuilder
                treeId={treeId}
                activities={activities}
                initialPath={learningPathData}
                onSave={handleLearningPathSave}
                onPreview={handleLearningPathPreview}
              />
            </div>
          </div>
        </div>
      )}

      {/* 路徑列表界面 */}
      {showPathList && learningPathData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-hanami-text" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-bold text-hanami-text">活動流程</h3>
                </div>
                <button
                  className="text-hanami-text hover:text-hanami-text-secondary transition-colors"
                  onClick={() => setShowPathList(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 mb-4">
                從開始到結束的完整學習流程：
              </p>
              
              {/* 路徑節點列表 */}
              <div className="space-y-3">
                {learningPathData.nodes && learningPathData.nodes.length > 0 ? (
                  learningPathData.nodes
                    .filter((node: any) => node.type === 'start' || node.type === 'activity' || node.type === 'milestone' || node.type === 'end')
                    .map((node: any, index: number) => {
                      const isCompleted = node.isCompleted;
                      const isLocked = node.isLocked;
                      
                      // 根據節點類型獲取顏色
                      const getNodeColors = () => {
                        if (isCompleted) {
                          return {
                            bg: 'bg-gradient-to-br from-blue-200 to-green-300',
                            text: 'text-gray-800',
                            border: 'border-blue-300',
                            shadow: 'shadow-blue-300/30'
                          };
                        }
                        
                        if (isLocked) {
                          return {
                            bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                            shadow: 'shadow-gray-400/20'
                          };
                        }
                        
                        switch (node.type) {
                          case 'start':
                          case 'end':
                            return {
                              bg: 'bg-gradient-to-br from-[#F98C53] to-[#FCCEB4]',
                              text: 'text-white',
                              border: 'border-[#FCCEB4]',
                              shadow: 'shadow-[#F98C53]/20'
                            };
                          case 'activity':
                            // 如果活動節點已連線（有順序），使用淺藍到淺綠漸變
                            if (node.order && node.order > 0) {
                              return {
                                bg: 'bg-gradient-to-br from-blue-100 to-green-200',
                                text: 'text-gray-800',
                                border: 'border-blue-200',
                                shadow: 'shadow-blue-200/30'
                              };
                            }
                            return {
                              bg: 'bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA]',
                              text: 'text-gray-800',
                              border: 'border-[#ABD7FB]',
                              shadow: 'shadow-[#ABD7FB]/20'
                            };
                          case 'milestone':
                            return {
                              bg: 'bg-gradient-to-br from-[#FCCEB4] to-[#F98C53]',
                              text: 'text-white',
                              border: 'border-[#FCCEB4]',
                              shadow: 'shadow-[#F98C53]/20'
                            };
                          case 'break':
                            return {
                              bg: 'bg-gradient-to-br from-[#F9F2EF] to-[#D2E0AA]',
                              text: 'text-gray-700',
                              border: 'border-[#D2E0AA]',
                              shadow: 'shadow-[#D2E0AA]/20'
                            };
                          default:
                            return {
                              bg: 'bg-gradient-to-br from-[#F9F2EF] to-[#ABD7FB]',
                              text: 'text-gray-700',
                              border: 'border-[#ABD7FB]',
                              shadow: 'shadow-[#ABD7FB]/20'
                            };
                        }
                      };
                      
                      const colors = getNodeColors();
                      
                      return (
                        <div
                          key={node.id}
                          className={`relative ${colors.bg} ${colors.border} border-2 rounded-xl p-4 shadow-lg ${colors.shadow} transition-all duration-300 hover:scale-105`}
                        >
                          {/* 步驟編號 */}
                          {(node.type === 'activity' || node.type === 'milestone') && (
                            <div className="absolute -top-2 -left-2 w-8 h-8 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center shadow-md">
                              <span className="text-xs font-bold text-gray-700">
                                {learningPathData.nodes
                                  .filter((n: any) => n.type === 'activity' || n.type === 'milestone')
                                  .findIndex((n: any) => n.id === node.id) + 1}
                              </span>
                            </div>
                          )}
                          
                          {/* 連接箭頭 */}
                          {index < learningPathData.nodes.filter((n: any) => n.type === 'start' || n.type === 'activity' || n.type === 'milestone' || n.type === 'end').length - 1 && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                              <div className="w-0.5 h-6 bg-gray-400"></div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400"></div>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            {/* 節點圖標 */}
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shadow-md`}>
                                {node.type === 'start' ? (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ) : node.type === 'end' ? (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ) : node.type === 'activity' ? (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                  </svg>
                                ) : node.type === 'milestone' ? (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ) : node.type === 'break' ? (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            
                            {/* 節點內容 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`text-base font-bold ${colors.text}`}>{node.title}</h3>
                                {isCompleted && (
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                {isLocked && (
                                  <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              {node.description && (
                                <p className={`text-xs ${colors.text} opacity-80 mb-3`}>{node.description}</p>
                              )}
                              
                              {/* 節點詳細信息 */}
                              <div className="flex items-center gap-4 mb-3">
                                {node.duration && (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs ${colors.text} opacity-70`}>時長:</span>
                                    <span className={`text-xs font-semibold ${colors.text}`}>{node.duration}分鐘</span>
                                  </div>
                                )}
                                
                                {node.difficulty && (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs ${colors.text} opacity-70`}>難度:</span>
                                    <span className={`text-xs font-semibold ${colors.text}`}>{node.difficulty}</span>
                                  </div>
                                )}
                                
                                {node.metadata?.activityDetails?.duration_minutes && node.metadata.activityDetails.duration_minutes > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs ${colors.text} opacity-70`}>活動時長:</span>
                                    <span className={`text-xs font-semibold ${colors.text}`}>{node.metadata.activityDetails.duration_minutes}分鐘</span>
                                  </div>
                                )}
                                
                                {node.metadata?.activityDetails?.difficulty_level && (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs ${colors.text} opacity-70`}>活動難度:</span>
                                    <span className={`text-xs font-semibold ${colors.text}`}>{node.metadata.activityDetails.difficulty_level}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 活動詳細信息 */}
                              {node.type === 'activity' && node.metadata?.activityDetails && (
                                <div className="mt-3 p-3 bg-white/20 rounded-lg">
                                  <div className={`text-xs font-medium ${colors.text} mb-2`}>活動詳情</div>
                                  <div className="grid grid-cols-1 gap-2 text-xs">
                                    {node.metadata.activityDetails.category && (
                                      <div>
                                        <span className={`${colors.text} opacity-70`}>類別：</span>
                                        <span className={`${colors.text}`}>{node.metadata.activityDetails.category}</span>
                                      </div>
                                    )}
                                    {node.metadata.activityDetails.activity_type && (
                                      <div>
                                        <span className={`${colors.text} opacity-70`}>類型：</span>
                                        <span className={`${colors.text}`}>{node.metadata.activityDetails.activity_type}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-lg font-medium">暫無學習路徑</div>
                    <div className="text-sm">請先創建學習路線</div>
                  </div>
                )}
              </div>
              
              {/* 完成提示 */}
              {learningPathData.nodes && learningPathData.nodes.filter((node: any) => node.type === 'activity' || node.type === 'milestone').length > 0 && (
                <div className="text-center mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl border border-green-200">
                  <div className="text-base font-semibold text-gray-700 mb-1">
                    學習路徑完成！
                  </div>
                  <div className="text-xs text-gray-600">
                    共 {learningPathData.nodes.filter((node: any) => node.type === 'activity' || node.type === 'milestone').length} 個學習步驟
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
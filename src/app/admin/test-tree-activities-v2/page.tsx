'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiButton } from '@/components/ui/HanamiButton';
import HanamiInput from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';
import { 
  TreeActivity, 
  GrowthTree, 
  CreateTreeActivityRequest,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LEVEL_LABELS
} from '@/types/progress';

export default function TestTreeActivitiesV2Page() {
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [activities, setActivities] = useState<TreeActivity[]>([]);
  const [selectedTree, setSelectedTree] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState<Partial<CreateTreeActivityRequest>>({
    tree_id: '',
    activity_source: 'custom',
    activity_name: '',
    activity_description: '',
    activity_type: 'custom',
    difficulty_level: 1,
    estimated_duration: 30,
    materials_needed: [],
    instructions: '',
    learning_objectives: [],
    target_abilities: [],
    prerequisites: [],
    priority_order: 1,
    activity_order: 0,
    is_required: false
  });

  // 載入成長樹列表
  useEffect(() => {
    loadTrees();
  }, []);

  // 載入活動列表
  useEffect(() => {
    if (selectedTree) {
      loadActivities(selectedTree);
    }
  }, [selectedTree]);

  const loadTrees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('is_active', true)
        .order('tree_name');

      if (error) throw error;
      setTrees(data || []);
    } catch (error) {
      console.error('載入成長樹失敗:', error);
      toast.error('載入成長樹失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (treeId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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
            instructions
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

  const handleCreateActivity = async () => {
    try {
      setLoading(true);
      
      if (!formData.tree_id) {
        toast.error('請選擇成長樹');
        return;
      }

      if (formData.activity_source === 'custom' && !formData.activity_name) {
        toast.error('請輸入活動名稱');
        return;
      }

      const response = await fetch('/api/tree-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '創建活動失敗');
      }

      toast.success('活動創建成功！');
      setFormData({
        tree_id: selectedTree,
        activity_source: 'custom',
        activity_name: '',
        activity_description: '',
        activity_type: 'custom',
        difficulty_level: 1,
        estimated_duration: 30,
        materials_needed: [],
        instructions: '',
        learning_objectives: [],
        target_abilities: [],
        prerequisites: [],
        priority_order: 1,
        activity_order: 0,
        is_required: false
      });
      
      // 重新載入活動列表
      if (selectedTree) {
        loadActivities(selectedTree);
      }
    } catch (error) {
      console.error('創建活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '創建活動失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tree-activities?id=${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '刪除活動失敗');
      }

      toast.success('活動刪除成功！');
      
      // 重新載入活動列表
      if (selectedTree) {
        loadActivities(selectedTree);
      }
    } catch (error) {
      console.error('刪除活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '刪除活動失敗');
    } finally {
      setLoading(false);
    }
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
      return activity.custom_activity_description;
    } else if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
      return activity.hanami_teaching_activities.activity_description;
    }
    return '';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">成長樹活動功能測試 (v2)</h1>
        <p className="text-gray-600">測試基於現有表結構的成長樹活動功能</p>
      </div>

      {/* 成長樹選擇 */}
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">選擇成長樹</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成長樹
            </label>
            <HanamiSelect
              value={selectedTree}
              onChange={(e) => setSelectedTree(e.target.value)}
              options={trees.map(tree => ({
                value: tree.id,
                label: tree.tree_name
              }))}
              placeholder="請選擇成長樹"
            />
          </div>
          <HanamiButton
            onClick={loadTrees}
            disabled={loading}
            variant="secondary"
          >
            重新載入
          </HanamiButton>
        </div>
      </HanamiCard>

      {/* 創建活動表單 */}
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">創建新活動</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動來源
            </label>
            <HanamiSelect
              value={formData.activity_source || 'custom'}
              onChange={(e) => setFormData({ ...formData, activity_source: e.target.value as 'teaching' | 'custom' | 'template' })}
              options={[
                { value: 'custom', label: '自訂活動' },
                { value: 'teaching', label: '教學活動' },
                { value: 'template', label: '模板活動' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動類型
            </label>
            <HanamiSelect
              value={formData.activity_type || 'custom'}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as 'custom' | 'teaching' | 'assessment' | 'practice' })}
              options={ACTIVITY_TYPES.map(type => ({
                value: type,
                label: ACTIVITY_TYPE_LABELS[type]
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動名稱
            </label>
            <HanamiInput
              value={formData.activity_name || ''}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              placeholder="請輸入活動名稱"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              難度等級
            </label>
            <HanamiSelect
              value={formData.difficulty_level?.toString() || '1'}
              onChange={(e) => setFormData({ ...formData, difficulty_level: parseInt(e.target.value) })}
              options={DIFFICULTY_LEVELS.map(level => ({
                value: level.toString(),
                label: `${DIFFICULTY_LEVEL_LABELS[level]} (等級 ${level})`
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預估時長 (分鐘)
            </label>
            <HanamiInput
              type="number"
              value={formData.estimated_duration?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || undefined })}
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              優先順序
            </label>
            <HanamiInput
              type="number"
              value={formData.priority_order?.toString() || '1'}
              onChange={(e) => setFormData({ ...formData, priority_order: parseInt(e.target.value) || 1 })}
              placeholder="1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動描述
            </label>
            <textarea
              value={formData.activity_description || ''}
              onChange={(e) => setFormData({ ...formData, activity_description: e.target.value })}
              placeholder="請輸入活動描述"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動說明
            </label>
            <textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="請輸入活動說明"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <HanamiButton
            onClick={handleCreateActivity}
            disabled={loading || !selectedTree}
            variant="primary"
          >
            {loading ? '創建中...' : '創建活動'}
          </HanamiButton>
        </div>
      </HanamiCard>

      {/* 活動列表 */}
      {selectedTree && (
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">活動列表</h2>
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">此成長樹還沒有活動</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {getActivityDisplayName(activity)}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.activity_source === 'custom' 
                            ? 'bg-blue-100 text-blue-800'
                            : activity.activity_source === 'teaching'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {activity.activity_source === 'custom' ? '自訂' : 
                           activity.activity_source === 'teaching' ? '教學' : '模板'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          等級 {activity.difficulty_level}
                        </span>
                      </div>
                      
                      {getActivityDisplayDescription(activity) && (
                        <p className="text-gray-600 mb-2">
                          {getActivityDisplayDescription(activity)}
                        </p>
                      )}
                      
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>時長: {activity.estimated_duration || '未設定'} 分鐘</span>
                        <span>優先順序: {activity.priority_order}</span>
                        <span>活動順序: {activity.activity_order}</span>
                        {activity.is_required && (
                          <span className="text-red-600 font-medium">必做活動</span>
                        )}
                      </div>
                    </div>
                    
                    <HanamiButton
                      onClick={() => handleDeleteActivity(activity.id)}
                      disabled={loading}
                      variant="danger"
                      size="sm"
                    >
                      刪除
                    </HanamiButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </HanamiCard>
      )}

      {/* 系統資訊 */}
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">系統資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">成長樹數量:</span> {trees.length}
          </div>
          <div>
            <span className="font-medium">活動數量:</span> {activities.length}
          </div>
          <div>
            <span className="font-medium">選中的成長樹:</span> {selectedTree ? trees.find(t => t.id === selectedTree)?.tree_name : '無'}
          </div>
        </div>
      </HanamiCard>
    </div>
  );
} 
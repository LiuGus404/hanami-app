'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

import { HanamiCard, HanamiButton } from '@/components/ui';
import AddGrowthTreeModal from '@/components/ui/AddGrowthTreeModal';
import { supabase } from '@/lib/supabase';
import { GrowthTree, GrowthGoal } from '@/types/progress';

export default function GrowthTreesPage() {
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [goals, setGoals] = useState<GrowthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTree, setEditingTree] = useState<GrowthTree | null>(null);
  const [abilitiesOptions, setAbilitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [activitiesOptions, setActivitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('開始載入資料...');
      
      // 成長樹
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .order('tree_name');
      if (treesError) throw treesError;
      const fixedTrees = (treesData || []).map((t: any) => ({
        ...t,
        course_type: t.course_type ?? t.course_type_id ?? '',
        difficulty_level: t.difficulty_level ?? t.tree_level ?? 1,
        tree_description: t.tree_description ?? undefined,
      }));
      setTrees(fixedTrees);
      console.log('載入成長樹:', fixedTrees);
      
      // 目標
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .order('goal_order');
      if (goalsError) throw goalsError;
      const fixedGoals = (goalsData || []).map((g: any) => {
        console.log(`處理目標 ${g.goal_name} 的原始資料:`, g);
        
        // 確保進度內容是陣列且過濾空值
        const progressContents = Array.isArray(g.progress_contents) 
          ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
          : [];
        
        const fixedGoal = {
          ...g,
          is_completed: g.is_completed ?? false,
          progress_max: Number(g.progress_max) || 5,
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
          progress_contents: progressContents,
          goal_description: g.goal_description ?? '',
        };
        console.log(`處理後目標 ${g.goal_name} 的資料:`, fixedGoal);
        return fixedGoal;
      });
      setGoals(fixedGoals);
      console.log('載入目標:', fixedGoals);
      
      // 發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('id, ability_name')
        .order('ability_name');
      if (abilitiesError) throw abilitiesError;
      setAbilitiesOptions((abilitiesData || []).map((a: any) => ({ value: a.id, label: a.ability_name })));
      
      // 活動
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hanami_teaching_activities')
        .select('id, activity_name')
        .order('activity_name');
      if (activitiesError) throw activitiesError;
      setActivitiesOptions((activitiesData || []).map((a: any) => ({ value: a.id, label: a.activity_name })));
      
      // 老師
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname')
        .order('teacher_nickname');
      if (teachersError) throw teachersError;
      // 管理員
      const { data: adminsData, error: adminsError } = await supabase
        .from('hanami_admin')
        .select('id, admin_name')
        .order('admin_name');
      if (adminsError) throw adminsError;
      setTeachersOptions([
        ...((teachersData || []).map((t: any) => ({ value: t.id, label: t.teacher_nickname || t.teacher_fullname || '老師' }))),
        ...((adminsData || []).map((a: any) => ({ value: a.id, label: `${a.admin_name}（管理員）` }))),
      ]);
      
      console.log('資料載入完成');
    } catch (err: any) {
      console.error('資料載入失敗:', err);
      setError(`資料載入失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // 新增成長樹與目標
  const handleAddTree = async (treeData: any, goals: any[]) => {
    setLoading(true);
    setError(null);
    try {
      console.log('開始新增成長樹:', treeData);
      console.log('目標資料:', goals);
      
      // 1. 新增成長樹
      const { data: treeInsert, error: treeError } = await supabase
        .from('hanami_growth_trees')
        .insert([{
          tree_name: treeData.tree_name,
          tree_description: treeData.tree_description,
          tree_icon: treeData.tree_icon,
          course_type: treeData.course_type,
          tree_level: treeData.tree_level,
          difficulty_level: treeData.difficulty_level,
          is_active: true,
        }])
        .select()
        .single();
      
      if (treeError) {
        console.error('新增成長樹失敗:', treeError);
        throw treeError;
      }
      
      console.log('成長樹新增成功:', treeInsert);
      const treeId = treeInsert.id;
      
      // 2. 新增所有目標
      if (goals && goals.length > 0) {
        const goalsInsert = goals.map((g, idx) => {
          // 確保進度內容是陣列且過濾空值
          const progressContents = Array.isArray(g.progress_contents) 
            ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
            : [];
          
          const goalData = {
            tree_id: treeId,
            goal_name: g.goal_name,
            goal_description: g.goal_description,
            goal_icon: g.goal_icon,
            goal_order: idx + 1,
            is_achievable: true,
            is_completed: false,
            progress_max: Number(g.progress_max) || 5,
            required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
            related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
            progress_contents: progressContents,
          };
          console.log(`新增目標 ${g.goal_name} 的資料:`, goalData);
          return goalData;
        });
        
        console.log('準備新增目標:', goalsInsert);
        
        const { data: goalsData, error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .insert(goalsInsert)
          .select();
          
        if (goalsError) {
          console.error('新增目標失敗:', goalsError);
          throw goalsError;
        }
        
        console.log('目標新增成功:', goalsData);
      }
      
      // 3. 重新載入資料
      console.log('重新載入資料...');
      await loadAllData();
      
      console.log('新增完成，關閉模態框');
      setShowAddModal(false);
    } catch (err: any) {
      console.error('新增失敗:', err);
      setError(`新增失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新成長樹與目標
  const handleUpdateTree = async (treeData: any, goals: any[]) => {
    setLoading(true);
    setError(null);
    try {
      console.log('開始更新成長樹:', treeData);
      console.log('目標資料:', goals);
      
      if (!editingTree) {
        throw new Error('沒有要編輯的成長樹');
      }
      
      // 1. 更新成長樹
      const { error: treeError } = await supabase
        .from('hanami_growth_trees')
        .update({
          tree_name: treeData.tree_name,
          tree_description: treeData.tree_description,
          tree_color: treeData.tree_color,
          tree_icon: treeData.tree_icon,
          review_teachers: treeData.review_teachers,
          notes: treeData.notes,
          tree_level: treeData.tree_level,
        })
        .eq('id', editingTree.id);
      
      if (treeError) {
        console.error('更新成長樹失敗:', treeError);
        throw treeError;
      }
      
      console.log('成長樹更新成功');
      
      // 2. 獲取現有目標的所有資料
      const { data: existingGoals, error: fetchError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', editingTree.id);
      
      if (fetchError) {
        console.error('獲取現有目標失敗:', fetchError);
        throw fetchError;
      }
      
      // 創建現有目標資料映射
      const existingGoalsMap = new Map();
      (existingGoals || []).forEach(goal => {
        existingGoalsMap.set(goal.goal_name, goal);
      });
      
      // 3. 刪除現有目標
      const { error: deleteError } = await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('tree_id', editingTree.id);
      
      if (deleteError) {
        console.error('刪除現有目標失敗:', deleteError);
        throw deleteError;
      }
      
      // 4. 新增新目標，保留現有資料
      if (goals && goals.length > 0) {
        const goalsInsert = goals.map((g, idx) => {
          const existingGoal = existingGoalsMap.get(g.goal_name);
          
          // 優先使用新資料，如果新資料為空則使用現有資料
          const progressContents = Array.isArray(g.progress_contents) && g.progress_contents.length > 0
            ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
            : (Array.isArray(existingGoal?.progress_contents) && existingGoal.progress_contents.length > 0
              ? (existingGoal.progress_contents as string[]).filter(content => content && content.trim() !== '')
              : []);
          
          const goalData = {
            tree_id: editingTree.id,
            goal_name: g.goal_name,
            goal_description: g.goal_description,
            goal_icon: g.goal_icon,
            goal_order: idx + 1,
            is_achievable: true,
            is_completed: existingGoal?.is_completed || false, // 保留現有完成狀態
            progress_max: Number(g.progress_max || existingGoal?.progress_max || 5), // 優先使用新資料
            required_abilities: Array.isArray(g.required_abilities) && g.required_abilities.length > 0
              ? g.required_abilities 
              : (Array.isArray(existingGoal?.required_abilities) ? existingGoal.required_abilities : []),
            related_activities: Array.isArray(g.related_activities) && g.related_activities.length > 0
              ? g.related_activities 
              : (Array.isArray(existingGoal?.related_activities) ? existingGoal.related_activities : []),
            progress_contents: progressContents,
          };
          console.log(`目標 ${g.goal_name} 的資料:`, goalData);
          return goalData;
        });
        
        console.log('準備新增目標:', goalsInsert);
        
        const { data: goalsData, error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .insert(goalsInsert)
          .select();
          
        if (goalsError) {
          console.error('新增目標失敗:', goalsError);
          throw goalsError;
        }
        
        console.log('目標新增成功:', goalsData);
      }
      
      // 4. 重新載入資料
      console.log('重新載入資料...');
      await loadAllData();
      
      console.log('更新完成，關閉模態框');
      setEditingTree(null);
    } catch (err: any) {
      console.error('更新失敗:', err);
      setError(`更新失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTree = async (id: string) => {
    if (!confirm('確定要刪除此成長樹嗎？相關的目標也會被刪除。')) return;

    try {
      // 先刪除相關的目標
      await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('tree_id', id);

      // 再刪除成長樹
      const { error } = await supabase
        .from('hanami_growth_trees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAllData();
    } catch (error) {
      console.error('刪除成長樹失敗:', error);
    }
  };

  const getGoalsForTree = (treeId: string) => {
    const treeGoals = goals.filter(goal => goal.tree_id === treeId);
    console.log(`取得成長樹 ${treeId} 的目標:`, treeGoals);
    return treeGoals;
  };

  // 載入現有目標
  const loadExistingGoals = async (treeId: string) => {
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId)
        .order('goal_order');
      
      if (goalsError) throw goalsError;
      
      return (goalsData || []).map((g: any) => {
        console.log(`loadExistingGoals - 處理目標 ${g.goal_name} 的資料:`, g);
        
        // 確保進度內容是陣列且過濾空值
        const progressContents = Array.isArray(g.progress_contents) 
          ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
          : [];
        
        return {
          goal_name: g.goal_name,
          goal_description: g.goal_description || '',
          goal_icon: g.goal_icon || '⭐',
          progress_max: Number(g.progress_max) || 5,
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
          progress_contents: progressContents,
        };
      });
    } catch (error) {
      console.error('載入現有目標失敗:', error);
      return [];
    }
  };

  // 切換目標完成狀態
  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    try {
      console.log(`切換目標 ${goalId} 的完成狀態: ${currentStatus} -> ${!currentStatus}`);
      
      const { error } = await supabase
        .from('hanami_growth_goals')
        .update({ is_completed: !currentStatus })
        .eq('id', goalId);
      
      if (error) {
        console.error('切換目標完成狀態失敗:', error);
        throw error;
      }
      
      console.log('目標完成狀態切換成功');
      
      // 重新載入資料以更新顯示
      await loadAllData();
    } catch (error) {
      console.error('切換目標完成狀態失敗:', error);
      setError(`切換目標完成狀態失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hanami-text mb-2">
              成長樹管理
            </h1>
            <p className="text-hanami-text-secondary">
              管理教學成長樹和學習目標
            </p>
          </div>
          <HanamiButton
            className="bg-gradient-to-r from-hanami-primary to-hanami-secondary"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            新增成長樹
          </HanamiButton>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
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
              onClick={() => window.location.href = '/admin/students'}
            >
              <Users className="w-4 h-4" />
              返回學生管理
            </button>
          </div>
        </div>

        {showAddModal && (
          <AddGrowthTreeModal
            abilitiesOptions={abilitiesOptions}
            activitiesOptions={activitiesOptions}
            editingTree={null}
            teachersOptions={teachersOptions}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddTree}
          />
        )}

        {editingTree && (
          <AddGrowthTreeModal
            abilitiesOptions={abilitiesOptions}
            activitiesOptions={activitiesOptions}
            editingTree={{
              ...editingTree,
              goals: getGoalsForTree(editingTree.id).map((g: any) => {
                console.log(`編輯模式 - 處理目標 ${g.goal_name} 的資料:`, g);
                
                // 確保進度內容是陣列且過濾空值
                const progressContents = Array.isArray(g.progress_contents) 
                  ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
                  : [];
                
                return {
                  goal_name: g.goal_name,
                  goal_description: g.goal_description || '',
                  goal_icon: g.goal_icon || '⭐',
                  progress_max: Number(g.progress_max) || 5,
                  required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
                  related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
                  progress_contents: progressContents,
                };
              }),
            }}
            teachersOptions={teachersOptions}
            onClose={() => setEditingTree(null)}
            onSubmit={handleUpdateTree}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map((tree) => {
            const treeGoals = getGoalsForTree(tree.id);
            const completedGoals = treeGoals.filter(goal => goal.is_completed).length;
            
            return (
              <HanamiCard key={tree.id} className="p-6 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer border border-[#EADBC8] relative" onClick={() => setEditingTree(tree)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-hanami-text mb-2 flex items-center gap-2">
                      <span className="text-2xl">{tree.tree_icon || '🌳'}</span>
                      {tree.tree_name}
                    </h3>
                    <p className="text-sm text-hanami-text-secondary mb-3">{tree.tree_description}</p>
                  </div>
                  <div className="flex space-x-2 absolute top-4 right-4 z-10">
                    <button
                      className="p-2 rounded-full bg-hanami-primary hover:bg-hanami-accent shadow text-hanami-text"
                      title="編輯"
                      onClick={e => { e.stopPropagation(); setEditingTree(tree); }}
                    >
                      <svg fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21H3v-4.5L15.232 5.232Z" stroke="#A64B2A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
                    </button>
                    <button
                      className="p-2 rounded-full bg-hanami-danger hover:bg-red-400 shadow text-hanami-text"
                      title="刪除"
                      onClick={e => { e.stopPropagation(); handleDeleteTree(tree.id); }}
                    >
                      <svg fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="M6 18 18 6M6 6l12 12" stroke="#A64B2A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-hanami-text-secondary gap-2">
                    <span>課程類型: {tree.course_type}</span>
                    <span>等級: Lv.{tree.tree_level || 1}</span>
                    <span>狀態: {tree.is_active ? '啟用' : '停用'}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-hanami-text">目標進度</span>
                    <span className="text-sm text-hanami-text-secondary">{completedGoals}/{treeGoals.length}</span>
                  </div>
                  <div className="w-full bg-hanami-surface rounded-full h-2">
                    <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary h-2 rounded-full transition-all duration-300" style={{ width: `${treeGoals.length > 0 ? (completedGoals / treeGoals.length) * 100 : 0}%` }} />
                  </div>
                </div>
                {treeGoals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-hanami-text mb-2">目標列表:</p>
                    <div className="space-y-1">
                      {treeGoals.slice(0, 3).map((goal) => (
                        <div 
                          key={goal.id} 
                          className="flex items-center text-sm gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                          title={`點擊切換完成狀態: ${goal.is_completed ? '已完成' : '未完成'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGoalCompletion(goal.id, goal.is_completed);
                          }}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${goal.is_completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={`text-xs ${goal.is_completed ? 'text-green-600' : 'text-hanami-text-secondary'}`}>
                            {goal.goal_icon || '⭐'} {goal.goal_name}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {goal.is_completed ? '✓' : '○'}
                          </span>
                        </div>
                      ))}
                      {treeGoals.length > 3 && (
                        <p className="text-xs text-hanami-text-secondary">還有 {treeGoals.length - 3} 個目標...</p>
                      )}
                    </div>
                  </div>
                )}
              </HanamiCard>
            );
          })}
        </div>

        {trees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-hanami-text-secondary">尚無成長樹</p>
          </div>
        )}
      </div>
    </div>
  );
} 
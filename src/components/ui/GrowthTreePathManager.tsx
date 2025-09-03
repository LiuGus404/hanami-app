'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, PlayIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { HanamiButton, HanamiCard } from './index';
import { supabase } from '@/lib/supabase';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  nodes: LearningNode[];
  startNodeId: string;
  endNodeId: string;
  totalDuration: number;
  difficulty: number;
  tags: string[];
}

interface LearningNode {
  id: string;
  title: string;
  description: string;
  type: 'start' | 'activity' | 'milestone' | 'end' | 'break';
  position: { x: number; y: number };
  duration: number;
  reward: string;
  isCompleted: boolean;
  isLocked: boolean;
  connections: string[];
  order?: number;
  activityId?: string;
}

interface StudentActivity {
  id: string;
  student_id: string;
  tree_id: string;
  activity_id: string;
  assignment_type: 'current_lesson' | 'ongoing';
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  assigned_date: string;
  completed_date?: string;
  activity?: {
    id: string;
    activity_name: string;
    activity_description?: string;
    estimated_duration?: number;
  };
}

interface GrowthTreePathManagerProps {
  studentId: string;
  treeId: string;
  studentTrees: Array<{
    id: string;
    tree_name: string;
    status: string;
    start_date: string;
  }>;
  currentActivities: StudentActivity[];
  onActivityAssigned: (activity: StudentActivity) => void;
  onTreeChange?: (newTreeId: string) => void;
  onClose: () => void;
}

export default function GrowthTreePathManager({
  studentId,
  treeId,
  studentTrees,
  currentActivities,
  onActivityAssigned,
  onTreeChange,
  onClose
}: GrowthTreePathManagerProps) {
  const [loading, setLoading] = useState(true);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [orderedNodes, setOrderedNodes] = useState<LearningNode[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState<number>(-1);
  const [showPathList, setShowPathList] = useState(true);
  const [currentTreeId, setCurrentTreeId] = useState(treeId);
  const [learningPathData, setLearningPathData] = useState<any>(null);

  // 數據轉換：將 API 返回的數據結構轉換為 StudentActivity 接口
  const normalizedCurrentActivities = React.useMemo(() => {
    if (!currentActivities || currentActivities.length === 0) return [];
    
    return currentActivities.map((activity: any) => {
      // 檢查是否已經是正確的結構
      if (activity.activity_id && typeof activity.activity_id === 'string') {
        return activity as StudentActivity;
      }
      
      // 轉換 API 返回的數據結構
      const normalized: StudentActivity = {
        id: activity.id || '',
        student_id: studentId,
        tree_id: currentTreeId,
        // 關鍵修復：使用 API 返回的 activityId（對應 hanami_teaching_activities.id）
        // 而不是 hanami_student_activities.activity_id
        activity_id: activity.activityId || activity.activity_id || '',
        assignment_type: activity.assignment_type || 'ongoing',
        progress: activity.progress || (activity.completionStatus === 'completed' ? 100 : 0),
        status: (() => {
          if (activity.completionStatus === 'completed') return 'completed';
          if (activity.completionStatus === 'in_progress') return 'in_progress';
          return 'not_started';
        })(),
        assigned_date: activity.assignedAt || activity.assigned_date || new Date().toISOString(),
        completed_date: activity.completionStatus === 'completed' ? activity.completed_date : undefined,
        activity: activity.activityName ? {
          id: activity.activityId || '',
          activity_name: activity.activityName || '',
          activity_description: activity.activityDescription || '',
          estimated_duration: activity.estimatedDuration || 0
        } : undefined
      };
      
      return normalized;
    });
  }, [currentActivities, studentId, currentTreeId]);

  // 調試：顯示轉換後的數據
  useEffect(() => {
    console.log('=== 數據轉換調試 ===');
    console.log('原始 currentActivities:', currentActivities);
    console.log('轉換後的 normalizedCurrentActivities:', normalizedCurrentActivities);
    console.log('轉換後的活動 ID 列表:', normalizedCurrentActivities.map(a => a.activity_id));
  }, [currentActivities, normalizedCurrentActivities]);

  // 監聽 treeId prop 的變化
  useEffect(() => {
    console.log('treeId prop 變化:', treeId);
    setCurrentTreeId(treeId);
  }, [treeId]);

  // 監聽 normalizedCurrentActivities 的變化，重新計算當前活動索引
  useEffect(() => {
    if (normalizedCurrentActivities.length > 0) {
      console.log('normalizedCurrentActivities 變化，重新計算活動索引');
      determineCurrentActivityIndex();
    }
  }, [normalizedCurrentActivities]);

  // 載入學習路徑數據
  const loadLearningPathData = useCallback(async () => {
    try {
      console.log('開始載入學習路徑數據...');
      console.log('查詢條件 - tree_id:', currentTreeId);
      console.log('查詢條件 - is_active: true');
      
      // 首先檢查 hanami_learning_paths 表是否存在
      console.log('=== 檢查資料庫表狀態 ===');
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_learning_paths')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('檢查 hanami_learning_paths 表失敗:', tableError);
        console.error('這可能表示表不存在或沒有權限訪問');
        return null;
      }
      
      console.log('hanami_learning_paths 表存在，可以正常查詢');
      
      // 檢查是否有任何學習路徑數據
      const { data: allPaths, error: allPathsError } = await supabase
        .from('hanami_learning_paths')
        .select('id, name, tree_id, is_active')
        .limit(5);
      
      if (allPathsError) {
        console.error('查詢所有學習路徑失敗:', allPathsError);
      } else {
        console.log('資料庫中的學習路徑總覽:', allPaths);
        console.log('總數量:', allPaths?.length || 0);
      }
      
      // 檢查是否有其他表包含學習路徑數據
      console.log('=== 檢查其他可能的學習路徑表 ===');
      
      // 檢查 hanami_learning_nodes 表
      const { data: learningNodes, error: learningNodesError } = await supabase
        .from('hanami_learning_nodes')
        .select('*')
        .limit(5);
      
      if (learningNodesError) {
        console.log('hanami_learning_nodes 表不存在或無法訪問');
      } else {
        console.log('hanami_learning_nodes 表數據:', learningNodes);
        console.log('節點數量:', learningNodes?.length || 0);
      }
      
      // 檢查 hanami_student_learning_progress 表
      const { data: studentProgress, error: studentProgressError } = await supabase
        .from('hanami_student_learning_progress')
        .select('*')
        .eq('student_id', studentId)
        .limit(5);
      
      if (studentProgressError) {
        console.log('hanami_student_learning_progress 表不存在或無法訪問');
      } else {
        console.log('學生學習進度數據:', studentProgress);
        console.log('進度記錄數量:', studentProgress?.length || 0);
      }
      
      // 從 hanami_learning_paths 表載入學習路徑
      const { data: pathData, error: pathError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .eq('tree_id', currentTreeId)
        .eq('is_active', true)
        .single();

      if (pathError) {
        if (pathError.code === 'PGRST116') {
          console.log('沒有找到學習路徑數據 (PGRST116)');
          console.log('這表示 hanami_learning_paths 表中沒有對應的記錄');
          console.log('需要檢查：');
          console.log('1. 表是否存在');
          console.log('2. 是否有 tree_id 為', currentTreeId, '的記錄');
          console.log('3. 記錄的 is_active 是否為 true');
          
          // 嘗試不限制 is_active 來查找記錄
          console.log('嘗試查找不限制 is_active 的記錄...');
          const { data: anyPathData, error: anyPathError } = await supabase
            .from('hanami_learning_paths')
            .select('*')
            .eq('tree_id', currentTreeId)
            .limit(1);
          
          if (anyPathError) {
            console.error('查找任何記錄也失敗:', anyPathError);
          } else if (anyPathData && anyPathData.length > 0) {
            console.log('找到記錄，但 is_active 可能不是 true:', anyPathData[0]);
            console.log('記錄的 is_active 值:', anyPathData[0].is_active);
          } else {
            console.log('完全沒有找到 tree_id 為', currentTreeId, '的記錄');
          }
        } else {
          console.error('載入學習路徑失敗:', pathError);
          console.error('錯誤詳情:', {
            message: pathError.message,
            details: pathError.details,
            hint: pathError.hint,
            code: pathError.code
          });
        }
        
        // 不要在這裡 return null，讓函數繼續執行後面的邏輯
        console.log('將嘗試從 hanami_tree_activities 表載入數據');
      } else if (pathData) {
        console.log('找到學習路徑數據:', pathData);
        console.log('學習路徑名稱:', pathData.name);
        console.log('學習路徑描述:', pathData.description);
        console.log('學習路徑節點數量:', pathData.nodes?.length || 0);
        console.log('學習路徑節點詳情:', pathData.nodes);
        
        // 檢查節點結構
        if (pathData.nodes && pathData.nodes.length > 0) {
          console.log('=== 節點結構分析 ===');
          pathData.nodes.forEach((node: any, index: number) => {
            console.log(`節點 ${index}:`, {
              id: node.id,
              node_type: node.node_type,
              title: node.title,
              description: node.description,
              metadata: node.metadata,
              has_activity_id: !!node.metadata?.activity_id
            });
          });
          
          // 檢查活動節點
          const activityNodes = pathData.nodes.filter((node: any) => 
            node.node_type === 'activity'
          );
          console.log('活動節點數量:', activityNodes.length);
          console.log('活動節點詳情:', activityNodes);
          
          // 檢查有 activity_id 的節點
          const nodesWithActivityId = pathData.nodes.filter((node: any) => 
            node.node_type === 'activity' && node.metadata?.activity_id
          );
          console.log('有 activity_id 的節點數量:', nodesWithActivityId.length);
          console.log('有 activity_id 的節點詳情:', nodesWithActivityId);
        } else {
          console.log('學習路徑數據存在，但 nodes 欄位為空或未定義');
          console.log('pathData.nodes:', pathData.nodes);
          console.log('pathData.nodes 類型:', typeof pathData.nodes);
          console.log('pathData.nodes 是否為陣列:', Array.isArray(pathData.nodes));
        }
        
        setLearningPathData(pathData);
        return pathData;
      }
      
      // 如果 hanami_learning_paths 表沒有數據，嘗試從 hanami_tree_activities 表載入
      console.log('=== 嘗試從 hanami_tree_activities 表載入學習路徑數據 ===');
      
      try {
        const { data: treeActivities, error: treeActivitiesError } = await supabase
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
              instructions
            )
          `)
          .eq('tree_id', currentTreeId)
          .eq('is_active', true)
          .order('activity_order', { ascending: true });

        if (treeActivitiesError) {
          console.error('載入 hanami_tree_activities 失敗:', treeActivitiesError);
          return null;
        }

        if (treeActivities && treeActivities.length > 0) {
          console.log('從 hanami_tree_activities 表找到數據:', treeActivities);
          console.log('活動數量:', treeActivities.length);
          
          // 驗證活動是否屬於當前成長樹
          const validActivities = treeActivities.filter(ta => {
            if (ta.tree_id !== currentTreeId) {
              console.log('發現不屬於當前成長樹的活動:', ta.id, 'tree_id:', ta.tree_id, 'currentTreeId:', currentTreeId);
              return false;
            }
            return true;
          });
          
          console.log('驗證後的有效活動數量:', validActivities.length);
          
          if (validActivities.length === 0) {
            console.log('當前成長樹沒有有效的活動數據');
            return null;
          }
          
          // 篩選核心學習活動 - 顯示 0006-貓鬚下的白鍵 和 0002-認識琴鍵兔耳
          const coreActivities = validActivities.filter(ta => {
            const activityName = ta.hanami_teaching_activities?.activity_name || ta.custom_activity_name;
            if (!activityName) return false;
            
            // 包含 0006 和 0002 的活動
            return activityName.includes('0006') || activityName.includes('0002');
          });
          
          // 如果沒有找到 0006 和 0002 的活動，嘗試顯示前幾個活動
          let finalActivities = coreActivities;
          if (coreActivities.length === 0) {
            console.log('沒有找到 0006 和 0002 的活動，將顯示前幾個活動');
            finalActivities = validActivities.slice(0, 3); // 顯示前3個活動
          }
          
          // 確保活動順序正確：0006 在前，0002 在後
          const sortedCoreActivities = finalActivities.sort((a, b) => {
            const nameA = a.hanami_teaching_activities?.activity_name || a.custom_activity_name;
            const nameB = b.hanami_teaching_activities?.activity_name || b.custom_activity_name;
            
            // 0006 應該排在 0002 前面
            if (nameA.includes('0006') && nameB.includes('0002')) return -1;
            if (nameA.includes('0002') && nameB.includes('0006')) return 1;
            
            // 如果沒有 0006 和 0002，按原始順序排列
            return 0;
          });
          
          console.log('篩選後的核心活動數量:', sortedCoreActivities.length);
          console.log('核心活動名稱:', sortedCoreActivities.map(ta => 
            ta.hanami_teaching_activities?.activity_name || ta.custom_activity_name
          ));
          
          // 如果仍然沒有活動，返回 null
          if (sortedCoreActivities.length === 0) {
            console.log('沒有找到任何可用的活動');
            return null;
          }
          
          // 創建學習路徑數據結構
          const learningPathData = {
            id: `tree-${currentTreeId}`,
            name: `成長樹 ${currentTreeId} 學習路徑`,
            description: '從 hanami_tree_activities 表生成的核心學習路徑',
            nodes: sortedCoreActivities.map((ta, index) => ({
              id: ta.id,
              node_type: 'activity',
              title: ta.hanami_teaching_activities?.activity_name || ta.custom_activity_name || `活動 ${index + 1}`,
              description: ta.hanami_teaching_activities?.activity_description || ta.custom_activity_description || '',
              duration: ta.estimated_duration || ta.hanami_teaching_activities?.duration_minutes || 30,
              difficulty: ta.difficulty_level || 1,
              metadata: {
                activity_id: ta.activity_id,
                activity_source: ta.activity_source,
                activity_type: ta.activity_type
              }
            }))
          };
          
          console.log('生成的學習路徑數據:', learningPathData);
          console.log('生成的節點數量:', learningPathData.nodes.length);
          console.log('生成的節點詳情:', learningPathData.nodes);
          setLearningPathData(learningPathData);
          return learningPathData;
        } else {
          console.log('hanami_tree_activities 表中沒有找到數據');
          return null;
        }
      } catch (error) {
        console.error('從 hanami_tree_activities 表載入數據時發生錯誤:', error);
        return null;
      }
    } catch (error) {
      console.error('載入學習路徑數據時發生錯誤:', error);
      console.error('錯誤詳情:', {
        message: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }, [currentTreeId, studentId]);

  const loadLearningPath = useCallback(async () => {
    try {
      setLoading(true);
      console.log('=== 開始載入學習路徑 ===');
      console.log('currentTreeId:', currentTreeId);
      console.log('treeId prop:', treeId);
      console.log('studentId:', studentId);
      
      // 先載入學習路徑數據
      const pathData = await loadLearningPathData();
      
      if (pathData) {
        console.log('成功載入學習路徑數據，將使用學習路徑篩選活動');
        console.log('學習路徑節點:', pathData.nodes);
        
        // 如果有學習路徑數據，直接使用它來創建節點
        const ordered = getOrderedNodes(pathData);
        setOrderedNodes(ordered);
        determineCurrentActivityIndex(ordered);
        
        // 設置學習路徑數據
        setLearningPathData(pathData);
        
        // 創建一個預設的 learningPath 對象（為了兼容性）
        const defaultLearningPath: LearningPath = {
          id: pathData.id || 'default',
          name: pathData.name || '預設學習路徑',
          description: pathData.description || '',
          nodes: [],
          startNodeId: 'start',
          endNodeId: 'end',
          totalDuration: 0,
          difficulty: 1,
          tags: []
        };
        setLearningPath(defaultLearningPath);
        
        console.log('使用學習路徑數據創建節點完成');
        return;
      } else {
        console.log('沒有學習路徑數據，清空相關狀態');
        
        // 清空所有相關狀態，避免顯示舊的數據
        setLearningPathData(null);
        setOrderedNodes([]);
        setLearningPath({
          id: 'empty',
          name: '無學習路徑',
          description: '該成長樹沒有學習路徑數據',
          nodes: [],
          startNodeId: 'start',
          endNodeId: 'end',
          totalDuration: 0,
          difficulty: 1,
          tags: []
        });
        
        // 重置當前活動索引
        setCurrentActivityIndex(0);
        
        // 結束載入狀態
        setLoading(false);
        
        console.log('狀態已清空，載入狀態已結束，將顯示空狀態');
        return;
      }
      
      // 如果沒有學習路徑數據，使用原有的邏輯載入所有活動
      // 載入學生在該成長樹的進度信息
      const { data: studentTreeData, error: studentTreeError } = await supabase
        .from('hanami_student_trees')
        .select('*')
        .eq('student_id', studentId)
        .eq('tree_id', currentTreeId)
        .single();

      console.log('學生成長樹進度:', studentTreeData);

      // 載入成長樹的目標和相關活動
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select(`
          *,
          related_activities
        `)
        .eq('tree_id', treeId)
        .order('goal_order');

      // 收集所有相關活動ID
      const allRelatedActivityIds: string[] = [];
      if (goalsData && goalsData.length > 0) {
        goalsData.forEach(goal => {
          if (goal.related_activities && Array.isArray(goal.related_activities)) {
            allRelatedActivityIds.push(...goal.related_activities);
          }
        });
      }

      // 載入相關活動的詳細信息
      let relatedActivitiesData: any[] = [];
      if (allRelatedActivityIds.length > 0) {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('hanami_teaching_activities')
          .select('*')
          .in('id', allRelatedActivityIds);

        if (!activitiesError && activitiesData) {
          relatedActivitiesData = activitiesData;
        }
      }

      // 優先載入成長樹對應的活動
      let activitiesData: any[] = [];
      console.log('開始載入成長樹對應的活動');
      
      // 使用 hanami_tree_activities 表來載入成長樹對應的活動
      console.log('=== 開始載入成長樹活動 ===');
      console.log('查詢條件 - tree_id:', currentTreeId);
      console.log('查詢條件 - is_active: true');
      
      try {
        const { data: treeActivities, error: treeActivitiesError } = await supabase
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
                instructions
              )
            `)
            .eq('tree_id', currentTreeId)
            .eq('is_active', true)
            .order('activity_order', { ascending: true });

          if (treeActivitiesError) {
            console.error('載入成長樹活動失敗:', treeActivitiesError);
            console.error('錯誤詳情:', {
              message: treeActivitiesError.message,
              details: treeActivitiesError.details,
              hint: treeActivitiesError.hint,
              code: treeActivitiesError.code
            });
            throw treeActivitiesError;
          }

          console.log('=== 成長樹活動查詢結果 ===');
          console.log('載入的成長樹活動:', treeActivities);
          console.log('成長樹活動數量:', treeActivities?.length || 0);
          console.log('活動詳情:', treeActivities?.map(ta => ({
            id: ta.id,
            tree_id: ta.tree_id,
            activity_id: ta.activity_id,
            activity_source: ta.activity_source,
            custom_activity_name: ta.custom_activity_name,
            has_teaching_activity: !!ta.hanami_teaching_activities
          })));

          if (treeActivities && treeActivities.length > 0) {
            // 將成長樹活動轉換為活動數據格式
            activitiesData = treeActivities.map(treeActivity => {
              if (treeActivity.activity_source === 'teaching' && treeActivity.hanami_teaching_activities) {
                // 使用教學活動的數據
                const teachingActivity = treeActivity.hanami_teaching_activities;
                return {
                  id: treeActivity.activity_id || treeActivity.id,
                  activity_name: teachingActivity.activity_name,
                  activity_description: teachingActivity.activity_description,
                  activity_type: teachingActivity.activity_type,
                  difficulty_level: teachingActivity.difficulty_level,
                  duration_minutes: teachingActivity.duration_minutes,
                  estimated_duration: treeActivity.estimated_duration || teachingActivity.duration_minutes || 30,
                  materials_needed: teachingActivity.materials_needed,
                  instructions: teachingActivity.instructions,
                  is_active: true,
                  // 保留排序相關欄位
                  activity_order: treeActivity.activity_order,
                  priority_order: treeActivity.priority_order
                };
              } else {
                // 使用自定義活動的數據
                return {
                  id: treeActivity.id,
                  activity_name: treeActivity.custom_activity_name || '未命名活動',
                  activity_description: treeActivity.custom_activity_description || '',
                  activity_type: treeActivity.activity_type || 'custom',
                  difficulty_level: treeActivity.difficulty_level || 1,
                  duration_minutes: treeActivity.estimated_duration || 30,
                  estimated_duration: treeActivity.estimated_duration || 30,
                  materials_needed: [],
                  instructions: '',
                  is_active: true,
                  // 保留排序相關欄位
                  activity_order: treeActivity.activity_order,
                  priority_order: treeActivity.priority_order
                };
              }
            });

            console.log('=== 活動數據轉換結果 ===');
            console.log('轉換後的活動數據:', activitiesData);
            console.log('轉換後的活動數量:', activitiesData.length);
            console.log('轉換後的活動名稱:', activitiesData.map(a => a.activity_name));
          } else {
            console.log('沒有找到成長樹活動，嘗試載入所有活動作為備用');
            
            // 備用方案：載入所有活動
            const { data: allActivities, error: activitiesError } = await supabase
              .from('hanami_teaching_activities')
              .select('*')
              .eq('is_active', true)
              .order('activity_name')
              .limit(50);
            
            if (!activitiesError && allActivities) {
              activitiesData = allActivities;
              console.log('載入的備用活動:', allActivities);
            } else {
              console.error('載入備用活動失敗:', activitiesError);
            }
          }
        } catch (error) {
          console.error('載入成長樹活動時發生錯誤:', error);
          
          // 錯誤處理：載入所有活動作為備用
          const { data: allActivities, error: activitiesError } = await supabase
            .from('hanami_teaching_activities')
            .select('*')
            .eq('is_active', true)
            .order('activity_name')
            .limit(50);
          
          if (!activitiesError && allActivities) {
            activitiesData = allActivities;
            console.log('載入的備用活動:', allActivities);
          } else {
            console.error('載入備用活動失敗:', activitiesError);
          }
        }

      if (goalsError) {
        console.error('載入成長樹目標失敗:', goalsError);
        // 不拋出錯誤，繼續執行
      }

      console.log('載入的成長樹目標:', goalsData);
      console.log('目標數量:', goalsData?.length || 0);
      console.log('載入的活動數據:', activitiesData);
      console.log('相關活動ID:', allRelatedActivityIds);
      console.log('相關活動詳細數據:', relatedActivitiesData);

      // 載入成長樹資訊（提前載入，因為後續載入活動需要用到）
      const { data: treeData, error: treeError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('id', currentTreeId)
        .single();

      if (treeError) {
        console.error('載入成長樹資訊失敗:', treeError);
        // 不拋出錯誤，繼續執行
      }

      console.log('載入的成長樹資訊:', treeData);

      // 載入學生的進度記錄
      const { data: studentProgressData, error: progressError } = await supabase
        .from('hanami_student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false });

      console.log('學生進度記錄:', studentProgressData);

      // 構建學習路徑
      const nodes: LearningNode[] = [
        {
          id: 'start',
          title: '開始學習',
          description: '學習旅程的起點',
          type: 'start',
          position: { x: 200, y: 300 },
          duration: 0,
          reward: '開始學習的勇氣',
          isCompleted: false,
          isLocked: false,
          connections: activitiesData && activitiesData.length > 0 ? ['activity-1'] : (goalsData && goalsData.length > 0 ? ['goal-1'] : ['end'])
        }
      ];

      // 添加目標節點或直接活動節點
      console.log('檢查節點創建條件:');
      console.log('- goalsData:', goalsData);
      console.log('- goalsData.length:', goalsData?.length);
      console.log('- activitiesData:', activitiesData);
      console.log('- activitiesData.length:', activitiesData?.length);
      console.log('- studentProgressData:', studentProgressData);
      console.log('- studentProgressData.length:', studentProgressData?.length);
      
      console.log('條件檢查:');
      console.log('- goalsData && goalsData.length > 0:', goalsData && goalsData.length > 0);
      console.log('- activitiesData && activitiesData.length > 0:', activitiesData && activitiesData.length > 0);
      console.log('- studentProgressData && studentProgressData.length > 0:', studentProgressData && studentProgressData.length > 0);

      if (activitiesData && activitiesData.length > 0) {
        console.log('使用成長樹活動創建節點');
        console.log('活動數據詳情:', activitiesData);
        
        let finalActivities = activitiesData;
        
        // 檢查是否有現有的學習路徑數據
        if (pathData && pathData.nodes && pathData.nodes.length > 0) {
          console.log('使用學習路徑數據篩選活動...');
          console.log('學習路徑節點:', pathData.nodes);
          
          // 從學習路徑節點中提取活動節點
          const pathActivityNodes = pathData.nodes.filter((node: any) => {
            const isActivity = node.node_type === 'activity';
            const hasActivityId = !!node.metadata?.activity_id;
            const hasId = !!node.id;
            console.log(`篩選節點 ${node.id}:`, {
              node_type: node.node_type,
              is_activity: isActivity,
              has_activity_id: hasActivityId,
              has_id: hasId,
              metadata: node.metadata,
              node: node
            });
            // 只要節點類型是 activity 且有 ID，就認為是有效的活動節點
            return isActivity && hasId;
          });
          
          console.log('路徑中的活動節點:', pathActivityNodes);
          console.log('路徑活動節點數量:', pathActivityNodes.length);
          
          if (pathActivityNodes.length > 0) {
            // 根據學習路徑中定義的活動順序篩選
            const pathActivityIds = pathActivityNodes.map((node: any) => node.metadata.activity_id);
            console.log('路徑活動ID列表:', pathActivityIds);
            
            finalActivities = activitiesData.filter(activity => 
              pathActivityIds.includes(activity.id)
            );
            
            console.log('篩選後的活動數量:', finalActivities.length);
            console.log('篩選後的活動:', finalActivities.map(a => a.activity_name));
            
            // 按照學習路徑中的順序排列
            finalActivities.sort((a, b) => {
              const aIndex = pathActivityIds.indexOf(a.id);
              const bIndex = pathActivityIds.indexOf(b.id);
              console.log(`路徑排序比較: ${a.activity_name} (路徑索引: ${aIndex}) vs ${b.activity_name} (路徑索引: ${bIndex})`);
              return aIndex - bIndex;
            });
            
            console.log('根據學習路徑篩選後的活動:', finalActivities.map((a, index) => 
              `${index + 1}. ${a.activity_name} (路徑順序: ${pathActivityIds.indexOf(a.id) + 1})`
            ));
          } else {
            console.log('學習路徑中沒有活動節點，使用預設排序');
            // 按照 hanami_tree_activities 表中的 activity_order 欄位排序
            finalActivities = [...activitiesData].sort((a, b) => {
              const aOrder = a.activity_order || a.priority_order || 0;
              const bOrder = b.activity_order || b.priority_order || 0;
              
              console.log(`排序比較: ${a.activity_name} (${aOrder}) vs ${b.activity_name} (${bOrder})`);
              
              return aOrder - bOrder;
            });
            
            console.log('排序後的活動順序:', finalActivities.map((a, index) => 
              `${index + 1}. ${a.activity_name} (排序值: ${a.activity_order || a.priority_order || 0})`
            ));
          }
        } else {
          console.log('沒有學習路徑數據，使用預設排序');
          // 按照 hanami_tree_activities 表中的 activity_order 欄位排序
          finalActivities = [...activitiesData].sort((a, b) => {
            const aOrder = a.activity_order || a.priority_order || 0;
            const bOrder = b.activity_order || b.priority_order || 0;
            
            console.log(`排序比較: ${a.activity_name} (${aOrder}) vs ${b.activity_name} (${bOrder})`);
            
            return aOrder - bOrder;
          });
          
          console.log('排序後的活動順序:', finalActivities.map((a, index) => 
            `${index + 1}. ${a.activity_name} (排序值: ${a.activity_order || a.priority_order || 0})`
          ));
        }
        
        console.log('最終活動順序:', finalActivities.map((a, index) => 
          `${index + 1}. ${a.activity_name} (排序值: ${a.activity_order || a.priority_order || 0})`
        ));
        
        // 使用成長樹活動創建節點
        finalActivities.forEach((activity, index) => {
          const activityNode: LearningNode = {
            id: `activity-${index + 1}`,
            title: activity.activity_name,
            description: activity.activity_description || '',
            type: 'activity',
            position: { x: 400, y: 300 + (index * 100) },
            duration: activity.estimated_duration || activity.duration_minutes || 30,
            reward: `完成活動：${activity.activity_name}`,
            isCompleted: false,
            isLocked: false,
            connections: index < finalActivities.length - 1 ? [`activity-${index + 2}`] : ['end'],
            order: index + 1,
            activityId: activity.id
          };
          nodes.push(activityNode);
        });
      } else if (goalsData && goalsData.length > 0) {
        console.log('使用目標創建節點（備用方案）');
        // 使用目標創建節點（備用方案）
        goalsData.forEach((goal, index) => {
          // 檢查是否有相關活動
          const hasRelatedActivities = goal.related_activities && 
            Array.isArray(goal.related_activities) && 
            goal.related_activities.length > 0;
          
          // 找到對應的活動數據
          let activityData = null;
          if (hasRelatedActivities) {
            activityData = relatedActivitiesData.find(activity => 
              activity.id === goal.related_activities[0]
            );
          }
          
          // 檢查學生是否已完成此目標
          const isCompleted = studentTreeData?.completed_goals?.includes(goal.id) || goal.is_completed;
          const isCurrentGoal = studentTreeData?.current_goal_id === goal.id;
          
          const goalNode: LearningNode = {
            id: `goal-${index + 1}`,
            title: activityData ? activityData.activity_name : goal.goal_name,
            description: activityData ? activityData.activity_description : (goal.goal_description || ''),
            type: 'activity',
            position: { x: 400, y: 300 + (index * 100) },
            duration: activityData ? (activityData.estimated_duration || activityData.duration_minutes || 30) : 30,
            reward: `完成目標：${goal.goal_name}`,
            isCompleted: isCompleted,
            isLocked: false,
            connections: index < goalsData.length - 1 ? [`goal-${index + 2}`] : ['end'],
            order: index + 1,
            activityId: hasRelatedActivities ? goal.related_activities[0] : goal.id // 優先使用相關活動ID
          };
          nodes.push(goalNode);
        });
      } else if (studentProgressData && studentProgressData.length > 0) {
        console.log('使用直接活動創建節點');
        console.log('活動數據詳情:', activitiesData);
        // 使用直接活動創建節點
        activitiesData.forEach((activity, index) => {
          const activityNode: LearningNode = {
            id: `activity-${index + 1}`,
            title: activity.activity_name,
            description: activity.activity_description || '',
            type: 'activity',
            position: { x: 400, y: 300 + (index * 100) },
            duration: activity.estimated_duration || activity.duration_minutes || 30,
            reward: `完成活動：${activity.activity_name}`,
            isCompleted: false,
            isLocked: false,
            connections: index < activitiesData.length - 1 ? [`activity-${index + 2}`] : ['end'],
            order: index + 1,
            activityId: activity.id
          };
          nodes.push(activityNode);
        });
        
        console.log('創建的活動節點:', nodes.filter(n => n.type === 'activity'));
        
        // 更新開始節點的連接
        if (activitiesData.length > 0) {
          const startNode = nodes.find(n => n.id === 'start');
          if (startNode) {
            startNode.connections = ['activity-1'];
            console.log('更新開始節點連接:', startNode.connections);
          }
        }
      } else if (studentProgressData && studentProgressData.length > 0) {
        console.log('使用學生進度記錄創建節點');
        // 使用學生進度記錄創建節點
        const uniqueActivities = studentProgressData
          .filter(progress => progress.activity_id)
          .reduce((acc, progress) => {
            if (!acc.find(item => item.activity_id === progress.activity_id)) {
              acc.push(progress);
            }
            return acc;
          }, [] as any[]);

        uniqueActivities.forEach((progress, index) => {
          const activityNode: LearningNode = {
            id: `progress-${index + 1}`,
            title: `活動 ${progress.activity_id}`,
            description: `學生進度記錄中的活動`,
            type: 'activity',
            position: { x: 400, y: 300 + (index * 100) },
            duration: 30,
            reward: `完成活動`,
            isCompleted: progress.performance_rating >= 5, // 假設評分5分以上為完成
            isLocked: false,
            connections: index < uniqueActivities.length - 1 ? [`progress-${index + 2}`] : ['end'],
            order: index + 1,
            activityId: progress.activity_id
          };
          nodes.push(activityNode);
        });
      } else {
        console.log('沒有找到任何數據，將創建示例節點');
      }

      // 添加結束節點
      nodes.push({
        id: 'end',
        title: '完成學習',
        description: '恭喜完成學習旅程！',
        type: 'end',
        position: { x: 600, y: 300 },
        duration: 0,
        reward: '學習成就證書',
        isCompleted: false,
        isLocked: false,
        connections: []
      });

      // 創建最終學習路徑
      const finalLearningPath: LearningPath = {
        id: `path-${currentTreeId}`,
        name: `${treeData?.tree_name || '學習路徑'} 學習路徑`,
        description: treeData?.tree_description || '基於成長樹目標的學習路徑',
        nodes,
        startNodeId: 'start',
        endNodeId: 'end',
        totalDuration: nodes.reduce((sum, node) => sum + node.duration, 0),
        difficulty: 1,
        tags: []
      };
      
      setLearningPath(finalLearningPath);
    } catch (error) {
      console.error('載入學習路徑失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTreeId, treeId, studentId, loadLearningPathData, getOrderedNodes, determineCurrentActivityIndex]);

  // 處理學習路徑更新
  useEffect(() => {
    // 優先使用 learningPathData，如果沒有則使用 learningPath
    if (learningPathData && learningPathData.nodes && learningPathData.nodes.length > 0) {
      console.log('useEffect - 使用 learningPathData 創建節點');
      console.log('useEffect - learningPathData.nodes:', learningPathData.nodes);
      const ordered = getOrderedNodes(learningPathData);
      console.log('useEffect - ordered nodes (from learningPathData):', ordered);
      setOrderedNodes(ordered);
      determineCurrentActivityIndex(ordered);
    } else if (learningPath) {
      console.log('useEffect - 使用 learningPath 創建節點 (fallback)');
      console.log('useEffect - learningPath.nodes:', learningPath.nodes);
      const ordered = getOrderedNodes(learningPath);
      console.log('useEffect - ordered nodes (from learningPath):', ordered);
      setOrderedNodes(ordered);
      determineCurrentActivityIndex(ordered);
    }
  }, [learningPathData, learningPath, determineCurrentActivityIndex, getOrderedNodes]);

  // 載入學習路徑 - 只在 currentTreeId 變化時觸發
  useEffect(() => {
    if (currentTreeId) {
      console.log('載入學習路徑 - currentTreeId:', currentTreeId, 'treeId:', treeId);
      loadLearningPath();
    }
  }, [currentTreeId, loadLearningPath]);

  // 移除可能導致狀態競爭的 useEffect
  // useEffect(() => {
  //   // 優先使用 learningPathData，如果沒有則使用 learningPath
  //   if (learningPathData && learningPathData.nodes && learningPathData.nodes.length > 0) {
  //     console.log('useEffect - 使用 learningPathData 創建節點');
  //     console.log('useEffect - learningPathData.nodes:', learningPathData.nodes);
  //     const ordered = getOrderedNodes(learningPathData);
  //     console.log('useEffect - ordered nodes (from learningPathData):', ordered);
  //     setOrderedNodes(ordered);
  //     determineCurrentActivityIndex(ordered);
  //   } else if (learningPath) {
  //     console.log('useEffect - 使用 learningPath 創建節點 (fallback)');
  //     console.log('useEffect - learningPath.nodes:', learningPath.nodes);
  //     const ordered = getOrderedNodes(learningPath);
  //     console.log('useEffect - ordered nodes (from learningPath):', ordered);
  //     setOrderedNodes(ordered);
  //     determineCurrentActivityIndex(ordered);
  //   }
  // }, [learningPathData, learningPath, determineCurrentActivityIndex, getOrderedNodes]);

  const getOrderedNodes = useCallback((pathData: any): LearningNode[] => {
    console.log('getOrderedNodes - 開始處理學習路徑數據:', pathData);
    console.log('getOrderedNodes - pathData.nodes:', pathData?.nodes);
    console.log('getOrderedNodes - pathData.nodes.length:', pathData?.nodes?.length || 0);
    
    // 檢查是否有學習路徑數據
    if (pathData && pathData.nodes && pathData.nodes.length > 0) {
      console.log('使用學習路徑數據創建節點');
      console.log('學習路徑節點:', pathData.nodes);
      
      // 檢查節點結構
      console.log('=== getOrderedNodes 節點結構分析 ===');
      pathData.nodes.forEach((node: any, index: number) => {
        console.log(`節點 ${index}:`, {
          id: node.id,
          node_type: node.node_type,
          title: node.title,
          description: node.description,
          metadata: node.metadata,
          has_activity_id: !!node.metadata?.activity_id,
          activity_id: node.metadata?.activity_id
        });
      });
      
      const ordered: LearningNode[] = [];
      let orderCounter = 1;

      // 首先添加開始節點
      const startNode = {
        id: 'start',
        type: 'start',
        title: '開始學習',
        description: '學習旅程的起點',
        order: 0,
        isCompleted: false,
        isLocked: false
      };
      ordered.push(startNode);

      // 從學習路徑節點中提取活動節點
      const pathActivityNodes = pathData.nodes.filter((node: any) => {
        const isActivity = node.node_type === 'activity';
        const hasActivityId = !!node.metadata?.activity_id;
        const hasId = !!node.id;
        console.log(`篩選節點 ${node.id}:`, {
          node_type: node.node_type,
          is_activity: isActivity,
          has_activity_id: hasActivityId,
          has_id: hasId,
          metadata: node.metadata,
          node: node
        });
        // 只要節點類型是 activity 且有 ID，就認為是有效的活動節點
        return isActivity && hasId;
      });
      
      console.log('路徑中的活動節點:', pathActivityNodes);
      console.log('路徑活動節點數量:', pathActivityNodes.length);
      
      if (pathActivityNodes.length > 0) {
        // 按照學習路徑中的順序添加活動節點
        pathActivityNodes.forEach((pathNode: any) => {
          const activityNode = {
            id: pathNode.id || `activity-${orderCounter}`,
            type: 'activity',
            title: pathNode.title || `活動 ${orderCounter}`,
            description: pathNode.description || '',
            order: orderCounter,
            isCompleted: false,
            isLocked: false,
            activityId: pathNode.metadata?.activity_id,
            duration: pathNode.duration || 30,
            difficulty: pathNode.difficulty || 1
          };
          console.log('創建活動節點:', activityNode);
          ordered.push(activityNode);
          orderCounter++;
        });
      } else {
        console.log('學習路徑中沒有活動節點，返回空數組');
        // 如果沒有活動節點，返回空數組，讓組件顯示提示信息
        return [];
      }

      // 最後添加結束節點
      const endNode = {
        id: 'end',
        type: 'end',
        title: '完成學習',
        description: '恭喜完成學習旅程！',
        order: orderCounter,
        isCompleted: false,
        isLocked: false
      };
      ordered.push(endNode);

      console.log('getOrderedNodes - 返回的節點 (使用學習路徑):', ordered);
      return ordered;
    } else {
      console.log('沒有學習路徑數據，使用預設節點創建邏輯');
      // 原有的邏輯：使用預設的 learningPath.nodes
      const nodes = [...(pathData.nodes || [])];
      
      console.log('getOrderedNodes - 所有節點:', nodes);
      console.log('getOrderedNodes - 活動節點:', nodes.filter(n => n.type === 'activity'));
      
      const ordered: LearningNode[] = [];
      let orderCounter = 1;

      // 首先添加開始節點
      const startNode = nodes.find(n => n.id === 'start');
      if (startNode) {
        ordered.push(startNode);
      }

      // 然後添加活動節點
      const activityNodes = nodes.filter(n => n.type === 'activity');
      activityNodes.forEach(node => {
        node.order = orderCounter++;
        ordered.push(node);
      });

      // 最後添加結束節點
      const endNode = nodes.find(n => n.id === 'end');
      if (endNode) {
        ordered.push(endNode);
      }

      console.log('getOrderedNodes - 返回的節點 (預設邏輯):', ordered);
      return ordered;
    }
  }, []);

  const determineCurrentActivityIndex = useCallback((ordered?: LearningNode[]) => {
    // 使用傳入的 ordered 參數，或者使用 orderedNodes 狀態
    const nodesToUse = ordered || orderedNodes;
    
    if (!nodesToUse || nodesToUse.length === 0) {
      console.log('沒有節點數據，無法計算當前活動索引');
      setCurrentActivityIndex(-1);
      return;
    }
    
    const activityNodes = nodesToUse.filter(node => node.type === 'activity');
    
    console.log('=== determineCurrentActivityIndex 開始 ===');
    console.log('使用的節點數據:', nodesToUse);
    console.log('活動節點:', activityNodes);
    console.log('當前活動:', normalizedCurrentActivities);
    console.log('學習路徑數據:', learningPathData);
    
    // 找到最後一個已完成的目標
    let lastCompletedIndex = -1;
    for (let i = 0; i < activityNodes.length; i++) {
      const node = activityNodes[i];
      
      console.log(`檢查節點 ${i}:`, {
        title: node.title,
        activityId: node.activityId,
        isCompleted: node.isCompleted
      });
      
      // 優先檢查當前活動列表中的完成狀態
      if (node.activityId) {
        // 直接 ID 匹配
        let activity = normalizedCurrentActivities.find(a => a.activity_id === node.activityId);
        
        // 如果沒有找到，嘗試通過活動編號匹配
        if (!activity) {
          const extractNumber = (text?: string) => {
            if (!text) return '';
            const m = text.match(/^(\d{4})/);
            return m ? m[1] : '';
          };
          const nodeNum = extractNumber(node.title);
          
          if (nodeNum) {
            activity = normalizedCurrentActivities.find(a => {
              const nameNum = extractNumber(a.activity?.activity_name);
              return nodeNum === nameNum;
            });
            
            if (activity) {
              console.log(`通過活動編號匹配找到活動: ${nodeNum}`, activity);
            }
          }
        }
        
        if (activity) {
          console.log('找到對應活動:', {
            activity_id: activity.activity_id,
            status: activity.status,
            completion_status: activity.completion_status
          });
          
          if (activity.status === 'completed' || activity.completion_status === 'completed') {
            lastCompletedIndex = i;
            console.log(`節點 ${i} 在活動列表中已完成:`, node.title);
            continue;
          }
          if (activity.status === 'in_progress' || activity.completion_status === 'in_progress') {
            lastCompletedIndex = i;
            console.log(`節點 ${i} 在活動列表中進行中:`, node.title);
            continue;
          }
          if (activity.status === 'assigned' || activity.completion_status === 'assigned') {
            lastCompletedIndex = i;
            console.log(`節點 ${i} 在活動列表中已分配:`, node.title);
            continue;
          }
          
          // 如果狀態是 not_started，也視為已分配
          if (activity.status === 'not_started') {
            lastCompletedIndex = i;
            console.log(`節點 ${i} 在活動列表中已分配（未開始）:`, node.title);
            continue;
          }
          
          console.log(`節點 ${i} 狀態未知:`, activity.status);
          continue;
        } else {
          console.log(`節點 ${i} 在當前活動列表中未找到:`, node.activityId);
        }
      }
      
      // 檢查節點本身的完成狀態（備用）
      if (node.isCompleted) {
        lastCompletedIndex = i;
        console.log(`節點 ${i} 已完成:`, node.title);
        continue;
      }
      
      // 如果節點未完成，停止檢查
      console.log(`節點 ${i} 未完成:`, node.title);
      break;
    }

    // 下一個目標索引
    const nextIndex = lastCompletedIndex + 1;
    const finalIndex = nextIndex < activityNodes.length ? nextIndex : -1;
    
    console.log('當前活動索引計算結果:', {
      lastCompletedIndex,
      nextIndex,
      finalIndex,
      totalActivityNodes: activityNodes.length,
      nextActivityTitle: finalIndex >= 0 ? activityNodes[finalIndex]?.title : '無'
    });
    
    setCurrentActivityIndex(finalIndex);
  }, [normalizedCurrentActivities, learningPathData, orderedNodes]);

  const assignNextActivity = useCallback(async () => {
    if (!learningPath) return;

    const activityNodes = orderedNodes.filter(node => node.type === 'activity');
    
    console.log('=== 開始檢查活動分配狀態 ===');
    console.log('總活動節點數量:', activityNodes.length);
    console.log('當前活動列表:', normalizedCurrentActivities);
    console.log('活動節點詳情:', activityNodes.map((node, index) => ({
      index: index + 1,
      title: node.title,
      id: node.id,
      activityId: node.activityId
    })));
    console.log('學習路徑數據:', learningPathData);
    
    // 找到下一個未分配的活動
    let nextNode = null;
    let nextNodeIndex = -1;
    
    for (let i = 0; i < activityNodes.length; i++) {
      const node = activityNodes[i];
      
      // 檢查活動是否已經分配（支持三種匹配：activity_id、活動編號）
      const extractNumber = (text?: string) => {
        if (!text) return '';
        const m = text.match(/^(\d{4})/);
        return m ? m[1] : '';
      };
      const nodeNum = extractNumber(node.title);
      
      // 檢查是否已分配：通過 activity_id 或活動編號匹配
      const isAssigned = normalizedCurrentActivities.some(a => {
        // 直接 ID 匹配
        if (a.activity_id === node.activityId) {
          console.log(`活動 ${node.title} 通過 ID 匹配找到已分配記錄:`, a);
          return true;
        }
        
        // 活動編號匹配（如果節點有編號且活動有名稱）
        if (nodeNum && a.activity?.activity_name) {
          const activityNum = extractNumber(a.activity.activity_name);
          if (nodeNum === activityNum) {
            console.log(`活動 ${node.title} 通過編號匹配找到已分配記錄:`, a);
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`檢查節點 ${i + 1}:`, {
        title: node.title,
        activityId: node.activityId,
        nodeNum,
        isAssigned,
        hasActivityId: !!node.activityId
      });
      
      if (!isAssigned && node.activityId) {
        nextNode = node;
        nextNodeIndex = i;
        console.log(`找到下一個未分配活動:`, {
          index: i + 1,
          title: node.title,
          activityId: node.activityId
        });
        break;
      }
    }
    
    if (!nextNode) {
      console.log('沒有找到下一個未分配的活動');
      toast.error('沒有找到下一個未分配的活動');
      return;
    }
    
    console.log('準備分配活動:', {
      title: nextNode.title,
      activityId: nextNode.activityId,
      index: nextNodeIndex + 1
    });
    
    try {
      // 分配活動到學生
      const { data: newActivity, error: assignError } = await supabase
        .from('hanami_student_activities')
        .insert({
          student_id: studentId,
          tree_id: currentTreeId,
          activity_id: nextNode.activityId,
          activity_type: 'ongoing', // 改為 ongoing 類型
          lesson_date: new Date().toISOString().split('T')[0],
          completion_status: 'not_started',
          progress: 0
        })
        .select()
        .single();

      if (assignError) {
        console.error('分配活動失敗:', assignError);
        toast.error('分配活動失敗');
        return;
      }

      console.log('活動分配成功:', newActivity);
      toast.success(`成功分配活動：${nextNode.title}`);
      
      // 立即更新本地狀態，讓新分配的活動能立即顯示
      const newActivityData: StudentActivity = {
        id: newActivity.id,
        student_id: studentId,
        tree_id: currentTreeId,
        activity_id: nextNode.activityId,
        assignment_type: 'ongoing',
        progress: 0,
        status: 'not_started',
        assigned_date: new Date().toISOString(),
        completed_date: undefined,
        activity: {
          id: nextNode.activityId,
          activity_name: nextNode.title,
          activity_description: nextNode.description || '',
          estimated_duration: nextNode.duration || 0
        }
      };
      
      // 通知父組件活動已分配
      onActivityAssigned(newActivityData);
      
      // 觸發重新計算當前活動索引
      determineCurrentActivityIndex();
      
      // 添加視覺反饋，讓用戶知道新活動會立即顯示
      toast.success(`活動「${nextNode.title}」分配成功！新活動將立即顯示在學習路徑中。`, {
        duration: 3000,
        icon: '🎯',
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px'
        }
      });
      
      console.log('新活動已添加到本地狀態，觸發重新渲染');
      
    } catch (error) {
      console.error('分配活動時發生錯誤:', error);
      toast.error('分配活動時發生錯誤');
    }
  }, [learningPath, orderedNodes, normalizedCurrentActivities, studentId, currentTreeId, loadLearningPath, learningPathData]);

  const getNodeStatus = useCallback((node: LearningNode) => {
    console.log('getNodeStatus 檢查節點:', {
      id: node.id,
      type: node.type,
      title: node.title,
      activityId: node.activityId,
      isCompleted: node.isCompleted
    });
    
    if (node.type === 'start') {
      console.log('節點類型為 start，返回 completed');
      return 'completed';
    }
    if (node.type === 'end') {
      console.log('節點類型為 end，返回 locked');
      return 'locked';
    }
    
    if (node.type === 'activity') {
      console.log('節點類型為 activity，檢查活動狀態');
      
      // 優先檢查當前活動列表中的狀態
      if (node.activityId) {
        // 直接 ID 匹配
        let activity = normalizedCurrentActivities.find(a => a.activity_id === node.activityId);
        
        // 如果沒有找到，嘗試通過活動編號匹配
        if (!activity) {
          const extractNumber = (text?: string) => {
            if (!text) return '';
            const m = text.match(/^(\d{4})/);
            return m ? m[1] : '';
          };
          const nodeNum = extractNumber(node.title);
          
          if (nodeNum) {
            activity = normalizedCurrentActivities.find(a => {
              const nameNum = extractNumber(a.activity?.activity_name);
              return nodeNum === nameNum;
            });
            
            if (activity) {
              console.log(`通過活動編號匹配找到活動: ${nodeNum}`, activity);
            }
          }
        }
        
        if (activity) {
          console.log('找到對應活動:', {
            activity_id: activity.activity_id,
            status: activity.status,
            completion_status: activity.completion_status
          });
          
          if (activity.status === 'completed' || activity.completion_status === 'completed') {
            console.log('活動已完成，返回 completed');
            return 'completed';
          }
          if (activity.status === 'in_progress' || activity.completion_status === 'in_progress') {
            console.log('活動進行中，返回 in_progress');
            return 'in_progress';
          }
          if (activity.status === 'assigned' || activity.completion_status === 'assigned') {
            console.log('活動已分配，返回 assigned');
            return 'assigned';
          }
          
          // 如果狀態是 not_started，也視為已分配
          if (activity.status === 'not_started') {
            console.log('活動未開始但已分配，返回 assigned');
            return 'assigned';
          }
          
          console.log('活動狀態未知，返回 assigned');
          return 'assigned';
        } else {
          console.log('在當前活動列表中未找到對應活動，檢查是否為當前目標');
          
          // 檢查是否為當前目標（下一個要分配的活動）
          if (currentActivityIndex >= 0) {
            const activityNodes = orderedNodes.filter(n => n.type === 'activity');
            if (currentActivityIndex < activityNodes.length) {
              const currentNode = activityNodes[currentActivityIndex];
              if (currentNode.id === node.id) {
                console.log('節點是當前目標，返回 locked（可分配）');
                return 'locked';
              }
            }
          }
          
          console.log('節點不是當前目標，返回 locked');
          return 'locked';
        }
      }
      
      // 檢查節點本身的完成狀態（備用）
      if (node.isCompleted) {
        console.log('節點本身標記為已完成，返回 completed');
        return 'completed';
      }
      
      console.log('節點未完成且無活動記錄，返回 locked');
      return 'locked';
    }
    
    console.log('未知節點類型，返回 locked');
    return 'locked';
  }, [normalizedCurrentActivities, currentActivityIndex, orderedNodes]);

  const getNodeIcon = useCallback((node: LearningNode) => {
    const status = getNodeStatus(node);
    
    switch (node.type) {
      case 'start':
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-white" />
          </div>
        );
      case 'end':
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-white" />
          </div>
        );
      case 'activity':
        switch (status) {
          case 'completed':
            return (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            );
          case 'in_progress':
            return (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
            );
          case 'assigned':
            return (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
            );
          default:
            return (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            );
        }
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        );
    }
  }, [getNodeStatus]);

  // 檢查是否有學習路徑數據 - 優先於 loading 狀態檢查
  if (orderedNodes.length === 0) {
    console.log('沒有節點數據，直接顯示空狀態');
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* 標題欄 */}
          <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌳</span>
                <div>
                  <h2 className="text-xl font-semibold text-[#2B3A3B]">成長樹學習路徑管理</h2>
                  <p className="text-sm text-[#87704e]">查看和管理學生的學習進度</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#2B3A3B] hover:text-[#A64B2A] transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* 成長樹選擇器 */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] border-b border-[#EADBC8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-hanami-primary to-hanami-secondary rounded-full"></div>
                  <label className="text-sm font-semibold text-[#2B3A3B]">選擇成長樹</label>
                </div>
                <div className="relative">
                  <select
                    value={currentTreeId}
                    onChange={(e) => {
                      const newTreeId = e.target.value;
                      if (newTreeId !== currentTreeId) {
                        console.log('成長樹選擇改變:', newTreeId);
                        setCurrentTreeId(newTreeId);
                        // 通知父組件成長樹選擇改變
                        if (onTreeChange) {
                          onTreeChange(newTreeId);
                        }
                      }
                    }}
                    className="appearance-none px-4 py-3 pr-12 border-2 border-[#EADBC8] rounded-xl bg-white text-[#2B3A3B] font-medium focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 hover:border-[#D4C4B0] shadow-sm min-w-[280px] cursor-pointer"
                  >
                    {studentTrees.map((tree) => (
                      <option key={tree.id} value={tree.id}>
                        {tree.tree_name} {tree.status === 'active' ? '(進行中)' : `(${tree.status})`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <div className="w-3 h-3 border-2 border-[#A68A64] border-t-transparent border-l-transparent transform rotate-45"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-[#EADBC8]">
                  <div className="w-2 h-2 bg-gradient-to-r from-hanami-primary to-hanami-secondary rounded-full"></div>
                  <span className="text-xs font-medium text-[#87704e]">
                    共 {studentTrees.length} 個成長樹
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <HanamiCard className="p-4">
                <div className="text-center py-8">
                  <div className="text-4xl mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-200"></div>
                    </div>
                  </div>
                  <h4 className="text-lg font-medium text-[#2B3A3B] mb-2">尚未設置學習路徑</h4>
                  <p className="text-sm text-[#87704e] mb-4">
                    此成長樹還沒有配置學習路徑，請先安排學習活動
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-blue-800 font-medium">建議操作：</p>
                    </div>
                    <ul className="text-xs text-blue-700 space-y-1 text-left">
                      <li>• 點擊上方的「安排下一個活動」按鈕</li>
                      <li>• 或前往成長樹管理頁面設置學習目標</li>
                      <li>• 或聯繫管理員配置學習路徑</li>
                    </ul>
                  </div>
                </div>
              </HanamiCard>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="px-6 py-4 border-t border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <HanamiButton
                variant="secondary"
                onClick={onClose}
              >
                關閉
              </HanamiButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('組件正在載入中:', { 
      loading, 
      learningPath: !!learningPath, 
      orderedNodes: orderedNodes.length,
      currentTreeId,
      treeId 
    });
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto mb-4" />
          <p className="text-[#2B3A3B]">載入學習路徑中...</p>
          <p className="text-xs text-[#87704e] mt-2">currentTreeId: {currentTreeId}</p>
          <p className="text-xs text-[#87704e]">learningPath: {learningPath ? '已載入' : '未載入'}</p>
          <p className="text-xs text-[#87704e]">orderedNodes: {orderedNodes.length}</p>
        </div>
      </div>
    );
  }

  console.log('組件渲染狀態:', { 
    loading, 
    learningPath: !!learningPath, 
    orderedNodes: orderedNodes.length,
    currentTreeId,
    treeId 
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌳</span>
              <div>
                <h2 className="text-xl font-semibold text-[#2B3A3B]">成長樹學習路徑管理</h2>
                <p className="text-sm text-[#87704e]">查看和管理學生的學習進度</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#2B3A3B] hover:text-[#A64B2A] transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 成長樹選擇器 */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gradient-to-r from-hanami-primary to-hanami-secondary rounded-full"></div>
                <label className="text-sm font-semibold text-[#2B3A3B]">選擇成長樹</label>
              </div>
              <div className="relative">
                <select
                  value={currentTreeId}
                  onChange={(e) => {
                    const newTreeId = e.target.value;
                    if (newTreeId !== currentTreeId) {
                      console.log('成長樹選擇改變:', newTreeId);
                      setCurrentTreeId(newTreeId);
                      // 通知父組件成長樹選擇改變
                      if (onTreeChange) {
                        onTreeChange(newTreeId);
                      }
                    }
                  }}
                  className="appearance-none px-4 py-3 pr-12 border-2 border-[#EADBC8] rounded-xl bg-white text-[#2B3A3B] font-medium focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 hover:border-[#D4C4B0] shadow-sm min-w-[280px] cursor-pointer"
                >
                  {studentTrees.map((tree) => (
                    <option key={tree.id} value={tree.id}>
                      {tree.tree_name} {tree.status === 'active' ? '(進行中)' : `(${tree.status})`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <div className="w-3 h-3 border-2 border-[#A68A64] border-t-transparent border-l-transparent transform rotate-45"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-[#EADBC8]">
                <div className="w-2 h-2 bg-gradient-to-r from-hanami-primary to-hanami-secondary rounded-full"></div>
                <span className="text-xs font-medium text-[#87704e]">
                  共 {studentTrees.length} 個成長樹
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 自動安排按鈕 */}
            <HanamiCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#2B3A3B] mb-1">自動安排下一個活動</h3>
                  <p className="text-sm text-[#87704e]">
                    {(() => {
                      const activityNodes = orderedNodes.filter(node => node.type === 'activity');
                      if (activityNodes.length === 0) {
                        return '此成長樹沒有可安排的活動';
                      }
                      
                      // 調試信息：顯示當前活動狀態
                      console.log('=== 自動安排活動調試 ===');
                      console.log('orderedNodes:', orderedNodes);
                      console.log('activityNodes:', activityNodes);
                      console.log('normalizedCurrentActivities:', normalizedCurrentActivities);
                      
                      // 詳細顯示 normalizedCurrentActivities 的內容
                      if (normalizedCurrentActivities && normalizedCurrentActivities.length > 0) {
                        console.log('=== normalizedCurrentActivities 詳細內容 ===');
                        normalizedCurrentActivities.forEach((activity, index) => {
                          console.log(`活動 ${index + 1}:`, {
                            id: activity.id,
                            activity_id: activity.activity_id,
                            student_id: activity.student_id,
                            tree_id: activity.tree_id,
                            assignment_type: activity.assignment_type,
                            progress: activity.progress,
                            status: activity.status,
                            assigned_date: activity.assigned_date,
                            completed_date: activity.completed_date
                          });
                        });
                      } else {
                        console.log('normalizedCurrentActivities 為空或未定義');
                      }
                      
                      // 按照學習路徑的順序排列活動
                      const sortedActivityNodes = activityNodes.sort((a, b) => {
                        // 從活動標題中提取編號進行排序
                        const getActivityNumber = (title: string) => {
                          const match = title.match(/^(\d+)/);
                          return match ? parseInt(match[1]) : 0;
                        };
                        
                        const numA = getActivityNumber(a.title);
                        const numB = getActivityNumber(b.title);
                        
                        // 0006 應該排在 0002 前面
                        if (numA === 6 && numB === 2) return -1;
                        if (numA === 2 && numB === 6) return 1;
                        
                        return numA - numB;
                      });
                      
                      console.log('sortedActivityNodes:', sortedActivityNodes);
                      
                      // 找到第一個未分配的活動
                      const nextUnassignedActivity = sortedActivityNodes.find(node => {
                        // 檢查活動的當前狀態（先用 activity_id）
                        let existingActivity = normalizedCurrentActivities.find(a => a.activity_id === node.activityId);
                        
                        // 後備匹配：以活動編號（標題/名稱前綴數字）匹配
                        if (!existingActivity) {
                          const extractNumber = (text?: string) => {
                            if (!text) return '';
                            const m = text.match(/^(\d{4})/);
                            return m ? m[1] : '';
                          };
                          const nodeNum = extractNumber(node.title);
                          existingActivity = normalizedCurrentActivities.find(a => {
                            const nameNum = extractNumber(a.activity?.activity_name);
                            return nodeNum && nameNum && nodeNum === nameNum;
                          });
                        }
                        
                        console.log(`檢查活動 ${node.title}:`, {
                          activityId: node.activityId,
                          existingActivity: existingActivity,
                          status: existingActivity?.status,
                          // 顯示所有 normalizedCurrentActivities 的 ID 與名稱前綴進行對比
                          allCurrentActivityIds: normalizedCurrentActivities.map(a => a.activity_id),
                          allCurrentActivityNums: normalizedCurrentActivities.map(a => {
                            const m = a.activity?.activity_name?.match(/^(\d{4})/);
                            return m ? m[1] : '';
                          })
                        });
                        
                        if (!existingActivity) {
                          // 如果活動還沒有分配，可以安排
                          console.log(`活動 ${node.title} 未分配，可以安排`);
                          console.log(`原因：在 normalizedCurrentActivities（含編號匹配）中找不到對應記錄`);
                          return true;
                        }
                        
                        // 只要出現在正在學習活動中（已完成/未完成皆算已分配）就一律跳過
                        if (existingActivity.status === 'completed') {
                          console.log(`活動 ${node.title} 已完成（視為已分配），跳過`);
                          return false;
                        }
                        if (existingActivity.status === 'in_progress') {
                          console.log(`活動 ${node.title} 正在進行中（已分配），跳過`);
                          return false;
                        }
                        if (existingActivity.status === 'not_started') {
                          console.log(`活動 ${node.title} 未開始但已分配，跳過`);
                          return false;
                        }
                        
                        // 其他狀態，默認也跳過
                        console.log(`活動 ${node.title} 狀態為 ${existingActivity.status}，視為已分配，跳過`);
                        return false;
                      });

                      console.log('nextUnassignedActivity:', nextUnassignedActivity);

                      if (!nextUnassignedActivity) {
                        // 檢查是否所有活動都已完成或正在進行（含後備編號匹配）
                        const extractNumber = (text?: string) => {
                          if (!text) return '';
                          const m = text.match(/^(\d{4})/);
                          return m ? m[1] : '';
                        };
                        const allActivitiesAssigned = sortedActivityNodes.every(node => {
                          const byId = normalizedCurrentActivities.find(a => a.activity_id === node.activityId);
                          const byNum = normalizedCurrentActivities.find(a => {
                            const nameNum = extractNumber(a.activity?.activity_name);
                            return extractNumber(node.title) === nameNum && nameNum !== '';
                          });
                          const existing = byId || byNum;
                          return !!existing && (existing.status === 'completed' || existing.status === 'in_progress' || existing.status === 'not_started');
                        });
                        
                        if (allActivitiesAssigned) {
                          return '所有活動都已分配完成';
                        } else {
                          return '沒有可安排的下一個活動';
                        }
                      }

                      const nextIndex = sortedActivityNodes.findIndex(n => n.id === nextUnassignedActivity.id) + 1;
                      return `準備安排第 ${nextIndex} 個活動：${nextUnassignedActivity.title}`;
                    })()}
                  </p>
                  <p className="text-xs text-[#A68A64] mt-1">
                    總共 {orderedNodes.filter(n => n.type === 'activity').length} 個活動，
                    已完成 {normalizedCurrentActivities.filter(a => a.status === 'completed').length} 個，
                    進行中 {normalizedCurrentActivities.filter(a => a.status === 'in_progress').length} 個
                  </p>
                </div>
                <HanamiButton
                  variant="primary"
                  size="sm"
                  onClick={assignNextActivity}
                  disabled={(() => {
                    const activityNodes = orderedNodes.filter(node => node.type === 'activity');
                    const hasUnassignedActivity = activityNodes.some(node => 
                      !normalizedCurrentActivities.find(a => a.activity_id === node.activityId)
                    );
                    return !hasUnassignedActivity || activityNodes.length === 0;
                  })()}
                >
                  安排下一個活動
                </HanamiButton>
              </div>
            </HanamiCard>

            {/* 學習路徑列表 */}
            <HanamiCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[#2B3A3B]">學習路徑</h3>
                <button
                  onClick={() => setShowPathList(!showPathList)}
                  className="text-[#A68A64] hover:text-[#8B7355] text-sm underline"
                >
                  {showPathList ? '隱藏詳細路徑' : '顯示詳細路徑'}
                </button>
              </div>

              {showPathList && (
                <div className="space-y-3">
                  {orderedNodes.length === 0 ? (
                    // 當沒有學習路徑數據時，顯示友好的提示信息
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4 flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-200"></div>
                        </div>
                      </div>
                      <h4 className="text-lg font-medium text-[#2B3A3B] mb-2">尚未設置學習路徑</h4>
                      <p className="text-sm text-[#87704e] mb-4">
                        此成長樹還沒有配置學習路徑，請先安排學習活動
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <p className="text-sm text-blue-800 font-medium">建議操作：</p>
                        </div>
                        <ul className="text-xs text-blue-700 space-y-1 text-left">
                          <li>• 點擊上方的「安排下一個活動」按鈕</li>
                          <li>• 或前往成長樹管理頁面設置學習目標</li>
                          <li>• 或聯繫管理員配置學習路徑</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    // 有學習路徑數據時，正常顯示節點
                    orderedNodes.map((node, index) => (
                      <div
                        key={node.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          getNodeStatus(node) === 'completed' 
                            ? 'bg-green-50 border-green-200' 
                            : getNodeStatus(node) === 'in_progress'
                            ? 'bg-blue-50 border-blue-200'
                            : getNodeStatus(node) === 'assigned'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* 節點圖標 */}
                        {getNodeIcon(node)}
                        
                        {/* 節點內容 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-[#2B3A3B]">
                              {node.type === 'activity' && node.order ? `${node.order}. ` : ''}
                              {node.title}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              getNodeStatus(node) === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : getNodeStatus(node) === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : getNodeStatus(node) === 'assigned'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getNodeStatus(node) === 'completed' ? '已完成' :
                               getNodeStatus(node) === 'in_progress' ? '進行中' :
                               getNodeStatus(node) === 'assigned' ? '已分配' : '未開始'}
                            </span>
                          </div>
                          <p className="text-sm text-[#87704e] mt-1">{node.description}</p>
                          {node.type === 'activity' && node.duration > 0 && (
                            <p className="text-xs text-[#A68A64] mt-1">預計時長: {node.duration} 分鐘</p>
                          )}
                          {node.type === 'activity' && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs text-blue-800 font-medium">活動詳情</p>
                              <p className="text-xs text-blue-700">類別：{node.activityId ? '已分配' : '未分配'}</p>
                              <p className="text-xs text-blue-700">類型：{node.description || '鋼琴教材'}</p>
                              {node.duration > 0 && (
                                <p className="text-xs text-blue-700">時長：{node.duration} 分鐘</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

                             {/* 簡化版本的路徑顯示 */}
               {!showPathList && (
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-sm text-[#87704e]">
                     <span>學習路徑包含 {orderedNodes.filter(n => n.type === 'activity').length} 個活動</span>
                     <span>•</span>
                     <span>已完成 {normalizedCurrentActivities.filter(a => a.status === 'completed').length} 個</span>
                     <span>•</span>
                     <span>進行中 {normalizedCurrentActivities.filter(a => a.status === 'in_progress').length} 個</span>
                   </div>
                   {orderedNodes.filter(n => n.type === 'activity').length === 0 && (
                     <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                       ⚠️ 此成長樹尚未設置學習目標，請先在成長樹管理中添加目標
                     </div>
                   )}
                 </div>
               )}
            </HanamiCard>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="px-6 py-4 border-t border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-b-2xl">
          <div className="flex justify-end gap-3">
            <HanamiButton
              variant="secondary"
              onClick={onClose}
            >
              關閉
            </HanamiButton>
          </div>
        </div>
      </div>
    </div>
  );
}

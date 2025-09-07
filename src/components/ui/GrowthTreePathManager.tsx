'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiCard } from './HanamiCard';
import { HanamiButton } from './HanamiButton';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  StarIcon, 
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface LearningNode {
  id: string;
  type: 'start' | 'activity' | 'end';
  title: string;
  description: string;
  order: number;
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  isInProgress?: boolean;
  activityId?: string;
}

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

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string | null;
  start_date?: string | null;
  status?: string | null;
}

interface GrowthTreePathManagerProps {
  currentTreeId: string;
  studentId: string;
  studentTrees?: GrowthTree[];
  onClose: () => void;
}

export default function GrowthTreePathManager({
  currentTreeId, 
  studentId,
  studentTrees = [],
  onClose
}: GrowthTreePathManagerProps) {
  const [loading, setLoading] = useState(false);
  const [orderedNodes, setOrderedNodes] = useState<LearningNode[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(-1);
  const [learningPathData, setLearningPathData] = useState<any>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [showPathList, setShowPathList] = useState(true);
  const [normalizedCurrentActivities, setNormalizedCurrentActivities] = useState<any[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState(currentTreeId);
  const [nextActivity, setNextActivity] = useState<any>(null);

  // 同步 currentTreeId 和 selectedTreeId
  useEffect(() => {
    setSelectedTreeId(currentTreeId);
  }, [currentTreeId]);

  // 載入學習路徑數據
  const loadLearningPathData = useCallback(async (treeId?: string) => {
    const targetTreeId = treeId || selectedTreeId;
    try {
      console.log('=== 開始載入學習路徑 ===');
      console.log('targetTreeId:', targetTreeId);
      console.log('studentId:', studentId);

      // 首先查詢指定成長樹的學習路徑
      const { data: currentTreePaths, error: currentTreeError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .eq('tree_id', targetTreeId);
      
      if (currentTreeError) {
        console.error('載入當前成長樹學習路徑失敗:', currentTreeError);
        return null;
      }
      
      console.log('當前成長樹學習路徑數量:', currentTreePaths?.length || 0);

      // 如果當前成長樹有學習路徑，檢查是否有實際內容的路徑
      if (currentTreePaths && currentTreePaths.length > 0) {
        console.log('🔍 檢查當前成長樹的學習路徑內容...');
        
        // 詳細檢查每個路徑
        currentTreePaths.forEach((path, index) => {
          if (path.nodes && Array.isArray(path.nodes)) {
            const hasActivityNodes = path.nodes.some((node: any) => 
              node.type === 'activity' || 
              (node.id && node.id.startsWith('tree_activity_'))
            );
            console.log(`🔍 路徑 ${index + 1}: "${path.name}" - 有活動節點: ${hasActivityNodes}, 節點數量: ${path.nodes.length}`);
          }
        });
        
        // 優先選擇有實際活動節點的路徑（不是預設路徑）
        const actualPath = currentTreePaths.find(path => {
          if (path.nodes && Array.isArray(path.nodes)) {
            // 檢查是否有除了 start 和 end 之外的活動節點
            const hasActivityNodes = path.nodes.some((node: any) => 
              node.type === 'activity' || 
              (node.id && node.id.startsWith('tree_activity_'))
            );
            const isNotDefault = path.name !== '預設學習路徑';
            console.log(`🔍 路徑 "${path.name}": 有活動節點=${hasActivityNodes}, 非預設=${isNotDefault}`);
            return hasActivityNodes && isNotDefault;
          }
              return false;
        });
        
        if (actualPath) {
          console.log('✅ 找到當前成長樹的實際學習路徑:', actualPath);
          return actualPath;
        }
        
        // 如果沒有實際路徑，優先使用當前成長樹的預設路徑（即使沒有活動節點）
        const defaultPath = currentTreePaths.find(path => path.is_active === true) || currentTreePaths[0];
        if (defaultPath) {
          console.log('🔍 檢查預設路徑的節點內容:', defaultPath.nodes);
          if (defaultPath.nodes && Array.isArray(defaultPath.nodes)) {
            const hasActivityNodes = defaultPath.nodes.some((node: any) => 
              node.type === 'activity' || 
              (node.id && node.id.startsWith('tree_activity_'))
            );
            if (hasActivityNodes) {
              console.log('✅ 預設路徑包含活動節點，使用預設路徑:', defaultPath);
              return defaultPath;
          } else {
              console.log('⚠️ 預設路徑沒有活動節點，但仍使用當前成長樹的預設路徑:', defaultPath);
              return defaultPath;
            }
          }
        }
      }

      // 如果當前成長樹完全沒有任何學習路徑，返回 null 表示沒有路徑
      console.log('🔍 當前成長樹完全沒有任何學習路徑，返回 null');
      return null;
      } catch (error) {
      console.error('載入學習路徑數據失敗:', error);
          return null;
        }
  }, [selectedTreeId, studentId]);

  // 獲取有序節點
  const getOrderedNodes = useCallback(async (pathData: any) => {
    if (!pathData || !pathData.nodes) {
      console.log('沒有路徑數據或節點數據');
      return [];
    }

    try {
      console.log('開始處理節點數據...');
      console.log('原始節點數據:', pathData.nodes);

      // 解析節點數據
      let nodes = pathData.nodes;
      if (typeof nodes === 'string') {
        try {
          nodes = JSON.parse(nodes);
        } catch (parseError) {
          console.error('解析節點 JSON 失敗:', parseError);
        return [];
        }
      }

      if (!Array.isArray(nodes)) {
        console.error('節點數據不是數組格式');
        return [];
      }

      // 過濾並排序節點
      const validNodes = nodes
        .filter((node: any) => node && node.id && node.type)
        .sort((a: any, b: any) => {
          // 確保 start 節點在最前面
          if (a.type === 'start') return -1;
          if (b.type === 'start') return 1;
          // 其他節點按 order 排序
          return (a.order || 0) - (b.order || 0);
        });

      console.log('處理後的節點:', validNodes);

      // 查詢學生的活動完成狀態（參考正在學習活動的載入邏輯）
      if (studentId && validNodes.length > 0) {
        console.log('🔍 查詢學生活動完成狀態（參考正在學習活動邏輯）...');
        
        try {
          // 查詢所有學生活動記錄（包括 lesson 和 ongoing 類型）
          const { data: studentActivities, error: activitiesError } = await supabase
            .from('hanami_student_activities')
            .select('activity_id, completion_status, activity_type')
            .eq('student_id', studentId);

          if (activitiesError) {
            console.error('查詢學生活動失敗:', activitiesError);
      } else {
            console.log('學生活動記錄:', studentActivities);
            
            // 更新節點的完成狀態
            const updatedNodes = await Promise.all(validNodes.map(async (node: any) => {
              if (node.type === 'activity' && node.id.startsWith('tree_activity_')) {
                const actualActivityId = node.id.replace('tree_activity_', '');
                
                // 先查詢 hanami_tree_activities 表來獲取真正的 activity_id
                const { data: treeActivity, error: treeActivityError } = await supabase
                  .from('hanami_tree_activities')
                  .select('activity_id')
                  .eq('id', actualActivityId)
        .single();

                if (treeActivityError || !treeActivity || !treeActivity.activity_id) {
                  console.log(`節點 ${node.title} (${actualActivityId}): 無法找到對應的活動記錄，標記為未完成`);
                  return { ...node, isCompleted: false };
                }

                const realActivityId = treeActivity.activity_id;
                
                // 查找該活動的所有記錄（使用真正的 activity_id）
                const activityRecords = studentActivities?.filter(
                  (activity: any) => activity.activity_id === realActivityId
                ) || [];
                
                console.log(`節點 ${node.title} (${actualActivityId} -> ${realActivityId}) 的活動記錄:`, activityRecords);
                
                if (activityRecords.length > 0) {
                  // 檢查活動狀態
                  const hasInProgress = activityRecords.some(
                    (record: any) => record.completion_status === 'in_progress'
                  );
                  const allCompleted = activityRecords.every(
                    (record: any) => record.completion_status === 'completed'
                  );
                  
                  const isCompleted = allCompleted;
                  const isInProgress = hasInProgress && !allCompleted;
                  
                  console.log(`節點 ${node.title} (${actualActivityId} -> ${realActivityId}): 完成狀態 = ${isCompleted}, 進行中 = ${isInProgress} (記錄數: ${activityRecords.length})`);
                  
                  return { ...node, isCompleted, isInProgress };
              } else {
                  // 沒有活動記錄，表示未開始
                  console.log(`節點 ${node.title} (${actualActivityId} -> ${realActivityId}): 沒有活動記錄，標記為未完成`);
                  return { ...node, isCompleted: false, isInProgress: false };
                }
              }
              return node;
            }));
            
            console.log('更新完成狀態後的節點:', updatedNodes);
            return updatedNodes;
          }
        } catch (error) {
          console.error('查詢學生活動狀態失敗:', error);
        }
      }

      return validNodes;
    } catch (error) {
      console.error('處理節點數據失敗:', error);
      return [];
    }
  }, [studentId]);

  // 分析下一個活動
  const analyzeNextActivity = useCallback(async () => {
    if (orderedNodes.length === 0) {
      setNextActivity(null);
      return;
    }

    const completedNodes = orderedNodes.filter(node => node.isCompleted);
    const incompleteNodes = orderedNodes.filter(node => !node.isCompleted && !node.isLocked);
    const lockedNodes = orderedNodes.filter(node => node.isLocked);

    if (incompleteNodes.length > 0) {
      // 查詢學生正在進行的活動
      const { data: ongoingActivities, error: ongoingError } = await supabase
        .from('hanami_student_activities')
        .select('activity_id')
        .eq('student_id', studentId)
        .eq('completion_status', 'in_progress');

      if (ongoingError) {
        console.error('查詢正在進行的活動失敗:', ongoingError);
        // 如果查詢失敗，使用第一個未完成的活動
        const next = incompleteNodes[0];
        setNextActivity({
          ...next,
          actualId: next.id.startsWith('tree_activity_') ? next.id.replace('tree_activity_', '') : next.id,
          progress: {
            completed: completedNodes.length,
            total: orderedNodes.length,
            percentage: Math.round((completedNodes.length / orderedNodes.length) * 100)
          }
        });
        return;
      }

      const ongoingActivityIds = ongoingActivities?.map(activity => activity.activity_id) || [];
      console.log('正在進行的活動ID:', ongoingActivityIds);

      // 尋找第一個不在進行中的未完成活動
      let nextAvailableActivity = null;
      for (const node of incompleteNodes) {
        if (node.id.startsWith('tree_activity_')) {
          const actualActivityId = node.id.replace('tree_activity_', '');
          
          // 查詢 hanami_tree_activities 表來獲取真正的 activity_id
          const { data: treeActivity, error: treeActivityError } = await supabase
            .from('hanami_tree_activities')
            .select('activity_id')
            .eq('id', actualActivityId)
            .single();

          if (!treeActivityError && treeActivity && treeActivity.activity_id) {
            const realActivityId = treeActivity.activity_id;
            
            // 檢查這個活動是否已經在進行中
            if (!ongoingActivityIds.includes(realActivityId)) {
              nextAvailableActivity = node as any;
              nextAvailableActivity.actualId = actualActivityId;
              nextAvailableActivity.realActivityId = realActivityId;
              break;
            }
          }
        }
      }

      if (nextAvailableActivity) {
        console.log('找到下一個可用活動:', nextAvailableActivity.title);
        setNextActivity({
          ...nextAvailableActivity,
          progress: {
            completed: completedNodes.length,
            total: orderedNodes.length,
            percentage: Math.round((completedNodes.length / orderedNodes.length) * 100)
          }
        });
      } else {
        console.log('沒有找到可用的活動，所有活動都在進行中或已完成');
        setNextActivity(null);
      }
    } else {
      setNextActivity(null);
    }
  }, [orderedNodes, studentId]);

  // 當 orderedNodes 變化時，重新分析下一個活動
  useEffect(() => {
    analyzeNextActivity().catch(error => {
      console.error('分析下一個活動失敗:', error);
    });
  }, [analyzeNextActivity]);

  // 安排下一個活動
  const handleArrangeNextActivity = useCallback(async () => {
    if (!studentId || !selectedTreeId || orderedNodes.length === 0) {
      console.log('無法安排活動：缺少必要參數');
      toast.error('無法安排活動：缺少必要參數');
      return;
    }

    setLoading(true);
    try {
      console.log('🎯 開始安排下一個活動...');
      console.log('學生ID:', studentId);
      console.log('成長樹ID:', selectedTreeId);
      console.log('當前節點數量:', orderedNodes.length);

      // 首先檢查 hanami_student_activities 表是否存在
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_student_activities')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('hanami_student_activities 表不存在或無法訪問:', tableError);
        toast.error('資料庫表不存在，請聯繫管理員創建 hanami_student_activities 表');
      return;
    }
    
      console.log('✅ hanami_student_activities 表存在，可以繼續操作');

      // 分析當前學習路徑的進度
      const completedNodes = orderedNodes.filter(node => node.isCompleted);
      const incompleteNodes = orderedNodes.filter(node => !node.isCompleted && !node.isLocked);
      const lockedNodes = orderedNodes.filter(node => node.isLocked);

      console.log('已完成節點:', completedNodes.length);
      console.log('未完成節點:', incompleteNodes.length);
      console.log('已鎖定節點:', lockedNodes.length);

      // 找到下一個應該安排的活動
      let nextActivity: any = null;
      
      // 優先選擇第一個未完成且未鎖定的活動節點（排除開始和結束節點）
      console.log('🔍 所有未完成節點:', incompleteNodes.map(n => ({ id: n.id, type: n.type, title: n.title })));
      
      const activityNodes = incompleteNodes.filter(node => 
        node.type === 'activity' && 
        node.id !== 'start' && 
        node.id !== 'end' &&
        !node.id.startsWith('start') &&
        !node.id.startsWith('end')
      );
      
      console.log('🔍 過濾後的活動節點:', activityNodes.map(n => ({ id: n.id, type: n.type, title: n.title })));
      
      if (activityNodes.length > 0) {
        nextActivity = activityNodes[0];
        console.log('🎯 找到下一個活動:', nextActivity.title);
        console.log('🎯 活動ID:', nextActivity.id);
        console.log('🎯 活動類型:', nextActivity.type);
        
        // 檢查活動ID格式
        if (nextActivity.id.startsWith('tree_activity_')) {
          // 提取實際的活動ID
          const actualActivityId = nextActivity.id.replace('tree_activity_', '');
          console.log('🎯 實際活動ID:', actualActivityId);
          nextActivity.actualId = actualActivityId;
          
          // 查詢 hanami_tree_activities 表來獲取真正的 activity_id
          console.log('🔍 查詢 hanami_tree_activities 表...');
          const { data: treeActivity, error: treeActivityError } = await supabase
            .from('hanami_tree_activities')
            .select('activity_id')
            .eq('id', actualActivityId)
            .single();

          if (treeActivityError) {
            console.error('查詢 hanami_tree_activities 失敗:', treeActivityError);
            toast.error('查詢活動資訊失敗');
            return;
          }

          if (!treeActivity || !treeActivity.activity_id) {
            console.error('找不到對應的活動記錄:', actualActivityId);
            toast.error('找不到對應的活動記錄');
            return;
          }

          const realActivityId = treeActivity.activity_id;
          console.log('🎯 真正的活動ID (來自 hanami_teaching_activities):', realActivityId);
          nextActivity.realActivityId = realActivityId;
        } else {
          console.log('🎯 活動ID格式不正確:', nextActivity.id);
          toast.error('活動ID格式不正確，無法安排活動');
          return;
        }
      } else {
        console.log('⚠️ 沒有找到可安排的活動節點');
        console.log('未完成節點:', incompleteNodes.map(n => ({ id: n.id, type: n.type, title: n.title })));
        toast.error('沒有找到可安排的活動節點，請檢查學習路徑配置');
        return;
      }

      // 檢查學生是否已經有正在進行的活動
      const { data: ongoingActivities, error: ongoingError } = await supabase
        .from('hanami_student_activities')
        .select('*')
        .eq('student_id', studentId)
        .eq('completion_status', 'in_progress');

      if (ongoingError) {
        console.error('查詢正在進行的活動失敗:', ongoingError);
        throw ongoingError;
      }

      console.log('學生正在進行的活動數量:', ongoingActivities?.length || 0);

      // 如果學生已經有正在進行的活動，檢查是否與建議的活動相同
      if (ongoingActivities && ongoingActivities.length > 0) {
        // 檢查建議的活動是否已經在進行中
        const isAlreadyInProgress = ongoingActivities.some(activity => 
          activity.activity_id === nextActivity.realActivityId
        );
        
        if (isAlreadyInProgress) {
          console.log('建議的活動已經在進行中，跳過此活動');
          toast(`活動「${nextActivity.title}」已經在進行中，將尋找下一個活動`);
          
          // 尋找下一個可用的活動
          let nextAvailableActivity = null;
          for (let i = 1; i < incompleteNodes.length; i++) {
            const candidateActivity = incompleteNodes[i];
            if (candidateActivity.id.startsWith('tree_activity_')) {
              const candidateActualId = candidateActivity.id.replace('tree_activity_', '');
              
              // 查詢 hanami_tree_activities 表來獲取真正的 activity_id
              const { data: candidateTreeActivity, error: candidateTreeActivityError } = await supabase
                .from('hanami_tree_activities')
                .select('activity_id')
                .eq('id', candidateActualId)
                .single();

              if (!candidateTreeActivityError && candidateTreeActivity && candidateTreeActivity.activity_id) {
                const candidateRealActivityId = candidateTreeActivity.activity_id;
                
                // 檢查這個活動是否已經在進行中
                const isCandidateInProgress = ongoingActivities.some(activity => 
                  activity.activity_id === candidateRealActivityId
                );
                
                if (!isCandidateInProgress) {
                  nextAvailableActivity = candidateActivity as any;
                  nextAvailableActivity.actualId = candidateActualId;
                  nextAvailableActivity.realActivityId = candidateRealActivityId;
                  break;
                }
              }
            }
          }
          
          if (nextAvailableActivity) {
            console.log('找到下一個可用活動:', nextAvailableActivity.title);
            nextActivity = nextAvailableActivity;
          } else {
            console.log('沒有找到其他可用的活動');
            toast('所有活動都已經在進行中或已完成');
            return;
          }
        } else {
          // 建議的活動不在進行中，詢問是否要替換現有活動
          const shouldReplace = window.confirm(
            `學生目前有 ${ongoingActivities.length} 個正在進行的活動。\n\n` +
            `建議安排的下一個活動：${nextActivity.title}\n\n` +
            `是否要將正在進行的活動標記為完成，並開始新的活動？`
          );
          
          if (!shouldReplace) {
            console.log('用戶取消安排活動');
            toast('已取消安排活動');
      return;
    }
    
          // 將正在進行的活動標記為完成
          for (const activity of ongoingActivities) {
            const { error: updateError } = await supabase
        .from('hanami_student_activities')
              .update({ 
                completion_status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', activity.id);

            if (updateError) {
              console.error('更新活動狀態失敗:', updateError);
              throw updateError;
            }
          }
          console.log('✅ 已將正在進行的活動標記為完成');
        }
      }

      // 安排新的活動
      const insertData = {
        student_id: studentId,
        activity_id: nextActivity.realActivityId || nextActivity.actualId || nextActivity.id,
        tree_id: selectedTreeId,
        activity_type: 'ongoing',
        completion_status: 'in_progress',
        assigned_at: new Date().toISOString()
      };

      console.log('準備插入的數據:', insertData);

      const { data: newActivity, error: insertError } = await supabase
        .from('hanami_student_activities')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('安排活動失敗:', insertError);
        console.error('插入數據:', insertData);
        console.error('錯誤詳情:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        
        // 提供更具體的錯誤信息
        let errorMessage = '安排活動失敗';
        if (insertError.message.includes('foreign key')) {
          errorMessage = '活動或學生不存在，請檢查數據完整性';
        } else if (insertError.message.includes('check constraint')) {
          errorMessage = '數據格式不正確，請檢查活動類型或狀態';
        } else if (insertError.message.includes('permission')) {
          errorMessage = '沒有權限操作此表，請檢查資料庫權限';
        }
        
        toast.error(`${errorMessage}: ${insertError.message}`);
        throw insertError;
      }

      console.log('✅ 成功安排活動:', newActivity);
      
      // 顯示成功消息
      toast.success(`成功安排活動：${nextActivity.title}！學生現在可以開始這個新的學習活動。`);
      
      // 重新載入學習路徑數據以反映最新狀態
      const newPathData = await loadLearningPathData(selectedTreeId);
      if (newPathData) {
        const ordered = await getOrderedNodes(newPathData);
        setOrderedNodes(ordered);
        setLearningPathData(newPathData);
      }

    } catch (error) {
      console.error('安排活動失敗:', error);
      toast.error('安排活動失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedTreeId, orderedNodes, loadLearningPathData, getOrderedNodes]);

  // 載入初始數據
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const pathData = await loadLearningPathData();
        if (pathData) {
          console.log('載入到學習路徑數據:', pathData);
          setLearningPathData(pathData);
          
          const ordered = await getOrderedNodes(pathData);
          console.log('有序節點:', ordered);
          setOrderedNodes(ordered);
        } else {
          console.log('沒有找到學習路徑數據');
          // 清空數據
          setOrderedNodes([]);
          setLearningPathData(null);
        }
      } catch (error) {
        console.error('載入初始數據失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadLearningPathData, getOrderedNodes]);

  // 獲取節點狀態
  const getNodeStatus = (node: LearningNode) => {
    if (node.isCompleted) return 'completed';
    if (node.isLocked) return 'locked';
    // 檢查是否有正在進行的活動
    if (node.isInProgress) return 'in_progress';
    return 'pending';
  };

  // 獲取節點圖標
  const getNodeIcon = (node: LearningNode) => {
    switch (node.type) {
      case 'start':
        return <PlayIcon className="w-6 h-6 text-green-600" />;
      case 'end':
        return <StarIcon className="w-6 h-6 text-yellow-600" />;
      case 'activity':
        return <AcademicCapIcon className="w-6 h-6 text-blue-600" />;
          default:
        return <AcademicCapIcon className="w-6 h-6 text-gray-600" />;
    }
  };

    return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* 標題欄 */}
        <div className="px-6 py-4 border-b border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-t-2xl">
            <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#2B3A3B]">學習路徑管理</h2>
              <button
                onClick={onClose}
              className="text-[#87704e] hover:text-[#2B3A3B] transition-colors"
              >
              ✕
              </button>
          </div>

          {/* 成長樹選擇器 */}
          {studentTrees && studentTrees.length > 0 && (
            <div className="mt-4">
                <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#2B3A3B] whitespace-nowrap">
                  選擇成長樹
                </label>
                <div className="relative flex-1">
                  <select
                    value={selectedTreeId}
                    onChange={(e) => {
                      const newTreeId = e.target.value;
                      setSelectedTreeId(newTreeId);
                      // 重新載入學習路徑數據
                      setLoading(true);
                      loadLearningPathData(newTreeId).then((pathData) => {
                        if (pathData) {
                          setLearningPathData(pathData);
                          getOrderedNodes(pathData).then((ordered) => {
                            setOrderedNodes(ordered);
                            setLoading(false);
                          });
                        } else {
                          // 如果沒有找到學習路徑，清空數據
                          setOrderedNodes([]);
                          setLearningPathData(null);
                          setLoading(false);
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#E8D5C4] rounded-lg bg-white text-[#2B3A3B] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23E8D5C4' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    {studentTrees.map((tree) => (
                      <option key={tree.id} value={tree.id}>
                        {tree.tree_name} ({tree.status === 'active' ? '進行中' : tree.status})
                      </option>
                    ))}
                  </select>
                  </div>
                <span className="text-sm text-[#87704e] whitespace-nowrap">
                    共 {studentTrees.length} 個成長樹
                  </span>
                </div>
              </div>
          )}
          </div>

        {/* 主要內容 */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="space-y-6 pb-4">
            
            {/* 安排下一個活動區域 */}
            <AnimatePresence>
              {nextActivity && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <HanamiCard className="bg-gradient-to-r from-[#FFD59A] via-[#EBC9A4] to-[#FFB6C1] border-2 border-[#FFD59A] shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="space-y-4">
                  {/* 標題區域 */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <StarIcon className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#2B3A3B]">安排下一個活動</h2>
                      <p className="text-sm text-[#87704e]">為學生安排下一個學習活動</p>
                  </div>
                    </div>

                  {/* 進度條 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-[#2B3A3B]">
                      <span>學習進度</span>
                      <span>{nextActivity.progress.completed}/{nextActivity.progress.total} ({nextActivity.progress.percentage}%)</span>
                  </div>
                    <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: `${nextActivity.progress.percentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                      />
            </div>
          </div>

                  {/* 下一個活動信息 */}
                  <motion.div 
                    className="bg-white/80 rounded-xl p-4 space-y-3 border border-white/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg flex items-center justify-center shadow-md">
                        {nextActivity.type === 'activity' ? (
                          <AcademicCapIcon className="w-5 h-5 text-white" />
                        ) : nextActivity.type === 'start' ? (
                          <PlayIcon className="w-5 h-5 text-white" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-white" />
                        )}
            </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2B3A3B] text-lg">
                          {nextActivity.title}
                        </h3>
                        <p className="text-sm text-[#87704e] mt-1">
                          {nextActivity.description || '準備開始新的學習挑戰！'}
                        </p>
                        {nextActivity.duration > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-[#A68A64]">
                            <ClockIcon className="w-4 h-4" />
                            <span>預計時長: {nextActivity.duration} 分鐘</span>
          </div>
                        )}
        </div>
      </div>

                    {/* 活動類型標籤 */}
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-medium rounded-full border border-[#3B82F6]/20 flex items-center gap-1">
                        <AcademicCapIcon className="w-3 h-3" />
                        {nextActivity.type === 'activity' ? '學習活動' : nextActivity.type}
                      </span>
                      {nextActivity.difficulty && (
                        <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-medium rounded-full border border-[#F59E0B]/20 flex items-center gap-1">
                          <StarIcon className="w-3 h-3" />
                          難度: {nextActivity.difficulty}
                        </span>
                      )}
        </div>
                  </motion.div>

                  {/* 操作按鈕 */}
                  <motion.div 
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <HanamiButton
                      variant="primary"
                      onClick={handleArrangeNextActivity}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>安排中...</span>
          </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <StarIcon className="w-5 h-5" />
                          <span>立即安排活動</span>
        </div>
                      )}
                    </HanamiButton>
                    
                    <HanamiButton
                      variant="secondary"
                      onClick={() => setShowPathList(!showPathList)}
                      className="px-4 py-3 rounded-xl border-2 border-[#E8D5C4] hover:border-[#FFD59A] transition-all duration-300"
                    >
                      {showPathList ? '隱藏詳細' : '查看全部'}
                    </HanamiButton>
                  </motion.div>
              </div>
                  </HanamiCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 沒有下一個活動時的提示 */}
            <AnimatePresence>
              {!nextActivity && orderedNodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <HanamiCard className="bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border-2 border-[#D1D5DB]">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B] mb-2">
                    恭喜！所有活動已完成
                  </h3>
                  <p className="text-[#87704e]">
                    學生已經完成了所有可用的學習活動，表現優秀！
                  </p>
              </div>
                  </HanamiCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 學習路徑概覽 */}
            <HanamiCard>
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">學習路徑概覽</h3>
                  <div className="flex gap-2">
                    <HanamiButton
                      variant="cute"
                      onClick={async () => {
                        // 重新載入學習路徑數據
                        setLoading(true);
                        const newPathData = await loadLearningPathData(selectedTreeId);
                        if (newPathData) {
                          const ordered = await getOrderedNodes(newPathData);
                          setOrderedNodes(ordered);
                          setLearningPathData(newPathData);
                      } else {
                          // 如果沒有找到學習路徑，清空數據
                          setOrderedNodes([]);
                          setLearningPathData(null);
                        }
                        setLoading(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>重新載入</span>
                      </div>
                </HanamiButton>
              </div>
              </div>

                {loading ? (
                    <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto"></div>
                    <p className="text-[#87704e] mt-2">載入中...</p>
                        </div>
                ) : orderedNodes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#87704e]">沒有學習路徑數據</p>
                      </div>
                ) : (
                  <>
                    {/* 學習路徑來源信息 */}
                    {learningPathData && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">學習路徑來源:</span>
                          <span>{learningPathData.name}</span>
                          {learningPathData.tree_id !== selectedTreeId && (
                            <span className="text-blue-600">(來自其他成長樹)</span>
                          )}
                          {learningPathData.tree_id === selectedTreeId && (
                            <span className="text-green-600">(當前成長樹)</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      {/* 簡化版本的路徑顯示 */}
                      {!showPathList && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[#87704e]">
                            <span>學習路徑包含 {orderedNodes.filter(n => n.type === 'activity').length} 個活動</span>
                            <span>•</span>
                            <span>已完成 {orderedNodes.filter(n => n.isCompleted).length} 個</span>
                    </div>
                          {orderedNodes.filter(n => n.type === 'activity').length === 0 && (
                            <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                              ⚠️ 此成長樹尚未設置學習目標，請先在成長樹管理中添加目標
              </div>
                          )}
              </div>
                      )}

                      {/* 詳細節點列表 */}
              {showPathList && (
                <div className="space-y-3">
                          {orderedNodes.map((node, index) => (
                      <div
                        key={node.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                          getNodeStatus(node) === 'completed' 
                            ? 'bg-gradient-to-r from-[#E0F2E0] to-[#F0F8F0] border-[#A8D8A8]' 
                                  : getNodeStatus(node) === 'locked'
                                  ? 'bg-gradient-to-r from-[#F5F5F5] to-[#FAFAFA] border-[#D0D0D0]'
                            : getNodeStatus(node) === 'in_progress'
                                  ? 'bg-gradient-to-r from-[#FFE0E0] to-[#FFF0F0] border-[#FFB6C1]'
                                  : 'bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-[#FFD59A]'
                        }`}
                      >
                        {/* 節點圖標 */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          getNodeStatus(node) === 'completed' 
                            ? 'bg-gradient-to-br from-[#4CAF50] to-[#66BB6A]' 
                                  : getNodeStatus(node) === 'locked'
                                  ? 'bg-gradient-to-br from-[#9E9E9E] to-[#BDBDBD]'
                            : getNodeStatus(node) === 'in_progress'
                                  ? 'bg-gradient-to-br from-[#FF6B6B] to-[#FF8A80]'
                                  : 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4]'
                        }`}>
                          {getNodeStatus(node) === 'completed' ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : getNodeStatus(node) === 'in_progress' ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        {/* 節點內容 */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-[#2B3A3B]">
                              {node.type === 'activity' && node.order ? `${node.order}. ` : ''}
                              {node.title}
                            </h4>
                            <span className={`text-sm px-3 py-1 rounded-full font-medium shadow-sm ${
                              getNodeStatus(node) === 'completed' 
                                ? 'bg-gradient-to-r from-[#C8E6C9] to-[#E8F5E8] text-[#2E7D32] border border-[#A5D6A7]' 
                                      : getNodeStatus(node) === 'locked'
                                      ? 'bg-gradient-to-r from-[#F5F5F5] to-[#EEEEEE] text-[#616161] border border-[#E0E0E0]'
                                : getNodeStatus(node) === 'in_progress'
                                      ? 'bg-gradient-to-r from-[#FFCDD2] to-[#FFEBEE] text-[#C62828] border border-[#FFB3BA]'
                                      : 'bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] text-[#E65100] border border-[#FFCC02]'
                            }`}>
                              {getNodeStatus(node) === 'completed' ? '已完成' :
                                     getNodeStatus(node) === 'locked' ? '已鎖定' : 
                                     getNodeStatus(node) === 'in_progress' ? '進行中' : '未開始'}
                            </span>
                          </div>
                          <p className="text-sm text-[#87704e] mt-2">{node.description}</p>
                          {node.type === 'activity' && node.duration > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-[#87704e] bg-[#FFF9F2] px-2 py-1 rounded-lg border border-[#FFD59A]">
                              <svg className="w-4 h-4 text-[#FF6B6B]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">預計時長: {node.duration} 分鐘</span>
                            </div>
                          )}
                        </div>
                      </div>
                          ))}
                </div>
              )}
                   </div>
                  </>
                   )}
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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  StarIcon, 
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  TrophyIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface LearningNode {
  id: string;
  type: 'start' | 'activity' | 'end' | 'milestone' | 'assessment';
  title: string;
  description: string;
  order: number;
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  isInProgress?: boolean;
  progress?: number; // 進度百分比 (0-100)
  activityId?: string;
  difficulty?: number;
  metadata?: {
    activityType?: string;
    materials?: string[];
    instructions?: string;
    learningObjectives?: string[];
  };
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

interface LearningPathLevelsProps {
  studentId: string;
  treeId?: string;
  className?: string;
  maxLevels?: number;
  showProgress?: boolean;
  student?: {
    gender?: 'male' | 'female';
    [key: string]: any;
  };
}

// 關卡狀態顏色 - 根據完成狀態設計
const getLevelStatusColor = (node: LearningNode, allNodes: LearningNode[]) => {
  if (node.isCompleted) {
    return 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-2 border-emerald-300 shadow-lg shadow-emerald-200/30';
  }
  if (node.isInProgress) {
    return 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-2 border-blue-300 shadow-lg shadow-blue-200/30';
  }
  if (node.isLocked) {
    return 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 opacity-70';
  }
  
  // 檢查是否所有前面的關卡都已完成
  const nodeIndex = allNodes.findIndex(n => n.id === node.id);
  const previousNodes = allNodes.slice(0, nodeIndex);
  const allPreviousCompleted = previousNodes.every(n => n.isCompleted);
  
  // 如果前面的關卡未完成，使用灰色
  if (!allPreviousCompleted) {
    return 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 opacity-70';
  }
  
  // 前面的關卡都完成了，使用琥珀色
  return 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-300 shadow-lg shadow-amber-200/30 hover:shadow-xl hover:shadow-amber-300/40';
};

// 關卡類型圖標 - 根據完成狀態設計
const getLevelIcon = (type: string, isCompleted: boolean, isInProgress: boolean, isDisabled: boolean) => {
  const iconClass = "w-7 h-7";
  const glowClass = isCompleted ? "drop-shadow-lg" : isInProgress ? "drop-shadow-md" : "";
  
  // 如果關卡被禁用（前面的關卡未完成），使用灰色
  const getIconColor = (completedColor: string, inProgressColor: string, defaultColor: string) => {
    if (isCompleted) return completedColor;
    if (isInProgress) return inProgressColor;
    if (isDisabled) return 'text-gray-400';
    return defaultColor;
  };
  
  switch (type) {
    case 'start':
      return (
        <motion.div
          animate={isCompleted ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isCompleted ? Infinity : 0, repeatDelay: 2 }}
          className={`${glowClass}`}
        >
          <PlayIcon className={`${iconClass} ${getIconColor('text-emerald-600', 'text-blue-500', 'text-green-500')}`} />
        </motion.div>
      );
    case 'activity':
      return (
        <motion.div
          animate={isCompleted ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6, repeat: isCompleted ? Infinity : 0, repeatDelay: 3 }}
          className={`${glowClass}`}
        >
          <BookOpenIcon className={`${iconClass} ${getIconColor('text-blue-600', 'text-cyan-500', 'text-blue-500')}`} />
        </motion.div>
      );
    case 'assessment':
      return (
        <motion.div
          animate={isCompleted ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 0.8, repeat: isCompleted ? Infinity : 0, repeatDelay: 2.5 }}
          className={`${glowClass}`}
        >
          <PuzzlePieceIcon className={`${iconClass} ${getIconColor('text-purple-600', 'text-indigo-500', 'text-purple-500')}`} />
        </motion.div>
      );
    case 'milestone':
      return (
        <motion.div
          animate={isCompleted ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ duration: 1, repeat: isCompleted ? Infinity : 0, repeatDelay: 2 }}
          className={`${glowClass}`}
        >
          <StarIcon className={`${iconClass} ${getIconColor('text-yellow-500', 'text-amber-500', 'text-yellow-500')}`} />
        </motion.div>
      );
    case 'end':
      return (
        <motion.div
          animate={isCompleted ? { 
            scale: [1, 1.3, 1],
            rotate: [0, 15, -15, 0]
          } : {}}
          transition={{ duration: 1.2, repeat: isCompleted ? Infinity : 0, repeatDelay: 1.5 }}
          className={`${glowClass}`}
        >
          <TrophyIcon className={`${iconClass} ${getIconColor('text-amber-600', 'text-orange-500', 'text-amber-500')}`} />
        </motion.div>
      );
    default:
      return (
        <motion.div
          animate={isCompleted ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.7, repeat: isCompleted ? Infinity : 0, repeatDelay: 3 }}
          className={`${glowClass}`}
        >
          <AcademicCapIcon className={`${iconClass} ${getIconColor('text-gray-600', 'text-slate-500', 'text-gray-500')}`} />
        </motion.div>
      );
  }
};

// 難度標籤 - 遊戲化設計
const getDifficultyBadge = (difficulty: number) => {
  const colors = {
    1: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm',
    2: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 shadow-sm',
    3: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200 shadow-sm',
    4: 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 shadow-sm',
    5: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 shadow-sm'
  };
  
  const labels = {
    1: '簡單',
    2: '基礎', 
    3: '中等',
    4: '困難',
    5: '專家'
  };
  
  const stars = {
    1: '●',
    2: '●●',
    3: '●●●',
    4: '●●●●',
    5: '●●●●●'
  };
  
  return (
    <motion.span 
      className={`px-3 py-1 rounded-full text-xs font-bold ${colors[difficulty as keyof typeof colors] || colors[1]}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {labels[difficulty as keyof typeof labels] || '未知'} {stars[difficulty as keyof typeof stars] || '●'}
    </motion.span>
  );
};

// 關卡進度條 - 遊戲化設計
const LevelProgressBar: React.FC<{ progress: number; isCompleted: boolean; isInProgress: boolean }> = ({ progress, isCompleted, isInProgress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
      <motion.div
        className={`h-full rounded-full relative ${
          isCompleted 
            ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500' 
            : isInProgress 
            ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500'
            : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${isCompleted ? 100 : progress}%` }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
      >
        {/* 進度條光效 */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ 
            duration: 2, 
            repeat: isCompleted ? Infinity : 0, 
            repeatDelay: 3,
            ease: "linear"
          }}
        />
        {/* 完成時的閃光效果 */}
        {isCompleted && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-yellow-300 opacity-50"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default function LearningPathLevels({ 
  studentId, 
  treeId, 
  className = '', 
  maxLevels: initialMaxLevels = 5,
  showProgress = true,
  student
}: LearningPathLevelsProps) {
  const [loading, setLoading] = useState(true);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [orderedNodes, setOrderedNodes] = useState<LearningNode[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [studentTrees, setStudentTrees] = useState<any[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string>('');
  const [maxLevels, setMaxLevels] = useState(initialMaxLevels);
  const [isExpanded, setIsExpanded] = useState(false);

  // 載入學習路徑數據
  const loadLearningPathData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== 開始載入學習路徑 ===');
      console.log('studentId:', studentId);
      console.log('treeId:', treeId);

      // 驗證必要參數
      if (!studentId) {
        console.error('studentId 是必需的');
        setError('學生ID是必需的');
        return;
      }

      // 首先查詢該學生的成長樹
      console.log('🔍 查詢學生的成長樹，studentId:', studentId);
      const { data: studentTrees, error: studentTreesError } = await supabase
        .from('hanami_student_trees')
        .select(`
          tree_id,
          tree:hanami_growth_trees(
            id,
            tree_name,
            tree_description,
            is_active
          )
        `)
        .eq('student_id', studentId)
        .eq('tree.is_active', true);
      
      if (studentTreesError) {
        console.error('載入學生成長樹失敗:', studentTreesError);
        setError('載入學生成長樹失敗');
        return;
      }
      
      console.log('學生成長樹數量:', studentTrees?.length || 0);
      console.log('學生成長樹:', studentTrees);
      
      if (!studentTrees || studentTrees.length === 0) {
        console.log('🔍 學生沒有分配任何成長樹');
        setError('學生沒有分配成長樹');
        return;
      }

      // 保存學生成長樹到狀態
      setStudentTrees(studentTrees);

      // 提取成長樹 ID
      const studentTreeIds = studentTrees.map(st => st.tree_id);
      console.log('學生成長樹 ID 列表:', studentTreeIds);

      // 初始化選中的成長樹（只在第一次載入時設置）
      if (studentTreeIds.length > 0 && !selectedTreeId) {
        // 如果有傳入的 treeId 且在學生的成長樹列表中，使用它；否則使用第一個
        const initialTreeId = treeId && studentTreeIds.includes(treeId) 
          ? treeId 
          : studentTreeIds[0];
        setSelectedTreeId(initialTreeId);
      }

      // 查詢這些成長樹的學習路徑
      console.log('🔍 查詢學生成長樹的學習路徑...');
      const { data: studentTreePaths, error: pathsError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .in('tree_id', studentTreeIds)
        .eq('is_active', true);
      
      if (pathsError) {
        console.error('載入學習路徑失敗:', pathsError);
        setError('載入學習路徑失敗');
        return;
      }
      
      console.log('學生成長樹的學習路徑數量:', studentTreePaths?.length || 0);
      console.log('學生成長樹的學習路徑:', studentTreePaths);
      
      // 詳細檢查每個學習路徑
      studentTreePaths?.forEach((path, index) => {
        console.log(`🔍 學習路徑 ${index + 1}:`, {
          id: path.id,
          name: path.name,
          tree_id: path.tree_id,
          nodes_count: path.nodes?.length || 0,
          first_node: path.nodes?.[0]?.title || '無節點'
        });
      });

      let selectedPath = null;

      // 使用選中的成長樹 ID
      const currentTreeId = selectedTreeId || treeId;
      console.log('🔍 當前選中的成長樹 ID:', currentTreeId);
      console.log('🔍 可用的成長樹 ID 列表:', studentTreeIds);
      
      if (currentTreeId && studentTreeIds.includes(currentTreeId)) {
        console.log('🔍 使用選中的成長樹 ID:', currentTreeId);
        const treePaths = studentTreePaths?.filter(path => path.tree_id === currentTreeId) || [];
        console.log('🔍 該成長樹的學習路徑數量:', treePaths.length);
        console.log('🔍 該成長樹的學習路徑:', treePaths);
        
        if (treePaths.length > 0) {
          selectedPath = treePaths.find(path => path.is_active === true) || treePaths[0];
          console.log('🔍 選擇的學習路徑:', selectedPath);
          console.log('🔍 選擇的學習路徑詳細信息:', {
            id: selectedPath.id,
            name: selectedPath.name,
            tree_id: selectedPath.tree_id,
            nodes_count: selectedPath.nodes?.length || 0,
            first_node: selectedPath.nodes?.[0]?.title || '無節點'
          });
        } else {
          console.log('🔍 該成長樹沒有學習路徑');
        }
      } else {
        console.log('🔍 選中的成長樹 ID 不在可用列表中，或沒有選中成長樹');
      }
      
      // 如果沒有找到指定成長樹的路徑，不應該回退到其他成長樹的路徑
      if (!selectedPath) {
        console.log('🔍 該成長樹沒有學習路徑，顯示空狀態');
        setOrderedNodes([]);
        setLoading(false);
        setError(null);
        return;
      }
      
      console.log('選擇的學習路徑:', selectedPath);

      // 解析學習路徑的節點數據（使用與 GrowthTreePathManager 相同的邏輯）
      console.log('開始處理節點數據...');
      console.log('原始節點數據:', selectedPath.nodes);

      // 解析節點數據
      let nodes: LearningNode[] = [];
      if (selectedPath.nodes) {
        let pathNodes = selectedPath.nodes;
        if (typeof pathNodes === 'string') {
          try {
            pathNodes = JSON.parse(pathNodes);
          } catch (parseError) {
            console.error('解析節點 JSON 失敗:', parseError);
            setError('解析學習路徑節點失敗');
            return;
          }
        }

        if (Array.isArray(pathNodes)) {
          // 過濾並排序節點
          const validNodes = pathNodes
            .filter((node: any) => {
              // 基本過濾條件
              if (!node || !node.id || !node.type) return false;
              
              // 如果是活動節點，檢查是否屬於當前成長樹
              if (node.type === 'activity' && node.id.startsWith('tree_activity_')) {
                const actualActivityId = node.id.replace('tree_activity_', '');
                // 這裡我們暫時保留所有節點，稍後在查詢活動狀態時會過濾
                return true;
              }
              
              // 非活動節點（start, end, milestone 等）直接保留
              return true;
            })
            .sort((a: any, b: any) => {
              // 確保 start 節點在最前面
              if (a.type === 'start') return -1;
              if (b.type === 'start') return 1;
              // 其他節點按 order 排序
              return (a.order || 0) - (b.order || 0);
            });

          console.log('處理後的節點:', validNodes);

          // 轉換為 LearningNode 格式
          nodes = validNodes.map((node: any) => {
            console.log(`🔍 處理節點:`, node);
            return {
              id: node.id,
              type: node.type as 'start' | 'activity' | 'end' | 'milestone' | 'assessment',
              title: node.title || '未命名節點',
              description: node.description || '',
              order: node.order || 0,
              duration: node.duration || 30,
              isCompleted: false, // 將在後面更新
              isLocked: false, // 將在後面更新
              isInProgress: false, // 將在後面更新
              activityId: node.activityId,
              difficulty: node.difficulty || 1,
              metadata: node.metadata
            };
          });
        }
      }

      console.log('轉換後的節點:', nodes);

      // 查詢學生的學習進度狀態（使用與新增能力評估相同的邏輯）
      if (studentId && nodes.length > 0) {
        console.log('🔍 查詢學生活動完成狀態...');
        
        try {
          // 使用與新增能力評估相同的 API 獲取學生活動
          const response = await fetch(`/api/student-activities?studentId=${studentId}&lessonDate=${new Date().toISOString().split('T')[0]}`);
          
          if (!response.ok) {
            throw new Error('獲取學生活動失敗');
          }
          
          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || '獲取學生活動失敗');
          }
          
          const currentLessonActivities = result.data.currentLessonActivities || [];
          const ongoingActivities = result.data.ongoingActivities || [];
          const previousLessonActivities = result.data.previousLessonActivities || [];
          
          console.log('學生活動記錄:', {
            currentLesson: currentLessonActivities.length,
            ongoing: ongoingActivities.length,
            previous: previousLessonActivities.length
          });
          
          // 合併所有活動
          const allActivities = [...currentLessonActivities, ...ongoingActivities, ...previousLessonActivities];
            
            // 更新節點的完成狀態（使用正確的活動數據）
            const updatedNodes = await Promise.all(nodes.map(async (node: any) => {
              if (node.type === 'activity' && node.id.startsWith('tree_activity_')) {
                const actualActivityId = node.id.replace('tree_activity_', '');
                
                // 先查詢 hanami_tree_activities 表來獲取真正的 activity_id 和 tree_id
                const { data: treeActivity, error: treeActivityError } = await supabase
                  .from('hanami_tree_activities')
                  .select('activity_id, tree_id')
                  .eq('id', actualActivityId)
                  .single();

                if (treeActivityError || !treeActivity || !treeActivity.activity_id) {
                  console.log(`節點 ${node.title} (${actualActivityId}): 無法找到對應的活動記錄，標記為未完成`);
                  return null; // 返回 null 表示過濾掉這個節點
                }

                // 檢查這個活動是否屬於當前選中的成長樹
                if (treeActivity.tree_id !== selectedTreeId) {
                  return null; // 返回 null 表示過濾掉這個節點
                }

                const realActivityId = treeActivity.activity_id;
                
                // 查找該活動的所有記錄（使用正確的活動數據）
                const activityRecords = allActivities?.filter(
                  (activity: any) => activity.activityId === realActivityId
                ) || [];
                
                console.log(`節點 ${node.title} (${actualActivityId} -> ${realActivityId}) 的活動記錄:`, activityRecords);
                
                if (activityRecords.length > 0) {
                  // 檢查活動狀態
                  const hasInProgress = activityRecords.some(
                    (record: any) => record.completionStatus === 'in_progress'
                  );
                  const allCompleted = activityRecords.every(
                    (record: any) => record.completionStatus === 'completed'
                  );
                  
                  const isCompleted = allCompleted;
                  const isInProgress = hasInProgress && !allCompleted;
                  
                  // 獲取進度數據（取最新的記錄）
                  const latestRecord = activityRecords[activityRecords.length - 1];
                  const progress = latestRecord?.progress || 0;
                  
                  console.log(`節點 ${node.title} (${actualActivityId} -> ${realActivityId}): 完成狀態 = ${isCompleted}, 進行中 = ${isInProgress}, 進度 = ${progress}% (記錄數: ${activityRecords.length})`);
                  console.log(`🔍 活動記錄詳情:`, activityRecords);
                  console.log(`🔍 最新記錄:`, latestRecord);
                  console.log(`🔍 進度值:`, progress);
                  
                  return { ...node, isCompleted, isInProgress, isLocked: false, progress };
                } else {
                  // 沒有活動記錄，表示未開始
                  console.log(`節點 ${node.title} (${actualActivityId} -> ${realActivityId}): 沒有活動記錄，標記為未完成`);
                  return { ...node, isCompleted: false, isInProgress: false, isLocked: false, progress: 0 };
                }
              }
              return { ...node, isCompleted: false, isInProgress: false, isLocked: false, progress: 0 };
            }));
            
            console.log('更新完成狀態後的節點:', updatedNodes);
            
            // 調試進度數據
            updatedNodes.forEach((node: any) => {
              if (node.isInProgress) {
                console.log(`🔍 調試進度數據 - 節點: ${node.title}, 進度: ${node.progress}%, 進行中: ${node.isInProgress}`);
              }
            });
            
            // 過濾掉 null 值（不屬於當前成長樹的節點）
            const filteredNodes = updatedNodes.filter((node: any) => node !== null);
            
            console.log('過濾後的節點:', filteredNodes);
            nodes = filteredNodes;
        } catch (error) {
          console.error('查詢學生活動狀態失敗:', error);
        }
      }

      // 找到當前進度
      const currentIndex = nodes.findIndex(node => 
        node.isInProgress || (!node.isCompleted && !node.isLocked)
      );

      setLearningPath({
        id: selectedPath.id,
        name: selectedPath.path_name || '學習路徑',
        description: selectedPath.path_description || '',
        nodes: nodes,
        startNodeId: 'start',
        endNodeId: 'end',
        totalDuration: selectedPath.estimated_total_duration || 0,
        difficulty: selectedPath.difficulty_level || 1,
        tags: []
      });

      setOrderedNodes(nodes);
      setCurrentLevelIndex(currentIndex >= 0 ? currentIndex : 0);

    } catch (error) {
      console.error('載入學習路徑數據失敗:', error);
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedTreeId]);

  // 處理成長樹選擇變化
  const handleTreeChange = useCallback((newTreeId: string) => {
    setSelectedTreeId(newTreeId);
  }, []);

  useEffect(() => {
    if (studentId) {
      loadLearningPathData();
    }
  }, [studentId, selectedTreeId]);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full"
          />
          <span className="ml-3 text-[#2B3A3B]">載入學習路徑中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!learningPath || orderedNodes.length === 0) {
    return (
      <div className={`${className}`}>
        {/* 路徑標題和成長樹選擇器 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#4B4036] flex items-center">
              <motion.div
                className="p-2 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg mr-3"
                whileHover={{ rotate: 15 }}
              >
                <SparklesIcon className="w-5 h-5 text-white" />
              </motion.div>
              學習路徑
            </h3>
          </div>
          
          {/* 成長樹選擇器 - 圖片風格設計 */}
          {studentTrees.length > 1 && (
            <div className="mb-6">
              <motion.div
                className="flex items-center space-x-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* 左側標籤 */}
                <span className="text-[#4B4036] font-medium text-sm whitespace-nowrap">
                  選擇成長樹
                </span>
                
                {/* 中間選擇框 */}
                <div className="flex-1 relative">
                  <motion.select
                    value={selectedTreeId}
                    onChange={(e) => handleTreeChange(e.target.value)}
                    className="
                      w-full px-4 py-3 pr-10
                      bg-white
                      border border-[#EADBC8]
                      rounded-2xl
                      text-[#4B4036] font-medium text-sm
                      focus:outline-none focus:border-[#FFD59A]
                      transition-all duration-300
                      cursor-pointer
                      appearance-none
                    "
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {studentTrees.map((studentTree) => (
                      <option key={studentTree.tree_id} value={studentTree.tree_id}>
                        {studentTree.tree?.tree_name || '未命名成長樹'}
                      </option>
                    ))}
                  </motion.select>
                  
                  {/* 自定義下拉箭頭 */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* 右側計數標籤 */}
                <span className="text-[#2B3A3B] text-sm whitespace-nowrap">
                  共{studentTrees.length}個成長樹
                </span>
              </motion.div>
            </div>
          )}
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">該成長樹沒有學習路徑</p>
          <p className="text-gray-400 text-sm">請聯繫管理員為此成長樹創建學習路徑</p>
        </div>
      </div>
    );
  }

  const displayNodes = isExpanded ? orderedNodes : orderedNodes.slice(0, maxLevels);

  return (
    <div className={`${className}`}>
      {/* 路徑標題和成長樹選擇器 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#4B4036] flex items-center">
            <motion.div
              className="p-2 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg mr-3"
              whileHover={{ rotate: 15 }}
            >
              <SparklesIcon className="w-5 h-5 text-white" />
            </motion.div>
            學習路徑
          </h3>
          {showProgress && (
            <div className="text-sm text-[#2B3A3B]">
              進度: {orderedNodes.filter(n => n.isCompleted).length}/{orderedNodes.length}
            </div>
          )}
        </div>
        
        {/* 成長樹選擇器 - 圖片風格設計 */}
        {studentTrees.length > 1 && (
          <div className="mb-6">
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* 左側標籤 */}
              <span className="text-[#4B4036] font-medium text-sm whitespace-nowrap">
                選擇成長樹
              </span>
              
              {/* 中間選擇框 */}
              <div className="flex-1 relative">
                <motion.select
                  value={selectedTreeId}
                  onChange={(e) => handleTreeChange(e.target.value)}
                  className="
                    w-full px-4 py-3 pr-10
                    bg-white
                    border border-[#EADBC8]
                    rounded-2xl
                    text-[#4B4036] font-medium text-sm
                    focus:outline-none focus:border-[#FFD59A]
                    transition-all duration-300
                    cursor-pointer
                    appearance-none
                  "
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {studentTrees.map((studentTree) => (
                    <option key={studentTree.tree_id} value={studentTree.tree_id}>
                      {studentTree.tree?.tree_name || '未命名成長樹'}
                    </option>
                  ))}
                </motion.select>
                
                {/* 自定義下拉箭頭 */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* 右側計數標籤 */}
              <span className="text-[#2B3A3B] text-sm whitespace-nowrap">
                共{studentTrees.length}個成長樹
              </span>
            </motion.div>
          </div>
        )}
        
        <div className="mb-2">
          <h4 className="text-lg font-semibold text-[#4B4036]">{learningPath.name}</h4>
          <p className="text-[#2B3A3B] text-sm">{learningPath.description}</p>
        </div>
      </div>

      {/* 關卡列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {displayNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-500
                ${getLevelStatusColor(node, displayNodes)}
                ${node.isLocked ? 'opacity-60' : 'hover:shadow-2xl hover:scale-[1.03] cursor-pointer'}
                overflow-hidden
              `}
            >
              {/* 背景動畫效果 */}
              {!node.isLocked && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    repeatDelay: 2,
                    ease: "linear"
                  }}
                />
              )}

              {/* 關卡連接線 - 只在完成時顯示 */}
              {index < displayNodes.length - 1 && node.isCompleted && (
                <motion.div 
                  className="absolute left-8 top-20 w-1 h-12 bg-gradient-to-b from-emerald-400 to-green-400 rounded-full"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
                />
              )}

              <div className="flex items-start space-x-4">
                {/* 關卡圖標 - 遊戲化設計 */}
                <div className="flex-shrink-0 relative">
                  {/* 完成時的發光效果 */}
                  {node.isCompleted && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-200 to-yellow-300 opacity-50 blur-sm"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <motion.div 
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center border-2 relative overflow-hidden
                      ${node.isCompleted 
                        ? 'bg-gradient-to-br from-white to-emerald-50 border-emerald-400 shadow-lg shadow-emerald-200/50' 
                        : node.isInProgress 
                          ? 'bg-gradient-to-br from-white to-blue-50 border-blue-400 shadow-lg shadow-blue-200/50' 
                          : node.isLocked 
                            ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' 
                            : !displayNodes.slice(0, index).every(n => n.isCompleted)
                              ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                              : 'bg-gradient-to-br from-white to-amber-50 border-amber-400 shadow-lg shadow-amber-200/50'
                      }
                    `}
                    whileHover={!node.isLocked ? { scale: 1.05 } : {}}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* 背景動畫效果 */}
                    {!node.isLocked && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          repeatDelay: 2,
                          ease: "linear"
                        }}
                      />
                    )}
                    
                    {node.isLocked ? (
                      <LockClosedIcon className="w-7 h-7 text-gray-400" />
                    ) : (
                      getLevelIcon(node.type, node.isCompleted, node.isInProgress || false, 
                        !displayNodes.slice(0, index).every(n => n.isCompleted))
                    )}
                    
                    {/* 完成時的星星特效 */}
                    {node.isCompleted && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: [0, 1, 0.8, 1], rotate: [0, 180, 360] }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    )}
                    
                  </motion.div>
                </div>

                {/* 關卡內容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#4B4036] truncate">
                      {node.title}
                    </h4>
                    {/* 只有活動節點才顯示難度和時間 */}
                    {node.type === 'activity' && (
                      <div className="flex items-center space-x-2">
                        {node.difficulty && getDifficultyBadge(node.difficulty)}
                        <div className="flex items-center text-xs text-[#2B3A3B]">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {node.duration}分鐘
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#2B3A3B] mb-3 line-clamp-2">
                    {node.description}
                  </p>

                  {/* 進度條 - 只有活動節點才顯示 */}
                    {showProgress && !node.isLocked && node.type === 'activity' && (
                      <div className="mb-2 relative">
                        <LevelProgressBar 
                          progress={node.isCompleted ? 100 : (node.progress || 0)} 
                          isCompleted={node.isCompleted}
                          isInProgress={node.isInProgress || false}
                        />
                        
                        {/* 進行中時的動態角色 - 在進度條上持續跑動 */}
                        {node.isInProgress && (
                          <motion.div
                            className="absolute -top-6 w-8 h-8 z-20"
                            initial={{ x: 0, opacity: 1 }}
                            animate={{ 
                              x: [0, `${(node.progress || 0) * 9}%`, 0],
                              y: [0, -2, 0]
                            }}
                            transition={{ 
                              x: { 
                                duration: 3, 
                                repeat: Infinity, 
                                ease: "easeInOut"
                              },
                              y: { 
                                duration: 0.8, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }
                            }}
                            onAnimationStart={() => {
                              console.log(`🎮 角色動畫開始 - 節點: ${node.title}, 進度: ${node.progress}%`);
                            }}
                          >
                            {/* 根據學生性別顯示對應角色 */}
                            <motion.img
                              src={student?.gender === 'male' ? '/boy(front).png' : '/girl(front).png'}
                              alt="學習角色"
                              className="w-full h-full object-contain drop-shadow-xl"
                              animate={{ 
                                scale: [1, 1.1, 1],
                              }}
                              transition={{ 
                                duration: 0.8, 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          </motion.div>
                        )}
                      </div>
                    )}

                  {/* 狀態標籤 - 遊戲化設計 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {node.isCompleted && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 shadow-sm"
                        >
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            className="mr-1"
                          >
                            <CheckCircleIcon className="w-3 h-3" />
                          </motion.div>
                          <span>已完成</span>
                        </motion.span>
                      )}
                      {node.isInProgress && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 shadow-sm"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="mr-1"
                          >
                            <PlayIcon className="w-3 h-3" />
                          </motion.div>
                          <span>進行中</span>
                        </motion.span>
                      )}
                      {node.isLocked && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-300">
                          <LockClosedIcon className="w-3 h-3 mr-1" />
                          未解鎖
                        </span>
                      )}
                      {!node.isCompleted && !node.isInProgress && !node.isLocked && node.type === 'activity' && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200 shadow-sm cursor-pointer"
                        >
                          <motion.div
                            animate={{ x: [0, 2, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="mr-1"
                          >
                            <ArrowRightIcon className="w-3 h-3" />
                          </motion.div>
                          <span>可開始</span>
                        </motion.span>
                      )}
                    </div>

                    {/* 關卡序號 - 只有活動節點才顯示關卡序號 */}
                    {node.type === 'activity' && (
                      <div className="text-xs text-[#2B3A3B] font-medium">
                        關卡 {displayNodes.filter(n => n.type === 'activity').findIndex(n => n.id === node.id) + 1}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 展開/收起按鈕 */}
      {orderedNodes.length > maxLevels && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {!isExpanded ? (
            <motion.button 
              className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] hover:from-[#EBC9A4] hover:to-[#D4A586] text-[#2B3A3B] rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center mx-auto space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsExpanded(true);
              }}
            >
              <SparklesIcon className="w-4 h-4" />
              查看更多關卡 ({orderedNodes.length - maxLevels} 個)
            </motion.button>
          ) : (
            <motion.button 
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center mx-auto space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsExpanded(false);
              }}
            >
              <ArrowRightIcon className="w-4 h-4 rotate-180" />
              收起關卡
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClockIcon, 
  AcademicCapIcon, 
  StarIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  CalendarIcon,
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  TrophyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ActivitySelectionModal from './ActivitySelectionModal';
import StudentTreeAssignmentModal from './StudentTreeAssignmentModal';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface StudentActivity {
  id: string;
  treeActivityId?: string;
  activityName: string;
  activityDescription: string;
  activityType: string;
  difficultyLevel: number;
  estimatedDuration: number;
  materialsNeeded: string[];
  instructions: string;
  learningObjectives?: string[];
  completionStatus: string;
  performanceRating?: number;
  studentNotes?: string;
  teacherNotes?: string;
  timeSpent?: number;
  attemptsCount?: number;
  isFavorite?: boolean;
  progress?: number;
  tempProgress?: number; // 臨時進度值
  assignedAt?: string;
  createdAt?: string;
  lessonDate?: string;
  timeslot?: string;
}

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
}

interface StudentActivitiesPanelProps {
  studentId: string;
  lessonDate: string;
  timeslot: string;
}

const StudentActivitiesPanel: React.FC<StudentActivitiesPanelProps> = ({
  studentId,
  lessonDate,
  timeslot
}) => {
  const [activities, setActivities] = useState<{
    currentLessonActivities: StudentActivity[];
    previousLessonActivities: StudentActivity[];
    ongoingActivities: StudentActivity[];
  }>({
    currentLessonActivities: [],
    previousLessonActivities: [],
    ongoingActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('載入學生活動中...');
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showActivitySelectionModal, setShowActivitySelectionModal] = useState(false);
  const [currentActivityType, setCurrentActivityType] = useState<'current' | 'ongoing'>('current');
  
  // 成長樹相關狀態
  const [hasGrowthTree, setHasGrowthTree] = useState<boolean | null>(null);
  const [showTreeAssignmentModal, setShowTreeAssignmentModal] = useState(false);
  
  // 學習路徑相關狀態
  const [showLearningPathSelector, setShowLearningPathSelector] = useState(false);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string>('');
  const [studentTrees, setStudentTrees] = useState<any[]>([]);
  const [learningPathData, setLearningPathData] = useState<any>(null);
  const [orderedNodes, setOrderedNodes] = useState<any[]>([]);
  const [nextActivity, setNextActivity] = useState<any>(null);
  const [showPathList, setShowPathList] = useState(true);
  const [studentGrowthTrees, setStudentGrowthTrees] = useState<any[]>([]);
  const [activityStatusFilter, setActivityStatusFilter] = useState<'all' | 'completed' | 'not_completed'>('all');
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  
  // 調試用：記錄狀態變化
  useEffect(() => {
    console.log('📝 編輯狀態變化:', { editingActivityId, savingActivityId });
  }, [editingActivityId, savingActivityId]);

  const fetchStudentInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStudentInfo(result.data);
        }
      }
    } catch (err) {
      console.error('獲取學生資訊失敗:', err);
    }
  }, [studentId]); // 恢復 studentId 依賴項

  // 檢查學生是否有成長樹
  const checkStudentGrowthTree = useCallback(async () => {
    try {
      const response = await fetch(`/api/student-growth-trees?studentId=${studentId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const trees = result.data || [];
          setStudentGrowthTrees(trees);
          setHasGrowthTree(trees.length > 0);
        }
      }
    } catch (err) {
      console.error('檢查學生成長樹失敗:', err);
      setHasGrowthTree(false);
      setStudentGrowthTrees([]);
    }
  }, [studentId]);



  const fetchStudentActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingText('載入學生活動中...');
      
      console.log('開始載入學生活動:', { studentId, lessonDate, timeslot });
      
      const response = await fetch(
        `/api/student-activities?studentId=${studentId}&lessonDate=${lessonDate}&timeslot=${timeslot}`
      );
      
      if (!response.ok) {
        throw new Error('獲取學生活動失敗');
      }

      const result = await response.json();
      if (result.success) {
        // 實現雙重顯示：將正在學習的活動同時顯示在本次課堂活動中
        const currentLessonActivities = result.data.currentLessonActivities || [];
        const ongoingActivities = result.data.ongoingActivities || [];
        const previousLessonActivities = result.data.previousLessonActivities || [];
        
        console.log('原始數據:', {
          currentLessonActivities: currentLessonActivities.length,
          ongoingActivities: ongoingActivities.length,
          previousLessonActivities: previousLessonActivities.length
        });
        
        // 創建一個 Map 來避免重複添加相同的活動
        const currentActivityMap = new Map();
        
        // 首先添加本次課堂的活動
        currentLessonActivities.forEach((activity: any) => {
          const key = activity.id; // 使用 student_activity 的 id 作為唯一標識
          if (key) {
            currentActivityMap.set(key, {
              ...activity,
              source: 'current_lesson' // 標記來源
            });
          }
        });
        
        // 然後添加正在學習的活動（如果不在本次課堂中且未完成）
        let addedOngoingCount = 0;
        let filteredCompletedCount = 0;
        
        ongoingActivities.forEach((activity: any) => {
          const key = activity.id; // 使用 student_activity 的 id 作為唯一標識
          if (key && !currentActivityMap.has(key)) {
            // 檢查活動是否已完成（進度 >= 100%）
            const isCompleted = (activity.progress || 0) >= 100;
            
            // 只有未完成的活動才添加到本次課堂活動中
            if (!isCompleted) {
              // 轉換為本次課堂活動的格式
              const convertedActivity = {
                ...activity,
                lesson_date: lessonDate, // 設置為當前課堂日期
                timeslot: '', // 清空時段（因為是正在學習的活動）
                source: 'ongoing' // 標記來源
              };
              currentActivityMap.set(key, convertedActivity);
              addedOngoingCount++;
            } else {
              filteredCompletedCount++;
            }
          }
        });
        
        // 轉換回數組
        const enhancedCurrentLessonActivities = Array.from(currentActivityMap.values());
        
        console.log('雙重顯示處理完成:', {
          原始本次課堂活動: currentLessonActivities.length,
          原始正在學習活動: ongoingActivities.length,
          增強後本次課堂活動: enhancedCurrentLessonActivities.length,
          正在學習活動: ongoingActivities.length,
          添加到本次課堂的ongoing活動: addedOngoingCount,
          過濾掉的已完成活動: filteredCompletedCount
        });
        
        // 為正在學習的活動添加 source 標記
        const enhancedOngoingActivities = ongoingActivities.map((activity: any) => ({
          ...activity,
          source: 'ongoing' // 標記為正在學習的活動
        }));

        // 設置增強後的活動數據
        setActivities({
          currentLessonActivities: enhancedCurrentLessonActivities,
          previousLessonActivities,
          ongoingActivities: enhancedOngoingActivities
        });
        
        console.log('=== 學生活動載入成功（已實現雙重顯示） ===');
        console.log('增強後本次課堂活動:', enhancedCurrentLessonActivities);
        console.log('正在學習活動:', ongoingActivities);
        console.log('活動總數:', {
          current: enhancedCurrentLessonActivities.length,
          previous: previousLessonActivities.length,
          ongoing: ongoingActivities.length
        });
      } else {
        throw new Error(result.error || '獲取學生活動失敗');
      }
    } catch (err) {
      console.error('載入學生活動失敗:', err);
      setError(err instanceof Error ? err.message : '獲取學生活動失敗');
    } finally {
      setLoading(false);
    }
  }, [studentId, lessonDate, timeslot]);

  const handleActivitySelect = useCallback(async (selectedActivities: TreeActivity[]) => {
    try {
      // 根據活動類型決定分配方式
      const assignmentType = currentActivityType === 'current' ? 'current_lesson' : 'ongoing';
      
      // 調用 API 分配活動給學生
      const requestBody: any = {
        studentId,
        activityIds: selectedActivities.map(activity => activity.id),
        assignmentType // 新增參數來區分分配類型
      };

      // 只有本次課堂活動才需要 lessonDate 和 timeslot
      if (currentActivityType === 'current') {
        requestBody.lessonDate = lessonDate;
        requestBody.timeslot = timeslot;
      }

      const response = await fetch('/api/assign-student-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分配活動失敗');
      }

      const result = await response.json();
      
      if (result.success) {
        // 重新載入學生活動 - 直接實現，不依賴 fetchStudentActivities
        try {
          setLoading(true);
          console.log('重新載入學生活動，分配類型:', currentActivityType);
          const reloadResponse = await fetch(
            `/api/student-activities?studentId=${studentId}&lessonDate=${lessonDate}&timeslot=${timeslot}`
          );
          
          if (reloadResponse.ok) {
            const reloadResult = await reloadResponse.json();
            console.log('重新載入結果:', reloadResult);
                      if (reloadResult.success) {
            console.log('=== 重新載入活動成功 ===');
            console.log('重新載入的完整數據:', reloadResult);
            console.log('重新載入的活動數據:', reloadResult.data);
            console.log('重新載入後的活動總數:', {
              current: reloadResult.data.currentLessonActivities?.length || 0,
              previous: reloadResult.data.previousLessonActivities?.length || 0,
              ongoing: reloadResult.data.ongoingActivities?.length || 0
            });
            setActivities(reloadResult.data);
            console.log('活動資料已更新:', reloadResult.data);
          }
          } else {
            console.error('重新載入響應錯誤:', reloadResponse.status);
          }
        } catch (err) {
          console.error('重新載入學生活動失敗:', err);
        } finally {
          setLoading(false);
        }
        
        // 顯示成功訊息
        const typeText = currentActivityType === 'current' ? '本次課堂' : '正在學習';
        alert(`已成功分配 ${result.data.assignedCount} 個活動到${typeText}活動`);
      } else {
        throw new Error(result.error || '分配活動失敗');
      }
    } catch (error) {
      console.error('分配活動失敗:', error);
      alert(`分配活動失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [currentActivityType, studentId, lessonDate, timeslot]); // 移除 fetchStudentActivities 依賴項

  const handleCloseModal = useCallback(() => {
    setShowActivitySelectionModal(false);
  }, []);

  const handleCurrentActivitySelect = useCallback(() => {
    setCurrentActivityType('current');
    setShowActivitySelectionModal(true);
  }, []);

  const handleOngoingActivitySelect = useCallback(() => {
    setCurrentActivityType('ongoing');
    setShowActivitySelectionModal(true);
  }, []);

  // 載入學生的成長樹
  const loadStudentTrees = useCallback(async () => {
    try {
      const { data: trees, error } = await supabase
        .from('hanami_student_trees')
        .select(`
          id,
          student_id,
          tree_id,
          tree_status,
          enrollment_date,
          created_at,
          hanami_growth_trees (
            id,
            tree_name,
            tree_description,
            course_type_id,
            tree_level,
            is_active
          )
        `)
        .eq('student_id', studentId)
        .or('tree_status.eq.active,status.eq.active');

      if (error) {
        console.error('載入學生成長樹失敗:', error);
        return;
      }

      const normalizedTrees = trees?.map((tree: any) => ({
        id: tree.tree_id,
        tree_name: tree.hanami_growth_trees?.tree_name,
        tree_description: tree.hanami_growth_trees?.tree_description,
        status: tree.tree_status || 'active',
        enrollment_date: tree.enrollment_date,
        created_at: tree.created_at
      })) || [];

      setStudentTrees(normalizedTrees);
      
      if (normalizedTrees.length > 0) {
        const firstTreeId = normalizedTrees[0].id;
        setSelectedTreeId(firstTreeId);
        // 載入第一個成長樹的學習路徑
        if (firstTreeId) {
          await loadLearningPathData(firstTreeId);
        }
      } else {
        // 如果沒有成長樹，清空相關狀態
        setSelectedTreeId('');
        setLearningPathData(null);
        setOrderedNodes([]);
        setNextActivity(null);
      }
    } catch (error) {
      console.error('載入學生成長樹失敗:', error);
    }
  }, [studentId]);

  // 載入學習路徑數據 (從 GrowthTreePathManager 搬過來)
  const loadLearningPathData = useCallback(async (treeId?: string) => {
    const targetTreeId = treeId || selectedTreeId;
    try {
      console.log('=== 開始載入學習路徑 ===');
      console.log('targetTreeId:', targetTreeId);
      console.log('studentId:', studentId);

      // 檢查 treeId 是否有效
      if (!targetTreeId || targetTreeId.trim() === '') {
        console.log('⚠️ 沒有有效的成長樹ID，跳過載入學習路徑');
        return null;
      }

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

      let pathData = null;

      if (currentTreePaths && currentTreePaths.length > 0) {
        // 使用當前成長樹的學習路徑
        pathData = currentTreePaths[0];
        console.log('✅ 使用當前成長樹的學習路徑:', pathData.name);
      } else {
        // 如果當前成長樹沒有學習路徑，嘗試使用預設路徑
        console.log('⚠️ 當前成長樹沒有學習路徑，嘗試使用預設路徑');
        
        // 這裡可以添加預設路徑的邏輯
        // 暫時返回 null
        return null;
      }

      if (pathData) {
        setLearningPathData(pathData);
        const ordered = await getOrderedNodes(pathData);
        setOrderedNodes(ordered);
        
        // 分析下一個活動
        const next = analyzeNextActivity(ordered);
        setNextActivity(next);
        
        return pathData;
      }

      return null;
    } catch (error) {
      console.error('載入學習路徑數據失敗:', error);
      return null;
    }
  }, [selectedTreeId, studentId]);

  // 獲取有序節點 (從 GrowthTreePathManager 搬過來)
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

      console.log('有效節點數量:', validNodes.length);

      // 查詢學生的活動進度
      const { data: studentActivities, error: activitiesError } = await supabase
        .from('hanami_student_activities')
        .select('*')
        .eq('student_id', studentId);

      if (activitiesError) {
        console.error('查詢學生活動失敗:', activitiesError);
      }

      console.log('學生活動數量:', studentActivities?.length || 0);

      // 標記節點狀態
      const normalizedNodes = validNodes.map((node: any) => {
        let isCompleted = false;
        let isInProgress = false;

        if (node.type === 'activity' && studentActivities) {
          // 檢查是否有對應的活動記錄
          const activityRecord = studentActivities.find(activity => 
            activity.activity_id === node.activity_id || 
            activity.tree_id === selectedTreeId
          );

          if (activityRecord) {
            isCompleted = activityRecord.completion_status === 'completed';
            isInProgress = activityRecord.completion_status === 'in_progress';
          }
        }

        return {
          ...node,
          isCompleted,
          isInProgress,
          isLocked: false // 暫時不實現鎖定邏輯
        };
      });

      console.log('標準化節點數量:', normalizedNodes.length);
      return normalizedNodes;
    } catch (error) {
      console.error('處理節點數據失敗:', error);
      return [];
    }
  }, [studentId, selectedTreeId]);

  // 分析下一個活動 (從 GrowthTreePathManager 搬過來)
  const analyzeNextActivity = useCallback((nodes: any[]) => {
    // 只計算實際的學習活動，排除開始和結束節點
    const activityNodes = nodes.filter(node => node.type === 'activity');
    const completedActivities = activityNodes.filter(node => node.isCompleted);
    const incompleteActivities = activityNodes.filter(node => !node.isCompleted && !node.isLocked);
    
    if (incompleteActivities.length === 0) {
      return null;
    }

    const nextNode = incompleteActivities[0];
    const progress = {
      completed: completedActivities.length,
      total: activityNodes.length,
      percentage: activityNodes.length > 0 ? Math.round((completedActivities.length / activityNodes.length) * 100) : 0
    };

    return {
      ...nextNode,
      progress
    };
  }, []);

  // 獲取節點狀態 (從 GrowthTreePathManager 搬過來)
  const getNodeStatus = useCallback((node: any) => {
    if (node.isCompleted) return 'completed';
    if (node.isInProgress) return 'in_progress';
    if (node.isLocked) return 'locked';
    return 'pending';
  }, []);

  // 安排下一個活動 (從 GrowthTreePathManager 搬過來)
  const handleArrangeNextActivity = useCallback(async () => {
    if (!nextActivity || !selectedTreeId) {
      toast.error('沒有可安排的活動');
      return;
    }

    setLoading(true);
    try {
      console.log('開始安排活動:', nextActivity.title);
      
      // 檢查 hanami_student_activities 表是否存在
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_student_activities')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('hanami_student_activities 表不存在:', tableError);
        toast.error('資料庫表不存在，請聯繫管理員創建 hanami_student_activities 表');
        return;
      }
      
      console.log('✅ hanami_student_activities 表存在，可以繼續操作');

      // 分析當前學習路徑的進度
      const completedNodes = orderedNodes.filter(node => node.isCompleted);
      const incompleteNodes = orderedNodes.filter(node => !node.isCompleted && !node.isLocked);

      console.log('已完成節點:', completedNodes.length);
      console.log('未完成節點:', incompleteNodes.length);

      // 找到下一個應該安排的活動
      let targetActivity: any = null;
      
      // 優先選擇第一個未完成且未鎖定的活動
      if (incompleteNodes.length > 0) {
        targetActivity = incompleteNodes[0];
        console.log('🎯 找到下一個活動:', targetActivity.title);
        
        // 檢查活動ID格式
        if (targetActivity.id.startsWith('tree_activity_')) {
          // 提取實際的活動ID
          const actualActivityId = targetActivity.id.replace('tree_activity_', '');
          console.log('🎯 實際活動ID:', actualActivityId);
          targetActivity.actualId = actualActivityId;
          
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
          targetActivity.realActivityId = realActivityId;
        } else {
          console.log('🎯 活動ID格式不正確:', targetActivity.id);
          toast.error('活動ID格式不正確，無法安排活動');
          return;
        }
      } else {
        console.log('⚠️ 沒有找到可安排的活動');
        toast.error('所有活動都已完成或已鎖定，無法安排新的活動');
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
          activity.activity_id === targetActivity.realActivityId
        );
        
        if (isAlreadyInProgress) {
          console.log('建議的活動已經在進行中，跳過此活動');
          toast.success(`活動「${targetActivity.title}」已經在進行中，將尋找下一個活動`);
          
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
            targetActivity = nextAvailableActivity;
          } else {
            console.log('沒有找到其他可用的活動');
            toast('所有活動都已經在進行中或已完成');
            return;
          }
        } else {
          // 建議的活動不在進行中，詢問是否要替換現有活動
          const shouldReplace = window.confirm(
            `學生目前有 ${ongoingActivities.length} 個正在進行的活動。\n\n` +
            `建議安排的下一個活動：${targetActivity.title}\n\n` +
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
        activity_id: targetActivity.realActivityId || targetActivity.actualId || targetActivity.id,
        tree_id: selectedTreeId,
        activity_type: currentActivityType === 'current' ? 'current' : 'ongoing',
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
        
        toast.error(errorMessage);
        return;
      }

      console.log('✅ 活動安排成功:', newActivity);
      toast.success(`活動「${targetActivity.title}」已成功安排！`);
      
      // 重新載入學生活動
      await fetchStudentActivities();
      
      // 重新載入學習路徑數據以更新進度
      await loadLearningPathData(selectedTreeId);
      
      // 關閉學習路徑選擇器
      setShowLearningPathSelector(false);
      
    } catch (error) {
      console.error('安排活動時發生錯誤:', error);
      toast.error('安排活動時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [nextActivity, selectedTreeId, studentId, orderedNodes, currentActivityType, fetchStudentActivities, loadLearningPathData]);

  // 處理學習路徑選擇
  const handleLearningPathSelect = useCallback((activityType: 'current' | 'ongoing') => {
    setCurrentActivityType(activityType);
    setShowLearningPathSelector(true);
    // 載入學生的成長樹
    loadStudentTrees();
  }, [loadStudentTrees]);

  // 載入學習路徑資料
  const loadLearningPaths = useCallback(async (courseType: string) => {
    try {
      console.log('🔍 開始載入學習路徑，課程類型:', courseType);
      
      // 首先根據課程類型獲取成長樹
      const { data: courseTypeData, error: courseTypeError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id')
        .eq('name', courseType)
        .single();

      if (courseTypeError) {
        console.error('❌ 獲取課程類型失敗:', courseTypeError);
        alert(`無法獲取課程類型 "${courseType}" 的資訊`);
        return;
      }

      console.log('✅ 課程類型資料:', courseTypeData);

      // 根據課程類型ID獲取成長樹
      const { data: growthTrees, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name, course_type_id')
        .eq('course_type_id', courseTypeData.id)
        .eq('is_active', true)
        .order('tree_level', { ascending: true });

      if (treesError) {
        console.error('❌ 獲取成長樹失敗:', treesError);
        alert('無法獲取成長樹資訊');
        return;
      }

      console.log('✅ 成長樹資料:', growthTrees);

      if (!growthTrees || growthTrees.length === 0) {
        console.log('⚠️ 該課程類型沒有對應的成長樹');
        alert(`課程類型 "${courseType}" 沒有對應的成長樹`);
        setLearningPaths([]);
        return;
      }

      // 獲取第一個成長樹的學習路徑
      const treeId = growthTrees[0].id;
      console.log('🔍 查詢成長樹ID:', treeId, '的學習路徑');
      
      const response = await fetch(`/api/learning-paths?treeId=${treeId}`);
      console.log('📡 API 響應狀態:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API 響應結果:', result);
        
        if (result.success && result.data && result.data.length > 0) {
          setLearningPaths(result.data);
          console.log('✅ 成功載入學習路徑:', result.data.length, '個');
        } else {
          console.log('⚠️ 沒有找到學習路徑資料');
          alert(`成長樹 "${growthTrees[0].tree_name}" 沒有學習路徑資料`);
          setLearningPaths([]);
        }
      } else {
        const errorResult = await response.json();
        console.error('❌ API 請求失敗:', errorResult);
        alert(`載入學習路徑失敗: ${errorResult.error || '未知錯誤'}`);
        setLearningPaths([]);
      }
    } catch (error) {
      console.error('❌ 載入學習路徑失敗:', error);
      alert(`載入學習路徑時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
      setLearningPaths([]);
    }
  }, []);

  // 分配學習路徑給學生
  const assignLearningPathToStudent = useCallback(async (learningPathId: string) => {
    try {
      // 獲取學習路徑的節點資料
      const learningPath = learningPaths.find(path => path.id === learningPathId);
      if (!learningPath) {
        alert('找不到指定的學習路徑');
        return;
      }

      // 解析學習路徑的節點
      let nodes = learningPath.nodes;
      if (typeof nodes === 'string') {
        nodes = JSON.parse(nodes);
      }

      // 過濾出活動節點
      const activityNodes = nodes.filter((node: any) => node.type === 'activity');
      
      if (activityNodes.length === 0) {
        alert('該學習路徑沒有包含任何活動');
        return;
      }

      // 批量分配活動
      const activityIds = activityNodes.map((node: any) => node.activity_id).filter(Boolean);
      
      if (activityIds.length === 0) {
        alert('該學習路徑的活動節點沒有有效的活動ID');
        return;
      }

      const response = await fetch('/api/assign-student-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          activityIds,
          assignmentType: currentActivityType === 'current' ? 'current_lesson' : 'ongoing',
          lessonDate: currentActivityType === 'current' ? lessonDate : undefined,
          timeslot: currentActivityType === 'current' ? timeslot : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '分配學習路徑失敗');
      }

      alert(`成功分配學習路徑，共 ${activityIds.length} 個活動！`);
      setShowLearningPathSelector(false);
      // 重新載入學生活動
      fetchStudentActivities();
    } catch (error) {
      console.error('分配學習路徑失敗:', error);
      alert(`分配學習路徑失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [learningPaths, currentActivityType, studentId, lessonDate, timeslot]);

  // 處理分配成長樹
  const handleAssignGrowthTree = useCallback(() => {
    setShowTreeAssignmentModal(true);
  }, []);

  // 處理成長樹分配成功
  const handleGrowthTreeAssigned = useCallback(async () => {
    try {
      // 重新檢查學生成長樹狀態
      await checkStudentGrowthTree();
      setShowTreeAssignmentModal(false);
    } catch (error) {
      console.error('處理成長樹分配失敗:', error);
    }
  }, [checkStudentGrowthTree]);

  // 移除學生成長樹
  const handleRemoveGrowthTree = useCallback(async (treeId: string) => {
    if (!confirm('確定要移除這個成長樹嗎？這將清除所有相關的活動分配。')) {
      return;
    }

    try {
      const response = await fetch('/api/remove-student-growth-trees', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId, 
          treeId 
        }),
      });

      if (!response.ok) {
        throw new Error('移除成長樹失敗');
      }

      const result = await response.json();
      if (result.success) {
        alert('成長樹移除成功！');
        await checkStudentGrowthTree();
        // 重新載入學生活動
        await fetchStudentActivities();
      } else {
        throw new Error(result.error || '移除成長樹失敗');
      }
    } catch (error) {
      console.error('移除成長樹失敗:', error);
      alert(`移除成長樹失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [studentId, checkStudentGrowthTree, fetchStudentActivities]);

  // 移除單個學生活動
  const handleRemoveSingleActivity = useCallback(async (activityId: string) => {
    if (!confirm('確定要移除這個活動嗎？')) {
      return;
    }

    try {
      const response = await fetch('/api/remove-single-student-activity', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          activityId 
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '移除活動失敗');
      }

      if (result.success) {
        alert('活動移除成功！');
        // 重新載入學生活動
        await fetchStudentActivities();
      } else {
        throw new Error(result.error || '移除活動失敗');
      }
    } catch (error) {
      console.error('移除活動失敗:', error);
      alert(`移除活動失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [fetchStudentActivities]);

  // 更新活動完成狀態
  const handleUpdateActivityStatus = useCallback(async (activityId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/update-activity-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          activityId,
          status: newStatus
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '更新活動狀態失敗');
      }

      if (result.success) {
        // 重新載入學生活動
        await fetchStudentActivities();
      } else {
        throw new Error(result.error || '更新活動狀態失敗');
      }
    } catch (error) {
      console.error('更新活動狀態失敗:', error);
      alert(`更新活動狀態失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [fetchStudentActivities]);

  // 處理進度條變更（臨時）
  const handleProgressChange = useCallback((activityId: string, progress: number) => {
    setActivities(prev => ({
      ...prev,
      currentLessonActivities: prev.currentLessonActivities.map(activity => 
        activity.id === activityId ? { ...activity, tempProgress: progress } : activity
      ),
      previousLessonActivities: prev.previousLessonActivities.map(activity => 
        activity.id === activityId ? { ...activity, tempProgress: progress } : activity
      ),
      ongoingActivities: prev.ongoingActivities.map(activity => 
        activity.id === activityId ? { ...activity, tempProgress: progress } : activity
      )
    }));
  }, []);

  // 儲存活動進度
  const handleSaveActivityProgress = useCallback(async (activityId: string, progress: number) => {
    console.log('🔄 開始儲存活動進度:', { activityId, progress });
    
    // 防止重複儲存
    if (savingActivityId === activityId) {
      console.log('⚠️ 正在儲存中，跳過重複請求');
      return;
    }
    
    setSavingActivityId(activityId);
    
    try {
      console.log('📡 發送 API 請求...');
      const response = await fetch('/api/update-activity-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          activityId,
          progress
        }),
      });

      console.log('📨 API 響應狀態:', response.status);
      const result = await response.json();
      console.log('📋 API 響應內容:', result);
      
      if (!response.ok) {
        console.error('❌ API 請求失敗:', result);
        throw new Error(result.error || '儲存活動進度失敗');
      }

      if (result.success) {
        console.log('✅ API 請求成功，開始更新前端狀態');
        
        // 立即更新前端狀態，包括進度和完成狀態
        const newCompletionStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
        
        setActivities(prev => ({
          ...prev,
          currentLessonActivities: prev.currentLessonActivities.map(activity => 
            activity.id === activityId ? { 
              ...activity, 
              tempProgress: undefined,
              progress: progress,
              completionStatus: newCompletionStatus
            } : activity
          ),
          previousLessonActivities: prev.previousLessonActivities.map(activity => 
            activity.id === activityId ? { 
              ...activity, 
              tempProgress: undefined,
              progress: progress,
              completionStatus: newCompletionStatus
            } : activity
          ),
          ongoingActivities: prev.ongoingActivities.map(activity => 
            activity.id === activityId ? { 
              ...activity, 
              tempProgress: undefined,
              progress: progress,
              completionStatus: newCompletionStatus
            } : activity
          )
        }));
        
        console.log('🔄 前端狀態已更新，關閉編輯模式');
        // 關閉編輯模式
        setEditingActivityId(null);
        
        // 顯示成功訊息
        alert('進度儲存成功！');
        console.log('✅ 儲存活動進度完成');
        
        // 重新載入活動資料以確保所有組件都顯示最新進度
        console.log('🔄 重新載入活動資料...');
        await fetchStudentActivities();
        
        // 發送全局事件通知其他組件更新
        console.log('📡 發送活動進度更新事件...');
        window.dispatchEvent(new CustomEvent('activityProgressUpdated', {
          detail: { activityId, progress, newCompletionStatus }
        }));
        
        // 如果是在同一頁面的不同組件，強制等待一下後再刷新一次
        setTimeout(async () => {
          console.log('🔄 延遲重新載入以確保所有組件同步...');
          await fetchStudentActivities();
        }, 1000);
      } else {
        console.error('❌ API 回應 success: false');
        throw new Error(result.error || '儲存活動進度失敗');
      }
    } catch (error) {
      console.error('❌ 儲存活動進度失敗:', error);
      alert(`儲存活動進度失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      // 清除儲存狀態
      setSavingActivityId(null);
    }
  }, [fetchStudentActivities]);

  // 取消進度變更
  const handleCancelProgressChange = useCallback((activityId: string) => {
    setActivities(prev => ({
      ...prev,
      currentLessonActivities: prev.currentLessonActivities.map(activity => 
        activity.id === activityId ? { ...activity, tempProgress: undefined } : activity
      ),
      previousLessonActivities: prev.previousLessonActivities.map(activity => 
        activity.id === activityId ? { ...activity, tempProgress: undefined } : activity
      ),
      ongoingActivities: prev.ongoingActivities.map(activity => 
        activity.id === activityId ? { ...activity, tempProgress: undefined } : activity
      )
    }));
    
    // 關閉編輯模式
    setEditingActivityId(null);
  }, []);

  // 重設進度為 0
  const handleResetProgress = useCallback(async (activityId: string) => {
    try {
      const response = await fetch('/api/update-activity-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          activityId,
          progress: 0
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '重設活動進度失敗');
      }

      if (result.success) {
        // 立即更新前端狀態，重設進度和完成狀態
        setActivities(prev => ({
          ...prev,
          currentLessonActivities: prev.currentLessonActivities.map(activity => 
            activity.id === activityId ? { 
              ...activity, 
              tempProgress: undefined,
              progress: 0,
              completionStatus: 'not_started'
            } : activity
          ),
          previousLessonActivities: prev.previousLessonActivities.map(activity => 
            activity.id === activityId ? { 
              ...activity, 
              tempProgress: undefined,
              progress: 0,
              completionStatus: 'not_started'
            } : activity
          ),
          ongoingActivities: prev.ongoingActivities.map(activity => 
            activity.id === activityId ? { 
              ...activity, 
              tempProgress: undefined,
              progress: 0,
              completionStatus: 'not_started'
            } : activity
          )
        }));
        
        // 關閉編輯模式
        setEditingActivityId(null);
        
        // 顯示成功訊息
        alert('進度重設成功！');
      } else {
        throw new Error(result.error || '重設活動進度失敗');
      }
    } catch (error) {
      console.error('重設活動進度失敗:', error);
      alert(`重設活動進度失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [fetchStudentActivities]);

  // 移除學生活動（批量）
  const handleRemoveActivities = useCallback(async (activityType: 'current' | 'ongoing') => {
    const typeText = activityType === 'current' ? '本次課堂活動' : '正在學習的活動';
    if (!confirm(`確定要移除學生的${typeText}嗎？`)) {
      return;
    }

    try {
      const response = await fetch('/api/remove-student-activities', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId, 
          activityType,
          lessonDate: activityType === 'current' ? lessonDate : undefined,
          timeslot: activityType === 'current' ? timeslot : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('移除活動失敗');
      }

      const result = await response.json();
      if (result.success) {
        alert(`${typeText}移除成功！`);
        // 重新載入學生活動
        await fetchStudentActivities();
      } else {
        throw new Error(result.error || '移除活動失敗');
      }
    } catch (error) {
      console.error('移除活動失敗:', error);
      alert(`移除活動失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [studentId, lessonDate, timeslot, fetchStudentActivities]);

  useEffect(() => {
    if (studentId && lessonDate) {
      // 優先載入學生活動，其他資訊延遲載入
      fetchStudentActivities();
      
      // 延遲載入學生資訊和成長樹檢查
      setTimeout(() => {
      fetchStudentInfo();
        checkStudentGrowthTree();
      }, 100);
    }
  }, [studentId, lessonDate, timeslot]);

  const getStatusIcon = (status: string, progress?: number) => {
    // 基於進度判斷狀態
    if (progress !== undefined) {
      if (progress >= 100) {
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      } else if (progress > 0) {
        return <PlayIcon className="w-4 h-4 text-orange-500" />;
      } else {
        return <PauseIcon className="w-4 h-4 text-gray-400" />;
      }
    }
    
    // 回退到基於狀態的判斷
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="w-4 h-4 text-orange-500" />;
      case 'not_started':
        return <PauseIcon className="w-4 h-4 text-gray-400" />;
      default:
        return <PauseIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, progress?: number) => {
    // 基於進度判斷狀態
    if (progress !== undefined) {
      if (progress >= 100) {
        return '已完成';
      } else if (progress > 0) {
        return '未完成';
      } else {
        return '未完成';
      }
    }
    
    // 回退到基於狀態的判斷
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '未完成';
      case 'not_started':
        return '未完成';
      case 'skipped':
        return '已跳過';
      default:
        return '未完成';
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 5:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'teaching':
        return 'bg-purple-100 text-purple-800';
      case 'practice':
        return 'bg-blue-100 text-blue-800';
      case 'assessment':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 過濾活動
  const getFilteredActivities = (activities: StudentActivity[]) => {
    switch (activityStatusFilter) {
      case 'completed':
        return activities.filter(activity => (activity.progress || 0) >= 100);
      case 'not_completed':
        return activities.filter(activity => (activity.progress || 0) < 100);
      default:
        return activities;
    }
  };

  const renderActivityCard = (activity: StudentActivity, type: string) => {
    const isNotStarted = activity.completionStatus === 'not_started';
    const isOngoing = type === 'ongoing';
    
    return (
      <div key={activity.id} className={`rounded-lg border p-4 mb-3 hover:shadow-md transition-shadow ${
        isOngoing ? 'bg-white border-pink-200' : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* 狀態顯示 - 基於進度判斷狀態 */}
            <div className="flex items-center gap-1">
              {getStatusIcon(activity.completionStatus, activity.progress)}
              <span className="text-xs text-gray-600">{getStatusText(activity.completionStatus, activity.progress)}</span>
            </div>
            <h4 className="font-medium text-gray-900">
              {activity.activityName || `活動 ${activity.id.slice(0, 8)}`}
            </h4>
            {!activity.activityName && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                ⚠️ 缺少活動資訊
              </span>
            )}
            {activity.isFavorite && (
              <StarIcon className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(activity.difficultyLevel || 1)}`}>
              難度 {activity.difficultyLevel || 1}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.activityType || 'unknown')}`}>
              {activity.activityType || '未知類型'}
            </span>
            {activity.estimatedDuration > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ClockIcon className="w-3 h-3" />
                {activity.estimatedDuration}分鐘
              </div>
            )}
            {/* 操作按鈕 */}
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              {/* 編輯按鈕 */}
              <button
                onClick={() => {
                  console.log('🖊️ 點擊編輯按鈕:', {
                    activityId: activity.id,
                    currentEditingId: editingActivityId,
                    activityName: activity.activityName
                  });
                  setEditingActivityId(editingActivityId === activity.id ? null : activity.id);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300 transition-colors min-w-fit"
                title="編輯活動進度"
              >
                <PencilIcon className="w-3 h-3" />
                編輯
              </button>
              
              {/* 移除按鈕 - 未開始狀態或進度為0%時顯示 */}
              {(!isNotStarted || (activity.progress || 0) === 0) && (
                <button
                  onClick={() => handleRemoveSingleActivity(activity.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-rose-200 text-rose-700 rounded text-xs hover:bg-rose-300 transition-colors"
                  title="移除這個活動"
                >
                  <TrashIcon className="w-3 h-3" />
                  移除
                </button>
              )}
            </div>
          </div>
        </div>

      {(activity.activityDescription || (activity as any).activityId) && (
        <p className="text-sm text-stone-600 mb-2">
          {activity.activityDescription || `活動ID: ${(activity as any).activityId}`}
        </p>
      )}

      {/* 進度設定區域 - 只在編輯模式下顯示 */}
      {editingActivityId === activity.id && (
        <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">編輯完成進度</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-600">{activity.tempProgress !== undefined ? activity.tempProgress : (activity.progress || 0)}%</span>
              <button
                onClick={() => handleSaveActivityProgress(activity.id, activity.tempProgress !== undefined ? activity.tempProgress : (activity.progress || 0))}
                className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                  savingActivityId === activity.id 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
                disabled={savingActivityId === activity.id}
              >
                {savingActivityId === activity.id ? '儲存中...' : '儲存'}
              </button>
              <button
                onClick={() => {
                  handleCancelProgressChange(activity.id);
                  setEditingActivityId(null);
                }}
                className="px-3 py-1 text-xs bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={() => handleResetProgress(activity.id)}
                className="px-3 py-1 text-xs bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors font-medium"
              >
                重設
              </button>
            </div>
          </div>
          
          {/* 可拖動的進度條 */}
          <div className="relative w-full mb-2">
            <input
              type="range"
              min="0"
              max="100"
              value={activity.tempProgress !== undefined ? activity.tempProgress : (activity.progress || 0)}
              onChange={(e) => handleProgressChange(activity.id, parseInt(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #94A3B8 0%, #10B981 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-stone-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* 快速設定按鈕 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-stone-600">快速設定:</span>
            <button
              onClick={() => handleProgressChange(activity.id, 0)}
              className="px-2 py-1 text-xs bg-stone-200 text-stone-700 rounded hover:bg-stone-300 transition-colors"
            >
              0%
            </button>
            <button
              onClick={() => handleProgressChange(activity.id, 25)}
              className="px-2 py-1 text-xs bg-rose-200 text-rose-700 rounded hover:bg-rose-300 transition-colors"
            >
              25%
            </button>
            <button
              onClick={() => handleProgressChange(activity.id, 50)}
              className="px-2 py-1 text-xs bg-amber-200 text-amber-700 rounded hover:bg-amber-300 transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => handleProgressChange(activity.id, 75)}
              className="px-2 py-1 text-xs bg-orange-200 text-orange-700 rounded hover:bg-orange-300 transition-colors"
            >
              75%
            </button>
            <button
              onClick={() => handleProgressChange(activity.id, 100)}
              className="px-2 py-1 text-xs bg-emerald-200 text-emerald-700 rounded hover:bg-emerald-300 transition-colors"
            >
              100%
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>狀態: {getStatusText(activity.completionStatus)}</span>
            {activity.tempProgress !== undefined && activity.tempProgress !== (activity.progress || 0) && (
              <span className="text-amber-600 font-medium">未儲存</span>
            )}
          </div>
        </div>
      )}

      {/* 進度條顯示 - 根據圖中設計 */}
      {!editingActivityId || editingActivityId !== activity.id ? (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#4B4036]">完成進度</span>
            <span className="text-sm font-medium text-[#8B5CF6]">{activity.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${activity.progress || 0}%` }}
            ></div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs text-stone-500 mt-3">
        <div className="flex items-center gap-2">
          <span>分配時間: {activity.assignedAt ? new Date(activity.assignedAt).toLocaleDateString() : '未知'}</span>
          {activity.timeSpent && (
            <span>• 已用時: {activity.timeSpent}分鐘</span>
          )}
        </div>
        {activity.performanceRating && (
          <div className="flex items-center gap-1">
            <AcademicCapIcon className="w-3 h-3" />
            評分: {activity.performanceRating}/5
          </div>
        )}
      </div>

      {activity.teacherNotes && (
        <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
          <strong>教師備註:</strong> {activity.teacherNotes}
        </div>
      )}
    </div>
  );
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
        <p className="text-[#2B3A3B] text-sm">{loadingText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-sm">
        錯誤: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 學生資訊 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {studentInfo?.full_name || '學生'}
            </h3>
            <p className="text-sm text-gray-600">
              {studentInfo?.course_type || '課程'} • {typeof studentInfo?.student_age === 'number' ? `${Math.floor(studentInfo.student_age / 12)}歲` : '年齡未知'}
            </p>
          </div>
        </div>
      </div>

      {/* 活動狀態過濾器 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">活動狀態過濾</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivityStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activityStatusFilter === 'all'
                  ? 'bg-[#FFD59A] text-[#4B4036]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActivityStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activityStatusFilter === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已完成
            </button>
            <button
              onClick={() => setActivityStatusFilter('not_completed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activityStatusFilter === 'not_completed'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              未完成
            </button>
          </div>
        </div>
      </div>

      {/* 本次課堂活動 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              本次課堂活動
            </h3>
            <span className="text-sm text-gray-500">（僅限本次課堂）</span>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => handleLearningPathSelect('current')}
            className="flex items-center gap-2 px-3 py-1 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors text-sm font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            學習路徑
          </button>
          <button
            onClick={handleCurrentActivitySelect}
              className="flex items-center gap-2 px-3 py-1 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors text-sm font-medium shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            選擇活動
          </button>
            {activities.currentLessonActivities.length > 0 && (
              <button
                onClick={() => handleRemoveActivities('current')}
                className="flex items-center gap-2 px-3 py-1 bg-[#FFE0E0] text-[#4B4036] rounded-lg hover:bg-[#FFD0D0] transition-colors text-sm font-medium shadow-sm"
                title="移除本次課堂活動"
              >
                <TrashIcon className="w-4 h-4" />
                移除活動
              </button>
            )}
          </div>
        </div>
        
        {(() => {
          const filteredActivities = getFilteredActivities(activities.currentLessonActivities);
          return filteredActivities.length > 0 ? (
          <div className="space-y-3">
              {filteredActivities.map((activity) => renderActivityCard(activity, 'current'))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <BookOpenIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {activityStatusFilter === 'all' ? '暫無本次課堂活動' : 
                 activityStatusFilter === 'completed' ? '暫無已完成的活動' : '暫無未完成的活動'}
              </p>
            <p className="text-xs text-gray-400 mt-1">點擊上方按鈕選擇活動</p>
          </div>
          );
        })()}
      </div>

      {/* 上次課堂活動 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            上次課堂活動
          </h3>
          <span className="text-sm text-gray-500">（供參考）</span>
        </div>
        
        {activities.previousLessonActivities.length > 0 ? (
          <div className="space-y-3">
            {activities.previousLessonActivities.map((activity) => renderActivityCard(activity, 'previous'))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <BookOpenIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暫無上次課堂活動</p>
            <p className="text-xs text-gray-400 mt-1">這是學生上次課堂的活動記錄</p>
          </div>
        )}
      </div>

      {/* 正在學習的活動 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-green-500" />
              正在學習的活動
            </h3>
            <span className="text-sm text-gray-500">（跨多個課堂）</span>
          </div>
          <div className="flex items-center gap-2">
            {hasGrowthTree === false ? (
              <button
                onClick={handleAssignGrowthTree}
                className="flex items-center gap-2 px-3 py-1 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#DDBA90] transition-colors text-sm font-medium shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                分配成長樹
              </button>
            ) : (
              <>
                <button
                  onClick={handleAssignGrowthTree}
                  className="flex items-center gap-2 px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#FFC97A] transition-colors text-sm font-medium shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  選擇成長樹
                </button>
                <button
                  onClick={() => handleLearningPathSelect('ongoing')}
                  className="flex items-center gap-2 px-3 py-1 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors text-sm font-medium shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  學習路徑
                </button>
          <button
            onClick={handleOngoingActivitySelect}
                  className="flex items-center gap-2 px-3 py-1 bg-[#FFB6C1] text-[#4B4036] rounded-lg hover:bg-[#FFA0B0] transition-colors text-sm font-medium shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            選擇活動
          </button>
                {activities.ongoingActivities.length > 0 && (
                  <button
                    onClick={() => handleRemoveActivities('ongoing')}
                    className="flex items-center gap-2 px-3 py-1 bg-[#FFE0E0] text-[#4B4036] rounded-lg hover:bg-[#FFD0D0] transition-colors text-sm font-medium shadow-sm"
                    title="移除正在學習的活動"
                  >
                    <TrashIcon className="w-4 h-4" />
                    移除活動
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {hasGrowthTree === false ? (
          <div className="text-center py-6 bg-[#FFF3E0] rounded-lg border border-[#EADBC8]">
            <AcademicCapIcon className="w-8 h-8 text-[#EBC9A4] mx-auto mb-2" />
            <p className="text-sm text-[#4B4036] font-medium">學生尚未分配成長樹</p>
            <p className="text-xs text-[#2B3A3B] mt-1 mb-3">需要先為學生分配成長樹才能分配長期活動</p>
            <button
              onClick={handleAssignGrowthTree}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#DDBA90] transition-colors text-sm font-medium shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              立即分配成長樹
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 顯示學生的成長樹 */}
            {studentGrowthTrees.length > 0 && (
              <div className="bg-[#FFF9F2] rounded-lg border border-[#EADBC8] p-4">
                <h4 className="text-sm font-medium text-[#4B4036] mb-3 flex items-center gap-2">
                  <span className="text-lg">🌳</span>
                  學生的成長樹 ({studentGrowthTrees.length})
                </h4>
                <div className="space-y-2">
                  {studentGrowthTrees.map((treeAssignment) => (
                    <div key={treeAssignment.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#EADBC8]">
                      <div className="flex-1">
                        <div className="font-medium text-[#4B4036]">
                          {treeAssignment.hanami_growth_trees?.tree_name || '未命名成長樹'}
                        </div>
                        <div className="text-xs text-[#2B3A3B]">
                          {treeAssignment.hanami_growth_trees?.tree_description || '無描述'}
                        </div>
                        <div className="text-xs text-[#A68A64] mt-1">
                          分配日期：{treeAssignment.start_date}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveGrowthTree(treeAssignment.tree_id)}
                        className="flex items-center gap-1 px-2 py-1 bg-[#FFE0E0] text-[#4B4036] rounded text-xs hover:bg-[#FFD0D0] transition-colors"
                        title="移除這個成長樹"
                      >
                        <TrashIcon className="w-3 h-3" />
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 正在學習的活動過濾按鈕 */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-[#4B4036]">正在學習的活動</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivityStatusFilter('not_completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activityStatusFilter === 'not_completed' 
                      ? 'bg-[#FFB6C1] text-[#4B4036]' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  未完成
                </button>
                <button
                  onClick={() => setActivityStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activityStatusFilter === 'completed' 
                      ? 'bg-[#FFB6C1] text-[#4B4036]' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  已完成
                </button>
                <button
                  onClick={() => setActivityStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activityStatusFilter === 'all' 
                      ? 'bg-[#FFB6C1] text-[#4B4036]' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={handleOngoingActivitySelect}
                  className="px-3 py-1 bg-[#FFB6C1] text-[#4B4036] rounded-lg hover:bg-[#FFA0B0] transition-colors text-xs font-medium"
                >
                  選擇活動
                </button>
                <button
                  onClick={() => handleLearningPathSelect('ongoing')}
                  className="px-3 py-1 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors text-xs font-medium"
                >
                  學習路徑
                </button>
              </div>
            </div>

            {/* 顯示正在學習的活動 */}
            {(() => {
              const filteredOngoingActivities = getFilteredActivities(activities.ongoingActivities);
              return filteredOngoingActivities.length > 0 ? (
                <div className="space-y-3">
                  {filteredOngoingActivities.map((activity) => renderActivityCard(activity, 'ongoing'))}
                </div>
              ) : (
              <div className="text-center py-6 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <AcademicCapIcon className="w-8 h-8 text-[#FFD59A] mx-auto mb-2" />
                <p className="text-sm text-[#4B4036] font-medium">
                  {activityStatusFilter === 'all' ? '暫無正在學習的活動' : 
                   activityStatusFilter === 'completed' ? '暫無已完成的活動' : '暫無未完成的活動'}
                </p>
                <p className="text-xs text-[#2B3A3B] mt-1 mb-3">可以為成長樹分配長期活動</p>
                <button
                  onClick={handleOngoingActivitySelect}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFB6C1] text-[#4B4036] rounded-lg hover:bg-[#FFA0B0] transition-colors text-sm font-medium shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  選擇活動
                </button>
              </div>
            );
          })()}
          </div>
        )}
      </div>

      {/* 活動統計 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">活動統計</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{activities.currentLessonActivities.length}</div>
            <div className="text-xs text-gray-500">本次活動</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{activities.previousLessonActivities.length}</div>
            <div className="text-xs text-gray-500">上次活動</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{activities.ongoingActivities.length}</div>
            <div className="text-xs text-gray-500">進行中</div>
          </div>
        </div>
      </div>

      {/* 活動選擇模態 */}
      {showActivitySelectionModal && (
        <ActivitySelectionModal
          open={showActivitySelectionModal}
          onClose={handleCloseModal}
          onSelect={handleActivitySelect}
          mode="multiple"
          activityType={currentActivityType}
          studentId={studentId}
        />
      )}

      {/* 分配成長樹模態 */}
      {showTreeAssignmentModal && (
        <StudentTreeAssignmentModal
          isOpen={showTreeAssignmentModal}
          onClose={() => setShowTreeAssignmentModal(false)}
          student={studentInfo ? {
            id: studentId,
            full_name: studentInfo.full_name || '',
            nick_name: studentInfo.nick_name,
            course_type: studentInfo.course_type
          } : undefined}
          onSuccess={handleGrowthTreeAssigned}
        />
      )}

      {/* 學習路徑選擇器模態視窗 - 使用 GrowthTreePathManager 的設計 */}
      {showLearningPathSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F5F0EB] rounded-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl border-2 border-[#E8D5C4] animate-scale-in">
            {/* 模態視窗標題 */}
            <div className="px-6 py-4 border-b border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#2B3A3B]">學習路徑管理</h3>
                  <p className="text-sm text-[#87704e]">為 {studentInfo?.full_name || '學生'} 選擇學習路徑</p>
                </div>
                <button
                  onClick={() => setShowLearningPathSelector(false)}
                  className="p-2 hover:bg-[#E8D5C4] rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-[#87704e]" />
                </button>
              </div>
            </div>

            {/* 成長樹選擇器 */}
            {studentTrees.length > 0 && (
              <div className="px-6 py-4 border-b border-[#E8D5C4] bg-white/50">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-[#2B3A3B] whitespace-nowrap">選擇成長樹</label>
                  <div className="relative flex-1">
                    <select
                      value={selectedTreeId}
                      onChange={async (e) => {
                        const newTreeId = e.target.value;
                        setSelectedTreeId(newTreeId);
                        // 重新載入學習路徑數據
                        setLoading(true);
                        try {
                          const pathData = await loadLearningPathData(newTreeId);
                          if (pathData) {
                            setLearningPathData(pathData);
                            const ordered = await getOrderedNodes(pathData);
                            setOrderedNodes(ordered);
                            const next = analyzeNextActivity(ordered);
                            setNextActivity(next);
                          } else {
                            // 如果沒有找到學習路徑，清空數據
                            setOrderedNodes([]);
                            setLearningPathData(null);
                            setNextActivity(null);
                          }
                        } catch (error) {
                          console.error('載入學習路徑失敗:', error);
                          setOrderedNodes([]);
                          setLearningPathData(null);
                          setNextActivity(null);
                        } finally {
                          setLoading(false);
                        }
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

            {/* 主要內容 */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-6 pb-8">
              
              {/* 安排下一個活動區域 */}
              <AnimatePresence>
                {nextActivity && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="bg-gradient-to-r from-[#FFD59A] via-[#EBC9A4] to-[#FFB6C1] border-2 border-[#FFD59A] shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl p-6">
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
                          <button
                            onClick={handleArrangeNextActivity}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
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
                          </button>
                          
                          <button
                            onClick={() => setShowPathList(!showPathList)}
                            className="px-4 py-3 rounded-xl border-2 border-[#E8D5C4] hover:border-[#FFD59A] transition-all duration-300 bg-white"
                          >
                            {showPathList ? '隱藏詳細' : '查看全部'}
                          </button>
                        </motion.div>
                      </div>
                    </div>
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
                    <div className="bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border-2 border-[#D1D5DB] rounded-xl p-6">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 學習路徑概覽 */}
              <div className="bg-white rounded-xl p-6 border border-[#E8D5C4] shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#2B3A3B]">學習路徑概覽</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // 重新載入學習路徑數據
                          setLoading(true);
                          const newPathData = await loadLearningPathData(selectedTreeId);
                          if (newPathData) {
                            const ordered = await getOrderedNodes(newPathData);
                            setOrderedNodes(ordered);
                            setLearningPathData(newPathData);
                            const next = analyzeNextActivity(ordered);
                            setNextActivity(next);
                          } else {
                            // 如果沒有找到學習路徑，清空數據
                            setOrderedNodes([]);
                            setLearningPathData(null);
                            setNextActivity(null);
                          }
                          setLoading(false);
                        }}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-[#8B5CF6] hover:text-[#7C3AED] transition-colors bg-[#8B5CF6]/10 rounded-lg hover:bg-[#8B5CF6]/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>重新載入</span>
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto"></div>
                      <p className="text-[#87704e] mt-2">載入中...</p>
                    </div>
                  ) : orderedNodes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AcademicCapIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暫無可用學習路徑</h3>
                      <p className="text-gray-500">學習路徑正在準備中，敬請期待！</p>
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
                              <span>學習路徑包含 {orderedNodes.filter(n => n.type === 'activity').length} 個學習活動</span>
                              <span>•</span>
                              <span>已完成 {orderedNodes.filter(n => n.type === 'activity' && n.isCompleted).length} 個</span>
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
                          <div className="space-y-3 max-h-96 overflow-y-auto">
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
              </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="px-6 py-4 border-t border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-b-2xl">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLearningPathSelector(false)}
                  className="px-4 py-2 bg-white border border-[#E8D5C4] text-[#2B3A3B] rounded-lg hover:bg-[#F5F0EB] transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentActivitiesPanel; 
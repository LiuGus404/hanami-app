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
  PencilIcon
} from '@heroicons/react/24/outline';
import ActivitySelectionModal from './ActivitySelectionModal';
import StudentTreeAssignmentModal from './StudentTreeAssignmentModal';

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
  const [studentGrowthTrees, setStudentGrowthTrees] = useState<any[]>([]);
  const [activityStatusFilter, setActivityStatusFilter] = useState<'all' | 'completed' | 'not_completed'>('not_completed');
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
        console.log('=== 學生活動載入成功 ===');
        console.log('完整響應數據:', result);
        console.log('當前課堂活動:', result.data.currentLessonActivities);
        console.log('之前課堂活動:', result.data.previousLessonActivities);
        console.log('正在學習活動:', result.data.ongoingActivities);
        console.log('活動總數:', {
          current: result.data.currentLessonActivities?.length || 0,
          previous: result.data.previousLessonActivities?.length || 0,
          ongoing: result.data.ongoingActivities?.length || 0
        });
        setActivities(result.data);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="w-4 h-4 text-blue-500" />;
      case 'not_started':
        return <PauseIcon className="w-4 h-4 text-gray-400" />;
      default:
        return <PauseIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '進行中';
      case 'not_started':
        return '未開始';
      case 'skipped':
        return '已跳過';
      default:
        return '未知';
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
        return activities.filter(activity => activity.completionStatus === 'completed');
      case 'not_completed':
        return activities.filter(activity => activity.completionStatus !== 'completed');
      default:
        return activities;
    }
  };

  const renderActivityCard = (activity: StudentActivity, type: string) => {
    const isNotStarted = activity.completionStatus === 'not_started';
    
    return (
      <div key={activity.id} className="bg-white rounded-lg border border-stone-200 p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
            {/* 狀態顯示 - 未開始狀態不顯示按鈕 */}
            {isNotStarted ? (
              <div className="flex items-center gap-1">
                {getStatusIcon(activity.completionStatus)}
                <span className="text-xs text-gray-600">{getStatusText(activity.completionStatus)}</span>
              </div>
            ) : (
              <button
                onClick={() => handleUpdateActivityStatus(activity.id, 
                  activity.completionStatus === 'completed' ? 'not_started' : 'completed'
                )}
                className="flex items-center gap-1 hover:bg-gray-100 rounded p-1 transition-colors"
                title={activity.completionStatus === 'completed' ? '標記為未完成' : '標記為已完成'}
              >
          {getStatusIcon(activity.completionStatus)}
                <span className="text-xs text-gray-600">{getStatusText(activity.completionStatus)}</span>
              </button>
            )}
          <h4 className="font-medium text-gray-900">{activity.activityName}</h4>
          {activity.isFavorite && (
            <StarIcon className="w-4 h-4 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(activity.difficultyLevel)}`}>
            難度 {activity.difficultyLevel}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.activityType)}`}>
            {activity.activityType}
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
              
              {/* 移除按鈕 - 未開始狀態不顯示 */}
              {!isNotStarted && (
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

      {activity.activityDescription && (
        <p className="text-sm text-stone-600 mb-2">{activity.activityDescription}</p>
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

            {/* 顯示正在學習的活動 */}
            {(() => {
              const filteredOngoingActivities = getFilteredActivities(activities.ongoingActivities);
              return filteredOngoingActivities.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[#4B4036] mb-2">正在學習的活動</h4>
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
    </div>
  );
};

export default StudentActivitiesPanel; 
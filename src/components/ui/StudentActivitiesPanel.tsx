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
  PlusIcon
} from '@heroicons/react/24/outline';
import ActivitySelectionModal from './ActivitySelectionModal';

interface StudentActivity {
  id: string;
  treeActivityId: string;
  activityName: string;
  activityDescription: string;
  activityType: string;
  difficultyLevel: number;
  estimatedDuration: number;
  materialsNeeded: string[];
  instructions: string;
  learningObjectives: string[];
  completionStatus: string;
  performanceRating?: number;
  studentNotes?: string;
  teacherNotes?: string;
  timeSpent?: number;
  attemptsCount?: number;
  isFavorite?: boolean;
  assignedAt?: string;
  createdAt?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showActivitySelectionModal, setShowActivitySelectionModal] = useState(false);
  const [currentActivityType, setCurrentActivityType] = useState<'current' | 'ongoing'>('current');

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

  const fetchStudentActivities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/student-activities?studentId=${studentId}&lessonDate=${lessonDate}&timeslot=${timeslot}`
      );
      
      if (!response.ok) {
        throw new Error('獲取學生活動失敗');
      }

      const result = await response.json();
      if (result.success) {
        setActivities(result.data);
      } else {
        throw new Error(result.error || '獲取學生活動失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取學生活動失敗');
    } finally {
      setLoading(false);
    }
  }, [studentId, lessonDate, timeslot]); // 恢復所有依賴項

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

  useEffect(() => {
    if (studentId && lessonDate && timeslot) {
      fetchStudentActivities();
      fetchStudentInfo();
    }
  }, [studentId, lessonDate, timeslot]); // 恢復依賴項，但移除函數依賴項

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

  const renderActivityCard = (activity: StudentActivity, type: string) => (
    <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(activity.completionStatus)}
          <h4 className="font-medium text-gray-900">{activity.activityName}</h4>
          {activity.isFavorite && (
            <StarIcon className="w-4 h-4 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {activity.activityDescription && (
        <p className="text-sm text-gray-600 mb-2">{activity.activityDescription}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{getStatusText(activity.completionStatus)}</span>
        {activity.performanceRating && (
          <div className="flex items-center gap-1">
            <AcademicCapIcon className="w-3 h-3" />
            評分: {activity.performanceRating}/5
          </div>
        )}
      </div>

      {activity.teacherNotes && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <strong>教師備註:</strong> {activity.teacherNotes}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
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
          <button
            onClick={handleCurrentActivitySelect}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            選擇活動
          </button>
        </div>
        
        {activities.currentLessonActivities.length > 0 ? (
          <div className="space-y-3">
            {activities.currentLessonActivities.map((activity) => renderActivityCard(activity, 'current'))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <BookOpenIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暫無本次課堂活動</p>
            <p className="text-xs text-gray-400 mt-1">點擊上方按鈕選擇活動</p>
          </div>
        )}
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
          <button
            onClick={handleOngoingActivitySelect}
            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            選擇活動
          </button>
        </div>
        
        {activities.ongoingActivities.length > 0 ? (
          <div className="space-y-3">
            {activities.ongoingActivities.map((activity) => renderActivityCard(activity, 'ongoing'))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <AcademicCapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暫無正在學習的活動</p>
            <p className="text-xs text-gray-400 mt-1">點擊上方按鈕選擇長期活動</p>
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
    </div>
  );
};

export default StudentActivitiesPanel; 
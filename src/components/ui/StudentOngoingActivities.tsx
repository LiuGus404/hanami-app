import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  AcademicCapIcon, 
  PlayIcon,
  CheckCircleIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface OngoingActivity {
  id: string;
  activityName: string;
  activityDescription?: string;
  activityType: string;
  difficultyLevel: number;
  estimatedDuration: number;
  completionStatus: string;
  progress?: number;
  assignedAt?: string;
}

interface StudentOngoingActivitiesProps {
  studentId: string;
}

const StudentOngoingActivities: React.FC<StudentOngoingActivitiesProps> = ({ studentId }) => {
  const [ongoingActivities, setOngoingActivities] = useState<OngoingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchOngoingActivities = async () => {
      try {
        setLoading(true);
        
        // 獲取正在學習的活動
        const response = await fetch(`/api/student-ongoing-activities?studentId=${studentId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setOngoingActivities(result.data || []);
          }
        }
      } catch (error) {
        console.error('載入學習中活動失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchOngoingActivities();
    }
  }, [studentId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="w-3 h-3 text-blue-500" />;
      default:
        return <PauseIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'teaching':
        return 'bg-purple-100 text-purple-700';
      case 'practice':
        return 'bg-blue-100 text-blue-700';
      case 'assessment':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFD59A]"></div>
        <span className="ml-2 text-xs text-gray-500">載入中...</span>
      </div>
    );
  }

  if (ongoingActivities.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        暫無學習中活動
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 學習中活動標題 - 可點擊展開/收起 */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1">
          <AcademicCapIcon className="w-4 h-4 text-[#FFD59A]" />
          <span className="text-xs font-medium text-[#4B4036]">學習中活動</span>
          <span className="text-xs text-gray-500">({ongoingActivities.length})</span>
        </div>
        <div className={`transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="#4B4036" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* 活動列表 - 收起時不顯示 */}
      {expanded && (
        <div className="flex flex-wrap gap-2">
          {ongoingActivities.map((activity, index) => (
            <div 
              key={activity.id}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] rounded-lg px-3 py-2 border border-[#EADBC8] min-w-0"
            >
              {/* 活動名稱 */}
              <span className="text-sm font-medium text-[#4B4036] truncate">
                {activity.activityName}
              </span>
              
              {/* 進度 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${activity.progress || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-[#4B4036] min-w-fit">
                  {activity.progress || 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentOngoingActivities;

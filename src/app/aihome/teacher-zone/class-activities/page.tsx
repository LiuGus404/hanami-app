'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  CakeIcon,
  AcademicCapIcon,
  UserIcon,
  SparklesIcon,
  TagIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { HanamiCard, HanamiButton, LessonPlanModal, GrowthTreeDetailModal, StudentActivitiesPanel } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import SimpleAbilityAssessmentModal from '@/components/ui/SimpleAbilityAssessmentModal';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';

interface Lesson {
  id: string;
  student_id: string;
  lesson_date: string;
  actual_timeslot: string;
  lesson_duration: string;
  lesson_status: string;
  lesson_teacher: string;
  lesson_activities: string;
  progress_notes: string;
  next_target: string;
  notes: string;
  remarks: string;
  full_name: string;
  assignedActivities?: any[]; // 添加分配的活動
  Hanami_Students?: {
    id: string;
    full_name: string;
    nick_name: string;
    student_age: number;
    gender: string;
    course_type: string;
    student_teacher: string;
  };
}

interface TrialLesson {
  id: string;
  full_name: string;
  nick_name: string;
  student_age: number;
  gender: string;
  course_type: string;
  lesson_date: string;
  actual_timeslot: string;
  lesson_duration: string;
  trial_status: string;
}

interface TreeActivity {
  id: string;
  tree_id: string;
  activity_id: string;
  activity_source: string;
  custom_activity_name: string;
  custom_activity_description: string;
  activity_type: string;
  difficulty_level: number;
  estimated_duration: number;
  materials_needed: string[];
  instructions: string;
  learning_objectives: string[];
  target_abilities: string[];
  prerequisites: string[];
  priority_order: number;
  activity_order: number;
  is_required: boolean;
  is_active: boolean;
  hanami_teaching_activities?: {
    id: string;
    activity_name: string;
    activity_description: string;
    activity_type: string;
    difficulty_level: number;
    duration_minutes: number;
    materials_needed: string[];
    instructions: string;
    custom_fields: any;
    template_id: string;
    status: string;
    tags: string[];
    category: string;
    created_at: string;
  };
  hanami_growth_trees?: {
    id: string;
    tree_name: string;
    tree_description: string;
    tree_icon: string;
    course_type_id: string;
    tree_level: number;
  };
}

interface AssignedActivity {
  id: string;
  lesson_id: string;
  student_id: string;
  tree_activity_id: string;
  completion_status: string;
  performance_rating: number;
  student_notes: string;
  teacher_notes: string;
  time_spent: number;
  attempts_count: number;
  is_favorite: boolean;
  assigned_by: string;
  created_at: string;
}

interface TimeSlotGroup {
  date: string;
  timeSlot: string;
  lessons: (Lesson | TrialLesson)[];
}

export default function TeacherZoneClassActivitiesPage() {
  const { user } = useSaasAuth();
  const { hasTeacherAccess } = useTeacherAccess();
  const router = useRouter();

  // 使用香港時區的今天日期
  const getTodayInHongKong = () => {
    const today = new Date();
    const hongKongTime = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
    console.log('🌏 香港時區今天:', hongKongTime.toISOString().split('T')[0]);
    console.log('🗓️ 今天是星期:', hongKongTime.getDay()); // 0=星期日, 1=星期一...6=星期六
    return hongKongTime;
  };
  
  const todayHK = getTodayInHongKong();
  const [selectedDate, setSelectedDate] = useState(todayHK); // 預設選中今天
  const [viewMode, setViewMode] = useState<'day'>('day'); // 只保留單日檢視
  const [selectedDates, setSelectedDates] = useState<Date[]>([todayHK]); // 預設選中今天
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
  const [treeActivities, setTreeActivities] = useState<TreeActivity[]>([]);
  const [assignedActivities, setAssignedActivities] = useState<AssignedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('載入課堂資料中...');
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false); // 防止重複自動切換
  
  // 快取機制
  const [dataCache, setDataCache] = useState<Map<string, any>>(new Map());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | TrialLesson | null>(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  // 學習路徑相關狀態
  const [showLearningPathSelector, setShowLearningPathSelector] = useState(false);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [selectedLearningPath, setSelectedLearningPath] = useState<any>(null);
  
  // 教案編輯相關狀態
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: string;
    timeSlot: string;
    courseType: string;
  } | null>(null);

  // 成長樹詳情相關狀態
  const [showGrowthTreeModal, setShowGrowthTreeModal] = useState(false);
  const [selectedStudentForTree, setSelectedStudentForTree] = useState<{
    studentId: string;
    studentName: string;
    courseType: string;
  } | null>(null);
  const [growthTreeData, setGrowthTreeData] = useState<{
    tree: any;
    goals: any[];
    abilitiesOptions: { value: string; label: string }[];
    activitiesOptions: { value: string; label: string }[];
    teachersOptions: { value: string; label: string }[];
    studentsInTree: any[];
  } | null>(null);

  // 學生活動管理相關狀態
  const [showStudentActivitiesModal, setShowStudentActivitiesModal] = useState(false);
  const [selectedStudentForActivities, setSelectedStudentForActivities] = useState<{
    studentId: string;
    studentName: string;
    lessonDate: string;
    timeslot: string;
  } | null>(null);
  
  // 新增：學生活動狀態
  const [studentActivitiesMap, setStudentActivitiesMap] = useState<Map<string, any[]>>(new Map());
  const [loadingStudentActivities, setLoadingStudentActivities] = useState<Set<string>>(new Set());
  
  // 新增：剩餘堂數狀態
  const [remainingLessonsMap, setRemainingLessonsMap] = useState<Record<string, number>>({});
  const [loadingRemainingLessons, setLoadingRemainingLessons] = useState(false);
  
  // 新增：進度編輯狀態
  const [editingProgressActivityId, setEditingProgressActivityId] = useState<string | null>(null);
  
  // 新增：學生評估狀態追蹤
  const [studentAssessmentStatus, setStudentAssessmentStatus] = useState<Record<string, boolean>>({});
  const [loadingAssessmentStatus, setLoadingAssessmentStatus] = useState(false);
  
  // 新增：能力評估模態框狀態
  const [showAbilityAssessmentModal, setShowAbilityAssessmentModal] = useState(false);
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<{
    id: string;
    full_name: string;
    nick_name?: string;
  } | null>(null);
  const [selectedTreeForAssessment, setSelectedTreeForAssessment] = useState<{
    id: string;
    tree_name: string;
    tree_description?: string;
    course_type: string;
  } | null>(null);

  // 權限檢查
  useEffect(() => {
    if (user && !hasTeacherAccess) {
      router.push('/aihome');
    }
  }, [user, hasTeacherAccess, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanami-primary mx-auto mb-4"></div>
              <p className="text-hanami-text-secondary">檢查權限中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasTeacherAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-hanami-text mb-4">權限不足</h1>
              <p className="text-hanami-text-secondary mb-6">您不具備花見老師專區的訪問權限</p>
              <HanamiButton onClick={() => router.push('/aihome')}>
                返回首頁
              </HanamiButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/aihome/teacher-zone')}
              className="flex items-center space-x-2 text-hanami-text hover:text-hanami-text-secondary transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>返回老師專區</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-hanami-text">花見老師專區 - 課堂活動管理</h1>
        </div>

        {/* 載入中狀態 */}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanami-primary mx-auto mb-4"></div>
            <p className="text-hanami-text-secondary">功能開發中，敬請期待...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

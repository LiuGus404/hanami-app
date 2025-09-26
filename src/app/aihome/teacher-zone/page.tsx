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
  DocumentTextIcon
} from '@heroicons/react/24/outline';

import { HanamiCard, HanamiButton, LessonPlanModal, GrowthTreeDetailModal, StudentActivitiesPanel } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import SimpleAbilityAssessmentModal from '@/components/ui/SimpleAbilityAssessmentModal';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useDirectTeacherAccess } from '@/hooks/saas/useDirectTeacherAccess';
import AppSidebar from '@/components/AppSidebar';
import { motion } from 'framer-motion';
import { Bars3Icon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

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

export default function TeacherZonePage() {
  const router = useRouter();
  const { user, logout } = useSaasAuth();
  const { 
    hasTeacherAccess, 
    loading: directLoading,
    checkTeacherAccess: directCheckTeacherAccess,
    teacherAccess: directTeacherAccess
  } = useDirectTeacherAccess();

  // 確保教師權限已檢查
  useEffect(() => {
    if (user?.email && !directTeacherAccess && !directLoading) {
      directCheckTeacherAccess(user.email).catch((error) => {
        console.error('教師專區：教師權限檢查失敗:', error);
      });
    }
  }, [user?.email, directTeacherAccess, directLoading, directCheckTeacherAccess]);

  // 側邊欄狀態
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

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
  const [workStatusChecked, setWorkStatusChecked] = useState(false); // 防止重複檢查工作狀態
  
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
  
  // 新增：學習中活動展開狀態
  const [expandedActivitiesMap, setExpandedActivitiesMap] = useState<Record<string, boolean>>({});
  
  // 新增：時段展開狀態
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Record<string, boolean>>({});
  
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


  // 獲取單日日期範圍
  const getDayDates = (date: Date) => {
    // 直接使用傳入的日期，不進行時區轉換
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log(`📅 getDayDates 格式化: ${date.toISOString()} → ${formattedDate}`);
    
    return {
      start: formattedDate,
      end: formattedDate
    };
  };

  // 檢查老師當日工作狀態
  const checkTeacherWorkStatus = async () => {
    if (!directTeacherAccess?.employeeData?.id) {
      return false;
    }

    // 如果已經檢查過，直接返回結果
    if (workStatusChecked) {
      return true; // 假設已檢查過且要上班
    }

    try {
      setLoadingText('檢查教師工作狀態...');
      
      // 檢查教師今天是否有排班
      const todayHK = getTodayInHongKong();
      const todayStr = todayHK.toISOString().split('T')[0];
      const todayWeekday = todayHK.getDay(); // 0=星期日, 1=星期一, ..., 6=星期六
      
      // 這裡可以添加檢查教師排班的邏輯
      // 例如：檢查 hanami_schedule 表或其他排班相關表
      // 暫時返回 true，表示教師今天要上班
      
      // 標記已檢查過
      setWorkStatusChecked(true);
      return true;
    } catch (error) {
      console.error('檢查教師工作狀態失敗:', error);
      return false;
    }
  };

  // 載入課堂資料
  const loadClassData = async () => {
    try {
      setLoading(true);
      setLoadingText('載入課堂資料中...');
      
      // 先檢查教師工作狀態
      const isWorkingToday = await checkTeacherWorkStatus();
      if (!isWorkingToday) {
        setLoading(false);
        setLessons([]);
        setTrialLessons([]);
        setTreeActivities([]);
        return;
      }
      
      setLoadingText('載入課程資料中...');
      
      // 計算所有選中日期的日期範圍
      let startDate: Date, endDate: Date;
      
      if (selectedDates.length > 1) {
        // 多選模式：找到最早和最晚的日期
        const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        startDate = sortedDates[0];
        endDate = sortedDates[sortedDates.length - 1];
      } else {
        // 單選模式：使用選中的日期
        const dateRange = getDayDates(selectedDate);
        startDate = new Date(dateRange.start);
        endDate = new Date(dateRange.end);
      }
      
      // 在loadClassData中定義格式化日期函數
      const formatLocalDateInLoad = (date: Date) => {
        // 直接使用傳入的日期，不進行時區轉換
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        console.log(`📅 formatLocalDateInLoad 格式化: ${date.toISOString()} → ${formattedDate}`);
        return formattedDate;
      };
      
      // 獲取教師ID用於快取鍵
      const teacherId = directTeacherAccess?.employeeData?.id || 'no-teacher';
      const cacheKey = `${formatLocalDateInLoad(startDate)}-${formatLocalDateInLoad(endDate)}-${teacherId}`;
      
      // 檢查快取
      if (dataCache.has(cacheKey)) {
        console.log('使用快取資料:', cacheKey);
        setLoadingText('處理快取資料中...');
        const cachedData = dataCache.get(cacheKey);
        
        // 如果是多選模式，需要過濾出只屬於選中日期的課程
        if (selectedDates.length > 1) {
          const selectedDateStrings = selectedDates.map(date => formatLocalDateInLoad(date));
          
          const filteredLessons = (cachedData.lessons || []).filter((lesson: Lesson) => 
            selectedDateStrings.includes(lesson.lesson_date)
          );
          
          const filteredTrialLessons = (cachedData.trialLessons || []).filter((trial: TrialLesson) => 
            selectedDateStrings.includes(trial.lesson_date)
          );
          
          setLessons(filteredLessons);
          setTrialLessons(filteredTrialLessons);
        } else {
          setLessons(cachedData.lessons || []);
          setTrialLessons(cachedData.trialLessons || []);
        }
        
        setTreeActivities(cachedData.treeActivities || []);
        setAssignedActivities(cachedData.assignedActivities || []);
        setLoading(false);
        return;
      }
      
      // 發送 API 請求
      setLoadingText('查詢資料庫中...');
      
      // 使用快取鍵中的教師ID
      const teacherIdForApi = teacherId === 'no-teacher' ? '' : teacherId;
      console.log('使用教師ID查詢課堂:', teacherIdForApi || '無教師ID，顯示所有課堂');
      
      const apiUrl = `/api/class-activities?weekStart=${formatLocalDateInLoad(startDate)}&weekEnd=${formatLocalDateInLoad(endDate)}${teacherIdForApi ? `&teacherId=${teacherIdForApi}` : ''}`;
      console.log('API請求URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '載入課堂資料失敗');
      }
      
      console.log('API 返回的資料:', result.data);
      console.log('試堂學生資料:', result.data.trialLessons);
      
      // 儲存到快取
      setLoadingText('處理資料中...');
      setDataCache(prev => new Map(prev).set(cacheKey, result.data));
      
              // 如果是多選模式，需要過濾出只屬於選中日期的課程
        if (selectedDates.length > 1) {
          const selectedDateStrings = selectedDates.map(date => formatLocalDateInLoad(date));
        
        const filteredLessons = (result.data.lessons || []).filter((lesson: Lesson) => 
          selectedDateStrings.includes(lesson.lesson_date)
        );
        
        const filteredTrialLessons = (result.data.trialLessons || []).filter((trial: TrialLesson) => 
          selectedDateStrings.includes(trial.lesson_date)
        );
        
        console.log('過濾後的正式學生課程:', filteredLessons);
        console.log('過濾後的試聽學生課程:', filteredTrialLessons);
        
        setLessons(filteredLessons);
        setTrialLessons(filteredTrialLessons);
      } else {
        setLessons(result.data.lessons || []);
        setTrialLessons(result.data.trialLessons || []);
      }
      
      // 成長樹活動延遲載入
      setTreeActivities([]);
      setAssignedActivities(result.data.assignedActivities || []);
      
      // 如果有課程資料，延遲載入成長樹活動
      if ((result.data.lessons && result.data.lessons.length > 0) || 
          (result.data.trialLessons && result.data.trialLessons.length > 0)) {
        setTimeout(async () => {
          try {
            setLoadingText('載入活動資料中...');
            const activitiesResponse = await fetch('/api/tree-activities');
            const activitiesResult = await activitiesResponse.json();
            
            if (activitiesResponse.ok && activitiesResult.success) {
              setTreeActivities(activitiesResult.data || []);
            }
          } catch (error) {
            console.error('延遲載入成長樹活動失敗:', error);
          }
        }, 100); // 延遲 100ms 載入
      }
      
    } catch (error) {
      console.error('載入課堂資料失敗:', error);
      toast.error(error instanceof Error ? error.message : '載入課堂資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 監聽教師權限狀態變化，重置工作狀態檢查
  useEffect(() => {
    if (directTeacherAccess?.employeeData?.id) {
      setWorkStatusChecked(false);
    }
  }, [directTeacherAccess?.employeeData?.id]);

  useEffect(() => {
    // 只有在教師權限確認後才載入資料
    if (!directTeacherAccess?.employeeData?.id) {
      return;
    }
    
    // 使用防抖動，避免短時間內重複調用
    const timeoutId = setTimeout(() => {
      loadClassData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [selectedDate, selectedDates, directTeacherAccess?.employeeData?.id]);

  // 新增：自動切換到有課程的日期（僅在課程載入完成後執行一次）
  useEffect(() => {
    if (lessons.length === 0 || hasAutoSwitched) return; // 等待課程資料載入或已經自動切換過
    
    const todayHK = getTodayInHongKong();
    const todayStr = todayHK.toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // 只有當選中的是今天，且今天沒有課程時才自動切換
    if (selectedDateStr === todayStr) {
      const lessonDates = lessons.map(lesson => lesson.lesson_date);
      
      if (!lessonDates.includes(todayStr) && lessonDates.length > 0) {
        console.log('🔄 今天沒有課程，自動切換到最近的課程日期');
        
        const uniqueDates = [...new Set(lessonDates)];
        const sortedDates = uniqueDates.sort();
        const nearestDate = sortedDates[0];
        
        console.log('📅 自動切換到:', nearestDate);
        
        const [year, month, day] = nearestDate.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        
        setSelectedDate(newDate);
        setSelectedDates([newDate]);
        setHasAutoSwitched(true); // 標記已經自動切換過
      }
    }
  }, [lessons, hasAutoSwitched]); // 依賴 lessons 和 hasAutoSwitched



  // 切換日期
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // 切換到今天
  const goToToday = () => {
    const today = getTodayInHongKong();
    setSelectedDate(today);
    setSelectedDates([today]);
  };

  // 一鍵清除多選星期幾
  const clearWeekSelection = () => {
    setSelectedDate(new Date());
    setSelectedDates([new Date()]);
  };

  // 獲取活動顯示名稱
  const getActivityDisplayName = (activity: TreeActivity) => {
    if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
      return activity.hanami_teaching_activities.activity_name;
    }
    return activity.custom_activity_name || '未命名活動';
  };

  // 獲取學生已分配的活動
  const getStudentAssignedActivities = async (lessonId: string, studentId: string) => {
    try {
      // 使用 API 獲取學生的所有活動，包括跨多個課堂的長期活動
      const response = await fetch(`/api/student-activities?studentId=${studentId}&lessonDate=${new Date().toISOString().split('T')[0]}&timeslot=`);
      
      if (!response.ok) {
        console.error('獲取學生活動失敗:', response.status);
        return [];
      }

      const result = await response.json();
      if (result.success) {
        // 合併所有類型的活動
        const allActivities = [
          ...result.data.currentLessonActivities,
          ...result.data.previousLessonActivities,
          ...result.data.ongoingActivities
        ];
        
        console.log(`🔍 學生活動去重調試 - 學生ID: ${studentId}`);
        console.log(`📊 合併前總數: ${allActivities.length}`);
        console.log(`📋 活動ID列表:`, allActivities.map(a => ({ id: a.id, name: a.activityName || a.custom_activity_name })));
        
        // 更強的去重邏輯（基於活動ID和活動名稱）
        const uniqueActivities = allActivities.filter((activity, index, self) => {
          const activityName = activity.activityName || activity.custom_activity_name || '';
          // 檢查是否是第一次出現（基於ID）
          const isFirstById = index === self.findIndex(a => a.id === activity.id);
          // 檢查是否是第一次出現（基於名稱）
          const isFirstByName = index === self.findIndex(a => 
            (a.activityName || a.custom_activity_name || '') === activityName && activityName !== ''
          );
          
          // 如果活動名稱存在，則基於名稱去重；否則基於ID去重
          return activityName ? isFirstByName : isFirstById;
        });
        
        console.log(`📊 去重後總數: ${uniqueActivities.length}`);
        console.log(`📋 去重後活動:`, uniqueActivities.map(a => ({ id: a.id, name: a.activityName || a.custom_activity_name })));
        
        // 過濾出未完成的活動
        const incompleteActivities = uniqueActivities.filter(activity => activity.completionStatus !== 'completed');
        console.log(`📊 未完成活動數: ${incompleteActivities.length}`);
        
        return incompleteActivities;
      } else {
        console.error('獲取學生活動失敗:', result.error);
        return [];
      }
    } catch (error) {
      console.error('獲取學生活動失敗:', error);
      return [];
    }
  };

  // 載入學生活動
  const loadStudentActivities = async (studentId: string) => {
    if (studentActivitiesMap.has(studentId) || loadingStudentActivities.has(studentId)) {
      return;
    }

    setLoadingStudentActivities(prev => new Set(prev).add(studentId));
    
    try {
      const activities = await getStudentAssignedActivities('', studentId);
      setStudentActivitiesMap(prev => new Map(prev).set(studentId, activities));
    } catch (error) {
      console.error('載入學生活動失敗:', error);
    } finally {
      setLoadingStudentActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // 載入所有學生的活動
  useEffect(() => {
    if (lessons.length > 0) {
      const studentIds = lessons
        .filter(lesson => 'student_id' in lesson)
        .map(lesson => lesson.student_id);
      
      studentIds.forEach(studentId => {
        if (!studentActivitiesMap.has(studentId) && !loadingStudentActivities.has(studentId)) {
          loadStudentActivities(studentId);
        }
      });
    }
  }, [lessons]);

  // 檢查學生今天的評估狀態
  const checkStudentAssessmentStatus = async () => {
    if (loadingAssessmentStatus || lessons.length === 0) {
      return;
    }

    try {
      setLoadingAssessmentStatus(true);
      console.log('🔍 檢查學生今天的評估狀態...');
      
      // 獲取今天的日期
      const today = new Date().toISOString().split('T')[0];
      
      // 收集所有學生ID
      const studentIds = lessons.map(lesson => {
        if ('student_id' in lesson && lesson.student_id) {
          return lesson.student_id;
        }
        return null;
      }).filter((id): id is string => id !== null);
      
      // 批量檢查學生今天的評估記錄
      const { data: assessments, error } = await supabase
        .from('hanami_ability_assessments')
        .select('student_id')
        .in('student_id', studentIds)
        .eq('assessment_date', today);

      if (error) {
        console.error('檢查評估狀態失敗:', error);
        return;
      }

      // 建立評估狀態映射
      const statusMap: Record<string, boolean> = {};
      
      // 預設所有學生為未評估
      studentIds.forEach(studentId => {
        statusMap[studentId] = false;
      });
      
      // 標記已評估的學生
      if (assessments) {
        assessments.forEach(assessment => {
          statusMap[assessment.student_id] = true;
        });
      }
      
      console.log('📊 學生評估狀態:', statusMap);
      setStudentAssessmentStatus(statusMap);
      
    } catch (error) {
      console.error('檢查學生評估狀態失敗:', error);
    } finally {
      setLoadingAssessmentStatus(false);
    }
  };

  // 載入所有學生的剩餘堂數
  const loadRemainingLessons = async () => {
    if (loadingRemainingLessons || lessons.length === 0) {
      return;
    }

    setLoadingRemainingLessons(true);
    
    try {
      const studentIds = lessons
        .filter(lesson => 'student_id' in lesson)
        .map(lesson => lesson.student_id);
      
      if (studentIds.length > 0) {
        const remainingLessons = await calculateRemainingLessonsBatch(studentIds, new Date());
        setRemainingLessonsMap(remainingLessons);
        console.log('剩餘堂數載入完成:', remainingLessons);
      }
    } catch (error) {
      console.error('載入剩餘堂數失敗:', error);
    } finally {
      setLoadingRemainingLessons(false);
    }
  };

  // 載入剩餘堂數和評估狀態
  useEffect(() => {
    loadRemainingLessons();
    checkStudentAssessmentStatus(); // 檢查評估狀態
  }, [lessons]);

  // 權限檢查
  useEffect(() => {
    if (user?.email && !hasTeacherAccess && !directLoading) {
      directCheckTeacherAccess(user.email).catch((error) => {
        console.error('教師專區：權限檢查失敗:', error);
      });
    }
  }, [user, hasTeacherAccess, directLoading, directCheckTeacherAccess]);

  // 根據剩餘堂數獲取背景顏色
  const getStudentBackgroundColor = (remainingLessons: number, isTrial: boolean) => {
    if (isTrial) {
      return 'bg-gradient-to-br from-orange-100 to-red-100 border-orange-200';
    }
    
    if (remainingLessons === 0) {
      return 'bg-gradient-to-br from-red-100 to-red-200 border-red-300';
    } else if (remainingLessons <= 2) {
      return 'bg-gradient-to-br from-orange-100 to-yellow-100 border-orange-300';
    } else {
      return 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200';
    }
  };

  // 開啟能力評估模態框
  const openAbilityAssessmentModal = async (student: any) => {
    try {
      // 直接開啟能力評估模態框，不檢查成長樹
      setSelectedStudentForAssessment({
        id: student.id,
        full_name: student.full_name || getStudentName(student),
        nick_name: student.nick_name || getStudentNickname(student)
      });
      
      // 使用預設的成長樹資訊
      setSelectedTreeForAssessment({
        id: 'default',
        tree_name: '幼兒鋼琴學習評估表 — 階段零',
        tree_description: '英文譜 + 五音域 (約 2 個月)',
        course_type: '鋼琴'
      });
      
      setShowAbilityAssessmentModal(true);
    } catch (error) {
      console.error('開啟能力評估模態框失敗:', error);
      toast.error('開啟能力評估失敗');
    }
  };

  // 分配學習路徑給學生
  const assignLearningPathToStudent = async (lessonId: string, studentId: string, learningPathId: string) => {
    try {
      // 獲取學習路徑的節點資料
      const learningPath = learningPaths.find(path => path.id === learningPathId);
      if (!learningPath) {
        throw new Error('找不到指定的學習路徑');
      }

      // 解析學習路徑的節點
      let nodes = learningPath.nodes;
      if (typeof nodes === 'string') {
        nodes = JSON.parse(nodes);
      }

      // 過濾出活動節點
      const activityNodes = nodes.filter((node: any) => node.type === 'activity');
      
      if (activityNodes.length === 0) {
        toast.error('該學習路徑沒有包含任何活動');
        return;
      }

      // 批量分配活動 - 正確處理活動ID格式
      const activityIds = [];
      
      for (const node of activityNodes) {
        let actualActivityId = null;
        
        // 檢查節點ID格式
        if (node.id && node.id.startsWith('tree_activity_')) {
          // 提取 tree_activity 的ID
          const treeActivityId = node.id.replace('tree_activity_', '');
          console.log('提取 tree_activity ID:', { nodeId: node.id, treeActivityId });
          
          // 查詢 hanami_tree_activities 表來獲取真正的 activity_id
          const { data: treeActivity, error: treeActivityError } = await supabase
            .from('hanami_tree_activities')
            .select('activity_id')
            .eq('id', treeActivityId)
            .single();

          if (treeActivityError) {
            console.error('查詢 hanami_tree_activities 失敗:', treeActivityError);
            continue;
          }

          if (treeActivity && treeActivity.activity_id) {
            actualActivityId = treeActivity.activity_id;
            console.log('從 tree_activities 獲取 activity_id:', actualActivityId);
          }
        } else if (node.activity_id) {
          // 直接使用 activity_id
          actualActivityId = node.activity_id;
          console.log('使用 activity_id:', actualActivityId);
        } else if (node.metadata && node.metadata.activityId) {
          // 使用 metadata 中的 activityId
          actualActivityId = node.metadata.activityId;
          console.log('使用 metadata.activityId:', actualActivityId);
        }
        
        if (actualActivityId) {
          activityIds.push(actualActivityId);
        }
      }
      
      console.log('最終活動ID列表:', activityIds);
      
      if (activityIds.length === 0) {
        toast.error('該學習路徑的活動節點沒有有效的活動ID');
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
          assignmentType: 'current_lesson',
          lessonDate: selectedLesson?.lesson_date,
          timeslot: selectedLesson?.actual_timeslot
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '分配學習路徑失敗');
      }

      toast.success(`成功分配學習路徑，共 ${activityIds.length} 個活動！`);
      loadClassData(); // 重新載入資料
      setShowLearningPathSelector(false);
    } catch (error) {
      console.error('分配學習路徑失敗:', error);
      toast.error(error instanceof Error ? error.message : '分配學習路徑失敗');
    }
  };

  // 分配活動給學生
  const assignActivityToStudent = async (lessonId: string, studentId: string, treeActivityId: string) => {
    try {
      // 獲取課程資訊
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) {
        throw new Error('找不到指定的課程');
      }

      // 使用 assign-student-activities API
      const response = await fetch('/api/assign-student-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          lessonDate: lesson.lesson_date,
          timeslot: lesson.actual_timeslot,
          activityIds: [treeActivityId], // 轉換為數組格式
          assignmentType: 'current_lesson'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '分配活動失敗');
      }

      toast.success('活動分配成功！');
      loadClassData(); // 重新載入資料
      setShowActivitySelector(false);
    } catch (error) {
      console.error('分配活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '分配活動失敗');
    }
  };

  // 處理時段卡片點擊 - 展開/收起時段
  const handleTimeSlotClick = (date: string, timeSlot: string, courseType: string) => {
    const timeSlotKey = `${date}_${timeSlot}`;
    setExpandedTimeSlots(prev => ({
      ...prev,
      [timeSlotKey]: !prev[timeSlotKey]
    }));
  };

  // 載入學習路徑資料
  const loadLearningPaths = async (courseType: string) => {
    try {
      // 首先根據課程類型獲取成長樹
      const { data: courseTypeData, error: courseTypeError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id')
        .eq('name', courseType)
        .single();

      if (courseTypeError) {
        console.error('獲取課程類型失敗:', courseTypeError);
        toast.error('無法獲取課程類型資訊');
        return;
      }

      // 根據課程類型ID獲取成長樹
      const { data: growthTrees, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name')
        .eq('course_type_id', courseTypeData.id)
        .eq('is_active', true)
        .order('tree_level', { ascending: true });

      if (treesError) {
        console.error('獲取成長樹失敗:', treesError);
        toast.error('無法獲取成長樹資訊');
        return;
      }

      if (!growthTrees || growthTrees.length === 0) {
        console.log('該課程類型沒有對應的成長樹');
        setLearningPaths([]);
        return;
      }

      // 獲取第一個成長樹的學習路徑
      const treeId = growthTrees[0].id;
      const response = await fetch(`/api/learning-paths?treeId=${treeId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setLearningPaths(result.data);
        } else {
          setLearningPaths([]);
        }
      } else {
        setLearningPaths([]);
      }
    } catch (error) {
      console.error('載入學習路徑失敗:', error);
      toast.error('載入學習路徑失敗');
      setLearningPaths([]);
    }
  };

  // 載入學生的成長樹資料
  const loadStudentGrowthTree = async (studentId: string, studentName: string, courseType: string) => {
    try {
      // 設置選中的學生信息
      setSelectedStudentForTree({
        studentId,
        studentName,
        courseType
      });

      // 首先根據課程類型名稱獲取課程類型ID
      const { data: courseTypeData, error: courseTypeError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id')
        .eq('name', courseType)
        .single();

      if (courseTypeError) {
        console.error('獲取課程類型失敗:', courseTypeError);
        // 如果找不到對應的課程類型，使用第一個成長樹
        const { data: fallbackTrees, error: fallbackError } = await supabase
          .from('hanami_growth_trees')
          .select('*')
          .order('tree_level', { ascending: true })
          .limit(1);

        if (fallbackError || !fallbackTrees || fallbackTrees.length === 0) {
          console.error('沒有找到任何成長樹');
          return;
        }

        const selectedTree = fallbackTrees[0];
        await loadTreeData(selectedTree, courseType);
        return;
      }

      // 根據課程類型ID獲取成長樹
      const { data: trees, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('course_type_id', courseTypeData.id)
        .order('tree_level', { ascending: true });

      if (treesError) {
        console.error('獲取成長樹失敗:', treesError);
        return;
      }

      if (!trees || trees.length === 0) {
        console.log('沒有找到適合的成長樹，使用預設成長樹');
        // 如果沒有找到對應的成長樹，使用第一個成長樹
        const { data: fallbackTrees, error: fallbackError } = await supabase
          .from('hanami_growth_trees')
          .select('*')
          .order('tree_level', { ascending: true })
          .limit(1);

        if (fallbackError || !fallbackTrees || fallbackTrees.length === 0) {
          console.error('沒有找到任何成長樹');
          return;
        }

        const selectedTree = fallbackTrees[0];
        await loadTreeData(selectedTree, courseType);
        return;
      }

      // 使用第一個匹配的成長樹
      const selectedTree = trees[0];
      await loadTreeData(selectedTree, courseType);

    } catch (error) {
      console.error('載入成長樹資料失敗:', error);
    }
  };

  // 載入成長樹詳細資料
  const loadTreeData = async (selectedTree: any, courseType: string) => {
    try {
      // 獲取成長樹的目標
      const { data: goals, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', selectedTree.id)
        .order('goal_order', { ascending: true });

      if (goalsError) {
        console.error('獲取成長目標失敗:', goalsError);
        return;
      }

      // 獲取能力選項
      const { data: abilities, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('id, ability_name')
        .order('ability_name');

      if (abilitiesError) {
        console.error('獲取能力選項失敗:', abilitiesError);
        return;
      }

      // 獲取活動選項
      const { data: activities, error: activitiesError } = await supabase
        .from('hanami_teaching_activities')
        .select('id, activity_name')
        .order('activity_name');

      if (activitiesError) {
        console.error('獲取活動選項失敗:', activitiesError);
        return;
      }

      // 獲取教師選項
      const { data: teachers, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname')
        .order('teacher_fullname');

      if (teachersError) {
        console.error('獲取教師選項失敗:', teachersError);
        return;
      }

      // 獲取在此成長樹的學生（根據課程類型）
      const { data: studentsInTree, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('course_type', courseType);

      if (studentsError) {
        console.error('獲取學生資料失敗:', studentsError);
        return;
      }

      setGrowthTreeData({
        tree: selectedTree,
        goals: goals || [],
        abilitiesOptions: (abilities || []).map(a => ({ value: a.id, label: a.ability_name })),
        activitiesOptions: (activities || []).map(a => ({ value: a.id, label: a.activity_name })),
        teachersOptions: (teachers || []).map(t => ({ value: t.id, label: t.teacher_fullname || '未命名教師' })),
        studentsInTree: studentsInTree || []
      });

      setShowGrowthTreeModal(true);

    } catch (error) {
      console.error('載入成長樹詳細資料失敗:', error);
    }
  };

  // 保存活動進度到資料庫
  const saveProgressToDatabase = async (activityId: string, progress: number) => {
    try {
      console.log(`🔄 開始保存活動進度到資料庫: ${activityId} -> ${progress}%`);
      
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

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ 保存進度失敗:', result);
        toast.error(`保存進度失敗：${result.error || '未知錯誤'}`);
        return;
      }

      if (result.success) {
        console.log('✅ 進度保存成功:', result.data);
        toast.success(`進度已保存為 ${progress}%`);
        
        // 立即更新前端顯示，不需要重新載入
        console.log('🔄 立即更新前端顯示...');
        updateActivityProgressInState(activityId, progress);
        
        // 可選：延遲重新載入確保資料完全同步（較低頻率）
        setTimeout(() => {
          console.log('🔄 背景重新載入課堂資料以確保完全同步...');
          loadClassData();
        }, 2000);
      } else {
        console.error('❌ API 回應 success: false');
        toast.error(`保存進度失敗：${result.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('❌ 保存進度時發生錯誤:', error);
      toast.error(`保存進度失敗：${error instanceof Error ? error.message : '網路錯誤'}`);
    }
  };

  // 立即更新活動進度在前端狀態中
  const updateActivityProgressInState = (activityId: string, newProgress: number) => {
    console.log(`🔄 更新活動 ${activityId} 的前端狀態進度為 ${newProgress}%`);
    
    // 更新 lessons 狀態中的活動進度
    setLessons(prevLessons => prevLessons.map(lesson => {
      // 更新學生活動映射
      if (lesson.assignedActivities) {
        const updatedActivities = lesson.assignedActivities.map((activity: any) => {
          if (activity.id === activityId) {
            const updatedActivity = {
              ...activity,
              progress: newProgress,
              completion_status: newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
            };
            console.log(`✅ 更新活動 ${activityId} 狀態:`, updatedActivity);
            return updatedActivity;
          }
          return activity;
        });
        
        return {
          ...lesson,
          assignedActivities: updatedActivities
        };
      }
      return lesson;
    }));

    // 同時更新 studentActivitiesMap 狀態
    setStudentActivitiesMap(prevMap => {
      const newMap = new Map(prevMap);
      for (const [studentId, activities] of newMap.entries()) {
        const updatedActivities = activities.map((activity: any) => {
          if (activity.id === activityId) {
            return {
              ...activity,
              progress: newProgress,
              completion_status: newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
            };
          }
          return activity;
        });
        newMap.set(studentId, updatedActivities);
      }
      return newMap;
    });
  };

  // 移除活動分配
  const removeActivityAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/class-activities?id=${assignmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '移除活動失敗');
      }

      toast.success('活動已移除！');
      loadClassData(); // 重新載入資料
    } catch (error) {
      console.error('移除活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '移除活動失敗');
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 格式化日期選擇器顯示
  const formatDateForInput = (date: Date) => {
    // 使用本地時間格式化日期，避免時區問題
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 獲取當前顯示的日期範圍
  const getCurrentDateRange = () => {
    // 直接使用傳入的日期，不進行時區轉換
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`📅 getCurrentDateRange 格式化: ${date.toISOString()} → ${formattedDate}`);
      return formattedDate;
    };
    
    return {
      start: formatLocalDate(selectedDate),
      end: formatLocalDate(selectedDate)
    };
  };

  // 格式化時間顯示
  const formatTime = (timeString: string) => {
    if (!timeString) return '未設定';
    return timeString;
  };

  // 將月齡轉換為歲數
  const convertAgeToYears = (ageInMonths: number | null): string => {
    if (ageInMonths === null || ageInMonths === undefined) return '未知';
    if (ageInMonths < 12) {
      return `${ageInMonths}個月`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years}歲`;
      } else {
        return `${years}歲${months}個月`;
      }
    }
  };

  // 獲取學生姓名
  const getStudentName = (lesson: Lesson | TrialLesson) => {
    // 優先從 lesson 物件本身獲取姓名
    if (lesson.full_name) {
      return lesson.full_name;
    }
    // 如果是正式學生且有關聯資料，從關聯資料獲取
    if ('Hanami_Students' in lesson && lesson.Hanami_Students?.full_name) {
      return lesson.Hanami_Students.full_name;
    }
    return '未知學生';
  };

  // 獲取學生暱稱
  const getStudentNickname = (lesson: Lesson | TrialLesson) => {
    // 如果是試聽學生，直接從 lesson 物件獲取暱稱
    if ('nick_name' in lesson && lesson.nick_name) {
      return lesson.nick_name;
    }
    // 如果是正式學生且有關聯資料，從關聯資料獲取暱稱
    if ('Hanami_Students' in lesson && lesson.Hanami_Students?.nick_name) {
      return lesson.Hanami_Students.nick_name;
    }
    return null;
  };

  // 獲取學生年齡
  const getStudentAge = (lesson: Lesson | TrialLesson) => {
    // 對於試聽學生，直接從 lesson 物件獲取年齡
    if ('student_age' in lesson) {
      return lesson.student_age;
    }
    // 對於正式學生，從關聯的學生資料獲取年齡
    if ('Hanami_Students' in lesson && lesson.Hanami_Students) {
      return lesson.Hanami_Students.student_age;
    }
    return null;
  };

  // 獲取課程類型
  const getCourseType = (lesson: Lesson | TrialLesson) => {
    // 優先從 lesson 物件本身獲取課程類型
    if ('course_type' in lesson && lesson.course_type) {
      return lesson.course_type;
    }
    // 如果是正式學生且有關聯資料，從關聯資料獲取
    if ('Hanami_Students' in lesson && lesson.Hanami_Students?.course_type) {
      return lesson.Hanami_Students.course_type;
    }
    return '未設定';
  };

  // 獲取教師
  const getLessonTeacher = (lesson: Lesson | TrialLesson) => {
    if ('lesson_teacher' in lesson) {
      return lesson.lesson_teacher;
    }
    return null;
  };

  // 獲取備註
  const getLessonNotes = (lesson: Lesson | TrialLesson) => {
    if ('notes' in lesson) {
      return lesson.notes;
    }
    return null;
  };

  // 切換學習中活動展開狀態
  const toggleActivitiesExpanded = (lessonId: string) => {
    console.log(`🔄 切換活動展開狀態 - 課程ID: ${lessonId}, 當前狀態: ${expandedActivitiesMap[lessonId]}`);
    setExpandedActivitiesMap(prev => {
      const newState = {
        ...prev,
        [lessonId]: !prev[lessonId]
      };
      console.log(`🔄 新的展開狀態:`, newState);
      return newState;
    });
  };

  // 按時段分組課程
  const groupLessonsByTimeSlot = (): TimeSlotGroup[] => {
    let allLessons = [...lessons, ...trialLessons];
    
    // 調試信息
    console.log('🔍 課程分組調試信息:', {
      totalLessons: lessons.length,
      totalTrialLessons: trialLessons.length,
      selectedDate: selectedDate.toISOString().split('T')[0],
      selectedDatesCount: selectedDates.length,
      allLessonsCount: allLessons.length
    });
    
    // 如果有多選日期，顯示所有選中日期的課程
    if (selectedDates.length > 1) {
      const selectedDateStrs = selectedDates.map(date => date.toISOString().split('T')[0]);
      console.log('📅 多選日期模式:', selectedDateStrs);
      allLessons = allLessons.filter(lesson => selectedDateStrs.includes(lesson.lesson_date));
    } else {
      // 單選模式：只顯示選中日期的課程
      // 使用香港時區計算今天的日期字符串
      const todayHongKong = new Date().toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"});
      const todayStr = new Date(todayHongKong).toISOString().split('T')[0];
      
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      console.log('📅 單選日期模式 - 選中日期:', selectedDateStr);
      console.log('📅 今天的日期（香港時區）:', todayStr);
      
      const lessonDates = allLessons.map(lesson => lesson.lesson_date);
      console.log('📋 所有課程的日期:', lessonDates);
      console.log('📅 是否包含今天的課程:', lessonDates.includes(todayStr));
      
      // 檢查日期是否匹配並自動切換
      if (selectedDateStr !== todayStr) {
        console.log('⚠️ 選中日期與今天不匹配，選中:', selectedDateStr, '今天:', todayStr);
        if (lessonDates.includes(todayStr)) {
          console.log('📅 今天有課程，但選中的不是今天');
        }
      } else {
        console.log('✅ 選中日期正確匹配今天');
        // 記錄今天沒有課程的情況，但不在這裡直接更新狀態
        if (!lessonDates.includes(todayStr) && lessonDates.length > 0) {
          console.log('📅 今天沒有課程，但有其他日期的課程');
          const uniqueDates = [...new Set(lessonDates)]; // 去重
          const sortedDates = uniqueDates.sort();
          console.log('📅 可用課程日期:', sortedDates);
        }
      }
      allLessons = allLessons.filter(lesson => lesson.lesson_date === selectedDateStr);
      console.log('✅ 過濾後的課程數量:', allLessons.length);
    }
    
    // 按日期和時間排序
    allLessons.sort((a, b) => {
      const dateA = new Date(a.lesson_date);
      const dateB = new Date(b.lesson_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return (a.actual_timeslot || '').localeCompare(b.actual_timeslot || '');
    });

    // 按日期和時段分組
    const grouped: { [key: string]: TimeSlotGroup } = {};
    
    allLessons.forEach(lesson => {
      const date = lesson.lesson_date;
      const timeSlot = lesson.actual_timeslot || '未設定';
      const key = `${date}_${timeSlot}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          date,
          timeSlot,
          lessons: []
        };
      }
      
      grouped[key].lessons.push(lesson);
    });

    // 轉換為陣列並排序
    return Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  };

  const timeSlotGroups = groupLessonsByTimeSlot();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanami-primary mx-auto mb-4"></div>
              <p className="text-hanami-text-secondary">{loadingText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果沒有教師權限，顯示權限不足頁面
  if (user && !hasTeacherAccess && !directLoading) {
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

  // 如果還在載入中，顯示載入頁面
  if (!user || directLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄選單 */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/teacher-zone"
        />

        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col">
          {/* 頂部導航欄 */}
          <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  {/* 選單按鈕 */}
                  <motion.button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                    title={sidebarOpen ? "關閉選單" : "開啟選單"}
                  >
                    <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                  
                  <div className="w-10 h-10 relative">
                    <img 
                      src="/@hanami.png" 
                      alt="HanamiEcho Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                    <p className="text-sm text-[#2B3A3B]">兒童與成人的智能伙伴</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-[#2B3A3B]">
                    {currentTime.toLocaleTimeString('zh-TW', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                    title="登出"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>登出</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </nav>

          {/* 頁面內容 */}
          <main className="flex-1 p-6">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {/* 頁面標題 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-[#4B4036]">課堂活動管理</h1>
                  
                  {/* 工作提示系統按鈕 */}
                  <motion.button
                    onClick={() => router.push('/aihome/task-management')}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden px-4 py-2 bg-gradient-to-br from-[#FFF4E6] via-[#FFE8CC] to-[#FFD59A] text-[#2B3A3B] rounded-xl hover:from-[#FFE8CC] hover:via-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center gap-2 group border border-[#FFD59A]/50"
                  >
                    {/* 背景裝飾 */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 blur-sm group-hover:bg-white/40 transition-all duration-300" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-white/20 blur-sm group-hover:bg-white/30 transition-all duration-300" />
                    
                    {/* 圖標 */}
                    <div className="relative z-10 w-4 h-4 bg-white/40 rounded-lg flex items-center justify-center group-hover:bg-white/50 transition-all duration-300 shadow-sm">
                      <svg className="w-3 h-3 text-[#B8860B]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#10B981"/>
                      </svg>
                    </div>
                    
                    {/* 文字 */}
                    <span className="relative z-10 text-sm font-medium">工作提示系統</span>
                    
                    {/* 懸停效果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.button>
                </div>
                
              </div>

              {/* 日期導航和選擇器 */}
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-[#EADBC8]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousDay}
                disabled={true}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span>前一天</span>
              </button>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-hanami-text">
                  {selectedDates.length > 1 
                    ? `${selectedDates.length} 個選中日期`
                    : getCurrentDateRange().start
                  }
                </h2>
                <p className="text-sm text-hanami-text-secondary">
                  共 {timeSlotGroups.length} 個時段，{timeSlotGroups.reduce((total, group) => total + group.lessons.length, 0)} 堂課
                </p>
              </div>
              
              <button
                onClick={goToNextDay}
                disabled={true}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
              >
                <span>後一天</span>
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 日期選擇器 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-hanami-text">選擇日期:</label>
                <input
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  min={formatDateForInput(todayHK)}
                  max={formatDateForInput(todayHK)}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    // 只允許選擇今天
                    if (newDate.toDateString() === todayHK.toDateString()) {
                      setSelectedDate(newDate);
                    }
                  }}
                  className="px-3 py-2 border border-hanami-border rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                />
              </div>
              
              {/* 今天按鈕 */}
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gradient-to-r from-hanami-primary to-hanami-accent text-white rounded-lg font-medium shadow-lg cursor-pointer"
              >
                今天
              </button>
              
              {/* 一鍵清除按鈕 - 隱藏，因為只允許選擇今天 */}
              {/* 
              {selectedDates.length > 1 && (
                <button
                  onClick={clearWeekSelection}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  清除選擇 ({selectedDates.length})
                </button>
              )}
              */}
            </div>
          </div>

          {/* 星期選擇器 */}
          <div className="flex items-center justify-center space-x-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => {
              // 計算當前週的每一天
              // 首先找到當前選中日期的週開始（星期日）
              const currentDate = new Date(selectedDate);
              const currentDayOfWeek = currentDate.getDay(); // 0=星期日, 1=星期一, ..., 6=星期六
              
              // 計算到本週日的天數差
              const daysToSunday = currentDayOfWeek; // 如果今天是星期日(0)，差0天；如果是星期一(1)，差1天；以此類推
              
              const weekStart = new Date(currentDate);
              weekStart.setDate(currentDate.getDate() - daysToSunday);
              
              // 計算對應的日期（index=0是星期日，index=1是星期一，以此類推）
              const dayDate = new Date(weekStart);
              dayDate.setDate(weekStart.getDate() + index);
              
              // 確保日期是正確的（避免時區問題）
              dayDate.setHours(12, 0, 0, 0); // 設定為中午12點，避免時區問題
              
              const isToday = dayDate.toDateString() === new Date().toDateString();
              const isSelected = selectedDates.some(date => date.toDateString() === dayDate.toDateString());
              
              return (
                <button
                  key={day}
                  onClick={() => {
                    // 只允許選擇今天
                    if (!isToday) return;
                    
                    const dayDateStr = dayDate.toDateString();
                    const isAlreadySelected = selectedDates.some(date => date.toDateString() === dayDateStr);
                    
                    if (isAlreadySelected) {
                      // 如果已經選中，則移除
                      setSelectedDates(prev => prev.filter(date => date.toDateString() !== dayDateStr));
                    } else {
                      // 如果未選中，則添加
                      setSelectedDates(prev => [...prev, dayDate]);
                    }
                    
                    // 更新主要選中的日期
                    setSelectedDate(dayDate);
                  }}
                  disabled={!isToday}
                  className={`w-12 h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                    isToday 
                      ? isSelected
                        ? 'bg-hanami-primary/20 text-hanami-primary border-2 border-hanami-primary cursor-pointer'
                        : 'bg-white border-2 border-hanami-primary text-hanami-primary shadow-lg cursor-pointer hover:bg-hanami-primary/10'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* 時段分組列表 */}
        <div className="space-y-8">
          {timeSlotGroups.length === 0 ? (
            <div className="bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-hanami-primary/20 shadow-lg">
              <div className="animate-bounce mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-full mx-auto flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-hanami-text text-xl font-medium">
                今天沒有課程安排
              </p>
              <p className="text-hanami-text-secondary mt-2">享受輕鬆的時光吧！</p>
            </div>
          ) : (
            timeSlotGroups.map((group, groupIndex) => (
              <div 
                key={`${group.date}_${group.timeSlot}`} 
                className="group animate-fade-in-up"
                style={{ animationDelay: `${groupIndex * 100}ms` }}
              >
                {/* 時段標題卡片 */}
                <div 
                  className="time-slot-header hanami-card-glow rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleTimeSlotClick(group.date, group.timeSlot, group.lessons.map(lesson => getCourseType(lesson) || '未設定').filter((value, index, self) => self.indexOf(value) === index).join(' + '))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                      {/* 日期和時間區塊 */}
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                          <div className="text-center">
                            <div className="text-sm font-medium text-white/90 mb-1">{formatDate(group.date)}</div>
                            <div className="text-2xl font-bold text-white">{formatTime(group.timeSlot)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-hanami-accent rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse mb-1">
                            {group.lessons.length}
                          </div>
                          <div className="text-xs text-white/70">學生</div>
                        </div>
                      </div>
                      
                      {/* 課程資訊區塊 */}
                      <div className="text-white">
                        <h2 className="text-2xl font-bold mb-2">
                          {group.lessons.map(lesson => getCourseType(lesson) || '未設定').filter((value, index, self) => self.indexOf(value) === index).join(' + ')}
                        </h2>
                        <p className="text-white/80 font-medium text-lg">
                          <span className="animate-pulse">{group.lessons.length}</span> 位可愛的小音樂家
                        </p>
                      </div>
                    </div>
                    
                    {/* 右側裝飾 */}
                    <div className="text-white text-right flex items-center space-x-4">
                      <div className="text-right">
                        <div className="mb-2">
                          <MusicalNoteIcon className="w-10 h-10 text-white/90" />
                        </div>
                        <div className="text-sm text-white/70 font-medium">音樂時光</div>
                        <div className="text-xs text-white/50 mt-1">點擊展開/收起</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronDownIcon 
                          className={`w-6 h-6 text-white/70 transition-transform duration-300 ${
                            expandedTimeSlots[`${group.date}_${group.timeSlot}`] ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 學生卡片網格 */}
                {expandedTimeSlots[`${group.date}_${group.timeSlot}`] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                  {group.lessons.map((lesson, lessonIndex) => {
                    const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                    const studentAssignedActivities = studentActivitiesMap.get(studentId) || [];
                    const isLoadingActivities = loadingStudentActivities.has(studentId);
                    const isTrial = 'trial_status' in lesson;
                    const remainingLessons = remainingLessonsMap[studentId] || 0;
                    
                    return (
                      <div 
                        key={`${lesson.id}-${lessonIndex}`} 
                        className="group/card relative animate-fade-in-up"
                        style={{ animationDelay: `${(groupIndex * 100) + (lessonIndex * 50)}ms` }}
                      >
                        <div className={`student-card rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden border-2 ${getStudentBackgroundColor(remainingLessons, isTrial)}`}>
                          {/* 背景裝飾 */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 rounded-full -translate-y-8 translate-x-8 group-hover/card:scale-150 transition-transform duration-500"></div>
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-hanami-secondary/10 to-hanami-primary/10 rounded-full translate-y-6 -translate-x-6 group-hover/card:scale-125 transition-transform duration-700"></div>
                          
                          {/* 試堂徽章 */}
                          {isTrial && (
                            <div className="absolute top-3 right-16 z-10">
                              <div className="trial-badge bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1 animate-pulse">
                                <SparklesIcon className="w-3 h-3" />
                                <span>試堂</span>
                              </div>
                            </div>
                          )}

                          {/* 能力評估按鈕 */}
                          <div className="absolute top-3 right-3 z-50">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const student = {
                                  id: 'student_id' in lesson ? lesson.student_id : lesson.id,
                                  full_name: getStudentName(lesson),
                                  nick_name: getStudentNickname(lesson)
                                };
                                openAbilityAssessmentModal(student);
                              }}
                              className="group/assessment relative cursor-pointer"
                            >
                              {/* 主按鈕 - 根據評估狀態改變顏色 */}
                              {(() => {
                                const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                const hasAssessment = studentAssessmentStatus[studentId] || false;
                                
                                return (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform hover:rotate-12 ${
                                    hasAssessment 
                                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500' // 已評估：綠色
                                      : 'bg-gradient-to-br from-orange-400 to-amber-500'  // 未評估：橙色
                                  }`}>
                                    <AcademicCapIcon className="w-5 h-5 text-white" />
                                  </div>
                                );
                              })()}
                              
                              {/* 動畫裝飾 */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                              
                              {/* 懸停提示 - 根據評估狀態改變顏色 */}
                              {(() => {
                                const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                const hasAssessment = studentAssessmentStatus[studentId] || false;
                                const tooltipColor = hasAssessment ? 'bg-emerald-600/90' : 'bg-orange-600/90';
                                
                                return (
                                  <div className={`absolute top-12 right-0 ${tooltipColor} text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover/assessment:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20`}>
                                    {hasAssessment ? '已完成評估' : '待評估'}
                                    <div className={`absolute -top-1 right-3 w-2 h-2 ${tooltipColor} transform rotate-45`}></div>
                                  </div>
                                );
                              })()}
                            </button>
                          </div>

                          {/* 剩餘堂數徽章 - 只顯示試堂和兩堂或以下 */}
                          {!isTrial && remainingLessons <= 2 && (
                            <div className="absolute top-3 left-3 z-10">
                              <div className={`px-2 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1 ${
                                remainingLessons === 0 
                                  ? 'bg-red-500 text-white' 
                                  : remainingLessons <= 2 
                                  ? 'bg-orange-500 text-white' 
                                  : 'bg-green-500 text-white'
                              }`}>
                                <span>{remainingLessons} 堂</span>
                              </div>
                            </div>
                          )}

                          {/* 學生頭像和資訊 */}
                          <div className="relative z-10 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="avatar-glow w-14 h-14 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover/card:rotate-12 transition-transform duration-300">
                                  {getStudentName(lesson).charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-hanami-text text-lg truncate">
                                  {getStudentName(lesson)}
                                </h3>
                                {getStudentNickname(lesson) && (
                                  <p className="text-hanami-text-secondary font-medium text-sm truncate">
                                    {getStudentNickname(lesson)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 學生詳細資訊 */}
                          <div className="relative z-10 space-y-3 mb-4">
                            <div className="bg-hanami-primary/10 rounded-xl p-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <CakeIcon className="w-4 h-4 text-hanami-primary" />
                                  <span className="font-medium text-hanami-text">
                                    {convertAgeToYears(getStudentAge(lesson))}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MusicalNoteIcon className="w-4 h-4 text-hanami-primary" />
                                  <span className="font-medium text-hanami-text">
                                    {getCourseType(lesson) || '未設定'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-hanami-secondary/10 rounded-xl p-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4 text-hanami-primary" />
                                  <span className="font-medium text-hanami-text">
                                    {lesson.lesson_duration || '未設定'}
                                    {isTrial && ` (試堂)`}
                                  </span>
                                </div>
                                {getLessonTeacher(lesson) && (
                                  <div className="flex items-center space-x-2">
                                    <AcademicCapIcon className="w-4 h-4 text-hanami-primary" />
                                    <span className="font-medium text-hanami-text truncate max-w-20">
                                      {getLessonTeacher(lesson)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 試堂狀態顯示 */}
                            {isTrial && (
                              <div className="bg-orange-100 rounded-xl p-3">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <SparklesIcon className="w-4 h-4 text-orange-500" />
                                    <span className="font-medium text-orange-700">
                                      試堂狀態: {lesson.trial_status || '進行中'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 學習中活動 */}
                          <div className="relative z-10 mb-4">
                            <h4 className="text-sm font-bold text-hanami-text mb-2 flex items-center">
                              <AcademicCapIcon className="w-4 h-4 mr-2 text-hanami-primary" />
                              學習中活動
                            </h4>
                            <div className="space-y-2">
                              {isLoadingActivities ? (
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/30">
                                  <p className="text-xs text-gray-500 text-center">
                                    載入中...
                                  </p>
                                </div>
                              ) : studentAssignedActivities.length === 0 ? (
                                <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/30">
                                  <p className="text-xs text-gray-500 text-center">
                                    暫無未完成的活動
                                  </p>
                                </div>
                                  ) : (
                                 <>
                                   {/* 顯示活動 - 根據展開狀態決定顯示數量 */}
                                   {(() => {
                                     const isExpanded = expandedActivitiesMap[lesson.id];
                                     const displayCount = isExpanded ? studentAssignedActivities.length : 1;
                                     console.log(`📋 渲染學生活動 - 課程ID: ${lesson.id}, 展開狀態: ${isExpanded}, 總活動數: ${studentAssignedActivities.length}, 顯示數量: ${displayCount}`);
                                     return studentAssignedActivities
                                       .slice(0, displayCount)
                                       .map((activity, activityIndex) => (
                                       <div key={`ongoing-${activity.id}-${activityIndex}`} className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-lg p-3 border border-blue-200/30 hover:bg-blue-100/50 transition-colors">
                                         <div className="space-y-2">
                                           {/* 活動狀態和名稱 */}
                                           <div className="flex items-center justify-between">
                                             <div className="flex items-center space-x-2">
                                               {activity.completionStatus === 'not_started' ? (
                                                 <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                               ) : activity.completionStatus === 'in_progress' ? (
                                                 <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                               ) : (
                                                 <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                               )}
                                               <span className="text-xs text-gray-600">
                                                 {activity.completionStatus === 'not_started' ? '未開始' : 
                                                  activity.completionStatus === 'in_progress' ? '進行中' : '學習中'}
                                               </span>
                                             </div>
                                             <button
                                               onClick={() => {
                                                 if (editingProgressActivityId === activity.id) {
                                                   setEditingProgressActivityId(null);
                                                   toast('已退出編輯模式');
                                                 } else {
                                                   setEditingProgressActivityId(activity.id);
                                                   toast('已進入編輯模式，可以拖拽調整進度');
                                                 }
                                               }}
                                               className={`p-1 transition-colors hover:scale-110 transform ${
                                                 editingProgressActivityId === activity.id 
                                                   ? 'text-green-600 hover:text-green-800' 
                                                   : 'text-blue-600 hover:text-blue-800'
                                               }`}
                                             >
                                               <PencilIcon className="w-3 h-3" />
                                             </button>
                                           </div>
                                           
                                           {/* 活動詳細資訊 */}
                                           <div className="space-y-1">
                                             <p className="text-sm font-medium text-blue-800">
                                               {activity.activityName || '未知活動'}
                                             </p>
                                             
                                             <div className="flex items-center space-x-3 text-xs text-blue-600">
                                               <span className="flex items-center space-x-1">
                                                 <AcademicCapIcon className="w-3 h-3" />
                                                 <span>難度 {activity.difficultyLevel || 'N/A'}</span>
                                               </span>
                                               <span className="flex items-center space-x-1">
                                                 <MusicalNoteIcon className="w-3 h-3" />
                                                 <span>{activity.activityType || '未知類型'}</span>
                                               </span>
                                             </div>
                                             
                                             {/* 進度條 */}
                                             <div className="space-y-1">
                                               <div className="flex items-center justify-between text-xs text-blue-600">
                                                 <span>進度</span>
                                                 <span className="progress-text">{(() => {
                                                   const progress = activity.progress || 0;
                                                   const normalizedProgress = progress > 1 ? progress / 100 : progress;
                                                   return Math.round(normalizedProgress * 100);
                                                 })()}%</span>
                                               </div>
                                               <div className="relative">
                                                 <div 
                                                   className={`w-full bg-blue-200 rounded-full h-2 ${editingProgressActivityId === activity.id ? 'ring-2 ring-blue-400 ring-opacity-50 cursor-pointer' : ''}`}
                                                   onClick={(e) => {
                                                     if (editingProgressActivityId !== activity.id) return;
                                                     
                                                     const rect = e.currentTarget.getBoundingClientRect();
                                                     const x = e.clientX - rect.left;
                                                     const percentage = Math.round((x / rect.width) * 100);
                                                     const normalizedPercentage = Math.max(0, Math.min(percentage, 100));
                                                     
                                                     saveProgressToDatabase(activity.id, normalizedPercentage);
                                                   }}
                                                 >
                                                   <div 
                                                     className="progress-bar-fill bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                                                     style={{ width: `${(() => {
                                                       const progress = activity.progress || 0;
                                                       const normalizedProgress = progress > 1 ? progress / 100 : progress;
                                                       return Math.min(normalizedProgress * 100, 100);
                                                     })()}%` }}
                                                   ></div>
                                                 </div>
                                                 {editingProgressActivityId === activity.id && (
                                                   <div 
                                                     className="edit-indicator absolute top-1/2 transform -translate-y-1/2 pointer-events-none"
                                                     style={{ 
                                                       left: `${(() => {
                                                         const progress = activity.progress || 0;
                                                         const normalizedProgress = progress > 1 ? progress / 100 : progress;
                                                         return Math.min(normalizedProgress * 100, 100);
                                                       })()}%`
                                                     }}
                                                   >
                                                     <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                                       <PencilIcon className="w-2 h-2 text-white" />
                                                     </div>
                                                   </div>
                                                 )}
                                               </div>
                                             </div>
                                             
                                             {/* 分配時間 */}
                                             {activity.assignedAt && (
                                               <div className="flex items-center space-x-1 text-xs text-blue-600">
                                                 <CalendarIcon className="w-3 h-3" />
                                                 <span>分配時間: {new Date(activity.assignedAt).toLocaleDateString('zh-TW')}</span>
                                               </div>
                                             )}
                                           </div>
                                         </div>
                                       </div>
                                     ));
                                   })()}
                                   
                                   {/* 展開/收起按鈕 - 只有多於一個活動時才顯示 */}
                                   {studentAssignedActivities.length > 1 && (
                                     <div className="flex justify-center mt-3">
                                       <button
                                         onClick={() => toggleActivitiesExpanded(lesson.id)}
                                         className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                       >
                                         <span>
                                           {expandedActivitiesMap[lesson.id] ? '收起' : `展開其餘 ${studentAssignedActivities.length - 1} 個活動`}
                                         </span>
                                         <ChevronDownIcon 
                                           className={`w-3 h-3 transition-transform duration-200 ${
                                             expandedActivitiesMap[lesson.id] ? 'rotate-180' : ''
                                           }`} 
                                         />
                                       </button>
                                     </div>
                                   )}
                                 </>
                               )}
                            </div>
                          </div>

                          {/* 課程備註 */}
                          {getLessonNotes(lesson) && (
                            <div className="relative z-10 mb-4">
                              <h4 className="text-sm font-bold text-hanami-text mb-2 flex items-center">
                                <DocumentTextIcon className="w-4 h-4 mr-2 text-hanami-primary" />
                                課程備註
                              </h4>
                              <p className="text-xs text-hanami-text-secondary bg-hanami-accent/10 p-3 rounded-lg border border-hanami-accent/20">
                                {getLessonNotes(lesson)}
                              </p>
                            </div>
                          )}

                          {/* 操作按鈕 */}
                          <div className="relative z-10 flex items-center justify-between pt-3 border-t border-hanami-border/30">
                            <button
                              onClick={() => {
                                const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                const studentName = getStudentName(lesson);
                                setSelectedStudentForActivities({
                                  studentId,
                                  studentName,
                                  lessonDate: lesson.lesson_date,
                                  timeslot: lesson.actual_timeslot || ''
                                });
                                setShowStudentActivitiesModal(true);
                              }}
                              className="hanami-action-btn flex items-center space-x-2 px-4 py-2 text-white rounded-xl font-medium shadow-md hover:shadow-lg"
                            >
                              <PlusIcon className="w-4 h-4" />
                              <span>分配活動</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                toast('詳情功能開發中...');
                              }}
                              className="p-2 text-hanami-text-secondary hover:text-hanami-primary transition-colors hover:scale-110 transform hover:bg-hanami-primary/10 rounded-lg"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 活動選擇器模態視窗 */}
        {showActivitySelector && selectedLesson && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-br from-white via-hanami-surface to-hanami-background rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl border border-hanami-border/30 animate-scale-in">
              {/* 模態視窗標題 */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hanami-border/30">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{getStudentName(selectedLesson).charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-hanami-text">
                      為 {getStudentName(selectedLesson)} 分配活動
                    </h3>
                    <p className="text-sm text-hanami-text-secondary">
                      選擇適合的活動來豐富課程內容
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActivitySelector(false)}
                  className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                >
                  ✕
                </button>
              </div>
              
              {/* 選擇方式按鈕 */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => {
                    setShowActivitySelector(false);
                    setShowLearningPathSelector(true);
                    // 載入學習路徑資料
                    const courseType = getCourseType(selectedLesson);
                    if (courseType && courseType !== '未設定') {
                      loadLearningPaths(courseType);
                    } else {
                      toast.error('無法獲取學生的課程類型');
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>學習路徑</span>
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>選擇活動</span>
                </button>
              </div>
              
              {/* 活動列表 */}
              <div className="overflow-y-auto max-h-[60vh] space-y-4 scrollbar-hide">
                {treeActivities.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-hanami-primary/20 to-hanami-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-float">
                      <TagIcon className="w-10 h-10 text-hanami-primary" />
                    </div>
                    <p className="text-hanami-text text-lg font-medium mb-2">暫無可用活動</p>
                    <p className="text-hanami-text-secondary">活動正在準備中，敬請期待！</p>
                  </div>
                ) : (
                  treeActivities.map((activity, index) => (
                    <div 
                      key={`${activity.id}-${index}`} 
                      className="hanami-card-glow bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-hanami-border/40 hover:border-hanami-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-lg flex items-center justify-center">
                              <TagIcon className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-hanami-text text-lg">
                              {getActivityDisplayName(activity)}
                            </h4>
                          </div>
                          
                          <p className="text-hanami-text-secondary mb-4 leading-relaxed">
                            {activity.custom_activity_description || '這是一個精心設計的教學活動，將為學生帶來豐富的學習體驗。'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-hanami-accent to-pink-400 text-white shadow-sm">
                              <MusicalNoteIcon className="w-3 h-3 mr-1" />
                              {activity.activity_type}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-sm">
                              <AcademicCapIcon className="w-3 h-3 mr-1" />
                              難度 {activity.difficulty_level}
                            </span>
                            {activity.estimated_duration && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {activity.estimated_duration} 分鐘
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => assignActivityToStudent(
                            selectedLesson.id, 
                            selectedStudent, 
                            activity.id
                          )}
                          className="hanami-action-btn px-6 py-3 text-white rounded-xl font-medium shadow-md hover:shadow-lg flex items-center space-x-2 min-w-[120px] justify-center"
                        >
                          <PlusIcon className="w-5 h-5" />
                          <span>分配</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* 底部操作區 */}
              <div className="mt-6 pt-4 border-t border-hanami-border/30 flex justify-center">
                <button
                  onClick={() => setShowActivitySelector(false)}
                  className="px-6 py-2 bg-hanami-surface hover:bg-hanami-border text-hanami-text rounded-xl transition-colors duration-200 font-medium"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 學習路徑選擇器模態視窗 */}
        {showLearningPathSelector && selectedLesson && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-br from-white via-hanami-surface to-hanami-background rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl border border-hanami-border/30 animate-scale-in">
              {/* 模態視窗標題 */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hanami-border/30">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-hanami-text">
                      為 {getStudentName(selectedLesson)} 選擇學習路徑
                    </h3>
                    <p className="text-sm text-hanami-text-secondary">
                      選擇完整的學習路徑來系統化地安排課程內容
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLearningPathSelector(false)}
                  className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                >
                  ✕
                </button>
              </div>
              
              {/* 學習路徑列表 */}
              <div className="overflow-y-auto max-h-[60vh] space-y-4 scrollbar-hide">
                {learningPaths.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-float">
                      <svg className="w-10 h-10 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <p className="text-hanami-text text-lg font-medium mb-2">暫無可用學習路徑</p>
                    <p className="text-hanami-text-secondary">學習路徑正在準備中，敬請期待！</p>
                  </div>
                ) : (
                  learningPaths.map((path, index) => {
                    // 解析節點資料
                    let nodes = path.nodes;
                    if (typeof nodes === 'string') {
                      try {
                        nodes = JSON.parse(nodes);
                      } catch (e) {
                        nodes = [];
                      }
                    }
                    
                    const activityNodes = nodes.filter((node: any) => node.type === 'activity');
                    const totalDuration = activityNodes.reduce((sum: number, node: any) => sum + (node.duration || 0), 0);
                    
                    return (
                      <div 
                        key={`${path.id}-${index}`} 
                        className="hanami-card-glow bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-hanami-border/40 hover:border-[#8B5CF6]/50 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                              </div>
                              <h4 className="font-bold text-hanami-text text-lg">
                                {path.name || '未命名學習路徑'}
                              </h4>
                            </div>
                            
                            <p className="text-hanami-text-secondary mb-4 leading-relaxed">
                              {path.description || '這是一個精心設計的學習路徑，將為學生帶來系統化的學習體驗。'}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-sm">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                學習路徑
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-sm">
                                <AcademicCapIcon className="w-3 h-3 mr-1" />
                                {activityNodes.length} 個活動
                              </span>
                              {totalDuration > 0 && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm">
                                  <ClockIcon className="w-3 h-3 mr-1" />
                                  {totalDuration} 分鐘
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => assignLearningPathToStudent(
                              selectedLesson.id, 
                              selectedStudent, 
                              path.id
                            )}
                            className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white rounded-xl font-medium shadow-md hover:shadow-lg flex items-center space-x-2 min-w-[120px] justify-center transition-all duration-200 hover:scale-105"
                          >
                            <PlusIcon className="w-5 h-5" />
                            <span>分配路徑</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* 底部操作區 */}
              <div className="mt-6 pt-4 border-t border-hanami-border/30 flex justify-center">
                <button
                  onClick={() => setShowLearningPathSelector(false)}
                  className="px-6 py-2 bg-hanami-surface hover:bg-hanami-border text-hanami-text rounded-xl transition-colors duration-200 font-medium"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 教案編輯模態框 */}
        {showLessonPlanModal && selectedTimeSlot && (
          <LessonPlanModal
            open={showLessonPlanModal}
            onClose={() => {
              setShowLessonPlanModal(false);
              setSelectedTimeSlot(null);
            }}
            lessonDate={new Date(selectedTimeSlot.date)}
            timeslot={selectedTimeSlot.timeSlot}
            courseType={selectedTimeSlot.courseType}
            onSaved={() => {
              setShowLessonPlanModal(false);
              setSelectedTimeSlot(null);
              // 可以選擇重新載入資料
              loadClassData();
            }}
          />
        )}

        {/* 學生活動管理模態框 */}
        {showStudentActivitiesModal && selectedStudentForActivities && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-6 w-6 text-hanami-text" />
                    <h3 className="text-xl font-bold text-hanami-text">
                      課堂學生活動 - {selectedStudentForActivities.studentName}
                    </h3>
                  </div>
                  <button
                    className="text-hanami-text hover:text-hanami-text-secondary transition-colors"
                    onClick={() => {
                      setShowStudentActivitiesModal(false);
                      setSelectedStudentForActivities(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <StudentActivitiesPanel
                  studentId={selectedStudentForActivities.studentId}
                  lessonDate={selectedStudentForActivities.lessonDate}
                  timeslot={selectedStudentForActivities.timeslot}
                />
              </div>
            </div>
          </div>
        )}

        {/* 成長樹詳情模態框 */}
        {showGrowthTreeModal && growthTreeData && selectedStudentForTree && (
          <GrowthTreeDetailModal
            tree={growthTreeData.tree}
            goals={growthTreeData.goals}
            abilitiesOptions={growthTreeData.abilitiesOptions}
            activitiesOptions={growthTreeData.activitiesOptions}
            teachersOptions={growthTreeData.teachersOptions}
            studentsInTree={growthTreeData.studentsInTree}
            onClose={() => {
              setShowGrowthTreeModal(false);
              setSelectedStudentForTree(null);
              setGrowthTreeData(null);
            }}
            onEdit={() => {
              // 可以添加編輯功能
              console.log('編輯成長樹功能');
            }}
            onManageStudents={() => {
              // 可以添加學生管理功能
              console.log('管理學生功能');
            }}
          />
        )}

        {/* 能力評估模態框 */}
        {showAbilityAssessmentModal && selectedStudentForAssessment && selectedTreeForAssessment && (
          <SimpleAbilityAssessmentModal
              defaultStudent={selectedStudentForAssessment}
              defaultAssessmentDate={new Date().toISOString().split('T')[0]}
              lockStudent={true}
              lockTeacher={true}
              defaultTeacher={directTeacherAccess?.employeeData ? {
                id: directTeacherAccess.employeeData.id,
                teacher_fullname: directTeacherAccess.employeeData.teacher_fullname,
                teacher_nickname: directTeacherAccess.employeeData.teacher_nickname
              } : undefined}
              onClose={() => {
                setShowAbilityAssessmentModal(false);
              setSelectedStudentForAssessment(null);
              setSelectedTreeForAssessment(null);
            }}
            onSubmit={(assessment) => {
              console.log('能力評估提交:', assessment);
              toast.success('能力評估已保存');
              
              // 更新學生評估狀態為已評估
              if (selectedStudentForAssessment) {
                setStudentAssessmentStatus(prev => ({
                  ...prev,
                  [selectedStudentForAssessment.id]: true
                }));
                console.log(`✅ 學生 ${selectedStudentForAssessment.full_name} 評估狀態已更新為已完成`);
              }
              
              setShowAbilityAssessmentModal(false);
              setSelectedStudentForAssessment(null);
              setSelectedTreeForAssessment(null);
            }}
          />
        )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}




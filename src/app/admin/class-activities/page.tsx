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

export default function ClassActivitiesPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date()); // 新增：選中的日期
  const [viewMode, setViewMode] = useState<'day'>('day'); // 只保留單日檢視
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]); // 多選的日期
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
  const [treeActivities, setTreeActivities] = useState<TreeActivity[]>([]);
  const [assignedActivities, setAssignedActivities] = useState<AssignedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('載入課堂資料中...');
  
  // 快取機制
  const [dataCache, setDataCache] = useState<Map<string, any>>(new Map());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | TrialLesson | null>(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
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



  // 獲取單日日期範圍
  const getDayDates = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    // 使用本地時間格式化日期，避免時區問題
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatLocalDate(start),
      end: formatLocalDate(end)
    };
  };

  // 載入課堂資料
  const loadClassData = async () => {
    try {
      setLoading(true);
      setLoadingText('載入課堂資料中...');
      
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
      
      // 使用本地時間格式化日期，避免時區問題
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const cacheKey = `${formatLocalDate(startDate)}-${formatLocalDate(endDate)}`;
      
      // 檢查快取
      if (dataCache.has(cacheKey)) {
        console.log('使用快取資料:', cacheKey);
        setLoadingText('處理快取資料中...');
        const cachedData = dataCache.get(cacheKey);
        
        // 如果是多選模式，需要過濾出只屬於選中日期的課程
        if (selectedDates.length > 1) {
          const selectedDateStrings = selectedDates.map(date => formatLocalDate(date));
          
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
      const response = await fetch(`/api/class-activities?weekStart=${formatLocalDate(startDate)}&weekEnd=${formatLocalDate(endDate)}`);
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
          const selectedDateStrings = selectedDates.map(date => formatLocalDate(date));
        
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

  useEffect(() => {
    loadClassData();
  }, [selectedDate, selectedDates]);



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
    const today = new Date();
    setSelectedDate(today);
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
  const getStudentAssignedActivities = (lessonId: string, studentId: string) => {
    return assignedActivities.filter(
      aa => aa.lesson_id === lessonId && aa.student_id === studentId
    );
  };

  // 分配活動給學生
  const assignActivityToStudent = async (lessonId: string, studentId: string, treeActivityId: string) => {
    try {
      const response = await fetch('/api/class-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          student_id: studentId,
          tree_activity_id: treeActivityId,
          assigned_by: 'admin' // 這裡可以改為實際的用戶ID
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

  // 處理時段卡片點擊 - 開啟教案編輯
  const handleTimeSlotClick = (date: string, timeSlot: string, courseType: string) => {
    setSelectedTimeSlot({
      date,
      timeSlot,
      courseType
    });
    setShowLessonPlanModal(true);
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
    // 使用本地時間格式化日期，避免時區問題
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatDate(formatLocalDate(selectedDate)),
      end: formatDate(formatLocalDate(selectedDate))
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

  // 按時段分組課程
  const groupLessonsByTimeSlot = (): TimeSlotGroup[] => {
    let allLessons = [...lessons, ...trialLessons];
    
    // 如果有多選日期，顯示所有選中日期的課程
    if (selectedDates.length > 1) {
      const selectedDateStrs = selectedDates.map(date => date.toISOString().split('T')[0]);
      allLessons = allLessons.filter(lesson => selectedDateStrs.includes(lesson.lesson_date));
    } else {
      // 單選模式：只顯示選中日期的課程
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      allLessons = allLessons.filter(lesson => lesson.lesson_date === selectedDateStr);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-hanami-text">課堂活動管理</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                router.push('/admin/hanami-tc');
              }}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-white text-hanami-text border border-hanami-border hover:bg-hanami-surface hover:border-hanami-primary"
            >
              日曆檢視
            </button>
          </div>
        </div>

        {/* 日期導航和選擇器 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-hanami-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousDay}
                className="flex items-center space-x-2 px-4 py-2 bg-hanami-surface rounded-lg border border-hanami-border hover:bg-hanami-primary/10 transition-colors"
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
                className="flex items-center space-x-2 px-4 py-2 bg-hanami-surface rounded-lg border border-hanami-border hover:bg-hanami-primary/10 transition-colors"
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
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setSelectedDate(newDate);
                  }}
                  className="px-3 py-2 border border-hanami-border rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                />
              </div>
              
              {/* 今天按鈕 */}
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gradient-to-r from-hanami-primary to-hanami-accent text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                今天
              </button>
              
              {/* 一鍵清除按鈕 - 只在多選時顯示 */}
              {selectedDates.length > 1 && (
                <button
                  onClick={clearWeekSelection}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  清除選擇 ({selectedDates.length})
                </button>
              )}
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
                  className={`w-12 h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                    isToday 
                      ? 'bg-white border-2 border-hanami-primary text-hanami-primary shadow-lg'
                      : isSelected
                      ? 'bg-hanami-primary/20 text-hanami-primary border-2 border-hanami-primary'
                      : 'bg-hanami-surface text-hanami-text hover:bg-hanami-primary/10 hover:text-hanami-primary'
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
                    <div className="text-white text-right">
                      <div className="mb-2">
                        <MusicalNoteIcon className="w-10 h-10 text-white/90" />
                      </div>
                      <div className="text-sm text-white/70 font-medium">音樂時光</div>
                      <div className="text-xs text-white/50 mt-1">點擊編輯教案</div>
                    </div>
                  </div>
                </div>

                {/* 學生卡片網格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.lessons.map((lesson, lessonIndex) => {
                    const studentAssignedActivities = getStudentAssignedActivities(lesson.id, 'student_id' in lesson ? lesson.student_id : lesson.id);
                    const isTrial = 'trial_status' in lesson;
                    
                    return (
                      <div 
                        key={`${lesson.id}-${lessonIndex}`} 
                        className="group/card relative animate-fade-in-up"
                        style={{ animationDelay: `${(groupIndex * 100) + (lessonIndex * 50)}ms` }}
                      >
                        <div className="student-card rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden">
                          {/* 背景裝飾 */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 rounded-full -translate-y-8 translate-x-8 group-hover/card:scale-150 transition-transform duration-500"></div>
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-hanami-secondary/10 to-hanami-primary/10 rounded-full translate-y-6 -translate-x-6 group-hover/card:scale-125 transition-transform duration-700"></div>
                          
                          {/* 試堂徽章 */}
                          {isTrial && (
                            <div className="absolute top-3 right-3 z-10">
                              <div className="trial-badge bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1 animate-pulse">
                                <SparklesIcon className="w-3 h-3" />
                                <span>試堂</span>
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

                          {/* 已分配活動 */}
                          {studentAssignedActivities.length > 0 && (
                            <div className="relative z-10 mb-4">
                              <h4 className="text-sm font-bold text-hanami-text mb-2 flex items-center">
                                <TagIcon className="w-4 h-4 mr-2 text-hanami-primary" />
                                已分配活動
                              </h4>
                              <div className="space-y-2">
                                {studentAssignedActivities.map((assignment, assignmentIndex) => {
                                  const activity = treeActivities.find(ta => ta.id === assignment.tree_activity_id);
                                  return (
                                    <div key={`${assignment.id}-${assignmentIndex}`} className="bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-hanami-border/30 hover:bg-white transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-hanami-text truncate">
                                            {activity ? getActivityDisplayName(activity) : '未知活動'}
                                          </p>
                                          <p className="text-xs text-hanami-text-secondary flex items-center space-x-1">
                                            {assignment.completion_status === 'not_started' ? (
                                              <>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <span>未開始</span>
                                              </>
                                            ) : assignment.completion_status === 'in_progress' ? (
                                              <>
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                <span>進行中</span>
                                              </>
                                            ) : assignment.completion_status === 'completed' ? (
                                              <>
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>已完成</span>
                                              </>
                                            ) : (
                                              <>
                                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                <span>未知</span>
                                              </>
                                            )}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => {
                                              toast('編輯功能開發中...');
                                            }}
                                            className="p-1 text-hanami-text-secondary hover:text-hanami-primary transition-colors hover:scale-110 transform"
                                          >
                                            <PencilIcon className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => removeActivityAssignment(assignment.id)}
                                            className="p-1 text-red-400 hover:text-red-600 transition-colors hover:scale-110 transform"
                                          >
                                            <TrashIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

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
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
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

interface ClassGroup {
  id: string;
  course_code: string;
  course_section: string;
  course_type: string;
  weekday: number;
  timeslot: string;
  max_students: number;
  assigned_teachers: string;
  assigned_student_ids: string[];
  room_id: string;
  lessons: (Lesson | TrialLesson)[];
  students: any[]; // 班級中所有分配的學生
  teacher_main_name?: string; // 主教師名字
  teacher_assist_name?: string; // 助教名字
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

  // 切換班級展開/收起狀態
  const toggleClassExpansion = (classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  // 載入所有老師列表
  const loadAllTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const { data: teachers, error } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
        .eq('teacher_status', 'active')
        .order('teacher_fullname');

      if (error) throw error;
      setAllTeachers(teachers || []);
    } catch (error) {
      console.error('載入老師列表失敗:', error);
      toast.error('載入老師列表失敗');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // 處理老師圖標點擊
  const handleTeacherClick = (classGroup: ClassGroup, teacherRole: 'main' | 'assist') => {
    setSelectedClassForTeacher({
      classId: classGroup.id,
      classCode: `${classGroup.course_code}-${classGroup.course_section}`,
      currentMainTeacher: classGroup.teacher_main_name,
      currentAssistTeacher: classGroup.teacher_assist_name,
      teacherRole
    });
    setShowTeacherSelectionModal(true);
    
    // 如果還沒有載入老師列表，則載入
    if (allTeachers.length === 0) {
      loadAllTeachers();
    }
  };

  // 更新班級老師
  const updateClassTeacher = async (teacherId: string | null, teacherName: string) => {
    if (!selectedClassForTeacher) return;

    try {
      const { error } = await supabase
        .from('hanami_schedule_daily')
        .update({
          [selectedClassForTeacher.teacherRole === 'main' ? 'teacher_main_id' : 'teacher_assist_id']: teacherId
        })
        .eq('schedule_template_id', selectedClassForTeacher.classId)
        .eq('lesson_date', selectedDate.toISOString().split('T')[0]);

      if (error) throw error;

      // 更新本地狀態
      setClassGroups(prev => prev.map(group => {
        if (group.id === selectedClassForTeacher.classId) {
          return {
            ...group,
            [selectedClassForTeacher.teacherRole === 'main' ? 'teacher_main_name' : 'teacher_assist_name']: teacherName
          };
        }
        return group;
      }));

      const actionText = teacherId ? `為 ${teacherName}` : '為空';
      toast.success(`已更新${selectedClassForTeacher.teacherRole === 'main' ? '主教' : '助教'}${actionText}`);
      setShowTeacherSelectionModal(false);
      setSelectedClassForTeacher(null);
    } catch (error) {
      console.error('更新老師失敗:', error);
      toast.error('更新老師失敗');
    }
  };

  // 載入班別資料（根據 hanami_schedule）
  const loadClassGroupData = async () => {
    try {
      setLoadingText('載入班別資料中...');
      
      // 計算選中日期的星期幾
      const selectedWeekday = selectedDate.getDay(); // 0=星期日, 1=星期一...6=星期六
      
      // 格式化時間為 HH:mm 格式
      const formatLocalDate = (date: Date) => {
        const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
        const year = hongKongTime.getFullYear();
        const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
        const day = String(hongKongTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const dateStr = formatLocalDate(selectedDate);
      
      // 獲取該星期幾的所有班級排程
      const { data: schedules, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('weekday', selectedWeekday)
        .order('timeslot');

      if (scheduleError) throw scheduleError;

      if (!schedules || schedules.length === 0) {
        setClassGroups([]);
        setLoadingText('');
        return;
      }

      const processedClassGroups: ClassGroup[] = [];

      for (const schedule of schedules) {
        // 找到該班級在選中日期的課程記錄
        const matchedLessons = [
          ...lessons.filter(lesson => 
            lesson.lesson_date === dateStr && 
            lesson.actual_timeslot === schedule.timeslot
          ),
          ...trialLessons.filter(lesson => 
            lesson.lesson_date === dateStr && 
            lesson.actual_timeslot === schedule.timeslot
          )
        ];

        // 獲取該班級在選中日期的老師資訊
        let teacherMainName = '';
        let teacherAssistName = '';
        
        if (schedule.id) {
          const { data: dailySchedule, error: dailyError } = await supabase
            .from('hanami_schedule_daily')
            .select('teacher_main_id, teacher_assist_id')
            .eq('schedule_template_id', schedule.id)
            .eq('lesson_date', dateStr)
            .single();

          if (!dailyError && dailySchedule) {
            // 獲取主教資訊
            if (dailySchedule.teacher_main_id) {
              const { data: mainTeacher, error: mainError } = await supabase
                .from('hanami_employee')
                .select('teacher_fullname, teacher_nickname')
                .eq('id', dailySchedule.teacher_main_id)
                .single();
              
              if (!mainError && mainTeacher) {
                teacherMainName = mainTeacher.teacher_fullname || mainTeacher.teacher_nickname || '';
              }
            }

            // 獲取助教資訊
            if (dailySchedule.teacher_assist_id) {
              const { data: assistTeacher, error: assistError } = await supabase
                .from('hanami_employee')
                .select('teacher_fullname, teacher_nickname')
                .eq('id', dailySchedule.teacher_assist_id)
                .single();
              
              if (!assistError && assistTeacher) {
                teacherAssistName = assistTeacher.teacher_fullname || assistTeacher.teacher_nickname || '';
              }
            }
          }
        }

        // 獲取該班級的所有學生
        let students: any[] = [];
        if (schedule.assigned_student_ids && schedule.assigned_student_ids.length > 0) {
          const { data: studentData, error: studentError } = await supabase
            .from('Hanami_Students')
            .select('*')
            .in('id', schedule.assigned_student_ids);

          if (!studentError && studentData) {
            students = studentData.map(student => {
              // 檢查該學生是否有出席記錄
              const hasAttendance = matchedLessons.some(lesson => 
                'student_id' in lesson && lesson.student_id === student.id
              );
              
              // 獲取該學生的課程記錄
              const lessonData = matchedLessons.find(lesson => 
                'student_id' in lesson && lesson.student_id === student.id
              );

              return {
                ...student,
                hasAttendance,
                lessonData
              };
            });
          }
        }

        processedClassGroups.push({
          id: schedule.id,
          course_code: schedule.course_code || '',
          course_section: schedule.course_section || 'A',
          course_type: schedule.course_type || '',
          weekday: schedule.weekday || 0,
          timeslot: schedule.timeslot || '',
          max_students: schedule.max_students || 0,
          assigned_teachers: schedule.assigned_teachers || '',
          assigned_student_ids: schedule.assigned_student_ids || [],
          room_id: schedule.room_id || '',
          lessons: matchedLessons,
          students: students,
          teacher_main_name: teacherMainName,
          teacher_assist_name: teacherAssistName
        });
      }

      setClassGroups(processedClassGroups);
      setLoadingText('');
    } catch (error) {
      console.error('載入班別資料失敗:', error);
      toast.error('載入班別資料失敗');
      setLoadingText('');
    }
  };
  
  const todayHK = getTodayInHongKong();
  const [selectedDate, setSelectedDate] = useState(todayHK); // 預設選中今天
  const [viewMode, setViewMode] = useState<'day'>('day'); // 只保留單日檢視
  const [selectedDates, setSelectedDates] = useState<Date[]>([todayHK]); // 預設選中今天

  // 工具函數
  const convertAgeToYears = (ageInMonths: number | null): string => {
    if (!ageInMonths) return '未知';
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (years === 0) {
      return `${months}個月`;
    } else if (months === 0) {
      return `${years}歲`;
    } else {
      return `${years}歲${months}個月`;
    }
  };

  const getStudentBackgroundColor = (remainingLessons: number, isTrial: boolean) => {
    if (isTrial) {
      return 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300';
    } else if (remainingLessons <= 0) {
      return 'bg-gradient-to-br from-red-100 to-red-200 border-red-300';
    } else if (remainingLessons <= 2) {
      return 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300';
    } else if (remainingLessons <= 5) {
      return 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300';
    } else {
      return 'bg-gradient-to-br from-green-100 to-green-200 border-green-300';
    }
  };
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
  const [treeActivities, setTreeActivities] = useState<TreeActivity[]>([]);
  const [assignedActivities, setAssignedActivities] = useState<AssignedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // 學生活動相關狀態
  const [studentActivitiesMap, setStudentActivitiesMap] = useState<Map<string, any[]>>(new Map());
  const [loadingStudentActivities, setLoadingStudentActivities] = useState<Set<string>>(new Set());
  const [remainingLessonsMap, setRemainingLessonsMap] = useState<Record<string, number>>({});
  const [loadingRemainingLessons, setLoadingRemainingLessons] = useState(false);
  const [studentAssessmentStatus, setStudentAssessmentStatus] = useState<Record<string, boolean>>({});
  const [loadingAssessmentStatus, setLoadingAssessmentStatus] = useState(false);
  const [editingProgressActivityId, setEditingProgressActivityId] = useState<string | null>(null);

  // 顯示模式狀態（按學生 vs 按班別）
  const [displayMode, setDisplayMode] = useState<'student' | 'class'>('student');
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  // 當切換到班別顯示模式或課程資料更新時，重新載入班別資料
  useEffect(() => {
    if (displayMode === 'class' && (lessons.length > 0 || trialLessons.length > 0)) {
      loadClassGroupData();
    }
  }, [displayMode, lessons, trialLessons, selectedDate]);

  // 載入班別學生的活動、剩餘堂數和評估狀態
  useEffect(() => {
    if (displayMode === 'class' && classGroups.length > 0) {
      const allStudentIds = classGroups.flatMap(group => group.students.map(s => s.id));
      
      // 載入學生活動
      allStudentIds.forEach(studentId => {
        if (!studentActivitiesMap.has(studentId) && !loadingStudentActivities.has(studentId)) {
          // 這裡可以添加載入學生活動的邏輯
        }
      });
      
      // 載入剩餘堂數
      if (allStudentIds.length > 0 && !loadingRemainingLessons) {
        calculateRemainingLessonsBatch(allStudentIds, new Date()).then(remainingLessons => {
          setRemainingLessonsMap(remainingLessons);
        });
      }
      
      // 載入評估狀態
      if (allStudentIds.length > 0 && !loadingAssessmentStatus) {
        const loadAssessmentStatus = async () => {
          try {
            setLoadingAssessmentStatus(true);
            const today = new Date().toISOString().split('T')[0];
            
            const { data: assessments, error } = await supabase
              .from('hanami_ability_assessments')
              .select('student_id')
              .in('student_id', allStudentIds)
              .eq('assessment_date', today);

            if (!error && assessments) {
              const statusMap: Record<string, boolean> = {};
              allStudentIds.forEach(id => { statusMap[id] = false; });
              assessments.forEach(assessment => {
                statusMap[assessment.student_id] = true;
              });
              setStudentAssessmentStatus(statusMap);
            }
          } catch (error) {
            console.error('載入評估狀態失敗:', error);
          } finally {
            setLoadingAssessmentStatus(false);
          }
        };
        loadAssessmentStatus();
      }
    }
  }, [classGroups, displayMode]);
  const [loadingText, setLoadingText] = useState('載入課堂資料中...');
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false); // 防止重複自動切換
  
  // 老師選擇模態框狀態
  const [showTeacherSelectionModal, setShowTeacherSelectionModal] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<{
    classId: string;
    classCode: string;
    currentMainTeacher?: string;
    currentAssistTeacher?: string;
    teacherRole: 'main' | 'assist';
  } | null>(null);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  
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

  // 載入課堂資料
  const loadClassData = async () => {
    try {
      setLoading(true);
      setLoadingText('載入課堂資料中...');
      
      const formatLocalDate = (date: Date) => {
        const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
        const year = hongKongTime.getFullYear();
        const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
        const day = String(hongKongTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const dateStr = formatLocalDate(selectedDate);
      
      // 發送 API 請求
      const response = await fetch(`/api/class-activities?weekStart=${dateStr}&weekEnd=${dateStr}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '載入課堂資料失敗');
      }
      
      console.log('API 返回的資料:', result.data);
      
      setLessons(result.data.lessons || []);
      setTrialLessons(result.data.trialLessons || []);
      setTreeActivities(result.data.treeActivities || []);
      setAssignedActivities(result.data.assignedActivities || []);
      
    } catch (error) {
      console.error('載入課堂資料失敗:', error);
      toast.error(error instanceof Error ? error.message : '載入課堂資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 權限檢查
  useEffect(() => {
    if (user && !hasTeacherAccess) {
      router.push('/aihome');
    }
  }, [user, hasTeacherAccess, router]);

  // 載入課堂資料
  useEffect(() => {
    if (user && hasTeacherAccess) {
      loadClassData();
    }
  }, [selectedDate, user, hasTeacherAccess]);

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

        {/* 日期選擇和顯示模式切換 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-4 py-2 border border-hanami-border rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
            />
          </div>
          
          {/* 顯示模式切換 */}
          <div className="flex items-center space-x-3 bg-white rounded-full p-1.5 shadow-md border border-hanami-border">
            <button
              onClick={() => setDisplayMode('student')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                displayMode === 'student'
                  ? 'bg-gradient-to-r from-hanami-primary to-hanami-accent text-hanami-text shadow-md'
                  : 'text-hanami-text-secondary hover:text-hanami-text'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">按學生</span>
            </button>
            <button
              onClick={() => setDisplayMode('class')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                displayMode === 'class'
                  ? 'bg-gradient-to-r from-hanami-primary to-hanami-accent text-hanami-text shadow-md'
                  : 'text-hanami-text-secondary hover:text-hanami-text'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              <span className="text-sm">按班別</span>
            </button>
          </div>
        </div>

        {/* 按班別顯示 */}
        {displayMode === 'class' ? (
          <>
            {classGroups.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">今天沒有班級</h3>
                <p className="text-gray-500">請選擇其他日期或聯繫管理員設定班級排程</p>
              </div>
            ) : (
              classGroups.map((classGroup, groupIndex) => (
                <div 
                  key={`${classGroup.id}-${groupIndex}`} 
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${groupIndex * 100}ms` }}
                >
                  {/* 班級標題卡片 */}
                  <div 
                    className="time-slot-header hanami-card-glow rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                    onClick={() => toggleClassExpansion(classGroup.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-8">
                        {/* 班級資訊區塊 */}
                        <div className="flex items-center space-x-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                            <div className="text-center">
                              <div className="text-sm font-medium text-white/90 mb-1">班別代碼</div>
                              <div className="text-2xl font-bold text-white">
                                {classGroup.course_code}-{classGroup.course_section}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-hanami-accent rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse mb-1">
                              {classGroup.students.length}/{classGroup.max_students}
                            </div>
                            <div className="text-xs text-white/70">學生人數</div>
                          </div>
                        </div>
                        
                        {/* 課程詳細資訊 */}
                        <div className="text-white">
                          <h2 className="text-2xl font-bold mb-2">
                            {classGroup.course_type}
                          </h2>
                          <div className="flex items-center space-x-4 text-white/80 text-sm">
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{classGroup.timeslot}</span>
                            </div>
                            
                            {/* 主教師 */}
                            <div 
                              className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeacherClick(classGroup, 'main');
                              }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full flex items-center justify-center shadow-md">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-orange-100">
                                {classGroup.teacher_main_name || '未設定'}
                              </span>
                            </div>
                            
                            {/* 助教 */}
                            <div 
                              className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeacherClick(classGroup, 'assist');
                              }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-cyan-100">
                                {classGroup.teacher_assist_name || '未設定'}
                              </span>
                            </div>
                            
                            {classGroup.room_id && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">教室: {classGroup.room_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 右側裝飾 */}
                      <div className="text-white text-right">
                        <div className="mb-2">
                          <UserGroupIcon className="w-10 h-10 text-white/90" />
                        </div>
                        <div className="text-sm text-white/70 font-medium">班級管理</div>
                        <div className="mt-2">
                          {expandedClasses.has(classGroup.id) ? (
                            <ChevronUpIcon className="w-6 h-6 text-white/70" />
                          ) : (
                            <ChevronDownIcon className="w-6 h-6 text-white/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 班級內學生卡片網格 */}
                  {expandedClasses.has(classGroup.id) && classGroup.students.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                      {classGroup.students.map((student, studentIndex) => {
                        const studentId = student.id;
                        const hasAttendance = student.hasAttendance;
                        const lessonData = student.lessonData;
                        const isTrial = lessonData && 'trial_status' in lessonData;
                        const remainingLessons = remainingLessonsMap[studentId] || 0;
                        
                        return (
                          <div 
                            key={`${studentId}-${studentIndex}`} 
                            className="group/card relative animate-fade-in-up"
                            style={{ animationDelay: `${(groupIndex * 100) + (studentIndex * 50)}ms` }}
                          >
                            <div className={`student-card rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden border-2 ${
                              getStudentBackgroundColor(remainingLessons, isTrial)
                            }`}>
                              {/* 背景裝飾 */}
                              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 rounded-full -translate-y-8 translate-x-8 group-hover/card:scale-150 transition-transform duration-500"></div>
                              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-hanami-secondary/10 to-hanami-primary/10 rounded-full translate-y-6 -translate-x-6 group-hover/card:scale-125 transition-transform duration-700"></div>
                              
                              {/* 學生頭像和資訊 */}
                              <div className="relative z-10 mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className="relative">
                                    <div className="avatar-glow w-14 h-14 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover/card:rotate-12 transition-transform duration-300">
                                      {student.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-green-500 animate-pulse"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate text-hanami-text">
                                      {student.full_name || '未知學生'}
                                    </h3>
                                    {student.nick_name && (
                                      <p className="font-medium text-sm truncate text-hanami-text-secondary">
                                        {student.nick_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 學生詳細資訊 */}
                              <div className="relative z-10 space-y-3 mb-4">
                                <div className="rounded-xl p-3 bg-hanami-primary/10">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <CakeIcon className="w-4 h-4 text-hanami-primary" />
                                      <span className="font-medium text-hanami-text">
                                        {convertAgeToYears(student.student_age)}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <MusicalNoteIcon className="w-4 h-4 text-hanami-primary" />
                                      <span className="font-medium text-hanami-text">
                                        {student.course_type || '未設定'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 操作按鈕 */}
                              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-hanami-border/30">
                                <button
                                  onClick={() => {
                                    const formatLocalDate = (date: Date) => {
                                      const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
                                      const year = hongKongTime.getFullYear();
                                      const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
                                      const day = String(hongKongTime.getDate()).padStart(2, '0');
                                      return `${year}-${month}-${day}`;
                                    };
                                    
                                    // 這裡可以添加學生活動分配功能
                                    toast('學生活動分配功能開發中...');
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
                  
                  {/* 收起狀態下的學生小圖卡 */}
                  {!expandedClasses.has(classGroup.id) && classGroup.students.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-wrap gap-3">
                        {classGroup.students.map((student, studentIndex) => {
                          const hasAttendance = student.hasAttendance;
                          const isTrial = student.lessonData && 'trial_status' in student.lessonData;
                          
                          return (
                            <div 
                              key={`mini-${student.id}-${studentIndex}`}
                              className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border-2 border-hanami-primary/30 hover:border-hanami-primary/50 transition-all duration-200 hover:shadow-md"
                            >
                              {/* 學生頭像 */}
                              <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                  {student.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white bg-gradient-to-br from-green-400 to-green-500"></div>
                              </div>
                              
                              {/* 學生資訊 */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate text-hanami-text">
                                  {student.full_name || '未知學生'}
                                </h4>
                                <p className="text-xs text-hanami-text-secondary">
                                  {convertAgeToYears(student.student_age)} 歲
                                </p>
                              </div>
                              
                              {/* 按鍵 */}
                              <button
                                onClick={() => {
                                  toast('學生活動分配功能開發中...');
                                }}
                                className="p-2 rounded-lg transition-all duration-200 hover:scale-105 bg-hanami-primary/10 text-hanami-primary hover:bg-hanami-primary/20"
                              >
                                <AcademicCapIcon className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 沒有學生的提示 */}
                  {classGroup.students.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                      <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">此班別今天沒有學生</p>
                      <p className="text-gray-500 text-sm mt-1">可能是公眾假期或特別安排</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        ) : (
          /* 按學生顯示 - 這裡可以添加原有的按學生顯示邏輯 */
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">按學生顯示功能</h3>
            <p className="text-gray-500">此功能正在開發中，請使用「按班別」模式</p>
          </div>
        )}

        {/* 老師選擇模態框 */}
        {showTeacherSelectionModal && selectedClassForTeacher && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-hanami-text">
                  選擇{selectedClassForTeacher.teacherRole === 'main' ? '主教' : '助教'}
                </h3>
                <button
                  onClick={() => {
                    setShowTeacherSelectionModal(false);
                    setSelectedClassForTeacher(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-hanami-primary/10 rounded-lg">
                <p className="text-sm text-hanami-text-secondary">
                  班別：{selectedClassForTeacher.classCode}
                </p>
                <p className="text-sm text-hanami-text-secondary">
                  目前{selectedClassForTeacher.teacherRole === 'main' ? '主教' : '助教'}：
                  {selectedClassForTeacher.teacherRole === 'main' 
                    ? selectedClassForTeacher.currentMainTeacher || '未設定'
                    : selectedClassForTeacher.currentAssistTeacher || '未設定'
                  }
                </p>
              </div>

              {loadingTeachers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary"></div>
                  <span className="ml-2 text-hanami-text-secondary">載入老師列表中...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* 設為空選項 */}
                  <button
                    onClick={() => updateClassTeacher(null, '未設定')}
                    className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">設為空</p>
                        <p className="text-sm text-gray-500">移除{selectedClassForTeacher.teacherRole === 'main' ? '主教' : '助教'}</p>
                      </div>
                    </div>
                  </button>

                  {/* 老師列表 */}
                  {allTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => updateClassTeacher(teacher.id, teacher.teacher_fullname || teacher.teacher_nickname)}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-hanami-primary hover:bg-hanami-primary/5 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-full flex items-center justify-center text-white font-bold">
                          {(teacher.teacher_fullname || teacher.teacher_nickname)?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-hanami-text">
                            {teacher.teacher_fullname || teacher.teacher_nickname}
                          </p>
                          {teacher.teacher_nickname && teacher.teacher_fullname && (
                            <p className="text-sm text-hanami-text-secondary">
                              {teacher.teacher_nickname}
                            </p>
                          )}
                          <p className="text-xs text-hanami-text-secondary">
                            {teacher.teacher_role || '老師'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {allTeachers.length === 0 && (
                    <div className="text-center py-8 text-hanami-text-secondary">
                      <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>暫無可用老師</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

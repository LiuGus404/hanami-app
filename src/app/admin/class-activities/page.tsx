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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import { HanamiCard, HanamiButton, LessonPlanModal, GrowthTreeDetailModal, StudentActivitiesPanel } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import SimpleAbilityAssessmentModal from '@/components/ui/SimpleAbilityAssessmentModal';

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

export default function ClassActivitiesPage() {
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
  
  // 新增：顯示模式狀態（按學生 vs 按班別）
  const [displayMode, setDisplayMode] = useState<'student' | 'class'>('student');
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set()); // 預設為空 Set，即所有班級都收起
  
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

  // 新增：學生關注狀態追蹤
  const [studentCareAlertStatus, setStudentCareAlertStatus] = useState<Record<string, boolean>>({});
  const [updatingCareAlert, setUpdatingCareAlert] = useState<Set<string>>(new Set());
  
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
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    // 使用香港時區格式化日期，避免時區問題
    const formatLocalDate = (date: Date) => {
      // 轉換為香港時區
      const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
      const year = hongKongTime.getFullYear();
      const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
      const day = String(hongKongTime.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`📅 getDayDates 格式化: ${date.toISOString()} → ${formattedDate}`);
      return formattedDate;
    };
    
    return {
      start: formatLocalDate(start),
      end: formatLocalDate(end)
    };
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
      
      // 查詢 hanami_schedule 表
      const { data: schedules, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('weekday', selectedWeekday)
        .order('timeslot', { ascending: true });
      
      if (scheduleError) {
        console.error('查詢班別資料失敗:', scheduleError);
        toast.error('查詢班別資料失敗');
        return;
      }
      
      console.log('查詢到的班別資料:', schedules);
      
        // 建立時段到班級的映射，用於判斷是否為該時段的第一個班級
        const timeslotToFirstClass = new Map<string, string>();
        (schedules || []).forEach((schedule: any) => {
          const timeslot = schedule.timeslot || '';
          if (!timeslotToFirstClass.has(timeslot)) {
            timeslotToFirstClass.set(timeslot, schedule.id);
          }
        });
      
        // 結合課程資料和學生資料
        const groupsWithStudents: ClassGroup[] = await Promise.all((schedules || []).map(async (schedule: any, scheduleIndex: number) => {
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
          
          // 獲取該班級的所有常規學生
          let assignedStudents: any[] = [];
          if (schedule.assigned_student_ids && schedule.assigned_student_ids.length > 0) {
            const { data: studentData, error: studentError } = await supabase
              .from('Hanami_Students')
              .select('*')
              .in('id', schedule.assigned_student_ids);

            if (!studentError && studentData) {
              assignedStudents = studentData || [];
            }
          }
        
          // 查詢試堂學生（只在該時段的第一個班級顯示）
          // 試堂學生沒有分配到 assigned_student_ids，所以我們查詢該時段的所有試堂學生
          const scheduleTimeslot = schedule.timeslot || '';
          const isFirstClassInTimeslot = timeslotToFirstClass.get(scheduleTimeslot) === schedule.id;
        
          let trialStudents: any[] = [];
          if (isFirstClassInTimeslot) {
            const trialLessonsForThisSlot = trialLessons.filter(lesson => 
              lesson.lesson_date === dateStr && 
              lesson.actual_timeslot === scheduleTimeslot
            );
            
            const trialStudentIds = trialLessonsForThisSlot.map(lesson => lesson.id);
            
            if (trialStudentIds.length > 0) {
              const { data: trialStudentsData, error: trialStudentsError } = await supabase
                .from('hanami_trial_students')
                .select('*')
                .in('id', trialStudentIds);
              
              if (!trialStudentsError && trialStudentsData) {
                trialStudents = trialStudentsData || [];
              }
            }
          }
        
          // 合併常規學生和試堂學生，去除重複（根據 ID 和名字）
          const allStudents: any[] = [];
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();
          
          // 先添加常規學生
          assignedStudents.forEach(student => {
            if (!seenIds.has(student.id) && !seenNames.has(student.full_name)) {
              allStudents.push(student);
              seenIds.add(student.id);
              seenNames.add(student.full_name);
            }
          });
          
          // 再添加試堂學生（避免重複）
          trialStudents.forEach(student => {
            if (!seenIds.has(student.id) && !seenNames.has(student.full_name)) {
              allStudents.push(student);
              seenIds.add(student.id);
              seenNames.add(student.full_name);
            }
          });

          // 為每個學生添加出席狀態標記和課程記錄
          const students = allStudents.map(student => {
            // 檢查該學生是否有出席記錄
            const hasAttendance = matchedLessons.some(lesson => {
              const lessonStudentId = 'student_id' in lesson ? lesson.student_id : student.id;
              return lessonStudentId === student.id;
            });
            
            // 獲取該學生的課程記錄
            const lessonData = matchedLessons.find(lesson => {
              const lessonStudentId = 'student_id' in lesson ? lesson.student_id : student.id;
              return lessonStudentId === student.id;
            });

            return {
              ...student,
              hasAttendance,
              lessonData
            };
          });
        
        return {
          id: schedule.id,
          course_code: schedule.course_code || '未設定',
          course_section: schedule.course_section || 'A',
          course_type: schedule.course_type || '未設定',
          weekday: schedule.weekday,
          timeslot: schedule.timeslot || '',
          max_students: schedule.max_students || 0,
          assigned_teachers: schedule.assigned_teachers || '未分配',
          assigned_student_ids: schedule.assigned_student_ids || [],
          room_id: schedule.room_id || '未設定',
          lessons: matchedLessons,
          students: students,
          teacher_main_name: teacherMainName,
          teacher_assist_name: teacherAssistName
        };
      }));
      
      setClassGroups(groupsWithStudents);
      console.log('處理後的班別資料:', groupsWithStudents);
      
    } catch (error) {
      console.error('載入班別資料失敗:', error);
      toast.error('載入班別資料失敗');
    }
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
      
      // 在loadClassData中定義格式化日期函數
      const formatLocalDateInLoad = (date: Date) => {
        // 轉換為香港時區
        const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
        const year = hongKongTime.getFullYear();
        const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
        const day = String(hongKongTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const cacheKey = `${formatLocalDateInLoad(startDate)}-${formatLocalDateInLoad(endDate)}`;
      
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
      const response = await fetch(`/api/class-activities?weekStart=${formatLocalDateInLoad(startDate)}&weekEnd=${formatLocalDateInLoad(endDate)}`);
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
      
      // 載入學生關注狀態
      try {
        const allStudents = [
          ...(result.data.lessons || []).map((lesson: any) => lesson.student_id),
          ...(result.data.trialLessons || []).map((lesson: any) => lesson.student_id)
        ];
        
        if (allStudents.length > 0) {
          const { data: studentsData, error: studentsError } = await supabase
            .from('Hanami_Students')
            .select('id, care_alert')
            .in('id', allStudents);
          
          if (!studentsError && studentsData) {
            const careAlertMap: Record<string, boolean> = {};
            studentsData.forEach((student: any) => {
              careAlertMap[student.id] = student.care_alert || false;
            });
            setStudentCareAlertStatus(careAlertMap);
          }
        }
      } catch (error) {
        console.error('載入學生關注狀態失敗:', error);
      }
      
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
    console.log('🔄 useEffect 觸發，載入課堂資料');
    console.log('📅 當前選中日期:', selectedDate.toISOString().split('T')[0]);
    console.log('📅 當前選中日期數組:', selectedDates.map(d => d.toISOString().split('T')[0]));
    console.log('🌏 確認今天日期:', getTodayInHongKong().toISOString().split('T')[0]);
    loadClassData();
  }, [selectedDate, selectedDates]);

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
        
        // 過濾出未完成的活動
        return allActivities.filter(activity => activity.completionStatus !== 'completed');
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
          loadStudentActivities(studentId);
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

  // 切換學生關注狀態
  const toggleCareAlert = async (studentId: string, currentStatus: boolean) => {
    try {
      setUpdatingCareAlert(prev => new Set(prev).add(studentId));
      
      const { error } = await supabase
        .from('Hanami_Students')
        .update({ care_alert: !currentStatus })
        .eq('id', studentId);

      if (error) throw error;

      // 更新本地狀態
      setStudentCareAlertStatus(prev => ({
        ...prev,
        [studentId]: !currentStatus
      }));

      toast.success(!currentStatus ? '已標記為需關注' : '已取消關注標記');
    } catch (error) {
      console.error('更新關注狀態失敗:', error);
      toast.error('更新關注狀態失敗');
    } finally {
      setUpdatingCareAlert(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
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

  // 處理時段卡片點擊 - 開啟教案編輯
  const handleTimeSlotClick = (date: string, timeSlot: string, courseType: string) => {
    setSelectedTimeSlot({
      date,
      timeSlot,
      courseType
    });
    setShowLessonPlanModal(true);
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
    // 使用香港時區格式化日期，避免時區問題
    const formatLocalDate = (date: Date) => {
      // 轉換為香港時區
      const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
      const year = hongKongTime.getFullYear();
      const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
      const day = String(hongKongTime.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`📅 getDayDates 格式化: ${date.toISOString()} → ${formattedDate}`);
      return formattedDate;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-hanami-text">課堂活動管理</h1>
          <div className="flex items-center space-x-4">
            {/* iOS 風格顯示模式切換開關 */}
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

        {/* 時段分組列表 - 根據顯示模式切換 */}
        <div className="space-y-8">
          {displayMode === 'student' ? (
            // 按學生顯示模式
            <>
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
                            <div className="absolute top-3 right-28 z-10">
                              <div className="trial-badge bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1 animate-pulse">
                                <SparklesIcon className="w-3 h-3" />
                                <span>試堂</span>
                              </div>
                            </div>
                          )}

                          {/* 右上角按鈕區域 */}
                          <div className="absolute top-3 right-3 z-50 flex flex-col space-y-2">
                            {/* 關注按鈕 */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                const currentCareAlert = studentCareAlertStatus[studentId] || false;
                                toggleCareAlert(studentId, currentCareAlert);
                              }}
                              className="group/care relative cursor-pointer"
                              disabled={updatingCareAlert.has('student_id' in lesson ? lesson.student_id : lesson.id)}
                            >
                              {/* 主按鈕 - 根據關注狀態改變顏色 */}
                              {(() => {
                                const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                const isCareAlert = studentCareAlertStatus[studentId] || false;
                                const isUpdating = updatingCareAlert.has(studentId);
                                
                                return (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform hover:rotate-12 ${
                                    isCareAlert 
                                      ? 'bg-gradient-to-br from-red-400 to-pink-500' // 需關注：紅色
                                      : 'bg-gradient-to-br from-gray-400 to-gray-500'  // 正常：灰色
                                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isUpdating ? (
                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                                    )}
                                  </div>
                                );
                              })()}
                              
                              {/* 狀態指示器 */}
                              {(() => {
                                const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                return studentCareAlertStatus[studentId] && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                  </div>
                                );
                              })()}
                              
                              {/* 懸停提示 */}
                              <div className="absolute top-12 right-0 opacity-0 group-hover/care:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  {(() => {
                                    const studentId = 'student_id' in lesson ? lesson.student_id : lesson.id;
                                    return studentCareAlertStatus[studentId] ? '取消關注' : '標記關注';
                                  })()}
                                </div>
                              </div>
                            </button>

                            {/* 能力評估按鈕 */}
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

                          {/* 剩餘堂數徽章 */}
                          {!isTrial && (
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
                                studentAssignedActivities.map((activity, activityIndex) => (
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
                                              // 如果已經在編輯模式，則退出編輯模式
                                              setEditingProgressActivityId(null);
                                              toast('已退出編輯模式');
                                            } else {
                                              // 進入編輯模式
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
                                              // 如果進度值大於1，可能是百分比形式，需要除以100
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
                                                
                                                console.log(`點擊進度條，準備更新活動 ${activity.id} 進度為 ${normalizedPercentage}%`);
                                                
                                                // 直接保存進度到資料庫，成功後會自動更新前端顯示
                                                saveProgressToDatabase(activity.id, normalizedPercentage);
                                              }}
                                            >
                                              <div 
                                                className="progress-bar-fill bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${(() => {
                                                  const progress = activity.progress || 0;
                                                  // 如果進度值大於1，可能是百分比形式，需要除以100
                                                  const normalizedProgress = progress > 1 ? progress / 100 : progress;
                                                  // 確保進度不超過100%
                                                  return Math.min(normalizedProgress * 100, 100);
                                                })()}%` }}
                                              ></div>
                                            </div>
                                            {/* 編輯模式指示器 - 顯示在進度條右端 */}
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
                                ))
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
              </div>
            ))
              )}
            </>
          ) : (
            // 按班別顯示模式
            <>
              {classGroups.length === 0 ? (
                <div className="bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-hanami-primary/20 shadow-lg">
                  <div className="animate-bounce mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-full mx-auto flex items-center justify-center">
                      <UserGroupIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="text-hanami-text text-xl font-medium">
                    今天沒有班別安排
                  </p>
                  <p className="text-hanami-text-secondary mt-2">請檢查課程表設定</p>
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
                        onClick={() => handleTeacherClick(classGroup, 'main')}
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
                        onClick={() => handleTeacherClick(classGroup, 'assist')}
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
                          const studentAssignedActivities = studentActivitiesMap.get(studentId) || [];
                          const isLoadingActivities = loadingStudentActivities.has(studentId);
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
                                
                                {/* 試堂徽章 */}
                                {isTrial && hasAttendance && (
                                  <div className="absolute top-3 right-28 z-10">
                                    <div className="trial-badge bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1 animate-pulse">
                                      <SparklesIcon className="w-3 h-3" />
                                      <span>試堂</span>
                                    </div>
                                  </div>
                                )}

                                {/* 右上角按鈕區域 */}
                                <div className="absolute top-3 right-3 z-50 flex flex-col space-y-2">
                                  {/* 關注按鈕 */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const currentCareAlert = studentCareAlertStatus[studentId] || false;
                                      toggleCareAlert(studentId, currentCareAlert);
                                    }}
                                    className="group/care relative cursor-pointer"
                                    disabled={updatingCareAlert.has(studentId)}
                                  >
                                    {/* 主按鈕 - 根據關注狀態改變顏色 */}
                                    {(() => {
                                      const isCareAlert = studentCareAlertStatus[studentId] || false;
                                      const isUpdating = updatingCareAlert.has(studentId);
                                      
                                      return (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform hover:rotate-12 ${
                                          isCareAlert 
                                            ? 'bg-gradient-to-br from-red-400 to-pink-500' // 需關注：紅色
                                            : 'bg-gradient-to-br from-gray-400 to-gray-500'  // 正常：灰色
                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                          {isUpdating ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                          ) : (
                                            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                                          )}
                                        </div>
                                      );
                                    })()}
                                    
                                    {/* 狀態指示器 */}
                                    {studentCareAlertStatus[studentId] && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                      </div>
                                    )}
                                    
                                    {/* 懸停提示 */}
                                    <div className="absolute top-12 right-0 opacity-0 group-hover/care:opacity-100 transition-opacity duration-200 pointer-events-none">
                                      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        {studentCareAlertStatus[studentId] ? '取消關注' : '標記關注'}
                                      </div>
                                    </div>
                                  </button>

                                  {/* 能力評估按鈕 */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const studentForAssessment = {
                                        id: studentId,
                                        full_name: student.full_name,
                                        nick_name: student.nick_name
                                      };
                                      openAbilityAssessmentModal(studentForAssessment);
                                    }}
                                    className="group/assessment relative cursor-pointer"
                                  >
                                    {(() => {
                                      const hasAssessment = studentAssessmentStatus[studentId] || false;
                                      
                                      return (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform hover:rotate-12 ${
                                          hasAssessment 
                                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                            : 'bg-gradient-to-br from-orange-400 to-amber-500'
                                        }`}>
                                          <AcademicCapIcon className="w-5 h-5 text-white" />
                                        </div>
                                      );
                                    })()}
                                    
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                    
                                    {(() => {
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

                                {/* 剩餘堂數徽章 */}
                                {!isTrial && (
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
                                      studentAssignedActivities.map((activity, activityIndex) => (
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
                                                      
                                                      console.log(`點擊進度條，準備更新活動 ${activity.id} 進度為 ${normalizedPercentage}%`);
                                                      
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
                                      ))
                                    )}
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
                                      
                                      setSelectedStudentForActivities({
                                        studentId: student.id,
                                        studentName: student.full_name || '未知學生',
                                        lessonDate: formatLocalDate(selectedDate),
                                        timeslot: classGroup.timeslot || ''
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
                                  {/* 試堂徽章 */}
                                  {isTrial && hasAttendance && (
                                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                      <SparklesIcon className="w-2 h-2 text-white" />
                                    </div>
                                  )}
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
                                    const formatLocalDate = (date: Date) => {
                                      const hongKongTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
                                      const year = hongKongTime.getFullYear();
                                      const month = String(hongKongTime.getMonth() + 1).padStart(2, '0');
                                      const day = String(hongKongTime.getDate()).padStart(2, '0');
                                      return `${year}-${month}-${day}`;
                                    };
                                    
                                    setSelectedStudentForActivities({
                                      studentId: student.id,
                                      studentName: student.full_name || '未知學生',
                                      lessonDate: formatLocalDate(selectedDate),
                                      timeslot: classGroup.timeslot || ''
                                    });
                                    setShowStudentActivitiesModal(true);
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
            onClose={() => {
              setShowAbilityAssessmentModal(false);
              setSelectedStudentForAssessment(null);
              setSelectedTreeForAssessment(null);
            }}
            onSubmit={async (assessment) => {
              console.log('能力評估提交:', assessment);
              
              try {
                // 準備 API 調用的資料格式
                const apiData = {
                  student_id: assessment.student_id,
                  tree_id: assessment.tree_id,
                  assessment_date: assessment.assessment_date,
                  lesson_date: assessment.lesson_date,
                  teacher_id: assessment.teacher_id,
                  ability_assessments: assessment.ability_assessments || {},
                  overall_performance_rating: assessment.overall_performance_rating || 3,
                  general_notes: assessment.general_notes || '',
                  next_lesson_focus: assessment.next_lesson_focus || '',
                  goals: assessment.goals || []
                };

                console.log('準備的 API 資料:', apiData);
                console.log('general_notes 提交值:', apiData.general_notes);
                console.log('general_notes 類型:', typeof apiData.general_notes);

                // 調用 API
                const response = await fetch('/api/student-ability-assessment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(apiData),
                });

                const result = await response.json();
                console.log('API 回應:', result);

                if (result.success) {
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
                } else {
                  console.error('API 調用失敗:', result.error);
                  toast.error('儲存失敗: ' + result.error);
                }
              } catch (error) {
                console.error('儲存評估失敗:', error);
                toast.error('儲存評估失敗: ' + (error as Error).message);
              }
            }}
          />
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




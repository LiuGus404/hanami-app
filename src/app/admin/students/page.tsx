'use client';

import { motion } from 'framer-motion';
import { BookOpen, CalendarClock, Star, LayoutGrid, List, ChevronLeft, ChevronRight, Settings2, Trash2, UserX, RotateCcw, BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users, MessageSquare, X, Plus } from 'lucide-react';
import { AcademicCapIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useSWR from 'swr';

import TeacherSchedulePanel from '@/components/admin/TeacherSchedulePanel';
import BackButton from '@/components/ui/BackButton';
import { Checkbox } from '@/components/ui/checkbox';
import { PopupSelect } from '@/components/ui/PopupSelect';
import StudentCard from '@/components/ui/StudentCard';
import AIMessageModal from '@/components/ui/AIMessageModal';
import StudentTypeSelector from '@/components/ui/StudentTypeSelector';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';
import { getUserSession } from '@/lib/authUtils';
import HanamiInput from '@/components/ui/HanamiInput';
import Calendarui from '@/components/ui/Calendarui';
import { usePageState } from '@/hooks/usePageState';
import { useOrganization } from '@/contexts/OrganizationContext';

type NavigationOverrides = Partial<{
  dashboard: string;
  growthTrees: string;
  learningPaths: string;
  abilities: string;
  activities: string;
  assessments: string;
  media: string;
  studentManagement: string;
  newRegularStudent: string;
  newTrialStudent: string;
  editStudent: (studentId: string) => string;
}>;

type StudentManagementPageProps = {
  navigationOverrides?: NavigationOverrides;
};

// 新增一個 hook：useStudentRemainingLessons
function useStudentRemainingLessons(studentId: string | undefined) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!studentId) {
      setCount(null);
      return;
    }
    let cancelled = false;
    async function fetchCount() {
      if (!studentId) return;
      const { count, error } = await supabase
        .from('hanami_student_lesson')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .gte('lesson_date', new Date().toISOString().slice(0, 10));
      if (!cancelled) setCount(error ? null : count ?? 0);
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [studentId]);
  return count;
}

const fetchStudentsWithLessons = async (body: any) => {
  const res = await fetch('/api/students-with-lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('API 請求失敗');
  return res.json();
};

export default function StudentManagementPage({
  navigationOverrides,
}: StudentManagementPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  const navigationPaths = useMemo(
    () => ({
      dashboard: '/admin/student-progress',
      growthTrees: '/admin/student-progress/growth-trees',
      learningPaths: '/admin/student-progress/learning-paths',
      abilities: '/admin/student-progress/abilities',
      activities: '/admin/student-progress/activities',
      assessments: '/admin/student-progress/ability-assessments',
      media: '/admin/student-progress/student-media',
      studentManagement: '/admin/students',
      newRegularStudent: '/admin/students/new?type=regular',
      newTrialStudent: '/admin/students/new?type=trial',
      ...(navigationOverrides ?? {}),
    }),
    [navigationOverrides],
  );

  const getEditStudentPath = useMemo(
    () =>
      navigationOverrides?.editStudent ??
      ((studentId: string) => `/admin/students/${studentId}`),
    [navigationOverrides],
  );

  // 使用 usePageState 管理頁面狀態
  const { state: pageState, updateState: updatePageState } = usePageState<{
    selectedCourses: string[];
    selectedWeekdays: string[];
    selectedLessonFilter: 'all' | 'gt2' | 'lte2' | 'lte1' | 'custom';
    customLessonCount: number | '';
    searchTerm: string;
    displayMode: 'grid' | 'list';
    pageSize: number;
    currentPage: number;
    selectedColumns: string[];
    sortField: string;
    sortDirection: 'asc' | 'desc';
  }>({
    selectedCourses: [],
    selectedWeekdays: [],
    selectedLessonFilter: 'all',
    customLessonCount: '',
    searchTerm: '',
    displayMode: 'list',
    pageSize: 20,
    currentPage: 1,
    selectedColumns: [
      'student_oid',
      'full_name',
      'student_age',
      'student_type',
      'course_type',
      'regular_weekday',
      'regular_timeslot',
      'remaining_lessons',
      'contact_number',
      'health_notes',
    ],
    sortField: '',
    sortDirection: 'asc',
  }, {
    key: 'studentManagement',
    persistTo: 'sessionStorage',
    debounceMs: 500
  });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [weekdayDropdownOpen, setWeekdayDropdownOpen] = useState(false);
  const [lessonDropdownOpen, setLessonDropdownOpen] = useState(false);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  // 從 pageState 中提取狀態
  const {
    selectedCourses,
    selectedWeekdays,
    selectedLessonFilter,
    customLessonCount,
    searchTerm,
    displayMode,
    pageSize,
    currentPage,
    selectedColumns,
    sortField,
    sortDirection
  } = pageState;

  // 更新狀態的函數
  const handleSelectedCoursesChange = useCallback((courses: string[]) => {
    updatePageState({ selectedCourses: courses });
    setApiFilter(prev => ({
      ...prev,
      selectedCourses: courses
    }));
  }, [updatePageState]);
  
  const handleSelectedWeekdaysChange = useCallback((weekdays: string[]) => {
    updatePageState({ selectedWeekdays: weekdays });
    setApiFilter(prev => ({
      ...prev,
      selectedWeekdays: weekdays
    }));
  }, [updatePageState]);
  
  const handleSelectedDatesChange = useCallback((dates: Date[]) => {
    setSelectedDates(dates);
    setApiFilter(prev => ({
      ...prev,
      selectedDates: dates.map(d => d.toLocaleDateString('sv-SE'))
    }));
  }, []);
  
  const handleSearchTermChange = useCallback((term: string) => {
    updatePageState({ searchTerm: term });
    setApiFilter(prev => ({
      ...prev,
      searchTerm: term
    }));
  }, [updatePageState]);

  const handleDisplayModeChange = useCallback((mode: 'grid' | 'list') => {
    updatePageState({ displayMode: mode });
  }, [updatePageState]);

  const handlePageSizeChange = useCallback((size: number) => {
    updatePageState({ pageSize: size, currentPage: 1 });
  }, [updatePageState]);

  const handleCurrentPageChange = useCallback((page: number) => {
    updatePageState({ currentPage: page });
  }, [updatePageState]);

  const handleSelectedColumnsChange = useCallback((columns: string[]) => {
    // 確保基本欄位始終被選中
    const newSelected = columns;
    if (!newSelected.includes('student_oid')) newSelected.push('student_oid');
    if (!newSelected.includes('full_name')) newSelected.push('full_name');
    if (!newSelected.includes('student_age')) newSelected.push('student_age');
    updatePageState({ selectedColumns: newSelected });
  }, [updatePageState]);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // 如果點擊的是同一個欄位，切換排序方向
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      updatePageState({ sortDirection: newDirection });
    } else {
      // 如果點擊的是新欄位，設置為升序
      updatePageState({ sortField: field, sortDirection: 'asc' });
    }
  }, [sortField, sortDirection, updatePageState]);

  // 處理導航到學生詳細資料
  const handleNavigateToStudent = useCallback((studentId: string) => {
    router.push(getEditStudentPath(studentId));
  }, [router, getEditStudentPath]);

  const { user, loading: userLoading } = useUser();
  const { id } = useParams();
  const { currentOrganization } = useOrganization();
  const effectiveOrgId = useMemo(
    () => currentOrganization?.id || user?.organization?.id || null,
    [currentOrganization?.id, user?.organization?.id]
  );

  // 添加防抖機制
  const dataFetchedRef = useRef(false);
  const loadingRef = useRef(false);

  // 基本欄位（強制顯示，但不在選單中）
  // { label: '學生編號', value: 'student_oid' },
  // { label: '姓名', value: 'full_name' },
  // { label: '年齡', value: 'student_age' },
  const columnOptions = [
    { label: '性別', value: 'gender' },
    { label: '生日', value: 'student_dob' },
    { label: '類型', value: 'student_type' },
    { label: '課程', value: 'course_type' },
    { label: '學校', value: 'school' },
    { label: '地址', value: 'address' },
    { label: '負責老師', value: 'student_teacher' },
    { label: '偏好', value: 'student_preference' },
    { label: '星期', value: 'regular_weekday' },
    { label: '上課時間', value: 'regular_timeslot' },
    { label: '剩餘堂數', value: 'remaining_lessons' },
    { label: '入學日期', value: 'started_date' },
    { label: '報讀時長', value: 'duration_months' },
    { label: '聯絡電話', value: 'contact_number' },
    { label: '家長 Email', value: 'parent_email' },
    { label: '健康備註', value: 'health_notes' },
    { label: '試堂日期', value: 'lesson_date' },
    { label: '試堂時間', value: 'actual_timeslot' },
    { label: '停用日期', value: 'inactive_date' },
  ];

  const [remainingLessonsMap, setRemainingLessonsMap] = useState<Record<string, number>>({});
  const [remainingLoading, setRemainingLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(''); // 用於輸入框
  const searchQuery = searchTerm; // 使用 pageState 中的 searchTerm

  // AI 訊息相關狀態
  const [showAIMessageModal, setShowAIMessageModal] = useState(false);
  const [selectedStudentsForAI, setSelectedStudentsForAI] = useState<any[]>([]);

  // 新增學生類型選擇器狀態
  const [showStudentTypeSelector, setShowStudentTypeSelector] = useState(false);

  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]); // 支援多選

  // 新增：用於API查詢的狀態
  type ApiFilter = {
    selectedDates: string[];
    selectedCourses: string[];
    selectedWeekdays: string[];
    searchTerm: string;
    orgId: string | null;
  };

  const [apiFilter, setApiFilter] = useState<ApiFilter>({
    selectedDates: [],
    selectedCourses: selectedCourses,
    selectedWeekdays: selectedWeekdays,
    searchTerm: searchTerm,
    orgId: effectiveOrgId,
  });

  // 當用戶變化時重置防抖狀態
  useEffect(() => {
    if (user) {
      dataFetchedRef.current = false;
      loadingRef.current = false;
    }
  }, [user]);

  // 同步 pageState 到 apiFilter
  useEffect(() => {
    setApiFilter(prev => ({
      ...prev,
      selectedCourses: selectedCourses,
      selectedWeekdays: selectedWeekdays,
      searchTerm: searchTerm,
    }));
  }, [selectedCourses, selectedWeekdays, searchTerm]);

  useEffect(() => {
    setApiFilter(prev => {
      if (prev.orgId === effectiveOrgId) return prev;
      return {
        ...prev,
        orgId: effectiveOrgId,
      };
    });
  }, [effectiveOrgId]);

  // 使用 SWR 進行資料獲取
  const shouldFetch = Boolean(effectiveOrgId);
  const { data: apiData, error: apiError, isValidating } = useSWR(
    shouldFetch ? ['students-with-lessons', JSON.stringify(apiFilter)] : null,
    () => fetchStudentsWithLessons(apiFilter),
    { revalidateOnFocus: false }
  );

  // 取回的學生資料
  const students = useMemo(() => apiData?.students || [], [apiData?.students]);
  const isLoading = shouldFetch ? !apiData : true; // 只有在沒有資料時才認為是載入中

  // 檢查用戶權限
  useEffect(() => {
    if (userLoading || !user) return;
    
    if (!['admin', 'manager'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, userLoading, router]);



  // 計算剩餘堂數 - 不受篩選條件影響，直接查詢所有常規學生
  useEffect(() => {
    console.log('剩餘堂數計算 useEffect 觸發:', { isLoading, studentsLength: students.length });
    
    if (isLoading || students.length === 0) {
      console.log('跳過剩餘堂數計算:', { isLoading, studentsLength: students.length });
      setRemainingLessonsMap({});
      setRemainingLoading(false);
      return;
    }

    const calculateRemainingLessons = async () => {
      setRemainingLoading(true);
      
      try {
        // 從已載入的學生資料中提取常規學生ID，確保資料一致性
        const regularStudentIds = students
          .filter((s: any) => s.student_type === '常規' && !s.is_inactive)
          .map((s: any) => s.id);
        
        console.log(`總學生數: ${students.length}, 常規學生數: ${regularStudentIds.length}`);
        console.log('常規學生ID:', regularStudentIds);
        
        if (regularStudentIds.length === 0) {
          setRemainingLessonsMap({});
          setRemainingLoading(false);
          return;
        }
        
        // 使用統一的 calculateRemainingLessonsBatch 函數計算所有常規學生的剩餘堂數
        const remainingMap = await calculateRemainingLessonsBatch(
          regularStudentIds, 
          new Date()
        );
        
        console.log('計算剩餘堂數結果:', remainingMap);
        setRemainingLessonsMap(remainingMap);
      } catch (error) {
        console.error('計算剩餘堂數時發生錯誤:', error);
        setRemainingLessonsMap({});
      } finally {
        setRemainingLoading(false);
      }
    };

    // 延遲計算，避免頻繁更新
    const timer = setTimeout(calculateRemainingLessons, 200);
    
    return () => clearTimeout(timer);
  }, [isLoading, students.length]); // 依賴 isLoading 和 students.length

  // 刪除學生功能（改為停用功能）
  const handleDeleteStudents = async () => {
    if (!selectedStudents.length) return;
    
    if (!confirm(`確定要停用選中的 ${selectedStudents.length} 位學生嗎？學生將被標記為已停用。`)) {
      return;
    }

    setActionLoading(true);
    try {
      // 獲取選中學生的完整資料
      const selectedStudentData = students.filter((s: any) => selectedStudents.includes(s.id));
      console.log('選中要停用的學生資料:', selectedStudentData);
      
      // 分離常規學生和試堂學生
      const regularStudents = selectedStudentData.filter((s: any) => s.student_type !== '試堂');
      const trialStudents = selectedStudentData.filter((s: any) => s.student_type === '試堂');
      
      console.log('常規學生:', regularStudents);
      console.log('試堂學生:', trialStudents);

      // 處理常規學生
      if (regularStudents.length > 0) {
        const regularIds = regularStudents.map((s: any) => s.id);
        console.log('要停用的常規學生ID:', regularIds);
        
        // 使用 API 端點更新學生類型為已停用
        console.log('使用 API 端點更新學生類型為已停用');
        
        if (!effectiveOrgId) {
          alert('缺少機構ID，無法停用學生');
          return;
        }
        
        const session = getUserSession();
        const userEmail = session?.email || null;
        
        try {
          const response = await fetch('/api/students/batch-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              studentIds: regularIds,
              updates: { student_type: '已停用' },
              orgId: effectiveOrgId,
              userEmail: userEmail,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API 返回錯誤: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('成功停用常規學生:', result);
        } catch (apiError: any) {
          console.error('API 調用失敗，嘗試使用直接查詢:', apiError);
          // Fallback 到直接查詢（可能也會失敗）
          const { error: updateError } = await supabase
            .from('Hanami_Students')
            .update({ 
              student_type: '已停用'
            })
            .in('id', regularIds);
          
          if (updateError) {
            console.error('更新學生類型失敗:', updateError);
            alert(`停用常規學生失敗: ${updateError.message}`);
            return;
          }
        }
        
        console.log('成功停用常規學生');
      }

      // 處理試堂學生
      if (trialStudents.length > 0) {
        const trialIds = trialStudents.map((s: any) => s.id);
        console.log('要停用的試堂學生ID:', trialIds);
        
        // 更新試堂學生的狀態為 'inactive'
        const { error: trialError } = await supabase
          .from('hanami_trial_students')
          .update({ 
            trial_status: 'inactive'
          })
          .in('id', trialIds);
        
        if (trialError) {
          console.error('Error updating trial students:', trialError);
          alert(`停用試堂學生時發生錯誤: ${trialError.message}`);
          return;
        }
        
        console.log('成功停用試堂學生');
      }

      // 更新本地狀態
      setSelectedStudents([]);
      alert(`成功停用 ${selectedStudents.length} 位學生`);
      
      // 刷新頁面
      window.location.reload();
    } catch (error) {
      console.error('Error updating students:', error);
      alert(`停用學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 停用學生功能
  const handleInactiveStudents = async () => {
    if (!selectedStudents.length) return;
    
    if (!confirm(`確定要停用選中的 ${selectedStudents.length} 位學生嗎？`)) {
      return;
    }

    setActionLoading(true);
    try {
      // 獲取選中學生的完整資料
      const selectedStudentData = students.filter((s: any) => selectedStudents.includes(s.id));
      
      // 分離常規學生和試堂學生
      const regularStudents = selectedStudentData.filter((s: any) => s.student_type !== '試堂');
      const trialStudents = selectedStudentData.filter((s: any) => s.student_type === '試堂');

      // 如果有試堂學生，提示用戶試堂學生只能刪除不能停用
      if (trialStudents.length > 0) {
        alert('試堂學生只能刪除不能停用。請先取消選擇試堂學生，或使用刪除功能。');
        setActionLoading(false);
        return;
      }

      // 將學生資料插入 inactive_student_list 表
      const inactiveStudentsData = regularStudents.map((s: any) => ({
        original_id: s.id,
        student_type: 'regular',
        full_name: s.full_name,
        student_age: s.student_age,
        student_preference: s.student_preference,
        course_type: s.course_type,
        remaining_lessons: s.remaining_lessons,
        // 修正 regular_weekday 型別
        regular_weekday: Array.isArray(s.regular_weekday)
          ? Number(s.regular_weekday[0])
          : (s.regular_weekday !== undefined && s.regular_weekday !== null)
            ? Number(s.regular_weekday)
            : null,
        gender: s.gender,
        student_oid: s.student_oid,
        contact_number: s.contact_number,
        regular_timeslot: s.regular_timeslot, // 保留在inactive_student_list中
        health_notes: s.health_notes,
        student_dob: s.student_dob,
        parent_email: s.parent_email,
        address: s.address,
        school: s.school,
        started_date: s.started_date,
        duration_months: s.duration_months,
        access_role: s.access_role,
        student_email: s.student_email,
        student_password: s.student_password,
        ongoing_lessons: s.ongoing_lessons,
        upcoming_lessons: s.upcoming_lessons,
        student_teacher: s.student_teacher,
        nick_name: s.nick_name,
        student_remarks: s.student_remarks,
        inactive_date: new Date().toISOString(),
        inactive_reason: '管理員停用',
      }));

      // 插入 inactive_student_list 表
      const { error: insertError } = await supabase
        .from('inactive_student_list')
        .insert(inactiveStudentsData);

      if (insertError) {
        console.error('Error inserting inactive students:', insertError);
        alert('停用學生時發生錯誤');
        return;
      }

      // 刪除原表中的學生資料
      if (regularStudents.length > 0) {
        const regularIds = regularStudents.map((s: any) => s.id);
        
        // 處理常規學生的外鍵依賴
        console.log('處理常規學生外鍵依賴...');
        
        // 1. 刪除相關的課堂記錄 (hanami_student_lesson)
        const { error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .delete()
          .in('student_id', regularIds);
        
        if (lessonError) {
          console.error('Error deleting lesson records:', lessonError);
          alert(`刪除課堂記錄時發生錯誤: ${lessonError.message}`);
          return;
        }

        // 2. 進度記錄存在於 hanami_student_lesson 表的 progress_notes 欄位中，會隨課程記錄一起刪除
        // const { error: progressError } = await supabase
        //   .from('hanami_student_progress')
        //   .delete()
        //   .in('student_id', regularIds)
        
        // if (progressError) {
        //   console.error('Error deleting progress records:', progressError)
        //   alert(`刪除進度記錄時發生錯誤: ${progressError.message}`)
        //   return
        // }

        // 3. 刪除相關的課程包 (Hanami_Student_Package)
        const { error: packageError } = await supabase
          .from('Hanami_Student_Package')
          .delete()
          .in('student_id', regularIds);
        
        if (packageError) {
          console.error('Error deleting package records:', packageError);
          alert(`刪除課程包時發生錯誤: ${packageError.message}`);
          return;
        }

        // 4. 刪除試堂隊列記錄 (hanami_trial_queue)
        // const { error: queueError } = await supabase
        //   .from('hanami_trial_queue')
        //   .delete()
        //   .in('student_id', regularIds)
        // if (queueError) {
        //   console.error('Error deleting trial queue records:', queueError)
        //   // 不中斷流程，因為這可能不是必需的
        // }
        // 註：hanami_trial_queue 表不存在，略過刪除

        // 5. 最後刪除學生記錄（使用 API 端點）
        if (!effectiveOrgId) {
          alert('缺少機構ID，無法刪除學生');
          return;
        }
        
        const session = getUserSession();
        const userEmail = session?.email || null;
        
        try {
          const response = await fetch('/api/students/batch-delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              studentIds: regularIds,
              orgId: effectiveOrgId,
              userEmail: userEmail,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API 返回錯誤: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('成功刪除常規學生:', result);
        } catch (apiError: any) {
          console.error('API 調用失敗，嘗試使用直接查詢:', apiError);
          // Fallback 到直接查詢（可能也會失敗）
          const { error: regularError } = await supabase
            .from('Hanami_Students')
            .delete()
            .in('id', regularIds);
          
          if (regularError) {
            console.error('Error deleting regular students:', regularError);
            alert(`刪除常規學生時發生錯誤: ${regularError.message}`);
            return;
          }
        }
      }

      // 更新本地狀態
      setSelectedStudents([]);
      alert(`成功停用 ${regularStudents.length} 位常規學生`);
      
      // 刷新頁面
      window.location.reload();
      
      // 重新獲取停用學生數據
      const { data: inactiveStudentData } = await supabase
        .from('inactive_student_list')
        .select('*');
      
      if (inactiveStudentData) {
        const updatedInactiveStudents = inactiveStudentData.map((inactive) => ({
          id: inactive.id,
          original_id: inactive.original_id,
          full_name: inactive.full_name,
          student_age: inactive.student_age,
          student_preference: inactive.student_preference,
          course_type: inactive.course_type,
          remaining_lessons: inactive.remaining_lessons,
          regular_weekday: inactive.regular_weekday,
          gender: inactive.gender,
          student_type: inactive.student_type === 'regular' ? '常規' : '試堂',
          lesson_date: inactive.lesson_date,
          actual_timeslot: inactive.actual_timeslot,
          student_oid: inactive.student_oid,
          contact_number: inactive.contact_number,
          regular_timeslot: inactive.regular_timeslot,
          health_notes: inactive.health_notes,
          inactive_date: inactive.inactive_date,
          inactive_reason: inactive.inactive_reason,
          is_inactive: true,
        }));
        // setInactiveStudents(updatedInactiveStudents); // 移除，統一使用 API 查詢
      }
    } catch (error) {
      console.error('Error inactivating students:', error);
      alert('停用學生時發生錯誤');
    } finally {
      setActionLoading(false);
    }
  };

  // 回復學生功能
  const handleRestoreStudents = async () => {
    if (!selectedStudents.length) return;
    
    if (!confirm(`確定要回復選中的 ${selectedStudents.length} 位學生嗎？`)) {
      return;
    }

    setActionLoading(true);
    try {
      // 獲取選中停用學生的完整資料 - 從 API 查詢的資料中獲取
      const selectedInactiveData = students.filter((s: any) => selectedStudents.includes(s.id) && s.is_inactive);
      
      // 分離常規學生和試堂學生
      const regularStudents = selectedInactiveData.filter((s: any) => s.student_type === '常規');
      const trialStudents = selectedInactiveData.filter((s: any) => s.student_type === '試堂');

      // 將學生資料移回原表
      if (regularStudents.length > 0) {
        const regularData = regularStudents.map((s: any) => ({
          id: s.original_id,
          full_name: s.full_name,
          student_age: s.student_age,
          student_preference: s.student_preference,
          course_type: s.course_type,
          remaining_lessons: s.remaining_lessons,
          // 修正 regular_weekday 型別
          regular_weekday: (Array.isArray(s.regular_weekday)
            ? Number(s.regular_weekday[0])
            : (s.regular_weekday !== undefined && s.regular_weekday !== null)
              ? Number(s.regular_weekday)
              : null),
          gender: s.gender,
          student_oid: s.student_oid,
          contact_number: s.contact_number,
          regular_timeslot: s.regular_timeslot, // 從inactive_student_list恢復
          health_notes: s.health_notes,
          student_dob: s.student_dob,
          parent_email: s.parent_email,
          address: s.address,
          school: s.school,
          started_date: s.started_date,
          duration_months: s.duration_months,
          access_role: s.access_role,
          student_email: s.student_email,
          student_password: s.student_password,
          ongoing_lessons: s.ongoing_lessons,
          upcoming_lessons: s.upcoming_lessons,
          student_teacher: s.student_teacher,
          nick_name: s.nick_name,
          student_remarks: s.student_remarks,
        }));

        // 使用 API 端點 upsert 學生（使用服務角色 key 繞過 RLS）
        if (!effectiveOrgId) {
          alert('缺少機構ID，無法回復學生');
          return;
        }
        
        const session = getUserSession();
        const userEmail = session?.email || null;
        
        try {
          const response = await fetch('/api/students/batch-upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              students: regularData,
              orgId: effectiveOrgId,
              userEmail: userEmail,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API 返回錯誤: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('成功回復常規學生:', result);
        } catch (apiError: any) {
          console.error('API 調用失敗，嘗試使用直接查詢:', apiError);
          // Fallback 到直接查詢（可能也會失敗）
          const { error: regularError } = await supabase
            .from('Hanami_Students')
            .upsert(regularData, { 
              onConflict: 'id',
              ignoreDuplicates: false, 
            });
          
          if (regularError) {
            console.error('Error restoring regular students:', regularError);
            alert(`回復常規學生時發生錯誤: ${regularError.message}`);
            return;
          }
        }
      }

      if (trialStudents.length > 0) {
        const trialData = trialStudents.map((s: any) => ({
          id: s.original_id,
          full_name: s.full_name,
          student_age: s.student_age,
          student_preference: s.student_preference,
          course_type: s.course_type,
          remaining_lessons: s.remaining_lessons,
          regular_weekday: s.regular_weekday,
          gender: s.gender,
          student_oid: s.student_oid,
          contact_number: s.contact_number,
          regular_timeslot: s.regular_timeslot,
          health_notes: s.health_notes,
          lesson_date: s.lesson_date,
          actual_timeslot: s.actual_timeslot,
          student_dob: s.student_dob,
          parent_email: s.parent_email,
          address: s.address,
          school: s.school,
          started_date: s.started_date,
          duration_months: s.duration_months,
          access_role: s.access_role,
          student_email: s.student_email,
          student_password: s.student_password,
          ongoing_lessons: s.ongoing_lessons,
          upcoming_lessons: s.upcoming_lessons,
          student_teacher: s.student_teacher,
          nick_name: s.nick_name,
          student_remarks: s.student_remarks,
        }));

        // 使用 upsert 而不是 insert
        const { error: trialError } = await supabase
          .from('hanami_trial_students')
          .upsert(trialData, { 
            onConflict: 'id',
            ignoreDuplicates: false, 
          });
        
        if (trialError) {
          console.error('Error restoring trial students:', trialError);
          alert(`回復試堂學生時發生錯誤: ${trialError.message}`);
          return;
        }
      }

      // 從 inactive_student_list 表中刪除
      // 使用停用學生列表中的 ID（不是原始學生表的 ID）
      const inactiveIdsToDelete = selectedInactiveData.map((s: any) => s.id);
      const { error: deleteError } = await supabase
        .from('inactive_student_list')
        .delete()
        .in('id', inactiveIdsToDelete);

      if (deleteError) {
        console.error('Error deleting from inactive list:', deleteError);
        alert(`從停用列表刪除時發生錯誤: ${deleteError.message}`);
        return;
      }

      // 更新本地狀態
      setSelectedStudents([]);
      alert(`成功回復 ${selectedStudents.length} 位學生`);
      
      // 刷新頁面
      window.location.reload();
      
      // 重新獲取學生數據
      const { data: studentData } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_age, student_preference, course_type, regular_weekday, gender, student_type, student_oid, contact_number, regular_timeslot, health_notes');

      const { data: trialStudentData } = await supabase
        .from('hanami_trial_students')
        .select('*');

      if (studentData) {
        const regularStudents = studentData || [];
        
        // 計算常規學生的剩餘堂數
        const regularStudentIds = regularStudents.map(student => student.id);
        const remainingLessonsMap = await calculateRemainingLessonsBatch(regularStudentIds, new Date());
        
        // 為常規學生添加剩餘堂數
        const regularStudentsWithRemaining = regularStudents.map(student => ({
          ...student,
          remaining_lessons: remainingLessonsMap[student.id] || 0,
        }));
        
        const trialStudents = (trialStudentData || []).map((trial) => {
          let student_age = 0;
          if (trial.student_dob) {
            const dob = new Date(trial.student_dob);
            const now = new Date();
            let years = now.getFullYear() - dob.getFullYear();
            let months = now.getMonth() - dob.getMonth();
            if (months < 0) {
              years -= 1;
              months += 12;
            }
            student_age = years * 12 + months;
          }

          let weekday = null;
          if (trial.lesson_date) {
            const trialDate = new Date(trial.lesson_date);
            // 不需要加8小時，直接使用本地時間
            weekday = trialDate.getDay().toString();
          }

          return {
            id: trial.id,
            full_name: trial.full_name,
            student_age,
            student_preference: trial.student_preference || null,
            course_type: trial.course_type || null,
            remaining_lessons: null, // 試堂學生沒有剩餘堂數概念，設為 null
            regular_weekday: weekday !== null ? [weekday] : [],
            weekday,
            gender: trial.gender || null,
            student_type: '試堂',
            lesson_date: trial.lesson_date,
            actual_timeslot: trial.actual_timeslot,
            student_oid: trial.student_oid || null,
            contact_number: trial.contact_number || null,
            regular_timeslot: trial.regular_timeslot || null,
            health_notes: trial.health_notes || null,
            // 添加試堂學生特有的欄位
            school: trial.school || null,
            address: trial.address || null,
            student_teacher: trial.student_teacher || null,
            parent_email: trial.parent_email || null,
            student_dob: trial.student_dob || null,
            started_date: trial.lesson_date || null, // 試堂學生的入學日期就是試堂日期
            duration_months: trial.duration_months || null,
          };
        });

        const allStudents = [...regularStudentsWithRemaining, ...trialStudents];
        // setInactiveStudents(allStudents); // 移除，統一使用 API 查詢
      }
    } catch (error) {
      console.error('Error restoring students:', error);
      alert(`回復學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 刪除停用學生功能
  const handleDeleteInactiveStudents = async () => {
    if (!selectedStudents.length) return;
    
    if (!confirm(`確定要永久刪除選中的 ${selectedStudents.length} 位停用學生嗎？此操作無法復原。`)) {
      return;
    }

    setActionLoading(true);
    try {
      // 獲取選中停用學生的完整資料 - 從 API 查詢的資料中獲取
      const selectedInactiveStudentData = students.filter((s: any) => selectedStudents.includes(s.id) && s.is_inactive);
      console.log('選中要刪除的停用學生資料:', selectedInactiveStudentData);
      
      // 分離常規學生和試堂學生
      const regularInactiveStudents = selectedInactiveStudentData.filter((s: any) => s.student_type === '常規');
      const trialInactiveStudents = selectedInactiveStudentData.filter((s: any) => s.student_type === '試堂');
      
      console.log('停用常規學生:', regularInactiveStudents);
      console.log('停用試堂學生:', trialInactiveStudents);

      // 只處理常規學生，跳過試堂學生以避免錯誤
      if (regularInactiveStudents.length > 0) {
        const originalIds = regularInactiveStudents.map((s: any) => s.original_id).filter((id: any) => id);
        console.log('要檢查的原始學生ID:', originalIds);
        
        if (originalIds.length > 0) {
          // 檢查原始學生記錄是否還存在
          const { data: existingStudents } = await supabase
            .from('Hanami_Students')
            .select('id')
            .in('id', originalIds);
          
          if (existingStudents && existingStudents.length > 0) {
            const existingIds = existingStudents.map(s => s.id);
            console.log('存在的原始學生ID:', existingIds);
            
            // 使用新的 API 端點強制停用學生
            console.log('使用新的 API 端點強制停用學生，ID:', existingIds);
            
            try {
              // 調用強制停用學生的 API
              const response = await fetch('/api/force-disable-student', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  studentIds: existingIds,
                  action: 'disable'
                }),
              });

              const result = await response.json();
              
              if (!response.ok) {
                console.error('API 調用失敗:', result);
                alert(`強制停用學生失敗: ${result.error || '未知錯誤'}`);
                return;
              }

              if (result.success) {
                console.log('成功停用學生:', result.message);
              } else {
                console.error('停用學生失敗:', result.error);
                alert(`停用學生失敗: ${result.error}`);
                return;
              }
            } catch (error) {
              console.error('調用強制停用 API 時發生錯誤:', error);
              alert(`調用強制停用 API 時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
              return;
            }
          }
        }
      }

      // 處理試堂學生的停用
      if (trialInactiveStudents.length > 0) {
        console.log('處理試堂學生停用，數量:', trialInactiveStudents.length);
        
        const trialIds = trialInactiveStudents.map((s: any) => s.original_id).filter((id: any) => id);
        console.log('要停用的試堂學生ID:', trialIds);
        
        if (trialIds.length > 0) {
          try {
            // 更新試堂學生的狀態為 'inactive'
            const { error: trialUpdateError } = await supabase
              .from('hanami_trial_students')
              .update({ 
                trial_status: 'inactive'
              })
              .in('id', trialIds);
            
            if (trialUpdateError) {
              console.error('停用試堂學生失敗:', trialUpdateError);
              console.log('試堂學生停用失敗，但繼續執行:', trialUpdateError.message);
            } else {
              console.log('成功停用試堂學生');
            }
          } catch (error) {
            console.log('停用試堂學生時發生錯誤，但繼續執行:', error);
          }
        }
      }

      // 最後刪除停用學生記錄
      const inactiveIds = selectedInactiveStudentData.map((s: any) => s.id);
      console.log('要刪除的停用學生記錄ID:', inactiveIds);
      
      const { error: inactiveError } = await supabase
        .from('inactive_student_list')
        .delete()
        .in('id', inactiveIds);
      
      if (inactiveError) {
        console.error('Error deleting inactive students:', inactiveError);
        alert(`刪除停用學生記錄時發生錯誤: ${inactiveError.message}`);
        return;
      }

      // 更新本地狀態
      setSelectedStudents([]);
      alert(`成功永久刪除 ${selectedStudents.length} 位停用學生`);
      
      // 刷新頁面
      window.location.reload();
    } catch (error) {
      console.error('Error deleting inactive students:', error);
      alert(`刪除停用學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 根據篩選條件決定顯示哪些學生
  const isShowingInactiveStudents = selectedCourses && selectedCourses.length > 0 && selectedCourses.includes('停用學生');

  // 計算顯示學生數（不包括停用學生）
  const activeStudentsCount = students.filter((s: any) => !s.is_inactive).length;

  const filteredStudents = useMemo(() => {
    try {
      // 統一使用 API 查詢的資料，API 已經包含了停用學生
      const baseStudents = students || [];
      
      // 先合成一份帶最新 remaining_lessons 的 students
      const studentsWithLatestLessons = (baseStudents || []).map((s: any) => {
        if (s.student_type !== '試堂' && !s.is_inactive && s.id && remainingLessonsMap[s.id] !== undefined) {
          const updatedStudent = { ...s, remaining_lessons: remainingLessonsMap[s.id] };
          console.log(`學生 ${s.full_name} (ID: ${s.id}) 的剩餘堂數: ${remainingLessonsMap[s.id]}`);
          return updatedStudent;
        }
        return s;
      });

      let result = studentsWithLatestLessons;

      // 1. 搜尋篩選
      if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
        result = result.filter((s: any) => {
          if (!s) return false;
          try {
            return (
              (s.full_name && typeof s.full_name === 'string' && s.full_name.toLowerCase().includes(q)) ||
              (s.contact_number && typeof s.contact_number === 'string' && s.contact_number.toLowerCase().includes(q)) ||
              (s.student_oid && typeof s.student_oid === 'string' && s.student_oid.toLowerCase().includes(q))
            );
          } catch (error) {
            console.error('搜尋篩選錯誤:', error);
            return false;
          }
        });
      }

      // 2. 課程篩選
      if (selectedCourses && selectedCourses.length > 0) {
        result = result.filter((s: any) => {
          if (!s) return false;
          try {
            // 處理特殊課程類型
            if (selectedCourses.includes('常規') && s.student_type !== '試堂' && !s.is_inactive) {
              return true;
            }
            if (selectedCourses.includes('試堂') && s.student_type === '試堂') {
              return true;
            }
            if (selectedCourses.includes('停用學生') && s.is_inactive) {
              return true;
            }
            // 處理具體課程類型（如鋼琴、音樂專注力等）
            if (s.course_type && selectedCourses.includes(s.course_type)) {
              return true;
            }
            return false;
          } catch (error) {
            console.error('課程篩選錯誤:', error);
            return false;
          }
        });
      }

      // 3. 星期篩選
      if (selectedWeekdays && selectedWeekdays.length > 0) {
        result = result.filter((s: any) => {
          if (!s) return false;
          // 處理常規學生與試堂學生
          let weekdays: string[] = [];
          if (Array.isArray(s.regular_weekday)) {
            weekdays = s.regular_weekday.map(String);
          } else if (s.regular_weekday !== undefined && s.regular_weekday !== null) {
            weekdays = [String(s.regular_weekday)];
          }
          return weekdays.some((weekday: string) => selectedWeekdays.includes(weekday));
        });
      }

      // 4. 堂數篩選（只對常規學生生效）
      if (selectedLessonFilter && selectedLessonFilter !== 'all') {
        // 如果剩餘堂數還在計算中，暫時不進行篩選
        if (remainingLoading) {
          console.log('剩餘堂數計算中，暫時跳過堂數篩選');
        } else {
          result = result.filter((s: any) => {
            if (!s) return false;
            try {
              // 只有常規學生才有剩餘堂數概念
              if (s.student_type !== '常規') {
                console.log(`學生 ${s.full_name} (ID: ${s.id}) 不是常規學生，類型: ${s.student_type}`);
                return false;
              }
              
              // 使用 remainingLessonsMap 中的最新計算結果
              const remainingLessons = remainingLessonsMap[s.id];
              if (remainingLessons === null || remainingLessons === undefined) {
                console.log(`學生 ${s.full_name} (ID: ${s.id}) 的剩餘堂數未計算完成，跳過篩選`);
                return false;
              }

              console.log(`學生 ${s.full_name} (ID: ${s.id}) 的剩餘堂數: ${remainingLessons}, 篩選條件: ${selectedLessonFilter}, 自訂數量: ${customLessonCount}`);

              switch (selectedLessonFilter) {
                case 'gt2':
                  return Number(remainingLessons) > 2;
                case 'lte2':
                  return Number(remainingLessons) <= 2;
                case 'lte1':
                  return Number(remainingLessons) <= 1;
                case 'custom':
                  if (customLessonCount !== '' && customLessonCount !== null && customLessonCount !== undefined) {
                    return Number(remainingLessons) === Number(customLessonCount);
                  }
                  return false; // 如果沒有設定自訂數字，不顯示任何學生
                default:
                  return true;
              }
            } catch (error) {
              console.error('堂數篩選錯誤:', error);
              return false;
            }
          });
        }
      }

      // 5. 日期篩選
      if (selectedDates && selectedDates.length > 0) {
        // 使用與 HanamiCalendar 相同的日期格式處理
        const getDateString = (date: Date) => {
          return date.toLocaleDateString('sv-SE'); // 產生 'YYYY-MM-DD' 格式
        };
        
        const selectedDateStrings = selectedDates.map(d => getDateString(d));
        console.log('開始日期篩選，選中日期:', selectedDateStrings);
        console.log('篩選前的學生總數:', result.length);
        
        result = result.filter((s: any) => {
          if (!s) return false;
          try {
            // 檢查學生是否有符合選中日期的課堂
            const studentDates: string[] = [];
            
            // 常規學生：檢查 hanami_student_lesson 表中的課堂日期
            if (s.student_type === '常規') {
              if (s.lesson_dates && Array.isArray(s.lesson_dates)) {
                studentDates.push(...s.lesson_dates);
              }
            }
            
            // 試堂學生：檢查 lesson_date（直接存在試堂學生記錄中）
            if (s.student_type === '試堂' && s.lesson_date) {
              studentDates.push(s.lesson_date);
            }
            
            // 檢查是否有任何選中的日期與學生的課堂日期匹配
            const hasMatch = selectedDateStrings.some((selectedDateStr: string) => {
              const match = studentDates.includes(selectedDateStr);
              if (match) {
                console.log(`找到匹配: ${s.full_name} 的日期 ${selectedDateStr} 與選中日期匹配`);
              }
              return match;
            });
            
            // 顯示所有學生的篩選結果
            console.log(`學生 ${s.full_name} (${s.student_type}) - 匹配: ${hasMatch}, 日期: [${studentDates.join(', ')}]`);
            
            // 除錯：顯示日期比較的詳細資訊
            if (studentDates.length > 0) {
              console.log(`  選中日期: [${selectedDateStrings.join(', ')}]`);
              console.log(`  學生日期: [${studentDates.join(', ')}]`);
            }
            
            // 特別顯示試堂學生的資訊
            if (s.student_type === '試堂') {
              console.log(`試堂學生 ${s.full_name} 的 lesson_date:`, s.lesson_date);
            }
            
            return hasMatch;
          } catch (error) {
            console.error('日期篩選錯誤:', error);
            return false;
          }
        });
        console.log('日期篩選後的學生數量:', result.length);
      }

      return result;
    } catch (error) {
      console.error('filteredStudents 計算錯誤:', error);
      return students || [];
    }
  }, [students, searchQuery, selectedCourses, selectedWeekdays, selectedLessonFilter, customLessonCount, selectedDates, remainingLessonsMap, remainingLoading]);

  // 排序學生數據
  const sortStudents = (students: any[]) => {
    if (!sortField) {
      // 如果沒有指定排序欄位，保持原有的試堂學生排序邏輯
      return [...students].sort((a, b) => {
        // 檢查是否選中了試堂課程
        if (selectedCourses && selectedCourses.length > 0 && selectedCourses.includes('試堂')) {
          const dateA = a.lesson_date ? new Date(a.lesson_date).getTime() : 0;
          const dateB = b.lesson_date ? new Date(b.lesson_date).getTime() : 0;
          return dateB - dateA; // 從新到舊排序
        }
        return 0;
      });
    }

    return [...students].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // 處理特殊欄位的排序
      switch (sortField) {
        case 'student_age':
          // 年齡按數字排序
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
          break;
        case 'remaining_lessons':
          // 剩餘堂數按數字排序
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
          break;
        case 'regular_weekday':
          // 取最小的星期數字（如 [1,2] 取 1），若為字串或數字則直接轉數字
          aValue = Array.isArray(aValue)
            ? Math.min(...aValue.map(Number))
            : aValue !== undefined && aValue !== null
              ? Number(aValue)
              : 0;
          bValue = Array.isArray(bValue)
            ? Math.min(...bValue.map(Number))
            : bValue !== undefined && bValue !== null
              ? Number(bValue)
              : 0;
          break;
        case 'student_dob':
        case 'started_date':
        case 'lesson_date':
        case 'inactive_date':
          // 日期按日期排序
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
          break;
        case 'regular_timeslot':
        case 'actual_timeslot':
          // 時間按時間排序
          aValue = aValue ? aValue.replace(':', '') : '';
          bValue = bValue ? bValue.replace(':', '') : '';
          break;
        default:
          // 其他欄位按字符串排序
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 對試堂學生進行排序
  const sortedStudents = useMemo(() => {
    // 先應用搜尋過濾
    let result = filteredStudents;
    
    // 再應用排序
    if (sortField) {
      result = sortStudents(result);
    } else {
      // 如果沒有指定排序欄位，保持原有的試堂學生排序邏輯
      result = [...result].sort((a, b) => {
        // 檢查是否選中了試堂課程
        if (selectedCourses && selectedCourses.length > 0 && selectedCourses.includes('試堂')) {
          const dateA = a.lesson_date ? new Date(a.lesson_date).getTime() : 0;
          const dateB = b.lesson_date ? new Date(b.lesson_date).getTime() : 0;
          return dateB - dateA; // 從新到舊排序
        }
        return 0;
      });
    }
    
    return result;
  }, [filteredStudents, sortField, sortDirection, selectedCourses]);

  // 排序功能已經在 usePageState 中處理

  // 獲取排序圖標
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col items-center space-y-0.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3L3 10h14L10 3z" />
          </svg>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 17L3 10h14L10 17z" />
          </svg>
        </div>
      );
    }
    return sortDirection === 'asc' ? 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3L3 10h14L10 3z" />
      </svg> : 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 17L3 10h14L10 17z" />
      </svg>;
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  // 計算總頁數
  const totalPages = pageSize === Infinity || pageSize === 0 ? 1 : Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  
  // 確保當前頁數不超過總頁數
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      handleCurrentPageChange(1);
    }
  }, [totalPages, currentPage, handleCurrentPageChange]); // 移除 currentPage 依賴，避免無窮迴圈

  // 處理 URL 參數的初始狀態設置
  useEffect(() => {
    if (filterParam) {
      const initialCourses = (() => {
        if (filterParam === 'regular') return ['常規'];
        if (filterParam === 'trial') return ['試堂'];
        if (filterParam === 'inactive') return ['停用學生'];
        return [];
      })();
      
      const initialLessonFilter = (() => {
        if (filterParam === 'lastLesson') return 'lte1';
        return 'all';
      })();
      
      const initialCustomLessonCount = (() => {
        if (filterParam === 'lastLesson') return 1;
        return '';
      })();
      
      // 只有在沒有恢復狀態時才設置 URL 參數的初始值
      updatePageState({
        selectedCourses: initialCourses,
        selectedLessonFilter: initialLessonFilter,
        customLessonCount: initialCustomLessonCount,
      });
    }
  }, [filterParam, updatePageState]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2"></h1>

        {/* 操作按鈕區域 */}
        {selectedStudents.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#2B3A3B]">
                  已選中 {selectedStudents.length} 位學生
                </span>
                <button
                  className="text-xs text-[#A68A64] hover:text-[#8B7355] underline"
                  onClick={() => setSelectedStudents([])}
                >
                  取消選擇
                </button>
              </div>
              <div className="flex gap-2">
                {isShowingInactiveStudents ? (
                  <div className="flex gap-2">
                    <button
                      className="hanami-btn-success flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading}
                      onClick={handleRestoreStudents}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>回復學生</span>
                    </button>
                    <button
                      className="hanami-btn-danger flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading}
                      onClick={handleDeleteInactiveStudents}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>刪除學生</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 檢查選中的學生中是否包含試堂學生 */}
                    {(() => {
                      const selectedStudentData = students.filter((s: any) => selectedStudents.includes(s.id));
                      const hasTrialStudents = selectedStudentData.some((s: any) => s.student_type === '試堂');
                      const hasRegularStudents = selectedStudentData.some((s: any) => s.student_type !== '試堂');
                      
                      return (
                        <>
                          {/* 停用學生按鈕 */}
                          <button
                            className="hanami-btn-danger flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={actionLoading}
                            onClick={handleDeleteStudents}
                          >
                            <UserX className="w-4 h-4" />
                            <span>停用學生</span>
                          </button>
                          {/* AI 訊息按鈕 - 允許多選 */}
                          {selectedStudents.length > 0 && (
                            <button
                              className="hanami-btn flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading}
                              onClick={() => {
                                const selected = students.filter((s: any) => selectedStudents.includes(s.id));
                                if (selected.length > 0) {
                                  setSelectedStudentsForAI(selected);
                                  setShowAIMessageModal(true);
                                }
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>AI 訊息</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 美觀的搜尋區域 - 靠左版 */}
        <div className="mb-4 flex justify-start">
          <div className="w-full max-w-xl" style={{ minWidth: 240, width: '50%' }}>
            <div className="relative">
                <button
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  onClick={() => {
                    handleSearchTermChange(searchInput);
                }}
              >
                <svg
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                </button>
              <HanamiInput
                className="pl-10"
                placeholder="搜尋學生姓名、電話或編號..."
                value={searchInput}
                onChange={value => {
                  setSearchInput(value);
                  handleSearchTermChange(value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
                    handleSearchTermChange(searchInput);
                    if (e.preventDefault) e.preventDefault();
                  }
                }}
              />
                    </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex overflow-x-auto gap-2 pb-3">
            <div className="mb-4">
              <button
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                onClick={() => setDropdownOpen(true)}
              >
                <span>篩選課程</span>
                {selectedCourses.length > 0 && (
                  <span className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                    {selectedCourses.length}
                  </span>
                )}
              </button>
              {dropdownOpen && (
                <PopupSelect
                  mode="multi"
                  options={[
                    { label: '鋼琴', value: '鋼琴' },
                    { label: '音樂專注力', value: '音樂專注力' },
                    { label: '未分班', value: '未分班' },
                    { label: '常規', value: '常規' },
                    { label: '試堂', value: '試堂' },
                    { label: '停用學生', value: '停用學生' },
                  ]}
                  selected={selectedCourses}
                  title="篩選課程"
                  onCancel={() => { console.log('父層 cancel'); setDropdownOpen(false); }}
                  onChange={(value) => {
                    console.log('課程篩選 onChange:', value);
                    if (Array.isArray(value)) {
                      handleSelectedCoursesChange(value);
                    } else if (typeof value === 'string') {
                      handleSelectedCoursesChange([value]);
                    }
                  }}
                  onConfirm={() => { console.log('父層 confirm'); setDropdownOpen(false); }}
                />
              )}
            </div>



            <div className="mb-4">
              <button
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                onClick={() => setWeekdayDropdownOpen(true)}
              >
                <span>篩選星期</span>
                {selectedWeekdays.length > 0 && (
                  <span className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                    {selectedWeekdays.length}
                  </span>
                )}
              </button>
              {weekdayDropdownOpen && (
                <PopupSelect
                  mode="multi"
                  options={[
                    { label: '星期一', value: '1' },
                    { label: '星期二', value: '2' },
                    { label: '星期三', value: '3' },
                    { label: '星期四', value: '4' },
                    { label: '星期五', value: '5' },
                    { label: '星期六', value: '6' },
                    { label: '星期日', value: '0' },
                  ]}
                  selected={selectedWeekdays}
                  title="篩選星期"
                  onCancel={() => { console.log('父層 cancel'); setWeekdayDropdownOpen(false); }}
                  onChange={value => handleSelectedWeekdaysChange(Array.isArray(value) ? value : [value])}
                  onConfirm={() => { console.log('父層 confirm'); setWeekdayDropdownOpen(false); }}
                />
              )}
            </div>

            <div className="mb-4">
              <button
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                onClick={() => setLessonDropdownOpen(true)}
              >
                <span>篩選堂數</span>
                {(selectedLessonFilter !== 'all' || isCustomLessonFilterActive(selectedLessonFilter, customLessonCount)) && (
                  <span className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                    {selectedLessonFilter === 'custom' && customLessonCount !== '' ? customLessonCount : '✓'}
                  </span>
                )}
              </button>
              {lessonDropdownOpen && (
                <PopupSelect
                  mode="single"
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '> 2', value: 'gt2' },
                    { label: '≤ 2', value: 'lte2' },
                    { label: '≤ 1', value: 'lte1' },
                    { label: '自訂數字', value: 'custom' },
                  ]}
                  selected={selectedLessonFilter}
                  title="篩選剩餘堂數"
                  onCancel={() => { console.log('父層 cancel'); setLessonDropdownOpen(false); }}
                  onChange={(value) => updatePageState({ selectedLessonFilter: value as any })}
                  onConfirm={() => { console.log('父層 confirm'); setLessonDropdownOpen(false); }}
                />
              )}
              {selectedLessonFilter === 'custom' && (
                <input
                  className="ml-2 border border-[#EADBC8] rounded px-2 py-1 text-sm w-20 mt-2"
                  placeholder="數字"
                  type="number"
                  value={customLessonCount}
                  onChange={(e) => updatePageState({ customLessonCount: Number(e.target.value) })}
                />
              )}
            </div>

            <div className="mb-4">
              <button
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                onClick={() => setShowDateFilter(true)}
              >
                <CalendarClock className="w-4 h-4" />
                <span>篩選日期</span>
                {selectedDates.length > 0 && (
                  <span className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                    {selectedDates.length}
                  </span>
                )}
              </button>
              {/* 日曆彈窗 */}
              {showDateFilter && (
                <Calendarui
                  value={selectedDates}
                  onChange={handleSelectedDatesChange}
                  onClose={() => setShowDateFilter(false)}
                  multiple
                />
              )}
            </div>

            <div className="mb-4">
              <button
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                onClick={() => handleDisplayModeChange(displayMode === 'grid' ? 'list' : 'grid')}
              >
                {displayMode === 'grid' ? (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span>圖卡顯示</span>
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4" />
                    <span>列表顯示</span>
                  </>
                )}
              </button>
            </div>

            {(selectedCourses.length > 0 ||
              selectedWeekdays.length > 0 ||
              selectedLessonFilter !== 'all' ||
              isCustomLessonFilterActive(selectedLessonFilter, customLessonCount) ||
              selectedDates.length > 0 ||
              searchQuery) && (
              <div className="mb-4">
                <button
                  className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                  onClick={() => {
                    updatePageState({
                      selectedCourses: [],
                      selectedWeekdays: [],
                      selectedLessonFilter: 'all',
                      customLessonCount: '',
                      searchTerm: '',
                    });
                    setSelectedDates([]);
                    setSearchInput('');
                    // 同時清除 API 篩選狀態
                    setApiFilter({
                      selectedDates: [],
                      selectedCourses: [],
                      selectedWeekdays: [],
                      searchTerm: '',
                      orgId: effectiveOrgId,
                    });
                  }}
                >
                  <span>清除所有條件</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 篩選條件顯示區域 */}
        {(selectedCourses.length > 0 || selectedWeekdays.length > 0 || selectedLessonFilter !== 'all' || isCustomLessonFilterActive(selectedLessonFilter, customLessonCount) || selectedDates.length > 0 || searchQuery) && (
          <div className="mb-4 p-3 bg-gradient-to-r from-[#E0F2E0] to-[#D4F2D4] rounded-lg border border-[#C8EAC8]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
              <span className="font-medium text-[#2B3A3B]">當前篩選條件：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="bg-[#4CAF50] text-white text-xs px-2 py-1 rounded-full">
                  搜尋：{searchQuery}
                </span>
              )}
              {selectedCourses.map(course => (
                <span key={course} className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full">
                  課程：{course}
                </span>
              ))}
              {selectedWeekdays.map(weekday => {
                const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                return (
                  <span key={weekday} className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full">
                    星期：{weekdayNames[parseInt(weekday)]}
                  </span>
                );
              })}
              {selectedLessonFilter !== 'all' && (
                <span className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full">
                  堂數：{selectedLessonFilter === 'gt2' ? '> 2' : selectedLessonFilter === 'lte2' ? '≤ 2' : selectedLessonFilter === 'lte1' ? '≤ 1' : selectedLessonFilter === 'custom' ? `= ${customLessonCount}` : selectedLessonFilter}
                </span>
              )}
              {selectedDates.length > 0 && (
                <span className="bg-[#A64B2A] text-white text-xs px-2 py-1 rounded-full">
                  日期：{selectedDates.map(date => date.toLocaleDateString('zh-TW')).join('、')}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 mb-2">
          顯示學生數：{sortedStudents.length}（
          {[
            selectedCourses.length > 0 && `課程：${selectedCourses.join('、')}`,
            selectedWeekdays.length > 0 &&
              `星期：${selectedWeekdays
                .map((day) => `星期${['日', '一', '二', '三', '四', '五', '六'][Number(day)]}`)
                .join('、')}`,
            selectedLessonFilter === 'custom' && typeof customLessonCount === 'number'
              ? `剩餘堂數 = ${customLessonCount}`
              : selectedLessonFilter === 'gt2'
              ? '剩餘堂數 > 2'
              : selectedLessonFilter === 'lte2'
              ? '剩餘堂數 ≤ 2'
                  : selectedLessonFilter === 'lte1'
                    ? '剩餘堂數 ≤ 1'
              : null,
            selectedDates.length > 0 && `日期：${selectedDates.map(date => date.toLocaleDateString('zh-TW')).join('、')}`,
          ]
            .filter(Boolean)
            .join('；') || '全部條件'}
          )
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#2B3A3B]">每頁顯示：</span>
            <button
              className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
              onClick={() => setPageSizeDropdownOpen(true)}
            >
              <span>{pageSize === Infinity ? '全部' : pageSize}</span>
            </button>
            {pageSizeDropdownOpen && (
              <PopupSelect
                mode="single"
                options={[
                  { label: '20', value: '20' },
                  { label: '50', value: '50' },
                  { label: '100', value: '100' },
                  { label: '全部', value: 'all' },
                ]}
                selected={pageSize.toString()}
                title="選擇顯示數量"
                onCancel={() => { console.log('父層 cancel'); setPageSizeDropdownOpen(false); }}
                onChange={(value) => {
                  handlePageSizeChange(value === 'all' ? Infinity : Number(value));
                }}
                onConfirm={() => { console.log('父層 confirm'); setPageSizeDropdownOpen(false); }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 新增學生按鈕 */}
            <button
              className="hanami-btn flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-[#A64B2A] to-[#C17817] hover:from-[#8B3A1F] hover:to-[#A66514] transition-all duration-300 hover:shadow-md rounded-lg"
              onClick={() => setShowStudentTypeSelector(true)}
            >
              <Plus className="w-4 h-4" />
              <span>新增學生</span>
            </button>
            <button
              className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2 transition-all duration-300 hover:shadow-md"
              onClick={() => setColumnSelectorOpen(true)}
            >
              <Settings2 className="w-4 h-4" />
              <span>顯示欄位</span>
            </button>
            {columnSelectorOpen && (
              <PopupSelect
                mode="multi"
                options={columnOptions}
                selected={selectedColumns}
                title="選擇顯示欄位"
                onCancel={() => { console.log('父層 cancel'); setColumnSelectorOpen(false); }}
                onChange={(value) => {
                  // 確保基本欄位始終被選中
                  const newSelected = Array.isArray(value) ? value : [value];
                  if (!newSelected.includes('student_oid')) newSelected.push('student_oid');
                  if (!newSelected.includes('full_name')) newSelected.push('full_name');
                  if (!newSelected.includes('student_age')) newSelected.push('student_age');
                  updatePageState({ selectedColumns: newSelected });
                }}
                onConfirm={() => { console.log('父層 confirm'); setColumnSelectorOpen(false); }}
              />
            )}
            {sortedStudents.length > 0 && (
              <>
                <button
                  className={`p-2 rounded-full ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'
                  }`}
                  disabled={currentPage === 1}
                  onClick={() => handleCurrentPageChange(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-[#2B3A3B]">
                  第 {currentPage} 頁，共 {totalPages} 頁
                </span>
                <button
                  className={`p-2 rounded-full ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'
                  }`}
                  disabled={currentPage === totalPages}
                  onClick={() => handleCurrentPageChange(Math.min(totalPages, currentPage + 1))}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            {sortedStudents.length === 0 && (
              <span className="text-sm text-[#2B3A3B]">
                沒有符合條件的學生
              </span>
            )}
          </div>
        </div>

        {/* Filtered students list */}
        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {remainingLoading ? (
              <div className="col-span-full text-center py-8 text-gray-400">剩餘堂數載入中...</div>
            ) : (
              sortedStudents
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((student: any, index: number) => {
                  const ageInMonths = Number(student.student_age) || 0;
                  const years = Math.floor(ageInMonths / 12);
                  const months = ageInMonths % 12;

                  // 移除頻繁的警告日誌，改為只在開發環境下顯示一次
                  if (!student.gender && process.env.NODE_ENV === 'development') {
                    // 使用 Set 來避免重複警告
                    if (!(window as any).genderWarnings) {
                      (window as any).genderWarnings = new Set();
                    }
                    const warningKey = `${student.full_name || student.id}`;
                    if (!(window as any).genderWarnings.has(warningKey)) {
                      console.warn(`學生 ${student.full_name || student.id} 缺少 gender，avatar 預設為 boy.png`);
                      (window as any).genderWarnings.add(warningKey);
                    }
                  }

                  const isTrialStudent = student.student_type === '試堂';
                  const isInactiveStudent = student.is_inactive === true;
                  const cardFields = isTrialStudent
                    ? [
                        {
                          icon: CalendarClock,
                          label: '年齡',
                          value: ageInMonths ? `${years} 歲${months > 0 ? ` ${months} 個月` : ''}` : '—',
                        },
                        {
                          icon: BookOpen,
                          label: '課程',
                          value: student.course_type || '未分班',
                        },
                        {
                          icon: CalendarClock,
                          label: '試堂時間',
                          value: student.lesson_date && student.actual_timeslot
                            ? `${new Date(student.lesson_date).toLocaleDateString('zh-HK')} ${student.actual_timeslot}`
                            : '—',
                        },
                      ]
                    : [
                        {
                          icon: CalendarClock,
                          label: '年齡',
                          value: ageInMonths ? `${years} 歲${months > 0 ? ` ${months} 個月` : ''}` : '—',
                        },
                        {
                          icon: BookOpen,
                          label: '課程',
                          value: student.course_type || '未分班',
                        },
                        {
                          icon: Star,
                          label: '剩餘堂數',
                        value: student.student_type === '常規' ? (remainingLessonsMap[student.id] !== undefined ? `${remainingLessonsMap[student.id]} 堂` : '—') : '—',
                        },
                    ];

                  // 如果是停用學生，添加停用日期信息
                  if (isInactiveStudent && student.inactive_date) {
                    cardFields.push({
                      icon: CalendarClock,
                      label: '停用日期',
                      value: new Date(student.inactive_date).toLocaleDateString('zh-HK'),
                    });
                  }

                  return (
                    <motion.div
                      key={student.id}
                      animate={{
                        scale: selectedStudents.includes(student.id) ? 1.03 : 1,
                        boxShadow: selectedStudents.includes(student.id)
                          ? '0 4px 20px rgba(252, 213, 139, 0.4)'
                          : 'none',
                      }}
                      className="cursor-pointer relative"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleStudent(student.id)}
                    >
                      {!isInactiveStudent && (
                        <div
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 對於停用學生，使用 inactive_student_list 的 ID
                            const studentId = isInactiveStudent ? student.id : student.id;
                            handleNavigateToStudent(studentId);
                          }}
                        >
                          <img
                            alt="編輯"
                            className="w-7 h-7 cursor-pointer hover:scale-110 transition-transform"
                            src="/icons/edit-pencil.png"
                          />
                        </div>
                      )}
                      {selectedStudents.includes(student.id) && !isInactiveStudent && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-2 right-2"
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: -10 }}
                        >
                          <img alt="選取" className="w-12 h-12" src="/leaf-sprout.png" />
                        </motion.div>
                      )}
                      <StudentCard
                        avatar={
                          student.gender === 'male'
                            ? '/boy.png'
                            : student.gender === 'female'
                              ? '/girl.png'
                              : '/boy.png'
                        }
                        fields={cardFields}
                        isInactive={isInactiveStudent}
                        isTrialStudent={isTrialStudent}
                        name={student.full_name || '未命名學生'}
                        selected={selectedStudents.includes(student.id)}
                        studentType={student.student_type}
                      />
                    </motion.div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EADBC8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead>
                <tr className="bg-[#FFF9F2] border-b border-[#EADBC8]">
                  <th className="w-12 p-3 text-left text-sm font-medium text-[#2B3A3B]">
                    <Checkbox
                      checked={selectedStudents.length === sortedStudents.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(sortedStudents.map((s: any) => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">#</th>
                  {selectedColumns.includes('student_oid') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_oid')}
                    >
                      <div className="flex items-center gap-1">
                        學生編號
                        {getSortIcon('student_oid')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('full_name') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center gap-1">
                        姓名
                        {getSortIcon('full_name')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_age') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_age')}
                    >
                      <div className="flex items-center gap-1">
                        年齡
                        {getSortIcon('student_age')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('gender') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('gender')}
                    >
                      <div className="flex items-center gap-1">
                        性別
                        {getSortIcon('gender')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_dob') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_dob')}
                    >
                      <div className="flex items-center gap-1">
                        生日
                        {getSortIcon('student_dob')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_type') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_type')}
                    >
                      <div className="flex items-center gap-1">
                        類型
                        {getSortIcon('student_type')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('course_type') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('course_type')}
                    >
                      <div className="flex items-center gap-1">
                        課程
                        {getSortIcon('course_type')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('school') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('school')}
                    >
                      <div className="flex items-center gap-1">
                        學校
                        {getSortIcon('school')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('address') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center gap-1">
                        地址
                        {getSortIcon('address')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_teacher') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_teacher')}
                    >
                      <div className="flex items-center gap-1">
                        負責老師
                        {getSortIcon('student_teacher')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('student_preference') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_preference')}
                    >
                      <div className="flex items-center gap-1">
                        偏好
                        {getSortIcon('student_preference')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('regular_weekday') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('regular_weekday')}
                    >
                      <div className="flex items-center gap-1">
                      星期
                        {getSortIcon('regular_weekday')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('regular_timeslot') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('regular_timeslot')}
                    >
                      <div className="flex items-center gap-1">
                        上課時間
                        {getSortIcon('regular_timeslot')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('remaining_lessons') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('remaining_lessons')}
                    >
                      <div className="flex items-center gap-1">
                        剩餘堂數
                        {getSortIcon('remaining_lessons')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('started_date') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('started_date')}
                    >
                      <div className="flex items-center gap-1">
                        入學日期
                        {getSortIcon('started_date')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('duration_months') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('duration_months')}
                    >
                      <div className="flex items-center gap-1">
                        報讀時長
                        {getSortIcon('duration_months')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('contact_number') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('contact_number')}
                    >
                      <div className="flex items-center gap-1">
                        聯絡電話
                        {getSortIcon('contact_number')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('parent_email') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('parent_email')}
                    >
                      <div className="flex items-center gap-1">
                        家長 Email
                        {getSortIcon('parent_email')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('health_notes') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('health_notes')}
                    >
                      <div className="flex items-center gap-1">
                        健康備註
                        {getSortIcon('health_notes')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('lesson_date') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('lesson_date')}
                    >
                      <div className="flex items-center gap-1">
                        試堂日期
                        {getSortIcon('lesson_date')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('actual_timeslot') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('actual_timeslot')}
                    >
                      <div className="flex items-center gap-1">
                        試堂時間
                        {getSortIcon('actual_timeslot')}
                      </div>
                    </th>
                  )}
                  {selectedColumns.includes('inactive_date') && (
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('inactive_date')}
                    >
                      <div className="flex items-center gap-1">
                        停用日期
                        {getSortIcon('inactive_date')}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedStudents
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((student: any, index: number) => {
                    const ageInMonths = Number(student.student_age) || 0;
                    const years = Math.floor(ageInMonths / 12);
                    const months = ageInMonths % 12;
                    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                    const regularWeekdays = Array.isArray(student.regular_weekday)
                      ? student.regular_weekday.map((d: string | number) => `星期${weekdays[Number(d)]}`).join('、')
                      : typeof student.regular_weekday === 'string'
                        ? `星期${weekdays[Number(student.regular_weekday)]}`
                        : '—';

                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-[#EADBC8] hover:bg-[#FFF9F2] cursor-pointer ${
                          selectedStudents.includes(student.id) ? 'bg-[#FFF9F2]' : ''
                        } ${student.is_inactive ? 'bg-gray-50 opacity-60' : ''}`}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">{index + 1}</td>
                        {selectedColumns.includes('student_oid') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.student_oid || '—'}</td>
                        )}
                        {selectedColumns.includes('full_name') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            <div className="flex items-center gap-2">
                              <span>{student.full_name || '未命名學生'}</span>
                              {!student.is_inactive && (
                                <button
                                  className="hanami-btn-soft p-1 transition-all duration-200 hover:scale-110"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 對於停用學生，使用 inactive_student_list 的 ID
                                    const studentId = student.is_inactive ? student.id : student.id;
                                    handleNavigateToStudent(studentId);
                                  }}
                                >
                                  <img
                                    alt="編輯"
                                    className="w-4 h-4"
                                    src="/icons/edit-pencil.png"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                        {selectedColumns.includes('student_age') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {ageInMonths ? `${years} 歲${months > 0 ? ` ${months} 個月` : ''}` : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('gender') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.gender === 'female' ? '女' : student.gender === 'male' ? '男' : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('student_dob') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.student_dob ? new Date(student.student_dob).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('student_type') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.student_type || '—'}</td>
                        )}
                        {selectedColumns.includes('course_type') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.course_type || '未分班'}</td>
                        )}
                        {selectedColumns.includes('school') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.school || '—'}</td>
                        )}
                        {selectedColumns.includes('address') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.address || '—'}</td>
                        )}
                        {selectedColumns.includes('student_teacher') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.student_teacher || '—'}</td>
                        )}
                        {selectedColumns.includes('student_preference') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.student_preference || '—'}</td>
                        )}
                        {selectedColumns.includes('regular_weekday') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {
                              (() => {
                                const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                                let regularWeekdays = '—';
                                const val = student.regular_weekday;
                                if (val !== undefined && val !== null && val !== '') {
                                  if (Array.isArray(val)) {
                                    regularWeekdays = val
                                      .filter((d: any) => d !== null && d !== undefined && d !== '')
                                      .map((d: any) => weekdays[Number(d)]).join('、');
                                  } else if (!isNaN(Number(val))) {
                                    regularWeekdays = weekdays[Number(val)];
                                  }
                                }
                                return regularWeekdays;
                              })()
                            }
                          </td>
                        )}
                        {selectedColumns.includes('regular_timeslot') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.regular_timeslot ? 
                              `${student.regular_timeslot.split(':')[0]}:${student.regular_timeslot.split(':')[1]}` : 
                              '—'
                            }
                          </td>
                        )}
                        {selectedColumns.includes('remaining_lessons') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.student_type === '常規' ? (remainingLessonsMap[student.id] !== undefined ? remainingLessonsMap[student.id] : '—') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('started_date') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.started_date ? new Date(student.started_date).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('duration_months') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.duration_months ? `${student.duration_months} 個月` : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('contact_number') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.contact_number && student.contact_number.length === 8 ? 
                              `${student.contact_number.slice(0, 4)}-${student.contact_number.slice(4, 8)}` : 
                              student.contact_number || '—'
                            }
                          </td>
                        )}
                        {selectedColumns.includes('parent_email') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.parent_email || '—'}</td>
                        )}
                        {selectedColumns.includes('health_notes') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.health_notes || '—'}</td>
                        )}
                        {selectedColumns.includes('lesson_date') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.lesson_date ? new Date(student.lesson_date).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                        {selectedColumns.includes('actual_timeslot') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>{student.actual_timeslot || '—'}</td>
                        )}
                        {selectedColumns.includes('inactive_date') && (
                          <td className={`p-3 text-sm ${student.is_inactive ? 'text-gray-500' : 'text-[#2B3A3B]'}`}>
                            {student.inactive_date ? new Date(student.inactive_date).toLocaleDateString('zh-HK') : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* 學生類型選擇器 */}
        <StudentTypeSelector
          isOpen={showStudentTypeSelector}
          onClose={() => setShowStudentTypeSelector(false)}
          regularPath={navigationPaths.newRegularStudent}
          trialPath={navigationPaths.newTrialStudent}
        />

        {/* AI 訊息模態框 */}
        {showAIMessageModal && selectedStudentsForAI.length > 0 && (
          <AIMessageModal
            isOpen={showAIMessageModal}
            onClose={() => {
              setShowAIMessageModal(false);
              setSelectedStudentsForAI([]);
            }}
            students={selectedStudentsForAI}
          />
        )}
      </div>
    </div>
  );
}

function isCustomLessonFilterActive(filter: 'all' | 'gt2' | 'lte2' | 'lte1' | 'custom', count: number | ''): boolean {
  return filter === 'custom' && count !== '' && count !== null && count !== undefined && !isNaN(Number(count));
}
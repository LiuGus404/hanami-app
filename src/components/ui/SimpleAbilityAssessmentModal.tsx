'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, StarIcon, UserIcon, CalendarIcon, CheckCircleIcon, AcademicCapIcon, PencilIcon, TrashIcon, ArrowPathIcon, BookOpenIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard, HanamiInput } from './index';
import { supabase } from '@/lib/supabase';
import ActivitySelectionModal from './ActivitySelectionModal';
import GrowthTreePathManager from './GrowthTreePathManager';
import MinimalStudentGrowthTreeManager from './MinimalStudentGrowthTreeManager';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getUserSession } from '@/lib/authUtils';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  ability_progress?: { // 學生的能力進度記錄
    [ability_id: string]: {
      current_level: number;
      max_level: number;
      progress_percentage: number;
      last_assessment_date?: string;
    };
  };
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string | null;
  start_date?: string | null;
  status?: string | null;
}

interface Teacher {
  id: string;
  teacher_fullname?: string | null;
  teacher_nickname?: string | null;
  admin_name?: string | null;
  teacher_email?: string | null;
  teacher_role?: string | null;
  type: 'employee' | 'admin'; // 區分是員工還是管理員
}

interface GrowthGoal {
  id: string;
  goal_name: string;
  goal_description?: string | null;
  required_abilities: string[];
  goal_order: number;
  is_completed?: boolean; // 目標是否已完成
  completion_percentage?: number; // 完成百分比
  progress_max?: number; // 目標的最大進度值
  progress_contents?: string[]; // 每個等級對應的內容
  // 新增評估模式相關欄位
  assessment_mode?: 'progress' | 'multi_select';
  multi_select_levels?: string[];
  multi_select_descriptions?: string[];
  last_assessment?: {
    level: number;
    date: string;
    teacher_name?: string;
  }; // 上一次評估資料
}

interface DevelopmentAbility {
  id: string;
  ability_name: string;
  ability_description?: string;
  max_level: number;
  current_level?: number; // 學生在此能力的當前等級
  progress_percentage?: number; // 進度百分比
  completion_percentage?: number; // 完成百分比
  level_contents?: { // 每個等級對應的內容
    [level: number]: {
      level_title: string;
      level_description: string;
    };
  };
}

interface AbilityAssessment {
  student_id: string;
  tree_id: string;
  assessment_date: string;
  lesson_date: string;
  teacher_id?: string | null; // 設為可選
  ability_assessments: {
    [ability_id: string]: {
      level: number;
      notes: string;
      rating: number;
    };
  };
  selected_goals?: Array<{
    goal_id: string;
    assessment_mode: 'progress' | 'multi_select';
    progress_level?: number;
    selected_levels?: string[];
  }>;
  goals?: Array<{
    goal_id: string;
    assessment_mode: 'progress' | 'multi_select';
    progress_level?: number;
    selected_levels?: string[];
  }>;
  overall_performance_rating: number;
  general_notes: string | null;
  next_lesson_focus: string | null;
}

interface SimpleAbilityAssessmentModalProps {
  onClose: () => void;
  onSubmit: (assessment: AbilityAssessment) => void;
  initialData?: AbilityAssessment; // 新增：用於編輯模式的初始資料
  defaultStudent?: { id: string; full_name: string; nick_name?: string }; // 新增：預設學生資料
  defaultAssessmentDate?: string; // 新增：預設評估日期
  showOnlyTodayStudents?: boolean; // 新增：是否只顯示當日學生
  lockStudent?: boolean; // 新增：是否鎖定學生選擇
  lockTeacher?: boolean; // 新增：是否鎖定教師選擇
  defaultTeacher?: { id: string; teacher_fullname?: string; teacher_nickname?: string }; // 新增：預設教師資料
}

export default function SimpleAbilityAssessmentModal({
  onClose,
  onSubmit,
  initialData,
  defaultStudent,
  defaultAssessmentDate,
  showOnlyTodayStudents,
  lockStudent = false,
  lockTeacher = false,
  defaultTeacher
}: SimpleAbilityAssessmentModalProps) {
  const { currentOrganization } = useOrganization();
  
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const PLACEHOLDER_ORG_IDS = new Set(['default-org', 'unassigned-org-placeholder']);
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) return null;
    return UUID_REGEX.test(currentOrganization.id) && !PLACEHOLDER_ORG_IDS.has(currentOrganization.id)
      ? currentOrganization.id
      : null;
  }, [currentOrganization?.id]);
  
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [goals, setGoals] = useState<GrowthGoal[]>([]);
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  
  // 表單狀態
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialData?.student_id || defaultStudent?.id || ''
  );
  const [selectedTreeId, setSelectedTreeId] = useState(initialData?.tree_id || ''); // 新增：選擇的成長樹ID
  const [selectedTeacherId, setSelectedTeacherId] = useState(initialData?.teacher_id || defaultTeacher?.id || ''); // 新增：選擇的教師ID
  const [lessonDate, setLessonDate] = useState(
    initialData?.lesson_date || defaultAssessmentDate || new Date().toISOString().split('T')[0]
  );
  const [assessmentDate, setAssessmentDate] = useState(
    initialData?.assessment_date || defaultAssessmentDate || new Date().toISOString().split('T')[0]
  );
  const [overallRating, setOverallRating] = useState(initialData?.overall_performance_rating || 3);
  const [generalNotes, setGeneralNotes] = useState(initialData?.general_notes || '');
  const [nextFocus, setNextFocus] = useState(initialData?.next_lesson_focus || '');
  
  // 學生選擇相關狀態
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  
  // 成長樹選擇相關狀態
  const [showTreeDropdown, setShowTreeDropdown] = useState(false);
  const [treeSearch, setTreeSearch] = useState('');
  const [studentTrees, setStudentTrees] = useState<GrowthTree[]>([]); // 學生的所有成長樹
  
  // 評估記錄選擇相關狀態
  const [showAssessmentDropdown, setShowAssessmentDropdown] = useState(false);
  
  // 教師選擇相關狀態
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  
  // 能力評估狀態
  const [abilityAssessments, setAbilityAssessments] = useState<{[key: string]: any}>(initialData?.ability_assessments || {});
  const [goalAssessments, setGoalAssessments] = useState<{[key: string]: any}>({});
  const [selectedGoals, setSelectedGoals] = useState<any[]>(initialData?.selected_goals || []);
  
  // 評估記錄歷史狀態
  const [latestAssessment, setLatestAssessment] = useState<any>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [selectedAssessmentRecord, setSelectedAssessmentRecord] = useState<any>(null);
  
  // 多選模式評估狀態
  const [multiSelectAssessments, setMultiSelectAssessments] = useState<{[goalId: string]: string[]}>({});

  // 活動管理相關狀態
  const [showActivitySelectionModal, setShowActivitySelectionModal] = useState(false);
  const [currentActivityType, setCurrentActivityType] = useState<'current' | 'ongoing'>('ongoing');
  const [studentActivities, setStudentActivities] = useState<{
    currentLessonActivities: any[];
    previousLessonActivities: any[];
    ongoingActivities: any[];
  }>({
    currentLessonActivities: [],
    previousLessonActivities: [],
    ongoingActivities: []
  });
  
  // 活動編輯狀態
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [tempProgress, setTempProgress] = useState<{[activityId: string]: number}>({});
  
  // 活動篩選狀態
  const [activityFilter, setActivityFilter] = useState<'all' | 'incomplete' | 'completed'>('incomplete');
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // 成長樹路徑管理器狀態
  const [showGrowthTreePathManager, setShowGrowthTreePathManager] = useState(false);

  // 檢查是否為編輯模式
  const isEditMode = !!initialData;
  
  // 編輯模式調試資訊
  if (isEditMode) {
    console.log('🔄 編輯模式啟用');
    console.log('📋 initialData:', initialData);
    console.log('📅 初始評估日期:', initialData?.assessment_date);
    console.log('🎯 初始 selected_goals:', initialData?.selected_goals);
  }

  // 檢查學生是否有分配成長樹
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedTree = studentTrees.find(t => t.id === selectedTreeId);
  
  // 調試輸出
  if (selectedTreeId && studentTrees.length > 0) {
    console.log('🔍 成長樹選擇調試:');
    console.log('  - selectedTreeId:', selectedTreeId);
    console.log('  - studentTrees:', studentTrees);
    console.log('  - selectedTree:', selectedTree);
    console.log('  - selectedTree?.tree_name:', selectedTree?.tree_name);
  }

  // 過濾學生列表
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (student.nick_name && student.nick_name.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  // 過濾成長樹列表
  const filteredStudentTrees = studentTrees.filter(tree =>
    tree.tree_name.toLowerCase().includes(treeSearch.toLowerCase())
  );

  // 過濾教師列表
  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacher_fullname?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    teacher.teacher_nickname?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    teacher.admin_name?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (teacher.teacher_email && teacher.teacher_email.toLowerCase().includes(teacherSearch.toLowerCase()))
  );

  useEffect(() => {
    // 每次模組打開時都重新載入資料
    loadStudentsAndTrees();
  }, []); // 只在組件掛載時執行一次

  useEffect(() => {
    console.log('🔄 useEffect[selectedStudentId] 被觸發');
    console.log('  - selectedStudentId:', selectedStudentId);
    console.log('  - isEditMode:', isEditMode);
    console.log('  - initialData?.tree_id:', initialData?.tree_id);
    
    if (selectedStudentId) {
      // 編輯模式時傳入目標樹ID
      const targetTreeId = isEditMode ? initialData?.tree_id : undefined;
      
      // 新增模式時，先載入最新評估記錄，再載入成長樹
      if (!isEditMode) {
        const loadDataSequentially = async () => {
          console.log('🔄 新增模式：開始載入學生資料 -', selectedStudentId);
          
          try {
            // 步驟1：載入評估記錄歷史（包含推薦記錄）
            console.log('📊 即將調用 loadAssessmentHistory，學生ID:', selectedStudentId);
            const recommendedData = await loadAssessmentHistory(selectedStudentId);
            console.log('📊 loadAssessmentHistory 完成，推薦記錄:', recommendedData);
            
            // 步驟2：載入學生成長樹，傳遞推薦的評估資料
            console.log('🌳 即將調用 loadStudentTrees');
            await loadStudentTrees(selectedStudentId, targetTreeId, recommendedData);
            console.log('🌳 loadStudentTrees 完成');
          } catch (error) {
            console.error('❌ loadDataSequentially 發生錯誤:', error);
          }
        };
        
        loadDataSequentially();
      } else {
        // 編輯模式：直接載入成長樹
        loadStudentTrees(selectedStudentId, targetTreeId);
      }
    } else {
      setStudentTrees([]);
      setSelectedTreeId('');
      setLatestAssessment(null);
    }
  }, [selectedStudentId, isEditMode, initialData?.tree_id]); // 加入編輯模式相關的依賴

  useEffect(() => {
    if (selectedTreeId) {
      console.log('🌳 成長樹變化，載入目標和能力:', selectedTreeId);
      loadTreeGoalsAndAbilities(selectedTreeId);
    }
  }, [selectedTreeId]);

  // 當成長樹選擇變化時，在新增模式下重新載入該成長樹的最新評估
  useEffect(() => {
    if (!isEditMode && selectedTreeId && selectedStudentId) {
      console.log('🔄 新增模式：成長樹變化，重新載入該成長樹的最新評估');
      console.log('  - selectedTreeId:', selectedTreeId);
      console.log('  - selectedStudentId:', selectedStudentId);
      
      // 重新載入指定成長樹的最新評估記錄
      const reloadAssessmentData = async () => {
        await loadLatestAssessment(selectedStudentId, selectedTreeId);
        // 載入完成後，重新載入目標和能力以應用評估資料
        setTimeout(() => {
          console.log('🔄 重新載入目標和能力以應用最新評估資料');
          loadTreeGoalsAndAbilities(selectedTreeId);
        }, 100); // 給狀態更新一點時間
      };
      
      reloadAssessmentData();
    }
  }, [selectedTreeId, selectedStudentId, isEditMode]);

  // 監聽 goalAssessments 狀態變化
  useEffect(() => {
    console.log('📊 goalAssessments 狀態變化:', goalAssessments);
    console.log('📊 當前 goalAssessments 的鍵:', Object.keys(goalAssessments));
  }, [goalAssessments]);

  // 載入學生活動
  useEffect(() => {
    if (selectedStudentId && lessonDate) {
      loadStudentActivities();
    }
  }, [selectedStudentId, lessonDate]);

  // 監聽 initialData 變化並重新初始化狀態
  useEffect(() => {
    if (initialData) {
      console.log('🔄 initialData 變化，重新初始化狀態:', initialData);
      
      // 修復過往評估記錄的顯示問題
      const fixedInitialData = fixHistoricalAssessmentData(initialData, goals, abilities);
      
      // 更新基本表單狀態
      setSelectedStudentId(fixedInitialData.student_id || '');
      setSelectedTreeId(fixedInitialData.tree_id || '');
      setSelectedTeacherId(fixedInitialData.teacher_id || '');
      setLessonDate(fixedInitialData.lesson_date || new Date().toISOString().split('T')[0]);
      setAssessmentDate(fixedInitialData.assessment_date || new Date().toISOString().split('T')[0]);
      setOverallRating(fixedInitialData.overall_performance_rating || 3);
      setGeneralNotes(fixedInitialData.general_notes || '');
      setNextFocus(fixedInitialData.next_lesson_focus || '');
      
      // 更新能力評估狀態
      setAbilityAssessments(fixedInitialData.ability_assessments || {});
      setSelectedGoals(fixedInitialData.selected_goals || []);
      
      console.log('✅ 狀態重新初始化完成');
    }
  }, [initialData, goals, abilities]);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.student-dropdown')) {
        setShowStudentDropdown(false);
      }
      if (!target.closest('.tree-dropdown')) {
        setShowTreeDropdown(false);
      }
      if (!target.closest('.teacher-dropdown')) {
        setShowTeacherDropdown(false);
      }
    };

    if (showStudentDropdown || showTreeDropdown || showTeacherDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStudentDropdown, showTreeDropdown, showTeacherDropdown]);

  const loadStudentsAndTrees = async () => {
    try {
      setLoading(true);
      
      console.log('開始載入學生和成長樹資料...');
      console.log('showOnlyTodayStudents:', showOnlyTodayStudents);
      
      let studentsData: any[] = [];
      
      if (showOnlyTodayStudents) {
        // 只載入當日有課程的學生
        const today = new Date().toISOString().split('T')[0];
        console.log('載入當日學生，日期:', today);
        
        // 先檢查當日是否有任何課程記錄
        const { data: allTodayLessons, error: checkError } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .eq('lesson_date', today);

        if (checkError) {
          console.error('檢查當日課程失敗:', checkError);
          throw checkError;
        }
        
        console.log('當日所有課程記錄:', allTodayLessons);
        
        // 先獲取當日有課程的學生ID
        const { data: todayLessonData, error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .select('student_id')
          .eq('lesson_date', today)
          .not('student_id', 'is', null);

        if (lessonError) {
          console.error('載入當日課程失敗:', lessonError);
          throw lessonError;
        }
        
        console.log('當日課程資料:', todayLessonData);
        
        // 去重學生ID
        const uniqueStudentIds = [...new Set(todayLessonData?.map(lesson => lesson.student_id) || [])];
        console.log('去重後的學生ID:', uniqueStudentIds);
        
        if (uniqueStudentIds.length === 0) {
          console.log('當日沒有學生課程，嘗試載入最近7天的課程');
          
          // 獲取最近7天的日期
          const recentDates = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            recentDates.push(date.toISOString().split('T')[0]);
          }
          
          console.log('最近7天日期:', recentDates);
          
          // 查詢最近7天的課程記錄
          const { data: recentLessonData, error: recentError } = await supabase
            .from('hanami_student_lesson')
            .select('student_id')
            .in('lesson_date', recentDates)
            .not('student_id', 'is', null);

          if (recentError) {
            console.error('載入最近課程失敗:', recentError);
            throw recentError;
          }
          
          console.log('最近7天課程資料:', recentLessonData);
          
          // 去重學生ID
          const recentStudentIds = [...new Set(recentLessonData?.map(lesson => lesson.student_id) || [])];
          console.log('最近7天學生ID:', recentStudentIds);
          
          if (recentStudentIds.length === 0) {
            console.log('最近7天也沒有學生課程');
            studentsData = [];
          } else {
            // 根據學生ID獲取學生詳細資訊
            // 使用 API 端點繞過 RLS
            try {
              const session = getUserSession();
              const userEmail = session?.email || null;
              
              if (!validOrgId) {
                throw new Error('缺少機構ID');
              }
              
              // 使用 API 端點獲取所有學生
              const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
              
              const response = await fetch(apiUrl, {
                credentials: 'include',
              });
              
              if (response.ok) {
                const result = await response.json();
                const allStudents = result.students || result.data || [];
                // 過濾出最近7天的學生
                const filteredIds = recentStudentIds.filter((id): id is string => id !== null);
                studentsData = allStudents
                  .filter((s: any) => filteredIds.includes(s.id))
                  .map((s: any) => ({
                    id: s.id,
                    full_name: s.full_name,
                    nick_name: s.nick_name
                  }))
                  .sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''));
                console.log('通過 API 載入最近7天學生資料成功:', studentsData.length);
              } else {
                console.error('⚠️ 無法載入最近學生，API 返回錯誤:', response.status);
                throw new Error(`API 返回錯誤: ${response.status}`);
              }
            } catch (apiError) {
              console.error('⚠️ API 調用異常，嘗試直接查詢:', apiError);
              // Fallback 到直接查詢
              let recentStudentsQuery = supabase
                .from('Hanami_Students')
                .select('id, full_name, nick_name')
                .in('id', recentStudentIds.filter((id): id is string => id !== null));
              
              if (validOrgId) {
                recentStudentsQuery = recentStudentsQuery.eq('org_id', validOrgId);
              }
              
              const { data: recentStudentsData, error: studentsError } = await recentStudentsQuery.order('full_name');

              if (studentsError) {
                console.error('載入最近學生失敗:', studentsError);
                throw studentsError;
              }
              
              studentsData = recentStudentsData || [];
            }
            console.log('最近7天學生資料載入成功:', studentsData);
          }
        } else {
          // 根據學生ID獲取學生詳細資訊
          // 使用 API 端點繞過 RLS
          try {
            const session = getUserSession();
            const userEmail = session?.email || null;
            
            if (!validOrgId) {
              throw new Error('缺少機構ID');
            }
            
            // 使用 API 端點獲取所有學生
            const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
            
            const response = await fetch(apiUrl, {
              credentials: 'include',
            });
            
            if (response.ok) {
              const result = await response.json();
              const allStudents = result.students || result.data || [];
              // 過濾出當日學生
              const filteredIds = uniqueStudentIds.filter((id): id is string => id !== null);
              studentsData = allStudents
                .filter((s: any) => filteredIds.includes(s.id))
                .map((s: any) => ({
                  id: s.id,
                  full_name: s.full_name,
                  nick_name: s.nick_name
                }))
                .sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''));
              console.log('通過 API 載入當日學生資料成功:', studentsData.length);
            } else {
              console.error('⚠️ 無法載入當日學生，API 返回錯誤:', response.status);
              throw new Error(`API 返回錯誤: ${response.status}`);
            }
          } catch (apiError) {
            console.error('⚠️ API 調用異常，嘗試直接查詢:', apiError);
            // Fallback 到直接查詢
            let todayStudentsQuery = supabase
              .from('Hanami_Students')
              .select('id, full_name, nick_name')
              .in('id', uniqueStudentIds.filter((id): id is string => id !== null));
            
            if (validOrgId) {
              todayStudentsQuery = todayStudentsQuery.eq('org_id', validOrgId);
            }
            
            const { data: todayStudentsData, error: studentsError } = await todayStudentsQuery.order('full_name');

            if (studentsError) {
              console.error('載入當日學生失敗:', studentsError);
              throw studentsError;
            }
            
            studentsData = todayStudentsData || [];
          }
          console.log('當日學生資料載入成功:', studentsData);
        }
      } else {
        // 載入所有學生
        // 使用 API 端點繞過 RLS
        try {
          const session = getUserSession();
          const userEmail = session?.email || null;
          
          if (!validOrgId) {
            throw new Error('缺少機構ID');
          }
          
          // 使用 API 端點獲取所有學生
          const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
          
          const response = await fetch(apiUrl, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const result = await response.json();
            const allStudents = result.students || result.data || [];
            studentsData = allStudents
              .map((s: any) => ({
                id: s.id,
                full_name: s.full_name,
                nick_name: s.nick_name
              }))
              .sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''));
            console.log('通過 API 載入所有學生資料成功:', studentsData.length);
          } else {
            console.error('⚠️ 無法載入所有學生，API 返回錯誤:', response.status);
            throw new Error(`API 返回錯誤: ${response.status}`);
          }
        } catch (apiError) {
          console.error('⚠️ API 調用異常，嘗試直接查詢:', apiError);
          // Fallback 到直接查詢
          let allStudentsQuery = supabase
            .from('Hanami_Students')
            .select('id, full_name, nick_name');
          
          if (validOrgId) {
            allStudentsQuery = allStudentsQuery.eq('org_id', validOrgId);
          }
          
          const { data: allStudentsData, error: studentsError } = await allStudentsQuery.order('full_name');

          if (studentsError) {
            console.error('載入學生失敗:', studentsError);
            throw studentsError;
          }
          
          studentsData = allStudentsData || [];
        }
        console.log('所有學生資料載入成功:', studentsData);
      }
      
      // 確保 defaultStudent 總是包含在學生列表中（特別是在鎖定模式下）
      if (defaultStudent && studentsData) {
        const existingStudent = studentsData.find(s => s.id === defaultStudent.id);
        if (!existingStudent) {
          console.log('添加 defaultStudent 到學生列表:', defaultStudent);
          studentsData.unshift({
            id: defaultStudent.id,
            full_name: defaultStudent.full_name,
            nick_name: defaultStudent.nick_name
          });
        }
      }
      
      setStudents(studentsData || []);

      // 載入成長樹列表（根據 org_id 過濾）
      let treesQuery = supabase
        .from('hanami_growth_trees')
        .select('id, tree_name, tree_description')
        .eq('is_active', true);
      
      if (validOrgId) {
        treesQuery = treesQuery.eq('org_id', validOrgId);
      } else {
        // 如果沒有 orgId，查詢一個不存在的 UUID 以確保不返回任何結果
        treesQuery = treesQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
      }
      
      const { data: treesData, error: treesError } = await treesQuery.order('tree_name');

      if (treesError) throw treesError;
      
      console.log('成長樹資料載入成功:', treesData);
      setTrees(treesData || []);

      // 載入教師資料
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_nickname, teacher_email, teacher_role, teacher_status')
        .order('teacher_nickname');

      if (teachersError) {
        console.error('載入教師失敗:', teachersError);
        throw teachersError;
      }

      console.log('原始員工資料:', teachersData);

      // 載入管理員資料
      const { data: adminsData, error: adminsError } = await supabase
        .from('hanami_admin')
        .select('id, admin_name, admin_email, role')
        .order('admin_name');

      if (adminsError) {
        console.error('載入管理員失敗:', adminsError);
        throw adminsError;
      }

      console.log('原始管理員資料:', adminsData);

      // 合併員工和管理員資料
      const employeeTeachers = (teachersData || []).map(teacher => ({
        ...teacher,
        type: 'employee' as const
      }));

      const adminTeachers = (adminsData || []).map(admin => ({
        id: admin.id,
        admin_name: admin.admin_name,
        teacher_email: admin.admin_email,
        teacher_role: admin.role,
        type: 'admin' as const
      }));

      const allTeachers = [...employeeTeachers, ...adminTeachers];
      
      console.log('合併後的教師資料:', allTeachers);
      console.log('員工數量:', employeeTeachers.length);
      console.log('管理員數量:', adminTeachers.length);
      setTeachers(allTeachers);

      // 設置預設教師為現時登入者（僅當沒有提供 defaultTeacher 時）
      if (!defaultTeacher?.id) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // 在教師列表中尋找當前用戶
            const currentUserTeacher = allTeachers.find(teacher => teacher.id === user.id);
            if (currentUserTeacher) {
              setSelectedTeacherId(user.id);
              console.log('設置預設教師為當前登入者:', currentUserTeacher);
            }
          }
        } catch (authError) {
          console.warn('無法獲取當前用戶資訊:', authError);
        }
      } else if (defaultTeacher.id) {
        // 如果提供了 defaultTeacher，確保 selectedTeacherId 被設置
        setSelectedTeacherId(defaultTeacher.id);
        console.log('使用傳入的 defaultTeacher:', defaultTeacher);
      }

      // 設置預設值 - 優先選擇有分配成長樹的學生
      if (studentsData && studentsData.length > 0) {
        if (isEditMode && initialData?.student_id) {
          // 編輯模式：使用 initialData 中的學生ID
          setSelectedStudentId(initialData.student_id);
          console.log('編輯模式：設置學生ID:', initialData.student_id);
        } else if (defaultStudent?.id) {
          // 新增模式：使用傳入的預設學生ID
          setSelectedStudentId(defaultStudent.id);
          console.log('新增模式：使用預設學生ID:', defaultStudent.id);
        } else {
          // 新增模式：選擇第一個學生
          setSelectedStudentId(studentsData[0].id);
          console.log('新增模式：設置預設學生ID:', studentsData[0].id);
        }
      }

    } catch (error) {
      console.error('載入資料失敗:', error);
      alert('載入學生和成長樹資料失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 載入學生的所有成長樹
  const loadStudentTrees = async (studentId: string, targetTreeId?: string, latestAssessmentData?: any) => {
    try {
      console.log('載入學生的成長樹:', studentId);
      
      // 先查詢符合 org_id 的成長樹ID列表
      let validTreeIds: string[] = [];
      if (validOrgId) {
        const { data: validTreesData, error: validTreesError } = await supabase
          .from('hanami_growth_trees')
          .select('id')
          .eq('is_active', true)
          .eq('org_id', validOrgId);
        
        if (validTreesError) {
          console.error('查詢符合 org_id 的成長樹失敗:', validTreesError);
        } else {
          validTreeIds = (validTreesData || []).map(t => t.id);
        }
      }
      
      // 載入學生在 hanami_student_trees 表中的所有成長樹
      let studentTreesQuery = supabase
        .from('hanami_student_trees')
        .select(`
          start_date,
          status,
          tree_id,
          hanami_growth_trees(
            id,
            tree_name,
            tree_description
          )
        `)
        .eq('student_id', studentId)
        .or('status.eq.active,tree_status.eq.active');
      
      // 如果有限制的成長樹ID列表，則過濾
      if (validOrgId && validTreeIds.length > 0) {
        studentTreesQuery = studentTreesQuery.in('tree_id', validTreeIds);
      } else if (validOrgId && validTreeIds.length === 0) {
        // 如果沒有符合的成長樹，查詢一個不存在的 ID 以確保不返回任何結果
        studentTreesQuery = studentTreesQuery.eq('tree_id', '00000000-0000-0000-0000-000000000000');
      }
      
      const { data: studentTreesData, error: studentTreesError } = await studentTreesQuery;

      if (studentTreesError) {
        console.error('載入學生成長樹失敗:', studentTreesError);
        throw studentTreesError;
      }

      // 轉換資料格式
      const formattedTrees = (studentTreesData || [])
        .filter(item => item.hanami_growth_trees !== null)
        .map((item: any) => ({
          id: item.hanami_growth_trees!.id,
          tree_name: item.hanami_growth_trees!.tree_name,
          tree_description: item.hanami_growth_trees!.tree_description,
          start_date: item.start_date,
          status: item.status
        }));

      console.log('學生的成長樹:', formattedTrees);
      setStudentTrees(formattedTrees);

      // 設置選中的成長樹
      if (formattedTrees.length > 0) {
        console.log('🔍 成長樹選擇決策開始:');
        console.log('  - targetTreeId:', targetTreeId);
        console.log('  - isEditMode:', isEditMode);
        console.log('  - latestAssessmentData:', latestAssessmentData);
        console.log('  - latestAssessment (狀態):', latestAssessment);
        
        let preferredTreeId = targetTreeId;
        
        // 編輯模式：使用 initialData 中的 tree_id
        if (isEditMode && initialData?.tree_id) {
          preferredTreeId = initialData.tree_id;
          console.log('📝 編輯模式：使用 initialData 的成長樹ID:', preferredTreeId);
        }
        // 新增模式：優先使用最新評估記錄的成長樹
        else if (!isEditMode && (latestAssessmentData?.tree_id || latestAssessment?.tree_id)) {
          preferredTreeId = latestAssessmentData?.tree_id || latestAssessment?.tree_id;
          console.log('🎯 新增模式：使用最新評估記錄的成長樹ID:', preferredTreeId);
          
          // 顯示成長樹名稱
          const selectedTreeName = formattedTrees.find(tree => tree.id === preferredTreeId)?.tree_name;
          console.log('🌳 對應的成長樹名稱:', selectedTreeName);
        }
        
        if (preferredTreeId) {
          const treeExists = formattedTrees.find(tree => tree.id === preferredTreeId);
          if (treeExists) {
            setSelectedTreeId(preferredTreeId);
            console.log('✅ 設置指定的成長樹ID:', preferredTreeId);
          } else {
            setSelectedTreeId(formattedTrees[0].id);
            console.log('⚠️ 找不到指定成長樹，使用第一個:', formattedTrees[0].id);
          }
        } else {
          setSelectedTreeId(formattedTrees[0].id);
          console.log('📝 設置第一個成長樹ID:', formattedTrees[0].id);
        }
      } else {
        setSelectedTreeId('');
        console.log('❌ 沒有可用的成長樹');
      }

    } catch (error) {
      console.error('載入學生成長樹失敗:', error);
      setStudentTrees([]);
      setSelectedTreeId('');
    }
  };

  // 載入評估記錄歷史
  const loadAssessmentHistory = async (studentId: string) => {
    try {
      console.log('🔍 載入學生評估記錄歷史:', studentId);
      
      const response = await fetch(`/api/student-assessment-history?student_id=${studentId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 成功載入評估記錄歷史:', {
          total_records: data.total_records,
          records_with_data: data.records_with_data,
          recommended_record: data.recommended_record?.id
        });
        
        setAssessmentHistory(data.assessments);
        
        // 設置推薦的記錄（有評估資料的最新記錄）
        if (data.recommended_record) {
          setSelectedAssessmentRecord(data.recommended_record);
          setLatestAssessment(data.recommended_record);
          console.log('📌 設置推薦記錄為預設:', data.recommended_record.assessment_date);
        }
        
        return data.recommended_record;
      } else {
        console.error('載入評估記錄歷史失敗:', data.error);
        setAssessmentHistory([]);
        return null;
      }
    } catch (error) {
      console.error('載入評估記錄歷史失敗:', error);
      setAssessmentHistory([]);
      return null;
    }
  };

  // 載入學生最新評估記錄（用於新增模式的預設值）
  const loadLatestAssessment = async (studentId: string, treeId?: string): Promise<any> => {
    try {
      console.log('📋 載入學生最新評估記錄:', { studentId, treeId });
      
      // 如果指定了成長樹，只載入該成長樹的最新評估
      if (treeId) {
        console.log('🎯 查詢指定成長樹的評估記錄:', treeId);
        const { data: treeAssessments, error: treeError } = await supabase
          .from('hanami_ability_assessments')
          .select('*')
          .eq('student_id', studentId)
          .eq('tree_id', treeId)
          .order('assessment_date', { ascending: false })
          .limit(1);
        
        if (!treeError && treeAssessments && treeAssessments.length > 0) {
          const latest = treeAssessments[0];
          console.log('✅ 找到指定成長樹的最新評估記錄:', latest);
          setLatestAssessment(latest);
          return latest;
        } else {
          console.log('⚠️ 指定成長樹沒有評估記錄');
          setLatestAssessment(null);
          return null;
        }
      }
      
      // 如果沒有指定成長樹，載入該學生的最新評估記錄（任何成長樹）
      console.log('🔍 查詢學生的任何成長樹評估記錄');
      const { data: allAssessments, error: allError } = await supabase
        .from('hanami_ability_assessments')
        .select('*')
        .eq('student_id', studentId)
        .order('assessment_date', { ascending: false })
        .limit(1);
      
      if (allError) {
        console.error('載入最新評估記錄失敗:', allError);
        throw allError;
      }
      
      if (allAssessments && allAssessments.length > 0) {
        const latest = allAssessments[0];
        console.log('✅ 找到學生的最新評估記錄:', latest);
        console.log('🎯 最新評估記錄的成長樹ID:', latest.tree_id);
        
        // 詳細檢查 selected_goals 和 ability_assessments 資料
        console.log('🔍 詳細資料結構檢查:');
        console.log('  - selected_goals 欄位:', latest.selected_goals);
        console.log('  - selected_goals 類型:', typeof latest.selected_goals);
        console.log('  - selected_goals 是否為陣列:', Array.isArray(latest.selected_goals));
        console.log('  - ability_assessments 欄位:', latest.ability_assessments);
        console.log('  - ability_assessments 類型:', typeof latest.ability_assessments);
        console.log('  - 完整記錄鍵值:', Object.keys(latest));
        
        setLatestAssessment(latest);
        return latest;
      } else {
        console.log('❌ 沒有找到歷史評估記錄');
        setLatestAssessment(null);
        return null;
      }
      
    } catch (error) {
      console.error('載入最新評估記錄失敗:', error);
      setLatestAssessment(null);
      return null;
    }
  };

  // 載入學生活動
  const loadStudentActivities = async () => {
    if (!selectedStudentId || !lessonDate) return;
    
    try {
      console.log('載入學生活動:', selectedStudentId, lessonDate);
      
      // 構建查詢參數
      const params = new URLSearchParams({
        studentId: selectedStudentId,
        lessonDate: lessonDate
      });
      
      // 添加 orgId 參數
      if (validOrgId) {
        params.append('orgId', validOrgId);
      }
      
      // 添加 timeslot 參數（如果有的話）
      // 這裡我們先不傳 timeslot，讓 API 處理沒有 timeslot 的情況
      
      const response = await fetch(`/api/student-activities?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 實現雙重顯示：將正在學習的活動同時顯示在本次課堂活動中
          const currentLessonActivities = result.data.currentLessonActivities || [];
          const ongoingActivities = result.data.ongoingActivities || [];
          const completedOngoingActivities = result.data.completedOngoingActivities || [];
          const previousLessonActivities = result.data.previousLessonActivities || [];
          
          console.log('原始數據:', {
            currentLessonActivities: currentLessonActivities.length,
            ongoingActivities: ongoingActivities.length,
            completedOngoingActivities: completedOngoingActivities.length,
            previousLessonActivities: previousLessonActivities.length
          });
          
          // 合併未完成和已完成的正在學習活動，供篩選器使用
          const allOngoingActivities = [
            ...ongoingActivities,
            ...completedOngoingActivities
          ];
          
          console.log('合併後的正在學習活動:', {
            未完成: ongoingActivities.length,
            已完成: completedOngoingActivities.length,
            總計: allOngoingActivities.length
          });
          
          // 創建一個 Map 來避免重複添加相同的活動
          const currentActivityMap = new Map();
          
          // 首先添加本次課堂的活動
          currentLessonActivities.forEach((activity: any) => {
            const key = activity.activityId || activity.id;
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
            const key = activity.activityId || activity.id;
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
            已完成正在學習活動: completedOngoingActivities.length,
            增強後本次課堂活動: enhancedCurrentLessonActivities.length,
            正在學習活動: allOngoingActivities.length,
            添加到本次課堂的ongoing活動: addedOngoingCount,
            過濾掉的已完成活動: filteredCompletedCount
          });
          
          // 設置增強後的活動數據，使用合併後的正在學習活動
          setStudentActivities({
            currentLessonActivities: enhancedCurrentLessonActivities,
            previousLessonActivities,
            ongoingActivities: allOngoingActivities // 使用合併後的活動列表
          });
          
          console.log('學生活動載入成功（已實現雙重顯示）:', {
            currentLessonActivities: enhancedCurrentLessonActivities,
            ongoingActivities: allOngoingActivities
          });
          
          // 新增：詳列 ongoingActivities 的每一筆關鍵欄位以偵錯自動安排邏輯的匹配
          try {
            const ongoing = result.data?.ongoingActivities || [];
            console.log('API 原始 ongoingActivities 條數:', ongoing.length);
            ongoing.forEach((a: any, idx: number) => {
              console.log(`ongoing[${idx}]`, {
                id: a?.id,
                activityId: a?.activityId,
                teachingActivityId: a?.teachingActivityId,
                activityName: a?.activityName,
                completionStatus: a?.completionStatus,
                progress: a?.progress,
                assignedAt: a?.assignedAt,
                raw_activity_id: a?._raw?.activity_id,
                raw_teaching_activity: a?._raw?.hanami_teaching_activities?.id
              });
            });
          } catch (e) {
            console.log('ongoingActivities 詳細日誌輸出失敗:', e);
          }
        } else {
          console.error('載入學生活動失敗:', result.error);
          // 設置空數據
          setStudentActivities({
            currentLessonActivities: [],
            previousLessonActivities: [],
            ongoingActivities: []
          });
        }
      } else {
        console.error('載入學生活動失敗:', response.statusText);
        // 設置空數據
        setStudentActivities({
          currentLessonActivities: [],
          previousLessonActivities: [],
          ongoingActivities: []
        });
      }
    } catch (error) {
      console.error('載入學生活動失敗:', error);
      // 設置空數據
      setStudentActivities({
        currentLessonActivities: [],
        previousLessonActivities: [],
        ongoingActivities: []
      });
    }
  };

  const loadTreeGoalsAndAbilities = async (treeId: string) => {
    try {
      setLoading(true);
      
      // 載入成長樹的目標（根據 org_id 過濾）
      let goalsQuery = supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId);
      
      if (validOrgId) {
        goalsQuery = goalsQuery.eq('org_id', validOrgId);
      } else {
        // 如果沒有 orgId，查詢一個不存在的 UUID 以確保不返回任何結果
        goalsQuery = goalsQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
      }
      
      const { data: goalsData, error: goalsError } = await goalsQuery.order('goal_order');

      if (goalsError) throw goalsError;

      // 提取所有需要的能力ID
      const abilityIds = new Set<string>();
      (goalsData || []).forEach(goal => {
        if (goal.required_abilities) {
          goal.required_abilities.forEach((abilityId: string) => {
            abilityIds.add(abilityId);
          });
        }
      });

      // 載入能力詳細資訊
      let abilitiesData: any[] = [];
      if (abilityIds.size > 0) {
        const { data: abilitiesResult, error: abilitiesError } = await supabase
          .from('hanami_development_abilities')
          .select('*')
          .in('id', Array.from(abilityIds))
          .order('ability_name');

        if (abilitiesError) throw abilitiesError;
        abilitiesData = abilitiesResult || [];
        
        // 載入能力等級內容
        const { data: levelContentsData, error: levelContentsError } = await supabase
          .from('hanami_ability_levels')
          .select('*')
          .in('ability_id', Array.from(abilityIds))
          .order('level');

        if (!levelContentsError && levelContentsData) {
          // 將等級內容組織到能力中
          const levelContentsMap = new Map();
          levelContentsData.forEach(levelContent => {
            if (!levelContentsMap.has(levelContent.ability_id)) {
              levelContentsMap.set(levelContent.ability_id, {});
            }
            levelContentsMap.get(levelContent.ability_id)[levelContent.level] = {
              level_title: levelContent.level_title,
              level_description: levelContent.level_description
            };
          });

          abilitiesData = abilitiesData.map(ability => ({
            ...ability,
            level_contents: levelContentsMap.get(ability.id) || {}
          }));
        }
      }

      // 載入學生的能力進度記錄
      if (selectedStudentId) {
        const { data: progressData, error: progressError } = await supabase
          .from('hanami_student_abilities')
          .select('*')
          .eq('student_id', selectedStudentId)
          .eq('tree_id', treeId);

        if (!progressError && progressData) {
          console.log('載入的進度資料:', progressData);
          
          // 將進度資料合併到能力中
          const progressMap = new Map();
          progressData.forEach(progress => {
            progressMap.set(progress.ability_id, progress);
          });

          console.log('進度資料映射:', Object.fromEntries(progressMap));
          
          // 載入歷史評估資料並設置初始值
          const { data: assessmentData, error: assessmentError } = await supabase
            .from('hanami_ability_assessments')
            .select('*')
            .eq('student_id', selectedStudentId)
            .eq('tree_id', treeId)
            .order('assessment_date', { ascending: false })
            .limit(1);

          let latestAssessment: any = null;
          if (!assessmentError && assessmentData && assessmentData.length > 0) {
            latestAssessment = assessmentData[0];
            setOverallRating(latestAssessment.overall_performance_rating || 1);
            setGeneralNotes(latestAssessment.general_notes || '');
            setNextFocus(latestAssessment.next_lesson_focus || '');
          }

          abilitiesData = abilitiesData.map(ability => {
            const progress = progressMap.get(ability.id);
            return {
              ...ability,
              current_level: progress?.current_level || 0,
              progress_percentage: progress?.progress_percentage || 0
            };
          });

          // 設置目標評估的初始值
          const initialGoalAssessments: {[key: string]: any} = {};
          const initialMultiSelectAssessments: {[key: string]: string[]} = {};

          // 優先從 initialData（編輯模式）讀取，然後從狀態中的最新評估記錄讀取，最後使用本次查詢的結果
          const stateLatestAssessment = selectedAssessmentRecord || latestAssessment; // 從狀態獲取用戶選擇的記錄
          const sourceAssessment = isEditMode && initialData ? initialData : (stateLatestAssessment || assessmentData?.[0]);
          console.log('🔍 目標初始化資料來源:');
          console.log('  - isEditMode:', isEditMode);
          console.log('  - 用戶選擇的記錄 selectedAssessmentRecord:', selectedAssessmentRecord);
          console.log('  - 狀態中的 latestAssessment:', latestAssessment);
          console.log('  - 最終狀態記錄 stateLatestAssessment:', stateLatestAssessment);
          console.log('  - 本次查詢的 assessmentData:', assessmentData?.[0]);
          console.log('  - 最終使用的 sourceAssessment:', sourceAssessment);
          console.log('  - sourceAssessment?.selected_goals:', sourceAssessment?.selected_goals);
          console.log('  - sourceAssessment?.ability_assessments:', sourceAssessment?.ability_assessments);
          
          if (sourceAssessment) {
            // 檢查成長樹是否匹配（編輯模式下總是匹配，新增模式下需要檢查）
            const treeMatches = isEditMode || sourceAssessment.tree_id === treeId;
            console.log('🔍 成長樹匹配檢查:', {
              isEditMode,
              sourceTreeId: sourceAssessment.tree_id,
              currentTreeId: treeId,
              treeMatches
            });

            if (sourceAssessment.selected_goals && sourceAssessment.selected_goals.length > 0 && treeMatches) {
              console.log('✅ 成長樹匹配，從 selected_goals 讀取評估資料:', sourceAssessment.selected_goals);
              console.log('資料來源:', isEditMode && initialData ? 'initialData' : 'latestAssessment');
              
              sourceAssessment.selected_goals.forEach((goalData: any) => {
                const { goal_id, assessment_mode, progress_level, selected_levels } = goalData;
                console.log(`🎯 處理歷史目標評估: ${goal_id}`, {
                  assessment_mode,
                  progress_level,
                  selected_levels
                });
                
                if (assessment_mode === 'multi_select') {
                  if (selected_levels && selected_levels.length > 0) {
                    initialMultiSelectAssessments[goal_id] = selected_levels;
                    console.log(`✅ 設置目標 ${goal_id} 的多選初始值:`, selected_levels);
                  }
                } else if (assessment_mode === 'progress') {
                  if (progress_level && progress_level > 0) {
                    initialGoalAssessments[goal_id] = { level: progress_level };
                    console.log(`✅ 設置目標 ${goal_id} 的進度初始值:`, progress_level);
                  }
                }
              });
            } else if (sourceAssessment.selected_goals && sourceAssessment.selected_goals.length > 0 && !treeMatches) {
              console.warn('⚠️ 成長樹不匹配，跳過歷史評估資料應用');
              console.warn('  - 評估記錄成長樹:', sourceAssessment.tree_id);
              console.warn('  - 當前成長樹:', treeId);
            } else {
              console.log('ℹ️ 沒有可用的 selected_goals 資料');
            }
          }

          console.log('📊 開始處理當前成長樹的目標:');
          console.log('  - 當前成長樹目標數量:', goalsData?.length || 0);
          console.log('  - 歷史目標評估數量:', Object.keys(initialGoalAssessments).length);
          console.log('  - 歷史多選評估數量:', Object.keys(initialMultiSelectAssessments).length);
          
          (goalsData || []).forEach(goal => {
            console.log(`🎯 處理當前目標 ${goal.id}:`, goal.goal_name);
            console.log(`目標評估模式:`, (goal as any).assessment_mode);
            console.log(`目標所需能力:`, goal.required_abilities);
            
            // 檢查是否有歷史評估資料
            const hasHistoryGoal = initialGoalAssessments[goal.id];
            const hasHistoryMultiSelect = initialMultiSelectAssessments[goal.id];
            console.log(`歷史進度評估:`, hasHistoryGoal);
            console.log(`歷史多選評估:`, hasHistoryMultiSelect);
            
            // 如果已經有歷史評估資料，跳過重新計算
            if (hasHistoryGoal || hasHistoryMultiSelect) {
              console.log(`⏭️ 目標 ${goal.id} 已有歷史評估資料，跳過重新計算`);
              return;
            }
            
            if ((goal as any).assessment_mode === 'multi_select') {
              // 多選模式：從進度資料中獲取選中的等級
              const goalAbilities = goal.required_abilities || [];
              const selectedLevels: string[] = [];
              
              console.log(`目標 ${goal.id} 的多選等級:`, (goal as any).multi_select_levels);
              
              if (goalAbilities.length > 0) {
                // 有關聯能力的情況
                goalAbilities.forEach((abilityId: any) => {
                  const progress = progressMap.get(abilityId);
                  console.log(`能力 ${abilityId} 的進度資料:`, progress);
                  if (progress && progress.selected_levels) {
                    console.log(`能力 ${abilityId} 的選中等級:`, progress.selected_levels);
                    // 只添加不重複的等級
                    progress.selected_levels.forEach((level: any) => {
                      if (!selectedLevels.includes(level)) {
                        selectedLevels.push(level);
                      }
                    });
                  }
                });
              } else {
                // 沒有關聯能力的情況：直接從目標ID查找虛擬能力記錄
                const virtualProgress = progressMap.get(goal.id);
                console.log(`目標 ${goal.id} 的虛擬能力記錄:`, virtualProgress);
                if (virtualProgress && virtualProgress.selected_levels) {
                  console.log(`目標 ${goal.id} 的虛擬選中等級:`, virtualProgress.selected_levels);
                  selectedLevels.push(...virtualProgress.selected_levels);
                }
              }
              
              console.log(`目標 ${goal.id} 的最終選中等級:`, selectedLevels);
              
              if (selectedLevels.length > 0) {
                initialMultiSelectAssessments[goal.id] = selectedLevels;
                console.log(`設置目標 ${goal.id} 的多選初始值:`, selectedLevels);
              }
            } else {
              // 進度模式：從進度資料中獲取等級
              const goalAbilities = goal.required_abilities || [];
              let totalLevel = 0;
              let abilityCount = 0;
              
              if (goalAbilities.length > 0) {
                // 有關聯能力的情況
                goalAbilities.forEach((abilityId: any) => {
                  const progress = progressMap.get(abilityId);
                  if (progress && progress.current_level) {
                    totalLevel += progress.current_level;
                    abilityCount++;
                  }
                });
              } else {
                // 沒有關聯能力的情況：直接從目標ID查找虛擬能力記錄
                const virtualProgress = progressMap.get(goal.id);
                console.log(`目標 ${goal.id} 的虛擬能力記錄:`, virtualProgress);
                if (virtualProgress && virtualProgress.current_level) {
                  totalLevel = virtualProgress.current_level;
                  abilityCount = 1;
                }
              }
              
              if (abilityCount > 0) {
                const averageLevel = Math.round(totalLevel / abilityCount);
                initialGoalAssessments[goal.id] = { level: averageLevel };
                console.log(`設置目標 ${goal.id} 的進度初始值:`, averageLevel);
              }
            }
          });

          console.log('📝 準備設置狀態:');
          console.log('  - 目標評估初始值:', initialGoalAssessments);
          console.log('  - 多選評估初始值:', initialMultiSelectAssessments);
          
          // 使用函數式更新確保狀態正確設置
          setGoalAssessments(prev => {
            console.log('🔄 setGoalAssessments 回調執行:', {
              previous: prev,
              new: initialGoalAssessments
            });
            return initialGoalAssessments;
          });
          
          setMultiSelectAssessments(prev => {
            console.log('🔄 setMultiSelectAssessments 回調執行:', {
              previous: prev,
              new: initialMultiSelectAssessments
            });
            return initialMultiSelectAssessments;
          });

          // 強制重新渲染 - 延遲設置狀態確保組件重新渲染
          setTimeout(() => {
            console.log('🔄 強制重新設置狀態以確保UI更新');
            setGoalAssessments(initialGoalAssessments);
            setMultiSelectAssessments(initialMultiSelectAssessments);
          }, 100);
          console.log('  - 當前成長樹ID:', treeId);
          console.log('  - 評估記錄來源成長樹ID:', sourceAssessment?.tree_id);
          
          // 檢查成長樹ID是否匹配
          if (sourceAssessment && sourceAssessment.tree_id !== treeId) {
            console.warn('⚠️ 警告：評估記錄來自不同的成長樹！');
            console.warn('  - 當前成長樹:', treeId);
            console.warn('  - 評估記錄成長樹:', sourceAssessment.tree_id);
          }

          // 設置能力評估的初始值（從最新評估記錄）
          if (sourceAssessment && sourceAssessment.ability_assessments) {
            console.log('🎯 從最新評估記錄初始化能力評估:', sourceAssessment.ability_assessments);
            setAbilityAssessments(sourceAssessment.ability_assessments);
            
            // 同時設置其他表單欄位
            if (!isEditMode) {
              if (sourceAssessment.overall_performance_rating) {
                setOverallRating(sourceAssessment.overall_performance_rating);
                console.log('📊 設置整體表現評分:', sourceAssessment.overall_performance_rating);
              }
              if (sourceAssessment.general_notes) {
                setGeneralNotes(sourceAssessment.general_notes);
                console.log('📝 設置一般註記:', sourceAssessment.general_notes);
              }
              if (sourceAssessment.next_lesson_focus) {
                setNextFocus(sourceAssessment.next_lesson_focus);
                console.log('🎯 設置下次課程重點:', sourceAssessment.next_lesson_focus);
              }
            }
          }

          // 計算目標完成度
          const goalsWithProgress = (goalsData || []).map(goal => {
            if (!goal.required_abilities || goal.required_abilities.length === 0) {
              return { ...goal, is_completed: false, completion_percentage: 0 };
            }

            const requiredAbilities = goal.required_abilities.map((abilityId: any) => 
              abilitiesData.find(activity => activity.id === abilityId)
            ).filter(Boolean);

            if (requiredAbilities.length === 0) {
              return { ...goal, is_completed: false, completion_percentage: 0 };
            }

            // 根據評估模式計算完成度
            if ((goal as any).assessment_mode === 'multi_select') {
              // 多選模式：檢查是否有選中的等級
              const completedAbilities = requiredAbilities.filter((ability: any) => {
                const progress = progressMap.get(ability.id);
                return progress && progress.selected_levels && progress.selected_levels.length > 0;
              });
              const completionPercentage = Math.round((completedAbilities.length / requiredAbilities.length) * 100);
              const isCompleted = completionPercentage >= 100;
              
              return {
                ...goal,
                is_completed: isCompleted,
                completion_percentage: completionPercentage
              };
            } else {
              // 進度模式：計算平均進度
            const totalProgress = requiredAbilities.reduce((sum: number, ability: any) => {
                const progress = progressMap.get(ability.id);
                return sum + (progress?.progress_percentage || 0);
            }, 0);

            const completionPercentage = Math.round(totalProgress / requiredAbilities.length);
            const isCompleted = completionPercentage >= 100;

            return {
              ...goal,
              is_completed: isCompleted,
              completion_percentage: completionPercentage
            };
            }
          });

          setGoals(goalsWithProgress);
        } else {
          // 如果沒有進度資料，設置預設值
          abilitiesData = abilitiesData.map(ability => ({
            ...ability,
            current_level: 0,
            progress_percentage: 0
          }));

          const goalsWithDefault = (goalsData || []).map(goal => ({
            ...goal,
            is_completed: false,
            completion_percentage: 0
          }));

          setGoals(goalsWithDefault);
        }
      } else {
        // 如果沒有選擇學生，設置預設值
        abilitiesData = abilitiesData.map(ability => ({
          ...ability,
          current_level: 0,
          progress_percentage: 0
        }));

        const goalsWithDefault = (goalsData || []).map(goal => ({
          ...goal,
          is_completed: false,
          completion_percentage: 0
        }));

        setGoals(goalsWithDefault);
      }

      // 修復過往評估記錄的顯示問題
      if (initialData && (goalsData || []).length > 0 && (abilitiesData || []).length > 0) {
        console.log('🔧 在載入目標和能力後修復評估記錄');
        const fixedInitialData = fixHistoricalAssessmentData(initialData, goalsData || [], abilitiesData);
        
        // 更新狀態中的評估資料
        setAbilityAssessments(fixedInitialData.ability_assessments || {});
        setSelectedGoals(fixedInitialData.selected_goals || []);
        
        console.log('✅ 評估記錄修復完成');
      }

      setAbilities(abilitiesData);

    } catch (error) {
      console.error('載入成長樹資料失敗:', error);
      alert('載入成長樹目標和能力資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const updateAbilityAssessment = (abilityId: string, field: string, value: any) => {
    setAbilityAssessments(prev => ({
      ...prev,
      [abilityId]: {
        ...prev[abilityId],
        [field]: value
      }
    }));
  };

  const updateGoalAssessment = (goalId: string, field: string, value: any) => {
    setGoalAssessments(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }));
    console.log(`目標評估更新: ${goalId} - ${field} = ${value}`);
  };

  // 處理多選模式評估變更
  const handleMultiSelectAssessmentChange = (goalId: string, level: string, checked: boolean) => {
    setMultiSelectAssessments(prev => {
      const currentLevels = prev[goalId] || [];
      if (checked) {
        return {
          ...prev,
          [goalId]: [...currentLevels, level]
        };
      } else {
        return {
          ...prev,
          [goalId]: currentLevels.filter(l => l !== level)
        };
      }
    });
  };

  const getLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // 活動卡片組件
  const ActivityCard = ({ 
    activity, 
    type, 
    area,
    onEdit,
    onSave,
    onCancel,
    onReset,
    onDelete,
    isEditing,
    tempProgress,
    onProgressChange
  }: { 
    activity: any; 
    type: 'current' | 'previous' | 'ongoing'; 
    area: 'current_lesson' | 'ongoing';
    onEdit?: (activityId: string, clickedArea: "current_lesson" | "ongoing") => void;
    onSave?: (activityId: string) => Promise<void>;
    onCancel?: (activityId: string) => void;
    onReset?: (activityId: string) => void;
    onDelete?: (activityId: string) => void;
    isEditing?: boolean;
    tempProgress?: number;
    onProgressChange?: (activityId: string, progress: number) => void;
  }) => {
    const isEditingLocal = isEditing || editingActivityId === activity.id;
    const currentProgress = isEditingLocal ? (tempProgress || 0) : (activity.progress || 0);
    const isNotStarted = activity.completionStatus === 'not_started';
    
    const getStatusText = () => {
      if (currentProgress >= 100) return '已完成';
      if (currentProgress > 0) return '進行中';
      return '未開始';
    };

    const getDifficultyColor = (level: number) => {
      switch (level) {
        case 1: return 'bg-green-100 text-green-800';
        case 2: return 'bg-blue-100 text-blue-800';
        case 3: return 'bg-yellow-100 text-yellow-800';
        case 4: return 'bg-orange-100 text-orange-800';
        case 5: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    // 決定是否顯示編輯按鈕
    // 在「正在學習的活動」區域中，所有活動都可以編輯
    // 在「本次課堂活動」區域中，只有 source !== 'ongoing' 的活動可以編輯
    const canEdit = area === 'ongoing' || (area === 'current_lesson' && activity.source !== 'ongoing');
    
    // 調試日誌
    console.log('ActivityCard 調試:', {
      activityId: activity.id,
      activityName: activity.activityName,
      area,
      source: activity.source,
      canEdit,
      type
    });

    return (
      <div className="p-4 bg-white border border-[#EADBC8] rounded-lg hover:border-[#D4A5A5] transition-all duration-200">
        {/* 活動標題區域 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="font-medium text-sm text-[#2B3A3B] flex items-center gap-2">
              <span>{getStatusText()}</span>
              <span>{activity.activityName}</span>
              {/* 顯示活動來源標記 */}
              {activity.source && (
                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                  activity.source === 'ongoing' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {activity.source === 'ongoing' ? (
                    <>
                      <ArrowPathIcon className="w-3 h-3" />
                      正在學習
                    </>
                  ) : (
                    <>
                      <BookOpenIcon className="w-3 h-3" />
                      本次課堂
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="text-xs text-[#A68A64] mt-1">{activity.activityDescription}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(activity.difficultyLevel)}`}>
              難度 {activity.difficultyLevel}
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
              {activity.activityType}
            </span>
            {/* 根據區域和來源決定是否顯示編輯按鈕 */}
            {canEdit && (
              <button
                className="p-1 text-gray-500 hover:text-[#A68A64] transition-colors"
                onClick={() => handleActivityEdit(activity.id, area)}
                title="編輯進度"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {type !== 'previous' && (
              <button
                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                onClick={() => handleActivityDelete(activity.id)}
                title="刪除活動"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 進度編輯區域 */}
        {isEditingLocal && canEdit && (
          <div className="mb-3 p-3 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
            <h6 className="text-xs font-medium text-[#2B3A3B] mb-2">編輯完成進度</h6>
            
            {/* 進度條 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#2B3A3B]">進度</span>
                <span className="text-xs text-[#A68A64] font-medium">{currentProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentProgress}
                onChange={(e) => handleProgressChange(activity.id, parseInt(e.target.value))}
                className="w-full h-3 bg-[#F5F0EB] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #E8B4A0 0%, #E8B4A0 ${currentProgress}%, #F5F0EB ${currentProgress}%, #F5F0EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-[#8B7355] mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* 快速設定按鈕 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-[#2B3A3B] mb-2">快速設定:</div>
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map((progress) => (
                  <button
                    key={progress}
                    className={`px-3 py-1 text-xs rounded-lg transition-all duration-200 ${
                      currentProgress === progress
                        ? 'bg-[#E8B4A0] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleProgressChange(activity.id, progress)}
                  >
                    {progress}%
                  </button>
                ))}
              </div>
            </div>

            {/* 狀態顯示 */}
            <div className="mb-3">
              <span className="text-xs text-[#2B3A3B]">
                狀態: {currentProgress >= 100 ? '已完成' : currentProgress > 0 ? '進行中' : '未開始'}
              </span>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                onClick={() => handleProgressSave(activity.id)}
              >
                儲存
              </button>
              <button
                className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                onClick={() => handleProgressCancel(activity.id)}
              >
                取消
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                onClick={() => handleProgressReset(activity.id)}
              >
                重設
              </button>
            </div>
          </div>
        )}

        {/* 進度顯示（非編輯模式） */}
        {!isEditing && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#2B3A3B]">完成進度</span>
              <span className="text-xs text-[#A68A64]">{currentProgress}%</span>
            </div>
            <div className="w-full bg-[#F5F0EB] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5] h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 分配時間 */}
        <div className="text-xs text-[#87704e]">
          分配時間: {activity.assignedAt ? new Date(activity.assignedAt).toLocaleDateString('zh-TW') : '未知'}
        </div>
      </div>
    );
  };

  // 處理活動選擇
  const handleActivitySelection = (type: 'current' | 'ongoing') => {
    setCurrentActivityType(type);
    setShowActivitySelectionModal(true);
  };

  const handleActivityAssigned = async (newActivity: any) => {
    console.log('收到活動分配通知:', newActivity);
    
    // 立即更新本地狀態，讓用戶立即看到新分配的活動
    setStudentActivities(prev => ({
      ...prev,
      ongoingActivities: [...prev.ongoingActivities, newActivity]
    }));
    
    console.log('本地狀態已更新，新活動立即顯示');
    
    // 在背景重新載入數據以確保數據一致性
    try {
      console.log('開始在背景重新載入活動數據...');
      await loadStudentActivities();
      console.log('活動數據重新載入完成');
    } catch (error) {
      console.error('重新載入活動數據失敗:', error);
      // 如果重新載入失敗，本地狀態已經更新，用戶仍能看到新活動
    }
  };

  // 處理活動編輯
  const handleActivityEdit = (activityId: string, clickedArea: 'current_lesson' | 'ongoing') => {
    console.log('handleActivityEdit 被調用，activityId:', activityId, 'clickedArea:', clickedArea);
    
    // 檢查活動是否為正在學習的活動，如果是則不允許編輯
    const activity = [...studentActivities.currentLessonActivities, ...studentActivities.ongoingActivities]
      .find(a => a.id === activityId);
    
    console.log('找到的活動:', activity);
    
    // 根據點擊的區域來決定是否允許編輯
    // 如果在「正在學習的活動」區域點擊，則允許編輯
    // 如果在「本次課堂活動」區域點擊且來源為 ongoing，則不允許編輯
    const isOngoingSource = activity?.source === 'ongoing';
    
    console.log('編輯檢查:', {
      clickedArea,
      isOngoingSource,
      shouldBlock: clickedArea === 'current_lesson' && isOngoingSource
    });
    
    if (clickedArea === 'current_lesson' && isOngoingSource) {
      console.log('正在學習的活動不能在「本次課堂活動」區域編輯進度:', activity);
      toast.error('正在學習的活動需要在「正在學習的活動」區域進行進度修改');
      return;
    }
    
    console.log('允許編輯，設置編輯狀態');
    setEditingActivityId(activityId);
    // 初始化臨時進度
    if (activity) {
      setTempProgress(prev => ({
        ...prev,
        [activityId]: activity.progress || 0
      }));
    }
  };

  // 處理進度變更
  const handleProgressChange = (activityId: string, progress: number) => {
    setTempProgress(prev => ({
      ...prev,
      [activityId]: progress
    }));
  };

  // 處理進度保存
  const handleProgressSave = async (activityId: string) => {
    try {
      const progress = tempProgress[activityId] || 0;
      
      const response = await fetch('/api/update-activity-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activityId,
          progress: progress
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('進度更新成功');
          
          // 立即更新本地狀態，確保活動正確顯示
          setStudentActivities(prev => {
            const updated = {
              ...prev,
              currentLessonActivities: prev.currentLessonActivities.map(activity => 
                activity.id === activityId 
                  ? { ...activity, progress: progress }
                  : activity
              ),
              ongoingActivities: prev.ongoingActivities.map(activity => 
                activity.id === activityId 
                  ? { ...activity, progress: progress }
                  : activity
              )
            };
            
            console.log('本地狀態更新調試:', {
              activityId,
              newProgress: progress,
              updatedCurrentLesson: updated.currentLessonActivities.filter(a => a.id === activityId),
              updatedOngoing: updated.ongoingActivities.filter(a => a.id === activityId)
            });
            
            return updated;
          });
          
          // 清除編輯狀態
          setEditingActivityId(null);
          
          // 如果活動完成（進度 >= 100%），自動切換到「已完成」篩選器
          if (progress >= 100) {
            setActivityFilter('completed');
            setShowCompletionMessage(true);
            // 3秒後隱藏完成訊息
            setTimeout(() => {
              setShowCompletionMessage(false);
            }, 3000);
          }
          
          // 在背景重新載入數據以確保數據一致性
          try {
            await loadStudentActivities();
          } catch (error) {
            console.error('重新載入活動數據失敗:', error);
          }
        } else {
          console.error('進度更新失敗:', result.error);
          alert('進度更新失敗: ' + result.error);
        }
      } else {
        console.error('進度更新失敗:', response.statusText);
        alert('進度更新失敗');
      }
    } catch (error) {
      console.error('進度更新失敗:', error);
      alert('進度更新失敗: ' + (error as Error).message);
    }
  };

  // 處理進度取消
  const handleProgressCancel = (activityId: string) => {
    setEditingActivityId(null);
    // 重置臨時進度
    setTempProgress(prev => {
      const newTemp = { ...prev };
      delete newTemp[activityId];
      return newTemp;
    });
  };

  // 處理進度重設
  const handleProgressReset = (activityId: string) => {
    setTempProgress(prev => ({
      ...prev,
      [activityId]: 0
    }));
  };

  // 篩選活動
  const getFilteredActivities = (activities: any[]) => {
    console.log('篩選活動調試:', {
      activityFilter,
      totalActivities: activities.length,
      activitiesWithProgress: activities.map(a => ({
        id: a.id,
        name: a.activityName,
        progress: a.progress,
        progressType: typeof a.progress,
        source: a.source,
        completionStatus: a.completionStatus
      }))
    });
    
    let filteredActivities;
    switch (activityFilter) {
      case 'completed':
        filteredActivities = activities.filter(activity => (activity.progress || 0) >= 100);
        console.log('已完成篩選結果:', {
          filter: 'completed',
          count: filteredActivities.length,
          activities: filteredActivities.map(a => ({
            id: a.id,
            name: a.activityName,
            progress: a.progress,
            completionStatus: a.completionStatus
          }))
        });
        return filteredActivities;
      case 'incomplete':
        filteredActivities = activities.filter(activity => (activity.progress || 0) < 100);
        console.log('未完成篩選結果:', {
          filter: 'incomplete',
          count: filteredActivities.length,
          activities: filteredActivities.map(a => ({
            id: a.id,
            name: a.activityName,
            progress: a.progress,
            completionStatus: a.completionStatus
          }))
        });
        return filteredActivities;
      default:
        console.log('全部篩選結果:', {
          filter: 'all',
          count: activities.length
        });
        return activities;
    }
  };

  // 處理活動刪除
  const handleActivityDelete = async (activityId: string) => {
    if (!confirm('確定要刪除此活動嗎？')) return;
    
    try {
      const response = await fetch('/api/remove-single-student-activity', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activityId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('活動刪除成功');
          // 重新載入活動
          await loadStudentActivities();
        } else {
          console.error('活動刪除失敗:', result.error);
          alert('活動刪除失敗: ' + result.error);
        }
      } else {
        console.error('活動刪除失敗:', response.statusText);
        alert('活動刪除失敗');
      }
    } catch (error) {
      console.error('活動刪除失敗:', error);
      alert('活動刪除失敗: ' + (error as Error).message);
    }
  };

  // 處理活動分配成功
  const handleActivityAssignmentSuccess = async (selectedActivities: any[]) => {
    try {
      console.log('處理活動分配:', selectedActivities);
      
      if (selectedActivities.length === 0) {
        setShowActivitySelectionModal(false);
        return;
      }

      // 準備活動分配數據
      const activityIds = selectedActivities.map(activity => activity.id);
      const assignmentType = currentActivityType === 'current' ? 'current_lesson' : 'ongoing';
      
      // 如果分配類型是 current_lesson，同時也分配為 ongoing
      if (assignmentType === 'current_lesson') {
        // 先分配為 current_lesson
        const currentLessonResponse = await fetch('/api/assign-student-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: selectedStudentId,
            activityIds: activityIds,
            assignmentType: 'current_lesson',
            lessonDate: lessonDate,
            timeslot: '12:00:00',
            ...(validOrgId ? { orgId: validOrgId } : {})
          }),
        });

        if (!currentLessonResponse.ok) {
          const result = await currentLessonResponse.json();
          throw new Error(result.error || '分配本次課堂活動失敗');
        }

        // 再分配為 ongoing
        const ongoingResponse = await fetch('/api/assign-student-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: selectedStudentId,
            activityIds: activityIds,
            assignmentType: 'ongoing',
            lessonDate: lessonDate,
            ...(validOrgId ? { orgId: validOrgId } : {})
          }),
        });

        if (!ongoingResponse.ok) {
          const result = await ongoingResponse.json();
          throw new Error(result.error || '分配正在學習活動失敗');
        }

        console.log('活動分配成功：同時分配為本次課堂活動和正在學習活動');
        await loadStudentActivities();
        setShowActivitySelectionModal(false);
        return;
      } else {
        // 只分配為 ongoing
        const response = await fetch('/api/assign-student-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: selectedStudentId,
            activityIds: activityIds,
            assignmentType: 'ongoing',
            lessonDate: lessonDate,
            ...(validOrgId ? { orgId: validOrgId } : {})
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || '分配正在學習活動失敗');
        }

        console.log('活動分配成功：分配為正在學習活動');
        await loadStudentActivities();
        setShowActivitySelectionModal(false);
        return;
      }

    } catch (error) {
      console.error('活動分配失敗:', error);
      alert('活動分配失敗: ' + (error as Error).message);
    } finally {
      setShowActivitySelectionModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedTreeId) {
      alert('請選擇學生和成長樹');
      return;
    }

    try {
      setLoading(true);
      
      console.log('準備提交評估資料...');
      console.log('學生:', selectedStudent.full_name);
      console.log('成長樹:', selectedTreeId);
      console.log('能力評估:', abilityAssessments);
      console.log('目標評估:', goalAssessments);
      console.log('多選評估:', multiSelectAssessments);

      // 嘗試獲取當前用戶ID（如果可用）
      let currentTeacherId: string | undefined;
      if (selectedTeacherId) {
        // 使用選擇的教師ID
        currentTeacherId = selectedTeacherId;
        console.log('使用選擇的教師ID:', currentTeacherId);
      } else {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            currentTeacherId = user.id;
            console.log('使用當前用戶ID:', currentTeacherId);
          }
        } catch (authError) {
          console.warn('無法獲取當前用戶ID:', authError);
        }
      }

      // 準備評估資料給父組件處理
      const assessment: AbilityAssessment = {
        student_id: selectedStudent.id,
        tree_id: selectedTreeId,
        assessment_date: assessmentDate,
        lesson_date: lessonDate,
        teacher_id: currentTeacherId,
        ability_assessments: abilityAssessments,
        overall_performance_rating: overallRating,
        general_notes: generalNotes,
        next_lesson_focus: nextFocus
      };

      // 準備目標評估資料（用於 API 調用）
      const goalsData = goals.map(goal => {
        if ((goal as any).assessment_mode === 'multi_select') {
          return {
            goal_id: goal.id,
            assessment_mode: 'multi_select' as const,
            selected_levels: multiSelectAssessments[goal.id] || []
          };
        } else {
          const goalAssessment = goalAssessments[goal.id];
          return {
            goal_id: goal.id,
            assessment_mode: 'progress' as const,
            progress_level: goalAssessment?.level || 0
          };
        }
      });

      console.log('目標評估資料準備完成:', {
        goalsCount: goalsData.length,
        goalAssessments,
        multiSelectAssessments,
        goalsData
      });

      // 將目標資料添加到評估物件中（用於父組件處理）
      const assessmentWithGoals = {
        ...assessment,
        goals: goalsData
      };

      console.log('準備調用父組件的 onSubmit');
      console.log('assessmentWithGoals:', assessmentWithGoals);
      console.log('目標評估數量:', assessmentWithGoals.goals?.length || 0);
      console.log('onSubmit 函數:', onSubmit);
      
      try {
        onSubmit(assessmentWithGoals);
        console.log('✅ onSubmit 調用成功');
      } catch (error) {
        console.error('❌ onSubmit 調用失敗:', error);
        throw error;
      }
      
      onClose();
      
    } catch (error) {
      console.error('準備評估資料失敗:', error);
      alert('準備評估資料失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // const selectedTree = trees.find(tree => tree.id === selectedTreeId); // 移除此行

  // 等級選擇進度條組件
  const LevelProgressBar = ({ 
    current, 
    maxLevel, 
    label, 
    onLevelChange,
    interactive = true,
    progressContents = [], // 每個等級對應的內容
    showCompletion = true, // 是否顯示完成度
    lastAssessment = null // 上一次評估資料
  }: {
    current: number;
    maxLevel: number;
    label: string;
    onLevelChange?: (level: number) => void;
    interactive?: boolean;
    progressContents?: string[];
    showCompletion?: boolean;
    lastAssessment?: {
      level: number;
      date: string;
      teacher_name?: string;
    } | null;
  }) => {
    const handleLevelClick = (level: number) => {
      if (interactive && onLevelChange) {
        onLevelChange(level);
      }
    };
    
    const completionPercentage = maxLevel > 0 ? Math.round((current / maxLevel) * 100) : 0;
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#2B3A3B]">{label}</span>
            {current > 0 && (
              <span className="text-blue-600 text-sm">📊 已評估 (等級 {current})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A68A64]">
              等級 {current} / {maxLevel}
            </span>
            {showCompletion && (
              <span className="text-sm font-medium text-[#E8B4A0]">
                ({completionPercentage}%)
              </span>
            )}
          </div>
        </div>
        
        {/* 等級選擇圓圈 */}
        <div className="flex items-center justify-center space-x-2 relative">
          {Array.from({ length: maxLevel }, (_, index) => {
            const level = index + 1;
            const isSelected = level <= current;
            const isClickable = interactive && onLevelChange;
            const content = progressContents[index] || `等級 ${level}`;
            const isLastAssessment = lastAssessment && level === lastAssessment.level;
            
            return (
              <div key={`level-${index}-${level}`} className="flex flex-col items-center relative">
                {/* 歷史評估縮圖 */}
                {isLastAssessment && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#B8D4E3] to-[#A8C4D3] rounded-full border border-[#98B4C3] flex items-center justify-center shadow-sm">
                    <span className="text-[8px] text-white font-bold">H</span>
                  </div>
                )}
                
                <div
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ease-out flex items-center justify-center text-xs font-bold shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#E8B4A0] to-[#D4A5A5] border-[#C89B9B] text-white shadow-md transform scale-105'
                      : isLastAssessment
                      ? 'bg-gradient-to-br from-[#F0F8FF] to-[#E6F3FF] border-[#B8D4E3] text-[#5A7A8A]'
                      : 'bg-white border-[#E8D5C4] text-[#8B7355] hover:border-[#D4A5A5] hover:bg-[#FDF6F0]'
                  } ${isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95' : ''}`}
                  onClick={() => handleLevelClick(level)}
                  title={isClickable ? `點擊設定為等級 ${level}: ${content}` : content}
                >
                  {level}
                </div>
                {index < maxLevel - 1 && (
                  <div className={`w-12 h-0.5 mt-2 transition-all duration-300 ${
                    isSelected ? 'bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5]' : 
                    isLastAssessment ? 'bg-gradient-to-r from-[#B8D4E3] to-[#A8C4D3]' : 'bg-[#E8D5C4]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* 歷史評估信息 */}
        {lastAssessment && (
          <div className="mt-2 p-2 bg-gradient-to-r from-[#F0F8FF] to-[#E6F3FF] rounded-lg border border-[#B8D4E3] shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 bg-gradient-to-br from-[#B8D4E3] to-[#A8C4D3] rounded-full flex items-center justify-center">
                <span className="text-[6px] text-white font-bold">H</span>
              </span>
              <span className="text-[#5A7A8A] font-medium">上次評估</span>
              <span className="text-[#5A7A8A]">等級 {lastAssessment.level}</span>
              <span className="text-[#8B9AA8]">•</span>
              <span className="text-[#8B9AA8]">{new Date(lastAssessment.date).toLocaleDateString('zh-TW')}</span>
              {lastAssessment.teacher_name && (
                <>
                  <span className="text-[#8B9AA8]">•</span>
                  <span className="text-[#8B9AA8]">{lastAssessment.teacher_name}</span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* 完成度進度條 */}
        {showCompletion && (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs text-[#8B7355] mb-1">
              <span>完成度</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-[#F5F0EB] rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#E8B4A0] via-[#D4A5A5] to-[#C89B9B] h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
        
        {/* 等級內容說明 */}
        {progressContents.length > 0 && (
          <div className="mt-3 p-4 bg-gradient-to-br from-[#FDF6F0] to-[#F5F0EB] rounded-lg border border-[#E8D5C4] shadow-sm">
            <h6 className="text-xs font-medium text-[#2B3A3B] mb-3">等級內容說明：</h6>
            <div className="space-y-2">
              {progressContents.map((content, index) => {
                const level = index + 1;
                const isSelected = level <= current;
                const isLastAssessment = lastAssessment && level === lastAssessment.level;
                
                return (
                  <div key={`content-${index}-${level}`} className="flex items-start gap-3 text-xs group">
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#E8B4A0] to-[#D4A5A5] border-[#C89B9B] text-white shadow-sm'
                        : isLastAssessment
                        ? 'bg-gradient-to-br from-[#F0F8FF] to-[#E6F3FF] border-[#B8D4E3] text-[#5A7A8A]'
                        : 'bg-white border-[#E8D5C4] text-[#8B7355] group-hover:border-[#D4A5A5]'
                    }`}>
                      {level}
                    </span>
                    <span className={`text-[#2B3A3B] transition-all duration-200 ${
                      isSelected ? 'font-medium text-[#8B7355]' : 
                      isLastAssessment ? 'text-[#5A7A8A]' : ''
                    }`}>
                      {content}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 等級說明 */}
        <div className="text-xs text-[#8B7355] text-center italic">
          {current === 0 && "請選擇等級"}
          {current > 0 && current <= Math.ceil(maxLevel * 0.2) && "初學者"}
          {current > Math.ceil(maxLevel * 0.2) && current <= Math.ceil(maxLevel * 0.4) && "基礎"}
          {current > Math.ceil(maxLevel * 0.4) && current <= Math.ceil(maxLevel * 0.6) && "進階"}
          {current > Math.ceil(maxLevel * 0.6) && current <= Math.ceil(maxLevel * 0.8) && "熟練"}
          {current > Math.ceil(maxLevel * 0.8) && current <= maxLevel && "精通"}
        </div>
      </div>
    );
  };

  // 能力進度組件
  const AbilityProgressCard = ({ ability }: { ability: DevelopmentAbility }) => {
    const currentLevel = ability.current_level || 0;
    const maxLevel = ability.max_level;
    const progressPercentage = ability.progress_percentage || 0;

    return (
      <div className="p-4 border border-[#EADBC8] rounded-lg bg-white hover:border-[#D4A5A5] hover:bg-[#FDF6F0] transition-all duration-200">
        <div className="mb-3">
          <div className="font-medium text-[#2B3A3B] flex items-center gap-2">
            {ability.ability_name}
            {abilityAssessments[ability.id]?.level && (
              <span className="text-blue-600 text-sm">📊 已評估 (等級 {abilityAssessments[ability.id].level})</span>
            )}
          </div>
          {ability.ability_description && (
            <div className="text-sm text-[#87704e] mt-1">{ability.ability_description}</div>
          )}
        </div>

        {/* 能力等級選擇進度條 */}
        <LevelProgressBar 
          current={abilityAssessments[ability.id]?.level || currentLevel} 
          maxLevel={maxLevel} 
          label={`${ability.ability_name} 能力等級`}
          interactive={true}
          showCompletion={true}
          progressContents={Array.from({ length: maxLevel }, (_, index) => {
            const level = index + 1;
            const levelContent = ability.level_contents?.[level];
            if (levelContent) {
              return `${levelContent.level_title}：${levelContent.level_description}`;
            }
            return `等級 ${level}`;
          })}
          onLevelChange={(level) => {
            const currentLevel = abilityAssessments[ability.id]?.level || 
                                  (ability.completion_percentage ? Math.ceil(ability.completion_percentage / (100 / maxLevel)) : 0);
                                
            // 如果點擊的是當前等級，則消除等級（設為0）
            const newLevel = currentLevel === level ? 0 : level;
            const newProgress = Math.round((newLevel / maxLevel) * 100);
                                
            // 更新能力評估狀態
            updateAbilityAssessment(ability.id, 'level', newLevel);
            updateAbilityAssessment(ability.id, 'progress_percentage', newProgress);
          }}
        />

        {/* 備註 */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-[#2B3A3B] mb-1">
            評估備註
          </label>
          <textarea
            className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B] focus:outline-none focus:ring-2 focus:ring-[#A68A64] resize-none"
            rows={2}
            placeholder="請輸入此能力的評估備註..."
            value={abilityAssessments[ability.id]?.notes || ''}
            onChange={(e) => updateAbilityAssessment(ability.id, 'notes', e.target.value)}
          />
        </div>
      </div>
    );
  };

  // 修復過往評估記錄的顯示問題
  const fixHistoricalAssessmentData = (assessmentData: any, currentGoals: GrowthGoal[], currentAbilities: DevelopmentAbility[]) => {
    console.log('🔧 開始修復過往評估記錄:', {
      assessmentData,
      currentGoalsCount: currentGoals.length,
      currentAbilitiesCount: currentAbilities.length
    });

    console.log('📋 當前目標列表:', currentGoals.map(g => ({ id: g.id, name: g.goal_name, desc: g.goal_description })));
    console.log('📋 當前能力列表:', currentAbilities.map(a => ({ id: a.id, name: a.ability_name, desc: a.ability_description })));
    console.log('📋 評估記錄中的 selected_goals:', assessmentData.selected_goals);
    console.log('📋 評估記錄中的 ability_assessments:', assessmentData.ability_assessments);

    const fixedData = { ...assessmentData };

    // 修復 ability_assessments
    if (fixedData.ability_assessments && typeof fixedData.ability_assessments === 'object') {
      const fixedAbilityAssessments: any = {};
      const currentAbilityIds = new Set(currentAbilities.map(a => a.id));
      
      Object.entries(fixedData.ability_assessments).forEach(([abilityId, assessment]: [string, any]) => {
        console.log(`🔍 檢查能力評估: ${abilityId}`, assessment);
        
        // 如果能力ID不存在，嘗試通過名稱匹配
        if (!currentAbilityIds.has(abilityId)) {
          console.log(`❌ 能力ID ${abilityId} 不存在於當前能力列表中`);
          
          const matchingAbility = currentAbilities.find(ability => {
            const nameMatch = ability.ability_name === assessment.ability_name;
            const descMatch = ability.ability_description === assessment.ability_description;
            console.log(`🔍 嘗試匹配能力:`, {
              current: { name: ability.ability_name, desc: ability.ability_description },
              assessment: { name: assessment.ability_name, desc: assessment.ability_description },
              nameMatch,
              descMatch
            });
            return nameMatch || descMatch;
          });
          
          if (matchingAbility) {
            console.log(`🔄 修復能力評估: ${abilityId} -> ${matchingAbility.id}`);
            fixedAbilityAssessments[matchingAbility.id] = {
              ...assessment,
              ability_name: matchingAbility.ability_name,
              ability_description: matchingAbility.ability_description
            };
          } else {
            console.log(`⚠️ 無法找到匹配的能力: ${abilityId}`);
          }
        } else {
          console.log(`✅ 能力ID ${abilityId} 仍然有效`);
          // 能力ID仍然有效
          fixedAbilityAssessments[abilityId] = assessment;
        }
      });
      
      fixedData.ability_assessments = fixedAbilityAssessments;
    }

    // 修復 selected_goals
    if (fixedData.selected_goals && Array.isArray(fixedData.selected_goals)) {
      const fixedSelectedGoals: any[] = [];
      const currentGoalIds = new Set(currentGoals.map(g => g.id));
      
      fixedData.selected_goals.forEach((goalAssessment: any) => {
        console.log(`🔍 檢查目標評估: ${goalAssessment.goal_id}`, goalAssessment);
        
        // 如果目標ID不存在，嘗試通過名稱匹配
        if (!currentGoalIds.has(goalAssessment.goal_id)) {
          console.log(`❌ 目標ID ${goalAssessment.goal_id} 不存在於當前目標列表中`);
          
          const matchingGoal = currentGoals.find(goal => {
            const nameMatch = goal.goal_name === goalAssessment.goal_name;
            const descMatch = goal.goal_description === goalAssessment.goal_description;
            console.log(`🔍 嘗試匹配目標:`, {
              current: { name: goal.goal_name, desc: goal.goal_description },
              assessment: { name: goalAssessment.goal_name, desc: goalAssessment.goal_description },
              nameMatch,
              descMatch
            });
            return nameMatch || descMatch;
          });
          
          if (matchingGoal) {
            console.log(`🔄 修復目標評估: ${goalAssessment.goal_id} -> ${matchingGoal.id}`);
            fixedSelectedGoals.push({
              ...goalAssessment,
              goal_id: matchingGoal.id,
              goal_name: matchingGoal.goal_name,
              goal_description: matchingGoal.goal_description
            });
          } else {
            console.log(`⚠️ 無法找到匹配的目標: ${goalAssessment.goal_id}`);
            // 即使沒有匹配，也保留原始記錄以便調試
            fixedSelectedGoals.push(goalAssessment);
          }
        } else {
          console.log(`✅ 目標ID ${goalAssessment.goal_id} 仍然有效`);
          // 目標ID仍然有效
          fixedSelectedGoals.push(goalAssessment);
        }
      });
      
      fixedData.selected_goals = fixedSelectedGoals;
    }

    console.log('✅ 修復完成:', fixedData);
    return fixedData;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto mb-4" />
          <p className="text-[#2B3A3B]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          border-radius: 6px;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #E8B4A0;
          cursor: pointer;
          border: 2px solid #D4A5A5;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #E8B4A0;
          cursor: pointer;
          border: 2px solid #D4A5A5;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-webkit-slider-track {
          background: #F5F0EB;
          border-radius: 6px;
          height: 12px;
        }
        .slider::-moz-range-track {
          background: #F5F0EB;
          border-radius: 6px;
          height: 12px;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h2 className="text-2xl font-bold text-hanami-text">
                  {isEditMode ? '編輯能力評估' : '新增能力評估'}
                </h2>
                <p className="text-hanami-text-secondary">
                  {isEditMode ? '修改學生的能力發展評估' : '記錄學生的能力發展評估'}
                </p>
                {/* 新增模式下顯示評估記錄選擇器 */}
                {!isEditMode && (
                  <div className="mt-2 p-2 bg-[#FFF9F2] rounded border border-[#E8D5C4]">
                    <label className="block text-xs font-medium text-[#2B3A3B] mb-1">
                      預設值來源
                    </label>
                    <div className="relative">
                      <button
                        className={`w-full px-3 py-2 border border-[#EADBC8] rounded text-left transition-colors focus:outline-none focus:ring-1 focus:ring-[#A64B2A] text-sm ${
                          assessmentHistory.length > 0 
                            ? 'bg-white hover:bg-[#FFF9F2] cursor-pointer' 
                            : 'bg-gray-50 cursor-not-allowed'
                        }`}
                        type="button"
                        onClick={() => assessmentHistory.length > 0 && setShowAssessmentDropdown(!showAssessmentDropdown)}
                        disabled={assessmentHistory.length === 0}
                      >
                        {selectedAssessmentRecord ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-[#2B3A3B]">
                                {new Date(selectedAssessmentRecord.assessment_date).toLocaleDateString('zh-TW')}
                              </span>
                              {selectedAssessmentRecord.analysis?.has_goal_data && (
                                <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">目標</span>
                              )}
                              {selectedAssessmentRecord.analysis?.has_ability_data && (
                                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">能力</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#A68A64]">
                            {assessmentHistory.length > 0 ? '選擇記錄...' : '無歷史記錄'}
                          </span>
                        )}
                      </button>
                      
                      {showAssessmentDropdown && assessmentHistory.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded shadow-lg z-20 max-h-48 overflow-y-auto">
                          <div className="p-2 border-b border-[#EADBC8]">
                            <div className="text-xs text-[#87704e]">
                              選擇評估記錄
                            </div>
                          </div>
                          <div>
                            {assessmentHistory.length > 0 ? (
                              assessmentHistory.map((record) => (
                                <button
                                  key={record.id}
                                  className="w-full px-3 py-2 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0 transition-colors text-sm"
                                  type="button"
                                  onClick={() => {
                                    console.log('🔄 用戶選擇新的評估記錄:', record.assessment_date);
                                    console.log('📊 選中記錄的完整資料:', record);
                                    console.log('📋 選中記錄的 selected_goals:', record.selected_goals);
                                    console.log('🎯 選中記錄的 analysis:', record.analysis);
                                    
                                    setSelectedAssessmentRecord(record);
                                    setLatestAssessment(record);
                                    setShowAssessmentDropdown(false);
                                    
                                    // 重新載入目標和能力，使用新選擇的記錄
                                    if (selectedTreeId) {
                                      console.log('🌳 重新載入目標和能力，成長樹ID:', selectedTreeId);
                                      loadTreeGoalsAndAbilities(selectedTreeId);
                                    } else {
                                      console.log('⚠️ 沒有選擇成長樹，無法載入目標');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium text-[#2B3A3B]">
                                        {new Date(record.assessment_date).toLocaleDateString('zh-TW')}
                                      </span>
                                      <div className="text-xs text-[#A68A64] mt-0.5">
                                        {record.tree?.tree_name || '未知成長樹'}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {record.analysis?.has_goal_data && (
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">目標</span>
                                      )}
                                      {record.analysis?.has_ability_data && (
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">能力</span>
                                      )}
                                      {!record.analysis?.has_goal_data && !record.analysis?.has_ability_data && (
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">空</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-center text-sm text-[#A68A64]">
                                該學生目前沒有評估記錄
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              className="text-hanami-text hover:text-hanami-text-secondary transition-colors p-2"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 表單內容 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：基本資訊 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#2B3A3B] border-b border-[#EADBC8] pb-2">
                基本資訊
              </h3>
              
              {/* 學生選擇 */}
              <div className="relative student-dropdown">
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  選擇學生
                  {lockStudent && (
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      已鎖定
                    </span>
                  )}
                </label>
                <div className="relative">
                  <button
                    className={`w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A] ${
                      lockStudent 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
                        : 'bg-white hover:bg-[#FFF9F2]'
                    }`}
                    type="button"
                    onClick={() => !lockStudent && setShowStudentDropdown(!showStudentDropdown)}
                    disabled={lockStudent}
                  >
                    {selectedStudent ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#2B3A3B] flex items-center gap-2">
                            {selectedStudent.full_name}
                            {lockStudent && (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-[#A68A64]">
                            {selectedStudent.nick_name && `${selectedStudent.nick_name} • `}
                            {studentTrees.length > 0 
                              ? `${studentTrees.length} 個成長樹`
                              : '未分配成長樹'
                            }
                          </div>
                        </div>
                        {!lockStudent && (
                          <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#A68A64]">請選擇學生</span>
                    )}
                  </button>
                  {showStudentDropdown && !lockStudent && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-[#EADBC8]">
                        <input
                          className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                          placeholder="搜尋學生..."
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredStudents.map((student) => {
                          return (
                            <button
                              key={student.id}
                              className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setShowStudentDropdown(false);
                                setStudentSearch('');
                              }}
                            >
                              <div className="font-medium text-[#2B3A3B]">{student.full_name}</div>
                              <div className="text-sm text-[#A68A64]">
                                {student.nick_name && `${student.nick_name} • `}
                                點擊查看成長樹
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 成長樹選擇 */}
                {selectedStudent && studentTrees.length > 0 && (
                  <div className="relative tree-dropdown">
                    <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                      <span className="text-xl mr-1">
                        <AcademicCapIcon className="w-6 h-6 text-[#A68A64]" />
                      </span>
                      選擇本次評估的成長樹
                    </label>
                    <div className="relative">
                      <button
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        type="button"
                        onClick={() => setShowTreeDropdown(!showTreeDropdown)}
                      >
                        {selectedTree ? (
                          <div>
                            <div className="font-medium text-[#2B3A3B]">{selectedTree.tree_name}</div>
                            <div className="text-sm text-[#A68A64]">
                              {selectedTree.start_date && `開始日期: ${new Date(selectedTree.start_date).toLocaleDateString('zh-TW')} • `}
                              狀態: {selectedTree.status || 'active'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#A68A64]">請選擇本次評估的成長樹</span>
                        )}
                      </button>
                      {showTreeDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          <div className="p-2 border-b border-[#EADBC8]">
                            <input
                              className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                              placeholder="搜尋成長樹..."
                              type="text"
                              value={treeSearch}
                              onChange={(e) => setTreeSearch(e.target.value)}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredStudentTrees.map((tree) => (
                              <button
                                key={tree.id}
                                className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                                type="button"
                                onClick={() => {
                                  setSelectedTreeId(tree.id);
                                  setShowTreeDropdown(false);
                                  setTreeSearch('');
                                }}
                              >
                                <div className="font-medium text-[#2B3A3B]">{tree.tree_name}</div>
                                <div className="text-sm text-[#A68A64]">
                                  {tree.start_date && `開始日期: ${new Date(tree.start_date).toLocaleDateString('zh-TW')} • `}
                                  狀態: {tree.status || 'active'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 學生成長樹提醒 */}
                {selectedStudent && studentTrees.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 text-lg">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="text-yellow-800 font-medium text-sm">學生未分配成長樹</h4>
                        <p className="text-yellow-700 text-xs mt-1">
                          {selectedStudent.full_name} 尚未分配任何成長樹，無法進行能力評估。
                          請先在學生管理中為此學生分配成長樹。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 顯示學生已分配的成長樹 */}
                {selectedStudent && (
                  <div className="mt-2 p-3 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
                    <div className="flex items-start gap-2">
                      <AcademicCapIcon className="w-5 h-5 text-[#A68A64] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-[#2B3A3B] font-medium text-sm">成長樹</h4>
                        <p className="text-[#87704e] text-xs mt-1">
                          {selectedStudent.full_name} 的成長樹：{selectedTree?.tree_name}
                          {studentTrees.length > 1 && ` (另有 ${studentTrees.length - 1} 個成長樹可選擇)`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 顯示學生已分配成長樹但找不到對應資料 */}
                {selectedStudent && !selectedTree && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 text-lg">❌</span>
                      <div>
                        <h4 className="text-red-800 font-medium text-sm">成長樹資料錯誤</h4>
                        <p className="text-red-700 text-xs mt-1">
                          {selectedStudent.full_name} 的成長樹資料在資料庫中找不到對應的成長樹資料。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 成長樹管理區域 */}
                {selectedStudent && (
                  <div className="mt-4">
                    <MinimalStudentGrowthTreeManager
                      studentId={selectedStudent.id}
                      studentName={selectedStudent.full_name}
                      onTreeChange={(trees) => {
                        console.log('成長樹變更:', trees);
                        setStudentTrees(trees);
                        // 如果當前選中的成長樹被刪除，清空選擇
                        if (selectedTreeId && !trees.find(t => t.id === selectedTreeId)) {
                          setSelectedTreeId('');
                        }
                        // 如果只有一個成長樹，自動選擇它
                        if (trees.length === 1 && !selectedTreeId) {
                          setSelectedTreeId(trees[0].id);
                        }
                      }}
                      className="border border-[#EADBC8] rounded-lg p-4 bg-[#FFF9F2]"
                    />
                  </div>
                )}
              </div>

              {/* 評估日期輸入 */}
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  評估日期
                </label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#2B3A3B] focus:outline-none focus:border-[#A64B2A]"
                />
              </div>

              {/* 評估日期顯示（備用） */}
              <div className="hidden">
                <div className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg bg-[#FFF9F2] text-[#2B3A3B]">
                  {new Date(assessmentDate).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })} (自動設定)
                </div>
              </div>

              {/* 日期選擇 */}
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  上課日期
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg text-[#2B3A3B] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                />
              </div>

              {/* 整體表現評分 */}
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  <StarIcon className="w-4 h-4 inline mr-1" />
                  整體表現評分
                </label>
                <div className="flex items-center gap-2">
                  {/* 使用 getRatingStars 函數 */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setOverallRating(i + 1)}
                      className={`text-lg ${i < overallRating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-sm text-[#A68A64] ml-2">
                    {overallRating} / 5 星
                  </span>
                </div>
              </div>

              {/* 一般備註 */}
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  一般備註
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg text-[#2B3A3B] focus:outline-none focus:ring-2 focus:ring-[#A68A64] resize-none"
                  rows={3}
                  placeholder="請輸入本次評估的一般備註..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>

              {/* 下堂課重點 */}
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  下堂課重點
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg text-[#2B3A3B] focus:outline-none focus:ring-2 focus:ring-[#A68A64] resize-none"
                  rows={3}
                  placeholder="請輸入下堂課的教學重點..."
                  value={nextFocus}
                  onChange={(e) => setNextFocus(e.target.value)}
                />
              </div>

              {/* 教師選擇 */}
              <div className="relative teacher-dropdown">
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  選擇教師
                </label>
                <div className="relative">
                  <button
                    className={`w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A] ${
                      lockTeacher 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
                        : 'bg-white hover:bg-[#FFF9F2]'
                    }`}
                    type="button"
                    onClick={() => !lockTeacher && setShowTeacherDropdown(!showTeacherDropdown)}
                    disabled={lockTeacher}
                  >
                    {selectedTeacherId ? (
                      (() => {
                        const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
                        // 如果教師不在列表中，但提供了 defaultTeacher，使用 defaultTeacher 的信息
                        if (!selectedTeacher && defaultTeacher && defaultTeacher.id === selectedTeacherId) {
                          return (
                            <div>
                              <div className="font-medium text-[#2B3A3B]">
                                {defaultTeacher.teacher_nickname || defaultTeacher.teacher_fullname || '當前用戶'}
                              </div>
                              <div className="text-sm text-[#A68A64]">
                                {defaultTeacher.teacher_fullname || defaultTeacher.teacher_nickname || '教師'} • 當前帳戶
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div>
                            <div className="font-medium text-[#2B3A3B]">
                              {selectedTeacher?.type === 'admin' 
                                ? selectedTeacher.admin_name 
                                : selectedTeacher?.teacher_nickname}
                            </div>
                            <div className="text-sm text-[#A68A64]">
                              {selectedTeacher?.type === 'admin' 
                                ? `管理員 • ${selectedTeacher.teacher_role || 'admin'} • `
                                : `${selectedTeacher?.teacher_fullname || ''} • ${selectedTeacher?.teacher_role || ''} • `}
                              {teachers.length} 位教師
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-[#A68A64]">請選擇教師</span>
                    )}
                  </button>
                  {showTeacherDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-[#EADBC8]">
                        <input
                          className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                          placeholder="搜尋教師..."
                          type="text"
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredTeachers.map((teacher) => (
                          <button
                            key={teacher.id}
                            className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                            type="button"
                            onClick={() => {
                              setSelectedTeacherId(teacher.id);
                              setShowTeacherDropdown(false);
                              setTeacherSearch('');
                            }}
                          >
                            <div className="font-medium text-[#2B3A3B]">
                              {teacher.type === 'admin' 
                                ? teacher.admin_name 
                                : teacher.teacher_nickname}
                            </div>
                            <div className="text-sm text-[#A68A64]">
                              {teacher.type === 'admin' 
                                ? `管理員 • ${teacher.teacher_role || 'admin'} • ${teacher.teacher_email || ''}`
                                : `${teacher.teacher_fullname || ''} • ${teacher.teacher_role || ''} • ${teacher.teacher_email || ''}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右側：成長目標和能力評估 + 活動管理 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#2B3A3B] border-b border-[#EADBC8] pb-2">
                成長目標與能力評估
              </h3>

              {!selectedStudent ? (
                /* 未選擇學生 */
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">👤</div>
                  <h4 className="text-lg font-medium text-[#2B3A3B] mb-2">請選擇學生</h4>
                  <p className="text-[#87704e]">
                    請在左側選擇要評估的學生。
                  </p>
                </div>
              ) : studentTrees.length === 0 ? (
                /* 學生未分配成長樹 */
                <div className="text-center py-12">
                  <div className="mb-4 flex justify-center">
                    <Image
                      src="/tree ui.png"
                      alt="成長樹"
                      width={96}
                      height={96}
                      className="h-24 w-24"
                    />
                  </div>
                  <h4 className="text-lg font-medium text-[#2B3A3B] mb-2">學生未分配成長樹</h4>
                  <p className="text-[#87704e] mb-4">
                    無法進行能力評估，因為學生尚未分配任何成長樹。
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">解決步驟：</h5>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>前往「學生管理」頁面</li>
                      <li>找到該學生並點擊編輯</li>
                      <li>在「成長樹分配」區域選擇適合的成長樹</li>
                      <li>儲存學生資料</li>
                      <li>返回此頁面重新進行評估</li>
                    </ol>
                  </div>
                </div>
              ) : !selectedTree ? (
                /* 未選擇成長樹 */
                <div className="text-center py-12">
                  <div className="mb-4 flex justify-center">
                    <Image
                      src="/tree ui.png"
                      alt="成長樹"
                      width={64}
                      height={64}
                      className="h-16 w-16"
                    />
                  </div>
                  <h4 className="text-lg font-medium text-[#2B3A3B] mb-2">請選擇本次評估的成長樹</h4>
                  <p className="text-[#87704e]">
                    請在左側選擇要評估的成長樹。
                  </p>
                </div>
              ) : (
                /* 正常顯示成長樹內容 */
                <>
                  {/* 成長樹資訊 */}
                  {selectedTree && (
                    <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-4 rounded-lg border border-[#EADBC8]">
                      <h4 className="font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5 text-[#A68A64]" />
                        {selectedTree.tree_name}
                      </h4>
                      <p className="text-sm text-[#87704e]">
                        {selectedTree.tree_description || '此成長樹的學習目標和能力發展'}
                      </p>
                      <div className="text-xs text-[#87704e] mt-2">
                        成長樹描述: {selectedTree.tree_description || '無描述'}
                      </div>
                    </div>
                  )}

                  {/* 成長目標選擇 */}
                  {goals.length > 0 && (
                    <div>
                      <h4 className="font-medium text-[#2B3A3B] mb-3">學習目標進度</h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {goals.map(goal => (
                          <div 
                            key={goal.id} 
                            className="p-4 border border-[#EADBC8] rounded-lg bg-white hover:border-[#D4A5A5] hover:bg-[#FDF6F0] transition-all duration-200"
                          >
                            <div className="mb-3">
                              <div className="font-medium text-[#2B3A3B] flex items-center gap-2">
                                {goal.goal_name}
                                {goal.is_completed && (
                                  <span className="text-green-600 text-sm flex items-center gap-1">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    已完成
                                  </span>
                                )}
                                {goalAssessments[goal.id]?.level && (
                                  <span className="text-blue-600 text-sm flex items-center gap-1">
                                    <StarIcon className="w-4 h-4" />
                                    已評估 (等級 {goalAssessments[goal.id].level})
                                  </span>
                                )}
                                {(goal as any).assessment_mode === 'multi_select' && (
                                  <span className="text-purple-600 text-sm flex items-center gap-1">
                                    <AcademicCapIcon className="w-4 h-4" />
                                    多選模式
                                  </span>
                                )}
                                {(goal as any).assessment_mode === 'multi_select' && multiSelectAssessments[goal.id] && multiSelectAssessments[goal.id].length > 0 && (
                                  <span className="text-blue-600 text-sm flex items-center gap-1">
                                    <StarIcon className="w-4 h-4" />
                                    已評估 ({multiSelectAssessments[goal.id].length} 項)
                                  </span>
                                )}
                              </div>
                              {goal.goal_description && (
                                <div className="text-sm text-[#87704e] mt-1">{goal.goal_description}</div>
                              )}
                            </div>
                            
                            {/* 根據評估模式顯示不同的評估界面 */}
                            {(goal as any).assessment_mode === 'multi_select' ? (
                              /* 多選模式評估 */
                              <div className="space-y-3">
                                {/* 渲染目標 ${goal.id} 的多選項目，當前狀態: ${JSON.stringify(multiSelectAssessments[goal.id])} */}
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-[#2B3A3B]">{goal.goal_name} 完成等級</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-[#A68A64]">
                                      已選 {(multiSelectAssessments[goal.id] || []).length} / {(goal as any).multi_select_levels?.length || 0} 項
                                    </span>
                                    <span className="text-sm font-medium text-[#E8B4A0]">
                                      ({Math.round(((multiSelectAssessments[goal.id] || []).length / ((goal as any).multi_select_levels?.length || 1)) * 100)}%)
                                    </span>
                                  </div>
                                </div>
                                
                                {/* 多選等級選擇 */}
                                <div className="flex items-center justify-center space-x-2 relative">
                                  {(goal as any).multi_select_levels?.map((level: string, index: number) => {
                                    const isSelected = (multiSelectAssessments[goal.id] || []).includes(level);
                                    const isClickable = true;
                                    
                                    return (
                                      <div key={`level-${index}-${level}`} className="flex flex-col items-center relative">
                                        <div
                                          className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ease-out flex items-center justify-center text-xs font-bold shadow-sm ${
                                            isSelected
                                              ? 'bg-gradient-to-br from-[#E8B4A0] to-[#D4A5A5] border-[#C89B9B] text-white shadow-md transform scale-105'
                                              : 'bg-white border-[#E8D5C4] text-[#8B7355] hover:border-[#D4A5A5] hover:bg-[#FDF6F0]'
                                          } ${isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95' : ''}`}
                                          onClick={() => handleMultiSelectAssessmentChange(goal.id, level, !isSelected)}
                                          title={isClickable ? `點擊${isSelected ? '取消' : '選擇'}等級: ${level}` : level}
                                        >
                                          {index + 1}
                                        </div>
                                        {index < ((goal as any).multi_select_levels?.length || 0) - 1 && (
                                          <div className={`w-12 h-0.5 mt-2 transition-all duration-300 ${
                                            isSelected ? 'bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5]' : 'bg-[#E8D5C4]'
                                          }`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* 完成度進度條 */}
                                <div className="mt-2">
                                  <div className="flex justify-between items-center text-xs text-[#8B7355] mb-1">
                                    <span>完成度</span>
                                    <span>{Math.round(((multiSelectAssessments[goal.id] || []).length / ((goal as any).multi_select_levels?.length || 1)) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-[#F5F0EB] rounded-full h-3 shadow-inner">
                                    <div 
                                      className="bg-gradient-to-r from-[#E8B4A0] via-[#D4A5A5] to-[#C89B9B] h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                                      style={{ width: `${Math.round(((multiSelectAssessments[goal.id] || []).length / ((goal as any).multi_select_levels?.length || 1)) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {/* 等級內容說明 */}
                                <div className="mt-3 p-4 bg-gradient-to-br from-[#FDF6F0] to-[#F5F0EB] rounded-lg border border-[#E8D5C4] shadow-sm">
                                  <h6 className="text-xs font-medium text-[#2B3A3B] mb-3">等級內容說明：</h6>
                                  <div className="space-y-2">
                                    {(goal as any).multi_select_levels?.map((level: string, index: number) => {
                                      const isSelected = (multiSelectAssessments[goal.id] || []).includes(level);
                                      
                                      return (
                                        <div key={`content-${index}-${level}`} className="flex items-start gap-3 text-xs group">
                                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                                            isSelected
                                              ? 'bg-gradient-to-br from-[#E8B4A0] to-[#D4A5A5] border-[#C89B9B] text-white shadow-sm'
                                              : 'bg-white border-[#E8D5C4] text-[#8B7355] group-hover:border-[#D4A5A5]'
                                          }`}>
                                            {index + 1}
                                          </span>
                                          <div className="flex-1">
                                            <span className={`text-[#2B3A3B] transition-all duration-200 ${
                                              isSelected ? 'font-medium text-[#8B7355]' : ''
                                            }`}>
                                              {level}
                                            </span>
                                            {(goal as any).multi_select_descriptions?.[index] && (
                                              <p className={`text-[#87704e] transition-all duration-200 ${
                                                isSelected ? 'font-medium' : ''
                                              }`}>
                                                {(goal as any).multi_select_descriptions[index]}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                {/* 等級說明 */}
                                <div className="text-xs text-[#8B7355] text-center italic">
                                  {(multiSelectAssessments[goal.id] || []).length === 0 && "請選擇等級"}
                                  {(multiSelectAssessments[goal.id] || []).length > 0 && (multiSelectAssessments[goal.id] || []).length <= Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.2) && "初學者"}
                                  {(multiSelectAssessments[goal.id] || []).length > Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.2) && (multiSelectAssessments[goal.id] || []).length <= Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.4) && "基礎"}
                                  {(multiSelectAssessments[goal.id] || []).length > Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.4) && (multiSelectAssessments[goal.id] || []).length <= Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.6) && "進階"}
                                  {(multiSelectAssessments[goal.id] || []).length > Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.6) && (multiSelectAssessments[goal.id] || []).length <= Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.8) && "熟練"}
                                  {(multiSelectAssessments[goal.id] || []).length > Math.ceil(((goal as any).multi_select_levels?.length || 1) * 0.8) && (multiSelectAssessments[goal.id] || []).length <= ((goal as any).multi_select_levels?.length || 1) && "精通"}
                                </div>
                              </div>
                            ) : (
                              /* 進度模式評估 */
                              <div>
                                {/* 渲染目標進度項目 */}
                                <LevelProgressBar 
                              current={goalAssessments[goal.id]?.level || 
                                (goal.completion_percentage ? Math.ceil(goal.completion_percentage / (100 / (goal.progress_max || 20))) : 0)
                              } 
                              maxLevel={goal.progress_max || 20} 
                              label={`${goal.goal_name} 完成等級`}
                              interactive={true}
                              progressContents={goal.progress_contents || []}
                              showCompletion={true}
                              lastAssessment={goal.last_assessment || null}
                              onLevelChange={(level) => {
                                const maxLevel = goal.progress_max || 20;
                                const currentLevel = goalAssessments[goal.id]?.level || 
                                  (goal.completion_percentage ? Math.ceil(goal.completion_percentage / (100 / maxLevel)) : 0);
                                
                                // 如果點擊的是當前等級，則消除等級（設為0）
                                const newLevel = currentLevel === level ? 0 : level;
                                const newProgress = Math.round((newLevel / maxLevel) * 100);
                                
                                // 更新目標評估狀態
                                updateGoalAssessment(goal.id, 'level', newLevel);
                                updateGoalAssessment(goal.id, 'progress_percentage', newProgress);
                              }}
                            />
                              </div>
                            )}
                            
                            {/* 相關能力 */}
                            {goal.required_abilities && goal.required_abilities.length > 0 && (
                              <div className="mt-3">
                                <h6 className="text-xs font-medium text-[#2B3A3B] mb-2">相關能力：</h6>
                                <div className="flex flex-wrap gap-2">
                                  {goal.required_abilities.map(abilityId => {
                                    const ability = abilities.find(a => a.id === abilityId);
                                    return ability ? (
                                      <span 
                                        key={abilityId}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                      >
                                        {ability.ability_name} (等級 {ability.current_level || 0}/{ability.max_level})
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 能力評估 */}
                  {abilities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-[#2B3A3B] mb-3">能力發展進度</h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {abilities.map(ability => (
                          <AbilityProgressCard key={ability.id} ability={ability} />
                        ))}
                      </div>
                    </div>
                  )}

                  {abilities.length === 0 && goals.length === 0 && (
                    <div className="text-center py-8 text-[#A68A64]">
                      <p>此成長樹暫無設定目標和能力</p>
                    </div>
                  )}
                </>
              )}

              {/* 活動管理區域 */}
              {selectedStudent && (
                <div className="mt-8 pt-6 border-t border-[#EADBC8]">
                  <h3 className="text-lg font-semibold text-[#2B3A3B] border-b border-[#EADBC8] pb-2 mb-4">
                    活動管理
                  </h3>
                  
                                 {/* 本次課堂活動 */}
               <div className="mb-8">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800">
                   本次課堂活動
                 </h3>
                 
                 {studentActivities.currentLessonActivities.length > 0 ? (
                   <div className="grid gap-4">
                     {getFilteredActivities(studentActivities.currentLessonActivities).map((activity) => (
                       <ActivityCard
                         key={activity.id}
                         activity={activity}
                         type="current"
                         area="current_lesson"
                         onEdit={handleActivityEdit}
                         onSave={handleProgressSave}
                         onCancel={handleProgressCancel}
                         onReset={handleProgressReset}
                         onDelete={handleActivityDelete}
                         isEditing={editingActivityId === activity.id}
                         tempProgress={tempProgress[activity.id] || 0}
                         onProgressChange={handleProgressChange}
                       />
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     暫無本次課堂活動
                   </div>
                 )}
               </div>

               {/* 正在學習的活動 */}
               <div className="mb-8">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold text-gray-800">
                     正在學習的活動
                   </h3>
                   <div className="flex items-center gap-2">
                     {/* 完成訊息 */}
                     {showCompletionMessage && (
                       <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs animate-pulse">
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                         </svg>
                         活動已完成！已切換到「已完成」篩選器
                       </div>
                     )}
                     {/* 篩選按鈕 */}
                     <div className="flex bg-[#F5F0EB] rounded-lg p-1">
                       <button
                         className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                           activityFilter === 'incomplete'
                             ? 'bg-white text-[#2B3A3B] shadow-sm'
                             : 'text-[#8B7355] hover:text-[#2B3A3B]'
                         }`}
                         onClick={() => setActivityFilter('incomplete')}
                       >
                         未完成
                       </button>
                       <button
                         className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                           activityFilter === 'completed'
                             ? 'bg-white text-[#2B3A3B] shadow-sm'
                             : 'text-[#8B7355] hover:text-[#2B3A3B]'
                         }`}
                         onClick={() => setActivityFilter('completed')}
                       >
                         已完成
                       </button>
                       <button
                         className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                           activityFilter === 'all'
                             ? 'bg-white text-[#2B3A3B] shadow-sm'
                             : 'text-[#8B7355] hover:text-[#2B3A3B]'
                         }`}
                         onClick={() => setActivityFilter('all')}
                       >
                         全部
                       </button>
                     </div>
                     <button
                       className="px-3 py-1.5 bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5] text-white text-xs rounded-lg hover:from-[#D4A5A5] hover:to-[#C89B9B] transition-all duration-200"
                       onClick={() => handleActivitySelection('current')}
                     >
                       選擇活動
                     </button>
                     {studentTrees.length > 0 && (
                       <button
                         className="px-3 py-1.5 bg-gradient-to-r from-[#A68A64] to-[#8B7355] text-white text-xs rounded-lg hover:from-[#8B7355] hover:to-[#6B5B47] transition-all duration-200"
                         onClick={() => setShowGrowthTreePathManager(true)}
                       >
                         學習路徑
                       </button>
                     )}
                   </div>
                 </div>
                 
                 {studentActivities.ongoingActivities.length > 0 ? (
                   <div className="grid gap-4">
                     {getFilteredActivities(studentActivities.ongoingActivities).map((activity) => (
                       <ActivityCard
                         key={activity.id}
                         activity={activity}
                         type="ongoing"
                         area="ongoing"
                         onEdit={handleActivityEdit}
                         onSave={handleProgressSave}
                         onCancel={handleProgressCancel}
                         onReset={handleProgressReset}
                         onDelete={handleActivityDelete}
                         isEditing={editingActivityId === activity.id}
                         tempProgress={tempProgress[activity.id] || 0}
                         onProgressChange={handleProgressChange}
                       />
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     暫無正在學習的活動
                   </div>
                 )}
               </div>

                                 {/* 上次課堂活動 */}
               <div className="mb-6">
                 <h4 className="font-medium text-[#2B3A3B] flex items-center gap-2 mb-3">
                   <BookOpenIcon className="w-5 h-5 text-[#A68A64]" />
                   上次課堂活動
                   <span className="text-xs text-[#A68A64]">（供參考）</span>
                 </h4>
                 <div className="p-4 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
                   {studentActivities.previousLessonActivities.length > 0 ? (
                     <div className="space-y-3">
                       {studentActivities.previousLessonActivities.map((activity, index) => (
                         <ActivityCard key={activity.id || index} activity={activity} type="previous" area="current_lesson" />
                       ))}
                     </div>
                   ) : (
                     <>
                       <p className="text-[#A68A64] text-sm">暫無上次課堂活動</p>
                       <p className="text-[#87704e] text-xs mt-1">這是學生上次課堂的活動記錄</p>
                     </>
                   )}
                 </div>
               </div>

                                 {/* 活動統計 */}
               <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-4 rounded-lg border border-[#EADBC8]">
                 <h4 className="font-medium text-[#2B3A3B] mb-3 flex items-center gap-2">
                   <span className="text-lg">📊</span>
                   活動統計
                 </h4>
                 <div className="grid grid-cols-3 gap-4">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-[#A68A64]">
                       {studentActivities.currentLessonActivities.length}
                     </div>
                     <div className="text-xs text-[#87704e]">本次活動</div>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-[#A68A64]">
                       {studentActivities.ongoingActivities.length}
                     </div>
                     <div className="text-xs text-[#87704e]">進行中活動</div>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-[#A68A64]">
                       {(() => {
                         const allActivities = [...studentActivities.currentLessonActivities, ...studentActivities.ongoingActivities];
                         const completedCount = allActivities.filter(activity => (activity.progress || 0) >= 100).length;
                         return completedCount;
                       })()}
                     </div>
                     <div className="text-xs text-[#87704e]">已完成</div>
                   </div>
                 </div>
                 {/* 篩選狀態顯示 */}
                 <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                   <div className="text-center">
                     <span className="text-xs text-[#8B7355]">
                       當前顯示: {
                         activityFilter === 'completed' ? '已完成活動' :
                         activityFilter === 'incomplete' ? '未完成活動' : '全部活動'
                       }
                     </span>
                   </div>
                 </div>
               </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="px-6 py-4 border-t border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button
              className="px-6 py-2 text-[#8B7355] border border-[#E8D5C4] rounded-lg hover:bg-[#F5F0EB] hover:border-[#D4A5A5] hover:text-[#2B3A3B] transition-all duration-300 ease-out hover:shadow-md active:scale-95"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className={`px-6 py-2 rounded-lg transition-all duration-300 ease-out ${
                selectedStudent && selectedTreeId
                  ? 'bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5] text-white hover:from-[#D4A5A5] hover:to-[#C89B9B] hover:shadow-lg active:scale-95 border border-[#C89B9B]'
                  : 'bg-[#E8D5C4] text-[#8B7355] cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={!selectedStudent || !selectedTreeId}
            >
              {!selectedStudent ? '請選擇學生' : 
               !selectedTreeId ? '請選擇本次評估的成長樹' : 
               isEditMode ? '更新評估' : '儲存評估'}
            </button>
          </div>
        </div>
      </div>

      {/* 活動選擇模態框 */}
      <ActivitySelectionModal
        open={showActivitySelectionModal}
        onClose={() => setShowActivitySelectionModal(false)}
        onSelect={handleActivityAssignmentSuccess}
        mode="multiple"
        activityType={currentActivityType}
        studentId={selectedStudentId}
      />

      {/* 成長樹路徑管理器 */}
      {showGrowthTreePathManager && (
        <GrowthTreePathManager
          currentTreeId={selectedTreeId}
          studentId={selectedStudentId}
          studentTrees={studentTrees}
          onClose={() => setShowGrowthTreePathManager(false)}
        />
      )}
    </div>
  );
}
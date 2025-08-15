'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, UserIcon, CalendarIcon, CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard, HanamiInput } from './index';
import { supabase } from '@/lib/supabase';

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
}

export default function SimpleAbilityAssessmentModal({
  onClose,
  onSubmit,
  initialData,
  defaultStudent,
  defaultAssessmentDate,
  showOnlyTodayStudents
}: SimpleAbilityAssessmentModalProps) {
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
  const [selectedTeacherId, setSelectedTeacherId] = useState(initialData?.teacher_id || ''); // 新增：選擇的教師ID
  const [lessonDate, setLessonDate] = useState(
    initialData?.lesson_date || defaultAssessmentDate || new Date().toISOString().split('T')[0]
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
  
  // 教師選擇相關狀態
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  
  // 能力評估狀態
  const [abilityAssessments, setAbilityAssessments] = useState<{[key: string]: any}>(initialData?.ability_assessments || {});
  const [goalAssessments, setGoalAssessments] = useState<{[key: string]: any}>({});
  
  // 多選模式評估狀態
  const [multiSelectAssessments, setMultiSelectAssessments] = useState<{[goalId: string]: string[]}>({});

  // 檢查是否為編輯模式
  const isEditMode = !!initialData;

  // 檢查學生是否有分配成長樹
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedTree = studentTrees.find(t => t.id === selectedTreeId);

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
    if (selectedStudentId) {
      loadStudentTrees(selectedStudentId);
    } else {
      setStudentTrees([]);
      setSelectedTreeId('');
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (selectedTreeId) {
      loadTreeGoalsAndAbilities(selectedTreeId);
    }
  }, [selectedTreeId]);

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
          const { data: recentStudentsData, error: studentsError } = await supabase
            .from('Hanami_Students')
            .select('id, full_name, nick_name')
            .in('id', recentStudentIds.filter((id): id is string => id !== null))
            .order('full_name');

            if (studentsError) {
              console.error('載入最近學生失敗:', studentsError);
              throw studentsError;
            }
            
            studentsData = recentStudentsData;
            console.log('最近7天學生資料載入成功:', studentsData);
          }
        } else {
          // 根據學生ID獲取學生詳細資訊
          const { data: todayStudentsData, error: studentsError } = await supabase
            .from('Hanami_Students')
            .select('id, full_name, nick_name')
            .in('id', uniqueStudentIds.filter((id): id is string => id !== null))
            .order('full_name');

          if (studentsError) {
            console.error('載入當日學生失敗:', studentsError);
            throw studentsError;
          }
          
          studentsData = todayStudentsData;
          console.log('當日學生資料載入成功:', studentsData);
        }
      } else {
        // 載入所有學生
        const { data: allStudentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, nick_name')
          .order('full_name');

        if (studentsError) {
          console.error('載入學生失敗:', studentsError);
          throw studentsError;
        }
        
        studentsData = allStudentsData;
        console.log('所有學生資料載入成功:', studentsData);
      }
      
      setStudents(studentsData || []);

      // 載入成長樹列表
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name, tree_description')
        .eq('is_active', true)
        .order('tree_name');

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

      // 設置預設教師為現時登入者
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
  const loadStudentTrees = async (studentId: string) => {
    try {
      console.log('載入學生的成長樹:', studentId);
      
      // 載入學生在 hanami_student_trees 表中的所有成長樹
      const { data: studentTreesData, error: studentTreesError } = await supabase
        .from('hanami_student_trees')
        .select(`
          start_date,
          status,
          hanami_growth_trees(
            id,
            tree_name,
            tree_description
          )
        `)
        .eq('student_id', studentId)
        .or('status.eq.active,tree_status.eq.active');

      if (studentTreesError) {
        console.error('載入學生成長樹失敗:', studentTreesError);
        throw studentTreesError;
      }

      // 轉換資料格式
      const formattedTrees = (studentTreesData || [])
        .filter(item => item.hanami_growth_trees !== null)
        .map(item => ({
          id: item.hanami_growth_trees!.id,
          tree_name: item.hanami_growth_trees!.tree_name,
          tree_description: item.hanami_growth_trees!.tree_description,
          start_date: item.start_date,
          status: item.status
        }));

      console.log('學生的成長樹:', formattedTrees);
      setStudentTrees(formattedTrees);

      // 如果有成長樹，自動選擇第一個
      if (formattedTrees.length > 0) {
        setSelectedTreeId(formattedTrees[0].id);
      } else {
        setSelectedTreeId('');
      }

    } catch (error) {
      console.error('載入學生成長樹失敗:', error);
      setStudentTrees([]);
      setSelectedTreeId('');
    }
  };

  const loadTreeGoalsAndAbilities = async (treeId: string) => {
    try {
      setLoading(true);
      
      // 載入成長樹的目標
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId)
        .order('goal_order');

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

          // 優先從 selected_goals 欄位讀取目標評估資料，如果沒有則從 ability_assessments 欄位讀取
          if (latestAssessment) {
            if (latestAssessment.selected_goals && latestAssessment.selected_goals.length > 0) {
              console.log('從 selected_goals 讀取歷史評估資料:', latestAssessment.selected_goals);
              
              latestAssessment.selected_goals.forEach((goalData: any) => {
                const { goal_id, assessment_mode, progress_level, selected_levels } = goalData;
                
                if (assessment_mode === 'multi_select') {
                  if (selected_levels && selected_levels.length > 0) {
                    initialMultiSelectAssessments[goal_id] = selected_levels;
                    console.log(`從歷史資料設置目標 ${goal_id} 的多選初始值:`, selected_levels);
                  }
                } else if (assessment_mode === 'progress') {
                  if (progress_level && progress_level > 0) {
                    initialGoalAssessments[goal_id] = { level: progress_level };
                    console.log(`從歷史資料設置目標 ${goal_id} 的進度初始值:`, progress_level);
                  }
                }
              });
            } else if (latestAssessment.ability_assessments) {
              console.log('從 ability_assessments 讀取歷史評估資料:', latestAssessment.ability_assessments);
              
              Object.entries(latestAssessment.ability_assessments).forEach(([goalId, goalData]: [string, any]) => {
                const { assessment_mode, selected_levels, level } = goalData;
                
                if (assessment_mode === 'multi_select') {
                  if (selected_levels && selected_levels.length > 0) {
                    initialMultiSelectAssessments[goalId] = selected_levels;
                    console.log(`從歷史資料設置目標 ${goalId} 的多選初始值:`, selected_levels);
                  }
                } else if (assessment_mode === 'progress') {
                  if (level && level > 0) {
                    initialGoalAssessments[goalId] = { level: level };
                    console.log(`從歷史資料設置目標 ${goalId} 的進度初始值:`, level);
                  }
                }
              });
            }
          }

          (goalsData || []).forEach(goal => {
            console.log(`處理目標 ${goal.id}:`, goal);
            console.log(`目標評估模式:`, (goal as any).assessment_mode);
            console.log(`目標所需能力:`, goal.required_abilities);
            
            if ((goal as any).assessment_mode === 'multi_select') {
              // 多選模式：從進度資料中獲取選中的等級
              const goalAbilities = goal.required_abilities || [];
              const selectedLevels: string[] = [];
              
              console.log(`目標 ${goal.id} 的多選等級:`, (goal as any).multi_select_levels);
              
              if (goalAbilities.length > 0) {
                // 有關聯能力的情況
                goalAbilities.forEach(abilityId => {
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
                goalAbilities.forEach(abilityId => {
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

          setGoalAssessments(initialGoalAssessments);
          setMultiSelectAssessments(initialMultiSelectAssessments);
          
          console.log('設置的目標評估初始值:', initialGoalAssessments);
          console.log('設置的多選評估初始值:', initialMultiSelectAssessments);

          // 計算目標完成度
          const goalsWithProgress = (goalsData || []).map(goal => {
            if (!goal.required_abilities || goal.required_abilities.length === 0) {
              return { ...goal, is_completed: false, completion_percentage: 0 };
            }

            const requiredAbilities = goal.required_abilities.map(abilityId => 
              abilitiesData.find(ability => ability.id === abilityId)
            ).filter(Boolean);

            if (requiredAbilities.length === 0) {
              return { ...goal, is_completed: false, completion_percentage: 0 };
            }

            // 根據評估模式計算完成度
            if ((goal as any).assessment_mode === 'multi_select') {
              // 多選模式：檢查是否有選中的等級
              const completedAbilities = requiredAbilities.filter(ability => {
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
            const totalProgress = requiredAbilities.reduce((sum, ability) => {
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
        assessment_date: new Date().toISOString().split('T')[0],
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
          return {
            goal_id: goal.id,
            assessment_mode: 'progress' as const,
            progress_level: goalAssessments[goal.id]?.level || 0
          };
        }
      });

      // 將目標資料添加到評估物件中（用於父組件處理）
      const assessmentWithGoals = {
        ...assessment,
        goals: goalsData
      };

      console.log('準備調用父組件的 onSubmit');
      console.log('assessmentWithGoals:', assessmentWithGoals);
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
          <span className="text-sm font-medium text-[#2B3A3B]">{label}</span>
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
                </label>
                <div className="relative">
                  <button
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                    type="button"
                    onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  >
                    {selectedStudent ? (
                      <div>
                        <div className="font-medium text-[#2B3A3B]">{selectedStudent.full_name}</div>
                        <div className="text-sm text-[#A68A64]">
                          {selectedStudent.nick_name && `${selectedStudent.nick_name} • `}
                          {studentTrees.length > 0 
                            ? `${studentTrees.length} 個成長樹`
                            : '未分配成長樹'
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#A68A64]">請選擇學生</span>
                    )}
                  </button>
                  {showStudentDropdown && (
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
                      <span className="text-xl mr-1">🌳</span>
                      選擇成長樹
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
                          <span className="text-[#A68A64]">請選擇成長樹</span>
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
                      <span className="text-yellow-600 text-lg">⚠️</span>
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
              </div>

              {/* 評估日期顯示 */}
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  評估日期
                </label>
                <div className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg bg-[#FFF9F2] text-[#2B3A3B]">
                  {new Date().toLocaleDateString('zh-TW', {
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
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                    type="button"
                    onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                  >
                    {selectedTeacherId ? (
                      (() => {
                        const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
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

            {/* 右側：成長目標和能力評估 */}
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
                  <div className="text-6xl mb-4">🌳</div>
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
                  <div className="text-4xl mb-4">🌳</div>
                  <h4 className="text-lg font-medium text-[#2B3A3B] mb-2">請選擇成長樹</h4>
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
                      <h4 className="font-medium text-[#2B3A3B] mb-2">
                        🌳 {selectedTree.tree_name}
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
                                  <span className="text-green-600 text-sm">✅ 已完成</span>
                                )}
                                {goalAssessments[goal.id]?.level && (
                                  <span className="text-blue-600 text-sm">📊 已評估 (等級 {goalAssessments[goal.id].level})</span>
                                )}
                                {(goal as any).assessment_mode === 'multi_select' && (
                                  <span className="text-purple-600 text-sm">🔗 多選模式</span>
                                )}
                                {(goal as any).assessment_mode === 'multi_select' && multiSelectAssessments[goal.id] && multiSelectAssessments[goal.id].length > 0 && (
                                  <span className="text-blue-600 text-sm">📊 已評估 ({multiSelectAssessments[goal.id].length} 項)</span>
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
                                {/* 渲染目標 ${goal.id} 的進度項目，當前狀態: ${JSON.stringify(goalAssessments[goal.id])} */}
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
               !selectedTreeId ? '請選擇成長樹' : 
               isEditMode ? '更新評估' : '儲存評估'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
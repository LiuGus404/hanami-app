'use client';

import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { ResponsiveNavigationDropdown } from '@/components/ui/ResponsiveNavigationDropdown';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import AddGrowthTreeModal from '@/components/ui/AddGrowthTreeModal';
import { GrowthTreeDetailModal, GrowthTreeStudentsModal } from '@/components/ui';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { supabase } from '@/lib/supabase';
import { GrowthTree, GrowthGoal } from '@/types/progress';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/outline';
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
}>;

type GrowthTreesPageProps = {
  navigationOverrides?: NavigationOverrides;
  forcedOrgId?: string | null;
  forcedOrgName?: string | null;
  disableOrgFallback?: boolean;
};

export default function GrowthTreesPage({
  navigationOverrides,
  forcedOrgId = null,
  forcedOrgName = null,
  disableOrgFallback = false,
}: GrowthTreesPageProps = {}) {
  const { currentOrganization } = useOrganization();
  
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
      ...(navigationOverrides ?? {}),
    }),
    [navigationOverrides],
  );

  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [goals, setGoals] = useState<GrowthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTree, setEditingTree] = useState<GrowthTree | null>(null);
  const [abilitiesOptions, setAbilitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [activitiesOptions, setActivitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<{ value: string; label: string }[]>([]);
  const [courseTypesOptions, setCourseTypesOptions] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 詳細視窗狀態
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState<GrowthTree | null>(null);
  const [studentsInTree, setStudentsInTree] = useState<any[]>([]);

  // 刪除確認狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<GrowthTree | null>(null);

  // 學生管理狀態
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedTreeForStudents, setSelectedTreeForStudents] = useState<GrowthTree | null>(null);

  // 搜尋和篩選狀態
  const [filters, setFilters] = useState({
    search: '',
    tree_levels: [] as number[],
    statuses: [] as string[],
    abilities: [] as string[],
    activities: [] as string[],
  });

  // 彈出選擇相關狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);

  const UUID_REGEX =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const PLACEHOLDER_ORG_IDS = new Set([
    'default-org',
    'unassigned-org-placeholder',
  ]);

  // 優先使用 forcedOrgId，如果沒有則使用 OrganizationContext 中的機構 ID
  const orgIdFromContext = useMemo(() => {
    if (!currentOrganization?.id) return null;
    return UUID_REGEX.test(currentOrganization.id) && !PLACEHOLDER_ORG_IDS.has(currentOrganization.id)
      ? currentOrganization.id
      : null;
  }, [currentOrganization?.id]);

  const normalizedForcedOrgId = useMemo(() => {
    if (!forcedOrgId) return null;
    return UUID_REGEX.test(forcedOrgId) && !PLACEHOLDER_ORG_IDS.has(forcedOrgId)
      ? forcedOrgId
      : null;
  }, [forcedOrgId]);

  const invalidForcedId = forcedOrgId !== null && !normalizedForcedOrgId;
  const validOrgId = normalizedForcedOrgId || orgIdFromContext;
  const orgDataDisabled =
    (disableOrgFallback && !validOrgId) || invalidForcedId;
  const organizationNameLabel = forcedOrgName ?? currentOrganization?.name ?? null;

  const applyOrgFilter = useCallback(<T extends { eq: (column: string, value: any) => T }>(
    query: T,
    column = 'org_id',
  ) => {
    if (validOrgId) {
      return query.eq(column, validOrgId);
    }
    return query;
  }, [validOrgId]);

  const ensureOrgAvailable = useCallback(() => {
    if (!validOrgId || orgDataDisabled) {
      toast.error('請先創建屬於您的機構');
      return false;
    }
    return true;
  }, [validOrgId, orgDataDisabled]);

useEffect(() => {
  loadAllData();
}, [orgDataDisabled, validOrgId]);

  const loadAllData = async () => {
    if (orgDataDisabled || !validOrgId) {
      setTrees([]);
      setGoals([]);
      setAbilitiesOptions([]);
      setActivitiesOptions([]);
      setTeachersOptions([]);
      setCourseTypesOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('開始載入資料...');
      
      // 成長樹
      let treesQuery = supabase
        .from('hanami_growth_trees')
        .select('*')
        .order('tree_name');
      treesQuery = applyOrgFilter(treesQuery);
      const { data: treesData, error: treesError } = await treesQuery;
      if (treesError) throw treesError;
      const fixedTrees = (treesData || []).map((t: any) => ({
        ...t,
        course_type: t.course_type_id ?? t.course_type ?? '',
        tree_description: t.tree_description ?? undefined,
      }));
      setTrees(fixedTrees);
      console.log('載入成長樹:', fixedTrees);
      
      // 目標
      let goalsQuery = supabase
        .from('hanami_growth_goals')
        .select('*')
        .order('goal_order');
      goalsQuery = applyOrgFilter(goalsQuery);
      const { data: goalsData, error: goalsError } = await goalsQuery;
      if (goalsError) throw goalsError;
      const fixedGoals = (goalsData || []).map((g: any) => {
        console.log(`處理目標 ${g.goal_name} 的原始資料:`, g);
        
        // 確保進度內容是陣列且過濾空值
        const progressContents = Array.isArray(g.progress_contents) 
          ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
          : [];
        
        const fixedGoal = {
          ...g,
          is_completed: g.is_completed ?? false,
          progress_max: Number(g.progress_max) || 5,
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
          progress_contents: progressContents,
          goal_description: g.goal_description ?? '',
          // 確保評估模式欄位存在
          assessment_mode: g.assessment_mode || 'progress',
          multi_select_levels: Array.isArray(g.multi_select_levels) ? g.multi_select_levels : [],
          multi_select_descriptions: Array.isArray(g.multi_select_descriptions) ? g.multi_select_descriptions : [],
        };
        console.log(`處理後目標 ${g.goal_name} 的資料:`, fixedGoal);
        return fixedGoal;
      });
      setGoals(fixedGoals);
      console.log('載入目標:', fixedGoals);
      
      // 發展能力
      let abilitiesQuery = supabase
        .from('hanami_development_abilities')
        .select('id, ability_name')
        .order('ability_name');
      abilitiesQuery = applyOrgFilter(abilitiesQuery);
      const { data: abilitiesData, error: abilitiesError } = await abilitiesQuery;
      if (abilitiesError) throw abilitiesError;
      setAbilitiesOptions((abilitiesData || []).map((a: any) => ({ value: a.id, label: a.ability_name })));
      
      // 活動
      let activitiesQuery = supabase
        .from('hanami_teaching_activities')
        .select('id, activity_name')
        .order('activity_name');
      activitiesQuery = applyOrgFilter(activitiesQuery);
      const { data: activitiesData, error: activitiesError } = await activitiesQuery;
      if (activitiesError) throw activitiesError;
      setActivitiesOptions((activitiesData || []).map((a: any) => ({ value: a.id, label: a.activity_name })));
      
      // 老師
      let teachersQuery = supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname')
        .order('teacher_nickname');
      teachersQuery = applyOrgFilter(teachersQuery);
      const { data: teachersData, error: teachersError } = await teachersQuery;
      if (teachersError) throw teachersError;
      // 管理員
      let adminsQuery = supabase
        .from('hanami_admin')
        .select('id, admin_name')
        .order('admin_name');
      adminsQuery = applyOrgFilter(adminsQuery);
      const { data: adminsData, error: adminsError } = await adminsQuery;
      if (adminsError) throw adminsError;
      setTeachersOptions([
        ...((teachersData || []).map((t: any) => ({ value: t.id, label: t.teacher_nickname || t.teacher_fullname || '老師' }))),
        ...((adminsData || []).map((a: any) => ({ value: a.id, label: `${a.admin_name}（管理員）` }))),
      ]);
      
      // 課程類型
      let courseTypesQuery = supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true)
        .order('name');
      courseTypesQuery = applyOrgFilter(courseTypesQuery);
      const { data: courseTypesData, error: courseTypesError } = await courseTypesQuery;
      if (courseTypesError) throw courseTypesError;
      setCourseTypesOptions((courseTypesData || []).map((ct: any) => ({ value: ct.id, label: ct.name })));
      
      console.log('資料載入完成');
    } catch (err: any) {
      console.error('資料載入失敗:', err);
      setError(`資料載入失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // 新增成長樹與目標
  const handleAddTree = async (treeData: any, goals: any[]) => {
    if (!ensureOrgAvailable()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('開始新增成長樹:', treeData);
      console.log('目標資料:', goals);
      
      // 1. 新增成長樹
      const { data: treeInsert, error: treeError } = await supabase
        .from('hanami_growth_trees')
        .insert([{
          tree_name: treeData.tree_name,
          tree_description: treeData.tree_description,
          tree_icon: treeData.tree_icon,
          course_type_id: treeData.course_type,
          tree_level: treeData.tree_level,
          is_active: true,
          org_id: validOrgId,
        }])
        .select()
        .single();
      
      if (treeError) {
        console.error('新增成長樹失敗:', treeError);
        throw treeError;
      }
      
      console.log('成長樹新增成功:', treeInsert);
      const treeId = treeInsert.id;
      
      // 2. 新增所有目標
      if (goals && goals.length > 0) {
        const goalsInsert = goals.map((g, idx) => {
          // 確保進度內容是陣列且過濾空值
          const progressContents = Array.isArray(g.progress_contents) 
            ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
            : [];
          
          const goalData = {
            tree_id: treeId,
            goal_name: g.goal_name,
            goal_description: g.goal_description,
            goal_icon: g.goal_icon,
            goal_order: idx + 1,
            is_achievable: true,
            is_completed: false,
            progress_max: Number(g.progress_max) || 5,
            required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
            related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
            progress_contents: progressContents,
            // 添加評估模式欄位
            assessment_mode: g.assessment_mode || 'progress',
            multi_select_levels: Array.isArray(g.multi_select_levels) ? g.multi_select_levels : [],
            multi_select_descriptions: Array.isArray(g.multi_select_descriptions) ? g.multi_select_descriptions : [],
            org_id: validOrgId,
          };
          console.log(`新增目標 ${g.goal_name} 的資料:`, goalData);
          return goalData;
        });
        
        console.log('準備新增目標:', goalsInsert);
        
        const { data: goalsData, error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .insert(goalsInsert)
          .select();
          
        if (goalsError) {
          console.error('新增目標失敗:', goalsError);
          throw goalsError;
        }
        
        console.log('目標新增成功:', goalsData);
      }
      
      // 3. 重新載入資料
      console.log('重新載入資料...');
      await loadAllData();
      
      console.log('新增完成，關閉模態框');
      setShowAddModal(false);
    } catch (err: any) {
      console.error('新增失敗:', err);
      setError(`新增失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新成長樹與目標
  const handleUpdateTree = async (treeData: any, goals: any[]) => {
    if (!ensureOrgAvailable()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('開始更新成長樹:', treeData);
      console.log('目標資料:', goals);
      
      if (!editingTree) {
        throw new Error('沒有要編輯的成長樹');
      }
      
      // 1. 更新成長樹
      let treeUpdate = supabase
        .from('hanami_growth_trees')
        .update({
          tree_name: treeData.tree_name,
          tree_description: treeData.tree_description,
          tree_color: treeData.tree_color,
          tree_icon: treeData.tree_icon,
          review_teachers: treeData.review_teachers,
          notes: treeData.notes,
          tree_level: treeData.tree_level,
        });
      treeUpdate = applyOrgFilter(treeUpdate);
      const { error: treeError } = await treeUpdate.eq('id', editingTree.id);
      
      if (treeError) {
        console.error('更新成長樹失敗:', treeError);
        throw treeError;
      }
      
      console.log('成長樹更新成功');
      
      // 2. 獲取現有目標的所有資料
      let existingGoalsQuery = supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', editingTree.id);
      existingGoalsQuery = applyOrgFilter(existingGoalsQuery);
      const { data: existingGoals, error: fetchError } = await existingGoalsQuery;
      
      if (fetchError) {
        console.error('獲取現有目標失敗:', fetchError);
        throw fetchError;
      }
      
      // 創建現有目標資料映射
      const existingGoalsMap = new Map();
      (existingGoals || []).forEach(goal => {
        existingGoalsMap.set(goal.goal_name, goal);
      });
      
      // 3. 刪除現有目標
      let deleteExistingGoalsQuery = supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('tree_id', editingTree.id);
      deleteExistingGoalsQuery = applyOrgFilter(deleteExistingGoalsQuery);
      const { error: deleteError } = await deleteExistingGoalsQuery;
      
      if (deleteError) {
        console.error('刪除現有目標失敗:', deleteError);
        throw deleteError;
      }
      
      // 4. 新增新目標，保留現有資料
      if (goals && goals.length > 0) {
        const goalsInsert = goals.map((g, idx) => {
          const existingGoal = existingGoalsMap.get(g.goal_name);
          
          // 優先使用新資料，如果新資料為空則使用現有資料
          const progressContents = Array.isArray(g.progress_contents) && g.progress_contents.length > 0
            ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
            : (Array.isArray(existingGoal?.progress_contents) && existingGoal.progress_contents.length > 0
              ? (existingGoal.progress_contents as string[]).filter(content => content && content.trim() !== '')
              : []);
          
          const goalData = {
            tree_id: editingTree.id,
            goal_name: g.goal_name,
            goal_description: g.goal_description,
            goal_icon: g.goal_icon,
            goal_order: idx + 1,
            is_achievable: true,
            is_completed: existingGoal?.is_completed || false, // 保留現有完成狀態
            progress_max: Number(g.progress_max || existingGoal?.progress_max || 5), // 優先使用新資料
            required_abilities: Array.isArray(g.required_abilities) && g.required_abilities.length > 0
              ? g.required_abilities 
              : (Array.isArray(existingGoal?.required_abilities) ? existingGoal.required_abilities : []),
            related_activities: Array.isArray(g.related_activities) && g.related_activities.length > 0
              ? g.related_activities 
              : (Array.isArray(existingGoal?.related_activities) ? existingGoal.related_activities : []),
            progress_contents: progressContents,
            // 添加評估模式欄位
            assessment_mode: g.assessment_mode || existingGoal?.assessment_mode || 'progress',
            multi_select_levels: Array.isArray(g.multi_select_levels) && g.multi_select_levels.length > 0
              ? g.multi_select_levels 
              : (Array.isArray(existingGoal?.multi_select_levels) ? existingGoal.multi_select_levels : []),
            multi_select_descriptions: Array.isArray(g.multi_select_descriptions) && g.multi_select_descriptions.length > 0
              ? g.multi_select_descriptions 
              : (Array.isArray(existingGoal?.multi_select_descriptions) ? existingGoal.multi_select_descriptions : []),
            org_id: validOrgId,
          };
          console.log(`目標 ${g.goal_name} 的資料:`, goalData);
          return goalData;
        });
        
        console.log('準備新增目標:', goalsInsert);
        
        const { data: goalsData, error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .insert(goalsInsert)
          .select();
          
        if (goalsError) {
          console.error('新增目標失敗:', goalsError);
          throw goalsError;
        }
        
        console.log('目標新增成功:', goalsData);
      }
      
      // 4. 重新載入資料
      console.log('重新載入資料...');
      await loadAllData();
      
      console.log('更新完成，關閉模態框');
      setEditingTree(null);
    } catch (err: any) {
      console.error('更新失敗:', err);
      setError(`更新失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTree = async (id: string) => {
    if (!confirm('確定要刪除此成長樹嗎？相關的目標也會被刪除。')) return;
    if (!ensureOrgAvailable()) return;

    try {
      // 先刪除相關的目標
      let deleteGoalsQuery = supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('tree_id', id);
      deleteGoalsQuery = applyOrgFilter(deleteGoalsQuery);
      await deleteGoalsQuery;

      // 再刪除成長樹
      let deleteTreeQuery = supabase
        .from('hanami_growth_trees')
        .delete()
        .eq('id', id);
      deleteTreeQuery = applyOrgFilter(deleteTreeQuery);
      const { error } = await deleteTreeQuery;

      if (error) throw error;
      await loadAllData();
    } catch (error) {
      console.error('刪除成長樹失敗:', error);
    }
  };

  const getGoalsForTree = (treeId: string) => {
    const treeGoals = goals.filter(goal => goal.tree_id === treeId);
    console.log(`取得成長樹 ${treeId} 的目標:`, treeGoals);
    return treeGoals;
  };

  // 載入現有目標
  const loadExistingGoals = async (treeId: string) => {
    if (orgDataDisabled || !validOrgId) {
      return [];
    }

    try {
      let goalsQuery = supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId)
        .order('goal_order');
      goalsQuery = applyOrgFilter(goalsQuery);
      const { data: goalsData, error: goalsError } = await goalsQuery;
      
      if (goalsError) throw goalsError;
      
      return (goalsData || []).map((g: any) => {
        console.log(`loadExistingGoals - 處理目標 ${g.goal_name} 的資料:`, g);
        
        // 確保進度內容是陣列且過濾空值
        const progressContents = Array.isArray(g.progress_contents) 
          ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
          : [];
        
        return {
          goal_name: g.goal_name,
          goal_description: g.goal_description || '',
          goal_icon: g.goal_icon || '⭐',
          progress_max: Number(g.progress_max) || 5,
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
          progress_contents: progressContents,
          // 添加評估模式欄位
          assessment_mode: g.assessment_mode || 'progress',
          multi_select_levels: Array.isArray(g.multi_select_levels) ? g.multi_select_levels : [],
          multi_select_descriptions: Array.isArray(g.multi_select_descriptions) ? g.multi_select_descriptions : [],
        };
      });
    } catch (error) {
      console.error('載入現有目標失敗:', error);
      return [];
    }
  };

  // 切換目標完成狀態
  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    if (!ensureOrgAvailable()) return;

    try {
      console.log(`切換目標 ${goalId} 的完成狀態: ${currentStatus} -> ${!currentStatus}`);
      
      let updateQuery = supabase
        .from('hanami_growth_goals')
        .update({ is_completed: !currentStatus });
      updateQuery = applyOrgFilter(updateQuery);
      const { error } = await updateQuery.eq('id', goalId);
      
      if (error) {
        console.error('切換目標完成狀態失敗:', error);
        throw error;
      }
      
      console.log('目標完成狀態切換成功');
      
      // 重新載入資料以更新顯示
      await loadAllData();
    } catch (error) {
      console.error('切換目標完成狀態失敗:', error);
      setError(`切換目標完成狀態失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 載入在此成長樹的學生資料
  const loadStudentsInTree = async (treeId: string) => {
    if (orgDataDisabled || !validOrgId) {
      setStudentsInTree([]);
      return;
    }

    try {
      console.log('載入在此成長樹的學生資料:', treeId);
      
      // 使用現有的關聯表查詢學生
      let studentsQuery = supabase
        .from('hanami_student_trees')
        .select(`
          student_id,
          enrollment_date,
          completion_date,
          tree_status,
          teacher_notes,
          start_date,
          status,
          completed_goals,
          Hanami_Students!inner (
            id,
            full_name,
            nick_name,
            student_age,
            course_type
          )
        `)
        .eq('tree_id', treeId)
        .or('status.eq.active,tree_status.eq.active');
      studentsQuery = applyOrgFilter(studentsQuery);
      const { data: studentsData, error } = await studentsQuery;
      
      if (error) {
        console.error('載入學生資料失敗:', error);
        setStudentsInTree([]);
        return;
      }
      
      console.log('載入到的學生資料:', studentsData);
      console.log('學生數量:', studentsData?.length || 0);
      
      // 轉換資料格式以符合現有介面
      const formattedStudents = (studentsData || []).map((item: any) => ({
        id: item.Hanami_Students.id,
        full_name: item.Hanami_Students.full_name,
        nick_name: item.Hanami_Students.nick_name,
        student_age: item.Hanami_Students.student_age,
        course_type: item.Hanami_Students.course_type,
        // 額外的關聯資訊
        start_date: item.start_date || item.enrollment_date,
        status: item.status || item.tree_status,
        completed_goals: item.completed_goals || []
      }));
      
      // 在客戶端排序
      formattedStudents.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      console.log('格式化後的學生資料:', formattedStudents);
      setStudentsInTree(formattedStudents);
    } catch (error) {
      console.error('載入學生資料失敗:', error);
      setStudentsInTree([]);
    }
  };

  // 打開詳細視窗
  const openDetailModal = async (tree: GrowthTree) => {
    setSelectedTree(tree);
    await loadStudentsInTree(tree.id);
    setShowDetailModal(true);
  };

  // 打開學生管理視窗
  const openStudentsModal = (tree: GrowthTree) => {
    setSelectedTreeForStudents(tree);
    setShowStudentsModal(true);
  };

  // 關閉詳細視窗
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTree(null);
    setStudentsInTree([]);
  };

  // 顯示刪除確認視窗
  const showDeleteConfirmation = (tree: GrowthTree) => {
    setTreeToDelete(tree);
    setShowDeleteConfirm(true);
  };

  // 確認刪除
  const confirmDelete = async () => {
    if (treeToDelete) {
      await handleDeleteTree(treeToDelete.id);
      setShowDeleteConfirm(false);
      setTreeToDelete(null);
    }
  };

  // 取消刪除
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTreeToDelete(null);
  };

  // 篩選處理函數
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 彈出選擇處理函數
  const handleFilterPopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    const currentValue = filters[field as keyof typeof filters] || [];
    if (Array.isArray(currentValue) && typeof currentValue[0] === 'number') {
      setPopupSelected(currentValue.map(String));
    } else {
      setPopupSelected(currentValue as string | string[]);
    }
  };

  const handleFilterPopupConfirm = () => {
    let convertedValue: any = popupSelected;
    if (showPopup.field === 'tree_levels' && Array.isArray(popupSelected)) {
      convertedValue = (popupSelected as string[]).map(Number);
    }
    setFilters(prev => ({
      ...prev,
      [showPopup.field]: convertedValue
    }));
    setShowPopup({ field: '', open: false });
  };

  const handleFilterPopupCancel = () => {
    const currentValue = filters[showPopup.field as keyof typeof filters] || [];
    if (Array.isArray(currentValue) && typeof currentValue[0] === 'number') {
      setPopupSelected(currentValue.map(String));
    } else {
      setPopupSelected(currentValue as string | string[]);
    }
    setShowPopup({ field: '', open: false });
  };

  // 清除篩選
  const clearFilters = () => {
    setFilters({
      search: '',
      tree_levels: [],
      statuses: [],
      abilities: [],
      activities: [],
    });
  };

  // 獲取篩選後的成長樹
  const getFilteredTrees = () => {
    console.log('開始篩選成長樹，總數:', trees.length);
    console.log('當前篩選條件:', filters);
    
    // 暫時禁用所有篩選，直接返回所有成長樹
    console.log('暫時禁用篩選，返回所有成長樹');
    return trees;
    
    /*
    const filtered = trees.filter(tree => {
      console.log(`檢查成長樹: ${tree.tree_name} (ID: ${tree.id})`);
      
      // 搜尋篩選
      if (filters.search && !tree.tree_name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(tree.tree_description && tree.tree_description.toLowerCase().includes(filters.search.toLowerCase()))) {
        console.log(`- 搜尋篩選失敗: ${tree.tree_name}`);
        return false;
      }

      // 成長樹等級篩選
      if (
        filters.tree_levels.length > 0 &&
        (tree.tree_level === undefined || !filters.tree_levels.includes(tree.tree_level))
      ) {
        console.log(`- 等級篩選失敗: ${tree.tree_name}, 等級: ${tree.tree_level}`);
        return false;
      }

      // 狀態篩選
      if (filters.statuses.length > 0) {
        const isActive = tree.is_active ? 'active' : 'inactive';
        if (!filters.statuses.includes(isActive)) {
          console.log(`- 狀態篩選失敗: ${tree.tree_name}, 狀態: ${isActive}`);
          return false;
        }
      }

      // 能力篩選
      if (filters.abilities.length > 0) {
        const treeGoals = getGoalsForTree(tree.id);
        const hasMatchingAbility = treeGoals.some(goal => 
          goal.required_abilities && goal.required_abilities.some(abilityId => 
            filters.abilities.includes(abilityId)
          )
        );
        if (!hasMatchingAbility) {
          console.log(`- 能力篩選失敗: ${tree.tree_name}`);
          return false;
        }
      }

      // 活動篩選
      if (filters.activities.length > 0) {
        const treeGoals = getGoalsForTree(tree.id);
        const hasMatchingActivity = treeGoals.some(goal => 
          goal.related_activities && goal.related_activities.some(activityId => 
            filters.activities.includes(activityId)
          )
        );
        if (!hasMatchingActivity) {
          console.log(`- 活動篩選失敗: ${tree.tree_name}`);
          return false;
        }
      }

      console.log(`- 通過所有篩選: ${tree.tree_name}`);
      return true;
    });
    
    console.log('篩選完成，結果數量:', filtered.length);
    return filtered;
    */
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-hanami-text">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hanami-text mb-2">
              成長樹管理
            </h1>
            <p className="text-hanami-text-secondary">
              管理教學成長樹和學習目標
            </p>
          </div>
          <HanamiButton
            className="bg-gradient-to-r from-hanami-primary to-hanami-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={orgDataDisabled || !validOrgId}
            onClick={() => {
              if (!ensureOrgAvailable()) return;
              setShowAddModal(true);
            }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            新增成長樹
          </HanamiButton>
        </div>

        {/* 學生進度管理導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <ResponsiveNavigationDropdown
            items={[
              { label: '進度管理面板', href: navigationPaths.dashboard, icon: BarChart3 },
              { label: '成長樹管理', href: navigationPaths.growthTrees, icon: TreePine },
              { label: '學習路線管理', href: navigationPaths.learningPaths, icon: BookOpenIcon },
              { label: '發展能力圖卡', href: navigationPaths.abilities, icon: TrendingUp },
              { label: '教學活動管理', href: navigationPaths.activities, icon: Gamepad2 },
              { label: '能力評估管理', href: navigationPaths.assessments, icon: AcademicCapIcon },
              { label: '學生媒體管理', href: navigationPaths.media, icon: VideoCameraIcon },
              { label: '返回學生管理', href: navigationPaths.studentManagement, icon: Users },
            ]}
            currentPage={navigationPaths.growthTrees}
          />
        </div>

        {(orgDataDisabled || !validOrgId) && (
          <div className="mx-auto mb-6 flex max-w-xl flex-col items-center justify-center rounded-3xl border border-hanami-border bg-white px-8 py-12 text-center shadow-sm">
            <div className="mb-4">
              <Image alt="機構提示" height={64} src="/tree ui.png" width={64} />
            </div>
            <h2 className="text-lg font-semibold text-hanami-text">尚未設定機構資料</h2>
            <p className="mt-2 text-sm text-hanami-text-secondary">
              請先創建屬於您的機構
              {organizationNameLabel ? `（${organizationNameLabel}）` : ''}
              ，並建立成長樹資料後再查看內容。
            </p>
          </div>
        )}

        {orgDataDisabled || !validOrgId ? null : (
          <>
            {/* 搜尋和篩選工具列 */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-hanami-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* 搜尋和篩選 */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <HanamiInput
                      className="pl-10"
                      placeholder="搜尋成長樹名稱或描述..."
                      value={filters.search}
                      onChange={(value) => handleFilterChange('search', value)}
                    />
                  </div>
                  
                  {/* 成長樹等級多選篩選 */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
                      type="button"
                      onClick={() => handleFilterPopupOpen('tree_levels')}
                    >
                      <FunnelIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">成長樹等級</span>
                      {filters.tree_levels.length > 0 && (
                        <span className="ml-auto bg-hanami-primary text-white text-xs rounded-full px-2 py-1">
                          {filters.tree_levels.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* 狀態多選篩選 */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                      type="button"
                      onClick={() => handleFilterPopupOpen('statuses')}
                    >
                      <FunnelIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">狀態</span>
                      {filters.statuses.length > 0 && (
                        <span className="ml-auto bg-hanami-secondary text-white text-xs rounded-full px-2 py-1">
                          {filters.statuses.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* 能力多選篩選 */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                      type="button"
                      onClick={() => handleFilterPopupOpen('abilities')}
                    >
                      <FunnelIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">能力</span>
                      {filters.abilities.length > 0 && (
                        <span className="ml-auto bg-hanami-accent text-white text-xs rounded-full px-2 py-1">
                          {filters.abilities.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* 活動多選篩選 */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                      type="button"
                      onClick={() => handleFilterPopupOpen('activities')}
                    >
                      <FunnelIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">活動</span>
                      {filters.activities.length > 0 && (
                        <span className="ml-auto bg-hanami-success text-white text-xs rounded-full px-2 py-1">
                          {filters.activities.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 清除篩選按鈕 */}
                <div className="flex items-center gap-2">
                  <HanamiButton
                    variant="secondary"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    清除篩選
                  </HanamiButton>
                </div>
              </div>

              {/* 已選擇的篩選條件顯示 */}
              {(filters.tree_levels.length > 0 || filters.statuses.length > 0 || filters.abilities.length > 0 || filters.activities.length > 0) && (
                <div className="mt-4 pt-4 border-t border-hanami-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-700">已選擇的篩選條件：</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.tree_levels.map(level => (
                      <span key={level} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-primary text-white text-xs rounded-full">
                        等級 {level}
                        <button
                          onClick={() => handleFilterChange('tree_levels', filters.tree_levels.filter(l => l !== level))}
                          className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {filters.statuses.map(status => (
                      <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-secondary text-white text-xs rounded-full">
                        {status === 'active' ? '啟用' : '停用'}
                        <button
                          onClick={() => handleFilterChange('statuses', filters.statuses.filter(s => s !== status))}
                          className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {filters.abilities.map(abilityId => {
                      const ability = abilitiesOptions.find(a => a.value === abilityId);
                      return (
                        <span key={abilityId} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-accent text-white text-xs rounded-full">
                          {ability?.label || abilityId}
                          <button
                            onClick={() => handleFilterChange('abilities', filters.abilities.filter(a => a !== abilityId))}
                            className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {filters.activities.map(activityId => {
                      const activity = activitiesOptions.find(a => a.value === activityId);
                      return (
                        <span key={activityId} className="inline-flex items-center gap-1 px-2 py-1 bg-hanami-success text-white text-xs rounded-full">
                          {activity?.label || activityId}
                          <button
                            onClick={() => handleFilterChange('activities', filters.activities.filter(a => a !== activityId))}
                            className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 統計資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-hanami-text mb-2">
                  {getFilteredTrees().length}
                </div>
                <div className="text-sm text-hanami-text-secondary">總成長樹數</div>
              </HanamiCard>
              
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {getFilteredTrees().filter(t => t.is_active).length}
                </div>
                <div className="text-sm text-hanami-text-secondary">啟用中</div>
              </HanamiCard>
              
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {goals.length}
                </div>
                <div className="text-sm text-hanami-text-secondary">總目標數</div>
              </HanamiCard>
              
              <HanamiCard className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {abilitiesOptions.length}
                </div>
                <div className="text-sm text-hanami-text-secondary">相關能力</div>
              </HanamiCard>
            </div>
          </>
        )}

        {/* 彈出選擇組件 */}
        {showPopup.open && (
          <PopupSelect
            mode="multiple"
            options={
              showPopup.field === 'tree_levels'
                ? [1, 2, 3, 4, 5].map(level => ({ value: level.toString(), label: `等級 ${level}` }))
                : showPopup.field === 'statuses'
                ? [
                    { value: 'active', label: '啟用' },
                    { value: 'inactive', label: '停用' }
                  ]
                : showPopup.field === 'abilities'
                ? abilitiesOptions
                : showPopup.field === 'activities'
                ? activitiesOptions
                : []
            }
            selected={popupSelected}
            title={
              showPopup.field === 'tree_levels' ? '選擇成長樹等級' :
              showPopup.field === 'statuses' ? '選擇狀態' :
              showPopup.field === 'abilities' ? '選擇能力' :
              showPopup.field === 'activities' ? '選擇活動' : '選擇'
            }
            onCancel={handleFilterPopupCancel}
            onChange={(value: string | string[]) => setPopupSelected(value)}
            onConfirm={handleFilterPopupConfirm}
          />
        )}

        {showAddModal && (
          <AddGrowthTreeModal
            abilitiesOptions={abilitiesOptions}
            activitiesOptions={activitiesOptions}
            editingTree={null}
            teachersOptions={teachersOptions}
            courseTypesOptions={courseTypesOptions}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddTree}
            organizationName={organizationNameLabel}
            organizationId={validOrgId}
          />
        )}

        {editingTree && (
          <AddGrowthTreeModal
            abilitiesOptions={abilitiesOptions}
            activitiesOptions={activitiesOptions}
            editingTree={{
              ...editingTree,
              goals: getGoalsForTree(editingTree.id).map((g: any) => {
                console.log(`編輯模式 - 處理目標 ${g.goal_name} 的資料:`, g);
                
                // 確保進度內容是陣列且過濾空值
                const progressContents = Array.isArray(g.progress_contents) 
                  ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
                  : [];
                
                return {
                  goal_name: g.goal_name,
                  goal_description: g.goal_description || '',
                  goal_icon: g.goal_icon || '⭐',
                  progress_max: Number(g.progress_max) || 5,
                  required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
                  related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
                  progress_contents: progressContents,
                  // 添加評估模式欄位
                  assessment_mode: g.assessment_mode || 'progress',
                  multi_select_levels: Array.isArray(g.multi_select_levels) ? g.multi_select_levels : [],
                  multi_select_descriptions: Array.isArray(g.multi_select_descriptions) ? g.multi_select_descriptions : [],
                };
              }),
            }}
            teachersOptions={teachersOptions}
            courseTypesOptions={courseTypesOptions}
            onClose={() => setEditingTree(null)}
            onSubmit={handleUpdateTree}
            organizationName={organizationNameLabel}
            organizationId={validOrgId}
          />
        )}

        {/* 詳細視窗 */}
        {showDetailModal && selectedTree && (
          <GrowthTreeDetailModal
            tree={selectedTree}
            goals={getGoalsForTree(selectedTree.id)}
            abilitiesOptions={abilitiesOptions}
            activitiesOptions={activitiesOptions}
            teachersOptions={teachersOptions}
            courseTypesOptions={courseTypesOptions}
            studentsInTree={studentsInTree}
            onClose={closeDetailModal}
            onEdit={() => {
              closeDetailModal();
              setEditingTree(selectedTree);
            }}
            onManageStudents={() => {
              closeDetailModal();
              openStudentsModal(selectedTree);
            }}
          />
        )}

        {/* 學生管理視窗 */}
        {showStudentsModal && selectedTreeForStudents && (
          <GrowthTreeStudentsModal
            treeId={selectedTreeForStudents.id}
            treeName={selectedTreeForStudents.tree_name}
            treeCourseType={selectedTreeForStudents.course_type || ''}
            requiredAbilities={getGoalsForTree(selectedTreeForStudents.id)
              .flatMap((goal: any) => goal.required_abilities || [])
              .filter((ability: string, index: number, arr: string[]) => arr.indexOf(ability) === index)}
            relatedActivities={getGoalsForTree(selectedTreeForStudents.id)
              .flatMap((goal: any) => goal.related_activities || [])
              .filter((activity: string, index: number, arr: string[]) => arr.indexOf(activity) === index)}
            abilitiesOptions={abilitiesOptions}
            activitiesOptions={activitiesOptions}
            onClose={() => {
              setShowStudentsModal(false);
              setSelectedTreeForStudents(null);
            }}
          />
        )}

        {/* 刪除確認視窗 */}
        {showDeleteConfirm && treeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 border-b border-red-200 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <h2 className="text-xl font-bold text-white">確認刪除</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {treeToDelete?.tree_icon && treeToDelete.tree_icon !== '🌳' && treeToDelete.tree_icon !== '/tree ui.png' ? (
                    <span className="text-3xl">{treeToDelete.tree_icon}</span>
                  ) : (
                    <Image
                      src="/tree ui.png"
                      alt="成長樹圖示"
                      width={36}
                      height={36}
                      className="h-9 w-9"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-hanami-text">{treeToDelete.tree_name}</h3>
                    <p className="text-sm text-hanami-text-secondary">成長樹</p>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">
                    <strong>警告：</strong>刪除此成長樹將會：
                  </p>
                  <ul className="text-red-700 text-sm mt-2 space-y-1">
                    <li>• 永久刪除成長樹及其所有目標</li>
                    <li>• 無法恢復已刪除的資料</li>
                    <li>• 可能影響相關的學生進度記錄</li>
                  </ul>
                </div>
                
                <p className="text-hanami-text mb-6">
                  您確定要刪除成長樹 <strong>"{treeToDelete.tree_name}"</strong> 嗎？
                </p>
                
                <div className="flex gap-3 justify-end">
                  <button
                    className="px-4 py-2 text-sm font-medium text-hanami-text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={cancelDelete}
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    onClick={confirmDelete}
                  >
                    確認刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredTrees().map((tree) => {
            const treeGoals = getGoalsForTree(tree.id);
            const completedGoals = treeGoals.filter(goal => goal.is_completed).length;
            
            return (
              <HanamiCard key={tree.id} className="p-6 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer border border-[#EADBC8] relative" onClick={() => openDetailModal(tree)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="text-lg font-semibold text-hanami-text mb-2 flex items-start gap-2 break-words">
                      {tree.tree_icon && tree.tree_icon !== '🌳' && tree.tree_icon !== '/tree ui.png' ? (
                        <span className="text-2xl flex-shrink-0">{tree.tree_icon}</span>
                      ) : (
                        <Image
                          src="/tree ui.png"
                          alt="成長樹圖示"
                          width={32}
                          height={32}
                          className="h-8 w-8 flex-shrink-0"
                        />
                      )}
                      <span className="break-words">{tree.tree_name}</span>
                    </h3>
                    <p className="text-sm text-hanami-text-secondary mb-3 break-words">{tree.tree_description}</p>
                  </div>
                  <div className="flex space-x-2 absolute top-4 right-4 z-10">
                    <button
                      className="p-2 rounded-full bg-hanami-secondary hover:bg-hanami-accent shadow text-hanami-text"
                      title="編輯"
                      onClick={e => { e.stopPropagation(); setEditingTree(tree); }}
                    >
                      <svg fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21H3v-4.5L15.232 5.232Z" stroke="#A64B2A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
                    </button>
                    <button
                      className="p-2 rounded-full bg-hanami-danger hover:bg-red-400 shadow text-hanami-text"
                      title="刪除"
                      onClick={e => { e.stopPropagation(); showDeleteConfirmation(tree); }}
                    >
                      <svg fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="M6 18 18 6M6 6l12 12" stroke="#A64B2A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap items-center text-sm text-hanami-text-secondary gap-2">
                    <span className="break-words">課程類型: {
                      tree.course_type 
                        ? (courseTypesOptions.find(opt => opt.value === tree.course_type)?.label || tree.course_type)
                        : '未指定'
                    }</span>
                    <span className="flex-shrink-0">等級: Lv.{tree.tree_level || 1}</span>
                    <span className="flex-shrink-0">狀態: {tree.is_active ? '啟用' : '停用'}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-hanami-text">目標進度</span>
                    <span className="text-sm text-hanami-text-secondary">{completedGoals}/{treeGoals.length}</span>
                  </div>
                  <div className="w-full bg-hanami-surface rounded-full h-2">
                    <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary h-2 rounded-full transition-all duration-300" style={{ width: `${treeGoals.length > 0 ? (completedGoals / treeGoals.length) * 100 : 0}%` }} />
                  </div>
                </div>
                {treeGoals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-hanami-text mb-2">目標列表:</p>
                    <div className="space-y-1">
                      {treeGoals.slice(0, 3).map((goal) => (
                        <div 
                          key={goal.id} 
                          className="flex items-start text-sm gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                          title={`點擊切換完成狀態: ${goal.is_completed ? '已完成' : '未完成'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGoalCompletion(goal.id, goal.is_completed);
                          }}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 mt-1.5 flex-shrink-0 ${goal.is_completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={`text-xs break-words flex-1 ${goal.is_completed ? 'text-green-600' : 'text-hanami-text-secondary'}`}>
                            {(goal.goal_icon === '/apple-icon.svg' || !goal.goal_icon || goal.goal_icon === '⭐') ? (
                              <Image
                                src="/apple-icon.svg"
                                alt="目標圖案"
                                width={20}
                                height={20}
                                className="h-5 w-5 inline-block align-middle mr-1"
                              />
                            ) : (
                              <span className="text-lg">{goal.goal_icon}</span>
                            )} {goal.goal_name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {goal.is_completed ? '✓' : '○'}
                          </span>
                        </div>
                      ))}
                      {treeGoals.length > 3 && (
                        <p className="text-xs text-hanami-text-secondary">還有 {treeGoals.length - 3} 個目標...</p>
                      )}
                    </div>
                  </div>
                )}
              </HanamiCard>
            );
          })}
        </div>

        {getFilteredTrees().length === 0 && (
          <div className="text-center py-12">
            <p className="text-hanami-text-secondary">
              {trees.length === 0 ? '尚無成長樹' : '沒有符合篩選條件的成長樹'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { 
  StarIcon, 
  AcademicCapIcon, 
  UserIcon, 
  CalendarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { ResponsiveNavigationDropdown } from '@/components/ui/ResponsiveNavigationDropdown';

import { HanamiButton, HanamiCard, SimpleAbilityAssessmentModal, PopupSelect } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string | null;
}

interface AbilityAssessment {
  id: string;
  student_id: string;
  tree_id: string;
  assessment_date: string;
  lesson_date: string;
  teacher_id?: string | null;
  ability_assessments: {
    [ability_id: string]: {
      level: number;
      notes: string;
      rating: number;
    };
  };
  overall_performance_rating: number;
  general_notes: string | null;
  next_lesson_focus: string | null;
  created_at: string;
  updated_at?: string;
  selected_goals?: any[];
  student?: Student;
  tree?: GrowthTree;
}

export default function AbilityAssessmentsPage() {
  const [assessments, setAssessments] = useState<AbilityAssessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<AbilityAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedGrowthTrees, setSelectedGrowthTrees] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  
  // PopupSelect 相關狀態
  const [showGrowthTreeSelect, setShowGrowthTreeSelect] = useState(false);
  const [showCourseSelect, setShowCourseSelect] = useState(false);
  const [tempSelectedGrowthTrees, setTempSelectedGrowthTrees] = useState<string[]>([]);
  const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>([]);
  
  // 課程類型資料
  const [courseTypes, setCourseTypes] = useState<{id: string, name: string | null}[]>([]);
  
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AbilityAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<AbilityAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeAbilities, setTreeAbilities] = useState<{[treeId: string]: any[]}>({});
  const [treeGoals, setTreeGoals] = useState<{[treeId: string]: any[]}>({});

  useEffect(() => {
    loadData();
    loadCourseTypes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assessments, searchQuery, dateRange, selectedGrowthTrees, selectedCourses]);

  // 當打開詳細資訊視窗時載入成長樹能力
  useEffect(() => {
    console.log('=== 詳細資訊視窗載入邏輯 ===');
    console.log('viewingAssessment:', viewingAssessment);
    console.log('viewingAssessment?.tree?.id:', viewingAssessment?.tree?.id);
    
    if (viewingAssessment?.tree?.id) {
      console.log('開始載入成長樹資料，treeId:', viewingAssessment.tree.id);
      loadTreeAbilities(viewingAssessment.tree.id);
      loadTreeGoals(viewingAssessment.tree.id);
    } else {
      console.log('❌ viewingAssessment 或 tree.id 為空');
    }
  }, [viewingAssessment?.tree?.id]);

  // 載入成長樹的所有能力
  const loadTreeAbilities = async (treeId: string) => {
    console.log('=== 載入成長樹能力 ===');
    console.log('treeId:', treeId);
    console.log('已快取的能力:', treeAbilities[treeId]);
    
    if (treeAbilities[treeId]) {
      console.log('使用快取的能力資料');
      return treeAbilities[treeId];
    }

    try {
      console.log('開始載入能力資料...');
      // 載入成長樹的目標
      console.log('查詢目標資料，treeId:', treeId);
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('required_abilities')
        .eq('tree_id', treeId);

      console.log('目標查詢結果:', { goalsData, goalsError });
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
      console.log('提取的能力ID:', Array.from(abilityIds));
      
      if (abilityIds.size > 0) {
        console.log('查詢能力詳細資訊...');
        const { data: abilitiesResult, error: abilitiesError } = await supabase
          .from('hanami_development_abilities')
          .select('*')
          .in('id', Array.from(abilityIds))
          .order('ability_name');

        console.log('能力查詢結果:', { abilitiesResult, abilitiesError });
        if (abilitiesError) throw abilitiesError;
        abilitiesData = abilitiesResult || [];
      } else {
        console.log('沒有找到需要的能力ID');
      }

      // 快取結果
      console.log('快取能力資料:', abilitiesData);
      setTreeAbilities(prev => ({
        ...prev,
        [treeId]: abilitiesData
      }));

      console.log('✅ 能力載入完成');
      return abilitiesData;
    } catch (error) {
      console.error('載入成長樹能力失敗:', error);
      return [];
    }
  };

  // 載入成長樹的目標
  const loadTreeGoals = async (treeId: string) => {
    console.log('=== 載入成長樹目標 ===');
    console.log('treeId:', treeId);
    console.log('已快取的目標:', treeGoals[treeId]);
    
    if (treeGoals[treeId]) {
      console.log('使用快取的目標資料');
      return treeGoals[treeId];
    }

    try {
      console.log('開始載入目標資料...');
      console.log('查詢目標詳細資料，treeId:', treeId);
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId)
        .order('goal_order');

      console.log('目標詳細查詢結果:', { goalsData, goalsError });
      if (goalsError) throw goalsError;

      // 快取結果
      console.log('快取目標資料:', goalsData || []);
      setTreeGoals(prev => ({
        ...prev,
        [treeId]: goalsData || []
      }));

      console.log('✅ 目標載入完成');
      return goalsData || [];
    } catch (error) {
      console.error('載入成長樹目標失敗:', error);
      return [];
    }
  };

  // 載入課程類型資料
  const loadCourseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true)
        .order('name');

      if (error) {
        console.error('載入課程類型失敗:', error);
        return;
      }

      setCourseTypes(data || []);
    } catch (error) {
      console.error('載入課程類型失敗:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 開始載入評估記錄...');

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(id, full_name, nick_name, course_type),
          tree:hanami_growth_trees(id, tree_name, tree_description)
        `)
        .order('created_at', { ascending: false });

      console.log('📊 查詢結果:', {
        data: assessmentsData,
        error: assessmentsError,
        count: assessmentsData?.length || 0
      });

      if (assessmentsError) {
        console.error('❌ 載入評估記錄失敗:', assessmentsError);
        setError('載入評估記錄失敗: ' + assessmentsError.message);
        return;
      }

      console.log('✅ 成功載入評估記錄:', assessmentsData?.length || 0, '個記錄');
      console.log('📋 評估記錄詳細:', assessmentsData);
      
      // 確保資料格式正確
      const normalizedData = (assessmentsData || []).map(assessment => ({
        ...assessment,
        updated_at: assessment.updated_at || assessment.created_at,
        selected_goals: assessment.selected_goals || []
      }));
      
      setAssessments(normalizedData);
    } catch (error) {
      console.error('💥 載入資料失敗:', error);
      setError('載入資料失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('🔍 開始應用篩選:', {
      originalCount: assessments.length,
      searchQuery,
      selectedGrowthTrees,
      selectedCourses,
      dateRange
    });
    
    let filtered = [...assessments];

    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(assessment => 
        assessment.student?.full_name?.toLowerCase().includes(query) ||
        assessment.tree?.tree_name?.toLowerCase().includes(query) ||
        assessment.general_notes?.toLowerCase().includes(query) ||
        assessment.next_lesson_focus?.toLowerCase().includes(query)
      );
      console.log('📝 搜尋篩選:', { beforeCount, afterCount: filtered.length, query });
    }

    // 成長樹篩選
    if (selectedGrowthTrees.length > 0) {
      filtered = filtered.filter(assessment => 
        selectedGrowthTrees.includes(assessment.tree_id)
      );
    }

    // 課程篩選
    if (selectedCourses.length > 0) {
      console.log('課程篩選開始:', {
        selectedCourses,
        courseTypes: courseTypes.map(c => ({ id: c.id, name: c.name })),
        assessmentsCount: filtered.length
      });
      
      filtered = filtered.filter(assessment => {
        if (!assessment.student?.course_type) {
          console.log('學生無課程類型:', assessment.student?.full_name);
          return false;
        }
        
        // 找到選中的課程類型名稱
        const selectedCourseNames = selectedCourses.map(courseId => {
          const courseType = courseTypes.find(c => c.id === courseId);
          return courseType?.name;
        }).filter(Boolean);
        
        const isMatch = selectedCourseNames.includes(assessment.student.course_type);
        console.log('課程篩選檢查:', {
          student: assessment.student.full_name,
          studentCourseType: assessment.student.course_type,
          selectedCourseNames,
          isMatch
        });
        
        return isMatch;
      });
      
      console.log('課程篩選後結果:', filtered.length);
    }

    // 日期範圍篩選
    if (dateRange.start) {
      filtered = filtered.filter(assessment => 
        assessment.assessment_date >= dateRange.start
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(assessment => 
        assessment.assessment_date <= dateRange.end
      );
    }

    console.log('✅ 篩選完成:', {
      originalCount: assessments.length,
      finalCount: filtered.length,
      filtered: filtered.map(a => ({
        id: a.id,
        student: a.student?.full_name,
        tree: a.tree?.tree_name,
        date: a.assessment_date
      }))
    });

    setFilteredAssessments(filtered);
  };

  const handleCreateAssessment = async (assessment: Omit<AbilityAssessment, 'id' | 'created_at'>) => {
    console.log('=== handleCreateAssessment 函數被調用 ===');
    console.log('傳入的 assessment 參數:', assessment);
    
    try {
      console.log('=== 開始處理新增評估提交 ===');
      console.log('新增的評估資料:', assessment);
      
      // 提取 goals 資料（如果存在）
      const { goals, ...assessmentData } = assessment as any;
      
      // 準備 API 調用的資料格式
      const apiData = {
        student_id: assessmentData.student_id,
        tree_id: assessmentData.tree_id,
        assessment_date: assessmentData.assessment_date,
        lesson_date: assessmentData.lesson_date || assessmentData.assessment_date, // 使用 lesson_date 或回退到 assessment_date
        teacher_id: assessmentData.teacher_id || null,
        ability_assessments: assessmentData.ability_assessments || {},
        overall_performance_rating: assessmentData.overall_performance_rating || 3,
        general_notes: assessmentData.general_notes || '',
        next_lesson_focus: assessmentData.next_lesson_focus || null,
        notes: assessmentData.general_notes || '',  // 保持向後兼容
        goals: goals || []
      };

      console.log('準備的 API 資料:', apiData);
      console.log('goals 數量:', apiData.goals.length);
      apiData.goals.forEach((goal: any, index: number) => {
        console.log(`目標 ${index + 1}:`, {
          goal_id: goal.goal_id,
          assessment_mode: goal.assessment_mode,
          progress_level: goal.progress_level,
          selected_levels: goal.selected_levels
        });
      });

      // 調用 API
      console.log('調用 API...');
      console.log('API 請求 URL:', '/api/student-ability-assessment');
      console.log('API 請求方法:', 'POST');
      console.log('API 請求標頭:', { 'Content-Type': 'application/json' });
      console.log('API 請求主體:', JSON.stringify(apiData, null, 2));
      
      const response = await fetch('/api/student-ability-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      console.log('API 回應狀態:', response.status);
      const result = await response.json();
      console.log('API 回應:', result);

      if (result.success) {
        console.log('✅ API 調用成功');
        console.log('能力評估記錄創建成功:', result.data);
        
        // 顯示成功訊息
        alert('能力評估已成功創建！');
        
        // 重新載入資料
        await loadData();
        setShowAssessmentModal(false);
        
      } else {
        console.error('❌ API 調用失敗:', result.error);
        throw new Error('創建能力評估記錄失敗: ' + result.error);
      }
      
    } catch (error) {
      console.error('創建評估失敗:', error);
      alert('創建評估失敗: ' + (error as Error).message);
    }
  };

  const handleEditAssessment = async (assessment: Omit<AbilityAssessment, 'id' | 'created_at'>) => {
    console.log('=== handleEditAssessment 函數被調用 ===');
    console.log('傳入的 assessment 參數:', assessment);
    console.log('editingAssessment 狀態:', editingAssessment);
    
    if (!editingAssessment) {
      console.log('❌ editingAssessment 為空，函數提前返回');
      return;
    }
    
    try {
      console.log('=== 開始處理編輯評估提交 ===');
      console.log('編輯的評估資料:', assessment);
      
      // 提取 goals 資料（如果存在）
      const { goals, ...assessmentData } = assessment as any;
      
      // 準備 API 調用的資料格式
      const apiData = {
        assessment_id: editingAssessment.id, // 添加現有記錄的 ID
        student_id: assessmentData.student_id,
        tree_id: assessmentData.tree_id,
        assessment_date: assessmentData.assessment_date,
        lesson_date: assessmentData.lesson_date || assessmentData.assessment_date, // 使用 lesson_date 或回退到 assessment_date
        teacher_id: assessmentData.teacher_id || null,
        ability_assessments: assessmentData.ability_assessments || {},
        overall_performance_rating: assessmentData.overall_performance_rating || 3,
        general_notes: assessmentData.general_notes || '',
        next_lesson_focus: assessmentData.next_lesson_focus || null,
        notes: assessmentData.general_notes || '',  // 保持向後兼容
        goals: goals || []
      };

      console.log('準備的 API 資料:', apiData);
      console.log('goals 數量:', apiData.goals.length);
      apiData.goals.forEach((goal: any, index: number) => {
        console.log(`目標 ${index + 1}:`, {
          goal_id: goal.goal_id,
          assessment_mode: goal.assessment_mode,
          progress_level: goal.progress_level,
          selected_levels: goal.selected_levels
        });
      });

      // 調用 API
      console.log('調用 API...');
      console.log('API 請求 URL:', '/api/student-ability-assessment');
      console.log('API 請求方法:', 'POST');
      console.log('API 請求標頭:', { 'Content-Type': 'application/json' });
      console.log('API 請求主體:', JSON.stringify(apiData, null, 2));
      
      const response = await fetch('/api/student-ability-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      console.log('API 回應狀態:', response.status);
      const result = await response.json();
      console.log('API 回應:', result);

      if (result.success) {
        console.log('✅ API 調用成功');
        console.log('能力評估記錄更新成功:', result.data);
        
        // 顯示成功訊息
        alert('能力評估已成功更新！');
        
        // 重新載入資料
        await loadData();
        
        // 更新 editingAssessment 為最新的資料，而不是設為 null
        if (result.data) {
          setEditingAssessment(result.data);
        }
        
      } else {
        console.error('❌ API 調用失敗:', result.error);
        throw new Error('更新能力評估記錄失敗: ' + result.error);
      }
      
    } catch (error) {
      console.error('更新評估失敗:', error);
      alert('更新評估失敗: ' + (error as Error).message);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('確定要刪除這筆評估記錄嗎？此操作無法復原。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hanami_ability_assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) {
        console.error('刪除評估失敗:', error);
        alert('刪除評估失敗: ' + error.message);
        return;
      }

      // 重新載入資料
      await loadData();
    } catch (error) {
      console.error('刪除評估失敗:', error);
      alert('刪除評估失敗');
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // 獲取成長樹選項
  const getGrowthTreeOptions = () => {
    const uniqueTrees = Array.from(new Set(assessments.map(a => a.tree_id)));
    return uniqueTrees.map(treeId => {
      const tree = assessments.find(a => a.tree_id === treeId)?.tree;
      return {
        label: tree?.tree_name || '未知成長樹',
        value: treeId
      };
    });
  };

  // 獲取課程選項（從 Hanami_CourseTypes 資料表）
  const getCourseOptions = () => {
    // 直接顯示所有課程選項
    return courseTypes.map(course => ({
      label: course.name || '未知課程',
      value: course.id
    }));
  };

  // 處理成長樹選擇
  const handleGrowthTreeSelect = () => {
    setTempSelectedGrowthTrees(selectedGrowthTrees);
    setShowGrowthTreeSelect(true);
  };

  const handleGrowthTreeConfirm = () => {
    setSelectedGrowthTrees(tempSelectedGrowthTrees);
    // 清除不屬於新選成長樹的課程
    const validCourses = selectedCourses.filter(courseId => {
      return tempSelectedGrowthTrees.length === 0 || 
        assessments.some(a => 
          tempSelectedGrowthTrees.includes(a.tree_id) && 
          a.student?.course_type === courseTypes.find(c => c.id === courseId)?.name
        );
    });
    setSelectedCourses(validCourses);
    setShowGrowthTreeSelect(false);
  };

  const handleGrowthTreeCancel = () => {
    setTempSelectedGrowthTrees(selectedGrowthTrees);
    setShowGrowthTreeSelect(false);
  };

  // 處理課程選擇
  const handleCourseSelect = () => {
    setTempSelectedCourses(selectedCourses);
    setShowCourseSelect(true);
  };

  const handleCourseConfirm = () => {
    setSelectedCourses(tempSelectedCourses);
    setShowCourseSelect(false);
  };

  const handleCourseCancel = () => {
    setTempSelectedCourses(selectedCourses);
    setShowCourseSelect(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto" />
            <p className="mt-4 text-[#2B3A3B]">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">能力評估管理</h1>
          <p className="text-[#87704e]">管理學生在成長樹中的能力發展評估</p>
        </div>

        {/* 學生進度管理導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <ResponsiveNavigationDropdown
            items={[
              {
                icon: BarChart3,
                label: "進度管理面板",
                href: "/admin/student-progress",
                variant: "secondary"
              },
              {
                icon: TreePine,
                label: "成長樹管理",
                href: "/admin/student-progress/growth-trees",
                variant: "secondary"
              },
              {
                icon: TrendingUp,
                label: "發展能力圖卡",
                href: "/admin/student-progress/abilities",
                variant: "secondary"
              },
              {
                icon: Gamepad2,
                label: "教學活動管理",
                href: "/admin/student-progress/activities",
                variant: "secondary"
              },
              {
                icon: VideoCameraIcon,
                label: "學生媒體管理",
                href: "/admin/student-progress/student-media",
                variant: "secondary"
              },
              {
                icon: AcademicCapIcon,
                label: "能力評估管理",
                href: "/admin/student-progress/ability-assessments",
                variant: "primary"
              },
              {
                icon: Users,
                label: "返回學生管理",
                href: "/admin/students",
                variant: "accent"
              }
            ]}
            currentPage="/admin/student-progress/ability-assessments"
          />
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-4">
              <AcademicCapIcon className="h-8 w-8 text-red-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium text-lg mb-2">功能設置中</h3>
                <p className="text-red-700 mb-3">{error}</p>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h4 className="text-red-800 font-medium mb-2">設置步驟：</h4>
                  <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
                    <li>登入 Supabase 控制台</li>
                    <li>進入 SQL Editor</li>
                    <li>執行 simple_ability_assessment_migration.sql 腳本</li>
                    <li>重新載入此頁面</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 主要操作按鈕 */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <button
                className="bg-[#A64B2A] text-white px-4 py-2 rounded-lg hover:bg-[#8B3A1F] transition-colors flex items-center gap-2"
                onClick={() => setShowAssessmentModal(true)}
                disabled={!!error}
              >
                <PlusIcon className="w-4 h-4" />
                <span>新增能力評估</span>
              </button>
            </div>
            
            <div className="text-sm text-[#2B3A3B]">
              共 {assessments.length} 筆評估記錄
              {filteredAssessments.length !== assessments.length && (
                <span className="text-[#A68A64] ml-2">
                  (篩選後: {filteredAssessments.length} 筆)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 篩選區域 */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 搜尋 */}
            <div className="flex-1 min-w-64">
              <input
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg text-[#2B3A3B] placeholder-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                placeholder="搜尋學生姓名、成長樹或備註..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 成長樹多選下拉 */}
            <div className="min-w-[180px]">
              <button
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B] bg-white hover:bg-[#FFF9F2] transition-colors text-left flex items-center justify-between"
                onClick={handleGrowthTreeSelect}
              >
                <span>
                  {selectedGrowthTrees.length === 0 
                    ? '選擇成長樹' 
                    : selectedGrowthTrees.length === 1
                    ? getGrowthTreeOptions().find(opt => opt.value === selectedGrowthTrees[0])?.label || '選擇成長樹'
                    : `已選擇 ${selectedGrowthTrees.length} 個成長樹`
                  }
                </span>
                <FunnelIcon className="h-4 w-4 text-[#A68A64]" />
              </button>
              <div className="text-xs text-[#A68A64] mt-1">成長樹（可多選）</div>
            </div>

            {/* 課程多選下拉 */}
            <div className="min-w-[180px]">
              <button
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B] bg-white hover:bg-[#FFF9F2] transition-colors text-left flex items-center justify-between"
                onClick={handleCourseSelect}
                disabled={getCourseOptions().length === 0}
              >
                <span>
                  {selectedCourses.length === 0 
                    ? getCourseOptions().length === 0 ? '無可用課程' : '選擇課程'
                    : selectedCourses.length === 1
                    ? courseTypes.find(c => c.id === selectedCourses[0])?.name || '選擇課程'
                    : `已選擇 ${selectedCourses.length} 個課程`
                  }
                </span>
                <FunnelIcon className="h-4 w-4 text-[#A68A64]" />
              </button>
              <div className="text-xs text-[#A68A64] mt-1">課程（可多選）</div>
            </div>

            {/* 日期範圍篩選 */}
            <div className="flex gap-2 items-center">
              <input
                className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B]"
                placeholder="開始日期"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-[#A68A64]">至</span>
              <input
                className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B]"
                placeholder="結束日期"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            {/* 清除篩選條件 */}
            {(searchQuery || dateRange.start || dateRange.end || selectedGrowthTrees.length > 0 || selectedCourses.length > 0) && (
              <button
                className="text-[#A64B2A] hover:text-[#8B3A1F] text-sm underline"
                onClick={() => {
                  setSearchQuery('');
                  setDateRange({ start: '', end: '' });
                  setSelectedGrowthTrees([]);
                  setSelectedCourses([]);
                }}
              >
                清除條件
              </button>
            )}
          </div>
        </div>

        {/* 評估記錄列表 */}
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-10">
            <AcademicCapIcon className="h-16 w-16 text-[#A68A64] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#2B3A3B] mb-2">
              {error ? '功能設置中' : '暫無評估記錄'}
            </h3>
            <p className="text-[#87704e]">
              {error 
                ? '請先完成資料庫設置' 
                : '點擊「新增能力評估」開始記錄學生的能力發展'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssessments.map((assessment) => (
              <HanamiCard 
                key={assessment.id} 
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setViewingAssessment(assessment)}
              >
                {/* 標題區域 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#2B3A3B] mb-1">
                      {assessment.student?.full_name || '未知學生'}
                    </h3>
                    <p className="text-sm text-[#A68A64] mb-2">
                      {assessment.tree?.tree_name || '未知成長樹'}
                    </p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#A68A64]" />
                      <span className="text-sm text-[#2B3A3B]">
                        {new Date(assessment.assessment_date).toLocaleDateString('zh-HK')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {getRatingStars(assessment.overall_performance_rating || 0)}
                    </div>
                    <button
                      className="text-[#A64B2A] hover:text-[#8B3A1F] transition-colors p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAssessment(assessment);
                      }}
                      title="編輯評估"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 transition-colors p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAssessment(assessment.id);
                      }}
                      title="刪除評估"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 備註和重點 */}
                <div className="space-y-3">
                  {assessment.general_notes && (
                    <div>
                      <h4 className="font-medium text-[#2B3A3B] mb-2 text-sm">一般備註</h4>
                      <p className="text-sm text-[#2B3A3B] bg-gray-50 p-3 rounded-lg">
                        {assessment.general_notes.length > 100 
                          ? `${assessment.general_notes.substring(0, 100)}...` 
                          : assessment.general_notes
                        }
                      </p>
                    </div>
                  )}

                  {assessment.next_lesson_focus && (
                    <div>
                      <h4 className="font-medium text-[#2B3A3B] mb-2 text-sm">下堂課重點</h4>
                      <p className="text-sm text-[#2B3A3B] bg-blue-50 p-3 rounded-lg border border-blue-200">
                        {assessment.next_lesson_focus.length > 100 
                          ? `${assessment.next_lesson_focus.substring(0, 100)}...` 
                          : assessment.next_lesson_focus
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* 底部資訊 */}
                <div className="mt-4 pt-4 border-t border-[#EADBC8] flex justify-between items-center">
                  <p className="text-xs text-[#A68A64]">
                    創建於: {new Date(assessment.created_at).toLocaleString('zh-HK')}
                  </p>
                  <div className="text-xs text-[#87704e]">
                    能力項目: {Object.keys(assessment.ability_assessments || {}).length} 項
                  </div>
                </div>
              </HanamiCard>
            ))}
          </div>
        )}

        {/* PopupSelect 彈窗 */}
        {showGrowthTreeSelect && (
          <PopupSelect
            mode="multi"
            options={getGrowthTreeOptions()}
            selected={tempSelectedGrowthTrees}
            title="選擇成長樹"
            onCancel={handleGrowthTreeCancel}
            onChange={(value) => setTempSelectedGrowthTrees(Array.isArray(value) ? value : [value])}
            onConfirm={handleGrowthTreeConfirm}
          />
        )}

        {showCourseSelect && (
          <PopupSelect
            mode="multi"
            options={getCourseOptions()}
            selected={tempSelectedCourses}
            title="選擇課程"
            onCancel={handleCourseCancel}
            onChange={(value) => setTempSelectedCourses(Array.isArray(value) ? value : [value])}
            onConfirm={handleCourseConfirm}
          />
        )}

        {/* 能力評估模態框 */}
        {showAssessmentModal && (
          <SimpleAbilityAssessmentModal
            onClose={() => setShowAssessmentModal(false)}
            onSubmit={handleCreateAssessment}
          />
        )}

        {/* 編輯能力評估模態框 */}
        {editingAssessment && (
          <SimpleAbilityAssessmentModal
            onClose={() => setEditingAssessment(null)}
            onSubmit={handleEditAssessment}
            initialData={editingAssessment}
          />
        )}

        {/* 詳細資訊查看模態框 */}
        {viewingAssessment && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* 標題欄 */}
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    <div>
                      <h2 className="text-2xl font-bold text-hanami-text">能力評估詳細資訊</h2>
                      <p className="text-hanami-text-secondary">查看完整的評估記錄</p>
                    </div>
                  </div>
                  <button
                    className="text-hanami-text hover:text-hanami-text-secondary transition-colors p-2"
                    onClick={() => setViewingAssessment(null)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* 內容區域 */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* 基本資訊 */}
                  <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 rounded-xl border border-[#EADBC8]">
                    <h3 className="text-xl font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      基本資訊
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#A68A64]">學生姓名</label>
                        <p className="text-sm text-[#87704e]">
                          {viewingAssessment.student?.full_name || '未知學生'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#A68A64]">成長樹</label>
                        <p className="text-sm text-[#87704e]">
                          {viewingAssessment.tree?.tree_name || '未知成長樹'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#A68A64]">評估日期</label>
                        <p className="text-sm text-[#87704e]">
                          {new Date(viewingAssessment.assessment_date).toLocaleDateString('zh-HK')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#A68A64]">創建時間</label>
                        <p className="text-sm text-[#87704e]">
                          {new Date(viewingAssessment.created_at).toLocaleString('zh-HK')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 能力評估詳情 */}
                  {viewingAssessment.tree && (
                    <div className="bg-white p-6 rounded-xl border border-[#EADBC8]">
                      <h3 className="text-xl font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5" />
                        能力評估詳情
                      </h3>
                      <div className="space-y-6">
                        {(() => {
                          const abilities = treeAbilities[viewingAssessment.tree.id] || [];
                          const goals = treeGoals[viewingAssessment.tree.id] || [];
                          
                          // 檢查是否已經載入完成
                          const hasLoadedData = goals.length > 0;
                          
                          if (!hasLoadedData) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <p>正在載入能力資料...</p>
                              </div>
                            );
                          }
                          
                          // 如果沒有能力資料但有目標資料，顯示提示
                          if (abilities.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <p>此成長樹沒有配置能力評估項目</p>
                                <p className="text-sm mt-2">請查看下方的學習目標進度</p>
                              </div>
                            );
                          }
                          
                          // 顯示能力評估
                          return abilities.map((ability) => {
                            const assessment_data = viewingAssessment.ability_assessments?.[ability.id];
                            const isAssessed = !!assessment_data;
                            
                            return (
                              <div key={ability.id} className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 rounded-xl border border-[#EADBC8]">
                                {/* 能力標題 */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-[#2B3A3B] mb-2">
                                      {ability.ability_name} 完成等級
                                    </h4>
                                    {isAssessed && (
                                      <span className="text-xs bg-[#A64B2A] text-white px-2 py-1 rounded-full">
                                        已評估
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-[#A68A64]">
                                    {ability.ability_description || '無描述'}
                                  </p>
                                </div>

                                {/* 等級進度條 */}
                                {isAssessed && (
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                      完成等級: {assessment_data.level} / {ability.max_level}
                                    </label>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-[#A64B2A] h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((assessment_data.level / ability.max_level) * 100, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* 備註 */}
                                {isAssessed && assessment_data.notes && (
                                  <div>
                                    <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                      備註
                                    </label>
                                    <div className="bg-white p-3 rounded-lg border border-[#EADBC8] text-[#2B3A3B] text-sm">
                                      {assessment_data.notes}
                                    </div>
                                  </div>
                                )}

                                {/* 未評估提示 */}
                                {!isAssessed && (
                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500 text-center">
                                      此能力尚未在此次評估中進行評分
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 學習目標進度 */}
                  {viewingAssessment.tree && (
                    <div className="bg-white p-6 rounded-xl border border-[#EADBC8]">
                      <h3 className="text-xl font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
                        <EyeIcon className="w-5 h-5" />
                        學習目標進度
                      </h3>
                      <div className="space-y-6">
                        {(() => {
                          const goals = treeGoals[viewingAssessment.tree.id] || [];
                          const selectedGoals = (viewingAssessment as any).selected_goals || [];
                          const abilityAssessments = viewingAssessment.ability_assessments || {};
                          
                          return goals.length > 0 ? (
                            goals.map((goal) => {
                              // 優先從 selected_goals 欄位查找此目標的評估資料
                              let goalAssessment = selectedGoals.find((g: any) => g.goal_id === goal.id);
                              let assessmentMode = goal.assessment_mode || 'progress';
                              
                              if (goalAssessment) {
                                // 使用 selected_goals 中的資料
                                assessmentMode = goalAssessment.assessment_mode || assessmentMode;
                              } else {
                                // 如果 selected_goals 中沒有，則從 ability_assessments 中查找
                                goalAssessment = abilityAssessments[goal.id];
                                if (goalAssessment) {
                                  assessmentMode = goalAssessment.assessment_mode || assessmentMode;
                                }
                              }
                              
                              // 計算完成度
                              let completionPercentage = 0;
                              let selectedCount = 0;
                              let totalCount = 0;
                              let progressLevelOriginal: number | undefined; // 儲存原始的 progress_level
                              
                              if (assessmentMode === 'multi_select') {
                                let selectedLevels: string[] = [];
                                if (selectedGoals.find((g: any) => g.goal_id === goal.id)) {
                                  // 從 selected_goals 中獲取
                                  const sg = selectedGoals.find((g: any) => g.goal_id === goal.id);
                                  selectedLevels = sg?.selected_levels || [];
                                } else if (abilityAssessments[goal.id]) {
                                  // 從 ability_assessments 中獲取
                                  selectedLevels = (abilityAssessments[goal.id] as any)?.selected_levels || [];
                                }
                                // === 向後相容處理 ===
                                // 過濾掉已被成長樹刪除的等級
                                if (goal.multi_select_levels && goal.multi_select_levels.length > 0) {
                                  selectedLevels = selectedLevels.filter((lvl) => goal.multi_select_levels!.includes(lvl));
                                }
                                
                                const maxLevels = goal.multi_select_levels?.length || 5;
                                selectedCount = selectedLevels.length;
                                totalCount = maxLevels;
                                completionPercentage = maxLevels > 0 ? Math.round((selectedCount / maxLevels) * 100) : 0;
                              } else {
                                let progressLevel = 0;
                                if (selectedGoals.find((g: any) => g.goal_id === goal.id)) {
                                  // 從 selected_goals 中獲取
                                  const sg = selectedGoals.find((g: any) => g.goal_id === goal.id);
                                  progressLevel = sg?.progress_level || 0;
                                  progressLevelOriginal = sg?.progress_level; // 儲存原始的 progress_level
                                } else if (abilityAssessments[goal.id]) {
                                  // 從 ability_assessments 中獲取
                                  progressLevel = abilityAssessments[goal.id]?.level || 0;
                                  progressLevelOriginal = abilityAssessments[goal.id]?.level; // 儲存原始的 level
                                }
                                // === 向後相容處理 ===
                                const maxLevel = goal.progress_max || 5;
                                // 若舊評估中的等級超出新版本的最大值，則限制在新最大值
                                progressLevel = Math.min(progressLevel, maxLevel);
                                selectedCount = progressLevel;
                                totalCount = maxLevel;
                                completionPercentage = maxLevel > 0 ? Math.round((progressLevel / maxLevel) * 100) : 0;
                              }
                              
                              return (
                                <div key={goal.id} className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 rounded-xl border border-[#EADBC8]">
                                  {/* 目標標題 */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-lg font-semibold text-[#2B3A3B] mb-2">
                                        {goal.goal_name}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        {goalAssessment && (
                                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                            已評估
                                          </span>
                                        )}
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          assessmentMode === 'multi_select' 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-green-600 text-white'
                                        }`}>
                                          {assessmentMode === 'multi_select' ? '多選模式' : '進度模式'}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-[#A68A64]">
                                      {goal.goal_description || '無描述'}
                                    </p>
                                  </div>

                                  {/* 評估結果顯示 */}
                                  {goalAssessment ? (
                                    <div className="space-y-4">
                                      {assessmentMode === 'multi_select' ? (
                                        // 多選模式顯示
                                        <div>
                                          <div className="mb-4">
                                            <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                              {goal.goal_name} 完成等級
                                            </label>
                                            {/* 等級選擇圓圈 */}
                                            <div className="flex items-center justify-center space-x-2 mb-3">
                                              {goal.multi_select_levels?.map((level: string, index: number) => {
                                                const isSelected = goalAssessment.selected_levels?.includes(level);
                                                return (
                                                  <div key={index} className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xs font-bold ${
                                                      isSelected
                                                        ? 'bg-gradient-to-br from-[#E8B4A0] to-[#D4A5A5] border-[#C89B9B] text-white'
                                                        : 'bg-white border-[#E8D5C4] text-[#8B7355]'
                                                    }`}>
                                                      {index + 1}
                                                    </div>
                                                    {isSelected && <div className="w-4 h-0.5 bg-[#E8B4A0] mt-1"></div>}
                                                  </div>
                                                );
                                              })}
                                              {/* 若舊評估包含已被移除的等級，顯示提醒 */}
                                              {goalAssessment.selected_levels && goal.multi_select_levels &&
                                                goalAssessment.selected_levels.some((lvl: string) => !goal.multi_select_levels!.includes(lvl)) && (
                                                  <div className="text-xs text-orange-600 mt-2">⚠️ 此評估包含已被移除的等級，已自動忽略</div>
                                                )}
                                            </div>
                                            <div className="text-center text-sm text-[#A68A64]">
                                              已選 {selectedCount} / {totalCount} 項 ({completionPercentage}%)
                                            </div>
                                          </div>
                                          
                                          {/* 完成度進度條 */}
                                          <div className="mb-4">
                                            <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                              完成度
                                            </label>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                              <div 
                                                className="bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5] h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${completionPercentage}%` }}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* 等級內容說明 */}
                                          {goal.multi_select_descriptions && goal.multi_select_descriptions.length > 0 && (
                                            <div className="mb-4">
                                              <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                                等級內容說明:
                                              </label>
                                              <div className="space-y-2">
                                                {goal.multi_select_descriptions.map((desc: string, index: number) => {
                                                  const level = goal.multi_select_levels?.[index];
                                                  const isSelected = goalAssessment.selected_levels?.includes(level);
                                                  return (
                                                    <div key={index} className={`p-3 rounded-lg border text-sm ${
                                                      isSelected 
                                                        ? 'bg-[#FFF9F2] border-[#E8B4A0] text-[#2B3A3B]' 
                                                        : 'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}>
                                                      <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                                          isSelected 
                                                            ? 'bg-[#E8B4A0] text-white' 
                                                            : 'bg-gray-300 text-gray-600'
                                                        }`}>
                                                          {index + 1}
                                                        </div>
                                                        <span>{desc}</span>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        // 進度模式顯示
                                        <div>
                                          <div className="mb-4">
                                            <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                              {goal.goal_name} 完成等級
                                            </label>
                                            {/* 等級選擇圓圈 */}
                                            <div className="flex items-center justify-center space-x-2 mb-3">
                                              {Array.from({ length: totalCount }, (_, index) => {
                                                const level = index + 1;
                                                const isSelected = level <= selectedCount;
                                                return (
                                                  <div key={index} className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xs font-bold ${
                                                      isSelected
                                                        ? 'bg-gradient-to-br from-[#E8B4A0] to-[#D4A5A5] border-[#C89B9B] text-white'
                                                        : 'bg-white border-[#E8D5C4] text-[#8B7355]'
                                                    }`}>
                                                      {level}
                                                    </div>
                                                    {isSelected && <div className="w-4 h-0.5 bg-[#E8B4A0] mt-1"></div>}
                                                  </div>
                                                );
                                              })}
                                              {progressLevelOriginal !== undefined && progressLevelOriginal > maxLevel && (
                                                <div className="text-xs text-orange-600 mt-2">⚠️ 此評估等級超過目前最大值，已顯示為 {maxLevel}</div>
                                              )}
                                            </div>
                                            <div className="text-center text-sm text-[#A68A64]">
                                              等級 {selectedCount} / {totalCount} ({completionPercentage}%)
                                            </div>
                                          </div>
                                          
                                          {/* 完成度進度條 */}
                                          <div className="mb-4">
                                            <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                              完成度
                                            </label>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                              <div 
                                                className="bg-gradient-to-r from-[#E8B4A0] to-[#D4A5A5] h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${completionPercentage}%` }}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* 進度內容 */}
                                          {goal.progress_contents && goal.progress_contents.length > 0 && (
                                            <div className="mb-4">
                                              <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                                進度內容
                                              </label>
                                              <div className="space-y-2">
                                                {goal.progress_contents.map((content: string, index: number) => {
                                                  const isCompleted = index < selectedCount;
                                                  return (
                                                    <div key={index} className={`p-3 rounded-lg border text-sm ${
                                                      isCompleted 
                                                        ? 'bg-[#FFF9F2] border-[#E8B4A0] text-[#2B3A3B]' 
                                                        : 'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}>
                                                      <div className="flex items-center gap-2">
                                                        <span className={isCompleted ? 'text-[#E8B4A0]' : 'text-gray-500'}>
                                                          {isCompleted ? '✓' : '○'}
                                                        </span>
                                                        <span>{content}</span>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    // 未評估提示
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                      <p className="text-sm text-gray-500 text-center">
                                        此學習目標在此次評估中未進行評分
                                      </p>
                                    </div>
                                  )}

                                  {/* 所需能力 */}
                                  {goal.required_abilities && goal.required_abilities.length > 0 && (
                                    <div>
                                      <label className="block text-sm font-medium text-[#A68A64] mb-2">
                                        所需能力
                                      </label>
                                      <div className="flex flex-wrap gap-2">
                                        {goal.required_abilities.map((abilityId: string) => {
                                          const ability = treeAbilities[viewingAssessment.tree?.id || '']?.find(a => a.id === abilityId);
                                          const assessment_data = viewingAssessment.ability_assessments?.[abilityId];
                                          const isAssessed = !!assessment_data;
                                          
                                          return (
                                            <span 
                                              key={abilityId} 
                                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                                                isAssessed 
                                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              {ability?.ability_name || '未知能力'}
                                              {isAssessed && <span className="text-green-600">✓</span>}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}


                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>正在載入學習目標資料...</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 備註和重點 */}
                  <div className="space-y-4">
                    {viewingAssessment.general_notes && (
                      <div className="bg-white p-6 rounded-xl border border-[#EADBC8]">
                        <h3 className="text-xl font-semibold text-[#2B3A3B] mb-4">一般備註</h3>
                        <p className="text-[#2B3A3B] leading-relaxed">
                          {viewingAssessment.general_notes}
                        </p>
                      </div>
                    )}

                    {viewingAssessment.next_lesson_focus && (
                      <div className="bg-white p-6 rounded-xl border border-[#EADBC8]">
                        <h3 className="text-xl font-semibold text-[#2B3A3B] mb-4">下堂課重點</h3>
                        <p className="text-[#2B3A3B] leading-relaxed">
                          {viewingAssessment.next_lesson_focus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 按鈕區域 */}
              <div className="px-6 py-4 border-t border-[#E8D5C4] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB] rounded-b-2xl">
                <div className="flex gap-3 justify-end">
                  <button
                    className="px-6 py-2 text-[#A64B2A] border border-[#A64B2A] rounded-lg hover:bg-[#A64B2A] hover:text-white transition-all duration-300 ease-out"
                    onClick={() => {
                      setViewingAssessment(null);
                      setEditingAssessment(viewingAssessment);
                    }}
                  >
                    編輯評估
                  </button>
                  <button
                    className="px-6 py-2 text-[#8B7355] border border-[#E8D5C4] rounded-lg hover:bg-[#F5F0EB] hover:border-[#D4A5A5] hover:text-[#2B3A3B] transition-all duration-300 ease-out"
                    onClick={() => setViewingAssessment(null)}
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { 
  AcademicCapIcon, 
  LightBulbIcon, 
  ClockIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  StarIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

import { HanamiCard, HanamiButton, HanamiInput, PopupSelect, SimpleAbilityAssessmentModal, StudentTreeAssignmentModal } from '@/components/ui';
import Calendarui from '@/components/ui/Calendarui';
import { supabase } from '@/lib/supabase';
import { getHKDateString } from '@/lib/utils';
import { DevelopmentAbility, GrowthTree, TeachingActivity, StudentProgress } from '@/types/progress';

interface AbilityAssessment {
  id: string;
  student_id: string;
  tree_id: string;
  assessment_date: string;
  general_notes?: string;
  next_lesson_focus?: string;
  created_at: string;
  student?: {
    full_name: string;
    nick_name?: string;
  };
  tree?: {
    tree_name: string;
  };
}

interface StudentWithoutAssessment {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
  last_assessment_date?: string | null;
  lesson_time?: string;
}

export default function StudentProgressDashboard() {
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [activities, setActivities] = useState<TeachingActivity[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<AbilityAssessment[]>([]);
  const [studentsWithoutAssessment, setStudentsWithoutAssessment] = useState<StudentWithoutAssessment[]>([]);
  const [studentsAssessed, setStudentsAssessed] = useState<StudentWithoutAssessment[]>([]);
  const [studentsNoTree, setStudentsNoTree] = useState<StudentWithoutAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 搜尋和篩選狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(getHKDateString());
  const [assessmentLimit, setAssessmentLimit] = useState(5);
  const [selectedAssessmentDate, setSelectedAssessmentDate] = useState(getHKDateString());
  
  // 篩選相關狀態
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filteredAssessments, setFilteredAssessments] = useState<AbilityAssessment[]>([]);

  // 能力評估模態視窗狀態
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<StudentWithoutAssessment | null>(null);

  // 成長樹分配模態視窗狀態
  const [showTreeAssignmentModal, setShowTreeAssignmentModal] = useState(false);
  const [selectedStudentForTreeAssignment, setSelectedStudentForTreeAssignment] = useState<StudentWithoutAssessment | null>(null);

  // 日期選擇器狀態
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 學生資料載入狀態
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [assessmentLimit]);

  // 當選擇的評估日期改變時，重新載入需要評估的學生
  useEffect(() => {
    loadStudentsWithoutAssessment();
  }, [selectedAssessmentDate]);

  // 處理能力評估提交
  const handleAssessmentSubmit = async (assessment: any) => {
    try {
      console.log('提交能力評估:', assessment);
      
      // 這裡可以添加提交到資料庫的邏輯
      // 目前先顯示成功訊息
      alert('能力評估已成功提交！');
      
      // 關閉模態視窗
      setShowAssessmentModal(false);
      setSelectedStudentForAssessment(null);
      
      // 重新載入需要評估的學生列表
      loadStudentsWithoutAssessment();
      
    } catch (error) {
      console.error('提交能力評估失敗:', error);
      alert('提交失敗: ' + (error as Error).message);
    }
  };

  // 載入需要評估的學生
  const loadStudentsWithoutAssessment = async () => {
    try {
      setLoadingStudents(true);

      // 先獲取選擇日期有上課的學生，按上課時間排序
      const { data: todayLessonsData, error: todayLessonsError } = await supabase
        .from('hanami_student_lesson')
        .select('student_id, actual_timeslot')
        .eq('lesson_date', selectedAssessmentDate)
        .order('actual_timeslot', { ascending: true });

      if (todayLessonsError) throw todayLessonsError;
      
      // 獲取選擇日期有上課的學生ID列表（保持時間順序）
      const todayStudentIds = [...new Set((todayLessonsData || []).map(lesson => lesson.student_id).filter((id): id is string => id !== null))];
      
      if (todayStudentIds.length > 0) {
        // 檢查這些學生選擇日期是否有能力評估記錄
        const { data: todayAssessmentsData, error: todayAssessmentsError } = await supabase
          .from('hanami_ability_assessments')
          .select('student_id')
          .eq('assessment_date', selectedAssessmentDate)
          .in('student_id', todayStudentIds);

        if (todayAssessmentsError) throw todayAssessmentsError;
        
        // 獲取選擇日期有評估記錄的學生ID列表
        const todayAssessedStudentIds = (todayAssessmentsData || []).map(assessment => assessment.student_id);
        
        // 獲取這些學生的詳細資訊
        const { data: studentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, nick_name, course_type')
          .in('id', todayStudentIds);

        if (studentsError) throw studentsError;
        
        // 獲取學生的成長樹分配資訊
        const { data: studentTreesData, error: studentTreesError } = await supabase
          .from('hanami_student_trees')
          .select('student_id, tree_id, status')
          .in('student_id', todayStudentIds)
          .eq('status', 'active');

        if (studentTreesError) throw studentTreesError;
        
        // 建立學生ID到成長樹的映射
        const studentTreeMap = new Map();
        (studentTreesData || []).forEach(item => {
          studentTreeMap.set(item.student_id, item.tree_id);
        });
        
        // 分類學生
        const categorizedStudents = {
          assessed: [] as StudentWithoutAssessment[],
          unassessed: [] as StudentWithoutAssessment[],
          noTree: [] as StudentWithoutAssessment[]
        };
        
        // 處理每個學生
        for (const student of studentsData || []) {
          // 獲取最後評估日期和上課時間
          const [lastAssessmentData, lessonData] = await Promise.all([
            supabase
              .from('hanami_ability_assessments')
              .select('assessment_date')
              .eq('student_id', student.id)
              .order('assessment_date', { ascending: false })
              .limit(1),
            supabase
              .from('hanami_student_lesson')
              .select('actual_timeslot')
              .eq('student_id', student.id)
              .eq('lesson_date', selectedAssessmentDate)
              .limit(1)
          ]);
          
          const studentWithData = {
            ...student,
            last_assessment_date: lastAssessmentData.data?.[0]?.assessment_date || null,
            lesson_time: lessonData.data?.[0]?.actual_timeslot || ''
          };
          
          // 檢查是否有成長樹
          const hasTree = studentTreeMap.has(student.id);
          
          // 檢查今天是否已評估
          const isAssessedToday = todayAssessedStudentIds.includes(student.id);
          
          if (isAssessedToday) {
            // 已評估
            categorizedStudents.assessed.push(studentWithData);
          } else if (hasTree) {
            // 未評估但有成長樹
            categorizedStudents.unassessed.push(studentWithData);
          } else {
            // 未分配成長樹
            categorizedStudents.noTree.push(studentWithData);
          }
        }
        
        // 按上課時間排序每個類別
        const sortByTime = (a: StudentWithoutAssessment, b: StudentWithoutAssessment) => {
          const timeA = a.lesson_time || '';
          const timeB = b.lesson_time || '';
          return timeA.localeCompare(timeB);
        };
        
        categorizedStudents.assessed.sort(sortByTime);
        categorizedStudents.unassessed.sort(sortByTime);
        categorizedStudents.noTree.sort(sortByTime);
        
        setStudentsWithoutAssessment(categorizedStudents.unassessed);
        setStudentsAssessed(categorizedStudents.assessed);
        setStudentsNoTree(categorizedStudents.noTree);
        
      } else {
        setStudentsWithoutAssessment([]);
        setStudentsAssessed([]);
        setStudentsNoTree([]);
      }
    } catch (error) {
      console.error('載入需要評估的學生時發生錯誤:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 篩選能力評估記錄
  useEffect(() => {
    let filtered = [...recentAssessments];
    
    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(assessment =>
        assessment.student?.full_name?.toLowerCase().includes(query) ||
        assessment.tree?.tree_name?.toLowerCase().includes(query) ||
        assessment.general_notes?.toLowerCase().includes(query)
      );
    }
    
    // 日期篩選
    if (selectedDate) {
      filtered = filtered.filter(assessment =>
        assessment.assessment_date === selectedDate
      );
    }
    
    setFilteredAssessments(filtered);
  }, [recentAssessments, searchQuery, selectedDate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 載入發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('*')
        .order('ability_name');

      if (abilitiesError) throw abilitiesError;
      // 修正 null 欄位為 undefined
      const fixedAbilities = (abilitiesData || []).map((a: any) => ({
        ...a,
        ability_description: a.ability_description ?? undefined,
        ability_icon: a.ability_icon ?? undefined,
        ability_color: a.ability_color ?? undefined,
      }));
      setAbilities(fixedAbilities);

      // 載入成長樹
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('is_active', true)
        .order('tree_name');

      if (treesError) throw treesError;
      // 欄位轉換與 null 處理
      const fixedTrees = (treesData || []).map((t: any) => ({
        ...t,
        course_type: t.course_type_id ?? t.course_type ?? '',
        tree_description: t.tree_description ?? undefined,
      }));
      setTrees(fixedTrees);

      // 載入教學活動
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .order('activity_name');

      if (activitiesError) throw activitiesError;
      // 欄位轉換與 null 處理
      const fixedActivities = (activitiesData || []).map((a: any) => ({
        ...a,
        estimated_duration: a.estimated_duration ?? a.duration_minutes ?? 0,
        activity_description: a.activity_description ?? undefined,
        materials_needed: a.materials_needed ?? [],
        instructions: a.instructions ?? undefined,
      }));
      setActivities(fixedActivities);

      // 載入能力評估記錄
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(full_name, nick_name),
          tree:hanami_growth_trees(tree_name)
        `)
        .order('created_at', { ascending: false })
        .limit(assessmentLimit);

      if (assessmentsError) throw assessmentsError;
      const fixedAssessments = (assessmentsData || []).map((a: any) => ({
        ...a,
        assessment_date: a.assessment_date ?? a.created_at?.split('T')[0] ?? '',
        general_notes: a.general_notes ?? undefined,
        next_lesson_focus: a.next_lesson_focus ?? undefined,
      }));
      setRecentAssessments(fixedAssessments);

    } catch (error) {
      console.error('載入儀表板資料時發生錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理能力評估記錄點擊
  const handleAssessmentClick = (assessment: AbilityAssessment) => {
    // 導航到能力評估管理頁面並顯示該學生的評估詳情
    window.location.href = `/admin/student-progress/ability-assessments?student_id=${assessment.student_id}&assessment_id=${assessment.id}`;
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            學生進度管理儀表板
          </h1>
          <p className="text-hanami-text-secondary">
            管理學生發展能力、成長樹和教學活動
          </p>
        </div>

        {/* 學生進度管理導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
              onClick={() => window.location.href = '/admin/student-progress/dashboard'}
            >
              <BarChart3 className="w-4 h-4" />
              進度儀表板
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/growth-trees'}
            >
              <TreePine className="w-4 h-4" />
              成長樹管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/abilities'}
            >
              <TrendingUp className="w-4 h-4" />
              發展能力圖卡
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/activities'}
            >
              <Gamepad2 className="w-4 h-4" />
              教學活動管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress'}
            >
              <FileText className="w-4 h-4" />
              進度記錄管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/ability-assessments'}
            >
              <AcademicCapIcon className="w-4 h-4" />
              能力評估管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/student-media'}
            >
              <Users className="w-4 h-4" />
              學生媒體管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/students'}
            >
              <Users className="w-4 h-4" />
              返回學生管理
            </button>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-primary to-hanami-secondary rounded-full">
                <StarIcon className="h-6 w-6 text-hanami-text" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">發展能力</p>
                <p className="text-2xl font-bold text-hanami-text">{abilities.length}</p>
              </div>
            </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-accent to-hanami-primary rounded-full">
                <TreePine className="h-6 w-6 text-hanami-text" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">成長樹</p>
                <p className="text-2xl font-bold text-hanami-text">{trees.length}</p>
              </div>
            </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-secondary to-hanami-accent rounded-full">
                <Users className="h-6 w-6 text-hanami-text" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">教學活動</p>
                <p className="text-2xl font-bold text-hanami-text">{activities.length}</p>
              </div>
            </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-success to-hanami-primary rounded-full">
                <ClockIcon className="h-6 w-6 text-hanami-text" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">最近進度</p>
                <p className="text-2xl font-bold text-hanami-text">{recentAssessments.length}</p>
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 最近進度記錄 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 學生評估狀態 - 左邊 */}
          <HanamiCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-hanami-text">
                {selectedAssessmentDate === getHKDateString() ? '今天' : selectedAssessmentDate} 學生評估狀態
              </h3>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDatePicker(true)}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedAssessmentDate}
                </button>
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            
            {/* 載入動畫 */}
            {loadingStudents && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-[#EADBC8] border-t-[#A64B2A] rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm text-hanami-text-secondary">載入學生資料中...</p>
                </div>
              </div>
            )}

            {/* 學生評估內容 */}
            {!loadingStudents && (
              <>
                {/* 未評估學生 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                    <h4 className="font-semibold text-hanami-text">未評估 ({studentsWithoutAssessment.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentsWithoutAssessment.length > 0 ? (
                      studentsWithoutAssessment.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                              <span className="text-gray-500">
                                最後評估: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未評估'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                setSelectedStudentForAssessment(student);
                                setShowAssessmentModal(true);
                              }}
                            >
                              <AcademicCapIcon className="w-3 h-3" />
                              新增評估
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-hanami-text-secondary text-sm">
                        <StarIcon className="h-8 w-8 mx-auto mb-1 text-green-300" />
                        <p>所有學生都已評估</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 已評估學生 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <h4 className="font-semibold text-hanami-text">已評估 ({studentsAssessed.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentsAssessed.length > 0 ? (
                      studentsAssessed.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                              <span className="text-gray-500">
                                已評估 ✓
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-green-600 text-xs font-medium">已完成</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-hanami-text-secondary text-sm">
                        <AcademicCapIcon className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <p>沒有已評估的學生</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 未分配成長樹學生 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <h4 className="font-semibold text-hanami-text">未分配成長樹 ({studentsNoTree.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentsNoTree.length > 0 ? (
                      studentsNoTree.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-rose-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                              <span className="text-gray-500">
                                最後評估: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未評估'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-red-400 to-rose-400 text-white hover:from-red-500 hover:to-rose-500 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                // 設置選中的學生並開啟成長樹分配模態視窗
                                setSelectedStudentForTreeAssignment(student);
                                setShowTreeAssignmentModal(true);
                              }}
                            >
                              <TreePine className="w-3 h-3" />
                              分配成長樹
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-hanami-text-secondary text-sm">
                        <TreePine className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <p>所有學生都已分配成長樹</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </HanamiCard>

          {/* 最近能力評估記錄 - 右邊 */}
          <HanamiCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-hanami-text">
                最近能力評估記錄
              </h3>
              <div className="flex items-center gap-2">
                <select
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  value={assessmentLimit}
                  onChange={(e) => setAssessmentLimit(Number(e.target.value))}
                >
                  <option value={5}>5 筆</option>
                  <option value={10}>10 筆</option>
                  <option value={20}>20 筆</option>
                  <option value={50}>50 筆</option>
                </select>
              </div>
            </div>
            
            {/* 搜尋區域 */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <HanamiInput
                  className="pl-10"
                  placeholder="搜尋學生姓名或成長樹..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(searchQuery ? filteredAssessments : recentAssessments).map((assessment) => (
                <div 
                  key={assessment.id} 
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleAssessmentClick(assessment)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">
                          {assessment.student?.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-hanami-text text-sm">
                          {assessment.student?.full_name || '未知學生'}
                        </p>
                        <p className="text-xs text-hanami-text-secondary">
                          {assessment.tree?.tree_name || '未知成長樹'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {new Date(assessment.assessment_date).toLocaleDateString('zh-TW')}
                      </span>
                      <span className="text-gray-500">
                        評估完成 ✓
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-blue-400 to-indigo-400 text-white hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-sm">
                      <AcademicCapIcon className="w-3 h-3" />
                      查看詳情
                    </div>
                  </div>
                </div>
              ))}
              {((searchQuery ? filteredAssessments : recentAssessments).length === 0) && (
                <div className="text-center py-8 text-hanami-text-secondary">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>沒有找到符合條件的評估記錄</p>
                </div>
              )}
            </div>
          </HanamiCard>
        </div>
      </div>

      {/* 能力評估模態視窗 */}
      {showAssessmentModal && (
        <SimpleAbilityAssessmentModal
          onClose={() => {
            setShowAssessmentModal(false);
            setSelectedStudentForAssessment(null);
          }}
          onSubmit={handleAssessmentSubmit}
          defaultStudent={selectedStudentForAssessment ? {
            id: selectedStudentForAssessment.id,
            full_name: selectedStudentForAssessment.full_name,
            nick_name: selectedStudentForAssessment.nick_name ?? undefined
          } : undefined}
          defaultAssessmentDate={selectedAssessmentDate}
        />
      )}

      {/* 成長樹分配模態視窗 */}
      {showTreeAssignmentModal && (
        <StudentTreeAssignmentModal
          isOpen={showTreeAssignmentModal}
          onClose={() => {
            setShowTreeAssignmentModal(false);
            setSelectedStudentForTreeAssignment(null);
          }}
          student={selectedStudentForTreeAssignment ? {
            id: selectedStudentForTreeAssignment.id,
            full_name: selectedStudentForTreeAssignment.full_name,
            nick_name: selectedStudentForTreeAssignment.nick_name ?? undefined,
            course_type: selectedStudentForTreeAssignment.course_type ?? undefined
          } : undefined}
          onSuccess={() => {
            // 重新載入需要評估的學生列表
            loadStudentsWithoutAssessment();
          }}
        />
      )}

      {/* 日期選擇器 */}
      {showDatePicker && (
        <Calendarui
          value={selectedAssessmentDate}
          onSelect={(date) => {
            setSelectedAssessmentDate(date);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
} 
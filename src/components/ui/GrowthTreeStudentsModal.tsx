import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon, StarIcon, AcademicCapIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard } from './index';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string;
  student_age?: number;
  course_type?: string;
  student_preference?: string;
  student_remarks?: string;
}

interface StudentAbility {
  id: string;
  student_id: string;
  ability_id: string;
  current_level: number;
  progress_percentage: number;
  last_updated: string;
  notes?: string;
  ability_name: string;
  max_level: number;
}

interface GrowthTreeStudentsModalProps {
  treeId: string;
  treeName: string;
  treeCourseType: string;
  requiredAbilities: string[];
  relatedActivities: string[];
  abilitiesOptions: { value: string; label: string }[];
  activitiesOptions: { value: string; label: string }[];
  onClose: () => void;
}

export default function GrowthTreeStudentsModal({
  treeId,
  treeName,
  treeCourseType,
  requiredAbilities,
  relatedActivities,
  abilitiesOptions,
  activitiesOptions,
  onClose
}: GrowthTreeStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentAbilities, setStudentAbilities] = useState<StudentAbility[]>([]);
  const [activityStats, setActivityStats] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSelectorSearch, setStudentSelectorSearch] = useState('');
  const [studentStats, setStudentStats] = useState<{[key: string]: {learningDuration: string, lessonCount: number}}>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [treeId, treeCourseType]);

  const loadData = async () => {
    console.log('開始載入學生管理資料...');
    setLoading(true);
    
    // 添加超時機制
    const timeout = setTimeout(() => {
      console.log('載入超時，強制設置載入狀態為 false');
      setLoading(false);
    }, 10000); // 10秒超時

    try {
      console.log('載入參數:', { treeId, treeCourseType, requiredAbilities, relatedActivities });
      
      // 1. 載入在此成長樹的學生（使用現有的關聯表）
      console.log('步驟1: 載入在此成長樹的學生');
      const { data: studentsData, error: studentsError } = await supabase
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
            course_type,
            student_preference,
            student_remarks
          )
        `)
        .eq('tree_id', treeId)
        .or('status.eq.active,tree_status.eq.active');

      if (studentsError) {
        console.error('載入學生失敗:', studentsError);
        throw studentsError;
      }
      
      // 轉換資料格式
      const formattedStudents = (studentsData || []).map(item => ({
        id: item.Hanami_Students.id,
        full_name: item.Hanami_Students.full_name,
        nick_name: item.Hanami_Students.nick_name ?? undefined,
        student_age: item.Hanami_Students.student_age ?? undefined,
        course_type: item.Hanami_Students.course_type ?? undefined,
        student_preference: item.Hanami_Students.student_preference ?? undefined,
        student_remarks: item.Hanami_Students.student_remarks ?? undefined,
        // 額外的關聯資訊
        start_date: item.start_date || item.enrollment_date,
        status: item.status || item.tree_status,
        completed_goals: item.completed_goals || []
      }));
      
      // 在客戶端排序
      formattedStudents.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      console.log('載入到的學生:', formattedStudents);
      setStudents(formattedStudents);

      // 2. 載入所有學生（用於選擇器）
      console.log('步驟2: 載入所有學生');
      const { data: allStudentsData, error: allStudentsError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, nick_name, student_age, course_type')
        .order('full_name');

      if (allStudentsError) {
        console.error('載入所有學生失敗:', allStudentsError);
        throw allStudentsError;
      }
      console.log('載入到的所有學生:', allStudentsData);
      if (allStudentsData) {
        const fixedAllStudents = allStudentsData.map(s => ({
          ...s,
          nick_name: s.nick_name ?? undefined,
          student_age: s.student_age ?? undefined,
          course_type: s.course_type ?? undefined,
        }));
        setAllStudents(fixedAllStudents);
      } else {
        setAllStudents([]);
      }

      // 3. 載入學生統計資訊（學習時長和上堂數）
      if (allStudentsData && allStudentsData.length > 0) {
        console.log('步驟3: 載入學生統計');
        await loadStudentStats(allStudentsData.map(s => s.id));
      }

      // 4. 簡化版本：跳過能力載入
      console.log('步驟4: 跳過能力載入');
      setStudentAbilities([]);

      // 5. 簡化版本：跳過活動統計
      console.log('步驟5: 跳過活動統計');
      if (formattedStudents && formattedStudents.length > 0) {
        const defaultActivityStats: {[key: string]: number} = {};
        formattedStudents.forEach(student => {
          defaultActivityStats[student.id] = 0;
        });
        setActivityStats(defaultActivityStats);
      }

      console.log('所有資料載入完成');

    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      clearTimeout(timeout);
      console.log('設置載入狀態為 false');
      setLoading(false);
    }
  };

  const loadActivityStats = async (studentIds: string[], activityIds: string[]) => {
    try {
      const stats: {[key: string]: number} = {};
      
      // 獲取活動名稱映射
      const activityNameMap = new Map(
        activitiesOptions.map(option => [option.value, option.label])
      );

      // 為每個學生統計活動參與次數
      for (const studentId of studentIds) {
        const { data: lessonData, error } = await supabase
          .from('hanami_student_lesson')
          .select('lesson_activities')
          .eq('student_id', studentId);

        if (error) continue;

        let totalParticipations = 0;
        (lessonData || []).forEach(lesson => {
          if (lesson.lesson_activities) {
            // 簡單的字串匹配（可以改進為更精確的解析）
            relatedActivities.forEach(activityId => {
              const activityName = activityNameMap.get(activityId);
              if (activityName && lesson.lesson_activities && lesson.lesson_activities.includes(activityName)) {
                totalParticipations++;
              }
            });
          }
        });

        stats[studentId] = totalParticipations;
      }

      setActivityStats(stats);
    } catch (error) {
      console.error('載入活動統計失敗:', error);
    }
  };

  const loadStudentStats = async (studentIds: string[]) => {
    try {
      console.log('開始載入學生統計，學生ID:', studentIds);
      const stats: {[key: string]: {learningDuration: string, lessonCount: number}} = {};
      
      // 使用 PostgreSQL 查詢來獲取每個學生的第一堂課日期和總堂數
      const { data: lessonStats, error } = await (supabase as any).rpc('get_student_lesson_stats', {
        student_ids: studentIds
      });

      if (error) {
        console.error('查詢學生課堂統計失敗:', error);
        // 如果 RPC 函數不存在，使用備用查詢
        console.log('使用備用查詢方法');
        await loadStudentStatsFallback(studentIds);
        return;
      }

      console.log('查詢到的課堂統計:', lessonStats);

      // 處理查詢結果
      (lessonStats || []).forEach((stat: any) => {
        const studentId = stat.student_id;
        const lessonCount = stat.lesson_count || 0;
        let learningDuration = '未開始';

        if (lessonCount > 0 && stat.first_lesson_date) {
          // 計算學習時長
          const firstLessonDate = new Date(stat.first_lesson_date);
          const now = new Date();
          
          // 計算時間差
          const diffTime = Math.abs(now.getTime() - firstLessonDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            learningDuration = '今天開始';
          } else if (diffDays < 30) {
            learningDuration = `${diffDays}天`;
          } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            learningDuration = `${months}個月`;
          } else {
            const years = Math.floor(diffDays / 365);
            const months = Math.floor((diffDays % 365) / 30);
            learningDuration = `${years}年${months}個月`;
          }
        }

        stats[studentId] = {
          learningDuration,
          lessonCount
        };
      });

      // 為沒有課堂記錄的學生設置預設值
      studentIds.forEach(studentId => {
        if (!stats[studentId]) {
          stats[studentId] = { learningDuration: '未開始', lessonCount: 0 };
        }
      });
      
      setStudentStats(stats);
      console.log('學生統計資料:', stats);
    } catch (error) {
      console.error('載入學生統計失敗:', error);
      // 設置預設值
      const defaultStats: {[key: string]: {learningDuration: string, lessonCount: number}} = {};
      studentIds.forEach(studentId => {
        defaultStats[studentId] = { learningDuration: '載入失敗', lessonCount: 0 };
      });
      setStudentStats(defaultStats);
    }
  };

  // 備用查詢方法（如果 RPC 函數不存在）
  const loadStudentStatsFallback = async (studentIds: string[]) => {
    try {
      console.log('使用備用查詢方法載入學生統計');
      const stats: {[key: string]: {learningDuration: string, lessonCount: number}} = {};
      
      // 獲取今天的日期
      const today = new Date().toISOString().split('T')[0];
      
      // 批量查詢所有學生的課堂記錄（只到今天為止）
      const { data: allLessonData, error } = await supabase
        .from('hanami_student_lesson')
        .select('student_id, lesson_date')
        .in('student_id', studentIds)
        .lte('lesson_date', today); // 只查詢到今天為止的課堂

      if (error) {
        console.error('備用查詢失敗:', error);
        throw error;
      }

      console.log('備用查詢結果:', allLessonData);

      // 按學生分組課堂記錄
      const lessonsByStudent = new Map<string, any[]>();
      (allLessonData || []).forEach(lesson => {
        if (lesson.student_id && !lessonsByStudent.has(lesson.student_id)) {
          lessonsByStudent.set(lesson.student_id, []);
        }
        if (lesson.student_id) {
          lessonsByStudent.get(lesson.student_id)!.push(lesson);
        }
      });

      // 為每個學生計算統計
      studentIds.forEach(studentId => {
        const studentLessons = lessonsByStudent.get(studentId) || [];
        const lessonCount = studentLessons.length;
        let learningDuration = '未開始';

        if (lessonCount > 0) {
          // 找到第一堂課的日期
          const firstLessonDate = new Date(studentLessons[0].lesson_date);
          const now = new Date();
          
          // 計算時間差
          const diffTime = Math.abs(now.getTime() - firstLessonDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            learningDuration = '今天開始';
          } else if (diffDays < 30) {
            learningDuration = `${diffDays}天`;
          } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            learningDuration = `${months}個月`;
          } else {
            const years = Math.floor(diffDays / 365);
            const months = Math.floor((diffDays % 365) / 30);
            learningDuration = `${years}年${months}個月`;
          }
        }

        stats[studentId] = {
          learningDuration,
          lessonCount
        };
      });
      
      setStudentStats(stats);
      console.log('備用方法學生統計資料:', stats);
    } catch (error) {
      console.error('備用查詢方法失敗:', error);
      // 設置預設值
      const defaultStats: {[key: string]: {learningDuration: string, lessonCount: number}} = {};
      studentIds.forEach(studentId => {
        defaultStats[studentId] = { learningDuration: '查詢失敗', lessonCount: 0 };
      });
      setStudentStats(defaultStats);
    }
  };

  // 月齡轉歲數的輔助函數
  const convertMonthsToAge = (months: number | null): string => {
    if (!months) return '未設定';
    if (months < 12) return `${months}個月`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}歲`;
    return `${years}歲${remainingMonths}個月`;
  };

  const getStudentAbility = (studentId: string, abilityId: string): StudentAbility | undefined => {
    return studentAbilities.find(sa => 
      sa.student_id === studentId && sa.ability_id === abilityId
    );
  };

  const getAbilityStatus = (ability: StudentAbility | undefined) => {
    if (!ability) return { status: 'not_assessed', color: 'text-gray-400', label: '未評估' };
    
    const percentage = ability.progress_percentage;
    if (percentage >= 80) return { status: 'excellent', color: 'text-green-600', label: '優秀' };
    if (percentage >= 60) return { status: 'good', color: 'text-blue-600', label: '良好' };
    if (percentage >= 40) return { status: 'fair', color: 'text-yellow-600', label: '一般' };
    return { status: 'needs_improvement', color: 'text-red-600', label: '需要改進' };
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.nick_name && student.nick_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addStudentsToTree = async () => {
    try {
      console.log('添加學生到成長樹:', selectedStudents);
      
      // 檢查學生是否已經在此成長樹中
      const { data: existingStudents, error: checkError } = await supabase
        .from('hanami_student_trees')
        .select('student_id')
        .eq('tree_id', treeId)
        .in('student_id', selectedStudents);
      
      if (checkError) throw checkError;
      
      const existingStudentIds = (existingStudents || []).map(s => s.student_id);
      const newStudentIds = selectedStudents.filter(id => !existingStudentIds.includes(id));
      
      if (newStudentIds.length === 0) {
        console.log('所有選中的學生都已經在此成長樹中');
        setShowStudentSelector(false);
        setSelectedStudents([]);
        return;
      }
      
      // 添加新學生到成長樹（使用新的欄位名稱）
      const { error } = await supabase
        .from('hanami_student_trees')
        .insert(newStudentIds.map(studentId => ({
          student_id: studentId,
          tree_id: treeId,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })));

      if (error) throw error;

      console.log('成功添加學生到成長樹');
      
      // 重新載入資料
      await loadData();
      setShowStudentSelector(false);
      setSelectedStudents([]);
    } catch (error) {
      console.error('添加學生失敗:', error);
    }
  };

  const removeStudentFromTree = async (studentId: string) => {
    try {
      console.log('從成長樹移除學生:', studentId);
      
      // 從關聯表中移除學生
      const { error } = await supabase
        .from('hanami_student_trees')
        .delete()
        .eq('student_id', studentId)
        .eq('tree_id', treeId);

      if (error) throw error;

      console.log('成功從成長樹移除學生');
      
      // 重新載入資料
      await loadData();
    } catch (error) {
      console.error('移除學生失敗:', error);
    }
  };

  // 切換學生卡片展開/收起狀態
  const toggleStudentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // 顯示刪除確認視窗
  const showDeleteConfirmation = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteConfirm(true);
  };

  // 確認刪除學生
  const confirmDeleteStudent = async () => {
    if (studentToDelete) {
      await removeStudentFromTree(studentToDelete);
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  // 取消刪除
  const cancelDeleteStudent = () => {
    setShowDeleteConfirm(false);
    setStudentToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌳</span>
              <div>
                <h2 className="text-2xl font-bold text-hanami-text">{treeName}</h2>
                <p className="text-hanami-text-secondary">學生管理</p>
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

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 搜尋和操作欄 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋學生..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                />
              </div>
              <span className="text-sm text-gray-600">
                共 {filteredStudents.length} 位學生
              </span>
            </div>
            <HanamiButton
              onClick={() => setShowStudentSelector(true)}
              className="bg-gradient-to-r from-hanami-primary to-hanami-secondary"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              添加學生
            </HanamiButton>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-hanami-text">載入中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredStudents.map((student) => {
                const isExpanded = expandedStudents.has(student.id);
                const studentStat = studentStats[student.id];
                
                return (
                  <HanamiCard key={student.id} className="p-6">
                    {/* 學生基本信息 */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-hanami-primary to-hanami-secondary rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-hanami-text">
                            {student.full_name}
                            {student.nick_name && (
                              <span className="text-sm text-hanami-text-secondary ml-2">
                                ({student.nick_name})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-hanami-text-secondary">
                            {convertMonthsToAge(student.student_age ?? null)} • {student.course_type || '課程未設定'}
                          </p>
                          {/* 學習時長和上堂數 */}
                          {studentStat && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-hanami-text-secondary">
                              <span>學習時長: {studentStat.learningDuration}</span>
                              <span>上堂數: {studentStat.lessonCount}堂</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStudentExpansion(student.id)}
                          className="text-hanami-text-secondary hover:text-hanami-text p-1"
                          title={isExpanded ? '收起詳情' : '展開詳情'}
                        >
                          <svg 
                            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => showDeleteConfirmation(student.id)}
                          className="text-red-500 hover:text-red-700 text-sm p-1"
                          title="從成長樹移除"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* 展開的詳細資訊 */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        {/* 能力發展狀況 */}
                        {requiredAbilities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-hanami-text mb-2 flex items-center gap-2">
                              <StarIcon className="h-4 w-4" />
                              能力發展狀況
                            </h4>
                            <div className="space-y-2">
                              {requiredAbilities.map((abilityId) => {
                                const ability = getStudentAbility(student.id, abilityId);
                                const status = getAbilityStatus(ability);
                                const abilityName = abilitiesOptions.find(a => a.value === abilityId)?.label || '未知能力';
                                
                                return (
                                  <div key={abilityId} className="flex justify-between items-center text-sm">
                                    <span className="text-hanami-text-secondary">{abilityName}</span>
                                    <div className="flex items-center gap-2">
                                      {ability && (
                                        <span className="text-xs text-gray-500">
                                          Lv.{ability.current_level}/{ability.max_level}
                                        </span>
                                      )}
                                      <span className={`text-xs font-medium ${status.color}`}>
                                        {status.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 活動參與統計 */}
                        {relatedActivities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-hanami-text mb-2 flex items-center gap-2">
                              <AcademicCapIcon className="h-4 w-4" />
                              活動參與統計
                            </h4>
                            <div className="text-sm text-hanami-text-secondary">
                              參與相關活動 {activityStats[student.id] || 0} 次
                            </div>
                          </div>
                        )}

                        {/* 學生備註和喜好 */}
                        <div className="space-y-2">
                          {student.student_preference && (
                            <div className="flex items-start gap-2 text-sm">
                              <HeartIcon className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-hanami-text-secondary">喜好：</span>
                                <span className="text-hanami-text">{student.student_preference}</span>
                              </div>
                            </div>
                          )}
                          {student.student_remarks && (
                            <div className="flex items-start gap-2 text-sm">
                              <ChatBubbleLeftIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-hanami-text-secondary">備註：</span>
                                <span className="text-hanami-text">{student.student_remarks}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </HanamiCard>
                );
              })}
            </div>
          )}

          {!loading && filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-hanami-text-secondary">暫無學生在此成長樹</p>
            </div>
          )}
        </div>

        {/* 學生選擇器 */}
        {showStudentSelector && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-hanami-text">選擇學生</h3>
                  <button
                    onClick={() => setShowStudentSelector(false)}
                    className="text-hanami-text hover:text-hanami-text-secondary"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* 搜尋欄 */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜尋學生姓名或暱稱..."
                    value={studentSelectorSearch}
                    onChange={(e) => setStudentSelectorSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {allStudents
                    .filter(student => !students.find(s => s.id === student.id))
                    .filter(student => 
                      student.full_name.toLowerCase().includes(studentSelectorSearch.toLowerCase()) ||
                      (student.nick_name && student.nick_name.toLowerCase().includes(studentSelectorSearch.toLowerCase()))
                    )
                    .map((student) => {
                      const stats = studentStats[student.id] || { learningDuration: '未開始', lessonCount: 0 };
                      return (
                        <label key={student.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-hanami-text">
                              {student.full_name}
                              {student.nick_name && (
                                <span className="text-sm text-hanami-text-secondary ml-2">
                                  ({student.nick_name})
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-hanami-text-secondary space-y-1 mt-1">
                              <div className="flex gap-4">
                                <span>年齡: {convertMonthsToAge(student.student_age ?? null)}</span>
                                <span>課程: {student.course_type || '未設定'}</span>
                              </div>
                              <div className="flex gap-4">
                                <span>學習時長: {stats.learningDuration}</span>
                                <span>上堂數: {stats.lessonCount}堂</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  已選擇 {selectedStudents.length} 位學生
                </div>
                <div className="flex gap-3">
                  <HanamiButton
                    variant="secondary"
                    onClick={() => setShowStudentSelector(false)}
                  >
                    取消
                  </HanamiButton>
                  <HanamiButton
                    onClick={addStudentsToTree}
                    disabled={selectedStudents.length === 0}
                  >
                    添加選中的學生 ({selectedStudents.length})
                  </HanamiButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 刪除確認視窗 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌳</span>
                  <h2 className="text-xl font-bold text-hanami-text">從成長樹移除學生</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-hanami-primary to-hanami-secondary rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-hanami-text">
                      {filteredStudents.find(s => s.id === studentToDelete)?.full_name}
                    </h3>
                    <p className="text-sm text-hanami-text-secondary">學生</p>
                  </div>
                </div>
                
                <div className="bg-hanami-surface border border-[#EADBC8] rounded-lg p-4 mb-6">
                  <p className="text-hanami-text text-sm">
                    <strong>注意：</strong>此操作將會：
                  </p>
                  <ul className="text-hanami-text-secondary text-sm mt-2 space-y-1">
                    <li>• 將學生從此成長樹中移除</li>
                    <li>• 清除學生的課程類型設定</li>
                    <li>• 學生將不再顯示在此成長樹中</li>
                    <li className="text-green-600 font-medium">✓ 學生記錄將保留在系統中</li>
                  </ul>
                </div>
                
                <p className="text-hanami-text mb-6">
                  您確定要將學生 <strong>"{filteredStudents.find(s => s.id === studentToDelete)?.full_name}"</strong> 從成長樹中移除嗎？
                </p>
                
                <div className="flex gap-3 justify-end">
                  <button
                    className="px-4 py-2 text-sm font-medium text-hanami-text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={cancelDeleteStudent}
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-hanami-text-secondary bg-gray-100 from-hanami-primary to-hanami-secondary hover:from-hanami-secondary hover:to-hanami-accent rounded-lg transition-colors"
                    onClick={confirmDeleteStudent}
                  >
                    確認移除
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
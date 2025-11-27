import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon, StarIcon, AcademicCapIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard } from './index';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useOrganization } from '@/contexts/OrganizationContext';

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
  const { currentOrganization } = useOrganization();
  
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const PLACEHOLDER_ORG_IDS = new Set(['default-org', 'unassigned-org-placeholder']);
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) return null;
    return UUID_REGEX.test(currentOrganization.id) && !PLACEHOLDER_ORG_IDS.has(currentOrganization.id)
      ? currentOrganization.id
      : null;
  }, [currentOrganization?.id]);
  
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 安全檢查：確保 document.body 存在且是有效的 DOM 元素
  const canUsePortal = useMemo(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    return isMounted && document.body && document.body instanceof HTMLElement;
  }, [isMounted]);

  useEffect(() => {
    loadData();
  }, [treeId, treeCourseType, validOrgId]);

  const loadData = async () => {
    console.log('[GrowthTreeStudentsModal] 開始載入資料，treeId:', treeId, 'validOrgId:', validOrgId);
    setLoading(true);
    
    // 添加超時機制
    const timeout = setTimeout(() => {
      console.log('[GrowthTreeStudentsModal] 載入超時');
      setLoading(false);
    }, 10000); // 10秒超時

    try {
      
      // 1. 載入在此成長樹的學生（分步查詢避免 RLS 問題）
      console.log('[GrowthTreeStudentsModal] 步驟1: 載入在此成長樹的學生');
      // 先查詢 hanami_student_trees 表獲取 student_id 列表
      let studentTreesQuery = supabase
        .from('hanami_student_trees')
        .select('student_id, enrollment_date, completion_date, tree_status, teacher_notes, start_date, status, completed_goals')
        .eq('tree_id', treeId)
        .or('status.eq.active,tree_status.eq.active');
      
      if (validOrgId) {
        studentTreesQuery = studentTreesQuery.eq('org_id', validOrgId);
      }
      
      const { data: studentTreesData, error: treesError } = await studentTreesQuery;

      if (treesError) {
        console.error('[GrowthTreeStudentsModal] 載入學生樹關聯失敗:', treesError);
        throw treesError;
      }

      console.log('[GrowthTreeStudentsModal] 學生樹關聯數量:', studentTreesData?.length || 0);

      if (!studentTreesData || studentTreesData.length === 0) {
        console.log('[GrowthTreeStudentsModal] 沒有學生在此成長樹');
        setStudents([]);
        // 繼續載入所有學生，即使沒有學生在此成長樹
      } else {
        // 提取所有 student_id
        const studentIds = studentTreesData.map((item: any) => item.student_id).filter(Boolean);

        if (studentIds.length === 0) {
          console.log('[GrowthTreeStudentsModal] 沒有有效的學生ID');
          setStudents([]);
        } else {
          // 查詢學生詳細資料 - 使用 API 路由繞過 RLS
          console.log('[GrowthTreeStudentsModal] 查詢學生詳細資料，學生ID數量:', studentIds.length);
          
          if (!validOrgId) {
            console.error('[GrowthTreeStudentsModal] 無法查詢學生詳細資料：缺少 validOrgId');
            setStudents([]);
          } else {
            try {
              // 使用 API 路由繞過 RLS
              const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId)}&studentType=all&studentIds=${studentIds.join(',')}`;
              console.log('[GrowthTreeStudentsModal] 調用 API 查詢學生詳細資料:', apiUrl);
              
              const response = await fetch(apiUrl);
              const result = await response.json();
              
              if (!response.ok || !result.success) {
                console.error('[GrowthTreeStudentsModal] API 查詢學生詳細資料失敗:', result.error || result);
                setStudents([]);
              } else {
                const studentsData = (result.data || result.students || []) as Array<{
                  id: string;
                  full_name?: string | null;
                  nick_name?: string | null;
                  student_age?: number | null;
                  course_type?: string | null;
                  student_preference?: string | null;
                  student_remarks?: string | null;
                  [key: string]: any;
                }>;
                
                console.log('[GrowthTreeStudentsModal] API 返回學生資料，數量:', studentsData.length);
                
                // 合併資料
                const studentsMap = new Map(studentsData.map((s: any) => [s.id, s]));
                const formattedStudents = studentTreesData
                  .map((item: any) => {
                    const student = studentsMap.get(item.student_id);
                    if (!student) return null;
                    return {
                      id: student.id,
                      full_name: student.full_name,
                      nick_name: student.nick_name ?? undefined,
                      student_age: student.student_age ?? undefined,
                      course_type: student.course_type ?? undefined,
                      student_preference: student.student_preference ?? undefined,
                      student_remarks: student.student_remarks ?? undefined,
                      start_date: item.start_date || item.enrollment_date,
                      status: item.status || item.tree_status,
                      completed_goals: item.completed_goals || []
                    };
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null);
                
                // 在客戶端排序
                formattedStudents.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
                
                setStudents(formattedStudents);
                console.log('[GrowthTreeStudentsModal] 成功載入在此成長樹的學生，數量:', formattedStudents.length);
              }
            } catch (apiError) {
              console.error('[GrowthTreeStudentsModal] API 調用異常:', apiError);
              setStudents([]);
            }
          }
        }
      }

      // 2. 載入所有學生（用於選擇器）- 使用 API 路由繞過 RLS
      console.log('[GrowthTreeStudentsModal] 步驟2: 開始載入所有學生，validOrgId:', validOrgId);
      
      if (!validOrgId) {
        console.log('[GrowthTreeStudentsModal] 警告: 沒有 validOrgId，無法載入學生');
        setAllStudents([]);
      } else {
        try {
          // 使用 API 路由繞過 RLS 遞歸問題
          const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId)}&studentType=all`;
          console.log('[GrowthTreeStudentsModal] 調用 API:', apiUrl);
          
          const response = await fetch(apiUrl);
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            console.error('[GrowthTreeStudentsModal] API 載入所有學生失敗:', result.error || result);
            setAllStudents([]);
          } else {
            const typedAllStudentsData = (result.data || result.students || []) as Array<{
              id: string;
              full_name?: string | null;
              nick_name?: string | null;
              student_age?: number | null;
              course_type?: string | null;
              student_preference?: string | null;
              student_remarks?: string | null;
              [key: string]: any;
            }>;
            
            console.log('[GrowthTreeStudentsModal] 成功載入所有學生，數量:', typedAllStudentsData.length);
            
            if (typedAllStudentsData.length > 0) {
              const fixedAllStudents = typedAllStudentsData.map(s => ({
                id: s.id,
                full_name: s.full_name || '',
                nick_name: s.nick_name ?? undefined,
                student_age: s.student_age ?? undefined,
                course_type: s.course_type ?? undefined,
                student_preference: s.student_preference ?? undefined,
                student_remarks: s.student_remarks ?? undefined,
              }));
              setAllStudents(fixedAllStudents);
              console.log('[GrowthTreeStudentsModal] 已設置 allStudents，數量:', fixedAllStudents.length);

              // 3. 載入學生統計資訊（學習時長和上堂數）
              console.log('[GrowthTreeStudentsModal] 步驟3: 載入學生統計');
              try {
                await loadStudentStats(typedAllStudentsData.map(s => s.id));
              } catch (statsError) {
                console.error('[GrowthTreeStudentsModal] 載入學生統計失敗:', statsError);
                // 統計載入失敗不影響主流程
              }
            } else {
              console.log('[GrowthTreeStudentsModal] 沒有找到學生');
              setAllStudents([]);
            }
          }
        } catch (apiError) {
          console.error('[GrowthTreeStudentsModal] API 調用異常:', apiError);
          setAllStudents([]);
        }
      }

      // 4. 簡化版本：跳過能力載入
      console.log('[GrowthTreeStudentsModal] 步驟4: 跳過能力載入');
      setStudentAbilities([]);

      // 5. 簡化版本：跳過活動統計
      console.log('[GrowthTreeStudentsModal] 步驟5: 跳過活動統計');
      const currentStudents = students;
      if (currentStudents && currentStudents.length > 0) {
        const defaultActivityStats: {[key: string]: number} = {};
        currentStudents.forEach(student => {
          defaultActivityStats[student.id] = 0;
        });
        setActivityStats(defaultActivityStats);
      }

      console.log('[GrowthTreeStudentsModal] 所有資料載入完成');

    } catch (error) {
      console.error('[GrowthTreeStudentsModal] 載入資料失敗:', error);
      console.error('[GrowthTreeStudentsModal] 錯誤詳情:', JSON.stringify(error, null, 2));
      // 確保即使出錯也設置空數組
      setAllStudents([]);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      console.log('[GrowthTreeStudentsModal] 載入完成，loading 設置為 false');
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

        const typedLessonData = (lessonData || []) as Array<{
          lesson_activities?: string | null;
          [key: string]: any;
        }>;
        
        let totalParticipations = 0;
        typedLessonData.forEach(lesson => {
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
      const typedAllLessonData = (allLessonData || []) as Array<{
        student_id?: string;
        [key: string]: any;
      }>;
      const lessonsByStudent = new Map<string, any[]>();
      typedAllLessonData.forEach(lesson => {
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
      console.log('[GrowthTreeStudentsModal] 添加學生到成長樹:', selectedStudents);
      console.log('[GrowthTreeStudentsModal] treeId:', treeId, 'validOrgId:', validOrgId);
      
      if (!validOrgId) {
        console.error('[GrowthTreeStudentsModal] 無法添加學生：缺少 validOrgId');
        alert('無法添加學生：缺少機構 ID');
        return;
      }
      
      if (selectedStudents.length === 0) {
        console.log('[GrowthTreeStudentsModal] 沒有選中的學生');
        return;
      }
      
      // 使用 API 路由來添加學生，避免 RLS 問題
      try {
        const response = await fetch('/api/growth-trees/add-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            treeId,
            studentIds: selectedStudents,
            orgId: validOrgId,
          }),
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          console.error('[GrowthTreeStudentsModal] API 添加學生失敗:', result);
          const errorMessage = result.details || result.error || '未知錯誤';
          const errorCode = result.code ? ` (錯誤代碼: ${result.code})` : '';
          alert(`添加學生失敗: ${errorMessage}${errorCode}`);
          return;
        }
        
        console.log('[GrowthTreeStudentsModal] 成功添加學生到成長樹:', result);
        
        // 重新載入資料
        await loadData();
        setShowStudentSelector(false);
        setSelectedStudents([]);
      } catch (apiError) {
        console.error('[GrowthTreeStudentsModal] API 調用異常:', apiError);
        // 如果 API 不存在，嘗試直接插入（可能會有 RLS 問題）
        console.log('[GrowthTreeStudentsModal] 嘗試直接插入...');
        
        // 檢查學生是否已經在此成長樹中（使用 API 或直接查詢）
        let existingStudentIds: string[] = [];
        try {
          // 先嘗試使用現有查詢（可能因為 RLS 返回空，但不影響）
          const { data: existingStudents } = await supabase
            .from('hanami_student_trees')
            .select('student_id')
            .eq('tree_id', treeId)
            .eq('org_id', validOrgId)
            .in('student_id', selectedStudents);
          
          existingStudentIds = (existingStudents || []).map((s: any) => s.student_id || '').filter(Boolean);
        } catch (checkError) {
          console.warn('[GrowthTreeStudentsModal] 檢查現有學生失敗，繼續添加:', checkError);
        }
        
        const newStudentIds = selectedStudents.filter(id => !existingStudentIds.includes(id));
        
        if (newStudentIds.length === 0) {
          console.log('[GrowthTreeStudentsModal] 所有選中的學生都已經在此成長樹中');
          setShowStudentSelector(false);
          setSelectedStudents([]);
          return;
        }
        
        // 添加新學生到成長樹
        const { error } = await (supabase
          .from('hanami_student_trees') as any)
          .insert(newStudentIds.map(studentId => ({
            student_id: studentId,
            tree_id: treeId,
            org_id: validOrgId,
            start_date: new Date().toISOString().split('T')[0],
            status: 'active',
            tree_status: 'active'
          })) as any);

        if (error) {
          console.error('[GrowthTreeStudentsModal] 插入失敗:', error);
          throw error;
        }

        console.log('[GrowthTreeStudentsModal] 成功添加學生到成長樹');
        
        // 重新載入資料
        await loadData();
        setShowStudentSelector(false);
        setSelectedStudents([]);
      }
    } catch (error) {
      console.error('[GrowthTreeStudentsModal] 添加學生失敗:', error);
      alert(`添加學生失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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

  if (!canUsePortal) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" style={{ pointerEvents: 'auto' }}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 101, pointerEvents: 'auto' }}
      >
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/tree ui.png"
                alt="成長樹"
                width={36}
                height={36}
                className="h-9 w-9"
              />
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
        <div className="flex-1 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          {/* 搜尋和操作欄 */}
          <div className="flex justify-between items-center mb-6" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('添加學生按鈕被點擊');
                setShowStudentSelector(true);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="inline-flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer"
              type="button"
              style={{ position: 'relative', zIndex: 10001, pointerEvents: 'auto' }}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              添加學生
            </motion.button>
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
        {showStudentSelector && canUsePortal ? createPortal(
          <div 
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowStudentSelector(false);
              }
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-hanami-text">選擇學生</h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowStudentSelector(false);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="text-hanami-text hover:text-hanami-text-secondary transition-colors cursor-pointer p-2"
                    type="button"
                    style={{ position: 'relative', zIndex: 10001 }}
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
                {allStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-hanami-text-secondary">載入中或暫無可選學生</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allStudents
                      .filter(student => !students.find(s => s.id === student.id))
                      .filter(student => 
                        student.full_name.toLowerCase().includes(studentSelectorSearch.toLowerCase()) ||
                        (student.nick_name && student.nick_name.toLowerCase().includes(studentSelectorSearch.toLowerCase()))
                      )
                      .length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-hanami-text-secondary">
                            {studentSelectorSearch ? '沒有找到符合搜尋條件的學生' : '所有學生已在此成長樹中'}
                          </p>
                        </div>
                      ) : (
                        allStudents
                          .filter(student => !students.find(s => s.id === student.id))
                          .filter(student => 
                            student.full_name.toLowerCase().includes(studentSelectorSearch.toLowerCase()) ||
                            (student.nick_name && student.nick_name.toLowerCase().includes(studentSelectorSearch.toLowerCase()))
                          )
                          .map((student) => {
                      const stats = studentStats[student.id] || { learningDuration: '未開始', lessonCount: 0 };
                      return (
                        <label 
                          key={student.id} 
                          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
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
                    })
                    )}
                  </div>
                )}
              </div>
              
              <div 
                className="p-6 border-t border-gray-200 flex justify-between items-center"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', zIndex: 10000 }}
              >
                <div className="text-sm text-gray-600">
                  已選擇 {selectedStudents.length} 位學生
                </div>
                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowStudentSelector(false);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="px-4 py-3 rounded-xl bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    type="button"
                    style={{ position: 'relative', zIndex: 10001 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: selectedStudents.length === 0 ? 1 : 1.05 }}
                    whileTap={{ scale: selectedStudents.length === 0 ? 1 : 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addStudentsToTree();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    disabled={selectedStudents.length === 0}
                    className={`px-4 py-3 rounded-xl bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer ${selectedStudents.length === 0 ? 'opacity-75 cursor-not-allowed' : ''}`}
                    type="button"
                    style={{ position: 'relative', zIndex: 10001 }}
                  >
                    添加選中的學生 ({selectedStudents.length})
                  </motion.button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        ) : null}

        {/* 刪除確認視窗 */}
        {showDeleteConfirm && canUsePortal ? createPortal(
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                cancelDeleteStudent();
              }
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'relative', zIndex: 10001 }}
            >
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <Image
                    src="/tree ui.png"
                    alt="成長樹"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <h2 className="text-xl font-bold text-hanami-text">從成長樹移除學生</h2>
                </div>
              </div>
              
              <div className="p-6" style={{ position: 'relative', zIndex: 10001 }}>
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
                
                <div 
                  className="flex gap-3 justify-end"
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'relative', zIndex: 10002 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      cancelDeleteStudent();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="px-4 py-3 rounded-xl bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    style={{ position: 'relative', zIndex: 10002 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      confirmDeleteStudent();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    style={{ position: 'relative', zIndex: 10002 }}
                  >
                    確認移除
                  </motion.button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 
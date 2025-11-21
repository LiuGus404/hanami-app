import { supabase } from './supabase';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

async function safeSupabaseQuery<T>(query: PromiseLike<PostgrestSingleResponse<T>>) {
  try {
    const result = await query;
    return { data: (Array.isArray(result.data) ? result.data : []) as T[], error: result.error };
  } catch (error) {
    console.error('safeQuery 錯誤:', error);
    return { data: [], error: null };
  }
}

// 簡單的內存快取
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘

interface QueryOptions {
  organizationId?: string;
  userEmail?: string; // 用於 API 調用
  useApi?: boolean; // 是否使用 API 端點（瀏覽器環境）
}

export async function getBaseDashboardData(
  limit: number = 10,
  options: QueryOptions = {}
) {
  const cacheKey = `base_dashboard_${limit}_${options.organizationId || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  try {
    // 檢查是否應該使用 API（在瀏覽器環境中）
    const isBrowser = typeof window !== 'undefined';
    const shouldUseApi = isBrowser && options.organizationId && options.userEmail;

    let abilities: any[] = [];
    let trees: any[] = [];
    let activities: any[] = [];
    let assessments: any[] = [];

    if (shouldUseApi) {
      // 使用 API 端點獲取數據
      try {
        // 並行獲取所有數據
        const [abilitiesResponse, treesResponse, activitiesResponse, assessmentsResponse] = await Promise.all([
          // 能力 - 目前沒有專門的 API，使用直接查詢但捕獲錯誤
          safeSupabaseQuery(
            supabase
              .from('hanami_development_abilities')
              .select('*')
              .eq('is_active', true)
              .eq('org_id', options.organizationId!)
              .order('ability_order', { ascending: true })
          ),
          
          // 成長樹 - 使用 API 端點
          fetch(`/api/growth-trees?orgId=${encodeURIComponent(options.organizationId!)}`)
            .then(res => res.ok ? res.json() : { data: [] })
            .then(result => ({ data: result.data || result || [], error: null }))
            .catch(() => ({ data: [], error: null })),
          
          // 教學活動 - 直接查詢但捕獲錯誤
          safeSupabaseQuery(
            supabase
              .from('hanami_teaching_activities')
              .select('*')
              .eq('status', 'published')
              .eq('org_id', options.organizationId!)
              .order('created_at', { ascending: false })
              .limit(limit)
          ),
          
          // 評估記錄 - 使用 API 端點
          fetch(`/api/ability-assessments/list?orgId=${encodeURIComponent(options.organizationId!)}&limit=${limit}`)
            .then(res => res.ok ? res.json() : { data: [] })
            .then(result => ({ data: result.data || result || [], error: null }))
            .catch(() => ({ data: [], error: null })),
        ]);

        abilities = abilitiesResponse.data || [];
        trees = treesResponse.data || [];
        activities = activitiesResponse.data || [];
        assessments = assessmentsResponse.data || [];
      } catch (apiError) {
        console.error('⚠️ API 調用異常，使用直接查詢:', apiError);
        // 回退到直接查詢，但捕獲所有錯誤
      }
    }

    // 如果 API 沒有返回數據或失敗，使用直接查詢（但捕獲錯誤）
    if (abilities.length === 0 || trees.length === 0 || activities.length === 0 || assessments.length === 0) {
      const queries = [];

      // 查詢能力
      let abilitiesQuery = supabase
        .from('hanami_development_abilities')
        .select('*')
        .eq('is_active', true)
        .order('ability_order', { ascending: true });
      
      if (options.organizationId) {
        abilitiesQuery = abilitiesQuery.eq('org_id', options.organizationId);
      }
      queries.push(safeSupabaseQuery(abilitiesQuery));

      // 查詢成長樹
      let treesQuery = supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('is_active', true)
        .order('tree_level', { ascending: true });
      
      if (options.organizationId) {
        treesQuery = treesQuery.eq('org_id', options.organizationId);
      }
      queries.push(safeSupabaseQuery(treesQuery));

      // 查詢教學活動
      let activitiesQuery = supabase
        .from('hanami_teaching_activities')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (options.organizationId) {
        activitiesQuery = activitiesQuery.eq('org_id', options.organizationId);
      }
      queries.push(safeSupabaseQuery(activitiesQuery));

      // 查詢最近的評估
      let assessmentsQuery = supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(id, full_name, nick_name),
          tree:hanami_growth_trees(id, tree_name)
        `)
        .order('assessment_date', { ascending: false })
        .limit(limit);
      
      if (options.organizationId) {
        assessmentsQuery = assessmentsQuery.eq('org_id', options.organizationId);
      }
      queries.push(safeSupabaseQuery(assessmentsQuery));

      const results = await Promise.all(queries);
      
      // 只使用成功查詢的結果，失敗的保持為空數組
      if (abilities.length === 0) abilities = results[0].data || [];
      if (trees.length === 0) trees = results[1].data || [];
      if (activities.length === 0) activities = results[2].data || [];
      if (assessments.length === 0) assessments = results[3].data || [];
    }

    const data = {
      abilities,
      trees,
      activities,
      assessments,
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('獲取基礎儀表板數據失敗:', error);
    return {
      abilities: [],
      trees: [],
      activities: [],
      assessments: [],
    };
  }
}

export async function getStudentAssessmentStatus(
  date: string,
  options: QueryOptions = {}
) {
  const cacheKey = `assessment_status_${date}_${options.organizationId || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  try {
    // 檢查是否應該使用 API（在瀏覽器環境中）
    const isBrowser = typeof window !== 'undefined';
    const shouldUseApi = isBrowser && options.organizationId && options.userEmail;

    console.log('🔍 getStudentAssessmentStatus 調用:', {
      date,
      isBrowser,
      organizationId: options.organizationId,
      userEmail: options.userEmail,
      shouldUseApi,
    });

    // 查詢該日期的課程
    let lessonsQuery = supabase
      .from('hanami_student_lesson')
      .select('*')
      .eq('lesson_date', date);
    
    if (options.organizationId) {
      lessonsQuery = lessonsQuery.eq('org_id', options.organizationId);
    }
    const { data: lessons } = await lessonsQuery;

    // 查詢該日期的評估 - 優先使用 API 端點繞過 RLS（在瀏覽器環境中）
    let assessments: any[] = [];

    if (shouldUseApi) {
      console.log('✅ 使用 API 端點獲取評估記錄');
      try {
        // 使用 API 端點獲取評估記錄
        const apiUrl = `/api/ability-assessments/list?orgId=${encodeURIComponent(options.organizationId!)}&assessmentDate=${encodeURIComponent(date)}`;
        console.log('📡 調用評估記錄 API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });
        
        console.log('📡 API 回應狀態:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          assessments = result.data || [];
          console.log('✅ 通過 API 載入評估記錄數量:', assessments.length);
        } else {
          const errorText = await response.text();
          console.warn('⚠️ 無法通過 API 載入評估記錄，狀態:', response.status, '錯誤:', errorText);
          throw new Error(`API call failed: ${response.status}`);
        }
      } catch (apiError) {
        console.error('⚠️ API 調用異常，嘗試直接查詢評估記錄:', apiError);
        // 回退到直接查詢
        let assessmentsQuery = supabase
          .from('hanami_ability_assessments')
          .select(`
            *,
            student:Hanami_Students(id, full_name, nick_name, course_type),
            tree:hanami_growth_trees(id, tree_name)
          `)
          .eq('assessment_date', date);
        
        if (options.organizationId) {
          assessmentsQuery = assessmentsQuery.eq('org_id', options.organizationId);
        }
        
        const { data: assessmentsData } = await assessmentsQuery;
        assessments = assessmentsData || [];
      }
    } else {
      console.log('⚠️ 不使用 API，原因:', {
        isBrowser,
        hasOrgId: !!options.organizationId,
        hasUserEmail: !!options.userEmail,
      });
      // 服務端或沒有 API 選項時，使用直接查詢
      let assessmentsQuery = supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(id, full_name, nick_name, course_type),
          tree:hanami_growth_trees(id, tree_name)
        `)
        .eq('assessment_date', date);
      
      if (options.organizationId) {
        assessmentsQuery = assessmentsQuery.eq('org_id', options.organizationId);
      }
      
      const { data: assessmentsData, error: assessmentsError } = await assessmentsQuery;
      if (assessmentsError) {
        console.error('❌ 直接查詢評估記錄失敗:', assessmentsError);
      }
      assessments = assessmentsData || [];
    }

    // 獲取學生列表 - 參考 class-activities 的邏輯，查詢所有常規學生而不僅是有課程的學生
    // 首先獲取該日期有課程的學生 ID（用於回退）
    const lessonStudentIds = new Set<string>();
    lessons?.forEach((lesson: any) => {
      if (lesson.student_id) lessonStudentIds.add(lesson.student_id);
    });
    assessments?.forEach((assessment: any) => {
      if (assessment.student_id) lessonStudentIds.add(assessment.student_id);
    });

    // 查詢該機構的所有常規學生（參考 class-activities 的邏輯）
    // 優先使用 API 端點繞過 RLS（在瀏覽器環境中）
    let students: any[] = [];

    if (shouldUseApi) {
      console.log('✅ 使用 API 端點獲取常規學生');
      try {
        // 使用 API 端點獲取所有常規學生
        const apiUrl = `/api/students/list?orgId=${encodeURIComponent(options.organizationId!)}&studentType=常規${options.userEmail ? `&userEmail=${encodeURIComponent(options.userEmail)}` : ''}`;
        console.log('📡 調用學生列表 API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });
        
        console.log('📡 API 回應狀態:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          students = result.students || result.data || [];
          console.log('✅ 通過 API 載入常規學生數量:', students.length);
        } else {
          const errorText = await response.text();
          console.warn('⚠️ 無法通過 API 載入常規學生，狀態:', response.status, '錯誤:', errorText);
          throw new Error(`API call failed: ${response.status}`);
        }
      } catch (apiError) {
        console.error('⚠️ API 調用異常，嘗試直接查詢:', apiError);
        // 回退到直接查詢
        let allStudentsQuery = supabase
          .from('Hanami_Students')
          .select('*')
          .eq('student_type', '常規');
        
        if (options.organizationId) {
          allStudentsQuery = allStudentsQuery.eq('org_id', options.organizationId);
        }
        
        const { data: allStudents, error: allStudentsError } = await allStudentsQuery;
        
        if (allStudents && allStudents.length > 0 && !allStudentsError) {
          students = allStudents;
        } else if (lessonStudentIds.size > 0) {
          // 回退：只查詢有課程的學生
          let studentsQuery = supabase
            .from('Hanami_Students')
            .select('*')
            .in('id', Array.from(lessonStudentIds));
          
          if (options.organizationId) {
            studentsQuery = studentsQuery.eq('org_id', options.organizationId);
          }
          
          const { data: lessonStudents } = await studentsQuery;
          students = lessonStudents || [];
        }
      }
    } else {
      // 服務端或沒有 API 選項時，使用直接查詢
      let allStudentsQuery = supabase
        .from('Hanami_Students')
        .select('*')
        .eq('student_type', '常規');
      
      if (options.organizationId) {
        allStudentsQuery = allStudentsQuery.eq('org_id', options.organizationId);
      }
      
      const { data: allStudents, error: allStudentsError } = await allStudentsQuery;
      
      if (allStudents && allStudents.length > 0 && !allStudentsError) {
        students = allStudents;
      } else if (lessonStudentIds.size > 0) {
        // 回退：只查詢有課程的學生
        let studentsQuery = supabase
          .from('Hanami_Students')
          .select('*')
          .in('id', Array.from(lessonStudentIds));
        
        if (options.organizationId) {
          studentsQuery = studentsQuery.eq('org_id', options.organizationId);
        }
        
        const { data: lessonStudents } = await studentsQuery;
        students = lessonStudents || [];
      }
    }

    // 獲取成長樹列表
    const treeIds = new Set<string>();
    assessments?.forEach((assessment: any) => {
      if (assessment.tree_id) treeIds.add(assessment.tree_id);
    });

    let treesQuery = supabase
      .from('hanami_growth_trees')
      .select('*')
      .in('id', Array.from(treeIds));
    
    if (options.organizationId) {
      treesQuery = treesQuery.eq('org_id', options.organizationId);
    }
    const { data: trees } = await treesQuery;

    const data = {
      lessons: lessons || [],
      assessments: assessments || [],
      students: students || [],
      trees: trees || [],
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('獲取學生評估狀態失敗:', error);
    return {
      lessons: [],
      assessments: [],
      students: [],
      trees: [],
    };
  }
}

export async function getStudentMediaStatus(
  date: string,
  options: QueryOptions = {}
) {
  const cacheKey = `media_status_${date}_${options.organizationId || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  try {
    // 查詢該日期的課程
    let lessonsQuery = supabase
      .from('hanami_student_lesson')
      .select('*')
      .eq('lesson_date', date);
    
    if (options.organizationId) {
      lessonsQuery = lessonsQuery.eq('org_id', options.organizationId);
    }
    const { data: lessons } = await lessonsQuery;

    // 查詢該日期的媒體（假設媒體存儲在課程記錄的 video_url 或其他字段中）
    // 這裡需要根據實際的媒體表結構調整
    const media: any[] = [];
    lessons?.forEach((lesson: any) => {
      if (lesson.video_url) {
        media.push({
          lesson_id: lesson.id,
          student_id: lesson.student_id,
          video_url: lesson.video_url,
          lesson_date: lesson.lesson_date,
        });
      }
    });

    const data = {
      lessons: lessons || [],
      media: media || [],
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('獲取學生媒體狀態失敗:', error);
    return {
      lessons: [],
      media: [],
    };
  }
}

export function clearCache(key?: string) {
  if (key) {
    // 清除特定快取鍵
    const keysToDelete: string[] = [];
    cache.forEach((value, cacheKey) => {
      if (cacheKey.includes(key)) {
        keysToDelete.push(cacheKey);
      }
    });
    keysToDelete.forEach(k => cache.delete(k));
  } else {
    // 清除所有快取
    cache.clear();
  }
}


import { supabase } from './supabase';

// 簡單的內存快取
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘

interface QueryOptions {
  organizationId?: string;
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
    queries.push(abilitiesQuery);

    // 查詢成長樹
    let treesQuery = supabase
      .from('hanami_growth_trees')
      .select('*')
      .eq('is_active', true)
      .order('tree_level', { ascending: true });
    
    if (options.organizationId) {
      treesQuery = treesQuery.eq('org_id', options.organizationId);
    }
    queries.push(treesQuery);

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
    queries.push(activitiesQuery);

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
    queries.push(assessmentsQuery);

    const [abilitiesResult, treesResult, activitiesResult, assessmentsResult] = await Promise.all(queries);

    const data = {
      abilities: abilitiesResult.data || [],
      trees: treesResult.data || [],
      activities: activitiesResult.data || [],
      assessments: assessmentsResult.data || [],
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
    // 查詢該日期的課程
    let lessonsQuery = supabase
      .from('hanami_student_lesson')
      .select('*')
      .eq('lesson_date', date);
    
    if (options.organizationId) {
      lessonsQuery = lessonsQuery.eq('org_id', options.organizationId);
    }
    const { data: lessons } = await lessonsQuery;

    // 查詢該日期的評估
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
    const { data: assessments } = await assessmentsQuery;

    // 獲取學生列表
    const studentIds = new Set<string>();
    lessons?.forEach((lesson: any) => {
      if (lesson.student_id) studentIds.add(lesson.student_id);
    });
    assessments?.forEach((assessment: any) => {
      if (assessment.student_id) studentIds.add(assessment.student_id);
    });

    let studentsQuery = supabase
      .from('Hanami_Students')
      .select('*')
      .in('id', Array.from(studentIds));
    
    if (options.organizationId) {
      studentsQuery = studentsQuery.eq('org_id', options.organizationId);
    }
    const { data: students } = await studentsQuery;

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


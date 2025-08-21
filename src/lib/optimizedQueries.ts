import { supabase } from './supabase';

// 查詢快取介面
interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

// 全局快取實例
const queryCache: QueryCache = {};

// 快取配置
const CACHE_TTL = {
  SHORT: 30 * 1000, // 30秒
  MEDIUM: 5 * 60 * 1000, // 5分鐘
  LONG: 30 * 60 * 1000, // 30分鐘
};

// 生成快取鍵
function generateCacheKey(table: string, query: any): string {
  return `${table}:${JSON.stringify(query)}`;
}

// 檢查快取是否有效
function isCacheValid(cacheKey: string, ttl: number): boolean {
  const cached = queryCache[cacheKey];
  if (!cached) return false;
  
  const now = Date.now();
  return now - cached.timestamp < ttl;
}

// 設置快取
function setCache(cacheKey: string, data: any, ttl: number): void {
  queryCache[cacheKey] = {
    data,
    timestamp: Date.now(),
    ttl
  };
}

// 獲取快取
function getCache(cacheKey: string): any | null {
  const cached = queryCache[cacheKey];
  return cached ? cached.data : null;
}

// 清理過期快取
function cleanupExpiredCache(): void {
  const now = Date.now();
  Object.keys(queryCache).forEach(key => {
    const cached = queryCache[key];
    if (now - cached.timestamp > cached.ttl) {
      delete queryCache[key];
    }
  });
}

// 定期清理快取（每5分鐘）
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

// 優化的批量查詢函數
export async function batchQuery<T>(
  queries: Array<{
    table: string;
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    cacheTTL?: number;
  }>
): Promise<any[]> {
  try {
    // 更新性能監控
    if ((window as any).performanceMonitor) {
      (window as any).performanceMonitor.incrementQueryCount();
    }

    const results: any[] = [];
    
    // 並行執行所有查詢
    const queryPromises = queries.map(async (query, index) => {
      const cacheKey = generateCacheKey(query.table, query);
      const ttl = query.cacheTTL || CACHE_TTL.MEDIUM;
      
      // 檢查快取
      if (isCacheValid(cacheKey, ttl)) {
        console.log(`使用快取: ${query.table}`);
        return getCache(cacheKey);
      }
      
      // 執行查詢
      let supabaseQuery = supabase.from(query.table as any).select(query.select || '*');
      
      // 應用過濾器
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            supabaseQuery = supabaseQuery.in(key, value);
          } else {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        });
      }
      
      // 應用排序
      if (query.orderBy) {
        supabaseQuery = supabaseQuery.order(query.orderBy.column, {
          ascending: query.orderBy.ascending !== false
        });
      }
      
      // 應用限制
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        console.error(`查詢錯誤 ${query.table}:`, error);
        throw error;
      }
      
      // 設置快取
      setCache(cacheKey, data, ttl);
      
      return data;
    });
    
    const queryResults = await Promise.all(queryPromises);
    
    // 返回查詢結果陣列
    return queryResults;
  } catch (error) {
    console.error('批量查詢錯誤:', error);
    throw error;
  }
}

// 優化的學生評估狀態查詢
export async function getStudentAssessmentStatus(date: string) {
  const cacheKey = `student_assessment_status:${date}`;
  const ttl = CACHE_TTL.SHORT;
  
  if (isCacheValid(cacheKey, ttl)) {
    return getCache(cacheKey);
  }
  
  const queries = [
    {
      table: 'hanami_student_lesson',
      select: 'student_id, actual_timeslot',
      filters: { lesson_date: date },
      orderBy: { column: 'actual_timeslot', ascending: true },
      cacheTTL: CACHE_TTL.SHORT
    },
    {
      table: 'hanami_ability_assessments',
      select: 'student_id, assessment_date',
      filters: { assessment_date: date },
      cacheTTL: CACHE_TTL.SHORT
    },
    {
      table: 'Hanami_Students',
      select: 'id, full_name, nick_name, course_type',
      cacheTTL: CACHE_TTL.MEDIUM
    },
    {
      table: 'hanami_student_trees',
      select: 'student_id, tree_id, status',
      filters: { status: 'active' },
      cacheTTL: CACHE_TTL.MEDIUM
    }
  ];
  
  const [lessonsData, assessmentsData, studentsData, treesData] = await batchQuery(queries);
  
  const result = {
    lessons: lessonsData,
    assessments: assessmentsData,
    students: studentsData,
    trees: treesData
  };
  
  setCache(cacheKey, result, ttl);
  return result;
}

// 優化的學生媒體狀態查詢
export async function getStudentMediaStatus(date: string) {
  const cacheKey = `student_media_status:${date}`;
  const ttl = CACHE_TTL.SHORT;
  
  if (isCacheValid(cacheKey, ttl)) {
    return getCache(cacheKey);
  }
  
  const queries = [
    {
      table: 'hanami_student_lesson',
      select: 'student_id, lesson_date, actual_timeslot, full_name, course_type',
      filters: { lesson_date: date },
      cacheTTL: CACHE_TTL.SHORT
    },
    {
      table: 'hanami_student_media',
      select: 'student_id, created_at, media_type',
      cacheTTL: CACHE_TTL.SHORT
    }
  ];
  
  const [lessonsData, mediaData] = await batchQuery(queries);
  
  // 過濾指定日期的媒體資料
  const filteredMediaData = (mediaData as any[]).filter((media: any) => 
    media.created_at.startsWith(date)
  );
  
  const result = {
    lessons: lessonsData,
    media: filteredMediaData
  };
  
  setCache(cacheKey, result, ttl);
  return result;
}

// 優化的基礎資料查詢
export async function getBaseDashboardData(assessmentLimit: number = 5) {
  const cacheKey = `base_dashboard_data:${assessmentLimit}`;
  const ttl = CACHE_TTL.MEDIUM;
  
  if (isCacheValid(cacheKey, ttl)) {
    return getCache(cacheKey);
  }
  
  const queries = [
    {
      table: 'hanami_development_abilities',
      orderBy: { column: 'ability_name' },
      cacheTTL: CACHE_TTL.LONG
    },
    {
      table: 'hanami_growth_trees',
      filters: { is_active: true },
      orderBy: { column: 'tree_name' },
      cacheTTL: CACHE_TTL.LONG
    },
    {
      table: 'hanami_teaching_activities',
      orderBy: { column: 'activity_name' },
      cacheTTL: CACHE_TTL.LONG
    },
    {
      table: 'hanami_ability_assessments',
      select: '*, student:Hanami_Students(full_name, nick_name), tree:hanami_growth_trees(tree_name)',
      orderBy: { column: 'created_at', ascending: false },
      limit: assessmentLimit,
      cacheTTL: CACHE_TTL.SHORT
    }
  ];
  
  const [abilities, trees, activities, assessments] = await batchQuery(queries);
  
  const result = {
    abilities,
    trees,
    activities,
    assessments
  };
  
  setCache(cacheKey, result, ttl);
  return result;
}

// 清除特定快取
export function clearCache(pattern?: string): void {
  if (pattern) {
    Object.keys(queryCache).forEach(key => {
      if (key.includes(pattern)) {
        delete queryCache[key];
      }
    });
  } else {
    Object.keys(queryCache).forEach(key => {
      delete queryCache[key];
    });
  }
}

// 獲取快取統計
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
} {
  const totalEntries = Object.keys(queryCache).length;
  const totalSize = JSON.stringify(queryCache).length;
  
  return {
    totalEntries,
    totalSize,
    hitRate: 0 // 需要實現命中率追蹤
  };
} 
 
 
 
 
 
 
 
 
 
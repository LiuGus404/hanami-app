import { getSupabaseClient } from '@/lib/supabase';

export interface OrgLikeState {
  likedByMe: boolean;
  totalLikes: number;
}

export interface CourseLikeState {
  likedByMe: boolean;
  totalLikes: number;
}

/**
 * 獲取機構 Like 狀態
 * @param orgId 機構 ID（來自 hanami_organizations）
 * @param userId 可選的用戶 ID（來自 saas_users.id），如果不提供則嘗試從會話獲取
 * @returns Like 狀態，包含總數和當前用戶是否已 like
 */
export async function getOrgLikeState(orgId: string, userId?: string): Promise<OrgLikeState> {
  // 如果沒有提供 userId，嘗試從 saas 系統獲取
  let finalUserId = userId;
  if (!finalUserId) {
    // 嘗試從 localStorage 獲取 saas 用戶會話
    if (typeof window !== 'undefined') {
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const sessionData = JSON.parse(saasSession);
          if (sessionData?.user?.id) {
            finalUserId = sessionData.user.id;
          }
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  }
  
  const params = new URLSearchParams();
  params.set('orgId', orgId);
  if (finalUserId) params.set('userId', finalUserId);

  try {
    const response = await fetch(`/api/organizations/like?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `Like API 回傳 ${response.status}`;
      console.error('❌ getOrgLikeState API 失敗:', message);
      throw new Error(message);
    }

    const payload: { totalLikes: number; likedByMe: boolean } = await response.json();
    return {
      likedByMe: payload.likedByMe,
      totalLikes: payload.totalLikes ?? 0,
    };
  } catch (error) {
    console.warn('⚠️ getOrgLikeState fallback:', error);
    return { likedByMe: false, totalLikes: 0 };
  }
}

/**
 * 切換機構 Like 狀態
 * @param orgId 機構 ID（來自 hanami_organizations）
 * @param userId 可選的用戶 ID（來自 saas_users.id），如果不提供則嘗試從會話獲取
 * @returns 更新後的 Like 狀態
 * @throws 如果用戶未登入，拋出 'NOT_AUTHENTICATED' 錯誤
 */
export async function toggleOrgLike(orgId: string, userId?: string): Promise<OrgLikeState> {
  // 如果沒有提供 userId，嘗試從 saas 系統獲取
  let finalUserId = userId;
  if (!finalUserId) {
    // 嘗試從 localStorage 獲取 saas 用戶會話
    if (typeof window !== 'undefined') {
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const sessionData = JSON.parse(saasSession);
          if (sessionData?.user?.id) {
            finalUserId = sessionData.user.id;
          }
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  }
  
  console.log('🔄 toggleOrgLike 開始', { orgId, userId: finalUserId ? '有' : '無' });
  
  if (!finalUserId) {
    console.error('❌ 用戶未認證');
    throw new Error('NOT_AUTHENTICATED');
  }

  try {
    const response = await fetch('/api/organizations/like', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, userId: finalUserId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `Like API 回傳 ${response.status}`;
      throw new Error(message);
    }

    const payload: { likedByMe: boolean; totalLikes: number } = await response.json();
    return {
      likedByMe: payload.likedByMe,
      totalLikes: payload.totalLikes ?? 0,
    };
  } catch (e) {
    console.error('❌ toggleOrgLike 發生錯誤:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(errorMessage);
  }
}

// ==================== 課程 Like 功能 ====================
// 注意：課程 Like 存儲在舊系統（hanami-ai-system）中
// 但用戶 ID 來自新系統（hanami-saas-system）的 saas_users.id

/**
 * 獲取課程 Like 狀態
 * @param courseId 課程 ID（來自 Hanami_CourseTypes）
 * @param userId 可選的用戶 ID（來自 saas_users.id），如果不提供則嘗試從會話獲取
 * @returns Like 狀態，包含總數和當前用戶是否已 like
 */
export async function getCourseLikeState(courseId: string, userId?: string): Promise<CourseLikeState> {
  // 如果沒有提供 userId，嘗試從 saas 系統獲取
  let finalUserId = userId;
  if (!finalUserId) {
    // 嘗試從 localStorage 獲取 saas 用戶會話
    if (typeof window !== 'undefined') {
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const sessionData = JSON.parse(saasSession);
          if (sessionData?.user?.id) {
            finalUserId = sessionData.user.id;
          }
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  }
  
  console.log('📋 getCourseLikeState 查詢 API ', { courseId, userId: finalUserId ? '有' : '無' });
  
  const params = new URLSearchParams();
  params.set('courseId', courseId);
  if (finalUserId) params.set('userId', finalUserId);

  try {
    const response = await fetch(`/api/courses/like?${params.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `Like API 回傳 ${response.status}`;
      console.error('❌ getCourseLikeState API 失敗:', message);
      throw new Error(message);
    }

    const payload: { totalLikes: number; likedByMe: boolean } = await response.json();
    return {
      likedByMe: payload.likedByMe,
      totalLikes: payload.totalLikes ?? 0
    };
  } catch (error) {
    console.warn('⚠️ getCourseLikeState fallback:', error);
    return { likedByMe: false, totalLikes: 0 };
  }
}

/**
 * 切換課程 Like 狀態
 * @param courseId 課程 ID（來自 Hanami_CourseTypes）
 * @param userId 可選的用戶 ID（來自 saas_users.id），如果不提供則嘗試從會話獲取
 * @returns 更新後的 Like 狀態
 * @throws 如果用戶未登入，拋出 'NOT_AUTHENTICATED' 錯誤
 */
export async function toggleCourseLike(courseId: string, userId?: string): Promise<CourseLikeState> {
  // 如果沒有提供 userId，嘗試從 saas 系統獲取
  let finalUserId = userId;
  if (!finalUserId) {
    // 嘗試從 localStorage 獲取 saas 用戶會話
    if (typeof window !== 'undefined') {
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const sessionData = JSON.parse(saasSession);
          if (sessionData?.user?.id) {
            finalUserId = sessionData.user.id;
          }
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  }
  
  console.log('🔄 toggleCourseLike 開始', { courseId, userId: finalUserId ? '有' : '無' });
  
  if (!finalUserId) {
    console.error('❌ 用戶未認證');
    throw new Error('NOT_AUTHENTICATED');
  }
  
  try {
    const response = await fetch('/api/courses/like', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, userId: finalUserId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `Like API 回傳 ${response.status}`;
      throw new Error(message);
    }

    const payload: { likedByMe: boolean; totalLikes: number } = await response.json();
    return {
      likedByMe: payload.likedByMe,
      totalLikes: payload.totalLikes ?? 0
    };
  } catch (e) {
    console.error('❌ toggleCourseLike 發生錯誤:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(errorMessage);
  }
}

/**
 * 批量獲取多個課程的 Like 狀態
 * @param courseIds 課程 ID 陣列
 * @param userId 可選的用戶 ID（來自 saas_users.id），如果不提供則嘗試從會話獲取
 * @returns 課程 ID 到 Like 狀態的映射
 */
export async function getBatchCourseLikeStates(courseIds: string[], userId?: string): Promise<Record<string, CourseLikeState>> {
  // 如果沒有提供 userId，嘗試從 saas 系統獲取
  let finalUserId = userId;
  if (!finalUserId) {
    // 嘗試從 localStorage 獲取 saas 用戶會話
    if (typeof window !== 'undefined') {
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const sessionData = JSON.parse(saasSession);
          if (sessionData?.user?.id) {
            finalUserId = sessionData.user.id;
          }
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  }
  
  if (courseIds.length === 0) {
    return {};
  }
  
  const oldSupabase = getSupabaseClient();
  const result: Record<string, CourseLikeState> = {};
  
  try {
    // 獲取所有課程的 Like 數量
    const { data: counts, error: countError } = await oldSupabase
      .from('hanami_course_likes')
      .select('course_id')
      .in('course_id', courseIds);
    
    if (countError) throw countError;
    
    // 計算每個課程的 Like 數量
    const likeCounts: Record<string, number> = {};
    courseIds.forEach(id => {
      likeCounts[id] = 0;
    });
    
    counts?.forEach((like: any) => {
      if (like.course_id) {
        likeCounts[like.course_id] = (likeCounts[like.course_id] || 0) + 1;
      }
    });
    
    // 獲取當前用戶的 Like 狀態
    let userLikes: string[] = [];
    if (finalUserId) {
      const { data: userLikeData, error: userLikeError } = await oldSupabase
        .from('hanami_course_likes')
        .select('course_id')
        .eq('user_id', finalUserId)
        .in('course_id', courseIds);
      
      if (!userLikeError && userLikeData) {
        userLikes = userLikeData.map((like: any) => like.course_id).filter(Boolean);
      }
    }
    
    // 組裝結果
    courseIds.forEach(courseId => {
      result[courseId] = {
        likedByMe: userLikes.includes(courseId),
        totalLikes: likeCounts[courseId] || 0,
      };
    });
  } catch {
    // 發生錯誤時返回預設值
    courseIds.forEach(courseId => {
      result[courseId] = { likedByMe: false, totalLikes: 0 };
    });
  }
  
  return result;
}



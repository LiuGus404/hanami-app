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
  
  console.log('📋 getOrgLikeState', { orgId, userId: finalUserId ? '有' : '無' });
  
  // 使用舊系統的客戶端（hanami-ai-system）
  const oldSupabase = getSupabaseClient();
  
  // 獲取總 Like 數量
  let totalLikes = 0;
  try {
    const { count, error } = await oldSupabase
      .from('hanami_org_likes')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);
    
    if (error) {
      console.error('❌ 獲取 Like 數量失敗:', error);
      throw error;
    }
    totalLikes = count ?? 0;
    console.log('📊 Like 總數:', totalLikes);
  } catch (error) {
    console.warn('⚠️ 獲取 Like 數量時發生錯誤，使用預設值 0:', error);
    totalLikes = 0;
  }
  
  if (!finalUserId) {
    console.log('👤 用戶未登入，返回預設狀態');
    return { likedByMe: false, totalLikes };
  }
  
  // 檢查當前用戶是否已 like
  try {
    const { data, error } = await oldSupabase
      .from('hanami_org_likes')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', finalUserId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ 檢查用戶 Like 狀態失敗:', error);
      throw error;
    }
    
    const likedByMe = !!data;
    console.log('❤️ 用戶 Like 狀態:', likedByMe);
    return { likedByMe, totalLikes };
  } catch (error) {
    console.warn('⚠️ 檢查用戶 Like 狀態時發生錯誤，返回預設狀態:', error);
    return { likedByMe: false, totalLikes };
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
  
  // 使用舊系統的客戶端（hanami-ai-system）
  const oldSupabase = getSupabaseClient();
  
  // 檢查當前狀態（傳遞 userId 確保一致性）
  const current = await getOrgLikeState(orgId, finalUserId);
  console.log('📊 當前 Like 狀態:', current);
  
  try {
    if (current.likedByMe) {
      // 移除 Like
      console.log('🗑️ 移除 Like');
      const { data, error } = await oldSupabase
        .from('hanami_org_likes')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', finalUserId)
        .select();
      
      console.log('🗑️ 刪除結果:', { data, error });
      
      if (error) {
        console.error('❌ 刪除 Like 失敗:', error);
        throw error;
      }
      
      const newState = { likedByMe: false, totalLikes: Math.max(0, current.totalLikes - 1) };
      console.log('✅ 移除 Like 成功:', newState);
      return newState;
    } else {
      // 添加 Like
      console.log('➕ 添加 Like');
      const { data, error } = await oldSupabase
        .from('hanami_org_likes')
        .insert({ org_id: orgId, user_id: finalUserId })
        .select();
      
      console.log('➕ 插入結果:', { data, error });
      
      if (error) {
        console.error('❌ 插入 Like 失敗:', error);
        // 如果是唯一約束錯誤，表示已經存在，重新獲取狀態
        if (error.code === '23505') {
          console.warn('⚠️ 唯一約束錯誤，重新獲取狀態');
          return await getOrgLikeState(orgId, finalUserId);
        }
        throw error;
      }
      
      const newState = { likedByMe: true, totalLikes: current.totalLikes + 1 };
      console.log('✅ 添加 Like 成功:', newState);
      return newState;
    }
  } catch (e) {
    console.error('❌ toggleOrgLike 發生錯誤:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ 錯誤詳情:', {
      message: errorMessage,
      orgId,
      userId: finalUserId,
      currentState: current
    });
    // 重新拋出錯誤，讓上層處理
    throw e;
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
  
  console.log('📋 getCourseLikeState', { courseId, userId: finalUserId ? '有' : '無' });
  
  // 使用舊系統的客戶端（hanami-ai-system）
  const oldSupabase = getSupabaseClient();
  
  // 獲取總 Like 數量
  let totalLikes = 0;
  try {
    const { count, error } = await oldSupabase
      .from('hanami_course_likes')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    if (error) {
      console.error('❌ 獲取 Like 數量失敗:', error);
      throw error;
    }
    totalLikes = count ?? 0;
    console.log('📊 Like 總數:', totalLikes);
  } catch (error) {
    console.warn('⚠️ 獲取 Like 數量時發生錯誤，使用預設值 0:', error);
    totalLikes = 0;
  }
  
  if (!finalUserId) {
    console.log('👤 用戶未登入，返回預設狀態');
    return { likedByMe: false, totalLikes };
  }
  
  // 檢查當前用戶是否已 like
  try {
    const { data, error } = await oldSupabase
      .from('hanami_course_likes')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', finalUserId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ 檢查用戶 Like 狀態失敗:', error);
      throw error;
    }
    
    const likedByMe = !!data;
    console.log('❤️ 用戶 Like 狀態:', likedByMe);
    return { likedByMe, totalLikes };
  } catch (error) {
    console.warn('⚠️ 檢查用戶 Like 狀態時發生錯誤，返回預設狀態:', error);
    return { likedByMe: false, totalLikes };
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
  
  // 使用舊系統的客戶端（hanami-ai-system）
  const oldSupabase = getSupabaseClient();
  
  // 檢查當前狀態（傳遞 userId 確保一致性）
  const current = await getCourseLikeState(courseId, finalUserId);
  console.log('📊 當前 Like 狀態:', current);
  
  try {
    if (current.likedByMe) {
      // 移除 Like
      console.log('🗑️ 移除 Like');
      const { data, error } = await oldSupabase
        .from('hanami_course_likes')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', finalUserId)
        .select();
      
      console.log('🗑️ 刪除結果:', { data, error });
      
      if (error) {
        console.error('❌ 刪除 Like 失敗:', error);
        throw error;
      }
      
      const newState = { likedByMe: false, totalLikes: Math.max(0, current.totalLikes - 1) };
      console.log('✅ 移除 Like 成功:', newState);
      return newState;
    } else {
      // 添加 Like
      console.log('➕ 添加 Like');
      const { data, error } = await oldSupabase
        .from('hanami_course_likes')
        .insert({ course_id: courseId, user_id: finalUserId })
        .select();
      
      console.log('➕ 插入結果:', { data, error });
      
      if (error) {
        console.error('❌ 插入 Like 失敗:', error);
        // 如果是唯一約束錯誤，表示已經存在，重新獲取狀態
        if (error.code === '23505') {
          console.warn('⚠️ 唯一約束錯誤，重新獲取狀態');
          return await getCourseLikeState(courseId, finalUserId);
        }
        throw error;
      }
      
      const newState = { likedByMe: true, totalLikes: current.totalLikes + 1 };
      console.log('✅ 添加 Like 成功:', newState);
      return newState;
    }
  } catch (e) {
    console.error('❌ toggleCourseLike 發生錯誤:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ 錯誤詳情:', {
      message: errorMessage,
      courseId,
      userId: finalUserId,
      currentState: current
    });
    // 重新拋出錯誤，讓上層處理
    throw e;
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



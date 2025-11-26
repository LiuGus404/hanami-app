import { getSupabaseClient } from '@/lib/supabase';

export interface OrgReview {
  id: string;
  userId: string;
  userName: string | null;
  content: string;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

export interface CreateReviewInput {
  content: string;
  rating?: number | null;
}

/**
 * 獲取用戶 ID（從 saas 系統）
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saasSession = localStorage.getItem('saas_user_session');
    if (saasSession) {
      const sessionData = JSON.parse(saasSession);
      if (sessionData?.user?.id) {
        return sessionData.user.id;
      }
    }
  } catch (e) {
    // 忽略解析錯誤
  }
  
  return null;
}

/**
 * 獲取用戶名稱（從 saas 系統）
 */
function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saasSession = localStorage.getItem('saas_user_session');
    if (saasSession) {
      const sessionData = JSON.parse(saasSession);
      if (sessionData?.user) {
        // 優先使用 full_name，其次使用 email 的前綴
        return sessionData.user.full_name || 
               sessionData.user.name || 
               (sessionData.user.email ? sessionData.user.email.split('@')[0] : null) ||
               '匿名用戶';
      }
    }
  } catch (e) {
    // 忽略解析錯誤
  }
  
  return null;
}

/**
 * 獲取機構評論列表
 * @param orgId 機構 ID
 * @param limit 每頁數量，預設 10
 * @param offset 偏移量，預設 0
 * @returns 評論列表
 */
export async function getOrgReviews(
  orgId: string,
  limit: number = 10,
  offset: number = 0
): Promise<OrgReview[]> {
  console.log('📋 getOrgReviews', { orgId, limit, offset });
  
  try {
    // 使用 API 端點獲取評論列表（繞過 RLS）
    const userId = getUserId(); // 可選，用於獲取用戶自己的評論
    const url = `/api/organizations/review?orgId=${encodeURIComponent(orgId)}&limit=${limit}&offset=${offset}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `獲取評論列表 API 回傳 ${response.status}`;
      console.error('❌ 獲取評論列表失敗:', message);
      throw new Error(message);
    }

    const result = await response.json();
    if (result.success && result.data) {
      const reviews: OrgReview[] = result.data.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName || '匿名用戶',
        content: r.content,
        rating: r.rating,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      
      console.log('✅ 獲取評論列表成功:', reviews.length, '條');
      return reviews;
    } else {
      throw new Error('API 返回格式錯誤');
    }
  } catch (error) {
    console.error('❌ getOrgReviews 發生錯誤:', error);
    // 返回空數組而不是拋出錯誤，避免影響 UI
    return [];
  }
}

/**
 * 獲取機構評論統計
 * @param orgId 機構 ID
 * @returns 評論統計資訊
 */
export async function getOrgReviewStats(orgId: string): Promise<OrgReviewStats | null> {
  console.log('📊 getOrgReviewStats', { orgId });
  
  const oldSupabase = getSupabaseClient();
  
  try {
    // 查詢評論統計視圖
    const { data, error } = await oldSupabase
      .from('hanami_org_review_stats')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ 獲取評論統計失敗:', error);
      throw error;
    }
    
    if (!data) {
      // 如果沒有評論，返回預設值
      return {
        totalReviews: 0,
        averageRating: 0,
        fiveStarCount: 0,
        fourStarCount: 0,
        threeStarCount: 0,
        twoStarCount: 0,
        oneStarCount: 0,
      };
    }
    
    const typedData = data as { total_reviews?: number | null; average_rating?: number | null; five_star_count?: number | null; four_star_count?: number | null; three_star_count?: number | null; two_star_count?: number | null; one_star_count?: number | null; [key: string]: any; };
    const stats: OrgReviewStats = {
      totalReviews: Number(typedData.total_reviews) || 0,
      averageRating: Number(typedData.average_rating) || 0,
      fiveStarCount: Number(typedData.five_star_count) || 0,
      fourStarCount: Number(typedData.four_star_count) || 0,
      threeStarCount: Number(typedData.three_star_count) || 0,
      twoStarCount: Number(typedData.two_star_count) || 0,
      oneStarCount: Number(typedData.one_star_count) || 0,
    };
    
    console.log('✅ 獲取評論統計成功:', stats);
    return stats;
  } catch (error) {
    console.error('❌ getOrgReviewStats 發生錯誤:', error);
    return null;
  }
}

/**
 * 獲取當前用戶對機構的評論（包括已刪除的，用於檢查唯一約束）
 * @param orgId 機構 ID
 * @param userId 可選的用戶 ID，如果不提供則嘗試從會話獲取
 * @param includeDeleted 是否包含已刪除的評論，預設 false
 * @returns 用戶的評論，如果沒有則返回 null
 */
export async function getUserOrgReview(
  orgId: string,
  userId?: string,
  includeDeleted: boolean = false
): Promise<OrgReview | null> {
  const finalUserId = userId || getUserId();
  
  if (!finalUserId) {
    console.log('👤 用戶未登入，無法獲取評論');
    return null;
  }
  
  console.log('📋 getUserOrgReview', { orgId, userId: finalUserId, includeDeleted });
  
  // 如果不需要包含已刪除的評論，使用 API 端點（繞過 RLS）
  if (!includeDeleted) {
    try {
      const response = await fetch(
        `/api/organizations/review?orgId=${encodeURIComponent(orgId)}&userId=${encodeURIComponent(finalUserId)}&limit=1`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error || `獲取用戶評論 API 回傳 ${response.status}`;
        console.error('❌ 獲取用戶評論失敗:', message);
        // 如果 API 失敗，回退到直接查詢
      } else {
        const result = await response.json();
        if (result.success && result.userReview) {
          const review: OrgReview = {
            id: result.userReview.id,
            userId: result.userReview.userId,
            userName: result.userReview.userName || '匿名用戶',
            content: result.userReview.content,
            rating: result.userReview.rating,
            createdAt: result.userReview.createdAt,
            updatedAt: result.userReview.updatedAt,
          };
          console.log('✅ 獲取用戶評論成功');
          return review;
        } else {
          // 沒有用戶評論
          return null;
        }
      }
    } catch (error) {
      console.error('❌ getUserOrgReview API 調用失敗:', error);
      // 回退到直接查詢
    }
  }
  
  // 如果需要包含已刪除的評論，或 API 失敗，使用直接查詢
  const oldSupabase = getSupabaseClient();
  
  try {
    let query = oldSupabase
      .from('hanami_org_reviews')
      .select('id, user_id, user_name, content, rating, status, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('user_id', finalUserId);
    
    if (!includeDeleted) {
      query = query.eq('status', 'active');
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      console.error('❌ 獲取用戶評論失敗:', error);
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    const typedData = data as { id: string; user_id: string; user_name?: string | null; content: string; rating: number; created_at: string; updated_at: string; [key: string]: any; };
    const review: OrgReview = {
      id: typedData.id,
      userId: typedData.user_id,
      userName: typedData.user_name || '匿名用戶',
      content: typedData.content,
      rating: typedData.rating,
      createdAt: typedData.created_at,
      updatedAt: typedData.updated_at,
    };
    
    console.log('✅ 獲取用戶評論成功');
    return review;
  } catch (error) {
    console.error('❌ getUserOrgReview 發生錯誤:', error);
    return null;
  }
}

/**
 * 創建或更新機構評論
 * @param orgId 機構 ID
 * @param input 評論內容和評分
 * @param userId 可選的用戶 ID，如果不提供則嘗試從會話獲取
 * @returns 創建或更新後的評論
 * @throws 如果用戶未登入，拋出 'NOT_AUTHENTICATED' 錯誤
 */
export async function upsertOrgReview(
  orgId: string,
  input: CreateReviewInput,
  userId?: string
): Promise<OrgReview> {
  const finalUserId = userId || getUserId();
  const userName = getUserName();
  
  console.log('🔄 upsertOrgReview 開始', { orgId, userId: finalUserId ? '有' : '無', userName });
  
  if (!finalUserId) {
    console.error('❌ 用戶未認證');
    throw new Error('NOT_AUTHENTICATED');
  }
  
  if (!input.content || input.content.trim().length === 0) {
    throw new Error('評論內容不能為空');
  }
  
  if (input.content.trim().length > 2000) {
    throw new Error('評論內容不能超過 2000 個字元');
  }
  
  if (input.rating !== null && input.rating !== undefined) {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('評分必須在 1-5 之間');
    }
  }

  try {
    // 使用 API 端點創建或更新評論（繞過 RLS）
    const response = await fetch('/api/organizations/review', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        userId: finalUserId,
        userName: userName || '匿名用戶',
        content: input.content.trim(),
        rating: input.rating || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `評論 API 回傳 ${response.status}`;
      console.error('❌ 創建或更新評論失敗:', message);
      throw new Error(message);
    }

    const result = await response.json();
    if (result.success && result.data) {
      console.log(`✅ ${result.isUpdate ? '更新' : '創建'}評論成功`);
      return {
        id: result.data.id,
        userId: result.data.userId,
        userName: result.data.userName || '匿名用戶',
        content: result.data.content,
        rating: result.data.rating,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      };
    } else {
      throw new Error('API 返回格式錯誤');
    }
  } catch (e) {
    console.error('❌ upsertOrgReview 發生錯誤:', e);
    
    // 處理不同類型的錯誤
    if (e instanceof Error) {
      throw e; // 如果已經是 Error 對象，直接拋出
    } else {
      throw new Error(String(e) || '提交評論失敗，請稍後再試');
    }
  }
}

/**
 * 刪除機構評論
 * @param reviewId 評論 ID
 * @param userId 可選的用戶 ID，如果不提供則嘗試從會話獲取
 * @returns 是否刪除成功
 * @throws 如果用戶未登入或不是評論擁有者，拋出錯誤
 */
export async function deleteOrgReview(
  reviewId: string,
  userId?: string
): Promise<boolean> {
  const finalUserId = userId || getUserId();
  
  console.log('🗑️ deleteOrgReview 開始', { reviewId, userId: finalUserId ? '有' : '無' });
  
  if (!finalUserId) {
    console.error('❌ 用戶未認證');
    throw new Error('NOT_AUTHENTICATED');
  }

  try {
    // 使用 API 端點刪除評論（繞過 RLS）
    const response = await fetch(
      `/api/organizations/review?reviewId=${encodeURIComponent(reviewId)}&userId=${encodeURIComponent(finalUserId)}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || `刪除評論 API 回傳 ${response.status}`;
      console.error('❌ 刪除評論失敗:', message);
      throw new Error(message);
    }

    const result = await response.json();
    if (result.success) {
      console.log('✅ 刪除評論成功');
      return true;
    } else {
      throw new Error(result.error || '刪除評論失敗');
    }
  } catch (e) {
    console.error('❌ deleteOrgReview 發生錯誤:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(errorMessage);
  }
}


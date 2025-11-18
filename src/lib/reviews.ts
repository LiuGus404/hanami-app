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
  
  const oldSupabase = getSupabaseClient();
  
  try {
    const { data, error } = await oldSupabase
      .from('hanami_org_reviews')
      .select('id, user_id, user_name, content, rating, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ 獲取評論列表失敗:', error);
      throw error;
    }
    
    const reviews: OrgReview[] = (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || '匿名用戶',
      content: r.content,
      rating: r.rating,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    
    console.log('✅ 獲取評論列表成功:', reviews.length, '條');
    return reviews;
  } catch (error) {
    console.error('❌ getOrgReviews 發生錯誤:', error);
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
    
    const stats: OrgReviewStats = {
      totalReviews: Number(data.total_reviews) || 0,
      averageRating: Number(data.average_rating) || 0,
      fiveStarCount: Number(data.five_star_count) || 0,
      fourStarCount: Number(data.four_star_count) || 0,
      threeStarCount: Number(data.three_star_count) || 0,
      twoStarCount: Number(data.two_star_count) || 0,
      oneStarCount: Number(data.one_star_count) || 0,
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
    
    const review: OrgReview = {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name || '匿名用戶',
      content: data.content,
      rating: data.rating,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
  
  const oldSupabase = getSupabaseClient();
  
  try {
    // 檢查是否已存在評論
    const existingReview = await getUserOrgReview(orgId, finalUserId);
    
    if (existingReview) {
      // 更新現有評論
      console.log('📝 更新現有評論');
      const { data, error } = await oldSupabase
        .from('hanami_org_reviews')
        .update({
          user_name: userName || '匿名用戶',
          content: input.content.trim(),
          rating: input.rating || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReview.id)
        .eq('user_id', finalUserId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 更新評論失敗:', error);
        throw error;
      }
      
      const review: OrgReview = {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name || '匿名用戶',
        content: data.content,
        rating: data.rating,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      console.log('✅ 更新評論成功');
      return review;
    } else {
      // 創建新評論
      console.log('➕ 創建新評論');
      const { data, error } = await oldSupabase
        .from('hanami_org_reviews')
        .insert({
          org_id: orgId,
          user_id: finalUserId,
          user_name: userName || '匿名用戶',
          content: input.content.trim(),
          rating: input.rating || null,
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ 創建評論失敗:', error);
        // 如果是唯一約束錯誤，表示已經存在（可能是已刪除的評論），嘗試更新而不是創建
        if (error.code === '23505') {
          console.warn('⚠️ 唯一約束錯誤，嘗試更新現有評論（包括已刪除的）');
          try {
            // 重新查詢現有評論（包括已刪除的）
            const existingReview = await getUserOrgReview(orgId, finalUserId, true);
            if (existingReview) {
              // 更新現有評論（恢復為 active 狀態）
              const { data: updateData, error: updateError } = await oldSupabase
                .from('hanami_org_reviews')
                .update({
                  user_name: userName || '匿名用戶',
                  content: input.content.trim(),
                  rating: input.rating || null,
                  status: 'active', // 恢復為 active
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingReview.id)
                .eq('user_id', finalUserId)
                .select()
                .single();
              
              if (updateError) {
                console.error('❌ 更新評論失敗:', updateError);
                throw updateError;
              }
              
              const review: OrgReview = {
                id: updateData.id,
                userId: updateData.user_id,
                userName: updateData.user_name || '匿名用戶',
                content: updateData.content,
                rating: updateData.rating,
                createdAt: updateData.created_at,
                updatedAt: updateData.updated_at,
              };
              
              console.log('✅ 更新評論成功（從唯一約束錯誤恢復）');
              return review;
            } else {
              // 如果查詢不到，可能是並發問題，稍等後重試一次
              console.warn('⚠️ 查詢不到現有評論，可能是並發問題');
              await new Promise(resolve => setTimeout(resolve, 100));
              const retryReview = await getUserOrgReview(orgId, finalUserId, true);
              if (retryReview) {
                // 再次嘗試更新
                const { data: retryData, error: retryError } = await oldSupabase
                  .from('hanami_org_reviews')
                  .update({
                    user_name: userName || '匿名用戶',
                    content: input.content.trim(),
                    rating: input.rating || null,
                    status: 'active',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', retryReview.id)
                  .eq('user_id', finalUserId)
                  .select()
                  .single();
                
                if (!retryError && retryData) {
                  const review: OrgReview = {
                    id: retryData.id,
                    userId: retryData.user_id,
                    userName: retryData.user_name || '匿名用戶',
                    content: retryData.content,
                    rating: retryData.rating,
                    createdAt: retryData.created_at,
                    updatedAt: retryData.updated_at,
                  };
                  console.log('✅ 重試更新評論成功');
                  return review;
                }
              }
            }
          } catch (updateErr) {
            console.error('❌ 處理唯一約束錯誤時失敗:', updateErr);
            // 繼續拋出原始錯誤
          }
        }
        // 將 Supabase 錯誤轉換為可讀的錯誤信息
        const errorMessage = error.message || error.details || '創建評論失敗，請稍後再試';
        throw new Error(errorMessage);
      }
      
      const review: OrgReview = {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name || '匿名用戶',
        content: data.content,
        rating: data.rating,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      console.log('✅ 創建評論成功');
      return review;
    }
  } catch (e) {
    console.error('❌ upsertOrgReview 發生錯誤:', e);
    
    // 處理不同類型的錯誤
    if (e instanceof Error) {
      throw e; // 如果已經是 Error 對象，直接拋出
    } else if (typeof e === 'object' && e !== null) {
      // 處理 Supabase 錯誤對象
      const supabaseError = e as any;
      const errorMessage = supabaseError.message || 
                          supabaseError.details || 
                          supabaseError.hint ||
                          '提交評論失敗，請稍後再試';
      throw new Error(errorMessage);
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
  
  const oldSupabase = getSupabaseClient();
  
  try {
    const { data, error } = await oldSupabase
      .from('hanami_org_reviews')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', finalUserId)
      .select();
    
    if (error) {
      console.error('❌ 刪除評論失敗:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('找不到評論或無權限刪除');
    }
    
    console.log('✅ 刪除評論成功');
    return true;
  } catch (e) {
    console.error('❌ deleteOrgReview 發生錯誤:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(errorMessage);
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('API /api/organizations/review requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * GET /api/organizations/review
 * 獲取機構評論列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（必需）
 * - limit: 每頁數量（可選，默認為 10）
 * - offset: 偏移量（可選，默認為 0）
 * - userId: 用戶 ID（可選，用於獲取用戶自己的評論）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const userId = searchParams.get('userId');

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少必要參數：orgId' },
        { status: 400 }
      );
    }

    // 獲取評論列表
    const { data: reviews, error: reviewsError } = await supabase
      .from('hanami_org_reviews')
      .select('id, user_id, user_name, content, rating, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('hanami_org_reviews 查詢失敗:', reviewsError);
      throw reviewsError;
    }

    // 獲取用戶自己的評論（如果提供了 userId）
    let userReview = null;
    if (userId) {
      const { data: userReviewData, error: userReviewError } = await supabase
        .from('hanami_org_reviews')
        .select('id, user_id, user_name, content, rating, created_at, updated_at')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!userReviewError && userReviewData) {
        userReview = {
          id: userReviewData.id,
          userId: userReviewData.user_id,
          userName: userReviewData.user_name || '匿名用戶',
          content: userReviewData.content,
          rating: userReviewData.rating,
          createdAt: userReviewData.created_at,
          updatedAt: userReviewData.updated_at,
        };
      }
    }

    const reviewsList = (reviews || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || '匿名用戶',
      content: r.content,
      rating: r.rating,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: reviewsList,
      userReview,
      count: reviewsList.length,
    });
  } catch (error: any) {
    console.error('API /api/organizations/review GET 失敗:', error);
    return NextResponse.json(
      {
        error: error?.message || '獲取評論列表失敗',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/review
 * 創建或更新機構評論（使用服務角色 key 繞過 RLS）
 * 
 * 請求體：
 * - orgId: 機構 ID（必需）
 * - userId: 用戶 ID（必需）
 * - userName: 用戶名稱（必需）
 * - content: 評論內容（必需）
 * - rating: 評分（可選，1-5）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, userId, userName, content, rating } = body || {};

    if (!orgId || !userId || !userName || !content) {
      return NextResponse.json(
        { error: '缺少必要參數：orgId, userId, userName, content' },
        { status: 400 }
      );
    }

    // 驗證內容長度
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: '評論內容不能為空' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: '評論內容不能超過 2000 個字元' },
        { status: 400 }
      );
    }

    // 驗證評分
    if (rating !== null && rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: '評分必須在 1-5 之間' },
          { status: 400 }
        );
      }
    }

    // 檢查是否已存在評論（包括已刪除的）
    const { data: existing, error: existingError } = await supabase
      .from('hanami_org_reviews')
      .select('id, status')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.error('hanami_org_reviews 查詢失敗:', existingError);
      throw existingError;
    }

    let reviewData;
    let isUpdate = false;

    if (existing?.id) {
      // 更新現有評論（包括恢復已刪除的評論）
      isUpdate = true;
      const { data, error: updateError } = await supabase
        .from('hanami_org_reviews')
        .update({
          user_name: userName,
          content: trimmedContent,
          rating: rating || null,
          status: 'active', // 恢復為 active（如果是已刪除的）
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('hanami_org_reviews 更新失敗:', updateError);
        throw updateError;
      }

      reviewData = data;
    } else {
      // 創建新評論
      const { data, error: insertError } = await supabase
        .from('hanami_org_reviews')
        .insert({
          org_id: orgId,
          user_id: userId,
          user_name: userName,
          content: trimmedContent,
          rating: rating || null,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        console.error('hanami_org_reviews 插入失敗:', insertError);
        // 如果是唯一約束錯誤，可能是並發問題，嘗試更新
        if (insertError.code === '23505') {
          console.warn('⚠️ 唯一約束錯誤，嘗試更新現有評論');
          const { data: retryData, error: retryError } = await supabase
            .from('hanami_org_reviews')
            .update({
              user_name: userName,
              content: trimmedContent,
              rating: rating || null,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .select()
            .single();

          if (retryError) {
            console.error('hanami_org_reviews 重試更新失敗:', retryError);
            throw retryError;
          }

          reviewData = retryData;
          isUpdate = true;
        } else {
          throw insertError;
        }
      } else {
        reviewData = data;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: reviewData.id,
        userId: reviewData.user_id,
        userName: reviewData.user_name || '匿名用戶',
        content: reviewData.content,
        rating: reviewData.rating,
        createdAt: reviewData.created_at,
        updatedAt: reviewData.updated_at,
      },
      isUpdate,
    });
  } catch (error: any) {
    console.error('API /api/organizations/review 失敗:', error);
    return NextResponse.json(
      {
        error: error?.message || '創建或更新評論失敗',
        details: error?.details || '',
        hint: error?.hint || '',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/review
 * 刪除機構評論（軟刪除）
 * 
 * 查詢參數：
 * - reviewId: 評論 ID（必需）
 * - userId: 用戶 ID（必需，用於驗證權限）
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const userId = searchParams.get('userId');

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: '缺少必要參數：reviewId, userId' },
        { status: 400 }
      );
    }

    // 檢查評論是否存在且屬於該用戶
    const { data: existing, error: checkError } = await supabase
      .from('hanami_org_reviews')
      .select('id, user_id')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('hanami_org_reviews 查詢失敗:', checkError);
      throw checkError;
    }

    if (!existing) {
      return NextResponse.json(
        { error: '找不到評論或無權限刪除' },
        { status: 404 }
      );
    }

    // 軟刪除評論
    const { error: deleteError } = await supabase
      .from('hanami_org_reviews')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('hanami_org_reviews 刪除失敗:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: '評論已刪除',
    });
  } catch (error: any) {
    console.error('API /api/organizations/review DELETE 失敗:', error);
    return NextResponse.json(
      {
        error: error?.message || '刪除評論失敗',
      },
      { status: 500 }
    );
  }
}


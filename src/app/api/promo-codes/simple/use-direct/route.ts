import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient } from '@/lib/supabase';
import { SimplePromoCodeUsageRequest, SimplePromoCodeUsageResponse } from '@/types/simple-promo-codes';

// 直接記錄優惠碼使用（不依賴資料庫函數）
export async function POST(request: NextRequest) {
  try {
    const body: SimplePromoCodeUsageRequest = await request.json();

    // 驗證必需欄位
    if (!body.promo_code_id || body.order_amount <= 0 || body.discount_amount < 0) {
      return NextResponse.json(
        { success: false, error: '缺少必需欄位或數據無效' },
        { status: 400 }
      );
    }

    console.log('📝 直接記錄優惠碼使用:', {
      promo_code_id: body.promo_code_id,
      order_amount: body.order_amount,
      discount_amount: body.discount_amount,
      user_id: body.user_id,
      user_email: body.user_email
    });

    // 使用 SaaS Supabase 客戶端
    const supabase = getSaasServerSupabaseClient();

    // 嘗試更新 hanami_promo_codes
    try {
      // 先獲取當前資料
      const { data: currentData, error: fetchError } = await ((supabase as any)
        .from('hanami_promo_codes')
        .select('used_count, used_by_user_ids, used_by_emails')
        .eq('id', body.promo_code_id)
        .single());

      if (fetchError || !currentData) {
        console.log('❌ 無法獲取當前優惠碼資料:', fetchError);
        throw new Error('無法獲取優惠碼資料');
      }

      // 準備更新資料
      const current = currentData as any;
      const updateData: any = {
        used_count: (current.used_count || 0) + 1,
        updated_at: new Date().toISOString()
      };

      if (body.user_id) {
        updateData.used_by_user_ids = [
          ...(current.used_by_user_ids || []),
          body.user_id
        ];
      }

      if (body.user_email) {
        updateData.used_by_emails = [
          ...(current.used_by_emails || []),
          body.user_email
        ];
      }

      const { data, error } = await (supabase as any)
        .from('hanami_promo_codes')
        .update(updateData)
        .eq('id', body.promo_code_id)
        .select()
        .single();

      if (!error && data) {
        console.log('✅ 優惠碼使用記錄成功 (hanami_promo_codes):', data);
        return NextResponse.json({
          success: true,
          data: { used: true }
        });
      }
    } catch (e) {
      console.log('❌ hanami_promo_codes 更新失敗:', e);
    }

    // 嘗試更新 saas_coupons
    try {
      // 先獲取當前資料
      const { data: currentData, error: fetchError } = await ((supabase as any)
        .from('saas_coupons')
        .select('usage_count, used_by_user_ids, used_by_emails')
        .eq('id', body.promo_code_id)
        .single());

      if (fetchError || !currentData) {
        console.log('❌ 無法獲取當前優惠券資料:', fetchError);
        throw new Error('無法獲取優惠券資料');
      }

      // 準備更新資料
      const current = currentData as any;
      const updateData: any = {
        usage_count: (current.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      };

      if (body.user_id) {
        updateData.used_by_user_ids = [
          ...(current.used_by_user_ids || []),
          body.user_id
        ];
      }

      if (body.user_email) {
        updateData.used_by_emails = [
          ...(current.used_by_emails || []),
          body.user_email
        ];
      }

      const { data, error } = await (supabase as any)
        .from('saas_coupons')
        .update(updateData)
        .eq('id', body.promo_code_id)
        .select()
        .single();

      if (!error && data) {
        console.log('✅ 優惠碼使用記錄成功 (saas_coupons):', data);
        return NextResponse.json({
          success: true,
          data: { used: true }
        });
      }
    } catch (e) {
      console.log('❌ saas_coupons 更新失敗:', e);
    }

    console.log('❌ 無法記錄優惠碼使用');
    return NextResponse.json(
      { success: false, error: '無法記錄優惠碼使用' },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ 直接記錄優惠碼使用錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient } from '@/lib/supabase';
import { SimplePromoCodeValidationRequest, SimplePromoCodeValidationResponse } from '@/types/simple-promo-codes';

// 直接驗證優惠碼（不依賴資料庫函數）
export async function POST(request: NextRequest) {
  try {
    const body: SimplePromoCodeValidationRequest = await request.json();

    // 驗證必需欄位
    if (!body.code || body.order_amount <= 0) {
      return NextResponse.json(
        { success: false, error: '缺少必需欄位：優惠碼或訂單金額' },
        { status: 400 }
      );
    }

    console.log('🔍 直接驗證優惠碼:', {
      code: body.code,
      order_amount: body.order_amount,
      user_id: body.user_id,
      user_email: body.user_email
    });

    // 使用 SaaS Supabase 客戶端
    const supabase = getSaasServerSupabaseClient();

    // 檢查表格並查詢優惠碼
    let promoCode = null;
    let tableName = '';

    // 嘗試從 hanami_promo_codes 查詢
    try {
      const { data, error } = await supabase
        .from('hanami_promo_codes')
        .select('*')
        .eq('code', body.code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!error && data) {
        promoCode = data;
        tableName = 'hanami_promo_codes';
        console.log('✅ 從 hanami_promo_codes 找到優惠碼');
      }
    } catch (e) {
      console.log('❌ hanami_promo_codes 查詢失敗:', e);
    }

    // 如果沒找到，嘗試從 saas_coupons 查詢
    if (!promoCode) {
      try {
        const { data, error } = await supabase
          .from('saas_coupons')
          .select('*')
          .eq('coupon_code', body.code.toUpperCase())
          .eq('is_active', true)
          .single();

        if (!error && data) {
          // 轉換欄位名稱以符合統一格式
          const couponData = data as any;
          promoCode = {
            id: couponData.id,
            code: couponData.coupon_code,
            name: couponData.coupon_name,
            description: couponData.description,
            institution_name: couponData.institution_name,
            institution_code: couponData.institution_code,
            total_usage_limit: couponData.usage_limit,
            used_count: couponData.usage_count,
            used_by_user_ids: couponData.used_by_user_ids || [],
            used_by_emails: couponData.used_by_emails || [],
            discount_type: couponData.discount_type,
            discount_value: couponData.discount_value,
            max_discount_amount: null, // saas_coupons 沒有這個欄位
            valid_from: couponData.valid_from,
            valid_until: couponData.valid_until,
            is_active: couponData.is_active,
            notes: couponData.notes,
            created_at: couponData.created_at,
            updated_at: couponData.updated_at
          };
          tableName = 'saas_coupons';
          console.log('✅ 從 saas_coupons 找到優惠碼:', couponData.coupon_code);
        }
      } catch (e) {
        console.log('❌ saas_coupons 查詢失敗:', e);
      }
    }

    // 如果沒找到優惠碼
    if (!promoCode) {
      console.log('❌ 優惠碼不存在');
      return NextResponse.json({
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          final_amount: body.order_amount,
          error_message: '優惠碼不存在'
        }
      });
    }

    // 驗證有效期
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      console.log('❌ 優惠碼尚未生效');
      return NextResponse.json({
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          final_amount: body.order_amount,
          error_message: '優惠碼尚未生效'
        }
      });
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      console.log('❌ 優惠碼已過期');
      return NextResponse.json({
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          final_amount: body.order_amount,
          error_message: '優惠碼已過期'
        }
      });
    }

    // 驗證使用次數限制
    if (promoCode.total_usage_limit > 0 && promoCode.used_count >= promoCode.total_usage_limit) {
      console.log('❌ 優惠碼使用次數已達上限');
      return NextResponse.json({
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          final_amount: body.order_amount,
          error_message: '優惠碼使用次數已達上限'
        }
      });
    }

    // 驗證用戶是否已使用過
    if (body.user_id && promoCode.used_by_user_ids && promoCode.used_by_user_ids.includes(body.user_id)) {
      console.log('❌ 用戶已使用過此優惠碼');
      return NextResponse.json({
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          final_amount: body.order_amount,
          error_message: '您已使用過此優惠碼'
        }
      });
    }

    if (body.user_email && promoCode.used_by_emails && promoCode.used_by_emails.includes(body.user_email)) {
      console.log('❌ 用戶郵箱已使用過此優惠碼');
      return NextResponse.json({
        success: true,
        data: {
          is_valid: false,
          discount_amount: 0,
          final_amount: body.order_amount,
          error_message: '您已使用過此優惠碼'
        }
      });
    }

    // 計算折扣金額
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = body.order_amount * (promoCode.discount_value / 100);
      // 檢查最大折扣限制
      if (promoCode.max_discount_amount && promoCode.max_discount_amount > 0 && discountAmount > promoCode.max_discount_amount) {
        discountAmount = promoCode.max_discount_amount;
      }
    } else {
      discountAmount = promoCode.discount_value;
    }

    // 確保折扣不超過訂單金額
    if (discountAmount > body.order_amount) {
      discountAmount = body.order_amount;
    }

    const finalAmount = body.order_amount - discountAmount;

    console.log('✅ 優惠碼驗證成功:', {
      promo_code: promoCode.code,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      table_name: tableName
    });

    const response: SimplePromoCodeValidationResponse = {
      success: true,
      data: {
        is_valid: true,
        promo_code_id: promoCode.id,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        error_message: '驗證成功',
        institution_name: promoCode.institution_name || '系統'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 直接驗證優惠碼錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

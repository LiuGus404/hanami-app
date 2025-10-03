import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PromoCodeValidationRequest, PromoCodeValidationResponse } from '@/types/promo-codes';

// 使用 SaaS 系統的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 驗證優惠碼
export async function POST(request: NextRequest) {
  try {
    const body: PromoCodeValidationRequest = await request.json();

    // 驗證必需欄位
    if (!body.code || body.order_amount <= 0) {
      return NextResponse.json(
        { success: false, error: '缺少必需欄位：優惠碼或訂單金額' },
        { status: 400 }
      );
    }

    console.log('🔍 驗證優惠碼:', {
      code: body.code,
      order_amount: body.order_amount,
      course_type: body.course_type,
      user_id: body.user_id
    });

    // 調用資料庫函數驗證優惠碼
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: body.code.toUpperCase(),
      p_user_id: body.user_id || null,
      p_user_email: body.user_email || null,
      p_order_amount: body.order_amount,
      p_course_type: body.course_type || null
    });

    if (error) {
      console.error('❌ 優惠碼驗證錯誤:', error);
      return NextResponse.json(
        { success: false, error: '優惠碼驗證失敗' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
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

    const result = data[0];
    
    console.log('✅ 優惠碼驗證結果:', result);

    const response: PromoCodeValidationResponse = {
      success: true,
      data: {
        is_valid: result.is_valid,
        promo_code_id: result.promo_code_id,
        discount_amount: parseFloat(result.discount_amount),
        final_amount: parseFloat(result.final_amount),
        error_message: result.error_message
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 優惠碼驗證 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

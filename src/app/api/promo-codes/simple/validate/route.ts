import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SimplePromoCodeValidationRequest, SimplePromoCodeValidationResponse } from '@/types/simple-promo-codes';

// 驗證簡化版優惠碼
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

    console.log('🔍 驗證簡化版優惠碼:', {
      code: body.code,
      order_amount: body.order_amount,
      user_id: body.user_id,
      user_email: body.user_email
    });

    // 調用統一資料庫函數驗證優惠碼
    const { data, error } = await supabase.rpc('validate_promo_code_unified', {
      p_code: body.code.toUpperCase(),
      p_user_id: body.user_id || null,
      p_user_email: body.user_email || null,
      p_order_amount: body.order_amount
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
    
    console.log('✅ 簡化版優惠碼驗證結果:', result);

    const response: SimplePromoCodeValidationResponse = {
      success: true,
      data: {
        is_valid: result.is_valid,
        promo_code_id: result.promo_code_id,
        discount_amount: parseFloat(result.discount_amount),
        final_amount: parseFloat(result.final_amount),
        error_message: result.error_message,
        institution_name: result.institution_name
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 簡化版優惠碼驗證 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

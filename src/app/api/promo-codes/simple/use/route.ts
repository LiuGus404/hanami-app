import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SimplePromoCodeUsageRequest, SimplePromoCodeUsageResponse } from '@/types/simple-promo-codes';

// 記錄簡化版優惠碼使用
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

    console.log('📝 記錄簡化版優惠碼使用:', {
      promo_code_id: body.promo_code_id,
      order_amount: body.order_amount,
      discount_amount: body.discount_amount,
      user_id: body.user_id,
      user_email: body.user_email
    });

    // 調用統一資料庫函數記錄使用
    const { data, error } = await (supabase.rpc as any)('use_promo_code_unified', {
      p_promo_code_id: body.promo_code_id,
      p_user_id: body.user_id || null,
      p_user_email: body.user_email || null,
      p_order_amount: body.order_amount,
      p_discount_amount: body.discount_amount
    });

    if (error) {
      console.error('❌ 記錄優惠碼使用錯誤:', error);
      return NextResponse.json(
        { success: false, error: '記錄優惠碼使用失敗' },
        { status: 500 }
      );
    }

    console.log('✅ 簡化版優惠碼使用記錄成功:', data);

    const response: SimplePromoCodeUsageResponse = {
      success: true,
      data: {
        used: data || false
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 記錄簡化版優惠碼使用 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

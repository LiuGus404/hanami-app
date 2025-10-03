import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PromoCodeUsageRequest, PromoCodeUsageResponse } from '@/types/promo-codes';

// 使用 SaaS 系統的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 記錄優惠碼使用
export async function POST(request: NextRequest) {
  try {
    const body: PromoCodeUsageRequest = await request.json();

    // 驗證必需欄位
    if (!body.promo_code_id || body.original_amount <= 0 || body.discount_amount < 0) {
      return NextResponse.json(
        { success: false, error: '缺少必需欄位或數據無效' },
        { status: 400 }
      );
    }

    console.log('📝 記錄優惠碼使用:', {
      promo_code_id: body.promo_code_id,
      original_amount: body.original_amount,
      discount_amount: body.discount_amount,
      final_amount: body.final_amount,
      user_id: body.user_id
    });

    // 調用資料庫函數記錄使用
    const { data, error } = await supabase.rpc('record_promo_code_usage', {
      p_promo_code_id: body.promo_code_id,
      p_user_id: body.user_id || null,
      p_user_email: body.user_email || null,
      p_order_id: body.order_id || null,
      p_original_amount: body.original_amount,
      p_discount_amount: body.discount_amount,
      p_final_amount: body.final_amount,
      p_metadata: body.metadata || null
    });

    if (error) {
      console.error('❌ 記錄優惠碼使用錯誤:', error);
      return NextResponse.json(
        { success: false, error: '記錄優惠碼使用失敗' },
        { status: 500 }
      );
    }

    console.log('✅ 優惠碼使用記錄成功:', data);

    const response: PromoCodeUsageResponse = {
      success: true,
      data: {
        usage_id: data
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 記錄優惠碼使用 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

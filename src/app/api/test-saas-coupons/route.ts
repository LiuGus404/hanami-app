import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 測試 saas_coupons 表格查詢...');

    // 查詢所有優惠碼
    const { data: allCoupons, error: allError } = await supabase
      .from('saas_coupons')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ 查詢所有優惠碼錯誤:', allError);
      return NextResponse.json({
        success: false,
        error: '查詢所有優惠碼失敗',
        details: allError
      }, { status: 500 });
    }

    console.log('✅ 查詢到優惠碼:', allCoupons?.length || 0, '個');

    // 查詢特定優惠碼
    const { data: specificCoupon, error: specificError } = await supabase
      .from('saas_coupons')
      .select('*')
      .eq('coupon_code', 'HANAMI10')
      .single();

    if (specificError) {
      console.error('❌ 查詢特定優惠碼錯誤:', specificError);
    } else {
      console.log('✅ 找到 HANAMI10 優惠碼:', specificCoupon);
    }

    // 查詢啟用的優惠碼
    const { data: activeCoupons, error: activeError } = await supabase
      .from('saas_coupons')
      .select('*')
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ 查詢啟用優惠碼錯誤:', activeError);
    } else {
      console.log('✅ 啟用的優惠碼:', activeCoupons?.length || 0, '個');
    }

    return NextResponse.json({
      success: true,
      all_coupons: allCoupons,
      specific_coupon: specificCoupon,
      active_coupons: activeCoupons,
      total_count: allCoupons?.length || 0,
      active_count: activeCoupons?.length || 0
    });

  } catch (error) {
    console.error('❌ 測試 saas_coupons 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '測試 saas_coupons 時發生錯誤'
    }, { status: 500 });
  }
}

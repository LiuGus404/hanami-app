import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseTypeId = searchParams.get('courseTypeId');
    
    if (!courseTypeId) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    const supabase = getServerSupabaseClient();
    
    // 查詢價格計劃
    const { data: pricingPlans, error } = await (supabase as any)
      .from('hanami_course_pricing_plans')
      .select('id, plan_name, plan_description, plan_type, package_lessons, package_price, price_per_lesson, is_active')
      .eq('course_type_id', courseTypeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('查詢價格計劃失敗:', error);
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    return NextResponse.json({
      success: true,
      data: pricingPlans || []
    });
    
  } catch (error) {
    console.error('獲取價格計劃失敗:', error);
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}






















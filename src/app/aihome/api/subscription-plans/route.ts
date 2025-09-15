import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 獲取所有訂閱方案
    const { data: plans, error } = await supabase
      .from('saas_subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('獲取訂閱方案失敗:', error);
      return NextResponse.json(
        { success: false, error: '獲取訂閱方案失敗' },
        { status: 500 }
      );
    }

    // 格式化方案數據
    const formattedPlans = plans.map((plan: any) => ({
      id: plan.id,
      plan_name: plan.plan_name,
      plan_description: plan.plan_description,
      plan_type: plan.plan_type,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency || 'HKD',
      max_children: plan.max_children || 1,
      max_ai_interactions: plan.max_ai_interactions || 10,
      max_storage_mb: plan.max_storage_mb || 100,
      max_lesson_plans: plan.max_lesson_plans || 5,
      max_memory_entries: plan.max_memory_entries || 20,
      features: plan.features || {},
      is_active: plan.is_active,
      is_popular: plan.is_popular || false
    }));

    return NextResponse.json({
      success: true,
      data: formattedPlans
    });

  } catch (error: any) {
    console.error('訂閱方案 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

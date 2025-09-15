import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶ID' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 獲取用戶訂閱
    const { data: subscription, error: subscriptionError } = await supabase
      .from('saas_user_subscriptions')
      .select(`
        *,
        saas_subscription_plans (
          plan_name,
          plan_type,
          price_monthly,
          price_yearly,
          features,
          usage_limit
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('獲取訂閱失敗:', subscriptionError);
      return NextResponse.json(
        { success: false, error: '獲取訂閱失敗' },
        { status: 500 }
      );
    }

    // 獲取使用統計
    const { data: usageStats } = await supabase
      .from('saas_usage_records')
      .select('usage_type, total_usage, current_period_usage')
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription || null,
        usageStats: usageStats || []
      }
    });

  } catch (error: any) {
    console.error('訂閱 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, billingCycle } = body;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶ID' },
        { status: 400 }
      );
    }

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 檢查是否已有訂閱
    const { data: existingSubscription } = await supabase
      .from('saas_user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSubscription) {
      console.log('用戶已有訂閱，執行升級流程...');
      await (supabase
        .from('saas_user_subscriptions') as any)
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', (existingSubscription as any).id);
      console.log('現有訂閱已取消，創建新訂閱...');
    }

    // 計算訂閱期間
    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);
    
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // 創建新訂閱
    const { data: newSubscription, error: subscriptionError } = await (supabase
      .from('saas_user_subscriptions') as any)
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        start_date: periodStart.toISOString(),
        end_date: periodEnd.toISOString(),
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        stripe_subscription_id: null,
        stripe_customer_id: null,
        usage_stats: {}
      })
      .select(`
        *,
        saas_subscription_plans (
          plan_name,
          plan_type,
          price_monthly,
          price_yearly,
          features,
          usage_limit
        )
      `)
      .single();

    if (subscriptionError) {
      console.error('創建訂閱失敗:', subscriptionError);
      return NextResponse.json(
        { success: false, error: `創建訂閱失敗: ${subscriptionError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: newSubscription
      }
    });

  } catch (error: any) {
    console.error('創建訂閱 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

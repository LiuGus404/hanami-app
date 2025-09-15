import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentRecordId, paymentIntentId, status, planId, billingCycle } = body;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶ID' },
        { status: 400 }
      );
    }

    if (!paymentRecordId || !status) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 更新支付記錄
    const { data: paymentRecord, error: paymentError } = await (supabase
      .from('saas_payments') as any)
      .update({
        payment_status: status,
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecordId)
      .select()
      .single();

    if (paymentError) {
      console.error('更新支付記錄失敗:', paymentError);
      return NextResponse.json(
        { success: false, error: '更新支付記錄失敗' },
        { status: 500 }
      );
    }

    if (status === 'succeeded') {
      // 從請求中獲取計劃信息
      if (!planId || !billingCycle) {
        return NextResponse.json(
          { success: false, error: '缺少計劃信息' },
          { status: 400 }
        );
      }

      // 檢查是否已有訂閱
      const { data: existingSubscription } = await supabase
        .from('saas_user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .single();

      if (existingSubscription) {
        // 取消現有訂閱
        await (supabase
          .from('saas_user_subscriptions') as any)
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', (existingSubscription as any).id);
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
          payment: paymentRecord,
          subscription: newSubscription
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        payment: paymentRecord
      }
    });

  } catch (error: any) {
    console.error('支付確認 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, billingCycle, paymentMethod } = body;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶ID' },
        { status: 400 }
      );
    }

    if (!planId || !billingCycle || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 獲取方案信息
    const { data: plan, error: planError } = await supabase
      .from('saas_subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: '找不到訂閱方案' },
        { status: 404 }
      );
    }

    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

    // 創建支付記錄
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('saas_payments')
      .insert({
        user_id: userId,
        amount: price,
        currency: 'HKD',
        payment_method: paymentMethod,
        payment_status: 'pending',
        metadata: {
          plan_id: planId,
          billing_cycle: billingCycle
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('創建支付記錄失敗:', paymentError);
      return NextResponse.json(
        { success: false, error: '創建支付記錄失敗' },
        { status: 500 }
      );
    }

    if (paymentMethod === 'stripe') {
      let paymentIntent;
      
      if (price > 0) {
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100),
            currency: 'hkd',
            payment_method_types: ['card'],
            metadata: {
              user_id: userId,
              plan_id: planId,
              billing_cycle: billingCycle,
              payment_method: paymentMethod
            }
          });

          // 更新支付記錄
          await supabase
            .from('saas_payments')
            .update({
              payment_intent_id: paymentIntent.id,
              stripe_payment_intent_id: paymentIntent.id,
              metadata: {
                plan_id: planId,
                billing_cycle: billingCycle,
                payment_method: paymentMethod
              }
            })
            .eq('id', paymentRecord.id);

        } catch (stripeError) {
          console.error('創建 Stripe 支付意圖失敗:', stripeError);
          return NextResponse.json(
            { success: false, error: '創建支付意圖失敗' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          paymentIntentId: paymentIntent?.id || `pi_${paymentRecord.id}`,
          clientSecret: paymentIntent?.client_secret || `cs_${paymentRecord.id}`,
          requiresPayment: price > 0,
          amount: price,
          currency: 'HKD',
          paymentRecordId: paymentRecord.id
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: '不支持的支付方式'
    });

  } catch (error: any) {
    console.error('創建支付意圖 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

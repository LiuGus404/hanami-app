import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

interface SubscribeRequest {
    orgId: string;
    planId: string;
    billingType: 'monthly' | 'yearly';
    autoRenew?: boolean;
    paymentIntentId?: string; // Airwallex payment intent (optional for free plan)
}

// POST /api/org-subscription/subscribe
// Create or upgrade a subscription
export async function POST(request: NextRequest) {
    try {
        const body: SubscribeRequest = await request.json();
        const { orgId, planId, billingType, autoRenew = true, paymentIntentId } = body;

        if (!orgId || !planId || !billingType) {
            return NextResponse.json(
                { error: 'orgId, planId, and billingType are required' },
                { status: 400 }
            );
        }

        const supabase = createSaasAdminClient() as any;

        // 1. Verify plan exists
        const { data: plan, error: planError } = await supabase
            .from('org_subscription_plans')
            .select('*')
            .eq('plan_id', planId)
            .eq('is_active', true)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        // 2. Check if free plan (no payment required)
        const isFree = plan.price_monthly_hkd === 0;

        if (!isFree && !paymentIntentId) {
            // For paid plans, we'd normally verify payment here
            // For now, we'll allow creation without payment for testing
            console.warn('Creating paid subscription without payment verification');
        }

        // 3. Calculate billing period
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingType === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // 4. Check for existing subscription
        const { data: existingSub } = await (supabase
            .from('org_subscriptions')
            .select('id, plan_id')
            .eq('org_id', orgId)
            .single()) as any;

        const paymentAmount = billingType === 'yearly'
            ? Number(plan.price_yearly_hkd)
            : Number(plan.price_monthly_hkd);

        if (existingSub) {
            // Upgrade/change existing subscription
            const isUpgrade = planId !== existingSub.plan_id;

            const { data: updated, error: updateError } = await (supabase
                .from('org_subscriptions')
                .update({
                    plan_id: planId,
                    billing_type: billingType,
                    auto_renew: autoRenew,
                    status: 'active',
                    current_period_start: now.toISOString().split('T')[0],
                    current_period_end: periodEnd.toISOString().split('T')[0],
                    last_payment_at: isFree ? null : now.toISOString(),
                    last_payment_amount: isFree ? null : paymentAmount,
                    retry_count: 0,
                    grace_period_ends_at: null,
                })
                .eq('id', existingSub.id)
                .select()
                .single()) as any;

            if (updateError) {
                console.error('Error updating subscription:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update subscription' },
                    { status: 500 }
                );
            }

            // Log history
            await (supabase.from('org_subscription_history') as any).insert({
                subscription_id: existingSub.id,
                org_id: orgId,
                event_type: isUpgrade ? 'upgraded' : 'renewed',
                old_plan_id: existingSub.plan_id,
                new_plan_id: planId,
                payment_amount: isFree ? null : paymentAmount,
                billing_type: billingType,
            });

            return NextResponse.json({
                success: true,
                action: isUpgrade ? 'upgraded' : 'renewed',
                subscription: updated,
            });
        } else {
            // Create new subscription
            const { data: created, error: createError } = await (supabase
                .from('org_subscriptions')
                .insert({
                    org_id: orgId,
                    plan_id: planId,
                    billing_type: billingType,
                    auto_renew: autoRenew,
                    status: 'active',
                    current_period_start: now.toISOString().split('T')[0],
                    current_period_end: periodEnd.toISOString().split('T')[0],
                    last_payment_at: isFree ? null : now.toISOString(),
                    last_payment_amount: isFree ? null : paymentAmount,
                })
                .select()
                .single()) as any;

            if (createError) {
                console.error('Error creating subscription:', createError);
                return NextResponse.json(
                    { error: 'Failed to create subscription' },
                    { status: 500 }
                );
            }

            // Log history
            await (supabase.from('org_subscription_history') as any).insert({
                subscription_id: created.id,
                org_id: orgId,
                event_type: 'created',
                new_plan_id: planId,
                payment_amount: isFree ? null : paymentAmount,
                billing_type: billingType,
            });

            return NextResponse.json({
                success: true,
                action: 'created',
                subscription: created,
            });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

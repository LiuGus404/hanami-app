import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { getServerSupabaseClient } from '@/lib/supabase';

// GET /api/org-subscription/status?orgId=xxx
// Returns subscription status and student count for an organization
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { error: 'orgId is required' },
                { status: 400 }
            );
        }

        // 1. Get subscription from SaaS DB
        const saasSupabase = createSaasAdminClient() as any;

        const { data: subscription, error: subError } = await saasSupabase
            .from('org_subscriptions')
            .select(`
        *,
        plan:org_subscription_plans(*)
      `)
            .eq('org_id', orgId)
            .single();

        // 2. Get student count from AI-Student DB
        const aiSupabase = getServerSupabaseClient() as any;

        const { count: studentCount, error: countError } = await aiSupabase
            .from('Hanami_Students')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId);

        if (countError) {
            console.error('Error counting students:', countError);
        }

        const currentCount = studentCount || 0;

        // 3. Handle case where no subscription exists (free tier)
        if (subError || !subscription) {
            // Get free plan details
            const { data: freePlan } = await saasSupabase
                .from('org_subscription_plans')
                .select('*')
                .eq('plan_id', 'seed')
                .single();

            const maxStudents = freePlan?.max_students || 10;

            return NextResponse.json({
                hasSubscription: false,
                plan: {
                    id: 'seed',
                    name: freePlan?.plan_name || '種子版 (Seed)',
                    maxStudents,
                },
                status: 'active',
                billingType: null,
                autoRenew: false,
                currentPeriodEnd: null,
                studentCount: currentCount,
                maxStudents,
                canAddStudents: currentCount < maxStudents,
                canEditStudents: true,
                usagePercent: Math.round((currentCount / maxStudents) * 100),
            });
        }

        // 4. Return subscription details
        const sub = subscription as any;
        const plan = sub.plan as any;
        const maxStudents = plan?.max_students || 10;
        const isActive = sub.status === 'active';

        return NextResponse.json({
            hasSubscription: true,
            subscriptionId: sub.id,
            plan: {
                id: sub.plan_id,
                name: plan?.plan_name,
                maxStudents,
                priceMonthly: Number(plan?.price_monthly_hkd || 0),
                priceYearly: Number(plan?.price_yearly_hkd || 0),
            },
            status: sub.status,
            billingType: sub.billing_type,
            autoRenew: sub.auto_renew,
            currentPeriodStart: sub.current_period_start,
            currentPeriodEnd: sub.current_period_end,
            gracePeriodEndsAt: sub.grace_period_ends_at,
            studentCount: currentCount,
            maxStudents,
            canAddStudents: isActive && currentCount < maxStudents,
            canEditStudents: isActive,
            usagePercent: Math.round((currentCount / maxStudents) * 100),
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { getServerSupabaseClient } from '@/lib/supabase';

// GET /api/org-subscription/check-limit?orgId=xxx
// Quick check if org can add/edit students
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

        const { data: subscription } = await saasSupabase
            .from('org_subscriptions')
            .select('plan_id, status')
            .eq('org_id', orgId)
            .single();

        // 2. Get plan limit
        const planId = subscription?.plan_id || 'seed';
        const status = subscription?.status || 'active';

        const { data: plan } = await saasSupabase
            .from('org_subscription_plans')
            .select('max_students')
            .eq('plan_id', planId)
            .single();

        const maxStudents = plan?.max_students || 10;

        // 3. Get current student count from AI-Student DB (excluding disabled students)
        const aiSupabase = getServerSupabaseClient() as any;

        const { count: studentCount } = await aiSupabase
            .from('Hanami_Students')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .neq('student_type', '已停用');

        const currentCount = studentCount || 0;
        const isActive = status === 'active';
        const isWithinLimit = currentCount <= maxStudents;

        // Debug logging
        console.log('[check-limit] Debug:', {
            orgId,
            planId,
            plan,
            maxStudents,
            currentCount,
            isActive,
            isWithinLimit,
            canAdd: isActive && currentCount < maxStudents,
            canEdit: isActive && isWithinLimit,
        });

        return NextResponse.json({
            planId,
            maxStudents,
            currentCount,
            remaining: Math.max(0, maxStudents - currentCount),
            canAdd: isActive && currentCount < maxStudents,
            canEdit: isActive && isWithinLimit, // Block edit if over limit or suspended
            status,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

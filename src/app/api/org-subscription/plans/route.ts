import { NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// GET /api/org-subscription/plans - Get all subscription plans
export async function GET() {
    try {
        const supabase = createSaasAdminClient() as any;

        const { data: plans, error } = await supabase
            .from('org_subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('max_students', { ascending: true });

        if (error) {
            console.error('Error fetching subscription plans:', error);
            return NextResponse.json(
                { error: 'Failed to fetch plans' },
                { status: 500 }
            );
        }

        // Transform to client-friendly format
        const formattedPlans = plans?.map((plan: any) => ({
            id: plan.plan_id,
            name: plan.plan_name,
            maxStudents: plan.max_students,
            priceMonthly: Number(plan.price_monthly_hkd),
            priceYearly: Number(plan.price_yearly_hkd),
            pricePerStudentMonthly: plan.max_students > 0
                ? Number((plan.price_monthly_hkd / plan.max_students).toFixed(2))
                : 0,
            features: plan.features || {},
            isFree: plan.price_monthly_hkd === 0,
        }));

        return NextResponse.json({ plans: formattedPlans });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

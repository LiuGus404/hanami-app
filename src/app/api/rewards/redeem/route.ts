import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export const dynamic = 'force-dynamic';

// POST: Redeem a reward
export async function POST(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();
        const body = await request.json();

        const { user_id, reward_id, points_spent, redeemed_by } = body;

        if (!user_id || !reward_id || !points_spent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify user has enough points (Optional strict check, but for now we trust the frontend/admin)
        // In a stricter system, we would calculate balance here.

        // 2. Record redemption
        const { data, error } = await supabase
            .from('hanami_task_redemptions')
            .insert([{
                user_id,
                reward_id,
                points_spent,
                redeemed_by
            }])
            .select()
            .single();

        if (error) {
            console.error('Error redeeming reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 3. Log activity (Optional)
        // await supabase.from('hanami_task_activities').insert(...)

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export const dynamic = 'force-dynamic';

// GET: List rewards
export async function GET(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        let query = supabase
            .from('hanami_task_rewards')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (orgId) {
            query = query.eq('org_id', orgId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching rewards:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create reward
export async function POST(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();
        const body = await request.json();

        const { title, points_cost, icon, org_id } = body;
        console.log('Creating reward with body:', body);

        if (!title || points_cost === undefined || !org_id) {
            console.error('Missing fields:', { title, points_cost, org_id });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('hanami_task_rewards')
            .insert([{
                title,
                points_cost,
                icon,
                org_id,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

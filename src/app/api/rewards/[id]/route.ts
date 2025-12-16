import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export const dynamic = 'force-dynamic';

// PUT: Update reward
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSaasAdminClient();
        const body = await request.json();
        const { id } = params;

        const { data, error } = await supabase
            .from('hanami_task_rewards')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Archive reward (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSaasAdminClient();
        const { id } = params;

        // Use soft delete by setting is_active to false
        const { error } = await supabase
            .from('hanami_task_rewards')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Error deleting reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

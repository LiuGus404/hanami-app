import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSaasAdminClient();
        const { id } = params;
        const { assigneeIds } = await request.json();

        if (!Array.isArray(assigneeIds)) {
            return NextResponse.json(
                { error: 'Invalid format: assigneeIds must be an array' },
                { status: 400 }
            );
        }

        // Update task
        const { data: updatedTask, error } = await supabase
            .from('hanami_task_list')
            .update({
                assigned_to: assigneeIds,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error assigning task:', error);
            return NextResponse.json(
                { error: 'Failed to assign task', details: error.message },
                { status: 500 }
            );
        }

        // Log activity
        try {
            const { error: activityError } = await (supabase as any)
                .from('hanami_task_activities')
                .insert({
                    task_id: id,
                    action: 'assigned',
                    description: `Task assigned to ${assigneeIds.join(', ')}`,
                    created_at: new Date().toISOString()
                });

            if (activityError) {
                console.warn('Failed to log activity:', activityError);
            } else {
                console.log(`[TaskActivity] Task ${id} assigned to ${assigneeIds.join(', ')}`);
            }
        } catch (e) {
            console.warn('Activity logging failed (table might be missing):', e);
        }

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        console.error('Error in task assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

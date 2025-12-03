import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Request ID is required' },
                { status: 400 }
            );
        }

        const supabase = getServerSupabaseClient();

        // 1. Fetch the request to check status and type
        const { data: leaveRequest, error: fetchError } = await (supabase as any)
            .from('hanami_leave_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            return NextResponse.json(
                { success: false, error: 'Leave request not found' },
                { status: 404 }
            );
        }

        if (leaveRequest.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: 'Only pending requests can be cancelled' },
                { status: 400 }
            );
        }

        // 2. Revert student counts if necessary
        if (leaveRequest.leave_type === 'sick') {
            const { data: student, error: studentError } = await (supabase as any)
                .from('Hanami_Students')
                .select('pending_confirmation_count')
                .eq('id', leaveRequest.student_id)
                .single();

            if (studentError) throw studentError;

            const currentCount = (student as any)?.pending_confirmation_count || 0;
            const newCount = Math.max(0, currentCount - 1);

            const { error: updateError } = await (supabase as any)
                .from('Hanami_Students')
                .update({ pending_confirmation_count: newCount })
                .eq('id', leaveRequest.student_id);

            if (updateError) throw updateError;
        }

        // 3. Restore the lesson status if lesson_id exists
        if (leaveRequest.lesson_id) {
            const { error: restoreError } = await (supabase as any)
                .from('hanami_student_lesson')
                .update({ lesson_status: null }) // Restore to normal status
                .eq('id', leaveRequest.lesson_id);

            if (restoreError) {
                console.error('Failed to restore lesson status:', restoreError);
                // We continue to delete the request even if restore fails,
                // but ideally this should be a transaction.
            }
        }

        // 4. Delete the request
        const { error: deleteError } = await (supabase as any)
            .from('hanami_leave_requests')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error cancelling leave request:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

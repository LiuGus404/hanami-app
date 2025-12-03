import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = (supabase as any)
            .from('hanami_leave_requests')
            .select(`
        *,
        student:Hanami_Students (
          full_name,
          nick_name,
          student_oid
        )
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (orgId) {
            query = query.eq('org_id', orgId);
        }

        console.log('🔍 Admin fetching leave requests. OrgId:', orgId);
        const { data, error } = await query;
        console.log('🔍 Admin leave requests result:', data?.length, 'records found');
        if (data && data.length > 0) {
            console.log('First record:', data[0]);
        }

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Admin leave requests error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, status, reviewNotes, rejectionReason } = body;

        if (!requestId || !status) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Update request status
        const updateData: any = {
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'admin', // Ideally get from session
            review_notes: reviewNotes,
        };

        if (status === 'rejected') {
            updateData.rejection_reason = rejectionReason;
        }

        const { data: requestData, error: updateError } = await (supabase as any)
            .from('hanami_leave_requests')
            .update(updateData)
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. If approved, update student counts
        if (status === 'approved') {
            const studentId = requestData.student_id;

            // Decrement pending_confirmation_count and Increment approved_lesson_nonscheduled
            const { data: student, error: fetchError } = await (supabase as any)
                .from('Hanami_Students')
                .select('pending_confirmation_count, approved_lesson_nonscheduled')
                .eq('id', studentId)
                .single();

            if (fetchError) throw fetchError;

            const currentPending = (student as any)?.pending_confirmation_count || 0;
            const currentApproved = (student as any)?.approved_lesson_nonscheduled || 0;

            const { error: studentUpdateError } = await (supabase as any)
                .from('Hanami_Students')
                .update({
                    pending_confirmation_count: Math.max(0, currentPending - 1),
                    approved_lesson_nonscheduled: currentApproved + 1
                })
                .eq('id', studentId);

            if (studentUpdateError) throw studentUpdateError;
        } else if (status === 'rejected') {
            // If rejected, just decrement pending_confirmation_count?
            // Or should we restore the lesson?
            // The requirement says: "變為待確認堂數...審核該資料通過時，才會由待確認堂數變回待安排堂數"
            // It doesn't explicitly say what happens on rejection.
            // Usually, rejection means the leave is not granted, so the lesson is considered "absent" or "attended" (but it was deleted!).
            // Or maybe we restore the lesson?
            // Given the lesson was DELETED, restoring it is hard unless we stored the lesson details.
            // But we didn't store full lesson details in `hanami_leave_requests`.
            // This is a potential issue in the design if rejection requires restoring the lesson.
            // However, for "Sick Leave", usually if rejected, it counts as "Absent" (deducted).
            // If accepted, it counts as "Leave" (not deducted, or deducted but with makeup? "變回待安排堂數" implies makeup/reschedule).
            // "待安排堂數" means "Pending Arrangement" (Makeup credit).
            // So Approved -> Makeup Credit.
            // Rejected -> No Makeup Credit (Lesson lost).
            // So on rejection, we just decrement `pending_confirmation_count` and do NOT increment `approved_lesson_nonscheduled`.
            // The lesson remains deleted (consumed).

            const studentId = requestData.student_id;
            const { data: student, error: fetchError } = await (supabase as any)
                .from('Hanami_Students')
                .select('pending_confirmation_count')
                .eq('id', studentId)
                .single();

            if (fetchError) throw fetchError;

            const currentPending = (student as any)?.pending_confirmation_count || 0;

            const { error: studentUpdateError } = await (supabase as any)
                .from('Hanami_Students')
                .update({
                    pending_confirmation_count: Math.max(0, currentPending - 1)
                })
                .eq('id', studentId);

            if (studentUpdateError) throw studentUpdateError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Admin leave request update error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

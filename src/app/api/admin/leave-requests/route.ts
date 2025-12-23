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
            // 拒絕時：減少待確認堂數，並恢復課堂狀態（從「請假」改為 NULL）
            const studentId = requestData.student_id;
            const lessonId = requestData.lesson_id;

            // 1. 恢復課堂狀態
            if (lessonId) {
                const { error: lessonUpdateError } = await (supabase as any)
                    .from('hanami_student_lesson')
                    .update({ lesson_status: null })
                    .eq('id', lessonId);

                if (lessonUpdateError) {
                    console.error('恢復課堂狀態失敗:', lessonUpdateError);
                    // 不中斷流程，繼續處理
                }
            }

            // 2. 減少待確認堂數
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

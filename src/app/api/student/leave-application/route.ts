import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addHours, isAfter, isBefore, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, orgId, lessonId, lessonDate, leaveType, proofUrl } = body;

        if (!studentId || !lessonId || !leaveType) {
            return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        // Initialize Supabase client with service role key to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const lessonDateObj = parseISO(lessonDate);
        const now = new Date();

        // 1. Validate Leave Rules
        if (leaveType === 'personal') {
            // Check 72h notice
            const minNoticeDate = addHours(now, 72);
            if (isBefore(lessonDateObj, minNoticeDate)) {
                return NextResponse.json({ success: false, error: '事假需在 72 小時前申請' }, { status: 400 });
            }

            // Check monthly limit (1 per month)
            const start = startOfMonth(lessonDateObj).toISOString();
            const end = endOfMonth(lessonDateObj).toISOString();

            const { count, error: countError } = await (supabase as any)
                .from('hanami_leave_requests')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', studentId)
                .eq('leave_type', 'personal')
                .gte('lesson_date', start)
                .lte('lesson_date', end)
                .neq('status', 'rejected'); // Count pending and approved

            if (countError) throw countError;

            if (count && count >= 1) {
                return NextResponse.json({ success: false, error: '每月只能申請一次事假' }, { status: 400 });
            }
        } else if (leaveType === 'sick') {
            // Check +/- 24h window
            const minDate = addHours(now, -24);
            const maxDate = addHours(now, 24);

            if (isBefore(lessonDateObj, minDate) || isAfter(lessonDateObj, maxDate)) {
                return NextResponse.json({ success: false, error: '病假需在課堂前後 24 小時內申請' }, { status: 400 });
            }

            if (!proofUrl) {
                return NextResponse.json({ success: false, error: '病假需上傳醫生證明' }, { status: 400 });
            }
        }

        // 2. Process Leave Application

        // Create leave request record
        const { error: insertError } = await (supabase as any)
            .from('hanami_leave_requests')
            .insert({
                student_id: studentId,
                org_id: orgId,
                lesson_id: lessonId, // Save lesson_id for restoration
                lesson_date: lessonDate,
                leave_type: leaveType,
                status: leaveType === 'personal' ? 'approved' : 'pending',
                proof_url: proofUrl,
                reviewed_at: leaveType === 'personal' ? new Date().toISOString() : null,
                reviewed_by: leaveType === 'personal' ? 'system' : null,
            });

        if (insertError) throw insertError;

        // Update the lesson status to '請假' instead of deleting
        const { error: updateLessonError } = await (supabase as any)
            .from('hanami_student_lesson')
            .update({ lesson_status: '請假' })
            .eq('id', lessonId);

        if (updateLessonError) {
            console.error('Failed to update lesson status');
            throw updateLessonError;
        }

        // Update student counts
        if (leaveType === 'personal') {
            // Increment approved_lesson_nonscheduled (Pending Arrangement)
            const { data: student, error: fetchError } = await (supabase as any)
                .from('Hanami_Students')
                .select('approved_lesson_nonscheduled')
                .eq('id', studentId)
                .single();

            if (fetchError) throw fetchError;

            const currentCount = (student as any)?.approved_lesson_nonscheduled || 0;

            const { error: updateError } = await (supabase as any)
                .from('Hanami_Students')
                .update({ approved_lesson_nonscheduled: currentCount + 1 })
                .eq('id', studentId);

            if (updateError) throw updateError;

        } else {
            // Sick leave: Increment pending_confirmation_count
            const { data: student, error: fetchError } = await (supabase as any)
                .from('Hanami_Students')
                .select('pending_confirmation_count')
                .eq('id', studentId)
                .single();

            if (fetchError) throw fetchError;

            const currentCount = (student as any)?.pending_confirmation_count || 0;

            const { error: updateError } = await (supabase as any)
                .from('Hanami_Students')
                .update({ pending_confirmation_count: currentCount + 1 })
                .eq('id', studentId);

            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Leave application API error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, addHours, isAfter, isBefore, parseISO } from 'date-fns';

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

        // 0. Check if lesson already has leave request or is already on leave
        const { data: existingLesson, error: lessonError } = await (supabase as any)
            .from('hanami_student_lesson')
            .select('lesson_status')
            .eq('id', lessonId)
            .single();

        if (lessonError) throw lessonError;

        // 檢查課堂是否已經請假
        if (existingLesson?.lesson_status === '請假') {
            return NextResponse.json({ success: false, error: '此課堂已經請假，無法重複申請' }, { status: 400 });
        }

        // 檢查是否已有待審批或已批准的請假申請
        const { data: existingRequest, error: requestError } = await (supabase as any)
            .from('hanami_leave_requests')
            .select('id, status')
            .eq('lesson_id', lessonId)
            .in('status', ['pending', 'approved'])
            .maybeSingle();

        if (requestError) throw requestError;

        if (existingRequest) {
            return NextResponse.json({ 
                success: false, 
                error: existingRequest.status === 'pending' 
                    ? '此課堂已有待審批的請假申請' 
                    : '此課堂的請假申請已獲批准' 
            }, { status: 400 });
        }

        // 1. Validate Leave Rules
        if (leaveType === 'personal') {
            // Check 72h notice
            const minNoticeDate = addHours(now, 72);
            if (isBefore(lessonDateObj, minNoticeDate)) {
                return NextResponse.json({ success: false, error: '事假需在 72 小時前申請' }, { status: 400 });
            }
        } else if (leaveType === 'sick') {
            // 病假：課堂前後 7 天內可申請
            const minDate = addDays(now, -7);
            const maxDate = addDays(now, 7);

            if (isBefore(lessonDateObj, minDate) || isAfter(lessonDateObj, maxDate)) {
                return NextResponse.json({ success: false, error: '病假需在課堂前後 7 天內申請' }, { status: 400 });
            }

            if (!proofUrl) {
                return NextResponse.json({ success: false, error: '病假需上傳醫生證明' }, { status: 400 });
            }
        }

        // 2. Process Leave Application

        // Create leave request record
        // Both personal and sick leave now require approval
        const { error: insertError } = await (supabase as any)
            .from('hanami_leave_requests')
            .insert({
                student_id: studentId,
                org_id: orgId,
                lesson_id: lessonId, // Save lesson_id for restoration
                lesson_date: lessonDate,
                leave_type: leaveType,
                status: 'pending', // Both types require approval
                proof_url: proofUrl,
                reviewed_at: null,
                reviewed_by: null,
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
        // Both personal and sick leave now increment pending_confirmation_count
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

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Leave application API error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            studentId,
            lessonDate,
            timeSlot,
            courseType,
            orgId
        } = body;

        if (!studentId || !lessonDate || !timeSlot) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getServerSupabaseClient() as any;

        // 0. Fetch student details (to avoid client-side RLS issues)
        const { data: studentData, error: fetchError } = await supabase
            .from('Hanami_Students')
            .select('student_oid, full_name, regular_weekday, approved_lesson_nonscheduled')
            .eq('id', studentId)
            .single();

        if (fetchError || !studentData) {
            console.error('Error fetching student data:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 });
        }

        // 1. Insert into hanami_student_lesson
        const lessonData = {
            student_id: studentId,
            student_oid: studentData.student_oid,
            full_name: studentData.full_name,
            lesson_date: lessonDate,
            regular_timeslot: timeSlot,
            actual_timeslot: timeSlot,
            course_type: courseType,
            lesson_status: '出席',
            status: 'attended',
            lesson_duration: '01:00:00', // Default, adjusted below
            regular_weekday: studentData.regular_weekday ? String(studentData.regular_weekday) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            org_id: orgId
        };

        if (courseType === '鋼琴') lessonData.lesson_duration = '00:45:00';
        else if (courseType === '音樂專注力') lessonData.lesson_duration = '01:00:00';

        const { error: insertError } = await supabase
            .from('hanami_student_lesson')
            .insert([lessonData]);

        if (insertError) {
            console.error('Error inserting lesson:', insertError);
            return NextResponse.json({
                error: 'Failed to book lesson',
                details: insertError.message,
                hint: insertError.hint,
                code: insertError.code
            }, { status: 500 });
        }

        // 2. Decrement approved_lesson_nonscheduled count
        // We first fetch the current count to be safe, although we could just decrement.
        // Ideally we should use a stored procedure or atomic update, but read-then-update is okay for now given low concurrency per student.

        // 2. Decrement approved_lesson_nonscheduled count
        // We already fetched the current count in step 0.

        const currentCount = studentData.approved_lesson_nonscheduled || 0;
        if (currentCount > 0) {
            const { error: updateError } = await supabase
                .from('Hanami_Students')
                .update({ approved_lesson_nonscheduled: currentCount - 1 })
                .eq('id', studentId);

            if (updateError) {
                console.error('Error updating lesson count:', updateError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in book-parent-lesson:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

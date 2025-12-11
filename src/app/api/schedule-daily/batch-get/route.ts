import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use server-side client to bypass RLS limits
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const lessonDate = searchParams.get('lessonDate');
        const orgId = searchParams.get('orgId');
        const scheduleTemplateIdsParam = searchParams.get('scheduleTemplateIds');

        if (!lessonDate || !orgId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters: lessonDate, orgId'
            }, { status: 400 });
        }

        // Use service role key to bypass RLS
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Query daily schedule records
        let query = supabase
            .from('hanami_schedule_daily')
            .select('schedule_template_id, teacher_main_id, teacher_assist_id')
            .eq('lesson_date', lessonDate)
            .eq('org_id', orgId);

        if (scheduleTemplateIdsParam) {
            const ids = scheduleTemplateIdsParam.split(',');
            if (ids.length > 0) {
                query = query.in('schedule_template_id', ids);
            }
        }

        const { data: dailySchedules, error: dailyError } = await query;

        if (dailyError) {
            console.error('Failed to query schedule_daily:', dailyError);
            return NextResponse.json({
                success: false,
                error: `Query failed: ${dailyError.message}`
            }, { status: 500 });
        }

        if (!dailySchedules || dailySchedules.length === 0) {
            return NextResponse.json({
                success: true,
                data: {}
            });
        }

        // 2. Collect all teacher IDs
        const teacherIds = new Set<string>();
        dailySchedules.forEach(schedule => {
            if (schedule.teacher_main_id) teacherIds.add(schedule.teacher_main_id);
            if (schedule.teacher_assist_id) teacherIds.add(schedule.teacher_assist_id);
        });

        // 3. Fetch teacher info in bulk
        const teacherMap = new Map<string, { name: string, nickname: string }>();
        if (teacherIds.size > 0) {
            const { data: teachers, error: teachersError } = await supabase
                .from('hanami_employee')
                .select('id, teacher_fullname, teacher_nickname')
                .in('id', Array.from(teacherIds))
                .eq('org_id', orgId);

            if (teachersError) {
                console.error('Failed to query teachers:', teachersError);
                // Continue partially if possible, or fail? better to continue without names
            } else if (teachers) {
                teachers.forEach(t => {
                    teacherMap.set(t.id, {
                        name: t.teacher_fullname || '',
                        nickname: t.teacher_nickname || ''
                    });
                });
            }
        }

        // 4. Construct response map
        const result: Record<string, {
            teacher_main_id: string | null;
            teacher_assist_id: string | null;
            teacher_main_name: string;
            teacher_assist_name: string;
        }> = {};

        dailySchedules.forEach(schedule => {
            const mainTeacher = schedule.teacher_main_id ? teacherMap.get(schedule.teacher_main_id) : null;
            const assistTeacher = schedule.teacher_assist_id ? teacherMap.get(schedule.teacher_assist_id) : null;

            result[schedule.schedule_template_id] = {
                teacher_main_id: schedule.teacher_main_id || null,
                teacher_assist_id: schedule.teacher_assist_id || null,
                teacher_main_name: mainTeacher ? (mainTeacher.name || mainTeacher.nickname) : '',
                teacher_assist_name: assistTeacher ? (assistTeacher.name || assistTeacher.nickname) : '',
            };
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error fetching batch daily schedule:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

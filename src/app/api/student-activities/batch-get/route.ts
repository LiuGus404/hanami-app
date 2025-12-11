import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use server-side client to bypass RLS limits
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const studentIdsParam = searchParams.get('studentIds');
        const lessonDate = searchParams.get('lessonDate');
        const orgId = searchParams.get('orgId');

        if (!studentIdsParam) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameter: studentIds'
            }, { status: 400 });
        }

        const studentIds = studentIdsParam.split(',').filter(id => id.trim() !== '');

        if (studentIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: {}
            });
        }

        // Use service role key to bypass RLS
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Get valid activity IDs for the organization (if orgId provided)
        let validActivityIds: string[] = [];
        if (orgId) {
            const { data: validActivitiesData, error: validActivitiesError } = await supabase
                .from('hanami_teaching_activities')
                .select('id')
                .eq('is_active', true)
                .eq('org_id', orgId);

            if (!validActivitiesError && validActivitiesData) {
                validActivityIds = validActivitiesData.map(a => a.id);
            }
        }

        // 2. Fetch all relevant activities for these students
        // We fetch ongoing activities for all students
        let query = supabase
            .from('hanami_student_activities')
            .select(`
            id,
            student_id,
            completion_status,
            assigned_at,
            time_spent,
            teacher_notes,
            student_feedback,
            progress,
            activity_id,
            activity_type,
            tree_id,
            lesson_date,
            get_timeslot:timeslot,
            hanami_teaching_activities!left (
                id,
                activity_name,
                activity_description,
                activity_type,
                difficulty_level,
                duration_minutes,
                materials_needed,
                instructions,
                org_id
            )
        `)
            .in('student_id', studentIds)
            .or('activity_type.eq.ongoing,and(activity_type.eq.lesson,tree_id.not.is.null)'); // Same logic as single API

        // Filter by orgId if needed
        if (orgId && validActivityIds.length > 0) {
            query = query.in('activity_id', validActivityIds);
        } else if (orgId && validActivityIds.length === 0) {
            // No valid activities for this org, return empty
            return NextResponse.json({ success: true, data: {} });
        }

        const { data: allActivities, error: queryError } = await query;

        if (queryError) {
            console.error('Failed to batch fetch student activities:', queryError);
            return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
        }

        // 3. Process and Group Data
        const result: Record<string, any[]> = {};

        // Initialize array for each student
        studentIds.forEach(id => { result[id] = []; });

        if (allActivities) {
            allActivities.forEach((activity: any) => {
                const studentId = activity.student_id;

                // Filter out completed ones if we only want ongoing (as per UI logic usually showing "In Progress" in the card)
                // The UI logic in page.tsx:
                // const studentAssignedActivities = studentActivitiesMap.get(studentId) || [];
                // And in the single API route it returns: 
                // ongoingActivities: allOngoingActivities.filter((activity: any) => (activity.progress || 0) < 100);

                const progress = activity.progress || 0;
                const normalizedProgress = progress > 1 ? progress / 100 : progress;
                const isCompleted = normalizedProgress >= 1 || activity.completion_status === 'completed';

                // We only care about ongoing activities for the card view display
                if (!isCompleted) {
                    // Process activity to match UI expected format
                    const teachingActivity = activity.hanami_teaching_activities;
                    const completionStatus = normalizedProgress > 0 ? 'in_progress' : (activity.completion_status || 'not_started');

                    const processedActivity = {
                        id: activity.id,
                        activityId: teachingActivity ? teachingActivity.id : (activity.activity_id || null),
                        teachingActivityId: teachingActivity ? teachingActivity.id : null,
                        activityName: teachingActivity ? teachingActivity.activity_name : null,
                        activityDescription: teachingActivity ? teachingActivity.activity_description : null,
                        activityType: teachingActivity ? teachingActivity.activity_type : null,
                        difficultyLevel: teachingActivity ? (teachingActivity.difficulty_level || 1) : null,
                        estimatedDuration: teachingActivity ? (teachingActivity.duration_minutes || 0) : null,
                        materialsNeeded: teachingActivity ? (teachingActivity.materials_needed || []) : [],
                        instructions: teachingActivity ? (teachingActivity.instructions || '') : null,
                        completionStatus: completionStatus,
                        teacherNotes: activity.teacher_notes,
                        studentFeedback: activity.student_feedback,
                        timeSpent: activity.time_spent || 0,
                        progress: progress,
                        assignedAt: activity.assigned_at,
                        lessonDate: activity.lesson_date,
                        timeslot: activity.get_timeslot,
                        _raw: activity
                    };

                    if (result[studentId]) {
                        result[studentId].push(processedActivity);
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in batch student activities fetch:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

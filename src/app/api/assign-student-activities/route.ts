import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, lessonDate, timeslot, activityIds, assignmentType = 'current_lesson' } = body;

    if (!studentId || !activityIds || !Array.isArray(activityIds)) {
      return NextResponse.json(
        { error: '缺少必要參數：studentId, activityIds' },
        { status: 400 }
      );
    }

    // 對於長期活動，lessonDate 和 timeslot 是可選的
    if (assignmentType === 'current_lesson' && (!lessonDate || !timeslot)) {
      return NextResponse.json(
        { error: '本次課堂活動需要 lessonDate 和 timeslot 參數' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 根據分配類型決定處理方式
    if (assignmentType === 'current_lesson') {
      // 本次課堂活動：直接插入到 hanami_student_activities 表
      console.log('分配本次課堂活動，參數:', { studentId, activityIds, lessonDate, timeslot });
      
      // 先檢查活動是否存在
      const { data: existingActivities, error: checkError } = await supabase
        .from('hanami_teaching_activities')
        .select('id')
        .in('id', activityIds);

      if (checkError) {
        console.error('檢查活動存在性失敗:', checkError);
        return NextResponse.json(
          { error: '檢查活動存在性失敗', details: checkError.message },
          { status: 500 }
        );
      }

      if (!existingActivities || existingActivities.length !== activityIds.length) {
        const existingIds = existingActivities?.map(a => a.id) || [];
        const missingIds = activityIds.filter(id => !existingIds.includes(id));
        console.error('部分活動不存在:', { missingIds, existingIds, requestedIds: activityIds });
        return NextResponse.json(
          { error: '部分活動不存在', details: `找不到活動ID: ${missingIds.join(', ')}` },
          { status: 400 }
        );
      }

      const activityAssignments = activityIds.map((activityId: string) => ({
        student_id: studentId,
        activity_id: activityId,
        activity_type: 'lesson',
        lesson_date: lessonDate,
        timeslot: timeslot,
        completion_status: 'not_started',
        assigned_at: new Date().toISOString()
      }));

      console.log('準備插入的本次課堂活動:', activityAssignments);

      // 使用 hanami_student_activities 表
      const { data: insertedData, error: insertError } = await supabase
        .from('hanami_student_activities')
        .insert(activityAssignments)
        .select();

      if (insertError) {
        console.error('插入本次課堂活動失敗:', insertError);
        return NextResponse.json(
          { error: '分配本次課堂活動失敗', details: insertError.message },
          { status: 500 }
        );
      }

      console.log('成功分配本次課堂活動:', insertedData);

      return NextResponse.json({
        success: true,
        data: {
          assignedCount: insertedData.length,
          assignments: insertedData,
          type: 'current_lesson'
        }
      });

    } else if (assignmentType === 'ongoing') {
      // 正在學習的活動：插入到 hanami_student_activities 表
      console.log('分配長期活動，參數:', { studentId, activityIds });
      
      // 先檢查活動是否存在
      const { data: existingActivities, error: checkError } = await supabase
        .from('hanami_teaching_activities')
        .select('id')
        .in('id', activityIds);

      if (checkError) {
        console.error('檢查活動存在性失敗:', checkError);
        return NextResponse.json(
          { error: '檢查活動存在性失敗', details: checkError.message },
          { status: 500 }
        );
      }

      if (!existingActivities || existingActivities.length !== activityIds.length) {
        const existingIds = existingActivities?.map(a => a.id) || [];
        const missingIds = activityIds.filter(id => !existingIds.includes(id));
        console.error('部分活動不存在:', { missingIds, existingIds, requestedIds: activityIds });
        return NextResponse.json(
          { error: '部分活動不存在', details: `找不到活動ID: ${missingIds.join(', ')}` },
          { status: 400 }
        );
      }

      const activityAssignments = activityIds.map((activityId: string) => ({
        student_id: studentId,
        activity_id: activityId,
        activity_type: 'ongoing',
        completion_status: 'not_started',
        assigned_at: new Date().toISOString()
      }));

      console.log('準備插入的長期活動:', activityAssignments);

      // 使用 hanami_student_activities 表
      const { data: insertedData, error: insertError } = await supabase
        .from('hanami_student_activities')
        .insert(activityAssignments)
        .select();

      if (insertError) {
        console.error('插入長期活動失敗:', insertError);
        console.error('錯誤詳情:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        return NextResponse.json(
          { error: '分配長期活動失敗', details: insertError.message },
          { status: 500 }
        );
      }

      console.log('成功分配長期活動:', insertedData);

      return NextResponse.json({
        success: true,
        data: {
          assignedCount: insertedData.length,
          assignments: insertedData,
          type: 'ongoing'
        }
      });

    } else {
      return NextResponse.json(
        { error: '不支援的分配類型' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('分配活動時發生錯誤:', error);
    return NextResponse.json(
      { error: '分配活動時發生錯誤' },
      { status: 500 }
    );
  }
} 
 
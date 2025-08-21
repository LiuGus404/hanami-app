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
      // 本次課堂活動：需要找到對應的課堂記錄
      const { data: lessonData, error: lessonError } = await supabase
        .from('hanami_student_lesson')
        .select('id')
        .eq('student_id', studentId)
        .eq('lesson_date', lessonDate)
        .eq('regular_timeslot', timeslot)
        .single();

      if (lessonError || !lessonData) {
        console.error('找不到課堂記錄:', lessonError);
        return NextResponse.json(
          { error: '找不到對應的課堂記錄' },
          { status: 404 }
        );
      }

      const lessonId = lessonData.id;

      // 準備要插入的活動分配記錄
      const activityAssignments = activityIds.map((activityId: string) => ({
        lesson_id: lessonId,
        student_id: studentId,
        tree_activity_id: activityId,
        assigned_by: 'system', // 可以改為實際的用戶ID
        completion_status: 'not_started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // 批量插入活動分配記錄
      const { data: insertedData, error: insertError } = await supabase
        .from('hanami_student_lesson_activities')
        .insert(activityAssignments)
        .select();

      if (insertError) {
        console.error('插入活動分配記錄失敗:', insertError);
        return NextResponse.json(
          { error: '分配活動失敗' },
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
      // 正在學習的活動：直接更新學生的長期活動進度
      console.log('分配長期活動，參數:', { studentId, activityIds });
      
      const activityAssignments = activityIds.map((activityId: string) => ({
        student_id: studentId,
        tree_activity_id: activityId,
        completion_status: 'in_progress',
        attempts_count: 0,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log('準備插入的活動分配:', activityAssignments);

      // 使用 hanami_student_tree_activity_progress 表
      console.log('開始執行 upsert 操作...');
      
      const { data: insertedData, error: insertError } = await supabase
        .from('hanami_student_tree_activity_progress')
        .upsert(activityAssignments, { 
          onConflict: 'student_id,tree_activity_id'
        })
        .select();

      if (insertError) {
        console.error('插入長期活動進度記錄失敗:', insertError);
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
 
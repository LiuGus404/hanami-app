import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  StudentTreeActivityProgress,
  UpdateActivityProgressRequest,
  COMPLETION_STATUS 
} from '@/types/progress';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 獲取學生活動進度
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const treeId = searchParams.get('tree_id');
    const activityId = searchParams.get('activity_id');

    if (!studentId) {
      return NextResponse.json(
        { error: '請提供學生ID' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hanami_student_tree_activity_progress')
      .select(`
        *,
        activity:hanami_tree_activities(*)
      `)
      .eq('student_id', studentId);

    // 應用篩選器
    if (treeId) {
      query = query.eq('activity.tree_id', treeId);
    }
    if (activityId) {
      query = query.eq('tree_activity_id', activityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('獲取學生活動進度失敗:', error);
      return NextResponse.json(
        { error: '獲取學生活動進度失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('獲取學生活動進度時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取學生活動進度時發生錯誤' },
      { status: 500 }
    );
  }
}

// POST: 創建或更新學生活動進度
export async function POST(request: NextRequest) {
  try {
    const body: UpdateActivityProgressRequest = await request.json();

    // 驗證必填欄位
    if (!body.student_id || !body.tree_activity_id || !body.completion_status) {
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['student_id', 'tree_activity_id', 'completion_status'] },
        { status: 400 }
      );
    }

    // 驗證完成狀態
    if (!Object.values(COMPLETION_STATUS).includes(body.completion_status)) {
      return NextResponse.json(
        { error: '無效的完成狀態', valid_statuses: Object.values(COMPLETION_STATUS) },
        { status: 400 }
      );
    }

    // 驗證評分範圍
    if (body.performance_rating && (body.performance_rating < 1 || body.performance_rating > 5)) {
      return NextResponse.json(
        { error: '評分必須在1-5之間' },
        { status: 400 }
      );
    }

    // 檢查學生是否存在
    const { data: studentExists, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name')
      .eq('id', body.student_id)
      .single();

    if (studentError || !studentExists) {
      return NextResponse.json(
        { error: '指定的學生不存在' },
        { status: 404 }
      );
    }

    // 檢查活動是否存在
    const { data: activityExists, error: activityError } = await supabase
      .from('hanami_tree_activities')
      .select('id, activity_name')
      .eq('id', body.tree_activity_id)
      .single();

    if (activityError || !activityExists) {
      return NextResponse.json(
        { error: '指定的活動不存在' },
        { status: 404 }
      );
    }

    // 準備進度資料
    const progressData = {
      student_id: body.student_id,
      tree_activity_id: body.tree_activity_id,
      completion_status: body.completion_status,
      completion_date: body.completion_status === 'completed' ? new Date().toISOString() : null,
      performance_rating: body.performance_rating || null,
      student_notes: body.student_notes || null,
      teacher_notes: body.teacher_notes || null,
      evidence_files: body.evidence_files || [],
      time_spent: body.time_spent || null,
      is_favorite: body.is_favorite || false
    };

    // 使用 upsert 操作（插入或更新）
    const { data, error } = await supabase
      .from('hanami_student_tree_activity_progress')
      .upsert(progressData, {
        onConflict: 'student_id,tree_activity_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('更新學生活動進度失敗:', error);
      return NextResponse.json(
        { error: '更新學生活動進度失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '學生活動進度更新成功'
    });

  } catch (error) {
    console.error('更新學生活動進度時發生錯誤:', error);
    return NextResponse.json(
      { error: '更新學生活動進度時發生錯誤' },
      { status: 500 }
    );
  }
}

// PUT: 批量更新學生活動進度
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { progress_updates } = body; // 預期格式: { progress_updates: [{ student_id, tree_activity_id, updates }] }

    if (!Array.isArray(progress_updates)) {
      return NextResponse.json(
        { error: '請提供進度更新陣列' },
        { status: 400 }
      );
    }

    const updatePromises = progress_updates.map(async ({ 
      student_id, 
      tree_activity_id, 
      updates 
    }: { 
      student_id: string; 
      tree_activity_id: string; 
      updates: Partial<UpdateActivityProgressRequest> 
    }) => {
      // 驗證更新資料
      if (updates.completion_status && !Object.values(COMPLETION_STATUS).includes(updates.completion_status)) {
        throw new Error(`進度記錄 ${student_id}-${tree_activity_id}: 無效的完成狀態`);
      }

      if (updates.performance_rating && (updates.performance_rating < 1 || updates.performance_rating > 5)) {
        throw new Error(`進度記錄 ${student_id}-${tree_activity_id}: 評分必須在1-5之間`);
      }

      const progressData = {
        ...updates,
        completion_date: updates.completion_status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('hanami_student_tree_activity_progress')
        .update(progressData)
        .eq('student_id', student_id)
        .eq('tree_activity_id', tree_activity_id)
        .select()
        .single();

      if (error) {
        throw new Error(`進度記錄 ${student_id}-${tree_activity_id}: ${error.message}`);
      }

      return data;
    });

    const results = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功更新 ${results.length} 個進度記錄`
    });

  } catch (error) {
    console.error('批量更新學生活動進度失敗:', error);
    return NextResponse.json(
      { error: '批量更新學生活動進度失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// DELETE: 刪除學生活動進度
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const activityId = searchParams.get('activity_id');

    if (!studentId || !activityId) {
      return NextResponse.json(
        { error: '請提供學生ID和活動ID' },
        { status: 400 }
      );
    }

    // 檢查進度記錄是否存在
    const { data: progressExists, error: checkError } = await supabase
      .from('hanami_student_tree_activity_progress')
      .select('id, student_id, tree_activity_id')
      .eq('student_id', studentId)
      .eq('tree_activity_id', activityId)
      .single();

    if (checkError || !progressExists) {
      return NextResponse.json(
        { error: '指定的進度記錄不存在' },
        { status: 404 }
      );
    }

    // 刪除進度記錄
    const { error } = await supabase
      .from('hanami_student_tree_activity_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('tree_activity_id', activityId);

    if (error) {
      console.error('刪除學生活動進度失敗:', error);
      return NextResponse.json(
        { error: '刪除學生活動進度失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '學生活動進度已成功刪除'
    });

  } catch (error) {
    console.error('刪除學生活動進度時發生錯誤:', error);
    return NextResponse.json(
      { error: '刪除學生活動進度時發生錯誤' },
      { status: 500 }
    );
  }
} 
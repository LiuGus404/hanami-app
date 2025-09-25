import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { TaskProgressUpdate } from '@/types/task-management';

// 更新任務進度
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSaasAdminClient();
    const body: TaskProgressUpdate = await request.json();
    
    // 驗證進度百分比
    if (body.progress_percentage < 0 || body.progress_percentage > 100) {
      return NextResponse.json(
        { error: 'Progress percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // 構建更新物件
    const updateData: any = {
      progress_percentage: body.progress_percentage
    };

    if (body.actual_duration !== undefined) {
      updateData.actual_duration = body.actual_duration;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // 如果進度達到 100%，自動標記為完成
    if (body.progress_percentage === 100 && body.status !== 'completed') {
      updateData.status = 'completed';
    }

    const { data: task, error } = await (supabase as any)
      .from('hanami_task_list')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task progress:', error);
      return NextResponse.json(
        { error: 'Failed to update task progress' },
        { status: 500 }
      );
    }

    // 如果有評論，添加評論
    if (body.comment) {
      const { error: commentError } = await (supabase as any)
        .from('hanami_task_comments')
        .insert([{
          task_id: params.id,
          comment: body.comment,
          is_system_message: false
        }]);

      if (commentError) {
        console.error('Error adding progress comment:', commentError);
      }
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

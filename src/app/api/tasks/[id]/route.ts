import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { UpdateTaskForm } from '@/types/task-management';

export const dynamic = 'force-dynamic';

// 獲取單個任務
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSaasAdminClient();
    const { data: task, error } = await supabase
      .from('hanami_task_list')
      .select(`
        *,
        hanami_task_comments(*),
        hanami_task_attachments(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 更新任務
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSaasAdminClient();
    const body: UpdateTaskForm = await request.json();

    // 構建更新物件
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.follow_up_content !== undefined) updateData.follow_up_content = body.follow_up_content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.points !== undefined) updateData.points = body.points;
    if (body.assigned_to !== undefined) {
      // 處理 assigned_to 陣列
      if (typeof body.assigned_to === 'string') {
        // 如果是字串，轉換為陣列
        updateData.assigned_to = (body.assigned_to as string).trim() !== '' ?
          (body.assigned_to as string).split(',').map(name => name.trim()).filter(name => name !== '') :
          null;
      } else if (Array.isArray(body.assigned_to)) {
        // 如果已經是陣列，直接使用
        updateData.assigned_to = body.assigned_to.length > 0 ? body.assigned_to : null;
      } else {
        updateData.assigned_to = null;
      }
    }
    if (body.due_date !== undefined) {
      // 處理空字串日期
      updateData.due_date = body.due_date && body.due_date.trim() !== '' ? body.due_date : null;
    }
    if (body.time_block_start !== undefined) {
      updateData.time_block_start = body.time_block_start && body.time_block_start.trim() !== '' ? body.time_block_start : null;
    }
    if (body.time_block_end !== undefined) {
      updateData.time_block_end = body.time_block_end && body.time_block_end.trim() !== '' ? body.time_block_end : null;
    }
    if (body.estimated_duration !== undefined) updateData.estimated_duration = body.estimated_duration;
    if (body.actual_duration !== undefined) updateData.actual_duration = body.actual_duration;
    if (body.progress_percentage !== undefined) updateData.progress_percentage = body.progress_percentage;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;
    if (body.project_id !== undefined) {
      // 處理空字串或無效 UUID
      updateData.project_id = body.project_id && body.project_id.trim() !== '' ? body.project_id : null;
    }

    if (body.points !== undefined) updateData.points = body.points;
    if (body.is_approved !== undefined) updateData.is_approved = body.is_approved;
    if (body.approved_by !== undefined) updateData.approved_by = body.approved_by;
    if (body.approved_at !== undefined) updateData.approved_at = body.approved_at;

    if (body.visible_to_roles !== undefined) updateData.visible_to_roles = body.visible_to_roles;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;

    // 如果提供了 org_id，更新它
    // 如果字段不存在，更新會失敗，但我們會捕獲錯誤
    if ((body as any).org_id !== undefined) {
      updateData.org_id = (body as any).org_id;
    }

    // 若沒有任何可更新欄位，至少更新 updated_at 以避免空更新報錯
    if (Object.keys(updateData).length === 0) {
      updateData.updated_at = new Date().toISOString();
    } else {
      updateData.updated_at = new Date().toISOString();
    }

    const { data: task, error } = await (supabase as any)
      .from('hanami_task_list')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message ?? error },
        { status: 500 }
      );
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 刪除任務
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSaasAdminClient();
    const { error } = await supabase
      .from('hanami_task_list')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

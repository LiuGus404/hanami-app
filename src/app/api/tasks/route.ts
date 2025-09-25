import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { Task, CreateTaskForm, TaskFilter, TaskSort, Pagination } from '@/types/task-management';

// 獲取任務列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();
    const { searchParams } = new URL(request.url);
    
    // 解析查詢參數
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.getAll('status') as any[];
    const priority = searchParams.get('priority')?.split(',') as any[];
    const category = searchParams.getAll('category') as any[];
    const assigned_to = searchParams.get('assigned_to');
    const project_id = searchParams.get('project_id');
    const due_date_from = searchParams.get('due_date_from');
    const due_date_to = searchParams.get('due_date_to');
    const is_public = searchParams.get('is_public');
    const search = searchParams.get('search');
    const sort_field = searchParams.get('sort_by') || 'created_at';
    const sort_direction = searchParams.get('sort_order') || 'desc';
    const phone = searchParams.get('phone');

    // 構建查詢
    let query = supabase
      .from('hanami_task_list')
      .select('*', { count: 'exact' });

    // 應用篩選條件
    if (status && status.length > 0) {
      query = query.in('status', status);
    }
    
    if (priority && priority.length > 0) {
      query = query.in('priority', priority);
    }
    
    if (category && category.length > 0) {
      query = query.overlaps('category', category);
    }
    
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }
    
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    
    if (due_date_from) {
      query = query.gte('due_date', due_date_from);
    }
    
    if (due_date_to) {
      query = query.lte('due_date', due_date_to);
    }
    
    if (is_public !== null) {
      query = query.eq('is_public', is_public === 'true');
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 權限篩選 - 只能看到自己的任務或公開任務
    if (phone) {
      query = query.or(`phone.eq.${phone},assigned_to.cs.{${phone}},is_public.eq.true`);
    }

    // 應用排序
    const sortOrder = sort_direction === 'desc' ? { ascending: false } : { ascending: true };
    
    if (sort_field === 'priority') {
      // 自定義優先級排序
      query = query.order('priority', sortOrder);
    } else {
      query = query.order(sort_field, sortOrder);
    }

    // 應用分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // 獲取統計資訊
    // 即時計算統計，避免依賴視圖
    const stats = {
      total_tasks: count || 0,
      pending_tasks: tasks?.filter((t: any) => t.status === 'pending').length || 0,
      in_progress_tasks: tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
      completed_tasks: tasks?.filter((t: any) => t.status === 'completed').length || 0,
      cancelled_tasks: tasks?.filter((t: any) => t.status === 'cancelled').length || 0,
      blocked_tasks: tasks?.filter((t: any) => t.status === 'blocked').length || 0,
      urgent_important_tasks: tasks?.filter((t: any) => t.priority === 'urgent_important').length || 0,
      important_not_urgent_tasks: tasks?.filter((t: any) => t.priority === 'important_not_urgent').length || 0,
      urgent_not_important_tasks: tasks?.filter((t: any) => t.priority === 'urgent_not_important').length || 0,
      not_urgent_not_important_tasks: tasks?.filter((t: any) => t.priority === 'not_urgent_not_important').length || 0,
      avg_progress: tasks?.length ? Math.round(tasks.reduce((s: number, t: any) => s + (t.progress_percentage || 0), 0) / tasks.length) : 0,
      avg_actual_duration: tasks?.length ? Math.round(tasks.reduce((s: number, t: any) => s + (t.actual_duration || 0), 0) / tasks.length) : 0
    };

    const pagination: Pagination = {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    };

    return NextResponse.json({
      tasks: tasks || [],
      pagination,
      stats: stats || {}
    });

  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 創建新任務
export async function POST(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();
    const body: CreateTaskForm = await request.json();
    
    // 驗證必填欄位
    if (!body.title || !body.priority) {
      return NextResponse.json(
        { error: 'Title and priority are required' },
        { status: 400 }
      );
    }

    // 創建任務
    const { data: task, error } = await (supabase as any)
      .from('hanami_task_list')
      .insert([{
        title: body.title,
        description: body.description,
        follow_up_content: body.follow_up_content,
        priority: body.priority,
        category: body.category,
        phone: body.phone,
        assigned_to: body.assigned_to && typeof body.assigned_to === 'string' && (body.assigned_to as string).trim() !== '' ? 
          (body.assigned_to as string).split(',').map(name => name.trim()).filter(name => name !== '') : 
          null,
        due_date: body.due_date && body.due_date.trim() !== '' ? body.due_date : null,
        time_block_start: body.time_block_start && body.time_block_start.trim() !== '' ? body.time_block_start : null,
        time_block_end: body.time_block_end && body.time_block_end.trim() !== '' ? body.time_block_end : null,
        is_public: body.is_public || false,
        project_id: body.project_id && body.project_id.trim() !== '' ? body.project_id : null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json(task, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

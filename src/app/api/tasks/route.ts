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
    const created_date = searchParams.getAll('created_date') as string[];
    const assigned_to = searchParams.get('assigned_to');
    const project_id = searchParams.get('project_id');
    const due_date_from = searchParams.get('due_date_from');
    const due_date_to = searchParams.get('due_date_to');
    const is_public = searchParams.get('is_public');
    const search = searchParams.get('search');
    const sort_field = searchParams.get('sort_by') || 'created_at';
    const sort_direction = searchParams.get('sort_order') || 'desc';
    const phone = searchParams.get('phone');
    const orgId = searchParams.get('orgId');
    const userRole = searchParams.get('userRole'); // passed from client

    // 構建查詢
    let query = supabase
      .from('hanami_task_list')
      .select('*', { count: 'exact' });

    // 添加 org_id 篩選（如果提供）
    // 注意：如果字段不存在，查詢會失敗，需要在執行時捕獲錯誤
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

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

    if (created_date && created_date.length > 0) {
      console.log('Date filter:', {
        selectedDates: created_date,
        totalDates: created_date.length
      });

      // 簡化邏輯：先獲取所有任務，然後在應用層篩選
      // 這樣可以避免複雜的 SQL 查詢問題
      const dateStrings = created_date.map(date => date);

      // 暫時移除日期篩選，在獲取數據後再篩選
      // 這不是最佳實踐，但可以確保功能正常工作
    }

    if (assigned_to) {
      // assigned_to 現在是陣列類型，使用 contains 查詢
      query = query.contains('assigned_to', [assigned_to]);
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

    // 權限篩選 - 根據用戶角色決定可見任務
    if (userRole && userRole !== 'super_admin') { // Super admin sees all
      // If visible_to_roles is NOT NULL, verify userRole is in it
      // Logic: (original filters) AND (visible_to_roles IS NULL OR visible_to_roles @> {userRole})
      // Note: supabase postgrest doesn't support complex OR with different columns easily in one chained call if mixed with ANDs
      // But we can filter specifically for visibility. 
      // Actually 'is' null check might be tricky combined with 'cs'.
      // Best way using PostgREST syntax:
      // or=(visible_to_roles.is.null,visible_to_roles.cs.{userRole})

      query = query.or(`visible_to_roles.is.null,visible_to_roles.cs.{${userRole}}`);
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

    let result;
    try {
      result = await query;
    } catch (queryError: any) {
      // 如果查詢失敗（可能是因為 org_id 字段不存在），嘗試不帶 org_id 的查詢
      if (orgId && (queryError?.message?.includes('org_id') || queryError?.code === '42703')) {
        console.warn('org_id 字段不存在，使用不帶機構篩選的查詢');
        // 重新構建查詢，不包含 org_id
        let fallbackQuery = supabase
          .from('hanami_task_list')
          .select('*', { count: 'exact' });

        // 重新應用其他篩選條件（與上面相同的邏輯）
        if (status && status.length > 0) {
          fallbackQuery = fallbackQuery.in('status', status);
        }
        if (priority && priority.length > 0) {
          fallbackQuery = fallbackQuery.in('priority', priority);
        }
        if (category && category.length > 0) {
          fallbackQuery = fallbackQuery.overlaps('category', category);
        }
        if (assigned_to) {
          fallbackQuery = fallbackQuery.contains('assigned_to', [assigned_to]);
        }
        if (project_id) {
          fallbackQuery = fallbackQuery.eq('project_id', project_id);
        }
        if (due_date_from) {
          fallbackQuery = fallbackQuery.gte('due_date', due_date_from);
        }
        if (due_date_to) {
          fallbackQuery = fallbackQuery.lte('due_date', due_date_to);
        }
        if (is_public !== null) {
          fallbackQuery = fallbackQuery.eq('is_public', is_public === 'true');
        }
        if (search) {
          fallbackQuery = fallbackQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const sortOrder = sort_direction === 'desc' ? { ascending: false } : { ascending: true };
        if (sort_field === 'priority') {
          fallbackQuery = fallbackQuery.order('priority', sortOrder);
        } else {
          fallbackQuery = fallbackQuery.order(sort_field, sortOrder);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        fallbackQuery = fallbackQuery.range(from, to);

        result = await fallbackQuery;
      } else {
        throw queryError;
      }
    }

    const { data: tasks, error, count } = result;

    if (error) {
      console.error('Error fetching tasks:', error);
      console.error('Query parameters:', { status, priority, category, created_date, assigned_to, project_id, phone, orgId });
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }

    // 在應用層進行日期篩選
    let filteredTasks = tasks || [];
    if (created_date && created_date.length > 0) {
      filteredTasks = filteredTasks.filter((task: any) => {
        if (!task.created_at) return false;
        const taskDate = new Date(task.created_at).toISOString().split('T')[0];
        return created_date.includes(taskDate);
      });
      console.log('Date filter applied:', {
        originalCount: tasks?.length || 0,
        filteredCount: filteredTasks.length,
        selectedDates: created_date
      });
    }

    // 獲取統計資訊
    // 即時計算統計，避免依賴視圖
    const stats = {
      total_tasks: filteredTasks.length,
      pending_tasks: filteredTasks?.filter((t: any) => t.status === 'pending').length || 0,
      in_progress_tasks: filteredTasks?.filter((t: any) => t.status === 'in_progress').length || 0,
      completed_tasks: filteredTasks?.filter((t: any) => t.status === 'completed').length || 0,
      cancelled_tasks: filteredTasks?.filter((t: any) => t.status === 'cancelled').length || 0,
      blocked_tasks: filteredTasks?.filter((t: any) => t.status === 'blocked').length || 0,
      urgent_important_tasks: filteredTasks?.filter((t: any) => t.priority === 'urgent_important').length || 0,
      important_not_urgent_tasks: filteredTasks?.filter((t: any) => t.priority === 'important_not_urgent').length || 0,
      urgent_not_important_tasks: filteredTasks?.filter((t: any) => t.priority === 'urgent_not_important').length || 0,
      not_urgent_not_important_tasks: filteredTasks?.filter((t: any) => t.priority === 'not_urgent_not_important').length || 0,
      avg_progress: filteredTasks?.length ? Math.round(filteredTasks.reduce((s: number, t: any) => s + (t.progress_percentage || 0), 0) / filteredTasks.length) : 0,
      avg_actual_duration: tasks?.length ? Math.round(tasks.reduce((s: number, t: any) => s + (t.actual_duration || 0), 0) / tasks.length) : 0
    };

    const pagination: Pagination = {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    };

    return NextResponse.json({
      tasks: filteredTasks || [],
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
    const taskData: any = {
      title: body.title,
      description: body.description,
      follow_up_content: body.follow_up_content,
      priority: body.priority,
      category: body.category,
      phone: body.phone,
      assigned_to: Array.isArray(body.assigned_to) ? body.assigned_to :
        (body.assigned_to && typeof body.assigned_to === 'string' && (body.assigned_to as string).trim() !== '' ?
          (body.assigned_to as string).split(',').map(name => name.trim()).filter(name => name !== '') : null),
      due_date: body.due_date && body.due_date.trim() !== '' ? body.due_date : null,
      time_block_start: body.time_block_start && body.time_block_start.trim() !== '' ? body.time_block_start : null,
      time_block_end: body.time_block_end && body.time_block_end.trim() !== '' ? body.time_block_end : null,
      is_public: body.is_public || false,
      project_id: body.project_id && body.project_id.trim() !== '' ? body.project_id : null,
      points: (body as any).points || 0,
      checklist: (body as any).checklist || [],
      visible_to_roles: (body as any).visible_to_roles || null,
      is_approved: false
    };

    // 如果提供了 org_id，添加到任務數據中
    // 如果字段不存在，插入會失敗，但我們會捕獲錯誤
    if ((body as any).org_id) {
      taskData.org_id = (body as any).org_id;
    }

    const { data: task, error } = await (supabase as any)
      .from('hanami_task_list')
      .insert([taskData])
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

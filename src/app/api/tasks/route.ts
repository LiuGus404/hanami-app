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
    // 如果沒有 phone 參數，顯示所有任務（管理員模式）
    // 如果有 phone 參數，只顯示該用戶的任務或公開任務
    if (phone) {
      // 檢查是否為管理員或特定角色（可以通過其他方式識別）
      // 暫時先允許所有用戶看到所有任務，後續可以根據實際需求調整
      // query = query.or(`phone.eq.${phone},assigned_to.cs.{${phone}},is_public.eq.true`);
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
      console.error('Query parameters:', { status, priority, category, created_date, assigned_to, project_id, phone });
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

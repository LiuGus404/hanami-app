import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// 獲取任務統計資訊
export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    // 構建查詢條件
    let query = supabase
      .from('hanami_task_list')
      .select('status, priority, progress_percentage, actual_duration', { count: 'exact' });

    // 權限篩選
    if (phone) {
      query = query.or(`phone.eq.${phone},assigned_to.eq.${phone},is_public.eq.true`);
    }

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Error fetching task stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch task stats' },
        { status: 500 }
      );
    }

    // 計算統計資訊
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
      avg_progress: tasks?.length > 0 ? 
        Math.round(tasks.reduce((sum: number, t: any) => sum + (t.progress_percentage || 0), 0) / tasks.length) : 0,
      avg_actual_duration: tasks?.length > 0 ? 
        Math.round(tasks.reduce((sum: number, t: any) => sum + (t.actual_duration || 0), 0) / tasks.length) : 0
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in GET /api/tasks/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

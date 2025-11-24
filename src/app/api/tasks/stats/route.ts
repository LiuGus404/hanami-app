import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// 獲取任務統計資訊
export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const orgId = searchParams.get('orgId');
    const userEmail = searchParams.get('userEmail');

    // 構建查詢條件
    let query = supabase
      .from('hanami_task_list')
      .select('status, priority, progress_percentage, actual_duration', { count: 'exact' });

    // 添加 org_id 篩選（如果提供）
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    // 權限篩選
    if (phone) {
      query = query.or(`phone.eq.${phone},assigned_to.cs.{${phone}},is_public.eq.true`);
    }

    let result;
    try {
      result = await query;
    } catch (queryError: any) {
      // 如果查詢失敗（可能是因為 org_id 字段不存在），嘗試不帶 org_id 的查詢
      if (orgId && (queryError?.message?.includes('org_id') || queryError?.code === '42703')) {
        console.warn('org_id 字段不存在，使用不帶機構篩選的查詢');
        let fallbackQuery = supabase
          .from('hanami_task_list')
          .select('status, priority, progress_percentage, actual_duration', { count: 'exact' });
        
        if (phone) {
          fallbackQuery = fallbackQuery.or(`phone.eq.${phone},assigned_to.cs.{${phone}},is_public.eq.true`);
        }
        
        result = await fallbackQuery;
      } else {
        throw queryError;
      }
    }

    const { data: tasks, error, count } = result;

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

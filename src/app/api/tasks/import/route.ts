import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

type IncomingTask = {
  id?: string;
  title: string;
  description?: string | null;
  follow_up_content?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'not_urgent_not_important';
  category?: string[] | null;
  phone?: string | null;
  assigned_to?: string | null;
  due_date?: string | null; // ISO string
  time_block_start?: string | null;
  time_block_end?: string | null;
  actual_duration?: number | null;
  progress_percentage?: number | null;
  is_public?: boolean | null;
  project_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function POST(request: NextRequest) {
  const supabase = createSaasAdminClient();

  try {
    const body = await request.json();

    const tasks: IncomingTask[] = Array.isArray(body) ? body : body?.tasks;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Body must be an array of tasks or { tasks: [...] }' }, { status: 400 });
    }

    // 基本欄位驗證和清理
    const sanitized = tasks.map((t) => ({
      id: t.id ?? undefined,
      title: t.title,
      description: t.description ?? null,
      follow_up_content: t.follow_up_content ?? null,
      status: t.status ?? 'pending',
      priority: t.priority,
      category: t.category ?? null,
      phone: t.phone ?? null,
      assigned_to: t.assigned_to && t.assigned_to.trim() !== '' ? 
        t.assigned_to.split(',').map(name => name.trim()).filter(name => name !== '') : 
        null,
      due_date: t.due_date && t.due_date.trim() !== '' ? t.due_date : null,
      time_block_start: t.time_block_start && t.time_block_start.trim() !== '' ? t.time_block_start : null,
      time_block_end: t.time_block_end && t.time_block_end.trim() !== '' ? t.time_block_end : null,
      actual_duration: t.actual_duration ?? null,
      progress_percentage: t.progress_percentage ?? null,
      is_public: t.is_public ?? false,
      project_id: t.project_id && t.project_id.trim() !== '' ? t.project_id : null,
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
    }));

    // 使用 upsert 以 id 為鍵，避免重複
    const { data, error } = await (supabase as any)
      .from('hanami_task_list')
      .upsert(sanitized, { onConflict: 'id' })
      .select();

    if (error) {
      return NextResponse.json({ error: 'Failed to import tasks', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: data?.length ?? 0, tasks: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}



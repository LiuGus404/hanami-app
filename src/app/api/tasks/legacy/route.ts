import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 舊系統 Supabase 配置
const OLD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const OLD_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: '缺少電話號碼參數' }, { status: 400 });
    }

    // 查詢舊系統的任務數據
    const { data: tasks, error } = await oldSupabase
      .from('hanami_task_list')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查詢舊系統任務失敗:', error);
      return NextResponse.json({ error: '查詢任務失敗' }, { status: 500 });
    }

    // 轉換數據格式以匹配新系統
    const formattedTasks = tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      follow_up_content: task.follow_up_content,
      status: task.status,
      priority: task.priority,
      category: task.category ? [task.category] : [],
      phone: task.phone,
      assigned_to: task.assigned_to ? [task.assigned_to] : [],
      due_date: task.due_date,
      time_block_start: task.time_block_start,
      time_block_end: task.time_block_end,
      actual_duration: task.actual_duration,
      progress_percentage: task.progress_percentage || 0,
      is_public: task.is_public || false,
      project_id: task.project_id,
      created_by: task.created_by,
      created_at: task.created_at,
      updated_at: task.updated_at
    })) || [];

    return NextResponse.json({ 
      tasks: formattedTasks,
      source: 'legacy_system'
    });

  } catch (error) {
    console.error('Legacy tasks API error:', error);
    return NextResponse.json({ error: '內部服務器錯誤' }, { status: 500 });
  }
}

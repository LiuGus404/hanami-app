import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

/**
 * POST /api/students/batch-upsert
 * 批量插入或更新學生（使用服務角色 key 繞過 RLS）
 * 
 * 請求體：
 * - students: 學生資料數組
 * - orgId: 機構 ID（用於權限驗證）
 * - userEmail: 用戶 email（用於權限驗證，可選）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students, orgId, userEmail } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: '請提供學生資料數組' },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少機構ID' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 確保所有學生都有 org_id
    const studentsWithOrgId = students.map((student: any) => ({
      ...student,
      org_id: orgId
    }));

    // 批量插入或更新學生
    const { data: upsertedStudents, error: upsertError } = await (supabase as any)
      .from('Hanami_Students')
      .upsert(studentsWithOrgId, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      console.error('批量插入或更新學生失敗:', upsertError);
      return NextResponse.json(
        { error: upsertError.message || '批量插入或更新學生失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: upsertedStudents,
      count: upsertedStudents?.length || 0
    });

  } catch (error: any) {
    console.error('批量插入或更新學生失敗:', error);
    return NextResponse.json(
      { error: error?.message || '批量插入或更新學生失敗' },
      { status: 500 }
    );
  }
}


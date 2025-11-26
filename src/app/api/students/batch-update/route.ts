import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

/**
 * POST /api/students/batch-update
 * 批量更新學生資訊（使用服務角色 key 繞過 RLS）
 * 
 * 請求體：
 * - studentIds: 學生 ID 數組
 * - updates: 要更新的欄位（例如：{ student_type: '已停用' }）
 * - orgId: 機構 ID（用於權限驗證）
 * - userEmail: 用戶 email（用於權限驗證，可選）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds, updates, orgId, userEmail } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: '請提供學生ID數組' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: '請提供要更新的欄位' },
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

    // 驗證所有學生是否屬於該機構
    const { data: studentsData, error: studentsError } = await (supabase as any)
      .from('Hanami_Students')
      .select('id, org_id')
      .in('id', studentIds);

    if (studentsError) {
      console.error('查詢學生失敗:', studentsError);
      return NextResponse.json(
        { error: '查詢學生失敗' },
        { status: 500 }
      );
    }

    if (!studentsData || studentsData.length === 0) {
      return NextResponse.json(
        { error: '找不到指定的學生' },
        { status: 404 }
      );
    }

    const students = studentsData as Array<{ id: string; org_id: string }>;

    // 檢查所有學生是否屬於該機構
    const invalidStudents = students.filter(s => s.org_id !== orgId);
    if (invalidStudents.length > 0) {
      return NextResponse.json(
        { error: `有 ${invalidStudents.length} 個學生不屬於該機構` },
        { status: 403 }
      );
    }

    // 批量更新學生資訊
    const { data: updatedStudents, error: updateError } = await (supabase as any)
      .from('Hanami_Students')
      .update(updates as any)
      .in('id', studentIds)
      .eq('org_id', orgId)
      .select();

    if (updateError) {
      console.error('批量更新學生資訊失敗:', updateError);
      return NextResponse.json(
        { error: updateError.message || '批量更新學生資訊失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedStudents,
      count: updatedStudents?.length || 0
    });

  } catch (error: any) {
    console.error('批量更新學生資訊失敗:', error);
    return NextResponse.json(
      { error: error?.message || '批量更新學生資訊失敗' },
      { status: 500 }
    );
  }
}


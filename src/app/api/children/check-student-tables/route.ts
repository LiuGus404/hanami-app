import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createSaasAdminClient();

    // 檢查各個表的狀態
    const checks: any = {
      parent_student_bindings: null,
      hanami_trial_students: null,
      Hanami_Students: null,
      hanami_children: null
    };

    // 檢查 parent_student_bindings
    try {
      const { count, error } = await adminClient
        .from('parent_student_bindings')
        .select('*', { count: 'exact', head: true });
      checks.parent_student_bindings = { success: !error, count, error: error?.message };
    } catch (e: any) {
      checks.parent_student_bindings = { success: false, error: e.message };
    }

    // 檢查 hanami_trial_students
    try {
      const { count, error } = await (adminClient as any)
        .from('hanami_trial_students')
        .select('*', { count: 'exact', head: true });
      checks.hanami_trial_students = { success: !error, count, error: error?.message };
    } catch (e: any) {
      checks.hanami_trial_students = { success: false, error: e.message };
    }

    // 檢查 Hanami_Students
    try {
      const { count, error } = await (adminClient as any)
        .from('Hanami_Students')
        .select('*', { count: 'exact', head: true });
      checks.Hanami_Students = { success: !error, count, error: error?.message };
    } catch (e: any) {
      checks.Hanami_Students = { success: false, error: e.message };
    }

    // 檢查 hanami_children
    try {
      const { count, error } = await adminClient
        .from('hanami_children')
        .select('*', { count: 'exact', head: true });
      checks.hanami_children = { success: !error, count, error: error?.message };
    } catch (e: any) {
      checks.hanami_children = { success: false, error: e.message };
    }

    return NextResponse.json({
      success: true,
      checks
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用戶 ID' }, { status: 400 });
    }

    const adminClient = createSaasAdminClient();

    // 1. 檢查綁定關係
    const { data: bindings, error: bindingError } = await adminClient
      .from('parent_student_bindings')
      .select('*')
      .eq('parent_id', userId)
      .eq('binding_status', 'active');

    if (bindingError) {
      return NextResponse.json({
        success: false,
        error: '查詢綁定關係失敗',
        details: bindingError.message
      });
    }

    // 2. 檢查試堂學生表
    const { data: trialStudents, error: trialError } = await (adminClient as any)
      .from('hanami_trial_students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes')
      .limit(5);

    // 3. 檢查常規學生表
    const { data: regularStudents, error: regularError } = await (adminClient as any)
      .from('Hanami_Students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes')
      .limit(5);

    return NextResponse.json({
      success: true,
      debug: {
        bindings: bindings || [],
        bindingsCount: bindings?.length || 0,
        trialStudents: trialStudents || [],
        trialStudentsCount: trialStudents?.length || 0,
        regularStudents: regularStudents || [],
        regularStudentsCount: regularStudents?.length || 0,
        bindingError: (bindingError as any)?.message,
        trialError: (trialError as any)?.message,
        regularError: (regularError as any)?.message
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

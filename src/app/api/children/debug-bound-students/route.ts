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

    console.log('綁定關係查詢結果:', { bindings, bindingError });

    // 2. 檢查試堂學生表
    const { data: trialStudents, error: trialError } = await (adminClient as any)
      .from('hanami_trial_students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes')
      .limit(5);

    console.log('試堂學生查詢結果:', { trialStudents, trialError });

    // 3. 檢查常規學生表
    const { data: regularStudents, error: regularError } = await (adminClient as any)
      .from('Hanami_Students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes')
      .limit(5);

    console.log('常規學生查詢結果:', { regularStudents, regularError });

    // 4. 如果有綁定關係，檢查具體的學生資料
    let specificStudentData = null;
    if (bindings && bindings.length > 0) {
      const studentIds = (bindings as any[]).map((b: any) => b.student_id);
      console.log('查找具體學生資料，學生 IDs:', studentIds);

      // 查詢試堂學生
      const { data: specificTrialStudents, error: specificTrialError } = await (adminClient as any)
        .from('hanami_trial_students')
        .select('*')
        .in('id', studentIds);

      // 查詢常規學生
      const { data: specificRegularStudents, error: specificRegularError } = await (adminClient as any)
        .from('Hanami_Students')
        .select('*')
        .in('id', studentIds);

      specificStudentData = {
        trialStudents: specificTrialStudents,
        trialError: specificTrialError,
        regularStudents: specificRegularStudents,
        regularError: specificRegularError
      };
    }

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        bindings: bindings || [],
        bindingsCount: bindings?.length || 0,
        bindingError: bindingError?.message,
        trialStudents: trialStudents || [],
        trialStudentsCount: trialStudents?.length || 0,
        trialError: trialError?.message,
        regularStudents: regularStudents || [],
        regularStudentsCount: regularStudents?.length || 0,
        regularError: regularError?.message,
        specificStudentData
      }
    });

  } catch (error) {
    console.error('調試綁定學生失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

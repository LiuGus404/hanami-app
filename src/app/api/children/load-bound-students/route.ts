import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    // 從查詢參數獲取用戶 ID
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用戶 ID' }, { status: 400 });
    }

    // 使用管理員客戶端查詢資料庫
    const adminClient = createSaasAdminClient();

    // 查詢家長綁定的學生資料
    const { data: bindings, error: bindingError } = await adminClient
      .from('parent_student_bindings')
      .select(`
        student_id,
        student_name,
        student_oid,
        institution,
        binding_type,
        binding_status,
        binding_date
      `)
      .eq('parent_id', userId)
      .eq('binding_status', 'active')
      .order('binding_date', { ascending: false });

    if (bindingError) {
      console.error('查詢綁定學生失敗:', bindingError);
      return NextResponse.json({ error: '查詢綁定學生失敗' }, { status: 500 });
    }

    if (!bindings || bindings.length === 0) {
      return NextResponse.json({
        success: true,
        students: []
      });
    }

    // 獲取學生詳細資料
    const studentIds = (bindings as any[]).map((b: any) => b.student_id);

    // 查詢試堂學生
    const { data: trialStudents, error: trialError } = await (adminClient as any)
      .from('hanami_trial_students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes, contact_number, parent_email')
      .in('id', studentIds);

    // 查詢常規學生
    const { data: regularStudents, error: regularError } = await (adminClient as any)
      .from('Hanami_Students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes, contact_number, parent_email')
      .in('id', studentIds);

    // 合併學生資料
    const allStudents = [
      ...(trialStudents || []).map((student: any) => ({
        ...student,
        source: 'trial',
        source_label: '試堂學生'
      })),
      ...(regularStudents || []).map((student: any) => ({
        ...student,
        source: 'regular',
        source_label: '常規學生'
      }))
    ];

    // 計算年齡並格式化資料
    const studentsWithAge = allStudents.map(student => {
      let ageMonths = 0;
      if (student.student_dob) {
        const birthDate = new Date(student.student_dob);
        const today = new Date();
        ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 +
          (today.getMonth() - birthDate.getMonth());
      }

      return {
        ...student,
        age_months: ageMonths,
        birth_date: student.student_dob,
        preferences: student.student_preference,
        health_notes: student.health_notes
      };
    });

    return NextResponse.json({
      success: true,
      students: studentsWithAge
    });

  } catch (error) {
    console.error('載入綁定學生資料失敗:', error);
    return NextResponse.json(
      { error: '載入學生資料失敗' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用戶 ID' }, { status: 400 });
    }

    // 1. 從 hanami-saas-system 查詢綁定關係
    const saasClient = createSaasAdminClient();
    const { data: bindings, error: bindingError } = await saasClient
      .from('parent_student_bindings')
      .select('*')
      .eq('parent_id', userId)
      .eq('binding_status', 'active');

    console.log('綁定關係查詢結果:', { bindings, bindingError });

    if (bindingError) {
      return NextResponse.json({ error: '查詢綁定關係失敗' }, { status: 500 });
    }

    if (!bindings || bindings.length === 0) {
      return NextResponse.json({
        success: true,
        students: []
      });
    }

    // 2. 從 hanami-ai-system 查詢學生詳細資料
    const oldSupabaseClient = getServerSupabaseClient();
    const studentIds = (bindings as any[]).map((b: any) => b.student_id);
    
    console.log('查找學生詳細資料，學生 IDs:', studentIds);
    
    // 查詢試堂學生
    const { data: trialStudents, error: trialError } = await (oldSupabaseClient as any)
      .from('hanami_trial_students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes, contact_number, parent_email')
      .in('id', studentIds);

    console.log('試堂學生查詢結果:', { trialStudents, trialError });

    // 查詢常規學生
    const { data: regularStudents, error: regularError } = await (oldSupabaseClient as any)
      .from('Hanami_Students')
      .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes, contact_number, parent_email')
      .in('id', studentIds);

    console.log('常規學生查詢結果:', { regularStudents, regularError });

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

    console.log('最終學生資料:', studentsWithAge);

    return NextResponse.json({
      success: true,
      students: studentsWithAge
    });

  } catch (error) {
    console.error('跨資料庫載入綁定學生資料失敗:', error);
    return NextResponse.json(
      { error: '載入學生資料失敗' },
      { status: 500 }
    );
  }
}

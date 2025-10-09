import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient, createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    // 獲取認證用戶
    const saasClient = createSaasClient();
    const { data: { user }, error: authError } = await saasClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    // 使用管理員客戶端查詢資料庫
    const adminClient = createSaasAdminClient();
    
    // 查詢所有學生資料（試堂和常規學生）
    const [trialStudents, regularStudents] = await Promise.all([
      adminClient
        .from('hanami_trial_students')
        .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes, contact_number, parent_email')
        .order('created_at', { ascending: false }),
      
      adminClient
        .from('Hanami_Students')
        .select('id, full_name, nick_name, student_dob, gender, student_preference, health_notes, contact_number, parent_email')
        .order('created_at', { ascending: false })
    ]);

    // 合併並格式化資料
    const allStudents = [
      ...(trialStudents.data || []).map((student: any) => ({
        ...student,
        source: 'trial',
        source_label: '試堂學生'
      })),
      ...(regularStudents.data || []).map((student: any) => ({
        ...student,
        source: 'regular',
        source_label: '常規學生'
      }))
    ];

    // 計算年齡（月數）
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
    console.error('載入現有學生資料失敗:', error);
    return NextResponse.json(
      { error: '載入學生資料失敗' },
      { status: 500 }
    );
  }
}

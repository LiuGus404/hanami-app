import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, phone, password } = body;

    console.log('開始測試教師插入:', { email, fullName, phone, password });

    // 1. 檢查表結構
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'hanami_employee')
      .order('ordinal_position');

    if (tableError) {
      console.error('獲取表結構錯誤:', tableError);
      return NextResponse.json({
        success: false,
        error: '獲取表結構失敗'
      }, { status: 500 });
    }

    console.log('表結構:', tableInfo);

    // 2. 檢查是否已存在相同郵箱的記錄
    const { data: existingTeacher, error: checkError } = await supabase
      .from('hanami_employee')
      .select('*')
      .eq('teacher_email', email);

    if (checkError) {
      console.error('檢查現有記錄錯誤:', checkError);
      return NextResponse.json({
        success: false,
        error: '檢查現有記錄失敗'
      }, { status: 500 });
    }

    if (existingTeacher && existingTeacher.length > 0) {
      return NextResponse.json({
        success: false,
        error: '已存在相同郵箱的教師記錄',
        existingRecord: existingTeacher[0]
      }, { status: 400 });
    }

    // 3. 嘗試插入教師記錄
    const teacherData = {
      teacher_email: email,
      teacher_fullname: fullName,
      teacher_nickname: fullName || '教師', // 確保 NOT NULL 欄位有值
      teacher_phone: phone || '',
      teacher_password: password || 'hanami123',
      teacher_role: 'teacher',
      teacher_status: 'active',
      teacher_background: '測試背景',
      teacher_bankid: '1234567890',
      teacher_address: '測試地址',
      teacher_dob: null
    };

    console.log('準備插入的數據:', teacherData);

    const { data: newTeacher, error: insertError } = await supabase
      .from('hanami_employee')
      .insert(teacherData)
      .select();

    if (insertError) {
      console.error('插入教師記錄錯誤:', insertError);
      return NextResponse.json({
        success: false,
        error: '插入教師記錄失敗',
        details: insertError,
        attemptedData: teacherData
      }, { status: 500 });
    }

    console.log('教師記錄插入成功:', newTeacher);

    // 4. 驗證插入結果
    const { data: verifyTeacher, error: verifyError } = await supabase
      .from('hanami_employee')
      .select('*')
      .eq('teacher_email', email)
      .single();

    if (verifyError) {
      console.error('驗證插入結果錯誤:', verifyError);
      return NextResponse.json({
        success: false,
        error: '驗證插入結果失敗',
        insertResult: newTeacher
      }, { status: 500 });
    }

    const result = {
      success: true,
      message: '教師記錄插入成功',
      tableStructure: tableInfo,
      insertedData: newTeacher,
      verifiedData: verifyTeacher,
      summary: {
        email: verifyTeacher.teacher_email,
        fullName: verifyTeacher.teacher_fullname,
        nickname: verifyTeacher.teacher_nickname,
        password: verifyTeacher.teacher_password ? '已設置' : '未設置',
        role: verifyTeacher.teacher_role,
        status: verifyTeacher.teacher_status
      }
    };

    console.log('測試結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('測試教師插入錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '測試過程中發生錯誤'
    }, { status: 500 });
  }
} 
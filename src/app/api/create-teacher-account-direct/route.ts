import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password = 'hanami123' } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    console.log(`直接創建教師帳號: ${email}`);

    // 1. 檢查權限記錄
    const { data: permissions, error: permError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('*, hanami_roles(*)')
      .eq('user_email', email)
      .eq('status', 'approved')
      .single();

    if (permError || !permissions) {
      console.error('權限記錄查詢錯誤:', permError);
      return NextResponse.json({
        success: false,
        error: '找不到已批准的權限記錄'
      }, { status: 404 });
    }

    console.log('找到權限記錄:', permissions);

    // 2. 檢查是否已有教師帳號
    const { data: existingTeacher, error: checkError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname')
      .eq('teacher_email', email)
      .single();

    if (existingTeacher) {
      return NextResponse.json({
        success: true,
        message: '教師帳號已存在',
        data: existingTeacher
      });
    }

    // 3. 創建教師帳號
    const teacherData = {
      teacher_email: email,
      teacher_fullname: email.split('@')[0], // 使用郵箱前綴作為姓名
      teacher_nickname: email.split('@')[0] || '教師',
      teacher_phone: '',
      teacher_password: password,
      teacher_role: 'teacher',
      teacher_status: 'active',
      teacher_background: '',
      teacher_bankid: '',
      teacher_address: '',
      teacher_dob: null
    };

    console.log('準備創建的教師數據:', teacherData);

    const { data: newTeacher, error: createError } = await supabase
      .from('hanami_employee')
      .insert(teacherData)
      .select()
      .single();

    if (createError) {
      console.error('創建教師帳號錯誤:', createError);
      return NextResponse.json({
        success: false,
        error: `創建教師帳號失敗: ${createError.message}`,
        details: createError
      }, { status: 500 });
    }

    console.log('教師帳號創建成功:', newTeacher);

    return NextResponse.json({
      success: true,
      message: '教師帳號創建成功',
      data: {
        id: newTeacher.id,
        email: newTeacher.teacher_email,
        fullname: newTeacher.teacher_fullname,
        nickname: newTeacher.teacher_nickname,
        status: newTeacher.teacher_status,
        password_set: !!newTeacher.teacher_password
      }
    });

  } catch (error: any) {
    console.error('直接創建教師帳號錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '創建教師帳號時發生錯誤',
      stack: error.stack
    }, { status: 500 });
  }
} 
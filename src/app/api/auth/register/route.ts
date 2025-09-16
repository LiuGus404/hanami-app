import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, role, additional_info } = await request.json();

    if (!email || !password || !full_name || !phone || !role) {
      return NextResponse.json({
        error: '缺少必要參數（電子郵件、密碼、姓名、電話、角色）'
      }, { status: 400 });
    }

    console.log('開始處理註冊:', { email, role });

    // 檢查電話號碼是否已被使用
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname')
      .eq('teacher_phone', phone)
      .maybeSingle();

    if (phoneCheckError) {
      console.error('檢查電話號碼失敗:', phoneCheckError);
      return NextResponse.json({
        error: '檢查電話號碼時發生錯誤'
      }, { status: 500 });
    }

    if (existingPhone) {
      console.error('電話號碼已被使用:', { 
        phone, 
        existingUser: existingPhone.teacher_email,
        existingName: existingPhone.teacher_fullname 
      });
      return NextResponse.json({
        error: '該電話號碼已註冊過，如需要請按忘記密碼'
      }, { status: 400 });
    }

    // 檢查是否已經存在任何類型的帳戶
    const existingAccounts = [];

    // 1. 檢查新權限系統
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'approved')
      .eq('is_active', true);

    if (permissionData && permissionData.length > 0) {
      existingAccounts.push('新權限系統帳戶');
    }

    // 2. 檢查管理員表
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id')
      .eq('admin_email', email)
      .single();

    if (adminData && !adminError) {
      existingAccounts.push('管理員帳戶');
    }

    // 3. 檢查教師表
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id')
      .eq('teacher_email', email)
      .single();

    if (teacherData && !teacherError) {
      existingAccounts.push('教師帳戶');
    }

    // 4. 檢查家長表
    const { data: parentData, error: parentError } = await supabase
      .from('hanami_parents')
      .select('id')
      .eq('parent_email', email)
      .single();

    if (parentData && !parentError) {
      existingAccounts.push('家長帳戶');
    }

    // 5. 檢查學生表（通過student_email）
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('student_email', email)
      .single();

    if (studentData && !studentError) {
      existingAccounts.push('學生帳戶');
    }

    // 6. 檢查學生表（通過parent_email）
    const { data: parentStudentData, error: parentStudentError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('parent_email', email)
      .single();

    if (parentStudentData && !parentStudentError) {
      existingAccounts.push('家長帳戶（通過學生資料）');
    }

    // 如果已經存在任何帳戶，拒絕註冊
    if (existingAccounts.length > 0) {
      return NextResponse.json({
        error: `此電子郵件已經存在以下帳戶：${existingAccounts.join('、')}。每個電子郵件只能建立一個帳戶。`
      }, { status: 400 });
    }

    // 檢查是否已經有相同的email申請
    const { data: existingRequests, error: checkError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email);

    if (checkError) {
      console.error('檢查重複郵箱錯誤:', checkError);
      return NextResponse.json({
        error: `檢查重複郵箱失敗: ${checkError.message}`
      }, { status: 500 });
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json({
        error: '此電子郵件已經有註冊申請，請等待審核或使用其他郵箱'
      }, { status: 400 });
    }

    // 創建註冊申請
    const { data: registrationData, error: registrationError } = await supabase
      .from('registration_requests')
      .insert({
        email,
        full_name,
        phone,
        role,
        status: 'pending',
        additional_info: {
          ...additional_info,
          password: password // 將密碼存儲在 additional_info 中
        }
      })
      .select()
      .single();

    if (registrationError) {
      console.error('創建註冊申請錯誤:', registrationError);
      return NextResponse.json({
        error: `創建註冊申請失敗: ${registrationError.message}`
      }, { status: 500 });
    }

    console.log('註冊申請創建成功:', registrationData);

    return NextResponse.json({
      success: true,
      message: '註冊申請已提交，請等待管理員審核',
      data: {
        id: registrationData.id,
        email: registrationData.email,
        full_name: registrationData.full_name,
        role: registrationData.role,
        status: registrationData.status
      }
    });

  } catch (error: any) {
    console.error('註冊錯誤:', error);
    return NextResponse.json({
      error: error.message || '註冊時發生錯誤'
    }, { status: 500 });
  }
} 
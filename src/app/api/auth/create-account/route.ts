import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { requestId, password } = await request.json();

    // 驗證管理員權限
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // 檢查是否為管理員
    const { data: adminData } = await supabase
      .from('hanami_admin')
      .select('*')
      .eq('admin_email', user.email)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '需要管理員權限' }, { status: 403 });
    }

    // 獲取註冊申請資訊
    const { data: registrationRequest, error: requestError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !registrationRequest) {
      return NextResponse.json({ error: '找不到註冊申請' }, { status: 404 });
    }

    if (registrationRequest.status !== 'approved') {
      return NextResponse.json({ error: '申請尚未通過審核' }, { status: 400 });
    }

    // 創建 Supabase Auth 用戶
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: registrationRequest.email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      console.error('創建 Auth 用戶失敗:', authError);
      return NextResponse.json({ error: '創建用戶帳號失敗' }, { status: 500 });
    }

    // 根據角色創建對應的資料表記錄
    let profileError = null;

    if (registrationRequest.role === 'teacher') {
      const { error } = await supabase
        .from('hanami_employee')
        .insert([
          {
            teacher_email: registrationRequest.email,
            teacher_fullname: registrationRequest.full_name,
            teacher_phone: registrationRequest.phone,
            teacher_status: 'active',
            teacher_role: 'teacher',
            teacher_background: registrationRequest.additional_info?.teacherBackground,
            teacher_bankid: registrationRequest.additional_info?.teacherBankId,
            teacher_address: registrationRequest.additional_info?.teacherAddress,
            teacher_dob: registrationRequest.additional_info?.teacherDob,
          },
        ]);
      profileError = error;
    } else if (registrationRequest.role === 'parent') {
      const { error } = await supabase
        .from('Hanami_Students')
        .insert([
          {
            parent_email: registrationRequest.email,
            full_name: registrationRequest.additional_info?.parentStudentName || '待填寫',
            contact_number: registrationRequest.phone || '待填寫',
            access_role: 'parent',
            student_type: '常規',
          },
        ]);
      profileError = error;
    } else if (registrationRequest.role === 'admin') {
      const { error } = await supabase
        .from('hanami_admin')
        .insert([
          {
            admin_email: registrationRequest.email,
            admin_name: registrationRequest.full_name,
            role: 'admin',
          },
        ]);
      profileError = error;
    }

    if (profileError) {
      console.error('創建用戶資料失敗:', profileError);
      // 如果創建資料失敗，刪除已創建的 Auth 用戶
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: '創建用戶資料失敗' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '用戶帳號創建成功',
      userId: authData.user.id 
    });

  } catch (error) {
    console.error('創建帳號錯誤:', error);
    return NextResponse.json({ error: '內部伺服器錯誤' }, { status: 500 });
  }
} 
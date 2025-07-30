import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        error: '缺少郵箱參數'
      }, { status: 400 });
    }

    console.log(`開始清理和創建用戶帳號: ${email}`);

    // 1. 檢查註冊申請
    const { data: registrationRequests, error: registrationError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email);

    if (registrationError) {
      console.error('查詢註冊申請錯誤:', registrationError);
      return NextResponse.json({
        error: '查詢註冊申請失敗'
      }, { status: 500 });
    }

    console.log(`找到 ${registrationRequests?.length || 0} 個註冊申請`);

    // 2. 檢查權限記錄
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select(`
        *,
        hanami_roles (
          role_name, display_name
        )
      `)
      .eq('user_email', email)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single();

    if (permissionError || !permissionData) {
      console.error('查詢權限記錄錯誤:', permissionError);
      return NextResponse.json({
        error: '未找到已批准的權限記錄'
      }, { status: 400 });
    }

    console.log('找到權限記錄:', permissionData);

    // 3. 檢查是否已存在用戶帳號
    const roleName = permissionData.hanami_roles?.role_name;
    let existingUser = null;

    if (roleName === 'admin') {
      const { data } = await supabase
        .from('hanami_admin')
        .select('*')
        .eq('admin_email', email)
        .single();
      existingUser = data;
    } else if (roleName === 'teacher') {
      const { data } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('teacher_email', email)
        .single();
      existingUser = data;
    } else if (roleName === 'parent') {
      const { data } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('parent_email', email)
        .single();
      existingUser = data;
    }

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '用戶帳號已存在',
        existingUser
      }, { status: 400 });
    }

    // 4. 創建用戶帳號
    let createdUser = null;
    const defaultPassword = 'hanami123';

    // 獲取註冊申請的詳細信息
    const latestRegistration = registrationRequests?.[0];
    const fullName = latestRegistration?.full_name || '用戶';
    const phone = latestRegistration?.phone || '';

    if (roleName === 'admin') {
      const { data, error } = await supabase
        .from('hanami_admin')
        .insert({
          admin_email: email,
          admin_name: fullName,
          admin_password: defaultPassword,
          role: 'admin'
        })
        .select()
        .single();

      if (error) throw error;
      createdUser = data;
    } else if (roleName === 'teacher') {
      const { data, error } = await supabase
        .from('hanami_employee')
        .insert({
          teacher_email: email,
          teacher_fullname: fullName,
          teacher_nickname: fullName,
          teacher_phone: phone,
          teacher_password: defaultPassword,
          teacher_role: 'teacher',
          teacher_status: 'full time'
        })
        .select()
        .single();

      if (error) throw error;
      createdUser = data;
    } else if (roleName === 'parent') {
      const { data, error } = await supabase
        .from('Hanami_Students')
        .insert({
          full_name: fullName,
          student_email: email,
          student_password: defaultPassword,
          parent_email: email,
          contact_number: phone,
          student_type: 'regular',
          course_type: '鋼琴',
          access_role: 'parent'
        })
        .select()
        .single();

      if (error) throw error;
      createdUser = data;
    }

    // 5. 清理重複的註冊申請（保留最新的）
    if (registrationRequests && registrationRequests.length > 1) {
      const latestId = registrationRequests[0].id;
      const { error: deleteError } = await supabase
        .from('registration_requests')
        .delete()
        .neq('id', latestId)
        .eq('email', email);

      if (deleteError) {
        console.error('清理重複註冊申請錯誤:', deleteError);
      } else {
        console.log('已清理重複的註冊申請');
      }
    }

    console.log('用戶帳號創建成功:', createdUser);

    return NextResponse.json({
      success: true,
      message: '用戶帳號創建成功',
      user: createdUser,
      defaultPassword,
      role: roleName,
      cleanedRegistrations: registrationRequests?.length || 0
    });

  } catch (error: any) {
    console.error('清理和創建用戶帳號錯誤:', error);
    return NextResponse.json({
      error: error.message || '清理和創建用戶帳號時發生錯誤'
    }, { status: 500 });
  }
} 
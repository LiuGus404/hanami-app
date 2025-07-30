import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, role = 'teacher' } = await request.json();

    if (!email) {
      return NextResponse.json({
        error: '缺少郵箱參數'
      }, { status: 400 });
    }

    console.log(`手動創建用戶帳號: ${email}, 角色: ${role}`);

    // 檢查是否已存在用戶帳號
    let existingUser = null;
    
    if (role === 'admin') {
      const { data } = await supabase
        .from('hanami_admin')
        .select('*')
        .eq('admin_email', email)
        .single();
      existingUser = data;
    } else if (role === 'teacher') {
      const { data } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('teacher_email', email)
        .single();
      existingUser = data;
    } else if (role === 'parent') {
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

    // 創建用戶帳號
    let createdUser = null;
    const defaultPassword = 'hanami123';

    if (role === 'admin') {
      const { data, error } = await supabase
        .from('hanami_admin')
        .insert({
          admin_email: email,
          admin_name: '管理員',
          admin_password: defaultPassword,
          role: 'admin'
        })
        .select()
        .single();

      if (error) throw error;
      createdUser = data;
    } else if (role === 'teacher') {
      const { data, error } = await supabase
        .from('hanami_employee')
        .insert({
          teacher_email: email,
          teacher_fullname: '教師',
          teacher_nickname: '教師',
          teacher_password: defaultPassword,
          teacher_role: 'teacher',
          teacher_status: 'full time'
        })
        .select()
        .single();

      if (error) throw error;
      createdUser = data;
    } else if (role === 'parent') {
      const { data, error } = await supabase
        .from('Hanami_Students')
        .insert({
          full_name: '學生',
          student_email: email,
          student_password: defaultPassword,
          parent_email: email,
          contact_number: '00000000',
          student_type: '常規',
          course_type: '鋼琴',
          access_role: 'parent'
        })
        .select()
        .single();

      if (error) throw error;
      createdUser = data;
    }

    console.log('用戶帳號創建成功:', createdUser);

    return NextResponse.json({
      success: true,
      message: '用戶帳號創建成功',
      user: createdUser,
      defaultPassword
    });

  } catch (error: any) {
    console.error('創建用戶帳號錯誤:', error);
    return NextResponse.json({
      error: error.message || '創建用戶帳號時發生錯誤'
    }, { status: 500 });
  }
} 
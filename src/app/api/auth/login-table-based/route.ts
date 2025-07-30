import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        error: '缺少郵箱或密碼'
      }, { status: 400 });
    }

    console.log('開始處理表格認證登入:', { email });

    // 1. 首先檢查 hanami_user_permissions_v2 表（新權限系統）
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select(`
        id, user_email, user_phone, role_id, status, is_active,
        hanami_roles (
          role_name, display_name
        )
      `)
      .eq('user_email', email)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single();

    if (permissionData && !permissionError) {
      // 檢查密碼
      const roleName = permissionData.hanami_roles?.[0]?.role_name;
      
      if (roleName === 'admin') {
        // 檢查管理員表
        const { data: adminData, error: adminError } = await supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email, admin_password')
          .eq('admin_email', email)
          .eq('admin_password', password)
          .single();

        if (adminData && !adminError) {
          return NextResponse.json({
            success: true,
            message: '登入成功',
            user: {
              id: adminData.id,
              email: adminData.admin_email || email,
              role: 'admin',
              name: adminData.admin_name || '管理員',
            }
          });
        }
      } else if (roleName === 'teacher') {
        // 檢查教師表
        const { data: teacherData, error: teacherError } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
          .eq('teacher_email', email)
          .eq('teacher_password', password)
          .single();

        if (teacherData && !teacherError) {
          // 獲取老師負責的學生ID列表
          const { data: students } = await supabase
            .from('Hanami_Students')
            .select('id')
            .eq('student_teacher', teacherData.id);

          return NextResponse.json({
            success: true,
            message: '登入成功',
            user: {
              id: teacherData.id,
              email: teacherData.teacher_email || email,
              role: 'teacher',
              name: teacherData.teacher_nickname || teacherData.teacher_fullname || '老師',
              relatedIds: students?.map(s => s.id) || [],
            }
          });
        }
      } else if (roleName === 'parent') {
        // 檢查家長表（新的家長帳戶系統）
        const { data: parentData, error: parentError } = await supabase
          .from('hanami_parents')
          .select('id, parent_name, parent_email, parent_password, parent_status')
          .eq('parent_email', email)
          .eq('parent_password', password)
          .eq('parent_status', 'active')
          .single();

        if (parentData && !parentError) {
          // 獲取家長連結的學生ID列表
          const { data: linkedStudents } = await supabase
            .from('hanami_parent_student_links')
            .select('student_id')
            .eq('parent_id', parentData.id);

          return NextResponse.json({
            success: true,
            message: '登入成功',
            user: {
              id: parentData.id,
              email: parentData.parent_email || email,
              role: 'parent',
              name: parentData.parent_name || '家長',
              relatedIds: linkedStudents?.map(s => s.student_id) || [],
            }
          });
        }
      }
    }

    // 2. 如果新權限系統沒有找到，回退到舊的驗證方式
    // 檢查管理員
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id, admin_name, admin_email, admin_password')
      .eq('admin_email', email)
      .eq('admin_password', password)
      .single();

    if (adminData && !adminError) {
      return NextResponse.json({
        success: true,
        message: '登入成功',
        user: {
          id: adminData.id,
          email: adminData.admin_email || email,
          role: 'admin',
          name: adminData.admin_name || '管理員',
        }
      });
    }

    // 檢查老師
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
      .eq('teacher_email', email)
      .eq('teacher_password', password)
      .single();

    if (teacherData && !teacherError) {
      // 獲取老師負責的學生ID列表
      const { data: students } = await supabase
        .from('Hanami_Students')
        .select('id')
        .eq('student_teacher', teacherData.id);

      return NextResponse.json({
        success: true,
        message: '登入成功',
        user: {
          id: teacherData.id,
          email: teacherData.teacher_email || email,
          role: 'teacher',
          name: teacherData.teacher_nickname || teacherData.teacher_fullname || '老師',
          relatedIds: students?.map(s => s.id) || [],
        }
      });
    }

    // 檢查學生/家長 (通過學生資料的 student_email 和 student_password)
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email, student_password, parent_email')
      .eq('student_email', email)
      .eq('student_password', password)
      .single();

    if (studentData && !studentError) {
      return NextResponse.json({
        success: true,
        message: '登入成功',
        user: {
          id: studentData.id,
          email: studentData.student_email || email,
          role: 'parent',
          name: `${studentData.full_name}的家長`,
          relatedIds: [studentData.id],
        }
      });
    }

    // 檢查家長 (通過學生資料的 parent_email 和 student_password)
    const { data: parentData, error: parentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, parent_email, student_password')
      .eq('parent_email', email)
      .eq('student_password', password)
      .single();

    if (parentData && !parentError) {
      return NextResponse.json({
        success: true,
        message: '登入成功',
        user: {
          id: parentData.id,
          email: parentData.parent_email || email,
          role: 'parent',
          name: `${parentData.full_name}的家長`,
          relatedIds: [parentData.id],
        }
      });
    }

    // 如果都沒有找到，返回錯誤
    return NextResponse.json({
      success: false,
      error: '帳號或密碼錯誤'
    }, { status: 401 });

  } catch (error: any) {
    console.error('表格認證登入錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '登入時發生錯誤'
    }, { status: 500 });
  }
} 
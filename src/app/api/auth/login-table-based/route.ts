import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password, selectedRole } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        error: '缺少郵箱或密碼'
      }, { status: 400 });
    }

    console.log('開始處理表格認證登入:', { email, selectedRole });

    // 如果沒有指定角色，先檢查有多少個帳戶
    if (!selectedRole) {
      const availableAccounts = [];

      // 1. 檢查新權限系統中的帳戶
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
        .eq('is_active', true);

      if (permissionData && permissionData.length > 0) {
        for (const permission of permissionData) {
          const roleName = Array.isArray(permission.hanami_roles) 
            ? (permission.hanami_roles as any)[0]?.role_name 
            : (permission.hanami_roles as any)?.role_name;
          
          if (roleName === 'admin') {
            const { data: adminData } = await supabase
              .from('hanami_admin')
              .select('id, admin_name, admin_email, admin_password')
              .eq('admin_email', email)
              .eq('admin_password', password)
              .single();

            if (adminData) {
              availableAccounts.push({
                role: 'admin',
                displayName: '管理員',
                name: adminData.admin_name || '管理員',
                id: adminData.id
              });
            }
          } else if (roleName === 'teacher') {
            const { data: teacherData } = await supabase
              .from('hanami_employee')
              .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
              .eq('teacher_email', email)
              .eq('teacher_password', password)
              .single();

            if (teacherData) {
              availableAccounts.push({
                role: 'teacher',
                displayName: '教師',
                name: teacherData.teacher_nickname || teacherData.teacher_fullname || '老師',
                id: teacherData.id
              });
            }
          } else if (roleName === 'parent') {
            const { data: parentData } = await supabase
              .from('hanami_parents')
              .select('id, parent_name, parent_email, parent_password, parent_status')
              .eq('parent_email', email)
              .eq('parent_password', password)
              .eq('parent_status', 'active')
              .single();

            if (parentData) {
              availableAccounts.push({
                role: 'parent',
                displayName: '家長',
                name: parentData.parent_name || '家長',
                id: parentData.id
              });
            }
          }
        }
      }

      // 2. 檢查舊系統中的帳戶
      // 檢查管理員
      const { data: adminData } = await supabase
        .from('hanami_admin')
        .select('id, admin_name, admin_email, admin_password')
        .eq('admin_email', email)
        .eq('admin_password', password)
        .single();

      if (adminData && !availableAccounts.find(acc => acc.role === 'admin')) {
        availableAccounts.push({
          role: 'admin',
          displayName: '管理員',
          name: adminData.admin_name || '管理員',
          id: adminData.id
        });
      }

      // 檢查老師
      const { data: teacherData } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
        .eq('teacher_email', email)
        .eq('teacher_password', password)
        .single();

      if (teacherData && !availableAccounts.find(acc => acc.role === 'teacher')) {
        availableAccounts.push({
          role: 'teacher',
          displayName: '教師',
          name: teacherData.teacher_nickname || teacherData.teacher_fullname || '老師',
          id: teacherData.id
        });
      }

      // 檢查學生/家長
      const { data: studentData } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_email, student_password, parent_email')
        .eq('student_email', email)
        .eq('student_password', password)
        .single();

      if (studentData && !availableAccounts.find(acc => acc.role === 'parent')) {
        availableAccounts.push({
          role: 'parent',
          displayName: '家長',
          name: `${studentData.full_name}的家長`,
          id: studentData.id
        });
      }

      // 檢查家長 (通過學生資料的 parent_email)
      const { data: parentData } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, parent_email, student_password')
        .eq('parent_email', email)
        .eq('student_password', password)
        .single();

      if (parentData && !availableAccounts.find(acc => acc.role === 'parent')) {
        availableAccounts.push({
          role: 'parent',
          displayName: '家長',
          name: `${parentData.full_name}的家長`,
          id: parentData.id
        });
      }

      // 如果找到多個帳戶，返回帳戶選擇
      if (availableAccounts.length > 1) {
        return NextResponse.json({
          success: false,
          multipleAccounts: true,
          accounts: availableAccounts,
          message: '檢測到多個帳戶，請選擇要登入的帳戶類型'
        });
      } else if (availableAccounts.length === 1) {
        // 只有一個帳戶，直接登入
        return await loginWithRole(email, password, availableAccounts[0].role);
      } else {
        // 沒有找到帳戶
        return NextResponse.json({
          success: false,
          error: '帳號或密碼錯誤'
        }, { status: 401 });
      }
    } else {
      // 如果指定了角色，直接登入
      return await loginWithRole(email, password, selectedRole);
    }

  } catch (error: any) {
    console.error('表格認證登入錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '登入時發生錯誤'
    }, { status: 500 });
  }
}

// 根據角色登入的輔助函數
async function loginWithRole(email: string, password: string, role: string) {
  // 1. 首先檢查新權限系統
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
      const roleName = permissionData.hanami_roles?.[0]?.role_name;
      
    if (roleName === role) {
      if (role === 'admin') {
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
      } else if (role === 'teacher') {
        const { data: teacherData, error: teacherError } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
          .eq('teacher_email', email)
          .eq('teacher_password', password)
          .single();

        if (teacherData && !teacherError) {
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
      } else if (role === 'parent') {
        const { data: parentData, error: parentError } = await supabase
          .from('hanami_parents')
          .select('id, parent_name, parent_email, parent_password, parent_status')
          .eq('parent_email', email)
          .eq('parent_password', password)
          .eq('parent_status', 'active')
          .single();

        if (parentData && !parentError) {
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
    }

  // 2. 回退到舊的驗證方式
  if (role === 'admin') {
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
  } else if (role === 'teacher') {
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
      .eq('teacher_email', email)
      .eq('teacher_password', password)
      .single();

    if (teacherData && !teacherError) {
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
  } else if (role === 'parent') {
    // 檢查學生/家長
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

    // 檢查家長 (通過學生資料的 parent_email)
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
    }

    return NextResponse.json({
      success: false,
      error: '帳號或密碼錯誤'
    }, { status: 401 });
} 
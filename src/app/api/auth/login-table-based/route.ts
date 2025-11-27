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
        // 沒有找到帳戶，提供更具體的錯誤訊息
        // 先檢查郵箱是否存在
        const emailExists = await checkEmailExists(email);
        
        if (!emailExists) {
          return NextResponse.json({
            success: false,
            error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。'
          }, { status: 401 });
        } else {
          return NextResponse.json({
            success: false,
            error: '密碼錯誤。請確認您輸入的密碼是否正確，注意大小寫。如果忘記密碼，請使用忘記密碼功能。'
          }, { status: 401 });
        }
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

    // 提供更具體的錯誤訊息
    // 先檢查郵箱是否存在（不檢查密碼），以確定是郵箱未註冊還是密碼錯誤
    const emailExists = await checkEmailExists(email);
    
    if (!emailExists) {
      return NextResponse.json({
        success: false,
        error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。'
      }, { status: 401 });
    } else {
      // 郵箱存在但密碼錯誤
      return NextResponse.json({
        success: false,
        error: '密碼錯誤。請確認您輸入的密碼是否正確，注意大小寫。如果忘記密碼，請使用忘記密碼功能。'
      }, { status: 401 });
    }
}

// 檢查郵箱是否存在的輔助函數（不檢查密碼，只檢查郵箱是否存在）
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log('開始檢查郵箱是否存在:', email);
    
    // 檢查新權限系統
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id')
      .eq('user_email', email)
      .limit(1);

    if (permissionError) {
      console.error('檢查權限系統時發生錯誤:', permissionError);
    } else if (permissionData && permissionData.length > 0) {
      console.log('在權限系統中找到郵箱');
      return true;
    }

    // 檢查管理員表
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id')
      .eq('admin_email', email)
      .limit(1);

    if (adminError) {
      console.error('檢查管理員表時發生錯誤:', adminError);
    } else if (adminData && adminData.length > 0) {
      console.log('在管理員表中找到郵箱');
      return true;
    }

    // 檢查教師表
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id')
      .eq('teacher_email', email)
      .limit(1);

    if (teacherError) {
      console.error('檢查教師表時發生錯誤:', teacherError);
    } else if (teacherData && teacherData.length > 0) {
      console.log('在教師表中找到郵箱');
      return true;
    }

    // 檢查家長表
    const { data: parentData, error: parentError } = await supabase
      .from('hanami_parents')
      .select('id')
      .eq('parent_email', email)
      .limit(1);

    if (parentError) {
      console.error('檢查家長表時發生錯誤:', parentError);
    } else if (parentData && parentData.length > 0) {
      console.log('在家長表中找到郵箱');
      return true;
    }

    // 檢查學生表（通過student_email）
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('student_email', email)
      .limit(1);

    if (studentError) {
      console.error('檢查學生表（student_email）時發生錯誤:', studentError);
    } else if (studentData && studentData.length > 0) {
      console.log('在學生表（student_email）中找到郵箱');
      return true;
    }

    // 檢查學生表（通過parent_email）
    const { data: parentStudentData, error: parentStudentError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('parent_email', email)
      .limit(1);

    if (parentStudentError) {
      console.error('檢查學生表（parent_email）時發生錯誤:', parentStudentError);
    } else if (parentStudentData && parentStudentData.length > 0) {
      console.log('在學生表（parent_email）中找到郵箱');
      return true;
    }

    console.log('在所有表中都沒有找到郵箱');
    return false;
  } catch (error) {
    console.error('檢查郵箱存在性時發生異常:', error);
    // 如果檢查失敗，返回 false 以顯示郵箱未註冊的錯誤（保守策略）
    return false;
  }
} 
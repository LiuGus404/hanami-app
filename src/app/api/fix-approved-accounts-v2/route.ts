import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { email } = body;

    console.log('開始修復已批准的帳號:', email);

    // 1. 查找已批准的註冊申請
    const { data: approvedRequests, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('status', 'approved')
      .eq('email', email);

    if (fetchError) {
      console.error('查找註冊申請錯誤:', fetchError);
      return NextResponse.json({
        success: false,
        error: '查找註冊申請失敗'
      }, { status: 500 });
    }

    if (!approvedRequests || approvedRequests.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到已批准的註冊申請'
      }, { status: 404 });
    }

    const approvedRequest = approvedRequests[0];
    console.log('找到已批准的申請:', approvedRequest);

    // 2. 檢查是否已有權限記錄
    const { data: existingPermissions } = await supabase
      .from('hanami_user_permissions_v2')
      .select('*')
      .eq('user_email', email);

    let permissionCreated = false;
    if (!existingPermissions || existingPermissions.length === 0) {
      // 創建權限記錄
      const roleId = await getRoleId(approvedRequest.role);
      const { error: permError } = await supabase
        .from('hanami_user_permissions_v2')
        .insert({
          user_email: approvedRequest.email,
          user_phone: approvedRequest.phone,
          role_id: roleId,
          status: 'approved',
          is_active: true
        });

      if (permError) {
        console.error('創建權限記錄錯誤:', permError);
        return NextResponse.json({
          success: false,
          error: '創建權限記錄失敗'
        }, { status: 500 });
      }

      permissionCreated = true;
      console.log('權限記錄創建成功');
    }

    // 3. 檢查是否已有用戶帳號
    let userAccountCreated = false;
    const userPassword = approvedRequest.additional_info?.password || 'hanami123';

    switch (approvedRequest.role) {
      case 'admin': {
        const { error } = await supabase
          .from('hanami_admin')
          .insert({
            admin_email: approvedRequest.email,
            admin_name: approvedRequest.full_name,
            role: 'admin',
            admin_password: userPassword
          });
        
        if (error) {
          console.error('創建管理員帳號錯誤:', error);
          return NextResponse.json({
            success: false,
            error: '創建管理員帳號失敗'
          }, { status: 500 });
        }
        userAccountCreated = true;
        console.log('管理員帳號創建成功');
        break;
      }
      
      case 'teacher': {
        const { error } = await supabase
          .from('hanami_employee')
          .insert({
            teacher_email: approvedRequest.email,
            teacher_fullname: approvedRequest.full_name,
            teacher_nickname: approvedRequest.full_name || '教師',
            teacher_phone: approvedRequest.phone || '',
            teacher_password: userPassword,
            teacher_role: 'teacher',
            teacher_status: 'active',
            teacher_background: approvedRequest.additional_info?.teacherBackground || '',
            teacher_bankid: approvedRequest.additional_info?.teacherBankId || '',
            teacher_address: approvedRequest.additional_info?.teacherAddress || '',
            teacher_dob: approvedRequest.additional_info?.teacherDob || null
          });
        
        if (error) {
          console.error('創建教師帳號錯誤:', error);
          return NextResponse.json({
            success: false,
            error: '創建教師帳號失敗'
          }, { status: 500 });
        }
        userAccountCreated = true;
        console.log('教師帳號創建成功');
        break;
      }
      
      case 'parent': {
        const { error } = await supabase
          .from('hanami_parents')
          .insert({
            parent_email: approvedRequest.email,
            parent_name: approvedRequest.full_name,
            parent_phone: approvedRequest.phone || '',
            parent_password: userPassword,
            parent_address: approvedRequest.additional_info?.address || '',
            parent_status: 'active',
            parent_notes: approvedRequest.additional_info?.notes || ''
          });
        
        if (error) {
          console.error('創建家長帳號錯誤:', error);
          return NextResponse.json({
            success: false,
            error: '創建家長帳號失敗'
          }, { status: 500 });
        }
        userAccountCreated = true;
        console.log('家長帳號創建成功');
        break;
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `不支援的角色類型: ${approvedRequest.role}`
        }, { status: 400 });
    }

    const result = {
      success: true,
      message: '修復完成',
      email: email,
      role: approvedRequest.role,
      permissionCreated,
      userAccountCreated,
      password: userPassword,
      summary: {
        registrationRequest: true,
        permissionRecord: permissionCreated || (existingPermissions && existingPermissions.length > 0),
        userAccount: userAccountCreated
      }
    };

    console.log('修復結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('修復已批准帳號錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '修復過程中發生錯誤'
    }, { status: 500 });
  }
}

// 獲取角色 ID
async function getRoleId(roleName: string): Promise<string> {
  const { data, error } = await supabase
    .from('hanami_roles')
    .select('id')
    .eq('role_name', roleName)
    .single();

  if (error) {
    // 如果角色不存在，創建默認角色
    const { data: newRole, error: createError } = await supabase
      .from('hanami_roles')
      .insert({
        role_name: roleName,
        role_description: `${roleName} 角色`,
        permissions: getDefaultPermissions(roleName)
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return newRole.id;
  }

  return data.id;
}

// 獲取默認權限
function getDefaultPermissions(roleName: string) {
  switch (roleName) {
    case 'admin':
      return {
        pages: ['admin', 'students', 'teachers', 'permissions'],
        features: ['manage_users', 'manage_data', 'view_reports'],
        data_access: 'all'
      };
    case 'teacher':
      return {
        pages: ['teacher', 'students', 'lessons'],
        features: ['view_students', 'manage_lessons'],
        data_access: 'assigned_students'
      };
    case 'parent':
      return {
        pages: ['parent', 'student_progress'],
        features: ['view_child_progress'],
        data_access: 'own_children'
      };
    default:
      return {
        pages: [],
        features: [],
        data_access: 'none'
      };
  }
} 
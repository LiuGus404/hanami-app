import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 獲取所有角色
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'roles':
        return await getRoles();
      case 'user_permissions':
        return await getUserPermissions(request);
      case 'templates':
        return await getTemplates();
      case 'applications':
        return await getApplications();
      case 'audit_logs':
        return await getAuditLogs();
      case 'usage_stats':
        return await getUsageStats();
      default:
        return NextResponse.json({ error: '無效的查詢類型' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('權限API錯誤:', error);
    return NextResponse.json({
      error: error.message || '權限查詢時發生錯誤'
    }, { status: 500 });
  }
}

// 創建或更新權限
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'create_role':
        return await createRole(data);
      case 'update_role':
        return await updateRole(data);
      case 'create_user_permission':
        return await createUserPermission(data);
      case 'update_user_permission':
        return await updateUserPermission(data);
      case 'create_template':
        return await createTemplate(data);
      case 'submit_application':
        return await submitApplication(data);
      case 'approve_application':
        return await approveApplication(data);
      case 'reject_application':
        return await rejectApplication(data);
      default:
        return NextResponse.json({ error: '無效的操作' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('權限API錯誤:', error);
    return NextResponse.json({
      error: error.message || '權限操作時發生錯誤'
    }, { status: 500 });
  }
}

// 刪除權限
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID參數' }, { status: 400 });
    }

    switch (type) {
      case 'role':
        return await deleteRole(id);
      case 'user_permission':
        return await deleteUserPermission(id);
      case 'template':
        return await deleteTemplate(id);
      case 'application':
        return await deleteApplication(id);
      default:
        return NextResponse.json({ error: '無效的刪除類型' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('權限API錯誤:', error);
    return NextResponse.json({
      error: error.message || '刪除操作時發生錯誤'
    }, { status: 500 });
  }
}

// 輔助函數

async function getRoles() {
  const { data, error } = await supabase
    .from('hanami_roles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getUserPermissions(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('user_email');

  let query = (supabase as any)
    .from('hanami_user_permissions_v2')
    .select(`
      *,
      hanami_roles (
        role_name,
        display_name,
        permissions
      )
    `)
    .order('created_at', { ascending: false });

  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  const { data, error } = await query;

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getTemplates() {
  const { data, error } = await supabase
    .from('hanami_permission_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getApplications() {
  const { data, error } = await supabase
    .from('hanami_permission_applications')
    .select(`
      *,
      hanami_roles!requested_role_id (
        role_name,
        display_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getAuditLogs() {
  const { data, error } = await supabase
    .from('hanami_permission_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getUsageStats() {
  const { data, error } = await supabase
    .from('hanami_permission_usage_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function createRole(data: any) {
  const { data: result, error } = await supabase
    .from('hanami_roles')
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '角色創建成功',
    data: result
  });
}

async function updateRole(data: any) {
  const { id, ...updateData } = data;

  const { data: result, error } = await supabase
    .from('hanami_roles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '角色更新成功',
    data: result
  });
}

async function createUserPermission(data: any) {
  const { data: result, error } = await (supabase as any)
    .from('hanami_user_permissions_v2')
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '用戶權限創建成功',
    data: result
  });
}

async function updateUserPermission(data: any) {
  const { id, ...updateData } = data;

  const { data: result, error } = await (supabase as any)
    .from('hanami_user_permissions_v2')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '用戶權限更新成功',
    data: result
  });
}

async function createTemplate(data: any) {
  const { data: result, error } = await supabase
    .from('hanami_permission_templates')
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '權限模板創建成功',
    data: result
  });
}

async function submitApplication(data: any) {
  const { data: result, error } = await supabase
    .from('hanami_permission_applications')
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '權限申請提交成功',
    data: result
  });
}

async function approveApplication(data: any) {
  const { id, approved_by, review_notes, approved_permissions } = data;

  // 更新申請狀態
  const { data: application, error: applicationError } = await supabase
    .from('hanami_permission_applications')
    .update({
      status: 'approved',
      reviewed_by: approved_by,
      reviewed_at: new Date().toISOString(),
      review_notes,
      approved_permissions
    })
    .eq('id', id)
    .select()
    .single();

  if (applicationError) throw applicationError;

  // 創建用戶權限記錄
  const { error: permissionError } = await (supabase as any)
    .from('hanami_user_permissions_v2')
    .insert({
      user_email: application.applicant_email,
      user_phone: application.applicant_phone,
      role_id: application.requested_role_id,
      status: 'approved',
      approved_by,
      approved_at: new Date().toISOString(),
      custom_permissions: approved_permissions
    });

  if (permissionError) throw permissionError;

  // 記錄審計日誌
  await supabase
    .from('hanami_permission_audit_logs')
    .insert({
      admin_id: approved_by,
      target_user_email: application.applicant_email,
      action_type: 'grant',
      new_permissions: approved_permissions,
      reason: review_notes
    });

  return NextResponse.json({
    success: true,
    message: '權限申請已批准',
    data: application
  });
}

async function rejectApplication(data: any) {
  const { id, reviewed_by, review_notes } = data;

  const { data: result, error } = await supabase
    .from('hanami_permission_applications')
    .update({
      status: 'rejected',
      reviewed_by,
      reviewed_at: new Date().toISOString(),
      review_notes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // 記錄審計日誌
  await supabase
    .from('hanami_permission_audit_logs')
    .insert({
      admin_id: reviewed_by,
      target_user_email: result.applicant_email,
      action_type: 'revoke',
      new_permissions: {},
      reason: review_notes
    });

  return NextResponse.json({
    success: true,
    message: '權限申請已拒絕',
    data: result
  });
}

async function deleteRole(id: string) {
  const { error } = await supabase
    .from('hanami_roles')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '角色刪除成功'
  });
}

async function deleteUserPermission(id: string) {
  const { error } = await (supabase as any)
    .from('hanami_user_permissions_v2')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '用戶權限刪除成功'
  });
}

async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('hanami_permission_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '權限模板刪除成功'
  });
}

async function deleteApplication(id: string) {
  const { error } = await supabase
    .from('hanami_permission_applications')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: '權限申請刪除成功'
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role = 'teacher' } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    console.log(`直接創建權限記錄: ${email}, 角色: ${role}`);

    // 1. 檢查是否已有權限記錄
    const { data: existingPermissions, error: checkError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id, user_email, status')
      .eq('user_email', email)
      .single();

    if (existingPermissions) {
      return NextResponse.json({
        success: true,
        message: '權限記錄已存在',
        data: existingPermissions
      });
    }

    // 2. 獲取角色ID
    const { data: roleData, error: roleError } = await supabase
      .from('hanami_roles')
      .select('id, role_name')
      .eq('role_name', role)
      .single();

    if (roleError || !roleData) {
      console.error('角色查詢錯誤:', roleError);
      return NextResponse.json({
        success: false,
        error: `找不到角色: ${role}`
      }, { status: 404 });
    }

    console.log('找到角色:', roleData);

    // 3. 創建權限記錄
    const permissionData = {
      user_email: email,
      user_phone: '',
      role_id: roleData.id,
      status: 'approved',
      is_active: true
    };

    console.log('準備創建的權限數據:', permissionData);

    const { data: newPermission, error: createError } = await supabase
      .from('hanami_user_permissions_v2')
      .insert(permissionData)
      .select('*, hanami_roles(*)')
      .single();

    if (createError) {
      console.error('創建權限記錄錯誤:', createError);
      return NextResponse.json({
        success: false,
        error: `創建權限記錄失敗: ${createError.message}`,
        details: createError
      }, { status: 500 });
    }

    console.log('權限記錄創建成功:', newPermission);

    return NextResponse.json({
      success: true,
      message: '權限記錄創建成功',
      data: {
        id: newPermission.id,
        email: newPermission.user_email,
        role: newPermission.hanami_roles?.role_name,
        status: newPermission.status,
        created_at: newPermission.created_at
      }
    });

  } catch (error: any) {
    console.error('直接創建權限記錄錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '創建權限記錄時發生錯誤',
      stack: error.stack
    }, { status: 500 });
  }
} 
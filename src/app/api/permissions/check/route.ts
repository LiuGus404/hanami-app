import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 檢查用戶權限
export async function POST(request: NextRequest) {
  try {
    const { user_email, resource_type, operation, resource_id } = await request.json();

    if (!user_email || !resource_type || !operation) {
      return NextResponse.json({
        error: '缺少必要參數: user_email, resource_type, operation'
      }, { status: 400 });
    }

    // 使用資料庫函數檢查權限
    const { data: hasPermission, error } = await supabase
      .rpc('check_user_permission', {
        p_user_email: user_email,
        p_resource_type: resource_type,
        p_operation: operation,
        p_resource_id: resource_id || null
      });

    if (error) {
      console.error('權限檢查錯誤:', error);
      return NextResponse.json({
        error: '權限檢查失敗',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      has_permission: hasPermission,
      user_email,
      resource_type,
      operation,
      resource_id
    });

  } catch (error: any) {
    console.error('權限檢查API錯誤:', error);
    return NextResponse.json({
      error: error.message || '權限檢查時發生錯誤'
    }, { status: 500 });
  }
}

// 批量檢查權限
export async function PUT(request: NextRequest) {
  try {
    const { user_email, permissions } = await request.json();

    if (!user_email || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({
        error: '缺少必要參數: user_email, permissions (陣列)'
      }, { status: 400 });
    }

    const results = [];

    for (const permission of permissions) {
      const { resource_type, operation, resource_id } = permission;

      if (!resource_type || !operation) {
        results.push({
          resource_type,
          operation,
          resource_id,
          has_permission: false,
          error: '缺少必要參數'
        });
        continue;
      }

      try {
        const { data: hasPermission, error } = await supabase
          .rpc('check_user_permission', {
            p_user_email: user_email,
            p_resource_type: resource_type,
            p_operation: operation,
            p_resource_id: resource_id || null
          });

        results.push({
          resource_type,
          operation,
          resource_id,
          has_permission: hasPermission || false,
          error: error ? error.message : null
        });
      } catch (error: any) {
        results.push({
          resource_type,
          operation,
          resource_id,
          has_permission: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      user_email,
      results
    });

  } catch (error: any) {
    console.error('批量權限檢查API錯誤:', error);
    return NextResponse.json({
      error: error.message || '批量權限檢查時發生錯誤'
    }, { status: 500 });
  }
}

// 獲取用戶權限摘要
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user_email');

    if (!userEmail) {
      return NextResponse.json({
        error: '缺少必要參數: user_email'
      }, { status: 400 });
    }

    // 獲取用戶權限記錄
    const { data: userPermissions, error: permissionError } = await (supabase as any)
      .from('hanami_user_permissions_v2')
      .select(`
        *,
        hanami_roles (
          role_name,
          display_name,
          permissions
        )
      `)
      .eq('user_email', userEmail)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single();

    if (permissionError) {
      return NextResponse.json({
        error: '用戶權限記錄不存在或未獲批准',
        details: permissionError.message
      }, { status: 404 });
    }

    // 獲取權限使用統計
    const { data: usageStats, error: statsError } = await supabase
      .from('hanami_permission_usage_stats')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(10);

    // 構建權限摘要
    const permissionSummary = {
      user_email: userEmail,
      role: {
        name: userPermissions.hanami_roles.role_name,
        display_name: userPermissions.hanami_roles.display_name,
        permissions: userPermissions.hanami_roles.permissions
      },
      custom_permissions: userPermissions.custom_permissions,
      student_access_list: userPermissions.student_access_list || [],
      page_access_list: userPermissions.page_access_list || [],
      feature_access_list: userPermissions.feature_access_list || [],
      data_access_config: userPermissions.data_access_config,
      expires_at: userPermissions.expires_at,
      recent_usage: usageStats || [],
      total_permissions: {
        pages: Object.keys(userPermissions.hanami_roles.permissions.pages || {}).length,
        features: Object.keys(userPermissions.hanami_roles.permissions.features || {}).length,
        data_types: Object.keys(userPermissions.hanami_roles.permissions.data || {}).length
      }
    };

    return NextResponse.json({
      success: true,
      data: permissionSummary
    });

  } catch (error: any) {
    console.error('權限摘要API錯誤:', error);
    return NextResponse.json({
      error: error.message || '獲取權限摘要時發生錯誤'
    }, { status: 500 });
  }
} 
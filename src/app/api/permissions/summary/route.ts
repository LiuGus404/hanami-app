import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get('user_email');

    if (!user_email) {
      return NextResponse.json(
        { error: '缺少用戶郵箱參數' },
        { status: 400 }
      );
    }

    // 獲取用戶權限記錄
    const { data: userPermission, error: userError } = await supabase
      .from('hanami_user_permissions_v2')
      .select(`
        *,
        hanami_roles (
          id,
          role_name,
          display_name,
          permissions
        )
      `)
      .eq('user_email', user_email)
      .eq('is_active', true)
      .single();

    if (userError) {
      console.error('獲取用戶權限失敗:', userError);
      return NextResponse.json(
        { error: '獲取用戶權限失敗' },
        { status: 500 }
      );
    }

    if (!userPermission) {
      return NextResponse.json(
        { error: '用戶權限記錄不存在' },
        { status: 404 }
      );
    }

    // 構建權限摘要
    const summary = {
      user_email: userPermission.user_email,
      role: {
        id: userPermission.role_id,
        name: userPermission.hanami_roles?.role_name,
        display_name: userPermission.hanami_roles?.display_name,
        permissions: userPermission.hanami_roles?.permissions,
      },
      status: userPermission.status,
      is_active: userPermission.is_active,
      custom_permissions: userPermission.custom_permissions,
      student_access_list: userPermission.student_access_list || [],
      page_access_list: userPermission.page_access_list || [],
      feature_access_list: userPermission.feature_access_list || [],
      data_access_config: userPermission.data_access_config,
      expires_at: userPermission.expires_at,
      created_at: userPermission.created_at,
      updated_at: userPermission.updated_at,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('權限摘要API錯誤:', error);
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
} 
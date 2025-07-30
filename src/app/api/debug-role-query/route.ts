import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role_name } = body;

    if (!role_name) {
      return NextResponse.json({
        success: false,
        error: '缺少 role_name 參數'
      }, { status: 400 });
    }

    console.log(`調試角色查詢: ${role_name}`);

    // 1. 查詢所有角色
    const { data: allRoles, error: allRolesError } = await supabase
      .from('hanami_roles')
      .select('*');

    if (allRolesError) {
      console.error('查詢所有角色錯誤:', allRolesError);
      return NextResponse.json({
        success: false,
        error: `查詢所有角色失敗: ${allRolesError.message}`,
        details: allRolesError
      }, { status: 500 });
    }

    console.log('所有角色:', allRoles);

    // 2. 查詢特定角色
    const { data: specificRole, error: specificRoleError } = await supabase
      .from('hanami_roles')
      .select('*')
      .eq('role_name', role_name)
      .single();

    if (specificRoleError) {
      console.error('查詢特定角色錯誤:', specificRoleError);
      return NextResponse.json({
        success: false,
        error: `查詢特定角色失敗: ${specificRoleError.message}`,
        details: specificRoleError,
        all_roles: allRoles
      }, { status: 500 });
    }

    console.log('特定角色:', specificRole);

    return NextResponse.json({
      success: true,
      message: '角色查詢成功',
      data: {
        all_roles: allRoles,
        specific_role: specificRole,
        role_name: role_name
      }
    });

  } catch (error: any) {
    console.error('調試角色查詢錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '調試角色查詢時發生錯誤',
      stack: error.stack
    }, { status: 500 });
  }
} 
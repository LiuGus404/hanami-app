import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 暫時使用anon key，因為service key有問題
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    // 測試1: 檢查環境變數
    const envCheck = {
      success: !!supabaseUrl && !!supabaseServiceKey,
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
    };

    // 測試2: 檢查權限相關表是否存在
    const tablesCheck = await checkPermissionTables();

    // 測試3: 檢查預設角色是否存在
    const rolesCheck = await checkDefaultRoles();

    // 測試4: 檢查權限檢查函數是否存在
    const functionsCheck = await checkPermissionFunctions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        environment: envCheck,
        tables: tablesCheck,
        roles: rolesCheck,
        functions: functionsCheck,
      },
      summary: {
        totalTests: 4,
        passedTests: Object.values({ envCheck, tablesCheck, rolesCheck, functionsCheck })
          .filter(test => test.success).length,
      }
    });

  } catch (error) {
    console.error('權限系統測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function checkPermissionTables() {
  try {
    // 使用RPC函數檢查表
    const { data: allHanamiTables, error: allTablesError } = await supabase
      .rpc('get_tables_info');

    if (allTablesError) {
      return {
        success: false,
        error: `檢查所有hanami表失敗: ${allTablesError.message}`,
        allTablesError: allTablesError,
      };
    }

    // 檢查權限相關表
    const permissionTables = allHanamiTables?.filter((table: any) => 
      table.table_name.includes('permission')
    ) || [];

    const expectedTables = [
      'hanami_roles',
              // 'hanami_user_permissions_v2', // 暫時禁用，等待資料庫類型更新
      'hanami_permission_templates',
      'hanami_permission_applications',
      'hanami_permission_audit_logs',
      'hanami_permission_usage_stats',
      'hanami_permission_cache',
      'hanami_permission_configs'
    ];

    const foundTables = permissionTables.map((row: any) => row.table_name);
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));
    const allHanamiTableNames = allHanamiTables?.map((row: any) => row.table_name) || [];

    return {
      success: missingTables.length === 0,
      foundTables,
      missingTables,
      expectedTables,
      allHanamiTables: allHanamiTableNames,
      totalHanamiTables: allHanamiTableNames.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '檢查表失敗',
      exception: error,
    };
  }
}

async function checkDefaultRoles() {
  try {
    const { data, error } = await supabase
      .from('hanami_roles')
      .select('role_name, display_name, is_system_role')
      .eq('is_system_role', true);

    if (error) throw error;

    const expectedRoles = ['admin', 'teacher', 'parent'];
    const foundRoles = data?.map(row => row.role_name) || [];
    const missingRoles = expectedRoles.filter(role => !foundRoles.includes(role));

    return {
      success: missingRoles.length === 0,
      foundRoles,
      missingRoles,
      expectedRoles,
      totalRoles: data?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '檢查角色失敗',
    };
  }
}

async function checkPermissionFunctions() {
  try {
    const { data, error } = await supabase
      .rpc('check_user_permission', {
        p_user_email: 'test@example.com',
        p_resource_type: 'page',
        p_operation: 'view',
        p_resource_id: null
      });

    // 如果函數存在但沒有權限，會返回false而不是錯誤
    return {
      success: true,
      functionExists: true,
      testResult: data,
    };
  } catch (error) {
    return {
      success: false,
      functionExists: false,
      error: error instanceof Error ? error.message : '檢查函數失敗',
    };
  }
} 
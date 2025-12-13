import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();

    // 1. 測試基本連接
    console.log('測試基本連接...');
    const { data: usersData, error: usersError } = await saas
      .from('saas_users')
      .select('id, email')
      .limit(1);

    // 2. 測試 hanami_children 表
    console.log('測試 hanami_children 表...');
    const { data: childrenData, error: childrenError } = await saas
      .from('hanami_children')
      .select('*')
      .limit(1);

    // 3. 檢查表結構
    console.log('檢查表結構...');
    const { data: tableInfo, error: tableError } = await (saas as any)
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'hanami_children')
      .eq('table_schema', 'public');

    // 4. 檢查 RLS 狀態
    console.log('檢查 RLS 狀態...');
    const { data: rlsData, error: rlsError } = await (saas as any)
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'hanami_children');

    return NextResponse.json({
      success: true,
      debug: {
        connection: {
          success: !usersError,
          error: usersError?.message,
          usersCount: usersData?.length || 0
        },
        hanami_children: {
          success: !childrenError,
          error: childrenError?.message,
          code: childrenError?.code,
          hint: childrenError?.hint,
          details: childrenError?.details,
          childrenCount: childrenData?.length || 0,
          sampleData: childrenData
        },
        tableStructure: {
          success: !tableError,
          error: tableError?.message,
          columns: tableInfo
        },
        rls: {
          success: !rlsError,
          error: rlsError?.message,
          tableInfo: rlsData
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 檢查 saas_users 表是否存在
    const { data: tableExists, error: tableError } = await (supabase as any)
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'saas_users')
      .single();

    if (tableError || !tableExists) {
      return NextResponse.json({
        success: false,
        error: 'saas_users 表不存在',
        details: tableError?.message
      });
    }

    // 獲取 saas_users 表的欄位結構
    const { data: columns, error: columnsError } = await (supabase as any)
      .from('information_schema.columns')
      .select(`
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      `)
      .eq('table_schema', 'public')
      .eq('table_name', 'saas_users')
      .order('ordinal_position');

    if (columnsError) {
      return NextResponse.json({
        success: false,
        error: '獲取表結構失敗',
        details: columnsError.message
      });
    }

    // 獲取表的約束條件
    const { data: constraints, error: constraintsError } = await (supabase as any)
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type
      `)
      .eq('table_schema', 'public')
      .eq('table_name', 'saas_users');

    // 獲取索引信息
    const { data: indexes, error: indexesError } = await (supabase as any)
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'saas_users')
      .eq('schemaname', 'public');

    // 獲取觸發器信息
    const { data: triggers, error: triggersError } = await (supabase as any)
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('event_object_schema', 'public')
      .eq('event_object_table', 'saas_users');

    // 獲取 RLS 政策
    const { data: policies, error: policiesError } = await (supabase as any)
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual, with_check')
      .eq('tablename', 'saas_users')
      .eq('schemaname', 'public');

    // 獲取樣本數據
    const { data: sampleData, error: sampleError } = await (supabase as any)
      .from('saas_users')
      .select('*')
      .limit(3);

    return NextResponse.json({
      success: true,
      table_name: 'saas_users',
      structure: {
        columns: columns || [],
        constraints: constraints || [],
        indexes: indexes || [],
        triggers: triggers || [],
        policies: policies || []
      },
      sample_data: sampleData || [],
      errors: {
        constraints: constraintsError?.message,
        indexes: indexesError?.message,
        triggers: triggersError?.message,
        policies: policiesError?.message,
        sample: sampleError?.message
      }
    });

  } catch (error: any) {
    console.error('檢查 saas_users 表結構時發生錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: '檢查表結構時發生錯誤',
        details: error.message
      },
      { status: 500 }
    );
  }
}

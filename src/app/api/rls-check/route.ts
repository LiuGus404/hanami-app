import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // 檢查所有表的RLS狀態
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      return NextResponse.json({ error: tablesError.message }, { status: 500 });
    }

    const rlsResults = [];

    for (const table of tables || []) {
      const tableName = table.table_name;
      
      // 檢查RLS是否啟用
      const { data: rlsEnabled, error: rlsError } = await supabase
        .rpc('check_rls_enabled', { table_name: tableName });

      // 獲取該表的政策
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', tableName);

      rlsResults.push({
        table_name: tableName,
        rls_enabled: rlsEnabled || (policies && policies.length > 0),
        policies: policies?.map(p => ({
          policyname: p.policyname,
          permissive: p.permissive,
          roles: p.roles,
          cmd: p.cmd,
          qual: p.qual,
          with_check: p.with_check
        })) || []
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: rlsResults,
      total_tables: rlsResults.length,
      enabled_tables: rlsResults.filter(t => t.rls_enabled).length,
      disabled_tables: rlsResults.filter(t => !t.rls_enabled).length
    });

  } catch (error: any) {
    console.error('RLS檢查失敗:', error);
    return NextResponse.json({ 
      error: error.message || '檢查RLS狀態時發生錯誤' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, table_name } = await request.json();

    switch (action) {
      case 'enable_rls': {
        const { error: enableError } = await supabase
          .rpc('enable_rls_for_table', { table_name });
        
        if (enableError) throw enableError;
        
        return NextResponse.json({ 
          success: true, 
          message: `已為表 ${table_name} 啟用RLS` 
        });
      }

      case 'disable_rls': {
        const { error: disableError } = await supabase
          .rpc('disable_rls_for_table', { table_name });
        
        if (disableError) throw disableError;
        
        return NextResponse.json({ 
          success: true, 
          message: `已為表 ${table_name} 停用RLS` 
        });
      }

      case 'create_basic_policy': {
        const { error: policyError } = await supabase
          .rpc('create_basic_rls_policy', { table_name });
        
        if (policyError) throw policyError;
        
        return NextResponse.json({ 
          success: true, 
          message: `已為表 ${table_name} 創建基本RLS政策` 
        });
      }

      default:
        return NextResponse.json({ 
          error: '無效的操作' 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('RLS操作失敗:', error);
    return NextResponse.json({ 
      error: error.message || '執行RLS操作時發生錯誤' 
    }, { status: 500 });
  }
} 
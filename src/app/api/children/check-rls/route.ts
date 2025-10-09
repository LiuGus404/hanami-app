import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();
    
    // 檢查 RLS 是否啟用
    const { data: rlsData, error: rlsError } = await (saas as any)
      .rpc('check_table_rls', { table_name: 'hanami_children' });
    
    // 檢查 RLS 策略
    const { data: policiesData, error: policiesError } = await (saas as any)
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'hanami_children');
    
    // 嘗試直接查詢表（使用管理員權限）
    const { data: testData, error: testError } = await (saas as any)
      .from('hanami_children')
      .select('*')
      .limit(1);
    
    return NextResponse.json({ 
      success: true,
      rls: {
        enabled: rlsData,
        error: rlsError?.message
      },
      policies: {
        data: policiesData,
        error: policiesError?.message
      },
      directQuery: {
        success: !testError,
        data: testData,
        error: testError?.message
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

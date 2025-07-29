import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const results = {
      table_name: 'Hanami_Students',
      tests: [] as any[]
    };

    // 測試1: 檢查表是否存在
    try {
      const { data: testData, error: testError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .limit(1);

      results.tests.push({
        test_name: '表存在性檢查',
        success: !testError,
        message: testError ? `表不存在或無法訪問: ${testError.message}` : '表存在且可訪問',
        data_count: testData?.length || 0
      });
    } catch (err) {
      results.tests.push({
        test_name: '表存在性檢查',
        success: false,
        message: `檢查失敗: ${err instanceof Error ? err.message : '未知錯誤'}`
      });
    }

    // 測試2: 檢查RLS政策
    try {
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'Hanami_Students');

      results.tests.push({
        test_name: 'RLS政策檢查',
        success: !policyError,
        message: policyError ? `無法獲取政策: ${policyError.message}` : `找到 ${policies?.length || 0} 個政策`,
        policies: policies?.map(p => ({
          policyname: p.policyname,
          permissive: p.permissive,
          roles: p.roles,
          cmd: p.cmd,
          qual: p.qual,
          with_check: p.with_check
        })) || []
      });
    } catch (err) {
      results.tests.push({
        test_name: 'RLS政策檢查',
        success: false,
        message: `政策檢查失敗: ${err instanceof Error ? err.message : '未知錯誤'}`
      });
    }

    // 測試3: 嘗試使用SQL查詢檢查RLS狀態
    try {
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('execute_sql', { 
          sql_query: `
            SELECT 
              schemaname,
              tablename,
              rowsecurity as rls_enabled
            FROM pg_tables 
            WHERE tablename = 'Hanami_Students' 
            AND schemaname = 'public'
          ` 
        });

      results.tests.push({
        test_name: 'SQL RLS狀態檢查',
        success: !rlsError,
        message: rlsError ? `SQL查詢失敗: ${rlsError.message}` : `RLS狀態: ${rlsStatus?.[0]?.rls_enabled ? '已啟用' : '未啟用'}`,
        rls_status: rlsStatus?.[0] || null
      });
    } catch (err) {
      results.tests.push({
        test_name: 'SQL RLS狀態檢查',
        success: false,
        message: `SQL檢查失敗: ${err instanceof Error ? err.message : '未知錯誤'}`
      });
    }

    // 測試4: 檢查表結構
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('execute_sql', { 
          sql_query: `
            SELECT 
              column_name,
              data_type,
              is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'Hanami_Students' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
          ` 
        });

      results.tests.push({
        test_name: '表結構檢查',
        success: !tableError,
        message: tableError ? `無法獲取表結構: ${tableError.message}` : `表有 ${tableInfo?.length || 0} 個欄位`,
        columns: tableInfo || []
      });
    } catch (err) {
      results.tests.push({
        test_name: '表結構檢查',
        success: false,
        message: `表結構檢查失敗: ${err instanceof Error ? err.message : '未知錯誤'}`
      });
    }

    // 測試5: 嘗試插入測試資料（應該被RLS阻擋）
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('Hanami_Students')
        .insert({
          full_name: 'TEST_STUDENT_RLS_CHECK',
          contact_number: '0000000000',
          student_type: 'test'
        })
        .select();

      results.tests.push({
        test_name: 'RLS插入測試',
        success: true,
        message: insertError ? `插入被阻擋: ${insertError.message}` : '插入成功（可能RLS未啟用）',
        was_blocked: !!insertError,
        error_details: insertError?.message || null
      });

      // 如果插入成功，清理測試資料
      if (!insertError && insertData) {
        await supabase
          .from('Hanami_Students')
          .delete()
          .eq('full_name', 'TEST_STUDENT_RLS_CHECK');
      }
    } catch (err) {
      results.tests.push({
        test_name: 'RLS插入測試',
        success: false,
        message: `插入測試失敗: ${err instanceof Error ? err.message : '未知錯誤'}`
      });
    }

    // 總結
    const successCount = results.tests.filter(t => t.success).length;
    const totalCount = results.tests.length;

    return NextResponse.json({
      success: true,
      table_name: 'Hanami_Students',
      summary: {
        total_tests: totalCount,
        successful_tests: successCount,
        failed_tests: totalCount - successCount
      },
      results: results.tests
    });

  } catch (error: any) {
    console.error('Hanami_Students RLS測試失敗:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || '測試Hanami_Students RLS狀態時發生錯誤' 
    }, { status: 500 });
  }
} 
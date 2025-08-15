import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始修復AI工具表RLS問題');

    // 1. 檢查表是否存在 - 直接嘗試查詢
    console.log('檢查表是否存在...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('hanami_ai_tool_usage')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('表檢查失敗:', tableError);
      return NextResponse.json({
        success: false,
        error: '表檢查失敗',
        details: tableError
      }, { status: 500 });
    }

    console.log('表存在檢查結果:', tableCheck);

    // 2. 獲取記錄數量
    const { count, error: countError } = await supabase
      .from('hanami_ai_tool_usage')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('獲取記錄數量失敗:', countError);
      return NextResponse.json({
        success: false,
        error: '獲取記錄數量失敗',
        details: countError
      }, { status: 500 });
    }

    console.log('記錄數量:', count);

    // 3. 獲取最近記錄
    const { data: records, error: recordsError } = await supabase
      .from('hanami_ai_tool_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recordsError) {
      console.error('獲取記錄失敗:', recordsError);
      return NextResponse.json({
        success: false,
        error: '獲取記錄失敗',
        details: recordsError
      }, { status: 500 });
    }

    console.log('獲取到的記錄:', records);

    // 4. 測試CRUD操作
    const testResults = [];

    // 測試插入
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('hanami_ai_tool_usage')
        .insert({
          tool_id: 'test-tool',
          user_email: 'test@example.com',
          status: 'completed',
          input_data: { test: 'input' },
          output_data: { test: 'output' }
        })
        .select()
        .single();

      if (insertError) {
        testResults.push({ operation: 'insert', success: false, error: insertError.message });
      } else {
        testResults.push({ operation: 'insert', success: true, data: insertData });
        
        // 測試查詢
        const { data: selectData, error: selectError } = await supabase
          .from('hanami_ai_tool_usage')
          .select('*')
          .eq('id', insertData.id)
          .single();

        if (selectError) {
          testResults.push({ operation: 'select', success: false, error: selectError.message });
        } else {
          testResults.push({ operation: 'select', success: true, data: selectData });
        }

        // 測試刪除
        const { error: deleteError } = await supabase
          .from('hanami_ai_tool_usage')
          .delete()
          .eq('id', insertData.id);

        if (deleteError) {
          testResults.push({ operation: 'delete', success: false, error: deleteError.message });
        } else {
          testResults.push({ operation: 'delete', success: true });
        }
      }
    } catch (testError) {
      testResults.push({ operation: 'test', success: false, error: testError instanceof Error ? testError.message : String(testError) });
    }

    console.log('修復完成');

    return NextResponse.json({
      success: true,
      message: 'AI工具表檢查完成',
      results: {
        tableExists: true,
        recordCount: count,
        records: records || [],
        testResults: testResults
      }
    });

  } catch (error) {
    console.error('修復AI工具表問題失敗:', error);
    return NextResponse.json({
      success: false,
      error: '修復失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
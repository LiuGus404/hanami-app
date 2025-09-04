import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 直接嘗試查詢表來檢查是否存在
    const { data: tableCheck, error: tableError } = await supabase
      .from('hanami_learning_paths')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('表檢查失敗:', tableError);
      return NextResponse.json({ 
        error: '表不存在或無法訪問',
        details: tableError.message,
        code: tableError.code
      }, { status: 500 });
    }
    
    // 檢查表結構 - 嘗試獲取一條記錄
    const { data: sampleData, error: sampleError } = await supabase
      .from('hanami_learning_paths')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('獲取樣本數據失敗:', sampleError);
      return NextResponse.json({ 
        error: '無法獲取表結構',
        details: sampleError.message,
        code: sampleError.code
      }, { status: 500 });
    }
    
    // 檢查 RLS 策略 - 使用 SQL 查詢
    let policies = null;
    let policiesError = null;
    try {
      const result = await supabase
        .rpc('get_table_policies', { table_name: 'hanami_learning_paths' });
      policies = result.data;
      policiesError = result.error;
    } catch (e) {
      policiesError = { message: '無法獲取策略信息' };
    }
    
    // 嘗試插入測試數據
    const testData = {
      name: '測試學習路徑',
      description: '測試描述',
      tree_id: '00000000-0000-0000-0000-000000000000',
      nodes: [{ id: 'start', type: 'start', title: '開始' }],
      start_node_id: 'start',
      end_node_id: 'start',
      total_duration: 0,
      difficulty: 1,
      tags: ['測試'],
      is_active: true
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('hanami_learning_paths')
      .insert(testData)
      .select()
      .single();
    
    let insertSuccess = false;
    let insertErrorDetails = null;
    
    if (insertError) {
      insertErrorDetails = insertError.message;
      console.error('插入測試失敗:', insertError);
    } else {
      insertSuccess = true;
      console.log('插入測試成功:', insertResult);
      // 刪除測試數據
      await supabase
        .from('hanami_learning_paths')
        .delete()
        .eq('id', insertResult.id);
    }
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      tableAccessible: true,
      sampleData: sampleData,
      policies: policies || [],
      insertTest: {
        success: insertSuccess,
        error: insertErrorDetails
      },
      message: '表存在且可訪問'
    });
    
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ 
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

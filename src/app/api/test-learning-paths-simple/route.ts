import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 測試學習路徑插入 API ===');
    
    // 創建 Supabase 客戶端
    const supabase = createRouteHandlerClient({ cookies });
    
    // 測試最簡單的插入
    const testData = {
      name: '測試學習路徑',
      description: '測試描述',
      tree_id: null,
      nodes: '[{"id": "start", "type": "start", "title": "開始"}]',
      start_node_id: 'start',
      end_node_id: 'end',
      total_duration: 0,
      difficulty: 1,
      tags: ['測試'],
      is_active: true,
      created_by: null
    };
    
    console.log('測試數據:', testData);
    
    // 嘗試插入
    const { data, error } = await supabase
      .from('hanami_learning_paths')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('測試插入失敗:', error);
      return NextResponse.json({ 
        error: '測試插入失敗', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }
    
    console.log('測試插入成功:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: '測試插入成功',
      data 
    });
    
  } catch (error) {
    console.error('測試 API 錯誤:', error);
    return NextResponse.json({ 
      error: '內部錯誤', 
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('=== 測試學習路徑查詢 API ===');
    
    // 創建 Supabase 客戶端
    const supabase = createRouteHandlerClient({ cookies });
    
    // 查詢現有記錄
    const { data, error } = await supabase
      .from('hanami_learning_paths')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('測試查詢失敗:', error);
      return NextResponse.json({ 
        error: '測試查詢失敗', 
        details: error.message 
      }, { status: 500 });
    }
    
    console.log('測試查詢成功，記錄數:', data?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      message: '測試查詢成功',
      count: data?.length || 0,
      data: data || []
    });
    
  } catch (error) {
    console.error('測試查詢 API 錯誤:', error);
    return NextResponse.json({ 
      error: '內部錯誤', 
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

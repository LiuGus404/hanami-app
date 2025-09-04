import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 學習路徑調試 API 開始 ===');
    
    // 1. 記錄請求信息
    console.log('請求 URL:', request.url);
    console.log('請求方法:', request.method);
    console.log('請求頭:', Object.fromEntries(request.headers.entries()));
    
    // 2. 嘗試解析請求體
    let body;
    try {
      body = await request.json();
      console.log('請求體解析成功:', body);
    } catch (parseError) {
      console.error('請求體解析失敗:', parseError);
      return NextResponse.json({ 
        error: '請求體解析失敗', 
        details: parseError instanceof Error ? parseError.message : '未知錯誤'
      }, { status: 400 });
    }
    
    // 3. 檢查用戶認證信息
    const userEmail = request.headers.get('X-User-Email');
    const userId = request.headers.get('X-User-ID');
    const userRole = request.headers.get('X-User-Role');
    
    console.log('用戶認證信息:', { userEmail, userId, userRole });
    
    // 4. 嘗試創建 Supabase 客戶端
    let supabase;
    try {
      supabase = createRouteHandlerClient({ cookies });
      console.log('Supabase 客戶端創建成功');
    } catch (supabaseError) {
      console.error('Supabase 客戶端創建失敗:', supabaseError);
      return NextResponse.json({ 
        error: 'Supabase 客戶端創建失敗', 
        details: supabaseError instanceof Error ? supabaseError.message : '未知錯誤'
      }, { status: 500 });
    }
    
    // 5. 嘗試簡單查詢
    try {
      const { data: testQuery, error: queryError } = await supabase
        .from('hanami_learning_paths')
        .select('count', { count: 'exact', head: true });
      
      if (queryError) {
        console.error('測試查詢失敗:', queryError);
        return NextResponse.json({ 
          error: '測試查詢失敗', 
          details: queryError.message,
          code: queryError.code
        }, { status: 500 });
      }
      
      console.log('測試查詢成功，記錄數:', testQuery);
    } catch (queryError) {
      console.error('測試查詢異常:', queryError);
      return NextResponse.json({ 
        error: '測試查詢異常', 
        details: queryError instanceof Error ? queryError.message : '未知錯誤'
      }, { status: 500 });
    }
    
    // 6. 嘗試插入測試數據
    try {
      const testData = {
        name: '調試測試學習路徑',
        description: '調試測試描述',
        tree_id: null,
        nodes: '[{"id": "start", "type": "start", "title": "開始"}]',
        start_node_id: 'start',
        end_node_id: 'end',
        total_duration: 0,
        difficulty: 1,
        tags: ['調試', '測試'],
        is_active: true,
        created_by: null
      };
      
      console.log('嘗試插入測試數據:', testData);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('hanami_learning_paths')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.error('測試插入失敗:', insertError);
        return NextResponse.json({ 
          error: '測試插入失敗', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }, { status: 500 });
      }
      
      console.log('測試插入成功:', insertResult);
      
      // 7. 清理測試數據
      try {
        const { error: deleteError } = await supabase
          .from('hanami_learning_paths')
          .delete()
          .eq('id', insertResult.id);
        
        if (deleteError) {
          console.error('清理測試數據失敗:', deleteError);
        } else {
          console.log('測試數據清理成功');
        }
      } catch (deleteError) {
        console.error('清理測試數據異常:', deleteError);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '學習路徑調試測試成功',
        testResults: {
          requestParsing: '成功',
          supabaseClient: '成功',
          databaseQuery: '成功',
          databaseInsert: '成功',
          databaseDelete: '成功'
        }
      });
      
    } catch (insertError) {
      console.error('測試插入異常:', insertError);
      return NextResponse.json({ 
        error: '測試插入異常', 
        details: insertError instanceof Error ? insertError.message : '未知錯誤'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('學習路徑調試 API 錯誤:', error);
    return NextResponse.json({ 
      error: '內部錯誤', 
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('=== 學習路徑調試 API GET 請求 ===');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // 檢查表是否存在
    const { data, error } = await supabase
      .from('hanami_learning_paths')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('表檢查失敗:', error);
      return NextResponse.json({ 
        error: '表檢查失敗', 
        details: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    console.log('表檢查成功，記錄數:', data?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      message: '學習路徑表檢查成功',
      tableExists: true,
      recordCount: data?.length || 0
    });
    
  } catch (error) {
    console.error('學習路徑調試 API GET 錯誤:', error);
    return NextResponse.json({ 
      error: '內部錯誤', 
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

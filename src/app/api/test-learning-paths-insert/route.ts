import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    console.log('測試插入學習路徑，收到數據:', body);
    
    // 檢查用戶認證
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('用戶未認證:', userError);
      return NextResponse.json({
        success: false,
        error: '用戶未認證',
        details: userError?.message || '請先登入'
      }, { status: 401 });
    }
    
    console.log('當前用戶:', user.email);
    
    // 準備測試數據
    const testData = {
      name: body.name || '測試學習路徑',
      description: body.description || '測試描述',
      tree_id: body.tree_id || '015c99d6-3727-49f6-acd5-17ed40abd008',
      nodes: body.nodes || [{ id: 'start', type: 'start', title: '開始' }],
      start_node_id: body.startNodeId || 'start',
      end_node_id: body.endNodeId || 'start',
      total_duration: body.totalDuration || 0,
      difficulty: body.difficulty || 1,
      tags: body.tags || ['測試'],
      is_active: true,
      created_by: user.id
    };
    
    console.log('準備插入的數據:', testData);
    
    // 嘗試插入
    const { data: insertResult, error: insertError } = await supabase
      .from('hanami_learning_paths')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('插入失敗:', insertError);
      return NextResponse.json({
        success: false,
        error: '插入失敗',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint || '無提示信息'
      }, { status: 500 });
    }
    
    console.log('插入成功:', insertResult);
    
    // 清理測試數據
    const { error: deleteError } = await supabase
      .from('hanami_learning_paths')
      .delete()
      .eq('id', insertResult.id);
    
    if (deleteError) {
      console.error('清理測試數據失敗:', deleteError);
    }
    
    return NextResponse.json({
      success: true,
      message: '測試插入成功',
      insertedData: insertResult,
      userInfo: {
        email: user.email,
        id: user.id
      }
    });
    
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

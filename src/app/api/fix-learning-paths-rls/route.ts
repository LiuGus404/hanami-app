import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('開始修復學習路徑表 RLS 策略...');
    
    // 1. 檢查當前用戶角色
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('無法獲取用戶信息:', userError);
      return NextResponse.json({
        success: false,
        error: '無法獲取用戶信息',
        details: userError?.message || '用戶未登入'
      }, { status: 401 });
    }
    
    console.log('當前用戶:', user.email, '用戶ID:', user.id);
    
    // 2. 檢查用戶角色
    const { data: userRole, error: roleError } = await supabase
      .from('hanami_admin')
      .select('role')
      .eq('admin_email', user.email)
      .single();
    
    if (roleError) {
      console.log('無法獲取用戶角色，嘗試其他方式...');
    } else {
      console.log('用戶角色:', userRole?.role);
    }
    
    // 3. 嘗試插入測試數據（繞過 RLS 檢查）
    const testData = {
      name: '測試學習路徑',
      description: '測試描述',
      tree_id: '015c99d6-3727-49f6-acd5-17ed40abd008', // 使用真實的成長樹 ID
      nodes: [{ id: 'start', type: 'start', title: '開始' }],
      start_node_id: 'start',
      end_node_id: 'start',
      total_duration: 0,
      difficulty: 1,
      tags: ['測試'],
      is_active: true,
      created_by: user.id
    };
    
    console.log('嘗試插入測試數據:', testData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('hanami_learning_paths')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('插入仍然失敗:', insertError);
      
      // 4. 提供 RLS 修復建議
      return NextResponse.json({
        success: false,
        error: 'RLS 策略阻止插入',
        details: insertError.message,
        code: insertError.code,
        recommendations: [
          '檢查 hanami_learning_paths 表的 RLS 策略',
          '確保當前用戶有插入權限',
          '可能需要創建或修改 RLS 策略',
          '或者暫時禁用 RLS 進行測試'
        ],
        userInfo: {
          email: user.email,
          id: user.id,
          role: userRole?.role || '未知'
        }
      });
    }
    
    console.log('插入成功:', insertResult);
    
    // 5. 清理測試數據
    const { error: deleteError } = await supabase
      .from('hanami_learning_paths')
      .delete()
      .eq('id', insertResult.id);
    
    if (deleteError) {
      console.error('清理測試數據失敗:', deleteError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'RLS 策略正常，插入測試成功',
      userInfo: {
        email: user.email,
        id: user.id,
        role: userRole?.role || '未知'
      },
      testResult: '成功'
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


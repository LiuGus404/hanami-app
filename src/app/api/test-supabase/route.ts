import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [測試] 開始測試 Supabase 連接...');
    
    const supabase = createSaasClient();
    
    // 測試 1: 檢查 chat_messages 表是否存在
    console.log('🧪 [測試] 檢查 chat_messages 表...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ [測試] chat_messages 表錯誤:', tableError);
      return NextResponse.json({
        success: false,
        error: 'chat_messages 表錯誤',
        details: tableError
      }, { status: 500 });
    }
    
    console.log('✅ [測試] chat_messages 表存在');
    
    // 測試 2: 檢查插入權限
    console.log('🧪 [測試] 測試插入權限...');
    const testData = {
      thread_id: '0295b429-ac89-40dd-a2a2-3a7cccd468ae', // 使用有效的 UUID
      role: 'user',
      message_type: 'user_request',
      content: '測試訊息',
      status: 'queued',
      client_msg_id: 'test-' + Date.now(),
      content_json: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('chat_messages')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [測試] 插入權限錯誤:', insertError);
      return NextResponse.json({
        success: false,
        error: '插入權限錯誤',
        details: insertError
      }, { status: 500 });
    }
    
    console.log('✅ [測試] 插入成功:', insertData?.id);
    
    // 清理測試數據
    await supabase
      .from('chat_messages')
      .delete()
      .eq('id', insertData?.id);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 連接和權限正常',
      testData: insertData
    });
    
  } catch (error) {
    console.error('❌ [測試] 意外錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
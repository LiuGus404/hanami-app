import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();
    
    if (!messageId) {
      return NextResponse.json({
        success: false,
        error: 'messageId is required'
      }, { status: 400 });
    }
    
    console.log('🔍 測試簡化刪除:', messageId);
    
    // 直接使用環境變數創建客戶端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
    const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;
    
    console.log('🔧 環境變數檢查:', {
      url: supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 1. 先查詢訊息
    console.log('1. 查詢訊息...');
    const { data: messageData, error: selectError } = await supabase
      .from('chat_messages')
      .select('id, thread_id, status, created_at')
      .eq('id', messageId)
      .single();
    
    if (selectError) {
      console.error('❌ 查詢失敗:', selectError);
      return NextResponse.json({
        success: false,
        step: 'select',
        error: selectError.message,
        details: selectError
      }, { status: 400 });
    }
    
    console.log('✅ 找到訊息:', messageData);
    
    // 2. 嘗試更新
    console.log('2. 嘗試更新...');
    const { data: updateData, error: updateError } = await supabase
      .from('chat_messages')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select();
    
    if (updateError) {
      console.error('❌ 更新失敗:', updateError);
      return NextResponse.json({
        success: false,
        step: 'update',
        error: updateError.message,
        details: updateError,
        originalMessage: messageData
      }, { status: 400 });
    }
    
    console.log('✅ 更新成功:', updateData);
    
    return NextResponse.json({
      success: true,
      message: '刪除成功',
      data: updateData,
      originalMessage: messageData
    });
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

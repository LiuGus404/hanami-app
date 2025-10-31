import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();
    
    if (!messageId) {
      return NextResponse.json({
        success: false,
        error: 'messageId is required'
      }, { status: 400 });
    }
    
    console.log('🔍 診斷刪除訊息問題:', messageId);
    
    const saasSupabase = getSaasSupabaseClient();
    
    // 1. 先檢查訊息是否存在
    console.log('1. 檢查訊息是否存在...');
    const { data: messageData, error: selectError } = await saasSupabase
      .from('chat_messages')
      .select('id, thread_id, status, created_at')
      .eq('id', messageId)
      .single();
    
    if (selectError) {
      console.error('❌ 查詢訊息失敗:', selectError);
      return NextResponse.json({
        success: false,
        step: 'select',
        error: selectError.message,
        details: selectError,
        code: selectError.code
      }, { status: 400 });
    }
    
    if (!messageData) {
      return NextResponse.json({
        success: false,
        step: 'select',
        error: 'Message not found'
      }, { status: 404 });
    }
    
    console.log('✅ 找到訊息:', messageData);
    
    // 2. 檢查當前狀態
    console.log('2. 檢查當前狀態...');
    if ((messageData as any)?.status === 'deleted') {
      return NextResponse.json({
        success: true,
        message: 'Message already deleted',
        data: messageData
      });
    }
    
    // 3. 嘗試軟刪除
    console.log('3. 嘗試軟刪除...');
    const { data: updateData, error: updateError } = await (saasSupabase as any)
      .from('chat_messages')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', messageId)
      .select();
    
    if (updateError) {
      console.error('❌ 軟刪除失敗:', updateError);
      return NextResponse.json({
        success: false,
        step: 'update',
        error: updateError.message,
        details: updateError,
        code: updateError.code,
        originalMessage: messageData
      }, { status: 400 });
    }
    
    console.log('✅ 軟刪除成功:', updateData);
    
    return NextResponse.json({
      success: true,
      message: '軟刪除成功',
      data: updateData,
      originalMessage: messageData
    });
    
  } catch (error) {
    console.error('❌ 診斷過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 測試 SaaS Supabase 客戶端...');
    
    const saasSupabase = getSaasSupabaseClient();
    
    // 測試連接
    const { data, error } = await saasSupabase
      .from('chat_messages')
      .select('id, status')
      .limit(1);
    
    if (error) {
      console.error('❌ SaaS Supabase 連接失敗:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        code: error.code
      }, { status: 400 });
    }
    
    console.log('✅ SaaS Supabase 連接成功');
    
    return NextResponse.json({
      success: true,
      message: 'SaaS Supabase 連接正常',
      data: data,
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL,
        hasServiceKey: !!process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY
      }
    });
    
  } catch (error) {
    console.error('❌ 測試 SaaS Supabase 時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();
    
    if (!messageId) {
      return NextResponse.json({
        success: false,
        error: 'messageId is required'
      }, { status: 400 });
    }
    
    console.log('🗑️ 測試軟刪除訊息:', messageId);
    
    const saasSupabase = getSaasSupabaseClient();
    
    // 測試軟刪除
    const { data, error } = await saasSupabase
      .from('chat_messages')
      .update({ status: 'deleted' })
      .eq('id', messageId)
      .select();
    
    if (error) {
      console.error('❌ 軟刪除失敗:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        code: error.code
      }, { status: 400 });
    }
    
    console.log('✅ 軟刪除成功:', data);
    
    return NextResponse.json({
      success: true,
      message: '軟刪除成功',
      data: data
    });
    
  } catch (error) {
    console.error('❌ 測試軟刪除時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 診斷 chat_messages 表...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
    const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 1. 檢查表結構
    console.log('1. 檢查表結構...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'chat_messages')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ 查詢表結構失敗:', tableError);
    } else {
      console.log('✅ 表結構:', tableInfo);
    }
    
    // 2. 檢查 RLS 狀態
    console.log('2. 檢查 RLS 狀態...');
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'chat_messages');
    
    if (rlsError) {
      console.error('❌ 查詢 RLS 狀態失敗:', rlsError);
    } else {
      console.log('✅ RLS 狀態:', rlsInfo);
    }
    
    // 3. 檢查政策
    console.log('3. 檢查 RLS 政策...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'chat_messages');
    
    if (policiesError) {
      console.error('❌ 查詢政策失敗:', policiesError);
    } else {
      console.log('✅ RLS 政策:', policies);
    }
    
    // 4. 測試簡單查詢
    console.log('4. 測試簡單查詢...');
    const { data: messages, error: selectError } = await supabase
      .from('chat_messages')
      .select('id, status, created_at')
      .limit(5);
    
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
    
    console.log('✅ 查詢成功，找到', messages?.length || 0, '條訊息');
    
    // 5. 測試更新操作
    if (messages && messages.length > 0) {
      const testMessageId = messages[0].id;
      console.log('5. 測試更新操作:', testMessageId);
      
      const { data: updateData, error: updateError } = await supabase
        .from('chat_messages')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', testMessageId)
        .select();
      
      if (updateError) {
        console.error('❌ 更新測試失敗:', updateError);
        return NextResponse.json({
          success: false,
          step: 'update',
          error: updateError.message,
          details: updateError,
          code: updateError.code,
          testMessageId
        }, { status: 400 });
      }
      
      console.log('✅ 更新測試成功:', updateData);
    }
    
    return NextResponse.json({
      success: true,
      message: '診斷完成',
      data: {
        tableInfo,
        rlsInfo,
        policies,
        messageCount: messages?.length || 0,
        sampleMessages: messages?.slice(0, 3)
      }
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

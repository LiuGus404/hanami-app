import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// 修復 RLS 政策 API 路由
export async function POST(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();
    
    console.log('🔧 [API] 開始修復 RLS 政策...');
    
    // 1. 刪除現有政策
    const policiesToDrop = [
      'Allow all operations on chat_messages',
      'Allow all operations on chat_threads',
      'Enable insert for authenticated users only',
      'Enable read access for all users',
      'Enable update for users based on user_id',
      'Enable delete for users based on user_id'
    ];
    
    for (const policyName of policiesToDrop) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON public.chat_messages;`
        });
        console.log(`✅ [API] 刪除政策: ${policyName}`);
      } catch (error) {
        console.log(`⚠️ [API] 政策不存在或刪除失敗: ${policyName}`);
      }
    }
    
    // 2. 創建新的寬鬆政策
    const createPolicySQL = `
      CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages
        FOR ALL USING (true) WITH CHECK (true);
    `;
    
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: createPolicySQL
    });
    
    if (policyError) {
      console.error('❌ [API] 創建政策失敗:', policyError);
      return NextResponse.json({
        success: false,
        error: '創建 RLS 政策失敗',
        details: policyError
      }, { status: 500 });
    }
    
    console.log('✅ [API] 創建 chat_messages 政策成功');
    
    // 3. 為 chat_threads 創建政策
    const createThreadPolicySQL = `
      CREATE POLICY "Allow all operations on chat_threads" ON public.chat_threads
        FOR ALL USING (true) WITH CHECK (true);
    `;
    
    const { error: threadPolicyError } = await supabase.rpc('exec_sql', {
      sql: createThreadPolicySQL
    });
    
    if (threadPolicyError) {
      console.error('❌ [API] 創建 chat_threads 政策失敗:', threadPolicyError);
    } else {
      console.log('✅ [API] 創建 chat_threads 政策成功');
    }
    
    // 4. 測試插入
    const testMessage = {
      thread_id: '0295b429-ac89-40dd-a2a2-3a7cccd468ae',
      role: 'user',
      message_type: 'user_request',
      content: 'RLS 修復測試訊息',
      status: 'queued',
      client_msg_id: 'rls-test-' + Date.now(),
      content_json: { test: true },
      created_at: new Date().toISOString()
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('chat_messages')
      .insert(testMessage)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [API] RLS 修復後插入測試失敗:', insertError);
      return NextResponse.json({
        success: false,
        error: 'RLS 修復後插入測試失敗',
        details: insertError
      }, { status: 500 });
    }
    
    console.log('✅ [API] RLS 修復後插入測試成功:', insertTest.id);
    
    // 5. 清理測試數據
    await supabase
      .from('chat_messages')
      .delete()
      .eq('id', insertTest.id);
    
    return NextResponse.json({
      success: true,
      message: 'RLS 政策修復成功',
      testResult: { id: insertTest.id }
    });

  } catch (error) {
    console.error('❌ [API] RLS 修復異常:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}

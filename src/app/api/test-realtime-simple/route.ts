import { NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';
import { generateULID } from '@/lib/ulid';

export async function GET() {
  try {
    const supabase = createSaasClient();
    const clientMsgId = generateULID();
    
    console.log('🧪 [API] 開始插入測試訊息...');
    
    // 插入測試訊息
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: '0295b429-ac89-40dd-a2a2-3a7cccd468ae',
        role: 'assistant',
        message_type: 'final',
        content: `測試訊息 ${new Date().toLocaleTimeString()}`,
        status: 'completed',
        client_msg_id: clientMsgId,
        content_json: {
          test: true,
          role_name: 'hibi',
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [API] 插入測試訊息失敗:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ [API] 測試訊息已插入:', data);
    
    // 等待一秒後更新狀態
    setTimeout(async () => {
      console.log('🔄 [API] 更新訊息狀態...');
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ 
          status: 'completed',
          content: `測試訊息已更新 ${new Date().toLocaleTimeString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
        
      if (updateError) {
        console.error('❌ [API] 更新訊息失敗:', updateError);
      } else {
        console.log('✅ [API] 訊息狀態已更新');
      }
    }, 1000);

    return NextResponse.json({ 
      success: true, 
      message: '測試訊息已插入，請檢查前端是否收到 Realtime 更新',
      messageId: data.id,
      clientMsgId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [API] 處理測試請求時發生錯誤:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

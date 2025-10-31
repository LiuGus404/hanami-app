import { NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';
import { generateULID } from '@/lib/ulid';

export async function GET() {
  try {
    const supabase = createSaasClient();
    const clientMsgId = generateULID();
    
    // 插入測試訊息
    const { data, error } = await (supabase as any)
      .from('chat_messages')
      .insert({
        thread_id: '0295b429-ac89-40dd-a2a2-3a7cccd468ae',
        role: 'assistant',
        message_type: 'final',
        content: '這是一條測試訊息，用於驗證 Realtime 功能',
        status: 'completed',
        client_msg_id: clientMsgId,
        content_json: {
          test: true,
          role_name: 'hibi'
        },
        created_at: new Date().toISOString()
      } as any)
      .select()
      .single();

    if (error) {
      console.error('❌ [API] 插入測試訊息失敗:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ [API] 測試訊息已插入:', data);
    return NextResponse.json({ 
      success: true, 
      message: '測試訊息已插入，請檢查前端是否收到 Realtime 更新',
      messageId: data.id,
      clientMsgId
    });

  } catch (error: any) {
    console.error('❌ [API] 處理測試請求時發生錯誤:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';
import { generateULID } from '@/lib/ulid';

export async function GET() {
  try {
    const supabase = createSaasClient();
    const clientMsgId = generateULID();
    
    console.log('🧪 [完整測試] 開始完整系統測試...');
    
    // 1. 插入用戶訊息
    const { data: userMsg, error: userError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: '0295b429-ac89-40dd-a2a2-3a7cccd468ae',
        role: 'user',
        message_type: 'user_request',
        content: '完整系統測試訊息',
        status: 'queued',
        client_msg_id: clientMsgId,
        content_json: {
          user_id: '4b8fcd8f-ea99-42f6-8509-88018aac7a3d',
          role_hint: 'hibi',
          test: true
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ [完整測試] 插入用戶訊息失敗:', userError);
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    console.log('✅ [完整測試] 用戶訊息已插入:', userMsg.id);
    
    // 2. 模擬 n8n 處理：更新用戶訊息狀態
    setTimeout(async () => {
      console.log('🔄 [完整測試] 模擬 n8n 處理...');
      
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', userMsg.id);
        
      if (updateError) {
        console.error('❌ [完整測試] 更新用戶訊息狀態失敗:', updateError);
        return;
      }
      
      console.log('✅ [完整測試] 用戶訊息狀態已更新為 processing');
      
      // 3. 插入助手回覆
      setTimeout(async () => {
        const assistantMsgId = generateULID();
        
        const { data: assistantMsg, error: assistantError } = await supabase
          .from('chat_messages')
          .insert({
            thread_id: '0295b429-ac89-40dd-a2a2-3a7cccd468ae',
            role: 'assistant',
            message_type: 'final',
            content: '這是完整的系統測試回覆，驗證整個流程是否正常工作。',
            status: 'completed',
            client_msg_id: assistantMsgId,
            parent_id: userMsg.id,
            content_json: {
              role_name: 'hibi',
              test: true,
              provider: 'test',
              model: 'test-model'
            },
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (assistantError) {
          console.error('❌ [完整測試] 插入助手訊息失敗:', assistantError);
          return;
        }
        
        console.log('✅ [完整測試] 助手訊息已插入:', assistantMsg.id);
        
        // 4. 更新用戶訊息為完成
        setTimeout(async () => {
          const { error: finalUpdateError } = await supabase
            .from('chat_messages')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', userMsg.id);
            
          if (finalUpdateError) {
            console.error('❌ [完整測試] 最終更新失敗:', finalUpdateError);
            return;
          }
          
          console.log('✅ [完整測試] 完整流程測試完成');
        }, 1000);
        
      }, 2000);
      
    }, 1000);

    return NextResponse.json({ 
      success: true, 
      message: '完整系統測試已啟動，請檢查前端是否收到所有更新',
      userMessageId: userMsg.id,
      clientMsgId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [完整測試] 處理測試請求時發生錯誤:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

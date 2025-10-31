import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';
import { generateULID } from '@/lib/ulid';

// 簡化的測試 API 路由
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [測試API] 開始處理請求...');
    
    const body = await request.json();
    console.log('🧪 [測試API] 請求 Body:', body);
    
    const { 
      threadId, 
      userId, 
      content, 
      roleHint = 'hibi'
    } = body;

    console.log('🧪 [測試API] 參數:', { threadId, userId, content, roleHint });

    // 驗證必要參數
    if (!threadId || !userId || !content) {
      console.error('❌ [測試API] 參數驗證失敗:', { 
        threadId: !!threadId, 
        userId: !!userId, 
        content: !!content
      });
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const clientMsgId = generateULID();
    const supabase = createSaasClient();
    
    console.log('🧪 [測試API] 開始保存訊息到 Supabase...', { threadId, clientMsgId });

    // 寫入訊息到 Supabase
    const insertData = {
      thread_id: threadId,
      role: 'user',
      message_type: 'user_request',
      content: content,
      status: 'queued',
      client_msg_id: clientMsgId,
      content_json: {
        user_id: userId,
        role_hint: roleHint
      },
      created_at: new Date().toISOString()
    };

    const { data: userMsg, error: insertError } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [測試API] 寫入 Supabase 失敗:', insertError);
      return NextResponse.json(
        { success: false, error: `保存訊息失敗: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ [測試API] 訊息已保存到 Supabase:', userMsg?.id);

    return NextResponse.json({
      success: true,
      messageId: userMsg?.id,
      clientMsgId,
      message: '測試 API 成功'
    });

  } catch (error) {
    console.error('❌ [測試API] 意外錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}

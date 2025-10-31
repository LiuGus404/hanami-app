import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';
import { generateULID } from '@/lib/ulid';
import { createIngressClient } from '@/lib/ingress';

// 訊息發送 API 路由
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      threadId, 
      userId, 
      content, 
      roleHint = 'auto', 
      messageType = 'user_request',
      extra = {},
      groupRoles = [],
      selectedRole = {},
      project = {},
      sessionId
    } = body;

    console.log('🚀 [API] 收到訊息發送請求:', { threadId, userId, content, roleHint });
    console.log('🔍 [API] 請求體詳情:', { 
      threadId: !!threadId, 
      userId: !!userId, 
      content: !!content,
      contentLength: content?.length,
      roleHint,
      messageType,
      extraKeys: Object.keys(extra || {}),
      groupRolesLength: groupRoles?.length,
      selectedRoleKeys: Object.keys(selectedRole || {}),
      projectKeys: Object.keys(project || {}),
      sessionId
    });

    // 驗證必要參數
    if (!threadId || !userId || !content) {
      console.error('❌ [API] 參數驗證失敗:', { 
        threadId: !!threadId, 
        userId: !!userId, 
        content: !!content,
        threadIdValue: threadId,
        userIdValue: userId,
        contentValue: content
      });
      return NextResponse.json(
        { success: false, error: '缺少必要參數', details: { threadId: !!threadId, userId: !!userId, content: !!content } },
        { status: 400 }
      );
    }

    const clientMsgId = generateULID();
    const supabase = createSaasClient();
    
    console.log('📝 [API] 開始保存訊息到 Supabase...', { threadId, clientMsgId });

    // === 步驟 1: 寫入訊息到 Supabase ===
    const { data: userMsg, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        role: 'user',
        message_type: messageType,
        content: content,
        status: 'queued',
        client_msg_id: clientMsgId,
        content_json: {
          user_id: userId,
          role_hint: roleHint,
          ...extra
        },
        created_at: new Date().toISOString()
      } as any)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [API] 寫入 Supabase 失敗:', insertError);
      return NextResponse.json(
        { success: false, error: `保存訊息失敗: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ [API] 訊息已保存到 Supabase:', userMsg.id);

    // === 步驟 2: 發送到 n8n ===
    try {
      const ingressClient = createIngressClient();
      
      console.log('🚀 [API] 開始發送到 n8n...');
      
      const ingressResponse = await ingressClient.sendMessage(threadId, content, {
        roleHint,
        messageType,
        extra: {
          ...extra,
          user_id: userId,
          client_msg_id: clientMsgId
        },
        groupRoles,
        selectedRole,
        project,
        sessionId
      });

      if (ingressResponse.success) {
        console.log('✅ [API] 成功發送到 n8n:', ingressResponse);
        
        // 更新訊息狀態為 processing
        await supabase
          .from('chat_messages')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', userMsg.id);

        return NextResponse.json({
          success: true,
          messageId: userMsg.id,
          clientMsgId,
          ingressResponse
        });
      } else {
        console.error('❌ [API] n8n 發送失敗:', ingressResponse.error);
        
        // 更新訊息狀態為 error
        await supabase
          .from('chat_messages')
          .update({ 
            status: 'error',
            error_message: ingressResponse.error,
            updated_at: new Date().toISOString()
          })
          .eq('id', userMsg.id);

        return NextResponse.json({
          success: false,
          error: ingressResponse.error,
          messageId: userMsg.id,
          clientMsgId
        });
      }
    } catch (n8nError) {
      console.error('❌ [API] n8n 發送異常:', n8nError);
      
      // 更新訊息狀態為 error
      await supabase
        .from('chat_messages')
        .update({ 
          status: 'error',
          error_message: n8nError instanceof Error ? n8nError.message : 'n8n 發送異常',
          updated_at: new Date().toISOString()
        })
        .eq('id', userMsg.id);

      return NextResponse.json({
        success: false,
        error: n8nError instanceof Error ? n8nError.message : 'n8n 發送異常',
        messageId: userMsg.id,
        clientMsgId
      });
    }

  } catch (error) {
    console.error('❌ [API] 意外錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}
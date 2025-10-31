import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';
import { generateULID } from '@/lib/ulid';
import { createIngressClient } from '@/lib/ingress';

// 簡化的訊息發送 API 路由
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] 開始處理 POST 請求...');
    
    const body = await request.json();
    console.log('📦 [API] 請求 Body:', body);
    
    const { 
      threadId, 
      userId, 
      content, 
      roleHint = 'hibi',
      selectedRole,  // 新增：選擇的角色設定
      projectInfo,   // 新增：專案資訊
      groupRoles     // 新增：群組角色列表
    } = body;

    console.log('🚀 [API] 收到訊息發送請求:', { threadId, userId, content, roleHint, selectedRole, projectInfo, groupRoles });
    console.log('🔍 [API] 參數類型檢查:', {
      threadIdType: typeof threadId,
      userIdType: typeof userId,
      contentType: typeof content,
      roleHintType: typeof roleHint,
      selectedRoleType: typeof selectedRole,
      projectInfoType: typeof projectInfo,
      groupRolesType: typeof groupRoles
    });

    // 驗證必要參數
    if (!threadId || !userId || !content) {
      console.error('❌ [API] 參數驗證失敗:', { 
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
    
    console.log('📝 [API] 開始發送到 n8n...', { threadId, clientMsgId });

    // === 步驟 1: 直接發送到 n8n（讓 /api/webhook/ingress 負責插入訊息）===
    try {
      const ingressClient = createIngressClient();
      
      console.log('🚀 [API] 開始發送到 n8n...');
      
      const ingressResponse = await ingressClient.sendMessage(threadId, content, {
        roleHint,
        messageType: 'user_request',
        clientMsgId: clientMsgId,  // ⭐ 使用相同的 client_msg_id
        selectedRole: selectedRole || {},  // 新增：傳遞選擇的角色設定
        project: projectInfo || {},        // 新增：傳遞專案資訊
        groupRoles: groupRoles || [],      // 新增：傳遞群組角色列表
        extra: {
          user_id: userId,
          client_msg_id: clientMsgId
        }
      });

      if (ingressResponse.success) {
        console.log('✅ [API] 成功發送到 n8n:', ingressResponse);
        
        return NextResponse.json({
          success: true,
          messageId: ingressResponse.message_id || clientMsgId,
          clientMsgId,
          ingressResponse
        });
      } else {
        console.error('❌ [API] n8n 發送失敗:', ingressResponse.error);
        
        return NextResponse.json({
          success: false,
          error: ingressResponse.error,
          messageId: ingressResponse.message_id || clientMsgId,
          clientMsgId
        });
      }
    } catch (n8nError) {
      console.error('❌ [API] n8n 發送異常:', n8nError);
      
      return NextResponse.json({
        success: false,
        error: n8nError instanceof Error ? n8nError.message : 'n8n 發送異常',
        messageId: clientMsgId,
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

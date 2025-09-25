import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;
const ingressSecret = process.env.INGRESS_SECRET || 'your-secret-key';
const n8nJwtSecret = process.env.N8N_JWT_SECRET || 'your-jwt-secret';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 簡易除錯資訊（不輸出敏感 key）
function buildDebug(extra?: Record<string, any>) {
  try {
    return {
      env: {
        supabase_url_suffix: (process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || '').slice(-8),
        has_service_key: !!process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY,
        base_url_suffix: (process.env.NEXT_PUBLIC_BASE_URL || '').slice(-8),
        n8n_url_suffix: (process.env.N8N_INGRESS_WEBHOOK_URL || '').slice(-8),
        default_owner_suffix: (process.env.ECHO_DEFAULT_OWNER_ID || '').slice(-8)
      },
      ...extra
    };
  } catch {
    return extra || {};
  }
}

// 統一接收器請求介面
interface IngressRequest {
  spec_version: string;
  event_type: string;
  thread_id: string;
  client_msg_id: string;
  role_hint: string;
  message_type: string;
  payload: {
    text?: string;
    extra?: Record<string, any>;
  };
  priority: string;
  timestamp: number;
}

// 統一接收器響應介面
interface IngressResponse {
  success: boolean;
  received: string;
  thread_id: string;
  message_id: string;
  estimated_processing_time?: number;
  error?: string;
}

// JWT 驗證函數
function verifyJWT(authHeader: string): boolean {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前綴
    const decoded = jwt.verify(token, n8nJwtSecret);
    
    // 檢查 JWT 是否包含必要的聲明
    if (typeof decoded === 'object' && decoded !== null) {
      const payload = decoded as any;
      return payload.admin === true && payload.name === 'HanamiEcho';
    }
    
    return false;
  } catch (error) {
    console.error('JWT 驗證錯誤:', error);
    return false;
  }
}

// 簽名驗證函數
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('簽名驗證錯誤:', error);
    return false;
  }
}

// 生成簽名函數
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// 檢查冪等性
async function checkIdempotency(clientMsgId: string, threadId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('client_msg_id', clientMsgId)
      .eq('thread_id', threadId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('冪等性檢查錯誤:', error);
      return false;
    }

    return !!data; // 如果找到記錄，說明已經處理過
  } catch (error) {
    console.error('冪等性檢查異常:', error);
    return false;
  }
}

// 創建用戶訊息記錄
async function createUserMessage(
  threadId: string,
  clientMsgId: string,
  content: string,
  userId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        role: 'user',
        message_type: 'user_request',
        content: content,
        client_msg_id: clientMsgId,
        status: 'queued',
        turn_no: 0
      })
      .select('id')
      .single();

    if (error) {
      console.error('創建用戶訊息錯誤:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('創建用戶訊息異常:', error);
    throw error;
  }
}

// 檢查用戶食量餘額
async function checkUserFoodBalance(userId: string, estimatedCost: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_food_balance')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('檢查食量餘額錯誤:', error);
      return false;
    }

    return data.current_balance >= estimatedCost;
  } catch (error) {
    console.error('檢查食量餘額異常:', error);
    return false;
  }
}

// 發送到 n8n 工作流
async function sendToN8nWorkflow(request: IngressRequest, messageId: string): Promise<void> {
  try {
    const n8nWebhookUrl = process.env.N8N_INGRESS_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      throw new Error('N8N_INGRESS_WEBHOOK_URL 環境變數未設置');
    }

    const payload = {
      ...request,
      message_id: messageId,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhook/ingress/callback`
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Signature': generateSignature(JSON.stringify(payload), ingressSecret)
    };

    // 如果設定了 JWT 密鑰，則添加 JWT 認證
    if (n8nJwtSecret && n8nJwtSecret !== 'your-jwt-secret') {
      try {
        const jwtToken = jwt.sign(
          {
            sub: "1234567890",
            name: "HanamiEcho",
            admin: true,
            iat: Math.floor(Date.now() / 1000)
          },
          n8nJwtSecret,
          { algorithm: 'HS256' }
        );
        headers['Authorization'] = `Bearer ${jwtToken}`;
        console.log('✅ 已添加 JWT 認證');
      } catch (error) {
        console.error('❌ JWT 生成失敗，使用簽名認證:', error);
      }
    } else {
      console.log('⚠️ 未設定 JWT 密鑰，使用簽名認證');
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // 嘗試讀取錯誤詳情
      let errorDetail = '';
      try {
        const errorText = await response.text();
        errorDetail = errorText ? ` - ${errorText}` : '';
      } catch (e) {
        // 忽略讀取錯誤詳情時的錯誤
      }
      throw new Error(`n8n 工作流調用失敗: ${response.status} ${response.statusText}${errorDetail}`);
    }

    console.log('成功發送到 n8n 工作流:', messageId);
  } catch (error) {
    console.error('發送到 n8n 工作流錯誤:', error);
    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<IngressResponse>> {
  try {
    // 1. 獲取請求體和認證信息
    const body = await request.text();
    const signature = request.headers.get('X-Signature') || '';
    const authHeader = request.headers.get('Authorization') || '';
    
    // 2. 驗證 JWT 認證（優先）
    if (authHeader) {
      if (!verifyJWT(authHeader)) {
        console.error('JWT 驗證失敗');
        return NextResponse.json({
          success: false,
          received: '',
          thread_id: '',
          message_id: '',
          error: 'JWT 認證失敗'
        }, { status: 401 });
      }
    } else {
      // 3. 如果沒有 JWT，則驗證簽名（向後兼容）
      if (!verifySignature(body, signature, ingressSecret)) {
        console.error('簽名驗證失敗');
        return NextResponse.json({
          success: false,
          received: '',
          thread_id: '',
          message_id: '',
          error: '認證失敗（需要 JWT 或有效簽名）'
        }, { status: 401 });
      }
    }

    // 3. 解析請求
    const ingressRequest: IngressRequest = JSON.parse(body);
    const { thread_id, client_msg_id, payload, event_type } = ingressRequest;

    // 4. 基本驗證（訊息與事件皆可）
    if (!thread_id || !client_msg_id) {
      return NextResponse.json({
        success: false,
        received: client_msg_id || '',
        thread_id: thread_id || '',
        message_id: '',
        error: '缺少必要參數'
      }, { status: 400 });
    }

    // 5. 檢查冪等性
    const isDuplicate = await checkIdempotency(client_msg_id, thread_id);
    if (isDuplicate) {
      console.log('重複請求，跳過處理:', client_msg_id);
      return NextResponse.json({
        success: true,
        received: client_msg_id,
        thread_id: thread_id,
        message_id: '',
        error: '重複請求'
      });
    }

    // 6. 確保 chat_threads 存在（強制 upsert）
    const hintedUserId: string | undefined = (ingressRequest as any)?.payload?.extra?.user_id;
    if (!hintedUserId) {
      // 若前端未提供 user_id，仍保留後續兼容邏輯；但建議前端務必傳 user_id
      console.warn('Ingress: payload.extra.user_id 缺失，將嘗試相容路徑');
    } else {
      // 使用 upsert 直接建立/確保存在
      const { error: upsertErr } = await supabase
        .from('chat_threads')
        .upsert({
          id: thread_id,
          user_id: hintedUserId,
          title: 'AI 專案',
          thread_type: 'project',
          settings: { ai_room_id: thread_id, ensured_by: 'ingress_upsert' }
        }, { onConflict: 'id' });
      if (upsertErr) {
        console.error('強制 upsert chat_threads 失敗:', upsertErr);
      }
    }

    // 6.1 獲取用戶 ID (從 chat_threads)
    let { data: threadData, error: threadError } = await supabase
      .from('chat_threads')
      .select('user_id')
      .eq('id', thread_id)
      .single();

    // 6.1 兼容舊系統: 若 chat_threads 不存在，嘗試以 ai_rooms 建立對應的 thread
    if (threadError || !threadData) {
      try {
        const { data: room, error: roomErr } = await supabase
          .from('ai_rooms')
          .select('id, title, created_by')
          .eq('id', thread_id)
          .single();

        if (!room || roomErr) {
          // 次級兼容：從 room_members 尋找擁有者
          const { data: ownerMember } = await supabase
            .from('room_members')
            .select('user_id')
            .eq('room_id', thread_id)
            .eq('role', 'owner')
            .maybeSingle();

          const fallbackOwner = ownerMember?.user_id || null;

          if (!fallbackOwner) {
            return NextResponse.json({
              success: false,
              received: client_msg_id,
              thread_id: thread_id,
              message_id: '',
              error: '找不到對應的聊天線程',
              debug: buildDebug({ stage: 'room_members_owner_missing', thread_lookup_error: threadError || null, room_lookup_error: roomErr || null })
            }, { status: 404 });
          }

          const { data: createdThread, error: createFromMemberErr } = await supabase
            .from('chat_threads')
            .insert({
              id: thread_id,
              user_id: fallbackOwner,
              title: 'AI 專案',
              thread_type: 'project',
              settings: { migrated_from: 'room_members', ai_room_id: thread_id }
            })
            .select('user_id')
            .single();

          if (createFromMemberErr || !createdThread) {
            return NextResponse.json({
              success: false,
              received: client_msg_id,
              thread_id: thread_id,
              message_id: '',
              error: '找不到對應的聊天線程',
              debug: buildDebug({ stage: 'create_from_room_members_failed', create_error: createFromMemberErr || null })
            }, { status: 404 });
          }

          threadData = createdThread;
        } else {
          // 用相同 UUID 建立 chat_threads（一次性遷移）
          const { data: newThread, error: createErr } = await supabase
            .from('chat_threads')
            .insert({
              id: room.id,
              user_id: room.created_by,
              title: room.title || 'AI 專案',
              thread_type: 'project',
              settings: { ai_room_id: room.id }
            })
            .select('user_id')
            .single();

          if (createErr || !newThread) {
            return NextResponse.json({
              success: false,
              received: client_msg_id,
              thread_id: thread_id,
              message_id: '',
              error: '無法建立對應聊天線程',
              debug: buildDebug({ stage: 'create_from_ai_rooms_failed', create_error: createErr || null })
            }, { status: 500 });
          }

          threadData = newThread;
        }
      } catch (compatErr) {
        // 最終回退：若 payload 夾帶 user_id，直接以該 user_id 建立 chat_threads
        try {
          const hintedUserId = (ingressRequest as any)?.payload?.extra?.user_id;
          if (!hintedUserId) throw new Error('no hinted user');

          const { data: createdThread2, error: create2Err } = await supabase
            .from('chat_threads')
            .insert({
              id: thread_id,
              user_id: hintedUserId,
              title: 'AI 專案',
              thread_type: 'project',
              settings: { migrated_from: 'fallback', ai_room_id: thread_id }
            })
            .select('user_id')
            .single();

          if (create2Err || !createdThread2) {
            return NextResponse.json({
              success: false,
              received: client_msg_id,
              thread_id: thread_id,
              message_id: '',
              error: '找不到對應的聊天線程',
              debug: buildDebug({ stage: 'fallback_create_with_user_id_failed', create_error: create2Err || null, compat_error: (compatErr as Error)?.message || String(compatErr) })
            }, { status: 404 });
          }

          threadData = createdThread2;
        } catch (_e) {
          return NextResponse.json({
            success: false,
            received: client_msg_id,
            thread_id: thread_id,
            message_id: '',
            error: '找不到對應的聊天線程',
            debug: buildDebug({ stage: 'all_fallback_failed', compat_error: (compatErr as Error)?.message || String(compatErr), last_error: (_e as Error)?.message || String(_e) })
          }, { status: 404 });
        }
      }
    }

    let userId = threadData.user_id;
    // 若前端有傳 user_id，優先使用（舊房間未設 owner 時）
    if (!userId && payload?.extra?.user_id) {
      userId = payload.extra.user_id;
    }

    // 7. 檢查用戶食量餘額 (預估成本)
    const estimatedCost = 10; // 預估食量消耗
    const hasEnoughBalance = await checkUserFoodBalance(userId, estimatedCost);
    if (!hasEnoughBalance) {
      return NextResponse.json({
        success: false,
        received: client_msg_id,
        thread_id: thread_id,
        message_id: '',
        error: '食量餘額不足'
      }, { status: 402 });
    }

    // 8. 根據事件類型處理：
    let messageId = '';
    if (event_type === 'message.created') {
      if (!payload?.text) {
        return NextResponse.json({
          success: false,
          received: client_msg_id,
          thread_id: thread_id,
          message_id: '',
          error: '缺少訊息文字'
        }, { status: 400 });
      }
      messageId = await createUserMessage(
        thread_id,
        client_msg_id,
        payload.text,
        userId
      );
    } else if (event_type === 'blackboard_update' || event_type === 'task_update') {
      // 事件型：仍建立一筆 system/internal 訊息做審計
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: thread_id,
          role: 'system',
          message_type: 'plan',
          content: JSON.stringify({ event_type, ...payload }),
          client_msg_id: client_msg_id,
          status: 'completed',
          turn_no: 0
        })
        .select('id')
        .single();
      if (error) {
        return NextResponse.json({
          success: false,
          received: client_msg_id,
          thread_id: thread_id,
          message_id: '',
          error: '事件訊息建立失敗'
        }, { status: 500 });
      }
      messageId = data.id;
    } else {
      return NextResponse.json({
        success: false,
        received: client_msg_id,
        thread_id: thread_id,
        message_id: '',
        error: '不支援的事件類型'
      }, { status: 400 });
    }

    // 9. 發送到 n8n 工作流
    await sendToN8nWorkflow(ingressRequest, messageId);

    // 10. 返回成功響應
    return NextResponse.json({
      success: true,
      received: client_msg_id,
      thread_id: thread_id,
      message_id: messageId,
      estimated_processing_time: 30 // 預估處理時間（秒）
    });

  } catch (error) {
    console.error('統一接收器錯誤:', error);
    return NextResponse.json({
      success: false,
      received: '',
      thread_id: '',
      message_id: '',
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// 健康檢查端點
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}

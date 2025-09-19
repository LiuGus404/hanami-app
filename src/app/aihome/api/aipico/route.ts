export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// 安全性：使用環境變數設定 Webhook 與憑證
const WEBHOOK_URL = process.env.AIPICO_WEBHOOK_URL || 'https://webhook.lingumiai.com/webhook/aipico';
const WEBHOOK_BEARER = process.env.AIPICO_WEBHOOK_BEARER || '';
const WEBHOOK_SECRET = process.env.AIPICO_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    console.log('🚀 AIPICO API 開始處理請求');
    console.log('🌐 Webhook URL:', WEBHOOK_URL);
    console.log('🔑 Bearer Token:', WEBHOOK_BEARER ? '已設定' : '未設定');
    
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      console.error('❌ 無效的 JSON body');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    console.log('📝 接收到的 body:', body);

    const { 
      user_id, 
      final_prompt, 
      style, 
      size, 
      model, 
      timestamp,
      session_id,
      companion_id,
      user_info,
      context,
      memory_context,
      response_preferences
    } = body as {
      user_id?: string;
      final_prompt?: string;
      style?: string;
      size?: string;
      model?: string;
      timestamp?: string;
      session_id?: string;
      companion_id?: string;
      user_info?: any;
      context?: any;
      memory_context?: any;
      response_preferences?: any;
    };

    if (!user_id || !final_prompt) {
      console.error('❌ 缺少必要欄位:', { user_id, final_prompt });
      return NextResponse.json({ error: 'Missing required fields: user_id, final_prompt' }, { status: 400 });
    }

    // 暫時跳過用戶驗證，先測試 webhook 連接
    console.log('🔍 跳過用戶驗證，直接測試 webhook:', user_id);
    
    // TODO: 之後重新啟用用戶驗證
    // const { data: userRow, error: userErr } = await supabase
    //   .from('saas_users' as any)
    //   .select('id')
    //   .eq('id', user_id)
    //   .single();
    // 
    // if (userErr || !userRow) {
    //   console.error('❌ 用戶不存在:', { userErr, userRow });
    //   return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // }

    console.log('✅ 跳過用戶驗證');

    // 建立基礎 payload
    const payloadItem: any = {
      user_id,
      final_prompt,
      model: model ?? 'flux-dev',
      timestamp: timestamp ?? new Date().toISOString(),
      session_id: session_id ?? `session_${Date.now()}`,
      companion_id: companion_id ?? 'pico',
      user_info: user_info ?? {
        name: '用戶',
        email: '',
        id: user_id
      },
      context: context ?? {
        previous_messages: [],
        conversation_id: `conv_${user_id}_${Date.now()}`,
        platform: 'hanami-web',
        chat_type: 'individual_companion_chat'
      },
      memory_context: memory_context ?? {
        scope: 'user',
        role_id: 'pico-artist',
        should_store_memory: true,
        memory_importance: 0.7
      },
      response_preferences: response_preferences ?? {
        include_image: true,
        include_text_response: true,
        max_response_length: 200
      }
    };

    // 只有在明確提供時才添加 style 和 size
    if (style) {
      payloadItem.style = style;
      console.log('✨ API 添加風格參數:', style);
    }
    
    if (size) {
      payloadItem.size = size;
      console.log('📐 API 添加尺寸參數:', size);
    }

    const payload = [payloadItem];

    console.log('📦 準備發送 payload:', payload);

    // 安全性：HMAC 簽名 + Bearer Token
    const signatureTimestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${signatureTimestamp}.${JSON.stringify(payload)}`;
    const signature = WEBHOOK_SECRET
      ? crypto.createHmac('sha256', WEBHOOK_SECRET).update(message).digest('hex')
      : '';

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'hanami-web/1.0',
      'Accept': 'application/json',
      ...(WEBHOOK_BEARER ? { Authorization: `Bearer ${WEBHOOK_BEARER}` } : {}),
      ...(WEBHOOK_SECRET ? { 'X-Timestamp': signatureTimestamp, 'X-Signature': signature } : {}),
      'X-Client': 'hanami-web',
    };

    console.log('📤 發送 headers:', headers);

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    console.log('📥 Webhook 回應狀態:', res.status);

    const text = await res.text();
    console.log('📥 Webhook 回應內容:', text);
    console.log('📥 回應內容長度:', text.length);
    console.log('📥 回應內容類型:', typeof text);
    
    const contentType = res.headers.get('content-type') || '';
    console.log('📥 Content-Type:', contentType);
    const jsonSafe = contentType.includes('application/json');
    console.log('📥 是否為 JSON:', jsonSafe);
    
    let out;
    if (jsonSafe && text.trim()) {
      try {
        out = JSON.parse(text);
        console.log('📥 成功解析 JSON:', out);
      } catch (error) {
        console.error('❌ JSON 解析失敗:', error);
        out = { raw: text };
      }
    } else {
      out = { raw: text };
      console.log('📥 作為純文字處理:', out);
    }

    console.log('✅ 處理完成，準備回傳結果:', { ok: res.ok, status: res.status, data: out });
    
    return NextResponse.json(
      { ok: res.ok, status: res.status, data: out },
      { status: res.ok ? 200 : res.status }
    );
  } catch (error) {
    console.error('❌ AIPICO webhook 錯誤:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

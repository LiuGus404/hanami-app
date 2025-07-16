import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 添加 CORS 支援
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [AI訊息API] 開始處理請求...');
    
    const body = await request.json();
    console.log('📦 [AI訊息API] 收到請求內容:', JSON.stringify(body, null, 2));
    
    const {
      studentId,
      studentName,
      studentPhone,
      templateId,
      templateName,
      messageContent,
      variables,
    } = body;

    // 驗證必要欄位
    if (!studentId || !studentName || !templateId || !messageContent) {
      console.log('❌ [AI訊息API] 缺少必要欄位:', { studentId, studentName, templateId, messageContent });
      return NextResponse.json(
        { error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    console.log('✅ [AI訊息API] 欄位驗證通過');

    // 記錄到資料庫
    console.log('💾 [AI訊息API] 開始記錄到資料庫...');
    const { data: logData, error: logError } = await supabase
      .from('hanami_ai_message_logs')
      .insert({
        student_id: studentId,
        student_name: studentName,
        student_phone: studentPhone,
        template_id: templateId,
        template_name: templateName,
        message_content: messageContent,
        status: 'pending',
        created_by: null, // 可以從session中獲取
      });

    if (logError) {
      console.error('❌ [AI訊息API] 記錄訊息失敗:', logError);
      return NextResponse.json(
        { error: '記錄訊息失敗' },
        { status: 500 }
      );
    }

    // 獲取插入的記錄ID
    const { data: insertedData, error: fetchError } = await supabase
      .from('hanami_ai_message_logs')
      .select('id')
      .eq('student_id', studentId)
      .eq('template_id', templateId)
      .eq('message_content', messageContent)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !insertedData) {
      console.error('❌ [AI訊息API] 獲取插入記錄失敗:', fetchError);
      return NextResponse.json(
        { error: '獲取記錄失敗' },
        { status: 500 }
      );
    }

    const logId = insertedData.id;
    console.log('✅ [AI訊息API] 資料庫記錄成功, logId:', logId);

    // 發送到Webhook (這裡需要配置您的n8n webhook URL)
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://webhook.lingumiai.com/webhook/f49613fa-6f0a-4fcf-bf77-b72074c8ae2c';
    console.log('📡 [AI訊息API] 準備發送到webhook:', webhookUrl);
    
    const webhookPayload = {
      studentId,
      studentName,
      studentPhone,
      templateId,
      templateName,
      messageContent,
      variables,
      timestamp: new Date().toISOString(),
    };

    console.log('📦 [AI訊息API] Webhook payload:', JSON.stringify(webhookPayload, null, 2));

    console.log('🚀 [AI訊息API] 開始發送webhook請求...');
    
    // 添加超時設定和更好的錯誤處理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Hanami-Web-App/1.0',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📊 [AI訊息API] Webhook回應狀態:', webhookResponse.status, webhookResponse.statusText);
      console.log('📋 [AI訊息API] Webhook回應標頭:', Object.fromEntries(webhookResponse.headers.entries()));

      const webhookResponseText = await webhookResponse.text();
      console.log('📄 [AI訊息API] Webhook回應內容:', webhookResponseText);

      // 更新發送狀態
      const updateData = {
        webhook_response: {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          timestamp: new Date().toISOString(),
          responseText: webhookResponseText,
        },
        status: webhookResponse.ok ? 'sent' : 'failed',
      };

      console.log('💾 [AI訊息API] 更新資料庫狀態:', updateData);

      const { error: updateError } = await supabase
        .from('hanami_ai_message_logs')
        .update(updateData)
        .eq('id', logId);

      if (updateError) {
        console.error('❌ [AI訊息API] 更新發送狀態失敗:', updateError);
      } else {
        console.log('✅ [AI訊息API] 資料庫狀態更新成功');
      }

      if (!webhookResponse.ok) {
        console.log('❌ [AI訊息API] Webhook發送失敗，回傳錯誤');
        return NextResponse.json(
          { error: `發送失敗: HTTP ${webhookResponse.status} - ${webhookResponse.statusText}` },
          { status: 500 }
        );
      }

      console.log('✅ [AI訊息API] 所有處理完成，回傳成功');
      return NextResponse.json({
        success: true,
        messageId: logId,
        status: 'sent',
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ [AI訊息API] Webhook請求失敗:', fetchError);
      
      // 更新資料庫狀態為失敗
      const updateData = {
        webhook_response: {
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        status: 'failed',
      };

      await supabase
        .from('hanami_ai_message_logs')
        .update(updateData)
        .eq('id', logId);

      return NextResponse.json(
        { error: `網路錯誤: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 [AI訊息API] 處理過程中發生錯誤:', error);
    return NextResponse.json(
      { error: '發送失敗' },
      { status: 500 }
    );
  }
} 
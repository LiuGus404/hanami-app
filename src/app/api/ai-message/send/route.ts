import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ [AI訊息API] 記錄訊息失敗:', logError);
      return NextResponse.json(
        { error: '記錄訊息失敗' },
        { status: 500 }
      );
    }

    console.log('✅ [AI訊息API] 資料庫記錄成功, logId:', logData.id);

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
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

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
      .eq('id', logData.id);

    if (updateError) {
      console.error('❌ [AI訊息API] 更新發送狀態失敗:', updateError);
    } else {
      console.log('✅ [AI訊息API] 資料庫狀態更新成功');
    }

    if (!webhookResponse.ok) {
      console.log('❌ [AI訊息API] Webhook發送失敗，回傳錯誤');
      return NextResponse.json(
        { error: `發送失敗: HTTP ${webhookResponse.status}` },
        { status: 500 }
      );
    }

    console.log('✅ [AI訊息API] 所有處理完成，回傳成功');
    return NextResponse.json({
      success: true,
      messageId: logData.id,
      status: 'sent',
    });

  } catch (error) {
    console.error('💥 [AI訊息API] 處理過程中發生錯誤:', error);
    return NextResponse.json(
      { error: '發送失敗' },
      { status: 500 }
    );
  }
} 
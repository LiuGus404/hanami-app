import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 記錄到資料庫
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
      console.error('記錄訊息失敗:', logError);
      return NextResponse.json(
        { error: '記錄訊息失敗' },
        { status: 500 }
      );
    }

    // 發送到Webhook (這裡需要配置您的n8n webhook URL)
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ai-message';
    
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

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    // 更新發送狀態
    const updateData = {
      webhook_url: webhookUrl,
      webhook_response: {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        timestamp: new Date().toISOString(),
      },
      status: webhookResponse.ok ? 'sent' : 'failed',
      error_message: webhookResponse.ok ? null : `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`,
    };

    const { error: updateError } = await supabase
      .from('hanami_ai_message_logs')
      .update(updateData)
      .eq('id', logData.id);

    if (updateError) {
      console.error('更新發送狀態失敗:', updateError);
    }

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: `發送失敗: HTTP ${webhookResponse.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: logData.id,
      status: 'sent',
    });

  } catch (error) {
    console.error('發送AI訊息失敗:', error);
    return NextResponse.json(
      { error: '發送失敗' },
      { status: 500 }
    );
  }
} 
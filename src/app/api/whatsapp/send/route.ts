import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    // 驗證輸入
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: '電話號碼和訊息內容都是必需的' },
        { status: 400 }
      );
    }

    // 從環境變量獲取配置（服務端環境變量，更安全）
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      console.error('WhatsApp webhook 配置未設置');
      return NextResponse.json(
        { error: 'WhatsApp 服務配置錯誤' },
        { status: 500 }
      );
    }

    // 格式化電話號碼（確保有 +852 前綴）
    const formattedPhone = phoneNumber.startsWith('+852') 
      ? phoneNumber 
      : `+852${phoneNumber}`;

    // 發送到 WhatsApp webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${webhookSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('WhatsApp API 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { error: `發送失敗: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: '訊息發送成功',
      data: result
    });

  } catch (error) {
    console.error('WhatsApp 發送錯誤:', error);
    
    return NextResponse.json(
      { 
        error: '發送失敗，請稍後再試',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

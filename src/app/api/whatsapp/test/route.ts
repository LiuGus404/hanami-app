import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 檢查環境變量配置
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

    return NextResponse.json({
      success: true,
      config: {
        webhookUrl: webhookUrl ? '已設置' : '未設置',
        webhookSecret: webhookSecret ? '已設置' : '未設置',
        hasUrl: !!webhookUrl,
        hasSecret: !!webhookSecret
      },
      message: 'WhatsApp API 配置檢查完成'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: '配置檢查失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

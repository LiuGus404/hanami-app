import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '缺少驗證 token' },
        { status: 400 }
      );
    }

    // 向 Cloudflare 驗證 Turnstile token
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
        remoteip: (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      }),
    });

    const result = await response.json();
    
    console.log('Turnstile 驗證結果:', {
      success: result.success,
      errorCodes: result['error-codes'],
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true,
        timestamp: result.timestamp,
        challenge_ts: result['challenge_ts']
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Turnstile 驗證失敗',
          errorCodes: result['error-codes'] || []
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Turnstile 驗證錯誤:', error);
    return NextResponse.json(
      { success: false, error: '驗證過程中發生錯誤' },
      { status: 500 }
    );
  }
}

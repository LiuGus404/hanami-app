import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, type } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: '請提供郵箱或電話號碼' },
        { status: 400 }
      );
    }

    // 生成 6 位數驗證碼
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (type === 'email' && email) {
      // 這裡應該實際發送郵件
      // 暫時模擬發送成功
      console.log(`發送郵件驗證碼到 ${email}: ${verificationCode}`);
      
      // 在實際應用中，您需要：
      // 1. 使用郵件服務（如 SendGrid, AWS SES 等）
      // 2. 將驗證碼存儲到資料庫或 Redis
      // 3. 設置過期時間
      
      return NextResponse.json({
        success: true,
        message: '驗證碼已發送到您的郵箱',
        // 在開發環境中返回驗證碼，生產環境中不應該返回
        ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
      });
    }

    if (type === 'phone' && phone) {
      // 這裡應該實際發送簡訊
      // 暫時模擬發送成功
      console.log(`發送簡訊驗證碼到 ${phone}: ${verificationCode}`);
      
      // 在實際應用中，您需要：
      // 1. 使用簡訊服務（如 Twilio, AWS SNS 等）
      // 2. 將驗證碼存儲到資料庫或 Redis
      // 3. 設置過期時間
      
      return NextResponse.json({
        success: true,
        message: '驗證碼已發送到您的手機',
        // 在開發環境中返回驗證碼，生產環境中不應該返回
        ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
      });
    }

    return NextResponse.json(
      { error: '無效的驗證類型' },
      { status: 400 }
    );

  } catch (error) {
    console.error('發送驗證碼錯誤:', error);
    return NextResponse.json(
      { error: '發送驗證碼失敗' },
      { status: 500 }
    );
  }
}


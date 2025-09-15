import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, code, type } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '請提供驗證碼' },
        { status: 400 }
      );
    }

    // 在實際應用中，您需要：
    // 1. 從資料庫或 Redis 中獲取存儲的驗證碼
    // 2. 檢查驗證碼是否過期
    // 3. 驗證碼是否匹配
    // 4. 驗證成功後標記為已驗證

    // 暫時模擬驗證邏輯
    // 在開發環境中，任何 6 位數驗證碼都會通過
    const isValidCode = /^\d{6}$/.test(code);

    if (!isValidCode) {
      return NextResponse.json(
        { error: '驗證碼格式錯誤' },
        { status: 400 }
      );
    }

    if (type === 'email') {
      console.log(`驗證郵箱 ${email} 的驗證碼: ${code}`);
      
      return NextResponse.json({
        success: true,
        message: '郵箱驗證成功',
        verified: true
      });
    }

    if (type === 'phone') {
      console.log(`驗證電話 ${phone} 的驗證碼: ${code}`);
      
      return NextResponse.json({
        success: true,
        message: '電話驗證成功',
        verified: true
      });
    }

    return NextResponse.json(
      { error: '無效的驗證類型' },
      { status: 400 }
    );

  } catch (error) {
    console.error('驗證碼驗證錯誤:', error);
    return NextResponse.json(
      { error: '驗證失敗' },
      { status: 500 }
    );
  }
}


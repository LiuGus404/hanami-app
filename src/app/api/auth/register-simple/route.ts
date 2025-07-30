import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role, additional_info } = body;

    console.log('開始處理簡化註冊請求:', { email, full_name, role });

    // 1. 驗證輸入
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({
        error: '缺少必要參數'
      }, { status: 400 });
    }

    // 2. 檢查郵箱是否已存在
    const { data: existingRequests, error: checkError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email);

    if (checkError) {
      console.error('檢查現有註冊申請錯誤:', checkError);
      return NextResponse.json({
        error: '檢查註冊申請失敗'
      }, { status: 500 });
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json({
        error: '該郵箱已有註冊申請，請等待審核或使用其他郵箱'
      }, { status: 400 });
    }

    // 3. 創建註冊申請記錄（不包含密碼，密碼將在批准時使用）
    const { data: registrationData, error: registrationError } = await supabase
      .from('registration_requests')
      .insert({
        email: email,
        full_name: full_name,
        phone: phone,
        role: role,
        additional_info: {
          ...additional_info,
          password: password // 將密碼存儲在 additional_info 中
        },
        status: 'pending' // 直接等待管理員審核
      })
      .select()
      .single();

    if (registrationError) {
      console.error('創建註冊申請失敗:', registrationError);
      return NextResponse.json({
        error: '創建註冊申請失敗',
        details: registrationError.message
      }, { status: 500 });
    }

    console.log('註冊申請創建成功:', registrationData);

    return NextResponse.json({
      success: true,
      message: '註冊申請已提交！管理員將審核您的申請，審核結果將通過電子郵件通知您。',
      registrationId: registrationData.id,
      email: email
    });

  } catch (error: any) {
    console.error('簡化註冊處理錯誤:', error);
    return NextResponse.json({
      error: error.message || '註冊時發生錯誤'
    }, { status: 500 });
  }
} 
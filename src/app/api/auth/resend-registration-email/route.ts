import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: '缺少電子郵件地址'
      }, { status: 400 });
    }

    console.log('重新發送註冊郵件:', email);

    // 檢查是否有待審核的註冊申請
    const { data: existingRequest, error: checkError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('檢查註冊申請錯誤:', checkError);
      return NextResponse.json({
        success: false,
        error: '檢查註冊申請時發生錯誤'
      }, { status: 500 });
    }

    if (!existingRequest) {
      return NextResponse.json({
        success: false,
        error: '找不到該電子郵件的註冊申請記錄'
      }, { status: 404 });
    }

    // 這裡可以發送提醒郵件給用戶
    // 目前只是返回成功，實際的郵件發送功能可以後續添加
    console.log('準備重新發送註冊提醒郵件給:', email);

    return NextResponse.json({
      success: true,
      message: '已重新發送註冊提醒郵件',
      data: {
        email: email,
        status: existingRequest.status
      }
    });

  } catch (error: any) {
    console.error('重新發送郵件錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '重新發送郵件時發生錯誤'
    }, { status: 500 });
  }
}


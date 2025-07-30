import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, supabase_user_id } = body;

    if (!email || !supabase_user_id) {
      return NextResponse.json({
        error: '缺少必要參數: email, supabase_user_id'
      }, { status: 400 });
    }

    console.log(`更新註冊申請狀態: ${email}`);

    // 1. 檢查註冊申請是否存在
    const { data: existingRequest, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !existingRequest) {
      console.error('找不到註冊申請:', fetchError);
      return NextResponse.json({
        success: false,
        error: '找不到註冊申請記錄'
      }, { status: 404 });
    }

    // 2. 更新註冊申請狀態
    const { data: updatedRequest, error: updateError } = await supabase
      .from('registration_requests')
      .update({
        status: 'email_confirmed',
        additional_info: {
          ...existingRequest.additional_info,
          email_confirmed_at: new Date().toISOString(),
          supabase_user_id: supabase_user_id
        }
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('更新註冊申請失敗:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新註冊申請失敗'
      }, { status: 500 });
    }

    console.log('註冊申請狀態更新成功:', updatedRequest);

    const result = {
      success: true,
      message: '註冊申請狀態已更新',
      registration_request: updatedRequest,
      next_steps: [
        '您的註冊申請已提交給管理員審核',
        '管理員批准後，您就可以登入系統了',
        '請耐心等待管理員審核結果'
      ]
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('更新註冊申請狀態錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '更新註冊申請狀態時發生錯誤'
    }, { status: 500 });
  }
} 
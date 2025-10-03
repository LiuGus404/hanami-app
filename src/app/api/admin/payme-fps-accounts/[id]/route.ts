import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PaymeFpsAccount, UpdatePaymeFpsAccountRequest } from '@/types/payme-fps';

// 使用 SaaS 系統的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 獲取特定 PAYME FPS 帳戶
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('hanami_payme_fps_accounts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('獲取 PAYME FPS 帳戶失敗:', error);
      return NextResponse.json(
        { success: false, error: '帳戶不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('獲取 PAYME FPS 帳戶 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 更新 PAYME FPS 帳戶
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdatePaymeFpsAccountRequest = await request.json();

    // 如果要設為主要帳戶，先取消其他主要帳戶
    if (body.is_primary && body.institution_name) {
      await supabase
        .from('hanami_payme_fps_accounts')
        .update({ is_primary: false })
        .eq('institution_name', body.institution_name)
        .neq('id', params.id);
    }

    const { data, error } = await supabase
      .from('hanami_payme_fps_accounts')
      .update({
        institution_name: body.institution_name,
        institution_code: body.institution_code,
        payme_phone: body.payme_phone,
        payme_name: body.payme_name,
        payme_link: body.payme_link,
        fps_phone: body.fps_phone,
        fps_name: body.fps_name,
        fps_link: body.fps_link,
        is_primary: body.is_primary,
        is_active: body.is_active,
        notes: body.notes,
        metadata: body.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('更新 PAYME FPS 帳戶失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新帳戶失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('更新 PAYME FPS 帳戶 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 刪除 PAYME FPS 帳戶
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 軟刪除：設為不活躍而不是真正刪除
    const { data, error } = await supabase
      .from('hanami_payme_fps_accounts')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('刪除 PAYME FPS 帳戶失敗:', error);
      return NextResponse.json(
        { success: false, error: '刪除帳戶失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('刪除 PAYME FPS 帳戶 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PaymeFpsAccount, CreatePaymeFpsAccountRequest } from '@/types/payme-fps';

// 使用 SaaS 系統的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 獲取所有 PAYME FPS 帳戶
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionName = searchParams.get('institution_name');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('hanami_payme_fps_accounts')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (institutionName) {
      query = query.eq('institution_name', institutionName);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('獲取 PAYME FPS 帳戶失敗:', error);
      return NextResponse.json(
        { success: false, error: '獲取帳戶資料失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('PAYME FPS 帳戶 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 創建新的 PAYME FPS 帳戶
export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymeFpsAccountRequest = await request.json();

    // 驗證必需欄位
    if (!body.institution_name || !body.payme_phone || !body.payme_name) {
      return NextResponse.json(
        { success: false, error: '缺少必需欄位：機構名稱、PAYME 電話、PAYME 名稱' },
        { status: 400 }
      );
    }

    // 如果要設為主要帳戶，先取消其他主要帳戶
    if (body.is_primary) {
      await supabase
        .from('hanami_payme_fps_accounts')
        .update({ is_primary: false })
        .eq('institution_name', body.institution_name);
    }

    const { data, error } = await supabase
      .from('hanami_payme_fps_accounts')
      .insert({
        institution_name: body.institution_name,
        institution_code: body.institution_code,
        payme_phone: body.payme_phone,
        payme_name: body.payme_name,
        payme_link: body.payme_link,
        fps_phone: body.fps_phone,
        fps_name: body.fps_name,
        fps_link: body.fps_link,
        is_primary: body.is_primary || false,
        notes: body.notes,
        metadata: body.metadata
      })
      .select()
      .single();

    if (error) {
      console.error('創建 PAYME FPS 帳戶失敗:', error);
      return NextResponse.json(
        { success: false, error: '創建帳戶失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('創建 PAYME FPS 帳戶 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

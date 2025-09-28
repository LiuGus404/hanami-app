import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone);
    
    if (!phone) {
      return NextResponse.json(
        { error: '電話號碼參數缺失' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 查詢電話檔案
    const { data: phoneProfile, error } = await supabase
      .from('saas_phone_profiles')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 沒有找到記錄
        return NextResponse.json(
          { error: '未找到電話檔案' },
          { status: 404 }
        );
      }
      
      console.error('查詢電話檔案錯誤:', error);
      return NextResponse.json(
        { error: '查詢電話檔案時發生錯誤' },
        { status: 500 }
      );
    }

    return NextResponse.json(phoneProfile);
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone);
    const body = await request.json();
    
    if (!phone) {
      return NextResponse.json(
        { error: '電話號碼參數缺失' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 創建或更新電話檔案
    const { data, error } = await supabase
      .from('saas_phone_profiles')
      .upsert({
        phone,
        ...body,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone'
      })
      .select()
      .single();

    if (error) {
      console.error('創建/更新電話檔案錯誤:', error);
      return NextResponse.json(
        { error: '創建/更新電話檔案時發生錯誤' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 驗證必要欄位
    const { code, name, institution_name, discount_type, discount_value } = body;
    
    if (!code || !name || !institution_name || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 檢查使用哪個表格
    const { data: tablesData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['hanami_promo_codes', 'saas_coupons']);

    const tableNames = tablesData?.map(t => t.table_name) || [];
    
    let result;

    if (tableNames.includes('hanami_promo_codes')) {
      // 使用 hanami_promo_codes 表格
      const { data, error } = await supabase
        .from('hanami_promo_codes')
        .insert({
          code: code.toUpperCase(),
          name,
          description: body.description || null,
          institution_name,
          institution_code: body.institution_code || null,
          total_usage_limit: body.total_usage_limit || 1,
          discount_type,
          discount_value,
          max_discount_amount: body.max_discount_amount || null,
          valid_until: body.valid_until || null,
          notes: body.notes || null,
          is_active: body.is_active !== false
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else if (tableNames.includes('saas_coupons')) {
      // 使用 saas_coupons 表格
      const { data, error } = await supabase
        .from('saas_coupons')
        .insert({
          coupon_code: code.toUpperCase(),
          coupon_name: name,
          description: body.description || null,
          institution_name,
          institution_code: body.institution_code || null,
          usage_limit: body.total_usage_limit || 1,
          discount_type,
          discount_value,
          max_discount_amount: body.max_discount_amount || null,
          valid_until: body.valid_until || null,
          notes: body.notes || null,
          is_active: body.is_active !== false
        })
        .select()
        .single();

      if (error) throw error;
      
      // 轉換欄位名稱以符合統一格式
      result = {
        id: data.id,
        code: data.coupon_code,
        name: data.coupon_name,
        description: data.description,
        institution_name: data.institution_name,
        institution_code: data.institution_code,
        total_usage_limit: data.usage_limit,
        used_count: data.usage_count,
        used_by_user_ids: data.used_by_user_ids,
        used_by_emails: data.used_by_emails,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_discount_amount: data.max_discount_amount,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        is_active: data.is_active,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } else {
      return NextResponse.json(
        { success: false, error: '找不到優惠碼表格' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promo_code: result
    });

  } catch (error) {
    console.error('創建優惠碼錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '創建優惠碼時發生錯誤'
      },
      { status: 500 }
    );
  }
}

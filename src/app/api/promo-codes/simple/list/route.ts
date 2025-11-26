import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 檢查使用哪個表格
    const { data: tablesData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['hanami_promo_codes', 'saas_coupons']);

    const typedTablesData = (tablesData || []) as Array<{ table_name: string; [key: string]: any }>;
    const tableNames = typedTablesData.map(t => t.table_name);
    
    let promo_codes: any[] = [];
    let table_name = '';

    if (tableNames.includes('hanami_promo_codes')) {
      table_name = 'hanami_promo_codes';
      const { data, error } = await supabase
        .from('hanami_promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      promo_codes = data || [];
    } else if (tableNames.includes('saas_coupons')) {
      table_name = 'saas_coupons';
      const { data, error } = await supabase
        .from('saas_coupons')
        .select(`
          id,
          coupon_code as code,
          coupon_name as name,
          description,
          institution_name,
          institution_code,
          usage_limit as total_usage_limit,
          usage_count as used_count,
          used_by_user_ids,
          used_by_emails,
          discount_type,
          discount_value,
          max_discount_amount,
          valid_from,
          valid_until,
          is_active,
          notes,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      promo_codes = data || [];
    }

    return NextResponse.json({
      success: true,
      promo_codes,
      table_name,
      total: promo_codes.length
    });

  } catch (error) {
    console.error('載入優惠碼列表錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '載入優惠碼列表時發生錯誤',
        promo_codes: [],
        table_name: '',
        total: 0
      },
      { status: 500 }
    );
  }
}

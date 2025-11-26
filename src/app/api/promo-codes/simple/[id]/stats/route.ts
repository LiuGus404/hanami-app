import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 檢查使用哪個表格
    const { data: tablesData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['hanami_promo_codes', 'saas_coupons']);

    const typedTablesData = (tablesData || []) as Array<{ table_name: string; [key: string]: any }>;
    const tableNames = typedTablesData.map(t => t.table_name);
    
    let result: {
      used_count?: number;
      total_usage_limit?: number;
      used_by_user_ids?: string[];
      used_by_emails?: string[];
    } | null = null;

    if (tableNames.includes('hanami_promo_codes')) {
      const { data, error } = await supabase
        .from('hanami_promo_codes')
        .select('used_count, total_usage_limit, used_by_user_ids, used_by_emails')
        .eq('id', id)
        .single();

      if (error) throw error;
      result = data as any;
    } else if (tableNames.includes('saas_coupons')) {
      const { data, error } = await supabase
        .from('saas_coupons')
        .select('usage_count as used_count, usage_limit as total_usage_limit, used_by_user_ids, used_by_emails')
        .eq('id', id)
        .single();

      if (error) throw error;
      result = data as any;
    } else {
      return NextResponse.json(
        { success: false, error: '找不到優惠碼表格' },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: '未找到優惠碼' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      used_count: result.used_count || 0,
      total_usage_limit: result.total_usage_limit,
      used_by_user_ids: result.used_by_user_ids || [],
      used_by_emails: result.used_by_emails || []
    });

  } catch (error) {
    console.error('獲取優惠碼統計錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '獲取優惠碼統計時發生錯誤'
      },
      { status: 500 }
    );
  }
}

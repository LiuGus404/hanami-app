import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 檢查使用哪個表格
    const { data: tablesData } = await ((supabase as any)
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['hanami_promo_codes', 'saas_coupons']));

    const typedTablesData = (tablesData || []) as Array<{ table_name: string; [key: string]: any }>;
    const tableNames = typedTablesData.map(t => t.table_name);
    
    let result;

    if (tableNames.includes('hanami_promo_codes')) {
      const { data, error } = await supabase
        .from('hanami_promo_codes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      result = data;
    } else if (tableNames.includes('saas_coupons')) {
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
        .eq('id', id)
        .single();

      if (error) throw error;
      result = data;
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
    console.error('獲取優惠碼錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '獲取優惠碼時發生錯誤'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // 檢查使用哪個表格
    const { data: tablesData } = await ((supabase as any)
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['hanami_promo_codes', 'saas_coupons']));

    const typedTablesData = (tablesData || []) as Array<{ table_name: string; [key: string]: any }>;
    const tableNames = typedTablesData.map(t => t.table_name);
    
    let result;

    if (tableNames.includes('hanami_promo_codes')) {
      // 準備更新數據
      const updateData: any = {};
      if (body.code) updateData.code = body.code.toUpperCase();
      if (body.name) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.institution_name) updateData.institution_name = body.institution_name;
      if (body.institution_code !== undefined) updateData.institution_code = body.institution_code;
      if (body.total_usage_limit !== undefined) updateData.total_usage_limit = body.total_usage_limit;
      if (body.discount_type) updateData.discount_type = body.discount_type;
      if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
      if (body.max_discount_amount !== undefined) updateData.max_discount_amount = body.max_discount_amount;
      if (body.valid_until !== undefined) updateData.valid_until = body.valid_until;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;

      const { data, error } = await ((supabase as any)
        .from('hanami_promo_codes')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single());

      if (error) throw error;
      result = data;
    } else if (tableNames.includes('saas_coupons')) {
      // 準備更新數據
      const updateData: any = {};
      if (body.code) updateData.coupon_code = body.code.toUpperCase();
      if (body.name) updateData.coupon_name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.institution_name) updateData.institution_name = body.institution_name;
      if (body.institution_code !== undefined) updateData.institution_code = body.institution_code;
      if (body.total_usage_limit !== undefined) updateData.usage_limit = body.total_usage_limit;
      if (body.discount_type) updateData.discount_type = body.discount_type;
      if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
      if (body.max_discount_amount !== undefined) updateData.max_discount_amount = body.max_discount_amount;
      if (body.valid_until !== undefined) updateData.valid_until = body.valid_until;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;

      const { data, error } = await ((supabase as any)
        .from('saas_coupons')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single());

      if (error) throw error;
      
      // 轉換欄位名稱
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
    console.error('更新優惠碼錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '更新優惠碼時發生錯誤'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 檢查使用哪個表格
    const { data: tablesData } = await ((supabase as any)
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['hanami_promo_codes', 'saas_coupons']));

    const typedTablesData = (tablesData || []) as Array<{ table_name: string; [key: string]: any }>;
    const tableNames = typedTablesData.map(t => t.table_name);

    if (tableNames.includes('hanami_promo_codes')) {
      const { error } = await ((supabase as any)
        .from('hanami_promo_codes')
        .delete()
        .eq('id', id));

      if (error) throw error;
    } else if (tableNames.includes('saas_coupons')) {
      const { error } = await ((supabase as any)
        .from('saas_coupons')
        .delete()
        .eq('id', id));

      if (error) throw error;
    } else {
      return NextResponse.json(
        { success: false, error: '找不到優惠碼表格' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '優惠碼已刪除'
    });

  } catch (error) {
    console.error('刪除優惠碼錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '刪除優惠碼時發生錯誤'
      },
      { status: 500 }
    );
  }
}

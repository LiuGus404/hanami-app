import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// 獲取付款記錄
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('payment_method');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSaasSupabaseClient();
    
    let query = supabase
      .from('payment_records')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加篩選條件
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('獲取付款記錄錯誤:', error);
      return NextResponse.json(
        { success: false, error: '獲取付款記錄失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (data?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('付款記錄 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 創建付款記錄
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_method,
      amount,
      currency = 'HKD',
      description,
      user_id,
      user_email,
      metadata
    } = body;

    // 驗證必填欄位
    if (!payment_method || !amount) {
      return NextResponse.json(
        { success: false, error: '缺少必填欄位' },
        { status: 400 }
      );
    }

    const supabase = getSaasSupabaseClient();
    
    const { data, error } = await (supabase as any)
      .from('payment_records')
      .insert({
        payment_method,
        amount: parseFloat(amount),
        currency,
        description,
        user_id,
        user_email,
        metadata,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('創建付款記錄錯誤:', error);
      return NextResponse.json(
        { success: false, error: '創建付款記錄失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('創建付款記錄 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 更新付款記錄
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少付款記錄 ID' },
        { status: 400 }
      );
    }

    const supabase = getSaasSupabaseClient();
    
    const { data, error } = await (supabase as any)
      .from('payment_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新付款記錄錯誤:', error);
      return NextResponse.json(
        { success: false, error: '更新付款記錄失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('更新付款記錄 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 刪除付款記錄
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少付款記錄 ID' },
        { status: 400 }
      );
    }

    const supabase = getSaasSupabaseClient();
    
    const { error } = await supabase
      .from('payment_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('刪除付款記錄錯誤:', error);
      return NextResponse.json(
        { success: false, error: '刪除付款記錄失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '付款記錄已刪除'
    });

  } catch (error) {
    console.error('刪除付款記錄 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

/**
 * GET /api/financial/expenses
 * 獲取支出記錄列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（必需）
 * - userEmail: 用戶 email（用於權限驗證）
 * - startDate: 開始日期（可選）
 * - endDate: 結束日期（可選）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const userEmail = searchParams.get('userEmail');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少 orgId 參數' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (userEmail) {
      console.log('API: 查詢支出記錄，用戶:', userEmail, '機構:', orgId);
    }

    // 構建查詢
    // @ts-ignore - hanami_financial_expenses table may not be in Database type definition
    let query = (supabase as any)
      .from('hanami_financial_expenses')
      .select('*')
      .eq('org_id', orgId);

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }

    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    query = query.order('expense_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('API: 查詢支出記錄錯誤:', error);
      return NextResponse.json(
        { error: '查詢支出記錄失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    console.error('API: 獲取支出記錄異常:', error);
    return NextResponse.json(
      { error: error.message || '獲取支出記錄時發生錯誤' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financial/expenses
 * 新增支出記錄（使用服務角色 key 繞過 RLS）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, userEmail, expense_date, expense_category, expense_description, amount, payment_method, notes } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少 orgId 參數' },
        { status: 400 }
      );
    }

    if (!expense_date || !expense_category || !expense_description || !amount || amount <= 0) {
      return NextResponse.json(
        { error: '缺少必要的支出資訊' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // @ts-ignore - hanami_financial_expenses table may not be in Database type definition
    const { data, error } = await (supabase as any)
      .from('hanami_financial_expenses')
      .insert({
        expense_date,
        expense_category,
        expense_description,
        amount,
        payment_method: payment_method || null,
        notes: notes || null,
        org_id: orgId
      })
      .select()
      .single();

    if (error) {
      console.error('API: 新增支出記錄錯誤:', error);
      return NextResponse.json(
        { error: '新增支出記錄失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('API: 新增支出記錄異常:', error);
    return NextResponse.json(
      { error: error.message || '新增支出記錄時發生錯誤' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/financial/expenses
 * 更新支出記錄（使用服務角色 key 繞過 RLS）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, orgId, userEmail, expense_date, expense_category, expense_description, amount, payment_method, notes } = body;

    if (!id || !orgId) {
      return NextResponse.json(
        { error: '缺少 id 或 orgId 參數' },
        { status: 400 }
      );
    }

    if (!expense_date || !expense_category || !expense_description || !amount || amount <= 0) {
      return NextResponse.json(
        { error: '缺少必要的支出資訊' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // @ts-ignore - hanami_financial_expenses table may not be in Database type definition
    const { data, error } = await (supabase as any)
      .from('hanami_financial_expenses')
      .update({
        expense_date,
        expense_category,
        expense_description,
        amount,
        payment_method: payment_method || null,
        notes: notes || null
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('API: 更新支出記錄錯誤:', error);
      return NextResponse.json(
        { error: '更新支出記錄失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('API: 更新支出記錄異常:', error);
    return NextResponse.json(
      { error: error.message || '更新支出記錄時發生錯誤' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/financial/expenses
 * 刪除支出記錄（使用服務角色 key 繞過 RLS）
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const orgId = searchParams.get('orgId');

    if (!id || !orgId) {
      return NextResponse.json(
        { error: '缺少 id 或 orgId 參數' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // @ts-ignore - hanami_financial_expenses table may not be in Database type definition
    const { error } = await (supabase as any)
      .from('hanami_financial_expenses')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      console.error('API: 刪除支出記錄錯誤:', error);
      return NextResponse.json(
        { error: '刪除支出記錄失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('API: 刪除支出記錄異常:', error);
    return NextResponse.json(
      { error: error.message || '刪除支出記錄時發生錯誤' },
      { status: 500 }
    );
  }
}


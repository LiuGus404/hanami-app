import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 使用服務端客戶端來繞過 RLS 限制
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('開始處理 GET 請求...');

    console.log('Supabase 服務端客戶端創建成功');

    // 獲取所有註冊申請
    console.log('開始查詢 registration_requests 表...');
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('查詢完成，結果:', { data: data?.length || 0, error: error?.message || '無錯誤' });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          error: '獲取註冊申請失敗', 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    console.log('成功獲取註冊申請:', data?.length || 0, '條記錄');
    console.log('前兩條記錄:', data?.slice(0, 2));
    
    return NextResponse.json({ 
      data: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: '內部服務器錯誤',
        details: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 創建新的註冊申請
    const { data, error } = await supabase
      .from('registration_requests')
      .insert({
        email: body.email,
        full_name: body.full_name,
        phone: body.phone,
        role: body.role,
        status: 'pending',
        additional_info: body.additional_info || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '創建註冊申請失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('成功創建註冊申請:', data);
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('開始處理 PUT 請求...');
    const body = await request.json();

    console.log('PUT 請求體:', body);

    // 更新註冊申請狀態
    const updateData = {
      status: body.status,
      reviewed_at: body.reviewed_at,
      rejection_reason: body.rejection_reason,
      reviewed_by: body.reviewed_by || null // 確保 reviewed_by 可以是 null
    };

    console.log('準備更新的數據:', updateData);

    const { data, error } = await supabase
      .from('registration_requests')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    console.log('Supabase 更新結果:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '更新註冊申請失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('成功更新註冊申請:', data);
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
} 

export async function DELETE(request: NextRequest) {
  try {
    console.log('開始處理 DELETE 請求...');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少 ID 參數' },
        { status: 400 }
      );
    }

    console.log('準備刪除註冊申請 ID:', id);

    const { data, error } = await supabase
      .from('registration_requests')
      .delete()
      .eq('id', id)
      .select()
      .single();

    console.log('Supabase 刪除結果:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '刪除註冊申請失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('成功刪除註冊申請:', data);
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
} 
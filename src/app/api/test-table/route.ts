import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({
        error: '缺少表名參數'
      }, { status: 400 });
    }

    // 嘗試獲取表的基本信息
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`查詢 ${table} 表錯誤:`, error);
      return NextResponse.json({
        error: `查詢失敗: ${error.message}`,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      table: table,
      data: data,
      count: data?.length || 0,
      message: '表查詢成功'
    });

  } catch (error: any) {
    console.error('測試API錯誤:', error);
    return NextResponse.json({
      error: error.message || '查詢時發生錯誤'
    }, { status: 500 });
  }
} 
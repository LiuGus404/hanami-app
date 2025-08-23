import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    if (!tableName) {
      return NextResponse.json(
        { error: '請提供表名' },
        { status: 400 }
      );
    }

    console.log(`Testing table: ${tableName}`);

    // 嘗試查詢表是否存在
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Table ${tableName} error:`, error);
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    // 獲取表的記錄數
    const { count, error: countError } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`Count error for ${tableName}:`, countError);
    }

    return NextResponse.json({
      exists: true,
      recordCount: count || 0,
      sampleData: data,
      message: `表 ${tableName} 存在且可查詢`
    });

  } catch (error) {
    console.error('Test table error:', error);
    return NextResponse.json(
      { error: '測試表時發生錯誤', details: error },
      { status: 500 }
    );
  }
} 
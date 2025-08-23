import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 嘗試直接查詢表來檢查結構
    const { data: sampleData, error: queryError } = await supabase
      .from('hanami_lesson_plan')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('Error querying table:', queryError);
      return NextResponse.json(
        { error: '查詢表失敗', details: queryError.message },
        { status: 500 }
      );
    }

    // 嘗試獲取表結構信息
    let schemaInfo = null;
    // 由於 RPC 函數不存在，我們使用樣本數據來推斷結構
    if (sampleData && sampleData.length > 0) {
      schemaInfo = Object.keys(sampleData[0]).map(key => ({
        column_name: key,
        data_type: typeof (sampleData[0] as any)[key],
        is_nullable: (sampleData[0] as any)[key] === null,
        column_default: null,
        character_maximum_length: null
      }));
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      sampleData: sampleData,
      schemaInfo: schemaInfo,
      message: '表存在且可查詢'
    });

  } catch (error) {
    console.error('Error in check schema API:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
} 
 
 
 

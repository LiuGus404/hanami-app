import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 直接嘗試查詢表來檢查是否存在
    const { data: sampleData, error: queryError } = await supabase
      .from('hanami_lesson_plan_activities' as any)
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('Error querying table:', queryError);
      return NextResponse.json({
        success: false,
        exists: false,
        message: '資料表不存在，需要先創建',
        error: queryError.message
      });
    }

    // 如果查詢成功，表存在
    const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

    return NextResponse.json({
      success: true,
      exists: true,
      message: '資料表存在',
      columns: columns.map(col => ({
        column_name: col,
        data_type: typeof (sampleData[0] as any)[col],
        is_nullable: (sampleData[0] as any)[col] === null
      }))
    });

  } catch (error) {
    console.error('Error in check table API:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
} 
 
 
 
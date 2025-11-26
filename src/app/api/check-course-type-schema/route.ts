import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    
    // 檢查現有數據
    const { data: existingData, error: dataError } = await (supabase as any)
      .from('Hanami_CourseTypes')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('檢查現有數據失敗:', dataError);
      return NextResponse.json({
        success: false,
        error: dataError.message
      }, { status: 500 });
    }

    // 檢查是否有 price_per_lesson 欄位
    const hasPricePerLesson = existingData && existingData.length > 0 && 'price_per_lesson' in existingData[0];

    return NextResponse.json({
      success: true,
      hasPricePerLesson,
      sampleData: existingData
    });

  } catch (error) {
    console.error('檢查課程類型表結構時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

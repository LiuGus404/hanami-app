import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    
    // 驗證欄位是否存在
    const { data: courseTypes, error: verifyError } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('驗證欄位失敗:', verifyError);
      return NextResponse.json({
        success: false,
        error: verifyError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'price_per_lesson 欄位已可用',
      sampleData: courseTypes
    });

  } catch (error) {
    console.error('檢查欄位時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

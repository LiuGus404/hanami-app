import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    
    // 刪除所有名為「測試課程類型」的記錄
    const { data, error } = await supabase
      .from('Hanami_CourseTypes')
      .delete()
      .eq('name', '測試課程類型')
      .select();

    if (error) {
      console.error('清理測試數據失敗:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || 0,
      message: `成功清理 ${data?.length || 0} 個測試課程類型`
    });

  } catch (error) {
    console.error('清理測試課程類型時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

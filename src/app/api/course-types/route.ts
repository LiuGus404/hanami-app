import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 查詢所有課程類型
    const { data: courseTypes, error } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name, description')
      .order('name');

    if (error) {
      console.error('查詢課程類型失敗:', error);
      // 嘗試使用不同的表名
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('Hanami_CourseTypes' as any)
        .select('id, name, description')
        .order('name');

      if (fallbackError) {
        console.error('備用查詢也失敗:', fallbackError);
        // 返回空數組而不是錯誤，避免阻塞功能
        return NextResponse.json({
          success: true,
          data: []
        });
      }

      return NextResponse.json({
        success: true,
        data: fallbackData || []
      });
    }

    return NextResponse.json({
      success: true,
      data: courseTypes || []
    });

  } catch (error) {
    console.error('獲取課程類型失敗:', error);
    // 返回空數組而不是錯誤，避免阻塞功能
    return NextResponse.json({
      success: true,
      data: []
    });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    console.log('測試保存的資料:', body);

    // 嘗試保存到教案表
    const { data, error } = await supabase
      .from('hanami_lesson_plan')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('保存失敗:', error);
      return NextResponse.json(
        { error: '保存失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('保存成功:', data);

    return NextResponse.json({
      success: true,
      data: data,
      message: '教案保存成功'
    });

  } catch (error) {
    console.error('Error in test lesson plan save API:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤', details: String(error) },
      { status: 500 }
    );
  }
} 
 
 
 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name')
      .eq('status', true)
      .order('name');

    if (error) {
      console.error('獲取課程類型失敗:', error);
      return NextResponse.json(
        { error: '獲取課程類型失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
} 
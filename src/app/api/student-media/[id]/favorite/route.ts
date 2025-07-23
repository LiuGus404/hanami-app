import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_favorite } = await request.json();
    
    const { data, error } = await supabase
      .from('hanami_student_media')
      .update({ is_favorite })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('更新收藏狀態失敗:', error);
      return NextResponse.json(
        { error: '更新收藏狀態失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
} 
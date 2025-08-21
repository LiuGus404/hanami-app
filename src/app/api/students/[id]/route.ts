import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json(
        { error: '請提供學生ID' },
        { status: 400 }
      );
    }

    // 獲取學生資訊
    const { data: student, error } = await supabase
      .from('Hanami_Students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('獲取學生資訊失敗:', error);
      return NextResponse.json(
        { error: '獲取學生資訊失敗' },
        { status: 500 }
      );
    }

    if (!student) {
      return NextResponse.json(
        { error: '找不到學生' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('獲取學生資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取學生資訊失敗' },
      { status: 500 }
    );
  }
} 
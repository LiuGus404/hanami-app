import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 查詢所有發展能力
    const { data: abilities, error } = await supabase
      .from('hanami_development_abilities')
      .select('id, ability_name, ability_description')
      .order('ability_name');

    if (error) {
      console.error('查詢發展能力失敗:', error);
      return NextResponse.json(
        { success: false, error: '查詢發展能力失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: abilities || []
    });

  } catch (error) {
    console.error('獲取發展能力失敗:', error);
    return NextResponse.json(
      { success: false, error: '獲取發展能力失敗' },
      { status: 500 }
    );
  }
}

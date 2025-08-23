import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 檢查所有相關的表
    const tables = [
      'hanami_student_activities',
      'hanami_student_trees',
      'hanami_growth_trees',
      'hanami_teaching_activities'
    ];

    const results: any = {};

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(1);

        if (error) {
          results[tableName] = { exists: false, error: error.message };
        } else {
          results[tableName] = { exists: true, sampleData: data };
        }
      } catch (err) {
        results[tableName] = { exists: false, error: err instanceof Error ? err.message : '未知錯誤' };
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('檢查資料庫表失敗:', error);
    return NextResponse.json(
      { success: false, error: '檢查資料庫表失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

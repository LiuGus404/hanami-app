import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('開始測試 Hanami_CourseTypes 表查詢...');

    // 方法1: 基本查詢
    const { data: basicData, error: basicError } = await supabase
      .from('Hanami_CourseTypes')
      .select('*');

    console.log('基本查詢結果:', { data: basicData, error: basicError });

    // 方法2: 檢查表是否存在（簡化版本）
    const { data: tableExists, error: tableError } = await supabase
      .from('Hanami_CourseTypes')
      .select('id')
      .limit(1);

    console.log('表存在檢查:', { data: tableExists, error: tableError });

    // 方法3: 檢查 RLS 狀態（簡化版本）
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .limit(1);

    console.log('RLS 狀態檢查:', { data: rlsStatus, error: rlsError });

    // 方法4: 檢查 RLS 政策（簡化版本）
    const { data: policies, error: policiesError } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .limit(1);

    console.log('RLS 政策檢查:', { data: policies, error: policiesError });

    // 方法5: 嘗試插入測試數據
    const testData = {
      name: '測試課程類型',
      status: true,
      trial_limit: 1
    };

    const { data: insertData, error: insertError } = await (supabase as any)
      .from('Hanami_CourseTypes')
      .insert(testData as any)
      .select();

    console.log('插入測試數據結果:', { data: insertData, error: insertError });

    return NextResponse.json({
      success: true,
      results: {
        basicQuery: { data: basicData, error: basicError },
        tableExists: { data: tableExists, error: tableError },
        rlsStatus: { data: rlsStatus, error: rlsError },
        policies: { data: policies, error: policiesError },
        insertTest: { data: insertData, error: insertError }
      }
    });

  } catch (error) {
    console.error('測試課程類型查詢時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

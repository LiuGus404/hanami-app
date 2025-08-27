import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 開始調試評估記錄載入...');

    // 1. 檢查表是否存在
    const { data: tableCheckData, error: tableCheckError } = await supabase
      .from('hanami_ability_assessments')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      return NextResponse.json({
        success: false,
        error: '表不存在或無法訪問',
        details: tableCheckError
      });
    }

    // 2. 基本查詢
    const { data: basicData, error: basicError } = await supabase
      .from('hanami_ability_assessments')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('基本查詢結果:', { count: basicData?.length, error: basicError });

    // 3. 帶關聯的查詢（與原始頁面相同）
    const { data: joinData, error: joinError } = await supabase
      .from('hanami_ability_assessments')
      .select(`
        *,
        student:Hanami_Students(id, full_name, nick_name, course_type),
        tree:hanami_growth_trees(id, tree_name, tree_description)
      `)
      .order('created_at', { ascending: false });

    console.log('關聯查詢結果:', { count: joinData?.length, error: joinError });

    // 4. 檢查學生表
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, nick_name, course_type')
      .limit(5);

    // 5. 檢查成長樹表
    const { data: treesData, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('id, tree_name, tree_description')
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        tableExists: !tableCheckError,
        basicQuery: {
          count: basicData?.length || 0,
          data: basicData,
          error: basicError
        },
        joinQuery: {
          count: joinData?.length || 0,
          data: joinData,
          error: joinError
        },
        relatedTables: {
          students: {
            count: studentsData?.length || 0,
            sample: studentsData,
            error: studentsError
          },
          trees: {
            count: treesData?.length || 0,
            sample: treesData,
            error: treesError
          }
        }
      }
    });

  } catch (error) {
    console.error('調試API錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '調試過程中發生錯誤',
      details: (error as Error).message
    }, { status: 500 });
  }
}

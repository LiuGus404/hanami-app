import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const results: any = {};

    // 測試 1: 檢查資料庫連接
    console.log('測試 1: 檢查資料庫連接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('Hanami_Students')
      .select('count')
      .limit(1);

    results.connection = {
      success: !connectionError,
      error: connectionError,
      data: connectionTest
    };

    // 測試 2: 檢查學生表
    console.log('測試 2: 檢查學生表...');
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name')
      .limit(3);

    results.students = {
      data: studentsData,
      error: studentsError,
      count: studentsData?.length || 0
    };

    // 測試 3: 檢查配額表
    console.log('測試 3: 檢查配額表...');
    const { data: quotaData, error: quotaError } = await supabase
      .from('hanami_student_media_quota')
      .select('*')
      .limit(3);

    results.quota = {
      data: quotaData,
      error: quotaError,
      count: quotaData?.length || 0
    };

    // 測試 4: 檢查媒體表
    console.log('測試 4: 檢查媒體表...');
    const { data: mediaData, error: mediaError } = await supabase
      .from('hanami_student_media')
      .select('student_id, media_type')
      .limit(3);

    results.media = {
      data: mediaData,
      error: mediaError,
      count: mediaData?.length || 0
    };

    // 測試 5: 檢查 RLS 政策
    console.log('測試 5: 檢查 RLS 政策...');
    let rlsData = null;
    let rlsError: any = 'RLS 檢查失敗';
    
    try {
      const result = await (supabase.rpc as any)('get_rls_policies', { table_name: 'hanami_student_media' });
      rlsData = result.data;
      rlsError = result.error;
    } catch (error) {
      console.log('RLS 檢查失敗:', error);
    }

    results.rls = {
      data: rlsData,
      error: rlsError
    };

    // 測試 6: 如果有學生資料，測試媒體統計查詢
    if (studentsData && studentsData.length > 0) {
      console.log('測試 6: 測試媒體統計查詢...');
      const typedStudentsData = (studentsData || []) as Array<{ id: string; [key: string]: any }>;
      const studentIds = typedStudentsData.map(s => s.id);
      
      try {
        const { data: mediaStats, error: mediaStatsError } = await supabase
          .from('hanami_student_media')
          .select('student_id, media_type')
          .in('student_id', studentIds);

        results.mediaStats = {
          data: mediaStats,
          error: mediaStatsError,
          count: mediaStats?.length || 0,
          studentIds: studentIds
        };
      } catch (statsError) {
        results.mediaStats = {
          data: null,
          error: statsError,
          count: 0,
          studentIds: studentIds
        };
      }
    }

    // 測試 7: 檢查表結構
    console.log('測試 7: 檢查表結構...');
    let schemaData = null;
    let schemaError: any = '表結構檢查失敗';
    
    try {
      const result = await (supabase.rpc as any)('get_table_info', { table_name: 'hanami_student_media' });
      schemaData = result.data;
      schemaError = result.error;
    } catch (error) {
      console.log('表結構檢查失敗:', error);
    }

    results.schema = {
      data: schemaData,
      error: schemaError
    };

    console.log('診斷完成:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('診斷失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
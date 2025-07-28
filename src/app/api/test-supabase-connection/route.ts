import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 測試基本連接
    const { data: testData, error: testError } = await supabase
      .from('registration_requests')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.error('Supabase 連接測試錯誤:', testError);
      return NextResponse.json({
        success: false,
        error: 'Supabase 連接失敗',
        details: testError.message,
        code: testError.code
      });
    }

    // 測試獲取實際數據
    const { data: actualData, error: actualError } = await supabase
      .from('registration_requests')
      .select('*')
      .limit(5);

    if (actualError) {
      console.error('數據獲取錯誤:', actualError);
      return NextResponse.json({
        success: false,
        error: '數據獲取失敗',
        details: actualError.message,
        code: actualError.code
      });
    }

    // 檢查 RLS 政策
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'registration_requests' })
      .catch(() => ({ data: null, error: { message: '無法獲取 RLS 政策' } }));

    return NextResponse.json({
      success: true,
      connection: 'OK',
      testData,
      actualDataCount: actualData?.length || 0,
      sampleData: actualData?.slice(0, 2) || [],
      policies: policies || '無法獲取',
      policiesError: policiesError?.message || null
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 
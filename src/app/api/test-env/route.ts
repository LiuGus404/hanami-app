import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envCheck = {
      supabaseUrl: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
        valid: supabaseUrl && supabaseUrl.startsWith('https://')
      },
      supabaseAnonKey: {
        exists: !!supabaseAnonKey,
        value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
        valid: supabaseAnonKey && supabaseAnonKey.length > 0
      },
      supabaseServiceKey: {
        exists: !!supabaseServiceKey,
        value: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'undefined',
        valid: supabaseServiceKey && supabaseServiceKey.length > 0
      }
    };

    // 檢查是否所有環境變數都存在
    const allEnvVarsExist = envCheck.supabaseUrl.exists && 
                           envCheck.supabaseAnonKey.exists && 
                           envCheck.supabaseServiceKey.exists;

    if (!allEnvVarsExist) {
      return NextResponse.json({
        success: false,
        error: '環境變數缺失',
        details: envCheck
      }, { status: 500 });
    }

    // 測試 Supabase 連接
    let connectionTest: { success: boolean; error: string | null } = { success: false, error: null };
    let tableTest: { success: boolean; error: string | null; count: number } = { success: false, error: null, count: 0 };

    try {
      // 測試 service role 連接
      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);
      
      // 測試連接
      const { data: connectionData, error: connectionError } = await supabaseAdmin
        .from('hanami_media_quota_levels')
        .select('count', { count: 'exact', head: true });

      if (connectionError) {
        connectionTest = { success: false, error: connectionError.message || '未知錯誤' };
      } else {
        connectionTest = { success: true, error: null };
      }

      // 測試資料表訪問
      const { data: tableData, error: tableError, count } = await supabaseAdmin
        .from('hanami_media_quota_levels')
        .select('*', { count: 'exact' });

      if (tableError) {
        tableTest = { success: false, error: tableError.message || '未知錯誤', count: 0 };
      } else {
        tableTest = { success: true, error: null, count: count || 0 };
      }

    } catch (error) {
      connectionTest = { success: false, error: error instanceof Error ? error.message : '未知錯誤' };
      tableTest = { success: false, error: error instanceof Error ? error.message : '未知錯誤', count: 0 };
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      connection: connectionTest,
      table: tableTest,
      summary: {
        envVarsOk: allEnvVarsExist,
        connectionOk: connectionTest.success,
        tableOk: tableTest.success,
        recordCount: tableTest.count
      }
    });

  } catch (error) {
    console.error('環境變數檢查錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '環境變數檢查失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 
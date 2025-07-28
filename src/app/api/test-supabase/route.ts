import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 檢查環境變數
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: '環境變數缺失',
        env: {
          supabaseUrl: !!supabaseUrl,
          supabaseAnonKey: !!supabaseAnonKey,
          supabaseServiceKey: !!supabaseServiceKey,
        }
      }, { status: 500 });
    }

    // 使用anon key測試基本連接
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    // 使用service key測試
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // 測試1: 使用anon key查詢
    const { data: anonData, error: anonError } = await supabaseAnon
      .rpc('get_tables_info');

    // 測試2: 使用service key查詢
    const { data: serviceData, error: serviceError } = await supabaseService
      .rpc('get_tables_info');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      env: {
        supabaseUrl: supabaseUrl.substring(0, 20) + '...',
        supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...',
        supabaseServiceKey: supabaseServiceKey.substring(0, 20) + '...',
      },
      tests: {
        anonKey: {
          success: !anonError,
          error: anonError?.message,
          data: anonData,
        },
        serviceKey: {
          success: !serviceError,
          error: serviceError?.message,
          data: serviceData,
        }
      }
    });

  } catch (error) {
    console.error('Supabase測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 
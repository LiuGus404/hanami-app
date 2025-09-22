import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 檢查環境變數配置
    const envConfig = {
      // 主資料庫配置
      mainSupabase: {
        url: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'undefined',
          valid: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://')
        },
        anonKey: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined',
          valid: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0) > 0
        }
      },
      // SAAS 資料庫配置
      saasSupabase: {
        url: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL,
          value: process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL.substring(0, 30)}...` : 'undefined',
          valid: process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL?.startsWith('https://')
        },
        anonKey: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY,
          value: process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY.substring(0, 20)}...` : 'undefined',
          valid: (process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY?.length ?? 0) > 0
        }
      }
    };

    // 檢查配置完整性
    const mainDbConfigured = envConfig.mainSupabase.url.exists && envConfig.mainSupabase.anonKey.exists;
    const saasDbConfigured = envConfig.saasSupabase.url.exists && envConfig.saasSupabase.anonKey.exists;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envConfig,
      configuration: {
        mainDatabase: {
          configured: mainDbConfigured,
          status: mainDbConfigured ? 'ready' : 'missing_config'
        },
        saasDatabase: {
          configured: saasDbConfigured,
          status: saasDbConfigured ? 'ready' : 'missing_config'
        },
        overall: {
          canUseSimplifiedMode: mainDbConfigured,
          canUseFullMode: mainDbConfigured && saasDbConfigured,
          recommendedMode: mainDbConfigured && saasDbConfigured ? 'full' : 'simplified'
        }
      },
      recommendations: [
        mainDbConfigured ? '✅ 主資料庫配置完整' : '❌ 主資料庫配置缺失',
        saasDbConfigured ? '✅ SAAS 資料庫配置完整' : '⚠️ SAAS 資料庫配置缺失',
        mainDbConfigured && saasDbConfigured ? 
          '✅ 可以使用完整模式（跨資料庫查詢）' : 
          '⚠️ 建議使用簡化模式（只檢查主資料庫）'
      ]
    });

  } catch (error: any) {
    console.error('環境配置檢查錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '檢查環境配置時發生錯誤'
    }, { status: 500 });
  }
}

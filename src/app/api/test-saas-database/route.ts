import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 檢查 SaaS 資料庫中的表格...');

    const supabase = getSaasServerSupabaseClient();

    // 嘗試查詢一些已知的表格
    const tablesToCheck = [
      'saas_coupons',
      'hanami_promo_codes', 
      'hanami_payme_fps_accounts',
      'payment_records',
      'saas_users'
    ];

    const results: any = {};

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (error) {
          results[tableName] = {
            exists: false,
            error: error.message
          };
        } else {
          results[tableName] = {
            exists: true,
            sample_count: data?.length || 0,
            sample_data: data
          };
        }
      } catch (e) {
        results[tableName] = {
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }
    }

    console.log('📊 SaaS 資料庫表格檢查結果:', results);

    return NextResponse.json({
      success: true,
      tables: results,
      message: 'SaaS 資料庫表格檢查完成'
    });

  } catch (error) {
    console.error('❌ 檢查 SaaS 資料庫表格錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '檢查 SaaS 資料庫表格時發生錯誤'
    }, { status: 500 });
  }
}

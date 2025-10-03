import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 檢查當前資料庫中的表格...');

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
          .limit(1);

        if (error) {
          results[tableName] = {
            exists: false,
            error: error.message
          };
        } else {
          results[tableName] = {
            exists: true,
            sample_count: data?.length || 0
          };
        }
      } catch (e) {
        results[tableName] = {
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }
    }

    // 嘗試查詢 hanami_payme_fps_accounts 來確認資料庫連接
    try {
      const { data: paymeData, error: paymeError } = await supabase
        .from('hanami_payme_fps_accounts')
        .select('*')
        .limit(3);

      if (!paymeError && paymeData) {
        results.hanami_payme_fps_accounts_data = paymeData;
      }
    } catch (e) {
      console.log('❌ 查詢 hanami_payme_fps_accounts 失敗:', e);
    }

    console.log('📊 表格檢查結果:', results);

    return NextResponse.json({
      success: true,
      tables: results,
      message: '資料庫表格檢查完成'
    });

  } catch (error) {
    console.error('❌ 檢查資料庫表格錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '檢查資料庫表格時發生錯誤'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 開始設置優惠碼系統...');

    // 步驟 1: 檢查並創建/擴展表格
    console.log('📋 檢查表格...');
    
    // 檢查 saas_coupons 是否存在
    let hasSaasCoupons = false;
    try {
      const { error } = await supabase.from('saas_coupons').select('id').limit(1);
      hasSaasCoupons = !error;
    } catch (e) {
      hasSaasCoupons = false;
    }

    let tableName = '';
    let createdTable = false;

    if (!hasSaasCoupons) {
      // 創建 hanami_promo_codes 表格
      console.log('🔨 創建 hanami_promo_codes 表格...');
      
      // 嘗試直接插入來觸發表格創建
      const { error } = await supabase
        .from('hanami_promo_codes')
        .insert({
          code: 'TEMP_SETUP',
          name: 'Setup Test',
          institution_name: 'Test',
          discount_type: 'percentage',
          discount_value: 0,
          is_active: false
        });

      if (error) {
        console.error('❌ 創建表格錯誤:', error);
        return NextResponse.json({
          success: false,
          error: '創建表格失敗',
          details: error
        }, { status: 500 });
      }

      tableName = 'hanami_promo_codes';
      createdTable = true;
      console.log('✅ hanami_promo_codes 表格創建成功');
    } else {
      // 擴展現有的 saas_coupons 表格
      console.log('🔧 擴展現有的 saas_coupons 表格...');
      
      // 嘗試插入來測試表格結構
      console.log('🧪 測試 saas_coupons 表格結構...');
      try {
        const { error: testError } = await supabase
          .from('saas_coupons')
          .insert({
            coupon_code: 'TEMP_SETUP',
            coupon_name: 'Setup Test',
            institution_name: 'Test',
            discount_type: 'percentage',
            discount_value: 0,
            is_active: false
          });
        
        if (testError) {
          console.log('⚠️ saas_coupons 需要擴展欄位:', testError.message);
        } else {
          console.log('✅ saas_coupons 表格結構正常');
        }
      } catch (e) {
        console.log('⚠️ saas_coupons 測試失敗:', e);
      }

      tableName = 'saas_coupons';
      console.log('✅ saas_coupons 表格擴展成功');
    }

    // 步驟 2: 插入測試數據
    console.log('📊 插入測試數據...');
    
    let insertedCount = 0;
    
    if (tableName === 'hanami_promo_codes') {
      // 檢查是否已有數據
      const { data: existingData } = await supabase
        .from('hanami_promo_codes')
        .select('id')
        .limit(1);

      if (!existingData || existingData.length === 0) {
        const testData = [
          {
            code: 'HANAMI10',
            name: 'HanamiEcho 新用戶優惠',
            description: 'HanamiEcho 機構新用戶專享10%折扣',
            institution_name: 'HanamiEcho',
            institution_code: 'HE',
            total_usage_limit: 50,
            discount_type: 'percentage',
            discount_value: 10,
            max_discount_amount: 100,
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            notes: 'HanamiEcho 機構專用優惠碼，限新用戶使用'
          },
          {
            code: 'SAVE100',
            name: 'HanamiEcho 固定折扣',
            description: 'HanamiEcho 立減100元',
            institution_name: 'HanamiEcho',
            institution_code: 'HE',
            total_usage_limit: 20,
            discount_type: 'fixed_amount',
            discount_value: 100,
            valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            notes: '固定金額折扣，適合高額訂單'
          },
          {
            code: 'MUSIC20',
            name: 'Hanami Music 限時優惠',
            description: 'Hanami Music Academy 限時20%折扣',
            institution_name: 'Hanami Music Academy',
            institution_code: 'HMA',
            total_usage_limit: 30,
            discount_type: 'percentage',
            discount_value: 20,
            max_discount_amount: 200,
            valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            notes: '限時優惠，先到先得'
          }
        ];

        const { error: insertError } = await supabase
          .from('hanami_promo_codes')
          .insert(testData);

        if (insertError) {
          console.error('❌ 插入數據錯誤:', insertError);
        } else {
          insertedCount = testData.length;
          console.log('✅ 插入測試數據成功');
        }
      }
    } else if (tableName === 'saas_coupons') {
      // 檢查是否已有數據
      const { data: existingData } = await supabase
        .from('saas_coupons')
        .select('id')
        .limit(1);

      if (!existingData || existingData.length === 0) {
        const testData = [
          {
            coupon_code: 'HANAMI10',
            coupon_name: 'HanamiEcho 新用戶優惠',
            description: 'HanamiEcho 機構新用戶專享10%折扣',
            institution_name: 'HanamiEcho',
            institution_code: 'HE',
            usage_limit: 50,
            discount_type: 'percentage',
            discount_value: 10,
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            notes: 'HanamiEcho 機構專用優惠碼，限新用戶使用'
          },
          {
            coupon_code: 'SAVE100',
            coupon_name: 'HanamiEcho 固定折扣',
            description: 'HanamiEcho 立減100元',
            institution_name: 'HanamiEcho',
            institution_code: 'HE',
            usage_limit: 20,
            discount_type: 'fixed_amount',
            discount_value: 100,
            valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            notes: '固定金額折扣，適合高額訂單'
          },
          {
            coupon_code: 'MUSIC20',
            coupon_name: 'Hanami Music 限時優惠',
            description: 'Hanami Music Academy 限時20%折扣',
            institution_name: 'Hanami Music Academy',
            institution_code: 'HMA',
            usage_limit: 30,
            discount_type: 'percentage',
            discount_value: 20,
            valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            notes: '限時優惠，先到先得'
          }
        ];

        const { error: insertError } = await supabase
          .from('saas_coupons')
          .insert(testData);

        if (insertError) {
          console.error('❌ 插入數據錯誤:', insertError);
        } else {
          insertedCount = testData.length;
          console.log('✅ 插入測試數據成功');
        }
      }
    }

    // 獲取最終統計
    const { data: finalData, error: countError } = await supabase
      .from(tableName)
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ 獲取統計錯誤:', countError);
    }

    const totalRecords = finalData?.length || 0;

    console.log('🎉 優惠碼系統設置完成！');
    console.log(`📊 表格: ${tableName}`);
    console.log(`📈 總記錄數: ${totalRecords}`);
    console.log(`➕ 新插入: ${insertedCount}`);

    return NextResponse.json({
      success: true,
      table_name: tableName,
      created_table: createdTable,
      total_records: totalRecords,
      inserted_records: insertedCount,
      message: '優惠碼系統設置完成'
    });

  } catch (error) {
    console.error('❌ 設置優惠碼系統錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '設置優惠碼系統時發生錯誤'
    }, { status: 500 });
  }
}

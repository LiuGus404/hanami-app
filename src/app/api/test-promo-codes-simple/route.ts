import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 測試優惠碼功能...');

    // 測試 1: 檢查函數是否存在
    console.log('🔍 測試驗證函數...');
    const { data: validateData, error: validateError } = await (supabase.rpc as any)('validate_promo_code_unified', {
      p_code: 'HANAMI10',
      p_user_id: null,
      p_user_email: null,
      p_order_amount: 500
    });

    if (validateError) {
      console.error('❌ 驗證函數錯誤:', validateError);
      return NextResponse.json({
        success: false,
        error: '驗證函數測試失敗',
        details: validateError,
        message: '可能是表格不存在或函數配置問題'
      }, { status: 500 });
    }

    console.log('✅ 驗證函數測試成功:', validateData);

    // 測試 2: 檢查使用函數
    console.log('🔍 測試使用函數...');
    const { data: useData, error: useError } = await (supabase.rpc as any)('use_promo_code_unified', {
      p_promo_code_id: '00000000-0000-0000-0000-000000000000',
      p_user_id: 'test-user',
      p_user_email: 'test@example.com',
      p_order_amount: 500,
      p_discount_amount: 50
    });

    if (useError) {
      console.log('⚠️ 使用函數測試 (預期錯誤):', useError.message);
    } else {
      console.log('✅ 使用函數測試成功:', useData);
    }

    return NextResponse.json({
      success: true,
      validate_result: validateData,
      use_result: useData,
      use_error: useError?.message || null,
      message: '優惠碼功能測試完成'
    });

  } catch (error) {
    console.error('❌ 優惠碼功能測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '優惠碼功能測試時發生錯誤'
    }, { status: 500 });
  }
}

// 創建測試優惠碼
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_test_data') {
      console.log('🔨 創建測試優惠碼數據...');

      // 嘗試創建測試數據
      const testPromoCodes = [
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
        }
      ];

      // 嘗試插入到可能的表格
      let insertedCount = 0;
      let errors = [];

      // 嘗試 hanami_promo_codes
      try {
        const { data, error } = await (supabase
          .from('hanami_promo_codes') as any)
          .insert(testPromoCodes as any)
          .select();

        if (error) {
          errors.push(`hanami_promo_codes: ${error.message}`);
        } else {
          insertedCount += data?.length || 0;
          console.log('✅ 插入到 hanami_promo_codes 成功');
        }
      } catch (e) {
        errors.push(`hanami_promo_codes: ${e}`);
      }

      // 嘗試 saas_coupons (轉換欄位名稱)
      try {
        const testDataForSaas = testPromoCodes.map(promo => ({
          coupon_code: promo.code,
          coupon_name: promo.name,
          description: promo.description,
          institution_name: promo.institution_name,
          institution_code: promo.institution_code,
          usage_limit: promo.total_usage_limit,
          discount_type: promo.discount_type,
          discount_value: promo.discount_value,
          max_discount_amount: promo.max_discount_amount,
          valid_until: promo.valid_until,
          is_active: promo.is_active,
          notes: promo.notes
        }));

        const { data, error } = await (supabase
          .from('saas_coupons') as any)
          .insert(testDataForSaas as any)
          .select();

        if (error) {
          errors.push(`saas_coupons: ${error.message}`);
        } else {
          insertedCount += data?.length || 0;
          console.log('✅ 插入到 saas_coupons 成功');
        }
      } catch (e) {
        errors.push(`saas_coupons: ${e}`);
      }

      return NextResponse.json({
        success: true,
        inserted_count: insertedCount,
        errors,
        message: `創建了 ${insertedCount} 個測試優惠碼`
      });
    }

    return NextResponse.json({
      success: false,
      error: '未知的操作'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ 創建測試數據錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '創建測試數據時發生錯誤'
    }, { status: 500 });
  }
}

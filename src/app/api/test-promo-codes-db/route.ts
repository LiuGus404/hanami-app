import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 檢查優惠碼資料庫狀態...');

    // 檢查表格是否存在 - 直接嘗試查詢
    const tableNames = [];
    
    // 檢查 hanami_promo_codes
    try {
      const { error: error1 } = await supabase
        .from('hanami_promo_codes')
        .select('id')
        .limit(1);
      
      if (!error1) {
        tableNames.push('hanami_promo_codes');
        console.log('✅ 找到表格: hanami_promo_codes');
      }
    } catch (e) {
      console.log('❌ hanami_promo_codes 不存在');
    }

    // 檢查 saas_coupons
    try {
      const { error: error2 } = await supabase
        .from('saas_coupons')
        .select('id')
        .limit(1);
      
      if (!error2) {
        tableNames.push('saas_coupons');
        console.log('✅ 找到表格: saas_coupons');
      }
    } catch (e) {
      console.log('❌ saas_coupons 不存在');
    }

    console.log('📋 找到的表格:', tableNames);

    // 檢查函數是否存在 - 直接嘗試調用
    const functionNames = [];
    
    try {
      const { error: validateError } = await (supabase.rpc as any)('validate_promo_code_unified', {
        p_code: 'TEST',
        p_user_id: null,
        p_user_email: null,
        p_order_amount: 100
      });
      
      if (!validateError || validateError.code !== '42883') { // 42883 = function does not exist
        functionNames.push('validate_promo_code_unified');
        console.log('✅ 找到函數: validate_promo_code_unified');
      }
    } catch (e) {
      console.log('❌ validate_promo_code_unified 不存在');
    }

    try {
      const { error: useError } = await (supabase.rpc as any)('use_promo_code_unified', {
        p_promo_code_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: null,
        p_user_email: null,
        p_order_amount: 100,
        p_discount_amount: 10
      });
      
      if (!useError || useError.code !== '42883') { // 42883 = function does not exist
        functionNames.push('use_promo_code_unified');
        console.log('✅ 找到函數: use_promo_code_unified');
      }
    } catch (e) {
      console.log('❌ use_promo_code_unified 不存在');
    }

    console.log('🔧 找到的函數:', functionNames);

    // 如果有表格，檢查數據
    let sampleData = null;
    if (tableNames.length > 0) {
      const tableName = tableNames[0];
      console.log(`📊 檢查表格 ${tableName} 的數據...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      if (error) {
        console.error(`❌ 檢查 ${tableName} 數據錯誤:`, error);
      } else {
        sampleData = data;
        console.log(`✅ ${tableName} 樣本數據:`, data);
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableNames,
      functions: functionNames,
      sampleData,
      message: '資料庫狀態檢查完成'
    });

  } catch (error) {
    console.error('❌ 資料庫狀態檢查錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '資料庫狀態檢查時發生錯誤'
    }, { status: 500 });
  }
}

// 測試函數調用
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`🧪 測試函數調用: ${action}`);

    if (action === 'validate') {
      // 測試驗證函數
      const { data, error } = await (supabase.rpc as any)('validate_promo_code_unified', {
        p_code: 'HANAMI10',
        p_user_id: null,
        p_user_email: null,
        p_order_amount: 500
      });

      if (error) {
        console.error('❌ 驗證函數測試錯誤:', error);
        return NextResponse.json({
          success: false,
          error: '驗證函數測試失敗',
          details: error
        }, { status: 500 });
      }

      console.log('✅ 驗證函數測試成功:', data);
      return NextResponse.json({
        success: true,
        data,
        message: '驗證函數測試成功'
      });
    }

    if (action === 'use') {
      // 測試使用函數（需要先有有效的 promo_code_id）
      const { data, error } = await (supabase.rpc as any)('use_promo_code_unified', {
        p_promo_code_id: '00000000-0000-0000-0000-000000000000', // 測試用的假 ID
        p_user_id: 'test-user',
        p_user_email: 'test@example.com',
        p_order_amount: 500,
        p_discount_amount: 50
      });

      if (error) {
        console.error('❌ 使用函數測試錯誤:', error);
        return NextResponse.json({
          success: false,
          error: '使用函數測試失敗',
          details: error
        }, { status: 500 });
      }

      console.log('✅ 使用函數測試成功:', data);
      return NextResponse.json({
        success: true,
        data,
        message: '使用函數測試成功'
      });
    }

    return NextResponse.json({
      success: false,
      error: '未知的測試動作'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ 函數測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '函數測試時發生錯誤'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 SaaS 系統的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 測試 PAYME FPS 資料庫連接
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 測試 PAYME FPS 資料庫連接...');
    console.log('📍 Supabase URL:', supabaseUrl);
    console.log('🔑 Service Key 狀態:', supabaseServiceKey ? '已設置' : '未設置');

    // 測試基本連接
    const { data: testData, error: testError } = await supabase
      .from('hanami_payme_fps_accounts')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.error('❌ 資料庫連接錯誤:', testError);
      return NextResponse.json({
        success: false,
        error: '資料庫連接失敗',
        details: testError.message
      }, { status: 500 });
    }

    console.log('✅ 資料庫連接成功');

    // 獲取所有帳戶
    const { data: accounts, error: accountsError } = await supabase
      .from('hanami_payme_fps_accounts')
      .select('*')
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    if (accountsError) {
      console.error('❌ 查詢帳戶錯誤:', accountsError);
      return NextResponse.json({
        success: false,
        error: '查詢帳戶失敗',
        details: accountsError.message
      }, { status: 500 });
    }

    // 測試特定的機構名稱查詢
    const testInstitutions = ['HanamiEcho', 'Hanami Music Academy', 'Hanami'];
    const institutionResults: any = {};
    
    for (const institution of testInstitutions) {
      const { data: instAccounts, error: instError } = await supabase
        .from('hanami_payme_fps_accounts')
        .select('*')
        .eq('institution_name', institution)
        .eq('is_active', true);
      
      institutionResults[institution] = {
        found: !instError && instAccounts && instAccounts.length > 0,
        count: instAccounts?.length || 0,
        data: instAccounts || [],
        error: instError?.message || null
      };
    }

    console.log('📋 找到帳戶數量:', accounts?.length || 0);
    console.log('📋 帳戶資料:', accounts);

    return NextResponse.json({
      success: true,
      data: {
        connection: 'success',
        accountsCount: accounts?.length || 0,
        accounts: accounts || [],
        institutionTests: institutionResults,
        environment: {
          supabaseUrl: supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }
    });

  } catch (error) {
    console.error('❌ 測試 API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

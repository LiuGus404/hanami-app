import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();
    
    // 測試基本連接
    const { data: testData, error: testError } = await saas
      .from('saas_users')
      .select('id, email')
      .limit(1);
    
    if (testError) {
      return NextResponse.json({ 
        success: false,
        error: '資料庫連接失敗',
        details: testError.message,
        code: testError.code
      });
    }
    
    // 檢查 hanami_children 表是否存在
    const { data: tableCheck, error: tableError } = await saas
      .from('hanami_children')
      .select('*')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({ 
        success: false,
        error: 'hanami_children 表不存在或無法訪問',
        details: tableError.message,
        code: tableError.code,
        suggestion: '請執行 create-hanami-children-table.sql 腳本'
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: '資料庫連接正常，hanami_children 表存在',
      sampleUsers: testData?.length || 0,
      sampleChildren: tableCheck?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: '伺服器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

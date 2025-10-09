import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();
    
    // 直接查詢 hanami_children 表
    const { data, error } = await saas
      .from('hanami_children')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        tableExists: false,
        error: error.message,
        code: error.code,
        hint: error.hint
      });
    }
    
    return NextResponse.json({ 
      success: true,
      tableExists: true,
      sampleData: data,
      count: data?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      tableExists: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

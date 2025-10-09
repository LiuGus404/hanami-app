import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();
    
    // 檢查 hanami_children 表是否存在
    const { data, error } = await saas
      .from('hanami_children')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        tableExists: false, 
        error: error.message,
        code: error.code 
      });
    }
    
    return NextResponse.json({ 
      tableExists: true, 
      sampleData: data,
      message: '表存在且可訪問'
    });
  } catch (error) {
    return NextResponse.json({ 
      tableExists: false, 
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

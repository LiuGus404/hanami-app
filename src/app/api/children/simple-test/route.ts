import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();
    
    // 簡單測試：直接查詢 hanami_children 表
    const { data, error } = await saas
      .from('hanami_children')
      .select('id, parent_id, full_name')
      .limit(5);
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: '表可以正常訪問',
      count: data?.length || 0,
      sampleData: data
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

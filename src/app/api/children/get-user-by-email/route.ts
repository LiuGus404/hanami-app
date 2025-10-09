import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: '缺少 email 參數' }, { status: 400 });
    }
    
    const saas = createSaasAdminClient();
    
    // 根據 email 查找用戶
    const { data: userData, error: userError } = await saas
      .from('saas_users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();
    
    if (userError) {
      return NextResponse.json({ 
        success: false,
        error: '用戶不存在',
        details: userError.message
      });
    }
    
    return NextResponse.json({ 
      success: true,
      user: userData
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const saas = createSaasAdminClient();
    
    // 1. 先獲取一個用戶 ID 來測試
    const { data: usersData, error: usersError } = await saas
      .from('saas_users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !usersData || usersData.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: '無法獲取用戶數據',
        details: usersError?.message
      });
    }
    
    const testUserId = (usersData[0] as any).id;
    console.log('使用測試用戶 ID:', testUserId);
    
    // 2. 測試 hanami_children 表查詢
    const { data: childrenData, error: childrenError } = await saas
      .from('hanami_children')
      .select('*')
      .eq('parent_id', testUserId);
    
    return NextResponse.json({ 
      success: true,
      testUserId,
      testUserEmail: (usersData[0] as any).email,
      childrenQuery: {
        success: !childrenError,
        error: childrenError?.message,
        code: childrenError?.code,
        data: childrenData,
        count: childrenData?.length || 0
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

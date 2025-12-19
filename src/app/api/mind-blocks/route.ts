import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const tab = request.nextUrl.searchParams.get('tab') || 'community'; // 'my' or 'community'
    const slotType = request.nextUrl.searchParams.get('slotType'); // Optional filter

    console.log('🧩 [API] 載入積木:', { userId, tab, slotType });

    const supabase = createSaasAdminClient();

    let query = supabase
      .from('mind_blocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tab === 'my') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: '需要 userId 來載入我的積木' },
          { status: 400 }
        );
      }
      query = query.eq('user_id', userId);
    } else {
      // Community tab - show public blocks
      query = query.eq('is_public', true);
    }

    // Optional: Filter by block_type if provided
    // Note: We might want to show all blocks and let user choose
    // if (slotType) {
    //   query = query.eq('block_type', slotType);
    // }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [API] 載入積木失敗:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API] 載入積木成功:', data?.length || 0, '個');

    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    });

  } catch (error: any) {
    console.error('❌ [API] 載入積木異常:', error);
    return NextResponse.json(
      { success: false, error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}













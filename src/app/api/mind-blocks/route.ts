import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient, supabaseUrl } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const tab = request.nextUrl.searchParams.get('tab') || 'community'; // 'my' or 'community'
    const slotType = request.nextUrl.searchParams.get('slotType'); // Optional filter

    console.log('🧩 [API] 載入積木:', { userId, tab, slotType });

    // 檢查環境變數
    const hasServiceKey = !!process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;
    const hasUrl = !!supabaseUrl && supabaseUrl !== '';
    console.log('🔧 [API] 環境變數檢查:', { hasServiceKey, hasUrl, supabaseUrl: supabaseUrl?.substring(0, 30) + '...' });

    if (!hasServiceKey) {
      console.error('❌ [API] SUPABASE_SAAS_SERVICE_ROLE_KEY 未設置');
    }

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
      console.log('🔍 [API] 查詢用戶積木，userId:', userId);
      query = query.eq('user_id', userId);
    } else {
      // Community tab - show public blocks
      console.log('🔍 [API] 查詢公開積木');
      query = query.eq('is_public', true);
    }

    // Optional: Filter by block_type if provided
    // Note: We might want to show all blocks and let user choose
    // if (slotType) {
    //   query = query.eq('block_type', slotType);
    // }

    const { data, error, status, statusText } = await query;

    if (error) {
      console.error('❌ [API] 載入積木失敗:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status,
        statusText
      });

      // 如果是 42P01 錯誤，表示表不存在
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'mind_blocks 表不存在，請確認資料庫遷移已執行' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: status || 500 }
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



















import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId');
        const limitParam = request.nextUrl.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 5;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: '缺少 userId 參數' },
                { status: 400 }
            );
        }

        const supabase = createSaasAdminClient();

        // Fetch transactions using admin client (bypassing RLS)
        const { data: historyData, error: historyError } = await supabase
            .from('food_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (historyError) {
            console.error('❌ [Food History API] 獲取交易記錄失敗:', historyError);
            return NextResponse.json(
                { success: false, error: historyError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: historyData || [] });

    } catch (error: any) {
        console.error('❌ [Food History API] 異常:', error);
        return NextResponse.json(
            { success: false, error: error.message || '內部伺服器錯誤' },
            { status: 500 }
        );
    }
}

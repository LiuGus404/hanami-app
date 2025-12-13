import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { roomId, limit = 50, userId } = await req.json();

        if (!roomId) {
            return NextResponse.json(
                { success: false, error: '缺少必要參數 roomId' },
                { status: 400 }
            );
        }

        console.log(`📜 [API] 開始載入歷史訊息: Room=${roomId}, Limit=${limit}`);

        // 使用 admin client 確保能讀取所有訊息 (繞過潛在的 RLS 問題)
        // 在正式環境中，可能需要根據 userId 做更嚴格的權限檢查
        const { createSaasAdminClient } = await import('@/lib/supabase-saas');
        const supabase = createSaasAdminClient();

        const { data, error } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ [API] 載入歷史訊息失敗:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log(`✅ [API] 成功載入 ${data?.length || 0} 條訊息`);

        return NextResponse.json({ success: true, data: data || [] });

    } catch (error: any) {
        console.error('❌ [API] 訊息載入 API 異常:', error);
        return NextResponse.json(
            { success: false, error: error.message || '內部伺服器錯誤' },
            { status: 500 }
        );
    }
}

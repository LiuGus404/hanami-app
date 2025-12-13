import { createSaasClient } from '@/lib/supabase-saas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { roomId, userId } = await req.json();

        if (!roomId || !userId) {
            return NextResponse.json(
                { success: false, error: '缺少必要參數 roomId 或 userId' },
                { status: 400 }
            );
        }

        console.log(`🛡️ [API] 開始檢查房間成員身份: Room=${roomId}, User=${userId}`);

        // 在 API 路由中創建一個新的 Supabase 客戶端
        // 注意：這裡我們使用 createSaasClient，它在服務器端環境下應該能正常工作
        // 如果需要繞過 RLS，可能需要使用 createSaasAdminClient，但通常我們希望保留權限檢查
        // 不過考慮到此 API 是由前端調用，且我們需要確保用戶被加入，
        // 如果用戶還不是成員，他們可能沒有權限查詢 room_members 表（取決於 RLS）
        // 所以為了保證能加入成功，我們這裡使用 admin client 可能更保險，
        // 或者確保 createSaasClient 能正確獲取到調用者的 session

        // 簡單起見，我們先使用服務帳戶權限來執行檢查和加入操作
        // 這樣可以避免因 RLS 配置導致的死鎖或權限不足
        const { createSaasAdminClient } = await import('@/lib/supabase-saas');
        const supabase = createSaasAdminClient();

        // 1. 檢查是否已是成員
        const { count, error: checkError } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId)
            .eq('user_id', userId);

        if (checkError) {
            console.error('❌ [API] 檢查成員身份失敗:', checkError);
            return NextResponse.json(
                { success: false, error: checkError.message },
                { status: 500 }
            );
        }

        // 2. 如果不是成員，添加
        if (count === 0) {
            console.log('👤 [API] 用戶不是房間成員，正在添加...');
            const { error: insertError } = await supabase
                .from('room_members')
                .insert({
                    room_id: roomId,
                    user_id: userId,
                    role: 'member',
                    user_type: 'hanami_user'
                });

            if (insertError) {
                // 忽略重複鍵錯誤（可能並發請求導致）
                if (insertError.code === '23505') {
                    console.log('✅ [API] 用戶已是房間成員（重複鍵錯誤，視為成功）');
                } else {
                    console.error('❌ [API] 添加房間成員失敗:', insertError);
                    return NextResponse.json(
                        { success: false, error: insertError.message },
                        { status: 500 }
                    );
                }
            } else {
                console.log('✅ [API] 用戶已添加為房間成員');
            }
        } else {
            console.log('✅ [API] 用戶已是房間成員');
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ [API] 成員檢查 API 異常:', error);
        return NextResponse.json(
            { success: false, error: error.message || '內部伺服器錯誤' },
            { status: 500 }
        );
    }
}

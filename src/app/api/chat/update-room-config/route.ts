import { createSaasAdminClient } from '@/lib/supabase-saas';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { roomId, config } = await req.json();

        if (!roomId || !config) {
            return NextResponse.json(
                { success: false, error: '缺少必要參數 roomId 或 config' },
                { status: 400 }
            );
        }

        console.log(`🛡️ [API] 更新房間設定: Room=${roomId}`, config);

        // 使用 Admin Client 繞過 RLS
        const supabase = createSaasAdminClient();

        // 1. 先讀取現有設定以進行合併 (避免覆蓋其他欄位)
        const { data: currentRoom, error: fetchError } = await supabase
            .from('ai_rooms')
            .select('settings')
            .eq('id', roomId)
            .single();

        if (fetchError) {
            throw new Error(`讀取房間設定失敗: ${fetchError.message}`);
        }

        const currentSettings = currentRoom?.settings || {};
        const newSettings = {
            ...(currentSettings as any),
            ...config // 合併新的設定 (例如 audio_model)
        };

        // 2. 寫入新設定
        const { error: updateError } = await supabase
            .from('ai_rooms')
            .update({ settings: newSettings })
            .eq('id', roomId);

        if (updateError) {
            throw new Error(`更新房間設定失敗: ${updateError.message}`);
        }

        // 3. 立即讀回以驗證寫入 (Verification Read)
        const { data: verifyRole, error: verifyError } = await supabase
            .from('ai_rooms')
            .select('settings')
            .eq('id', roomId)
            .single();

        console.log('✅ [API] 房間設定更新成功. Verify Read:', JSON.stringify(verifyRole?.settings));

        return NextResponse.json({
            success: true,
            data: verifyRole?.settings || newSettings
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error: any) {
        console.error('❌ [API] 更新房間設定異常:', error);
        return NextResponse.json(
            { success: false, error: error.message || '內部伺服器錯誤' },
            { status: 500 }
        );
    }
}

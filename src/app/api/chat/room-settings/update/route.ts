
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { roomId, userId, updates } = await req.json();

        if (!roomId || !updates) {
            return NextResponse.json(
                { success: false, error: '缺少必要參數 roomId 或 updates' },
                { status: 400 }
            );
        }

        console.log(`🛡️ [API] 更新房間設定: Room=${roomId}, User=${userId}`);

        // 使用 Admin Client 確保權限 (因為要寫入 ai_rooms settings)
        const supabase = createSaasAdminClient();

        // 1. 獲取當前設定 (為了合併，避免覆蓋其他欄位)
        const { data: roomData, error: fetchError } = await supabase
            .from('ai_rooms')
            .select('settings')
            .eq('id', roomId)
            .single();

        if (fetchError) {
            console.error('❌ [API] 獲取房間設定失敗:', fetchError);
            return NextResponse.json({ success: false, error: '獲取房間設定失敗' }, { status: 500 });
        }

        const currentSettings = (roomData?.settings as Record<string, any>) || {};

        // 合併設定
        // updates 預期格式: { mind_block_overrides: { ... } }
        // 這裡做深層合併有點複雜，我們假設前端傳來的是完整的 mind_block_overrides 或者需要合併的頂層 key

        let newSettings: Record<string, any> = { ...currentSettings };

        if (updates.mind_block_overrides) {
            const currentOverrides = currentSettings.mind_block_overrides || {};
            newSettings.mind_block_overrides = {
                ...currentOverrides,
                ...updates.mind_block_overrides
            };
            // 深入合併 role 層級，如果前端傳來的是 { hibi: { role: ... } }，我們不應該覆蓋 hibi 下的其他 slots
            Object.keys(updates.mind_block_overrides).forEach(roleKey => {
                if (currentOverrides[roleKey]) {
                    newSettings.mind_block_overrides[roleKey] = {
                        ...currentOverrides[roleKey],
                        ...updates.mind_block_overrides[roleKey]
                    };
                }
            });
        }

        if (updates.model_overrides) {
            const currentModelOverrides = currentSettings.model_overrides || {};
            newSettings.model_overrides = {
                ...currentModelOverrides,
                ...updates.model_overrides
            };
        }

        if (!updates.mind_block_overrides && !updates.model_overrides) {
            newSettings = { ...newSettings, ...updates };
        }

        console.log('📝 [API] 準備寫入新設定:', JSON.stringify(newSettings));

        const { error: updateError } = await supabase
            .from('ai_rooms')
            .update({ settings: newSettings })
            .eq('id', roomId);

        if (updateError) {
            console.error('❌ [API] 更新房間失敗:', updateError);
            return NextResponse.json({ success: false, error: '更新房間失敗' }, { status: 500 });
        }

        console.log('✅ [API] 房間設定更新成功');

        return NextResponse.json({
            success: true,
            data: newSettings
        });

    } catch (error: any) {
        console.error('❌ [API] 更新房間設定異常:', error);
        return NextResponse.json(
            { success: false, error: error.message || '內部伺服器錯誤' },
            { status: 500 }
        );
    }
}

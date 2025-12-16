import { createSaasAdminClient } from '@/lib/supabase-saas';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { roomId, userId } = await req.json();

        if (!roomId) {
            return NextResponse.json(
                { success: false, error: '缺少必要參數 roomId' },
                { status: 400 }
            );
        }

        console.log(`🛡️ [API] 開始載入房間完整資訊: Room=${roomId}, User=${userId}`);

        // 使用 Admin Client 確保權限
        const supabase = createSaasAdminClient();

        // 平行執行獨立的查詢以加速回應
        const [roomResult, roomRolesResult, modelsResult, messagesResult] = await Promise.all([
            // 1. 載入房間基本資訊
            supabase
                .from('ai_rooms')
                .select('id, title, description, room_type, created_at, settings')
                .eq('id', roomId)
                .single(),

            // 2. 獲取 Room Roles Link
            supabase
                .from('room_roles')
                .select('role_instance_id')
                .eq('room_id', roomId)
                .eq('is_active', true),

            // 3. 載入所有有效的 Model Configs (獨立於房間狀態)
            supabase
                .from('model_configs')
                .select('*')
                .eq('is_active', true)
                .order('input_cost_hkd', { ascending: true }),

            // 4. 預載入最新訊息 (加速顯示)
            supabase
                .from('ai_messages')
                .select('*')
                .eq('room_id', roomId)
                .neq('status', 'deleted')
                .order('created_at', { ascending: false })
                .limit(30)
        ]);

        const { data: roomData, error: roomError } = roomResult as any;
        const { data: roomRoleLinks, error: roomRolesError } = roomRolesResult as any;
        const { data: modelConfigs, error: modelError } = modelsResult as any;
        const { data: recentMessages, error: messageError } = messagesResult as any;

        if (roomError) {
            console.error('❌ [API] 載入 ai_rooms 失敗:', roomError);
            return NextResponse.json({ success: false, error: roomError.message }, { status: 500 });
        }

        if (roomRolesError) console.error('❌ [API] 載入 room_roles 失敗:', roomRolesError);
        if (modelError) console.error('❌ [API] 載入 model_configs 失敗:', modelError);
        if (messageError) console.error('❌ [API] 預載入訊息失敗:', messageError);

        const roleInstanceIds = (roomRoleLinks || []).map((r: any) => r.role_instance_id).filter(Boolean);

        let roleInstancesMap: Record<string, any> = {};
        let roomRoles: string[] = [];
        let roleInstances: any[] = [];
        if (roleInstanceIds.length > 0) {
            // Fetch Role Instances
            const { data: roleInstancesData, error: roleInstancesError } = await supabase
                .from('role_instances')
                .select('*')
                .in('id', roleInstanceIds);

            if (roleInstancesError) {
                console.error('❌ [API] 載入 role_instances 失敗:', roleInstancesError);
            }

            roleInstances = roleInstancesData || [];

            if (roleInstances.length > 0) {
                const roleIds = roleInstances.map((ri: any) => ri.role_id).filter(Boolean);

                // Fetch AI Roles
                if (roleIds.length > 0) {
                    const { data: rolesData } = await supabase
                        .from('ai_roles')
                        .select('*')
                        .in('id', roleIds);

                    // Fetch Mind Blocks
                    let mindBlocksData: any[] = [];
                    if (userId) {
                        const { data: mbData } = await (supabase as any)
                            .from('role_mind_blocks')
                            .select('role_id, mind_block_id, is_active')
                            .in('role_id', roleIds)
                            .eq('user_id', userId)
                            .eq('is_active', true);
                        mindBlocksData = mbData || [];
                    }

                    // Fetch actual Mind Block details
                    let blocksInfo: any[] = [];
                    if (mindBlocksData.length > 0) {
                        const blockIds = mindBlocksData.map((mb: any) => mb.mind_block_id);
                        const { data: biData } = await (supabase as any)
                            .from('mind_blocks')
                            .select('id, title')
                            .in('id', blockIds);
                        blocksInfo = biData || [];
                    }

                    // Consolidate Data
                    const roomSettings = roomData?.settings || {};
                    const mindBlockOverrides = roomSettings.mind_block_overrides || {};
                    const modelOverrides = roomSettings.model_overrides || {};
                    console.log('🔍 [API] Room Settings:', JSON.stringify(roomSettings));
                    console.log('🔍 [API] Mind Block Overrides:', JSON.stringify(mindBlockOverrides));
                    console.log('🔍 [API] Model Overrides:', JSON.stringify(modelOverrides));

                    roleInstances.forEach((ri: any) => {
                        const roleDef = rolesData?.find((r: any) => r.id === ri.role_id);
                        const equipped = mindBlocksData.filter((mb: any) => mb.role_id === ri.role_id);
                        const blocks = equipped.map((mb: any) => blocksInfo.find((b: any) => b.id === mb.mind_block_id)).filter(Boolean);

                        const enrichedInstance = {
                            ...ri,
                            role: roleDef,
                            mindBlocks: blocks
                        };

                        // Determine internal slug (Fix type error by casting)
                        const rd = roleDef as any;
                        const slug = rd?.slug || rd?.name || '';
                        let internalName = slug;
                        if (slug.includes('hibi-manager')) internalName = 'hibi';
                        else if (slug.includes('mori-researcher')) internalName = 'mori';
                        else if (slug.includes('pico-artist')) internalName = 'pico';

                        // Apply Mind Block Overrides
                        if (internalName && mindBlockOverrides[internalName]) {
                            console.log(`✅ [API] Applying Mind Block Overrides for ${internalName}:`, JSON.stringify(mindBlockOverrides[internalName]));
                            if (!enrichedInstance.settings) enrichedInstance.settings = {};
                            if (!enrichedInstance.settings.equipped_blocks) enrichedInstance.settings.equipped_blocks = {};
                            enrichedInstance.settings.equipped_blocks = {
                                ...enrichedInstance.settings.equipped_blocks,
                                ...mindBlockOverrides[internalName]
                            };
                        } else {
                            console.log(`ℹ️ [API] No Mind Block Overrides for ${internalName} (slug: ${slug})`);
                        }

                        // Apply Model Overrides
                        if (internalName && modelOverrides[internalName]) {
                            console.log(`✅ [API] Applying Model Override for ${internalName}:`, modelOverrides[internalName]);
                            enrichedInstance.model_override = modelOverrides[internalName];
                        } else {
                            console.log(`ℹ️ [API] No Model Override for ${internalName}`);
                        }

                        if (internalName) {
                            roleInstancesMap[internalName] = enrichedInstance;
                            roomRoles.push(internalName);
                        }
                    });
                }
            }
        }

        let initialMessages = recentMessages || [];
        console.log(`✅ [API] 載入完成: Room=${roomId}, Roles=${roomRoles.length}, Models=${modelConfigs?.length}, Messages=${initialMessages.length}`);

        return NextResponse.json({
            success: true,
            data: {
                roomData,
                roleInstancesMap,
                roomRoles: Array.from(new Set(roomRoles)),
                modelConfigs: modelConfigs || [],
                initialMessages
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error: any) {
        console.error('❌ [API] 房間資訊 API 異常:', error);
        return NextResponse.json(
            { success: false, error: error.message || '內部伺服器錯誤' },
            { status: 500 }
        );
    }
}

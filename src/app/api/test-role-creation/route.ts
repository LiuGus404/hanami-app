import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId } = body;
    
    console.log('🧪 測試角色創建，房間 ID:', roomId);
    
    // 測試 1: 檢查 ai_roles 表
    const { data: roles, error: rolesError } = await supabase
      .from('ai_roles')
      .select('*');
    
    console.log('AI 角色查詢結果:', { count: roles?.length, error: rolesError?.message });
    
    // 測試 2: 檢查房間是否存在
    const { data: room, error: roomError } = await supabase
      .from('ai_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    console.log('房間查詢結果:', { room: room?.title, error: roomError?.message });
    
    // 測試 3: 嘗試創建角色實例（使用第一個可用角色）
    if (roles && roles.length > 0 && room) {
      const testRole = roles[0];
      
      const { data: instance, error: instanceError } = await supabase
        .from('role_instances')
        .insert({
          room_id: roomId,
          role_id: testRole.id,
          nickname: `測試_${testRole.name}`
        })
        .select()
        .single();
      
      console.log('角色實例創建結果:', { instance: instance?.id, error: instanceError?.message });
      
      if (instance) {
        // 測試 4: 創建房間角色關聯
        const { data: relation, error: relationError } = await supabase
          .from('room_roles')
          .insert({
            room_id: roomId,
            role_instance_id: instance.id,
            is_active: true
          })
          .select()
          .single();
        
        console.log('角色關聯創建結果:', { relation: relation?.id, error: relationError?.message });
        
        return NextResponse.json({
          success: true,
          message: '測試成功',
          data: {
            roles: roles?.length,
            room: room?.title,
            instance: instance?.id,
            relation: relation?.id
          }
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      message: '測試失敗',
      data: {
        rolesCount: roles?.length || 0,
        rolesError: rolesError?.message,
        roomError: roomError?.message
      }
    });
    
  } catch (error) {
    console.error('測試角色創建錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, roleName } = body;
    
    if (!roomId || !roleName) {
      return NextResponse.json({
        success: false,
        error: '缺少 roomId 或 roleName 參數'
      }, { status: 400 });
    }
    
    console.log('🗑️ 移除房間角色:', roomId, roleName);
    
    // 1. 獲取要移除的角色 ID
    const { data: aiRole, error: roleError } = await supabase
      .from('ai_roles')
      .select('id, name, slug')
      .or(`name.eq.${roleName},slug.eq.${roleName}`)
      .single();
    
    if (roleError || !aiRole) {
      return NextResponse.json({
        success: false,
        error: `找不到角色: ${roleName}`
      }, { status: 404 });
    }
    
    const roleId = aiRole.id;
    
    // 2. 檢查房間中是否還有其他角色（確保不會移除最後一個角色）
    const { data: allRoleInstances, error: countError } = await supabase
      .from('role_instances')
      .select('id')
      .eq('room_id', roomId);
    
    if (countError) {
      console.log('⚠️ 檢查角色數量失敗:', countError.message);
    } else if (allRoleInstances && allRoleInstances.length <= 1) {
      return NextResponse.json({
        success: false,
        error: '專案中至少需要保留一個 AI 角色'
      }, { status: 400 });
    }
    
    // 3. 找到要刪除的角色實例
    const { data: roleInstance, error: instanceError } = await supabase
      .from('role_instances')
      .select('id')
      .eq('room_id', roomId)
      .eq('role_id', roleId)
      .single();
    
    if (instanceError || !roleInstance) {
      return NextResponse.json({
        success: false,
        error: `該角色不在專案中: ${roleName}`
      }, { status: 404 });
    }
    
    // 4. 刪除房間角色關聯
    const { error: relationError } = await supabase
      .from('room_roles')
      .delete()
      .eq('room_id', roomId)
      .eq('role_instance_id', roleInstance.id);
    
    if (relationError) {
      console.error('刪除角色關聯失敗:', relationError);
      return NextResponse.json({
        success: false,
        error: `刪除角色關聯失敗: ${relationError.message}`
      }, { status: 500 });
    }
    
    // 5. 刪除角色實例
    const { error: deleteError } = await supabase
      .from('role_instances')
      .delete()
      .eq('id', roleInstance.id);
    
    if (deleteError) {
      console.error('刪除角色實例失敗:', deleteError);
      return NextResponse.json({
        success: false,
        error: `刪除角色實例失敗: ${deleteError.message}`
      }, { status: 500 });
    }
    
    console.log('✅ 成功移除房間角色');
    
    return NextResponse.json({
      success: true,
      message: `成功從專案移除角色 ${roleName}`,
      data: {
        roleId,
        roleName,
        instanceId: roleInstance.id
      }
    });
    
  } catch (error) {
    console.error('移除房間角色錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}


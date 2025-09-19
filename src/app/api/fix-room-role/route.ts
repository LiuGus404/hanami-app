import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, roleName, action = 'replace' } = body;
    
    if (!roomId || !roleName) {
      return NextResponse.json({
        success: false,
        error: '缺少 roomId 或 roleName 參數'
      }, { status: 400 });
    }
    
    console.log('🔧 處理房間角色:', roomId, roleName, '動作:', action);
    
    // 1. 獲取角色 ID
    const { data: aiRole, error: roleError } = await supabase
      .from('ai_roles')
      .select('id, name, slug')
      .or(`name.eq.${roleName},slug.eq.${roleName}`)
      .single();
    
    if (roleError || !aiRole) {
      console.log('角色不存在，創建新角色...');
      
      // 創建角色
      const { data: newRole, error: createRoleError } = await supabase
        .from('ai_roles')
        .insert({
          name: roleName,
          slug: roleName.toLowerCase(),
          default_model: 'gpt-4o-mini',
          system_prompt: `你是 ${roleName}`,
          is_public: true
        })
        .select()
        .single();
      
      if (createRoleError) {
        return NextResponse.json({
          success: false,
          error: `創建角色失敗: ${createRoleError.message}`
        }, { status: 500 });
      }
      
      console.log('✅ 創建新角色:', newRole);
    }
    
    const roleId = aiRole?.id || (await supabase
      .from('ai_roles')
      .select('id')
      .eq('name', roleName)
      .single()).data?.id;
    
    // 2. 根據動作決定是否清除現有角色
    if (action === 'replace') {
      // 替換模式：清除所有現有角色
      await supabase
        .from('room_roles')
        .delete()
        .eq('room_id', roomId);

      await supabase
        .from('role_instances')
        .delete()
        .eq('room_id', roomId);
    } else if (action === 'add') {
      // 添加模式：檢查角色是否已存在
      const { data: existingInstance, error: checkError } = await supabase
        .from('role_instances')
        .select('id')
        .eq('room_id', roomId)
        .eq('role_id', roleId)
        .single();
      
      if (existingInstance) {
        console.log('⚠️ 角色已存在於房間中');
        return NextResponse.json({
          success: true,
          message: `角色 ${roleName} 已經在專案中了`,
          data: { roleId, existing: true }
        });
      }
    }
    
    // 3. 創建新的角色實例
    const { data: roleInstance, error: instanceError } = await supabase
      .from('role_instances')
      .insert({
        room_id: roomId,
        role_id: roleId,
        nickname: roleName
      })
      .select()
      .single();
    
    if (instanceError) {
      return NextResponse.json({
        success: false,
        error: `創建角色實例失敗: ${instanceError.message}`
      }, { status: 500 });
    }
    
    // 4. 創建房間角色關聯
    const { error: relationError } = await supabase
      .from('room_roles')
      .insert({
        room_id: roomId,
        role_instance_id: roleInstance.id,
        is_active: true
      });
    
    if (relationError) {
      return NextResponse.json({
        success: false,
        error: `創建角色關聯失敗: ${relationError.message}`
      }, { status: 500 });
    }
    
    console.log(`✅ 成功${action === 'add' ? '添加' : '設置'}房間角色`);
    
    return NextResponse.json({
      success: true,
      message: `成功為專案${action === 'add' ? '添加' : '設置'}角色 ${roleName}`,
      data: {
        roleInstance,
        roleId,
        action
      }
    });
    
  } catch (error) {
    console.error('修復房間角色錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

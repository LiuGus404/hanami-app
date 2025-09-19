import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId } = body;
    
    if (!roomId) {
      return NextResponse.json({
        success: false,
        error: '缺少 roomId 參數'
      }, { status: 400 });
    }
    
    console.log('🗑️ 開始刪除專案:', roomId);
    
    // 1. 獲取房間資訊（用於日誌）
    const { data: roomInfo, error: roomInfoError } = await supabase
      .from('ai_rooms')
      .select('title, description')
      .eq('id', roomId)
      .single();
    
    if (roomInfoError) {
      console.log('⚠️ 無法獲取房間資訊:', roomInfoError.message);
    }
    
    console.log('🗑️ 刪除專案:', roomInfo?.title || roomId);
    
    // 2. 刪除相關的角色關聯（room_roles 會因為外鍵約束自動刪除 role_instances）
    const { error: roleInstancesError } = await supabase
      .from('role_instances')
      .delete()
      .eq('room_id', roomId);
    
    if (roleInstancesError) {
      console.log('⚠️ 刪除角色實例時發生錯誤:', roleInstancesError.message);
      // 不中斷流程，繼續刪除其他資料
    }
    
    // 3. 刪除房間角色關聯
    const { error: roomRolesError } = await supabase
      .from('room_roles')
      .delete()
      .eq('room_id', roomId);
    
    if (roomRolesError) {
      console.log('⚠️ 刪除房間角色關聯時發生錯誤:', roomRolesError.message);
    }
    
    // 4. 刪除相關訊息
    const { error: messagesError } = await supabase
      .from('ai_messages')
      .delete()
      .eq('room_id', roomId);
    
    if (messagesError) {
      console.log('⚠️ 刪除訊息時發生錯誤:', messagesError.message);
    }
    
    // 5. 刪除相關記憶項目
    const { error: memoryError } = await supabase
      .from('memory_items')
      .delete()
      .eq('room_id', roomId);
    
    if (memoryError) {
      console.log('⚠️ 刪除記憶項目時發生錯誤:', memoryError.message);
    }
    
    // 6. 最後刪除房間本身
    const { error: roomError } = await supabase
      .from('ai_rooms')
      .delete()
      .eq('id', roomId);
    
    if (roomError) {
      console.error('❌ 刪除房間失敗:', roomError);
      return NextResponse.json({
        success: false,
        error: `刪除房間失敗: ${roomError.message}`,
        details: roomError
      }, { status: 500 });
    }
    
    console.log('✅ 專案刪除完成:', roomInfo?.title || roomId);
    
    return NextResponse.json({
      success: true,
      message: `專案 "${roomInfo?.title || roomId}" 已成功刪除`,
      data: {
        roomId,
        roomTitle: roomInfo?.title
      }
    });
    
  } catch (error) {
    console.error('刪除專案錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, title, description } = body;
    
    if (!roomId || !title?.trim()) {
      return NextResponse.json({
        success: false,
        error: '缺少 roomId 或 title 參數'
      }, { status: 400 });
    }
    
    console.log('🔄 更新房間資訊:', roomId, title, description);
    
    // 1. 檢查房間是否存在
    const { data: existingRoom, error: checkError } = await supabase
      .from('ai_rooms')
      .select('id, title, description')
      .eq('id', roomId)
      .single();
    
    if (checkError || !existingRoom) {
      return NextResponse.json({
        success: false,
        error: '房間不存在'
      }, { status: 404 });
    }
    
    // 2. 更新房間資訊
    const { data: updatedRoom, error: updateError } = await supabase
      .from('ai_rooms')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新房間失敗:', updateError);
      return NextResponse.json({
        success: false,
        error: `更新房間失敗: ${updateError.message}`
      }, { status: 500 });
    }
    
    console.log('✅ 房間資訊更新成功');
    
    return NextResponse.json({
      success: true,
      message: '專案資訊更新成功',
      data: {
        room: updatedRoom,
        oldTitle: existingRoom.title,
        oldDescription: existingRoom.description,
        newTitle: title.trim(),
        newDescription: description?.trim() || ''
      }
    });
    
  } catch (error) {
    console.error('更新房間資訊錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}


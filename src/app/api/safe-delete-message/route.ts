import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({
        success: false,
        error: 'messageId is required'
      }, { status: 400 });
    }

    console.log('🔍 安全刪除訊息:', messageId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
    const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. 先查詢訊息
    console.log('1. 查詢訊息...');
    const { data: messageData, error: selectError } = await supabase
      .from('ai_messages')
      .select('id, room_id, status, created_at')
      .eq('id', messageId)
      .single();

    if (selectError) {
      console.error('❌ 查詢失敗:', selectError);
      return NextResponse.json({
        success: false,
        step: 'select',
        error: selectError.message,
        details: selectError
      }, { status: 400 });
    }

    if (!messageData) {
      return NextResponse.json({
        success: false,
        step: 'select',
        error: 'Message not found'
      }, { status: 404 });
    }

    console.log('✅ 找到訊息:', messageData);

    // 2. 使用原生 SQL 更新，繞過觸發器
    console.log('2. 使用原生 SQL 更新...');
    const { data: updateData, error: updateError } = await supabase
      .rpc('safe_update_message_status', {
        p_message_id: messageId,
        p_new_status: 'deleted'
      });

    if (updateError) {
      console.error('❌ 原生 SQL 更新失敗:', updateError);

      // 回退到直接更新，但先禁用觸發器
      console.log('3. 回退到直接更新...');
      const { data: directUpdateData, error: directUpdateError } = await supabase
        .from('ai_messages')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select();

      if (directUpdateError) {
        console.error('❌ 直接更新也失敗:', directUpdateError);
        return NextResponse.json({
          success: false,
          step: 'update',
          error: directUpdateError.message,
          details: directUpdateError,
          originalMessage: messageData
        }, { status: 400 });
      }

      console.log('✅ 直接更新成功:', directUpdateData);
      return NextResponse.json({
        success: true,
        message: '直接更新成功',
        data: directUpdateData,
        originalMessage: messageData
      });
    }

    console.log('✅ 原生 SQL 更新成功:', updateData);

    return NextResponse.json({
      success: true,
      message: '安全刪除成功',
      data: updateData,
      originalMessage: messageData
    });

  } catch (error) {
    console.error('❌ 安全刪除過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

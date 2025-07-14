import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 檢查表是否存在並獲取結構
    const { data: tableInfo, error: tableError } = await supabase
      .from('hanami_ai_message_templates')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        error: '表不存在或連接失敗',
        details: tableError.message,
        code: tableError.code
      }, { status: 500 });
    }

    // 嘗試插入一個測試記錄，使用 template_name
    const testData = {
      template_name: '測試範本',
      template_content: '這是一個測試範本',
      template_type: 'general',
      is_active: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('hanami_ai_message_templates')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        error: '插入測試資料失敗',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 });
    }

    // 刪除測試記錄
    await supabase
      .from('hanami_ai_message_templates')
      .delete()
      .eq('id', insertData.id);

    return NextResponse.json({
      success: true,
      tableExists: true,
      insertTest: 'passed',
      tableStructure: 'valid',
      actualFields: Object.keys(insertData)
    });

  } catch (error) {
    console.error('測試 AI 範本表失敗:', error);
    return NextResponse.json({
      error: '測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
    }, { status: 500 });
  }
} 
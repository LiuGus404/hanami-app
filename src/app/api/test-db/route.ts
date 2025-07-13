import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 檢查表是否存在
    const { data: tableExists, error: tableError } = await supabase
      .from('hanami_resource_templates')
      .select('id')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        error: '表不存在或連接失敗',
        details: tableError.message,
      }, { status: 500 });
    }

    // 獲取所有範本
    const { data: templates, error: templatesError } = await supabase
      .from('hanami_resource_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (templatesError) {
      return NextResponse.json({
        error: '獲取範本失敗',
        details: templatesError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      templatesCount: templates?.length || 0,
      templates: templates || [],
    });

  } catch (error) {
    console.error('測試資料庫失敗:', error);
    return NextResponse.json({
      error: '測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
    }, { status: 500 });
  }
} 
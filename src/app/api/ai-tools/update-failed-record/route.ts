import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 更新失敗記錄的引用來源信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('更新失敗記錄:', body);

    const { request_id, citations, search_results } = body;

    if (!request_id) {
      return NextResponse.json({
        success: false,
        error: '缺少請求ID'
      }, { status: 400 });
    }

    // 查找對應的使用記錄
    const { data: usageRecord, error: findError } = await supabase
      .from('hanami_ai_tool_usage')
      .select('*')
      .eq('tool_id', 'content-generation')
      .contains('input_data', { request_id })
      .single();

    if (findError || !usageRecord) {
      console.error('找不到對應的使用記錄:', findError);
      return NextResponse.json({
        success: false,
        error: '找不到對應的使用記錄'
      }, { status: 404 });
    }

    // 準備更新的輸出數據
    let outputData = usageRecord.output_data || {};
    
    // 添加引用來源和搜索結果信息
    if (citations || search_results) {
      outputData = {
        ...outputData,
        ai_stats: {
          ...outputData.ai_stats,
          citations: citations || [],
          search_results: search_results || []
        }
      };
    }

    // 更新使用記錄
    const { error: updateError } = await supabase
      .from('hanami_ai_tool_usage')
      .update({
        output_data: outputData,
        updated_at: new Date().toISOString()
      })
      .eq('id', usageRecord.id);

    if (updateError) {
      console.error('更新使用記錄失敗:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新使用記錄失敗'
      }, { status: 500 });
    }

    console.log('失敗記錄已成功更新');
    
    return NextResponse.json({
      success: true,
      message: '失敗記錄已成功更新',
      request_id
    });

  } catch (error) {
    console.error('更新失敗記錄失敗:', error);
    return NextResponse.json({
      success: false,
      error: '更新失敗記錄失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
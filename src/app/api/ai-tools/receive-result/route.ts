import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 接收AI生成結果並更新記錄
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('接收AI結果:', body);

    const { request_id, result } = body;

    if (!request_id) {
      return NextResponse.json({
        success: false,
        error: '缺少請求ID'
      }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: '缺少結果數據'
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

    // 處理完整的AI回應格式
    let outputData: any = {
      generated_at: new Date().toISOString(),
      request_id
    };

    // 提取生成內容
    if (result.message && result.message.content) {
      outputData.generated_content = result.message.content;
    } else if (result.content) {
      outputData.generated_content = result.content;
    } else if (result.choices && result.choices[0] && result.choices[0].message) {
      outputData.generated_content = result.choices[0].message.content;
    } else {
      outputData.generated_content = '生成內容為空';
    }

    // 處理AI統計信息
    if (result.usage || result.citations || result.search_results || result.model) {
      outputData.ai_stats = {
        model: result.model || 'unknown',
        usage: result.usage || {},
        citations: result.citations || [],
        search_results: result.search_results || []
      };
    }

    // 如果result是數組格式，處理第一個元素
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      
      // 提取生成內容
      if (firstResult.message && firstResult.message.content) {
        outputData.generated_content = firstResult.message.content;
      }
      
      // 處理AI統計信息
      if (firstResult.usage || firstResult.citations || firstResult.search_results || firstResult.model) {
        outputData.ai_stats = {
          model: firstResult.model || 'unknown',
          usage: firstResult.usage || {},
          citations: firstResult.citations || [],
          search_results: firstResult.search_results || []
        };
      }
    }

    // 保留原有的output_data內容（如果有的話）
    if (usageRecord.output_data) {
      outputData = {
        ...usageRecord.output_data,
        ...outputData
      };
    }

    console.log('準備更新的output_data:', outputData);

    // 更新使用記錄
    const { error: updateError } = await supabase
      .from('hanami_ai_tool_usage')
      .update({
        status: 'completed',
        output_data: outputData,
        completed_at: new Date().toISOString()
      })
      .eq('id', usageRecord.id);

    if (updateError) {
      console.error('更新使用記錄失敗:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新使用記錄失敗'
      }, { status: 500 });
    }

    console.log('AI結果已成功保存到記錄:', usageRecord.id);
    
    return NextResponse.json({
      success: true,
      message: 'AI結果已成功接收並保存',
      request_id,
      record_id: usageRecord.id
    });

  } catch (error) {
    console.error('接收AI結果失敗:', error);
    return NextResponse.json({
      success: false,
      error: '接收AI結果失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
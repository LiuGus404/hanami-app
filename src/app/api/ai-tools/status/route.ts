import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 獲取AI工具狀態統計
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('tool_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 構建查詢
    let query = supabase
      .from('hanami_ai_tool_usage')
      .select('*')
      .order('created_at', { ascending: false });

    // 如果指定了工具ID，則過濾
    if (toolId) {
      query = query.eq('tool_id', toolId);
    }

    // 限制結果數量
    query = query.limit(limit);

    const { data: toolStatuses, error } = await query;

    if (error) {
      console.error('查詢AI工具狀態失敗:', error);
      return NextResponse.json({
        success: false,
        error: '查詢AI工具狀態失敗'
      }, { status: 500 });
    }

    // 計算統計數據
    const stats = {
      total: toolStatuses?.length || 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      avg_processing_time: 0
    };

    let totalProcessingTime = 0;
    let completedCount = 0;

    toolStatuses?.forEach(tool => {
      stats[tool.status as keyof typeof stats]++;
      
      // 計算平均處理時間
      if (tool.started_at && tool.completed_at) {
        const startTime = new Date(tool.started_at);
        const endTime = new Date(tool.completed_at);
        const processingTime = endTime.getTime() - startTime.getTime();
        totalProcessingTime += processingTime;
        completedCount++;
      }
    });

    if (completedCount > 0) {
      stats.avg_processing_time = Math.round(totalProcessingTime / completedCount / 1000); // 轉換為秒
    }

    return NextResponse.json({
      success: true,
      data: {
        tool_statuses: toolStatuses || [],
        stats
      }
    });

  } catch (error) {
    console.error('獲取AI工具狀態失敗:', error);
    return NextResponse.json({
      success: false,
      error: '獲取AI工具狀態失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 更新AI工具狀態
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, started_at, completed_at, error_message } = body;

    if (!id || !status) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數'
      }, { status: 400 });
    }

    const updateData: any = { status };
    
    if (started_at) updateData.started_at = started_at;
    if (completed_at) updateData.completed_at = completed_at;
    if (error_message) updateData.error_message = error_message;

    const { data, error } = await supabase
      .from('hanami_ai_tool_usage')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新AI工具狀態失敗:', error);
      return NextResponse.json({
        success: false,
        error: '更新AI工具狀態失敗'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('更新AI工具狀態失敗:', error);
    return NextResponse.json({
      success: false,
      error: '更新AI工具狀態失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
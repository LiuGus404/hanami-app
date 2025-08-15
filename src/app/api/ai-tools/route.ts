import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 獲取AI工具列表
export async function GET(request: NextRequest) {
  try {
    console.log('開始獲取AI工具列表...');

    // 暫時返回模擬資料，後續會連接到實際資料庫
    const mockTools = [
      {
        id: 'content-generation',
        tool_name: '內容生成工具',
        tool_description: '基於教學活動範本和學生成長情況生成個性化內容',
        tool_type: 'content_generation',
        is_active: true,
        current_users: 3,
        queue_length: 2,
        avg_wait_time: 45,
        status: 'available'
      },
      {
        id: 'lesson-analysis',
        tool_name: '課程分析工具',
        tool_description: '分析學生學習進度和課程效果',
        tool_type: 'analysis',
        is_active: true,
        current_users: 1,
        queue_length: 0,
        avg_wait_time: 30,
        status: 'available'
      },
      {
        id: 'schedule-optimizer',
        tool_name: '排程優化工具',
        tool_description: '智能優化課程排程和教師分配',
        tool_type: 'automation',
        is_active: false,
        current_users: 0,
        queue_length: 0,
        avg_wait_time: 0,
        status: 'maintenance'
      }
    ];

    // 計算統計資料
    const stats = {
      total_tools: mockTools.length,
      active_tools: mockTools.filter(t => t.is_active).length,
      total_users: mockTools.reduce((sum, t) => sum + t.current_users, 0),
      total_queue: mockTools.reduce((sum, t) => sum + t.queue_length, 0),
      avg_wait_time: Math.round(mockTools.reduce((sum, t) => sum + t.avg_wait_time, 0) / mockTools.length)
    };

    console.log('成功獲取AI工具列表');
    
    return NextResponse.json({
      success: true,
      tools: mockTools,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('獲取AI工具列表失敗:', error);
    return NextResponse.json({
      success: false,
      error: '獲取AI工具列表失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 創建新的AI工具
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('創建AI工具請求:', body);

    const { tool_name, tool_description, tool_type, tool_config } = body;

    // 驗證必要欄位
    if (!tool_name || !tool_type) {
      return NextResponse.json({
        success: false,
        error: '缺少必要欄位'
      }, { status: 400 });
    }

    // 準備插入資料
    const newTool = {
      tool_name,
      tool_description: tool_description || '',
      tool_type,
      tool_config: tool_config || {},
      is_active: true,
      max_concurrent_users: 10,
      queue_enabled: true,
      maintenance_mode: false
    };

    console.log('準備插入的資料:', newTool);

    // 暫時返回成功回應，後續會連接到實際資料庫
    const createdTool = {
      id: `tool_${Date.now()}`,
      ...newTool,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('成功創建AI工具');
    
    return NextResponse.json({
      success: true,
      tool: createdTool,
      message: 'AI工具創建成功'
    });

  } catch (error) {
    console.error('創建AI工具失敗:', error);
    return NextResponse.json({
      success: false,
      error: '創建AI工具失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 更新AI工具
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('更新AI工具請求:', body);

    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少工具ID'
      }, { status: 400 });
    }

    // 暫時返回成功回應，後續會連接到實際資料庫
    const updatedTool = {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };

    console.log('成功更新AI工具');
    
    return NextResponse.json({
      success: true,
      tool: updatedTool,
      message: 'AI工具更新成功'
    });

  } catch (error) {
    console.error('更新AI工具失敗:', error);
    return NextResponse.json({
      success: false,
      error: '更新AI工具失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 刪除AI工具
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少工具ID'
      }, { status: 400 });
    }

    console.log('刪除AI工具:', id);

    // 暫時返回成功回應，後續會連接到實際資料庫
    console.log('成功刪除AI工具');
    
    return NextResponse.json({
      success: true,
      message: 'AI工具刪除成功'
    });

  } catch (error) {
    console.error('刪除AI工具失敗:', error);
    return NextResponse.json({
      success: false,
      error: '刪除AI工具失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
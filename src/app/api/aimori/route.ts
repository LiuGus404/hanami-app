import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Mori API 收到請求:', body);

    // 從請求中提取數據
    const {
      user_id,
      user_prompt,
      final_prompt,
      model = 'gpt-4o-mini',
      timestamp,
      session_id,
      companion_id,
      user_info,
      context,
      memory_context,
      response_preferences,
      research_type,
      analysis_depth,
      research_data,
      project_info,
      has_valid_settings,
      system_prompt
    } = body;

    // 構建發送到 n8n 的 payload
    const payload = {
      user_id,
      user_prompt: user_prompt || final_prompt,
      model,
      timestamp: timestamp || new Date().toISOString(),
      session_id,
      companion_id: companion_id || 'mori',
      user_info: user_info || {},
      context: context || {},
      memory_context: memory_context || {},
      response_preferences: response_preferences || {
        include_text_response: true,
        max_response_length: 500
      }
    };

    // 如果有研究類型，添加到 payload
    if (research_type) {
      (payload as any).research_type = research_type;
    }

    // 如果有分析深度，添加到 payload
    if (analysis_depth) {
      (payload as any).analysis_depth = analysis_depth;
    }

    // 如果有研究資料，添加到 payload
    if (research_data) {
      (payload as any).research_data = research_data;
      console.log('📊 添加研究資料到 payload:', research_data);
    }

    // 如果有專案資訊，添加到 payload
    if (project_info) {
      (payload as any).project_info = project_info;
      console.log('📋 添加專案資訊到 payload:', project_info);
    }

    // 如果有設定有效性標記，添加到 payload
    if (has_valid_settings !== undefined) {
      (payload as any).has_valid_settings = has_valid_settings;
      console.log('✅ 設定有效性:', has_valid_settings);
    }

    // 如果有系統提示，添加到 payload
    if (system_prompt) {
      (payload as any).system_prompt = system_prompt;
    }

    console.log('📤 準備發送到 Mori webhook 的 payload:', payload);

    // 發送到 n8n webhook
    const webhookUrl = 'https://webhook.lingumiai.com/webhook/aimori';
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'hanami-web/1.0',
        'X-Client': 'hanami-web'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await webhookResponse.text();
    console.log('📨 Mori webhook 回應狀態:', webhookResponse.status);
    console.log('📨 Mori webhook 回應內容:', responseData);

    // 嘗試解析 JSON 回應
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
    } catch (parseError) {
      console.log('📝 回應不是 JSON 格式，當作純文字處理');
      parsedResponse = { raw: responseData };
    }

    return NextResponse.json({
      success: true,
      status: webhookResponse.status,
      data: parsedResponse
    });

  } catch (error) {
    console.error('❌ Mori API 錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      },
      { status: 500 }
    );
  }
}

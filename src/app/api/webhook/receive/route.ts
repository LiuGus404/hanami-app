import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 通用webhook接收端點
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到webhook數據:', body);

    // 解析webhook數據
    const {
      request_id,
      tool_id = 'unknown',
      status = 'completed',
      result,
      error_message,
      processing_time_ms,
      token_count,
      cost_estimate,
      user_email,
      ...otherData
    } = body;

    if (!request_id) {
      console.error('缺少request_id');
      return NextResponse.json({
        success: false,
        error: '缺少request_id'
      }, { status: 400 });
    }

    // 查找對應的使用記錄
    let { data: usageRecord, error: findError } = await supabase
      .from('hanami_ai_tool_usage')
      .select('*')
      .eq('tool_id', tool_id)
      .contains('input_data', { request_id })
      .single();

    // 如果找不到記錄，嘗試創建一個新記錄
    if (findError || !usageRecord) {
      console.log('找不到對應的使用記錄，嘗試創建新記錄');
      
      const newRecord = {
        tool_id,
        user_email: user_email || 'admin@hanami.com',
        status: 'queued',
        input_data: { request_id },
        output_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdRecord, error: createError } = await supabase
        .from('hanami_ai_tool_usage')
        .insert(newRecord)
        .select()
        .single();

      if (createError) {
        console.error('創建新記錄失敗:', createError);
        return NextResponse.json({
          success: false,
          error: '創建新記錄失敗'
        }, { status: 500 });
      }

      usageRecord = createdRecord;
      console.log('成功創建新記錄:', usageRecord.id);
    }

    // 準備更新的數據
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // 根據狀態設置相應的時間戳
    if (status === 'processing' && !usageRecord.started_at) {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    // 處理結果數據
    if (result) {
      console.log('=== 開始處理result數據 ===');
      console.log('result類型:', typeof result);
      console.log('result是否為數組:', Array.isArray(result));
      console.log('result長度:', Array.isArray(result) ? result.length : 'N/A');
      console.log('完整result數據:', JSON.stringify(result, null, 2));
      
      let outputData: any = {
        generated_at: new Date().toISOString(),
        request_id
      };

      // 如果result是數組格式，處理第一個元素
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        console.log('處理數組格式的result，第一個元素:', JSON.stringify(firstResult, null, 2));
        
        // 提取生成內容
        if (firstResult.message && firstResult.message.content) {
          console.log('從firstResult.message.content提取內容');
          outputData.generated_content = firstResult.message.content;
        } else if (firstResult.content) {
          console.log('從firstResult.content提取內容');
          outputData.generated_content = firstResult.content;
        } else if (firstResult.choices && firstResult.choices[0] && firstResult.choices[0].message) {
          console.log('從firstResult.choices[0].message提取內容');
          outputData.generated_content = firstResult.choices[0].message.content;
        } else if (firstResult.generated_content) {
          console.log('從firstResult.generated_content提取內容');
          outputData.generated_content = firstResult.generated_content;
        } else {
          console.log('無法從firstResult中提取生成內容');
        }
        
        console.log('提取的生成內容:', outputData.generated_content?.substring(0, 200) + '...');
        
        // 處理AI統計信息
        if (firstResult.usage || firstResult.citations || firstResult.search_results || firstResult.model) {
          outputData.ai_stats = {
            model: firstResult.model || 'unknown',
            usage: firstResult.usage || {},
            citations: firstResult.citations || [],
            search_results: firstResult.search_results || []
          };
        }
      } else {
        // 處理非數組格式的result
        // 提取生成內容
        if (result.message && result.message.content) {
          outputData.generated_content = result.message.content;
        } else if (result.content) {
          outputData.generated_content = result.content;
        } else if (result.choices && result.choices[0] && result.choices[0].message) {
          outputData.generated_content = result.choices[0].message.content;
        } else if (result.generated_content) {
          outputData.generated_content = result.generated_content;
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
      }

      // 保留原有的output_data內容（如果有的話），但絕對優先使用新的AI生成內容
      if (usageRecord.output_data) {
        if (outputData.generated_content) {
          console.log('發現新的AI生成內容，將替換模板內容');
          console.log('新的生成內容:', outputData.generated_content.substring(0, 200) + '...');
          
          // 完全重建outputData，確保新數據絕對不會被覆蓋
          const newOutputData = {
            // 保留原有的非關鍵字段
            template_used: usageRecord.output_data.template_used,
            age_group_reference: usageRecord.output_data.age_group_reference,
            // 使用新的關鍵數據
            generated_content: outputData.generated_content,
            ai_stats: outputData.ai_stats,
            generated_at: outputData.generated_at,
            request_id: outputData.request_id
          };
          
          outputData = newOutputData;
          
          console.log('重建後的outputData:', JSON.stringify(outputData, null, 2));
        } else {
          console.log('沒有新的AI生成內容，保留原有內容');
          outputData = {
            ...usageRecord.output_data,
            ...outputData
          };
        }
      }

      console.log('最終的outputData:', JSON.stringify(outputData, null, 2));
      updateData.output_data = outputData;
    }

    // 處理錯誤信息
    if (error_message) {
      updateData.error_message = error_message;
    }

    // 處理其他統計數據
    if (processing_time_ms) {
      updateData.processing_time_ms = processing_time_ms;
    }
    if (token_count) {
      updateData.token_count = token_count;
    }
    if (cost_estimate) {
      updateData.cost_estimate = cost_estimate;
    }

    // 更新使用記錄
    const { error: updateError } = await supabase
      .from('hanami_ai_tool_usage')
      .update(updateData)
      .eq('id', usageRecord.id);

    if (updateError) {
      console.error('更新使用記錄失敗:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新使用記錄失敗'
      }, { status: 500 });
    }

    console.log('webhook數據已成功保存到記錄:', usageRecord.id);
    
    return NextResponse.json({
      success: true,
      message: 'webhook數據已成功接收並保存',
      request_id,
      record_id: usageRecord.id
    });

  } catch (error) {
    console.error('處理webhook失敗:', error);
    return NextResponse.json({
      success: false,
      error: '處理webhook失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
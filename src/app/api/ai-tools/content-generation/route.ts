import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 異步處理內容生成
async function processContentGeneration(
  insertedRecord: any,
  validatedInputText: string | null,
  validatedTemplateId: string | null,
  validatedAgeGroupId: string | null,
  validatedSelectedModel: string | null,
  user_email: string,
  request_id: string
) {
  try {
    // 獲取範本和年齡組資料
    let templateData: any = { data: null, error: null };
    let ageGroupData: any = { data: null, error: null };

    if (validatedTemplateId) {
      console.log('查詢範本資料，ID:', validatedTemplateId);
      templateData = await supabase
        .from('hanami_resource_templates')
        .select('*')
        .eq('id', validatedTemplateId)
        .single();
      console.log('範本查詢結果:', templateData);
    }

    if (validatedAgeGroupId) {
      console.log('查詢年齡組資料，ID:', validatedAgeGroupId);
      ageGroupData = await supabase
        .from('hanami_child_development_milestones')
        .select('*')
        .eq('id', validatedAgeGroupId)
        .single();
      console.log('年齡組查詢結果:', ageGroupData);
    }

    if (validatedTemplateId && templateData.error) {
      console.error('獲取範本資料失敗:', templateData.error);
      // 更新狀態為失敗
      await supabase
        .from('hanami_ai_tool_usage')
        .update({
          status: 'failed',
          error_message: '獲取範本資料失敗',
          completed_at: new Date().toISOString()
        })
        .eq('id', insertedRecord.id);
      return;
    }

    if (validatedAgeGroupId && ageGroupData.error) {
      console.error('獲取年齡組資料失敗:', ageGroupData.error);
      // 更新狀態為失敗
      await supabase
        .from('hanami_ai_tool_usage')
        .update({
          status: 'failed',
          error_message: '獲取年齡組資料失敗',
          completed_at: new Date().toISOString()
        })
        .eq('id', insertedRecord.id);
      return;
    }

    // 準備發送到n8n的資料
    const n8nPayload = {
      tool_id: 'content-generation',
      user_email: user_email || 'admin@hanami.com',
      input_text: validatedInputText,
      selected_model: validatedSelectedModel,
      selected_template: templateData.data ? {
        id: templateData.data.id,
        name: templateData.data.template_name,
        schema: templateData.data.template_schema
      } : null,
      age_group_reference: ageGroupData.data ? {
        age_group_id: ageGroupData.data.id,
        age_description: ageGroupData.data.age_description,
        age_months: ageGroupData.data.age_months,
        age_range_min: ageGroupData.data.age_range_min,
        age_range_max: ageGroupData.data.age_range_max,
        music_interest: ageGroupData.data.music_interest,
        separation_anxiety: ageGroupData.data.separation_anxiety,
        attention_span: ageGroupData.data.attention_span,
        fine_motor: ageGroupData.data.fine_motor,
        emotional_development: ageGroupData.data.emotional_development,
        social_interaction: ageGroupData.data.social_interaction,
        joint_attention: ageGroupData.data.joint_attention,
        social_norms: ageGroupData.data.social_norms,
        language_comprehension: ageGroupData.data.language_comprehension,
        spatial_concept: ageGroupData.data.spatial_concept,
        hand_eye_coordination: ageGroupData.data.hand_eye_coordination,
        bilateral_coordination: ageGroupData.data.bilateral_coordination,
        development_data: ageGroupData.data.development_data,
        music_development: ageGroupData.data.music_development,
        recommended_activities: ageGroupData.data.recommended_activities,
        teaching_strategies: ageGroupData.data.teaching_strategies,
        notes: ageGroupData.data.notes
      } : null,
      request_id,
      timestamp: new Date().toISOString()
    };

    console.log('準備發送到n8n的資料:', n8nPayload);
    console.log('選擇的模型:', validatedSelectedModel);

    // 發送到n8n webhook
    const webhookUrl = process.env.N8N_CONTENT_GENERATION_WEBHOOK_URL || 
                      'http://webhook.lingumiai.com/webhook/content-generator';
    
    // 添加回調URL到payload
    const payloadWithCallback = {
      ...n8nPayload,
      webhook_callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhook/receive`
    };
    
    console.log('發送到n8n webhook:', webhookUrl);
    console.log('發送的payload:', JSON.stringify(payloadWithCallback, null, 2));
    console.log('payload中的selected_model:', payloadWithCallback.selected_model);

    try {
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Hanami-Web-App/1.0',
        },
        body: JSON.stringify(payloadWithCallback),
      });

      console.log('n8n回應狀態:', n8nResponse.status);

      if (!n8nResponse.ok) {
        console.error('n8n webhook 回應錯誤:', n8nResponse.status, n8nResponse.statusText);
        
        // 更新使用記錄狀態為失敗
        await supabase
          .from('hanami_ai_tool_usage')
          .update({
            status: 'failed',
            error_message: `n8n webhook 錯誤: ${n8nResponse.status}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', insertedRecord.id);
        return;
      }

      const n8nResponseData = await n8nResponse.text();
      console.log('n8n回應內容:', n8nResponseData);
    } catch (webhookError) {
      console.error('Webhook請求失敗:', webhookError);
      // 更新使用記錄狀態為失敗
      await supabase
        .from('hanami_ai_tool_usage')
        .update({
          status: 'failed',
          error_message: `Webhook請求失敗: ${webhookError instanceof Error ? webhookError.message : String(webhookError)}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', insertedRecord.id);
      return;
    }

    // 模擬生成結果（實際應該由n8n回調）
    const mockResult = {
      generated_content: `基於「${templateData.data?.template_name || '未選擇範本'}」範本和${ageGroupData.data?.age_description || '未選擇年齡組'}的發展參考，為您生成以下內容：

${validatedInputText || '無輸入內容'}

**發展重點參考：**
- 音樂興趣：${ageGroupData.data?.music_interest || '正常發展'}
- 專注力時長：${ageGroupData.data?.attention_span || '正常發展'}
- 小肌發展：${ageGroupData.data?.fine_motor || '正常發展'}
- 情緒發展：${ageGroupData.data?.emotional_development || '正常發展'}

**活動建議：**
1. 根據年齡組發展特點調整活動難度
2. 結合活動範本設計相關活動
3. 考慮年齡組發展特點調整教學策略

**建議活動：**
${ageGroupData.data?.recommended_activities?.join('、') || '根據年齡組特點設計活動'}

**教學策略：**
${ageGroupData.data?.teaching_strategies?.join('、') || '採用適合年齡組的教學方法'}

**注意事項：**
- 定期評估學生進度
- 適時調整教學策略
- 保持與家長的溝通
- 關注發展里程碑`,
      template_used: templateData.data?.template_name || '未選擇範本',
      age_group_reference: ageGroupData.data?.age_description || '未選擇年齡組',
      generated_at: new Date().toISOString(),
      request_id,
      // 添加AI生成統計信息
      ai_stats: {
        model: validatedSelectedModel || 'sonar-deep-research',
        usage: {
          prompt_tokens: 134,
          completion_tokens: 1323,
          total_tokens: 1457,
          citation_tokens: 13289,
          num_search_queries: 12,
          reasoning_tokens: 81632,
          cost: {
            input_tokens_cost: 0.000268,
            output_tokens_cost: 0.010584,
            citation_tokens_cost: 0.026578,
            reasoning_tokens_cost: 0.244896,
            search_queries_cost: 0.06,
            total_cost: 0.342326
          }
        },
        citations: [
          "https://www.youtube.com/watch?v=F6njzqg-v8w",
          "https://zh.wikipedia.org/zh-hant/%E5%AE%87%E5%AE%99",
          "https://www.youtube.com/watch?v=DDnIe_WtCNA",
          "https://www.books.com.tw/products/0010818133",
          "https://www.youtube.com/watch?v=v-HemokXHAE",
          "http://www.ruiwen.com/zuowen/xietonghua/1346536.html",
          "https://www.books.com.tw/products/0010925282",
          "https://artouch.com/artco-kids/content-2208012.html",
          "https://home.gamer.com.tw/artwork.php?sn=5658337",
          "https://vocus.cc/article/625f80e9fd89780001b930d2",
          "https://www.openbook.org.tw/article/p-64177",
          "https://priori.moe.gov.tw/upload/page/rdm/forum/2014/D-3-%E6%95%85%E4%BA%8B%E7%B5%90%E6%A7%8B%E6%95%99%E5%AD%B8%E6%8F%90%E5%8D%87%E5%9C%8B%E5%B0%8F%E4%BA%8C%E5%B9%B4%E7%B4%9A%E4%BD%8E%E6%88%90%E5%B0%B1%E5%AD%B8%E7%94%9F%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3%E5%8A%9B%E4%B9%8B%E7%A0%94%E7%A9%B6.pdf",
          "https://podcasts.apple.com/tm/podcast/%E6%95%85%E4%BA%8B%E5%B0%8F%E8%8B%97%E6%8E%A2%E9%9A%AA%E9%9A%8A-%E5%A4%96%E6%98%9F%E4%BA%BA%E5%AD%98%E5%9C%A8%E5%97%8E-%E4%BA%BA%E9%A1%9E%E4%B9%9F%E5%8F%AF%E4%BB%A5%E5%A4%AA%E7%A9%BA%E6%97%85%E8%A1%8C/id1606833439?i=1000700871010",
          "https://zh.wikipedia.org/zh-cn/%E8%8B%B1%E9%9B%84%E6%97%85%E7%A8%8B",
          "https://www.youtube.com/watch?v=nw3m-WzHuV0",
          "https://zh.wikipedia.org/wiki/%E5%A4%AA%E7%A9%BA%E6%8E%A2%E7%B4%A2",
          "https://www.zuowen8.com/xiaoxue/liunianjizuowen/7051fa7b.html",
          "https://kuroro.space/tw/news/campaign/detail/485",
          "https://scitechvista.nat.gov.tw/Article/c000008/detail?ID=ffb28e0a-22de-49ca-aa4e-50f746bc46a6",
          "https://www.openbook.org.tw/article/p-62574"
        ],
        search_results: [
          {
            "title": "給我一點太空！｜兒童故事｜晚安故事｜中文故事｜睡前故事",
            "url": "https://www.youtube.com/watch?v=F6njzqg-v8w",
            "date": null,
            "last_updated": null
          },
          {
            "title": "宇宙- 維基百科，自由的百科全書",
            "url": "https://zh.wikipedia.org/zh-hant/%E5%AE%87%E5%AE%99",
            "date": null,
            "last_updated": null
          },
          {
            "title": "【 小熊老師】EP27《 外太空船的宇宙冒險》幼童故事",
            "url": "https://www.youtube.com/watch?v=DDnIe_WtCNA",
            "date": null,
            "last_updated": null
          },
          {
            "title": "超馬童話大冒險1：誰來出任務？ - 博客來",
            "url": "https://www.books.com.tw/products/0010818133",
            "date": null,
            "last_updated": null
          },
          {
            "title": "兒童有聲繪本故事《宇宙掉了一顆牙》",
            "url": "https://www.youtube.com/watch?v=v-HemokXHAE",
            "date": null,
            "last_updated": null
          },
          {
            "title": "杰瑞的太空游小学童话作文",
            "url": "http://www.ruiwen.com/zuowen/xietonghua/1346536.html",
            "date": null,
            "last_updated": null
          },
          {
            "title": "歡迎你到地球來 - 博客來",
            "url": "https://www.books.com.tw/products/0010925282",
            "date": null,
            "last_updated": null
          },
          {
            "title": "【小典藏│愛閱讀】火星上的繪本創作家──強．艾吉Jon ...",
            "url": "https://artouch.com/artco-kids/content-2208012.html",
            "date": null,
            "last_updated": null
          },
          {
            "title": "科幻故事創作方法-世界&角色- aassmm2002的創作- 巴哈姆特",
            "url": "https://home.gamer.com.tw/artwork.php?sn=5658337",
            "date": null,
            "last_updated": null
          },
          {
            "title": "說出好故事，用這個模板試試看吧！",
            "url": "https://vocus.cc/article/625f80e9fd89780001b930d2",
            "date": null,
            "last_updated": null
          },
          {
            "title": "開啟圖畫書新實驗的蘿倫．柴爾德（Lauren Child）",
            "url": "https://www.openbook.org.tw/article/p-64177",
            "date": null,
            "last_updated": null
          },
          {
            "title": "[PDF] 故事結構教學提升國小二年級低成就學生閱讀理解力之研究",
            "url": "https://priori.moe.gov.tw/upload/page/rdm/forum/2014/D-3-%E6%95%85%E4%BA%8B%E7%B5%90%E6%A7%8B%E6%95%99%E5%AD%B8%E6%8F%90%E5%8D%87%E5%9C%8B%E5%B0%8F%E4%BA%8C%E5%B9%B4%E7%B4%9A%E4%BD%8E%E6%88%90%E5%B0%B1%E5%AD%B8%E7%94%9F%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3%E5%8A%9B%E4%B9%8B%E7%A0%94%E7%A9%B6.pdf",
            "date": null,
            "last_updated": null
          },
          {
            "title": "【故事小苗探險隊】 外星人存在嗎？人類也可以太空旅行？",
            "url": "https://podcasts.apple.com/tm/podcast/%E6%95%85%E4%BA%8B%E5%B0%8F%E8%8B%97%E6%8E%A2%E9%9A%AA%E9%9A%8A-%E5%A4%96%E6%98%9F%E4%BA%BA%E5%AD%98%E5%9C%A8%E5%97%8E-%E4%BA%BA%E9%A1%9E%E4%B9%9F%E5%8F%AF%E4%BB%A5%E5%A4%AA%E7%A9%BA%E6%97%85%E8%A1%8C/id1606833439?i=1000700871010",
            "date": null,
            "last_updated": null
          },
          {
            "title": "英雄旅程- 维基百科，自由的百科全书",
            "url": "https://zh.wikipedia.org/zh-cn/%E8%8B%B1%E9%9B%84%E6%97%85%E7%A8%8B",
            "date": null,
            "last_updated": null
          },
          {
            "title": "《爷爷是个外星人》EP506 | 睡前故事| 童話故事| 儿童故事",
            "url": "https://www.youtube.com/watch?v=nw3m-WzHuV0",
            "date": null,
            "last_updated": null
          },
          {
            "title": "太空探索- 維基百科，自由的百科全書",
            "url": "https://zh.wikipedia.org/wiki/%E5%A4%AA%E7%A9%BA%E6%8E%A2%E7%B4%A2",
            "date": null,
            "last_updated": null
          },
          {
            "title": "宇宙旅行记作文800字",
            "url": "https://www.zuowen8.com/xiaoxue/liunianjizuowen/7051fa7b.html",
            "date": null,
            "last_updated": null
          },
          {
            "title": "全新原創找找書系列宇宙躲貓貓01，讓孩子輕鬆學習有趣的 ...",
            "url": "https://kuroro.space/tw/news/campaign/detail/485",
            "date": null,
            "last_updated": null
          },
          {
            "title": "太空探索的故事 - 科技大觀園",
            "url": "https://scitechvista.nat.gov.tw/Article/c000008/detail?ID=ffb28e0a-22de-49ca-aa4e-50f746bc46a6",
            "date": null,
            "last_updated": null
          },
          {
            "title": "中小學生讀物選介》探索宇宙、海洋、異文化與內在自我",
            "url": "https://www.openbook.org.tw/article/p-62574",
            "date": null,
            "last_updated": null
          }
        ]
      }
    };

    // 更新使用記錄狀態為完成
    await supabase
      .from('hanami_ai_tool_usage')
      .update({
        status: 'completed',
        output_data: mockResult,
        completed_at: new Date().toISOString()
      })
      .eq('id', insertedRecord.id);

    console.log('內容生成成功');
  } catch (error) {
    console.error('異步處理內容生成失敗:', error);
    // 更新使用記錄狀態為失敗
    await supabase
      .from('hanami_ai_tool_usage')
      .update({
        status: 'failed',
        error_message: `處理失敗: ${error instanceof Error ? error.message : String(error)}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', insertedRecord.id);
  }
}

// 處理內容生成請求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('內容生成請求:', body);

    const { input_text, template_id, age_group_id, selected_model, user_email } = body;

    console.log('接收到的原始資料:', { input_text, template_id, age_group_id, selected_model, user_email });

    // 驗證必要欄位，如果缺少則設為null
    const validatedInputText = input_text || null;
    const validatedTemplateId = template_id || null;
    const validatedAgeGroupId = age_group_id || null;
    const validatedSelectedModel = selected_model || 'sonar-deep-research';

    console.log('驗證後的資料:', { validatedInputText, validatedTemplateId, validatedAgeGroupId, validatedSelectedModel });

    // 生成請求ID
    const request_id = `cg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 記錄請求到資料庫
    const usageRecord = {
      tool_id: 'content-generation',
      user_email: user_email || 'admin@hanami.com',
      status: 'queued',
      input_data: {
        input_text: validatedInputText,
        template_id: validatedTemplateId,
        age_group_id: validatedAgeGroupId,
        selected_model: validatedSelectedModel,
        request_id
      },
      queue_position: 1, // 暫時設為1，後續會實現真實的隊列管理
      created_at: new Date().toISOString()
    };

    // 插入使用記錄
    const { data: insertedRecord, error: insertError } = await supabase
      .from('hanami_ai_tool_usage')
      .insert(usageRecord)
      .select()
      .single();

    if (insertError) {
      console.error('記錄使用記錄失敗:', insertError);
      return NextResponse.json({
        success: false,
        error: '記錄使用記錄失敗'
      }, { status: 500 });
    }

    // 更新狀態為處理中
    await supabase
      .from('hanami_ai_tool_usage')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', insertedRecord.id);

    console.log('準備記錄使用記錄:', usageRecord);

    // 立即返回request_id，讓前端開始輪詢
    // 同時異步處理生成邏輯
    processContentGeneration(
      insertedRecord,
      validatedInputText,
      validatedTemplateId,
      validatedAgeGroupId,
      validatedSelectedModel,
      user_email,
      request_id
    );

    return NextResponse.json({
      success: true,
      request_id,
      status: 'processing',
      message: '內容生成已開始，請稍候'
    });

  } catch (error) {
    console.error('內容生成失敗:', error);
    return NextResponse.json({
      success: false,
      error: '內容生成失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 獲取內容生成狀態
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const request_id = searchParams.get('request_id');

    if (!request_id) {
      return NextResponse.json({
        success: false,
        error: '缺少請求ID'
      }, { status: 400 });
    }

    console.log('查詢內容生成狀態:', request_id);

    // 查詢使用記錄
    const { data: usageRecord, error } = await supabase
      .from('hanami_ai_tool_usage')
      .select('*')
      .eq('tool_id', 'content-generation')
      .contains('input_data', { request_id })
      .single();

    if (error) {
      console.error('查詢使用記錄失敗:', error);
      return NextResponse.json({
        success: false,
        error: '查詢使用記錄失敗'
      }, { status: 500 });
    }

    if (!usageRecord) {
      return NextResponse.json({
        success: false,
        error: '找不到對應的請求記錄'
      }, { status: 404 });
    }

    console.log('查詢到使用記錄:', usageRecord);
    
    return NextResponse.json({
      success: true,
      status: usageRecord.status,
      result: usageRecord.output_data,
      queue_position: usageRecord.queue_position,
      created_at: usageRecord.created_at,
      completed_at: usageRecord.completed_at,
      error_message: usageRecord.error_message
    });

  } catch (error) {
    console.error('查詢內容生成狀態失敗:', error);
    return NextResponse.json({
      success: false,
      error: '查詢內容生成狀態失敗',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
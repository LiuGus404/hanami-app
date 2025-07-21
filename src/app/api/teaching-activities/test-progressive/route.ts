import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 逐步測試插入
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到的原始資料:', body);
    
    // 步驟 1: 基本欄位（已知可用）
    const step1Data = {
      activity_name: String(body.activity_name || body.title || '測試活動'),
      activity_description: String(body.activity_description || body.description || '測試活動描述'),
      activity_type: String(body.activity_type || 'game'),
      difficulty_level: 1,
      duration_minutes: 30,
      materials_needed: [],
      target_abilities: [],
      instructions: '測試指令',
      notes: '測試備註',
      status: 'draft',
      tags: [],
      category: '測試分類',
      is_active: true,
    };
    
    console.log('步驟 1 - 基本欄位:', step1Data);
    
    // 步驟 2: 添加文字欄位
    const step2Data = {
      ...step1Data,
      instructions: body.instructions || '測試指令',
      notes: body.notes || '測試備註',
      status: String(body.status || 'draft'),
      category: body.category || '測試分類',
    };
    
    console.log('步驟 2 - 添加文字欄位:', step2Data);
    
    // 步驟 3: 添加陣列欄位
    const step3Data = {
      ...step2Data,
      tags: Array.isArray(body.tags) ? body.tags : [],
    };
    
    console.log('步驟 3 - 添加陣列欄位:', step3Data);
    
    // 步驟 4: 添加 UUID 欄位
    const step4Data = {
      ...step3Data,
      template_id: (body.template_id && typeof body.template_id === 'string' && body.template_id.trim().length > 0) ? body.template_id : null,
    };
    
    console.log('步驟 4 - 添加 UUID 欄位:', step4Data);
    
    // 步驟 5: 添加 JSONB 欄位
    const step5Data = {
      ...step4Data,
      custom_fields: body.custom_fields || null,
    };
    
    console.log('步驟 5 - 添加 JSONB 欄位:', step5Data);
    
    // 逐步測試
    let testData = step1Data;
    const step = 1;
    
    // 根據請求參數決定測試哪一步
    const testStep = body.test_step || 5;
    
    switch (testStep) {
      case 1:
        testData = step1Data;
        break;
      case 2:
        testData = step2Data;
        break;
      case 3:
        testData = step3Data;
        break;
      case 4:
        testData = step4Data;
        break;
      case 5:
        testData = step5Data;
        break;
      default:
        testData = step5Data;
    }
    
    console.log(`測試步驟 ${testStep}:`, testData);
    
    // 驗證資料類型
    Object.keys(testData).forEach(key => {
      console.log(`${key}: ${typeof (testData as Record<string, any>)[key]} = ${JSON.stringify((testData as Record<string, any>)[key])}`);
    });
    
    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error(`步驟 ${testStep} 失敗:`, error);
      return NextResponse.json({ 
        error: error.message, 
        details: error, 
        step: testStep,
        testData, 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data, 
      step: testStep,
      message: `步驟 ${testStep} 成功`,
    });
    
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 
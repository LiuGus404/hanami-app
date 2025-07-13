import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 獲取所有教學活動
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 轉換資料格式以向後兼容
    const transformedData = data?.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      activity_type: activity.activity_type,
      difficulty_level: activity.difficulty_level,
      duration: activity.duration,
      estimated_duration: activity.duration, // 向後兼容
      materials: activity.materials,
      // materials_needed: activity.materials, // 向後兼容（移除重複）
      objectives: activity.objectives,
      instructions: activity.instructions,
      notes: activity.notes,
      template_id: activity.template_id,
      custom_fields: activity.custom_fields,
      status: activity.status,
      tags: activity.tags,
      category: activity.category,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      // 保留原始資料庫欄位
      activity_name: activity.title,
      activity_description: activity.description,
      duration_minutes: activity.duration,
      target_abilities: activity.objectives,
      materials_needed: activity.materials,
    })) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('獲取教學活動失敗:', error);
    return NextResponse.json(
      { error: '獲取教學活動失敗' },
      { status: 500 },
    );
  }
}

// 遞迴移除指定 key
function deepOmit(obj: any, keyToOmit: string): any {
  if (Array.isArray(obj)) {
    return obj.map(item => deepOmit(item, keyToOmit));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      if (key !== keyToOmit) {
        newObj[key] = deepOmit(obj[key], keyToOmit);
      }
    }
    return newObj;
  }
  return obj;
}

// 創建新教學活動
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到的原始 body:', JSON.stringify(body, null, 2));
    
    // 準備插入資料，使用正確的資料庫欄位名稱
    const insertData: any = {};
    
    // 安全地設置每個欄位，並記錄類型
    try {
      insertData.activity_name = String(body.title || body.activity_name || '');
      insertData.activity_description = body.description || body.activity_description || null;
      insertData.activity_type = String(body.activity_type || '');
      
      // 數字欄位的安全轉換
      const difficultyLevel = body.difficulty_level;
      insertData.difficulty_level = Number.isInteger(difficultyLevel) ? difficultyLevel : 
        Number.isInteger(parseInt(difficultyLevel)) ? parseInt(difficultyLevel) : 1;
      
      const duration = body.duration_minutes || body.duration || body.estimated_duration;
      insertData.duration_minutes = Number.isInteger(duration) ? duration : 
        Number.isInteger(parseInt(duration)) ? parseInt(duration) : 30;
      
      const estimatedDuration = body.estimated_duration || body.duration_minutes || body.duration;
      insertData.estimated_duration = Number.isInteger(estimatedDuration) ? estimatedDuration : 
        Number.isInteger(parseInt(estimatedDuration)) ? parseInt(estimatedDuration) : 30;
      
      const ageMin = body.age_range_min;
      insertData.age_range_min = Number.isInteger(ageMin) ? ageMin : 
        Number.isInteger(parseInt(ageMin)) ? parseInt(ageMin) : 3;
      
      const ageMax = body.age_range_max;
      insertData.age_range_max = Number.isInteger(ageMax) ? ageMax : 
        Number.isInteger(parseInt(ageMax)) ? parseInt(ageMax) : 12;
      
      // 陣列欄位
      insertData.materials_needed = Array.isArray(body.materials) ? body.materials : 
        Array.isArray(body.materials_needed) ? body.materials_needed : [];
      insertData.target_abilities = Array.isArray(body.target_abilities) ? body.target_abilities : 
        Array.isArray(body.objectives) ? body.objectives : [];
      insertData.tags = Array.isArray(body.tags) ? body.tags : [];
      
      // 文字欄位
      insertData.instructions = body.instructions || null;
      insertData.notes = body.notes || null;
      insertData.status = String(body.status || 'draft');
      insertData.category = body.category || null;
      
      // UUID 欄位
      insertData.template_id = (body.template_id && typeof body.template_id === 'string' && body.template_id.trim().length > 0) ? body.template_id : null;
      
      // JSONB 欄位
      insertData.custom_fields = body.custom_fields || null;
      
      // 布林欄位
      insertData.is_active = true;
      
    } catch (fieldError) {
      console.error('欄位處理錯誤:', fieldError);
      throw new Error(`欄位處理失敗: ${fieldError instanceof Error ? fieldError.message : String(fieldError)}`);
    }

    console.log('API 最終插入資料:', insertData);

    // 驗證資料類型
    console.log('資料類型檢查:');
    Object.keys(insertData).forEach(key => {
      console.log(`- ${key}: ${typeof insertData[key]} = ${JSON.stringify(insertData[key])}`);
    });

    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase 錯誤詳細:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('創建教學活動失敗:', error);
    return NextResponse.json(
      { error: '創建教學活動失敗', details: error },
      { status: 500 },
    );
  }
} 
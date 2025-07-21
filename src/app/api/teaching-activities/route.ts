import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 獲取所有教學活動
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('獲取教學活動失敗:', error);
      throw error;
    }

    return NextResponse.json(data);
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
    
    // 首先檢查表是否存在
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_teaching_activities')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('資料庫表檢查失敗:', tableError);
        return NextResponse.json(
          { error: '資料庫表不存在或無法訪問', details: tableError },
          { status: 500 },
        );
      }
      
      console.log('資料庫表檢查成功');
    } catch (checkError) {
      console.error('資料庫連接檢查失敗:', checkError);
      return NextResponse.json(
        { error: '資料庫連接失敗', details: checkError },
        { status: 500 },
      );
    }
    
    // 準備插入資料，使用正確的資料庫欄位名稱
    const insertData: any = {};
    
    // 安全地設置每個欄位，並記錄類型
    try {
      // 必填欄位，確保有預設值
      insertData.activity_name = String(body.activity_name || body.title || '未命名活動');
      insertData.activity_description = String(body.activity_description || body.description || '');
      insertData.activity_type = String(body.activity_type || 'general');
      
      // 數字欄位的安全轉換
      const difficultyLevel = body.difficulty_level;
      insertData.difficulty_level = Number.isInteger(difficultyLevel) ? difficultyLevel : 
        Number.isInteger(parseInt(difficultyLevel)) ? parseInt(difficultyLevel) : 1;
      
      const duration = body.duration_minutes || body.duration || body.estimated_duration;
      insertData.duration_minutes = Number.isInteger(duration) ? duration : 
        Number.isInteger(parseInt(duration)) ? parseInt(duration) : 30;
      
      // 陣列欄位 - 確保是陣列且不為空
      insertData.materials_needed = Array.isArray(body.materials_needed) ? body.materials_needed : 
        Array.isArray(body.materials) ? body.materials : 
        (body.materials_needed ? [body.materials_needed] : []);
      
      insertData.target_abilities = Array.isArray(body.target_abilities) ? body.target_abilities : 
        Array.isArray(body.objectives) ? body.objectives : 
        (body.target_abilities ? [body.target_abilities] : []);
      
      insertData.tags = Array.isArray(body.tags) ? body.tags : [];
      
      // 文字欄位 - 確保有預設值
      insertData.instructions = String(body.instructions || '');
      insertData.notes = String(body.notes || '');
      insertData.status = String(body.status || 'draft');
      insertData.category = String(body.category || '');
      
      // UUID 欄位
      insertData.template_id = (body.template_id && typeof body.template_id === 'string' && body.template_id.trim().length > 0) ? body.template_id : null;
      
      // JSONB 欄位
      insertData.custom_fields = body.custom_fields || null;
      
      // 其他欄位
      insertData.is_active = body.is_active !== undefined ? Boolean(body.is_active) : true;
      insertData.estimated_duration = Number.isInteger(body.estimated_duration) ? body.estimated_duration : 
        Number.isInteger(parseInt(body.estimated_duration)) ? parseInt(body.estimated_duration) : 0;
      
      // 移除不需要的欄位
      delete insertData.created_at;
      delete insertData.updated_at;
      
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
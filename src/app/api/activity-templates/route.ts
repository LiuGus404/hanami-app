import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 獲取所有範本
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    let query = supabase
      .from('hanami_resource_templates')
      .select('*');
    
    // 如果提供了 orgId，根據 org_id 過濾
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // 轉換資料結構以向後兼容
    const transformedData = data?.map(template => {
      let fields = [];
      if (Array.isArray(template.template_schema)) {
        fields = template.template_schema;
      } else if ((template.template_schema as any)?.fields) {
        fields = (template.template_schema as any).fields;
      }
      return {
        id: template.id,
        name: template.template_name,
        description: template.template_description,
        fields,
        category: template.template_type,
        tags: [],
        created_at: template.created_at,
        updated_at: template.updated_at,
        // 保留原始資料
        template_name: template.template_name,
        template_description: template.template_description,
        template_schema: { fields },
        template_type: template.template_type,
        is_active: template.is_active,
      };
    }) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('獲取範本失敗:', error);
    return NextResponse.json(
      { error: '獲取範本失敗' },
      { status: 500 },
    );
  }
}

// 創建新範本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到的範本資料:', JSON.stringify(body, null, 2));
    
    // 首先檢查表是否存在
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_resource_templates')
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
    
    try {
      // 必填欄位
      insertData.template_name = String(body.template_name || body.name || '未命名範本');
      insertData.template_type = String(body.template_type || body.template_category || body.type || body.category || 'custom');
      insertData.template_description = String(body.template_description || body.description || '');
      
      // 處理 template_schema
      if (body.template_schema) {
        insertData.template_schema = body.template_schema;
      } else if (body.fields) {
        // 如果沒有 template_schema 但有 fields，創建 schema
        insertData.template_schema = {
          fields: Array.isArray(body.fields) ? body.fields : [],
          metadata: {
            version: "1.0",
            author: "Hanami System",
            last_updated: new Date().toISOString()
          }
        };
      } else {
        // 預設 schema
        insertData.template_schema = {
          fields: [],
          metadata: {
            version: "1.0",
            author: "Hanami System",
            last_updated: new Date().toISOString()
          }
        };
      }
      
      // 可選欄位
      insertData.template_icon = String(body.template_icon || '📄');
      insertData.template_color = String(body.template_color || '#3B82F6');
      insertData.is_active = body.is_active !== undefined ? Boolean(body.is_active) : true;
      insertData.is_public = body.is_public !== undefined ? Boolean(body.is_public) : false;
      insertData.created_by = (body.created_by && typeof body.created_by === 'string' && body.created_by.trim().length > 0) ? body.created_by : null;
      
      // 如果提供了 org_id，設置它
      if (body.org_id) {
        insertData.org_id = body.org_id;
      }
      
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
      .from('hanami_resource_templates')
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
    console.error('創建範本失敗:', error);
    return NextResponse.json(
      { error: '創建範本失敗', details: error },
      { status: 500 },
    );
  }
} 
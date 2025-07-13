import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 獲取所有範本
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hanami_resource_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 轉換資料結構以向後兼容
    const transformedData = data?.map(template => {
      let fields = [];
      if (Array.isArray(template.template_schema)) {
        fields = template.template_schema;
      } else if (template.template_schema?.fields) {
        fields = template.template_schema.fields;
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
    
    // 優先使用新的資料庫格式，如果沒有則使用舊格式
    const templateName = body.template_name || body.name;
    const templateDescription = body.template_description || body.description;
    const templateSchema = body.template_schema || { fields: body.fields || [] };
    const templateType = body.template_type || body.type || body.category || 'custom';
    
    const { data, error } = await supabase
      .from('hanami_resource_templates')
      .insert({
        template_name: templateName,
        template_description: templateDescription,
        template_schema: templateSchema,
        template_type: templateType,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('創建範本失敗:', error);
    return NextResponse.json(
      { error: '創建範本失敗' },
      { status: 500 },
    );
  }
} 
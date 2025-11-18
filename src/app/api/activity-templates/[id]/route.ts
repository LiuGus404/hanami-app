import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 獲取單個範本
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { data, error } = await supabase
      .from('hanami_resource_templates')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    // 轉換資料結構以向後兼容
    const transformedData = {
      id: data.id,
      name: data.template_name,
      description: data.template_description,
      fields: (data.template_schema as any)?.fields || [],
      category: data.template_type,
      tags: [],
      created_at: data.created_at,
      updated_at: data.updated_at,
      // 保留原始資料
      template_name: data.template_name,
      template_description: data.template_description,
      template_schema: data.template_schema,
      template_type: data.template_type,
      is_active: data.is_active,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('獲取範本失敗:', error);
    return NextResponse.json(
      { error: '獲取範本失敗' },
      { status: 500 },
    );
  }
}

// 更新範本
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    
    // 先獲取現有的範本資料，以保留所有現有內容
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('hanami_resource_templates')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingTemplate) {
      return NextResponse.json(
        { error: '範本不存在' },
        { status: 404 },
      );
    }

    // 準備更新資料，保留現有內容
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // 處理 template_name
    if (body.template_name !== undefined) {
      updateData.template_name = String(body.template_name);
    } else if (body.name !== undefined) {
      updateData.template_name = String(body.name);
    }

    // 處理 template_description
    if (body.template_description !== undefined) {
      updateData.template_description = String(body.template_description);
    } else if (body.description !== undefined) {
      updateData.template_description = String(body.description);
    }

    // 處理 template_type
    if (body.template_type !== undefined) {
      updateData.template_type = String(body.template_type);
    } else if (body.type !== undefined || body.category !== undefined) {
      updateData.template_type = String(body.type || body.category || 'custom');
    }

    // 處理 template_schema - 這是關鍵部分，要保留現有結構
    if (body.template_schema) {
      // 如果提供了完整的 template_schema，使用它
      updateData.template_schema = body.template_schema;
    } else if (body.fields) {
      // 如果只提供了 fields，合併到現有的 template_schema 中
      const existingSchema = existingTemplate.template_schema || {};
      updateData.template_schema = {
        ...existingSchema,
        fields: Array.isArray(body.fields) ? body.fields : [],
        metadata: {
          ...(existingSchema.metadata || {}),
          version: existingSchema.metadata?.version || "1.0",
          last_updated: new Date().toISOString(),
        },
      };
    }
    // 如果沒有提供 template_schema 或 fields，保留現有的

    // 處理 is_active
    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    // 處理 org_id（如果提供）
    if (body.org_id !== undefined) {
      updateData.org_id = body.org_id;
    }

    // 執行更新
    const { data, error } = await supabase
      .from('hanami_resource_templates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('更新範本失敗:', error);
    return NextResponse.json(
      { error: '更新範本失敗', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

// 刪除範本
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error } = await supabase
      .from('hanami_resource_templates')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除範本失敗:', error);
    return NextResponse.json(
      { error: '刪除範本失敗' },
      { status: 500 },
    );
  }
} 
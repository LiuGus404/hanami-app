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
      fields: data.template_schema?.fields || [],
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
    
    const { data, error } = await supabase
      .from('hanami_resource_templates')
      .update({
        template_name: body.name,
        template_description: body.description,
        template_schema: body.fields,
        template_type: body.type || 'custom',
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('更新範本失敗:', error);
    return NextResponse.json(
      { error: '更新範本失敗' },
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
import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 獲取單個教學活動
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('獲取教學活動失敗:', error);
    return NextResponse.json(
      { error: '獲取教學活動失敗' },
      { status: 500 },
    );
  }
}

// 更新教學活動
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    
    // 準備更新資料，使用正確的資料庫欄位名稱
    const updateData: any = {
      activity_name: body.title || body.activity_name,
      activity_description: body.description || body.activity_description,
      activity_type: body.activity_type,
      difficulty_level: parseInt(body.difficulty_level) || 1,
      duration_minutes: parseInt(body.duration) || parseInt(body.estimated_duration) || 0,
      estimated_duration: parseInt(body.estimated_duration) || parseInt(body.duration) || 0,
      materials_needed: body.materials || body.materials_needed,
      target_abilities: body.objectives,
      instructions: body.instructions,
      notes: body.notes,
      template_id: body.template_id,
      custom_fields: body.custom_fields,
      status: body.status,
      tags: body.tags,
      category: body.category,
      updated_at: new Date().toISOString(),
    };

    // 移除 undefined 值
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('更新資料:', updateData);

    const { data, error } = await (supabase as any)
      .from('hanami_teaching_activities')
      .update(updateData as any)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase 錯誤:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('更新教學活動失敗:', error);
    return NextResponse.json(
      { error: '更新教學活動失敗', details: error },
      { status: 500 },
    );
  }
}

// 刪除教學活動
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error } = await supabase
      .from('hanami_teaching_activities')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除教學活動失敗:', error);
    return NextResponse.json(
      { error: '刪除教學活動失敗' },
      { status: 500 },
    );
  }
} 
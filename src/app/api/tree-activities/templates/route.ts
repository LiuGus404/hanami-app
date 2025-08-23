import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  TreeActivityTemplate,
  ACTIVITY_TYPES,
  DIFFICULTY_LEVELS 
} from '@/types/progress';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 獲取活動模板列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityType = searchParams.get('activity_type');
    const difficultyLevel = searchParams.get('difficulty_level');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('hanami_tree_activity_templates')
      .select('*')
      .order('template_name', { ascending: true });

    // 應用篩選器
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }
    if (difficultyLevel) {
      query = query.eq('difficulty_level', parseInt(difficultyLevel));
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('獲取活動模板失敗:', error);
      return NextResponse.json(
        { error: '獲取活動模板失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('獲取活動模板時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取活動模板時發生錯誤' },
      { status: 500 }
    );
  }
}

// POST: 創建新的活動模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 驗證必填欄位
    if (!body.template_name || !body.activity_type || !body.difficulty_level) {
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['template_name', 'activity_type', 'difficulty_level'] },
        { status: 400 }
      );
    }

    // 驗證活動類型
    if (!Object.values(ACTIVITY_TYPES).includes(body.activity_type)) {
      return NextResponse.json(
        { error: '無效的活動類型', valid_types: Object.values(ACTIVITY_TYPES) },
        { status: 400 }
      );
    }

    // 驗證難度等級
    if (body.difficulty_level < 1 || body.difficulty_level > 5) {
      return NextResponse.json(
        { error: '難度等級必須在1-5之間' },
        { status: 400 }
      );
    }

    // 檢查模板名稱是否已存在
    const { data: existingTemplate, error: checkError } = await supabase
      .from('hanami_tree_activity_templates')
      .select('template_name')
      .eq('template_name', body.template_name)
      .single();

    if (existingTemplate) {
      return NextResponse.json(
        { error: '模板名稱已存在' },
        { status: 409 }
      );
    }

    // 準備插入資料
    const templateData = {
      template_name: body.template_name,
      template_description: body.template_description || null,
      activity_type: body.activity_type,
      difficulty_level: body.difficulty_level,
      estimated_duration: body.estimated_duration || null,
      materials_needed: body.materials_needed || [],
      instructions: body.instructions || null,
      learning_objectives: body.learning_objectives || [],
      target_abilities: body.target_abilities || [],
      prerequisites: body.prerequisites || [],
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_by: body.created_by || null
    };

    const { data, error } = await supabase
      .from('hanami_tree_activity_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('創建活動模板失敗:', error);
      return NextResponse.json(
        { error: '創建活動模板失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '活動模板創建成功'
    }, { status: 201 });

  } catch (error) {
    console.error('創建活動模板時發生錯誤:', error);
    return NextResponse.json(
      { error: '創建活動模板時發生錯誤' },
      { status: 500 }
    );
  }
}

// PUT: 更新活動模板
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: '請提供模板ID' },
        { status: 400 }
      );
    }

    // 驗證更新資料
    if (updates.activity_type && !Object.values(ACTIVITY_TYPES).includes(updates.activity_type)) {
      return NextResponse.json(
        { error: '無效的活動類型', valid_types: Object.values(ACTIVITY_TYPES) },
        { status: 400 }
      );
    }

    if (updates.difficulty_level && (updates.difficulty_level < 1 || updates.difficulty_level > 5)) {
      return NextResponse.json(
        { error: '難度等級必須在1-5之間' },
        { status: 400 }
      );
    }

    // 檢查模板是否存在
    const { data: templateExists, error: checkError } = await supabase
      .from('hanami_tree_activity_templates')
      .select('id, template_name')
      .eq('id', id)
      .single();

    if (checkError || !templateExists) {
      return NextResponse.json(
        { error: '指定的模板不存在' },
        { status: 404 }
      );
    }

    // 如果更新模板名稱，檢查是否與其他模板重複
    if (updates.template_name && updates.template_name !== templateExists.template_name) {
      const { data: nameExists, error: nameCheckError } = await supabase
        .from('hanami_tree_activity_templates')
        .select('template_name')
        .eq('template_name', updates.template_name)
        .neq('id', id)
        .single();

      if (nameExists) {
        return NextResponse.json(
          { error: '模板名稱已存在' },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('hanami_tree_activity_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新活動模板失敗:', error);
      return NextResponse.json(
        { error: '更新活動模板失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '活動模板更新成功'
    });

  } catch (error) {
    console.error('更新活動模板時發生錯誤:', error);
    return NextResponse.json(
      { error: '更新活動模板時發生錯誤' },
      { status: 500 }
    );
  }
}

// DELETE: 刪除活動模板
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '請提供模板ID' },
        { status: 400 }
      );
    }

    // 檢查模板是否存在
    const { data: templateExists, error: checkError } = await supabase
      .from('hanami_tree_activity_templates')
      .select('id, template_name')
      .eq('id', id)
      .single();

    if (checkError || !templateExists) {
      return NextResponse.json(
        { error: '指定的模板不存在' },
        { status: 404 }
      );
    }

    // 軟刪除（設置為非活躍）
    const { error } = await supabase
      .from('hanami_tree_activity_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('刪除活動模板失敗:', error);
      return NextResponse.json(
        { error: '刪除活動模板失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `模板 "${templateExists.template_name}" 已成功刪除`
    });

  } catch (error) {
    console.error('刪除活動模板時發生錯誤:', error);
    return NextResponse.json(
      { error: '刪除活動模板時發生錯誤' },
      { status: 500 }
    );
  }
} 
 
 
 
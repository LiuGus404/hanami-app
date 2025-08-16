import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  TreeActivity, 
  CreateTreeActivityRequest, 
  UpdateTreeActivityRequest,
  ACTIVITY_TYPES,
  DIFFICULTY_LEVELS 
} from '@/types/progress';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 獲取成長樹活動列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get('tree_id');
    const activityType = searchParams.get('activity_type');
    const difficultyLevel = searchParams.get('difficulty_level');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('hanami_tree_activities')
      .select('*')
      .order('activity_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 應用篩選器
    if (treeId) {
      query = query.eq('tree_id', treeId);
    }
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
      console.error('獲取成長樹活動失敗:', error);
      return NextResponse.json(
        { error: '獲取成長樹活動失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('獲取成長樹活動時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取成長樹活動時發生錯誤' },
      { status: 500 }
    );
  }
}

// POST: 創建新的成長樹活動
export async function POST(request: NextRequest) {
  try {
    const body: CreateTreeActivityRequest = await request.json();

    // 驗證必填欄位
    if (!body.tree_id || !body.activity_name || !body.activity_type || !body.difficulty_level) {
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['tree_id', 'activity_name', 'activity_type', 'difficulty_level'] },
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

    // 檢查成長樹是否存在
    const { data: treeExists, error: treeError } = await supabase
      .from('hanami_growth_trees')
      .select('id')
      .eq('id', body.tree_id)
      .single();

    if (treeError || !treeExists) {
      return NextResponse.json(
        { error: '指定的成長樹不存在' },
        { status: 404 }
      );
    }

    // 準備插入資料
    const activityData = {
      tree_id: body.tree_id,
      activity_name: body.activity_name,
      activity_description: body.activity_description || null,
      activity_type: body.activity_type,
      difficulty_level: body.difficulty_level,
      estimated_duration: body.estimated_duration || null,
      materials_needed: body.materials_needed || [],
      instructions: body.instructions || null,
      learning_objectives: body.learning_objectives || [],
      target_abilities: body.target_abilities || [],
      prerequisites: body.prerequisites || [],
      activity_order: body.activity_order || 0,
      is_required: body.is_required || false,
      is_active: true,
      created_by: body.created_by || null
    };

    const { data, error } = await supabase
      .from('hanami_tree_activities')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error('創建成長樹活動失敗:', error);
      return NextResponse.json(
        { error: '創建成長樹活動失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '成長樹活動創建成功'
    }, { status: 201 });

  } catch (error) {
    console.error('創建成長樹活動時發生錯誤:', error);
    return NextResponse.json(
      { error: '創建成長樹活動時發生錯誤' },
      { status: 500 }
    );
  }
}

// PUT: 批量更新成長樹活動
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { activities } = body; // 預期格式: { activities: [{ id, updates }] }

    if (!Array.isArray(activities)) {
      return NextResponse.json(
        { error: '請提供活動更新陣列' },
        { status: 400 }
      );
    }

    const updatePromises = activities.map(async ({ id, updates }: { id: string; updates: UpdateTreeActivityRequest }) => {
      // 驗證更新資料
      if (updates.activity_type && !Object.values(ACTIVITY_TYPES).includes(updates.activity_type)) {
        throw new Error(`活動 ${id}: 無效的活動類型`);
      }

      if (updates.difficulty_level && (updates.difficulty_level < 1 || updates.difficulty_level > 5)) {
        throw new Error(`活動 ${id}: 難度等級必須在1-5之間`);
      }

      const { data, error } = await supabase
        .from('hanami_tree_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`活動 ${id}: ${error.message}`);
      }

      return data;
    });

    const results = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功更新 ${results.length} 個活動`
    });

  } catch (error) {
    console.error('批量更新成長樹活動失敗:', error);
    return NextResponse.json(
      { error: '批量更新成長樹活動失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// DELETE: 刪除成長樹活動
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '請提供活動ID' },
        { status: 400 }
      );
    }

    // 檢查活動是否存在
    const { data: activityExists, error: checkError } = await supabase
      .from('hanami_tree_activities')
      .select('id, activity_name')
      .eq('id', id)
      .single();

    if (checkError || !activityExists) {
      return NextResponse.json(
        { error: '指定的活動不存在' },
        { status: 404 }
      );
    }

    // 軟刪除（設置為非活躍）
    const { error } = await supabase
      .from('hanami_tree_activities')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('刪除成長樹活動失敗:', error);
      return NextResponse.json(
        { error: '刪除成長樹活動失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `活動 "${activityExists.activity_name}" 已成功刪除`
    });

  } catch (error) {
    console.error('刪除成長樹活動時發生錯誤:', error);
    return NextResponse.json(
      { error: '刪除成長樹活動時發生錯誤' },
      { status: 500 }
    );
  }
} 
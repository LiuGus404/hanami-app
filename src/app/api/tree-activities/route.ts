import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  TreeActivity, 
  CreateTreeActivityRequest, 
  UpdateTreeActivityRequest,
  ACTIVITY_TYPES,
  DIFFICULTY_LEVELS 
} from '@/types/progress';

export async function GET(request: NextRequest) {
  try {
    console.log('開始查詢 hanami_tree_activities 表...');
    
    const { data: activitiesData, error: activitiesQueryError } = await supabase
      .from('hanami_tree_activities' as any)
      .select(`
        id,
        tree_id,
        activity_id,
        activity_source,
        custom_activity_name,
        custom_activity_description,
        activity_type,
        difficulty_level,
        estimated_duration,
        priority_order,
        activity_order,
        is_required,
        is_active
      `)
      .eq('is_active', true)
      .order('priority_order', { ascending: true })
      .order('activity_order', { ascending: true });

    console.log('查詢結果:', { data: activitiesData?.length, error: activitiesQueryError });

    if (activitiesQueryError) {
      console.error('獲取成長樹活動失敗:', activitiesQueryError);
      return NextResponse.json(
        { error: '獲取成長樹活動失敗', details: activitiesQueryError.message },
        { status: 500 }
      );
    }

    const treeActivities = activitiesData || [];
    console.log(`成功獲取 ${treeActivities.length} 條成長樹活動`);

    return NextResponse.json({
      success: true,
      data: treeActivities
    });

  } catch (error) {
    console.error('獲取成長樹活動失敗:', error);
    return NextResponse.json(
      { error: '獲取成長樹活動失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// POST: 創建新的成長樹活動
export async function POST(request: NextRequest) {
  try {
    const body: CreateTreeActivityRequest = await request.json();

    // 驗證必填欄位
    if (!body.tree_id) {
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['tree_id'] },
        { status: 400 }
      );
    }

    // 根據活動來源驗證不同的必填欄位
    if (body.activity_source === 'teaching') {
      if (!body.activity_id) {
        return NextResponse.json(
          { error: '教學活動必須提供 activity_id' },
          { status: 400 }
        );
      }
    } else if (body.activity_source === 'custom') {
      if (!body.activity_name || !body.activity_type || !body.difficulty_level) {
        return NextResponse.json(
          { error: '自訂活動必須提供 activity_name, activity_type, difficulty_level' },
          { status: 400 }
        );
      }
      
      // 只有自訂活動才需要驗證活動類型和難度等級
      if (!Object.values(ACTIVITY_TYPES).includes(body.activity_type)) {
        return NextResponse.json(
          { error: '無效的活動類型', valid_types: Object.values(ACTIVITY_TYPES) },
          { status: 400 }
        );
      }

      if (body.difficulty_level < 1 || body.difficulty_level > 5) {
        return NextResponse.json(
          { error: '難度等級必須在1-5之間' },
          { status: 400 }
        );
      }
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
    const activityData: any = {
      tree_id: body.tree_id,
      activity_source: body.activity_source || 'custom',
      priority_order: body.priority_order || 1,
      activity_order: body.activity_order || 0,
      is_required: body.is_required || false,
      is_active: true,
      created_by: body.created_by || null
    };

    // 根據活動來源添加不同的欄位
    if (body.activity_source === 'teaching') {
      // 教學活動：只保存關聯信息
      activityData.activity_id = body.activity_id;
    } else if (body.activity_source === 'custom') {
      // 自訂活動：保存所有詳細資料
      activityData.custom_activity_name = body.activity_name;
      activityData.custom_activity_description = body.activity_description;
      activityData.activity_type = body.activity_type;
      activityData.difficulty_level = body.difficulty_level;
      activityData.estimated_duration = body.estimated_duration || null;
      activityData.materials_needed = body.materials_needed || [];
      activityData.instructions = body.instructions || null;
      activityData.learning_objectives = body.learning_objectives || [];
      activityData.target_abilities = body.target_abilities || [];
      activityData.prerequisites = body.prerequisites || [];
    }

    const { data, error } = await supabase
      .from('hanami_tree_activities' as any)
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

      const { data, error } = await (supabase
        .from('hanami_tree_activities') as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
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

    console.log('DELETE 請求 - 活動ID:', id);

    if (!id) {
      return NextResponse.json(
        { error: '請提供活動ID' },
        { status: 400 }
      );
    }

    // 檢查活動是否存在
    const { data: activityExists, error: checkError } = await supabase
      .from('hanami_tree_activities' as any)
      .select('id, activity_source, activity_id, custom_activity_name')
      .eq('id', id)
      .single();

    console.log('檢查活動結果:', { activityExists, checkError });

    if (checkError || !activityExists) {
      return NextResponse.json(
        { error: '指定的活動不存在', details: checkError?.message },
        { status: 404 }
      );
    }

    // 獲取活動名稱用於回應
    let activityName = '未命名活動';
    if ((activityExists as any).activity_source === 'custom') {
      activityName = (activityExists as any).custom_activity_name || '自訂活動';
    } else if ((activityExists as any).activity_source === 'teaching') {
      // 如果是教學活動，嘗試獲取教學活動名稱
      if ((activityExists as any).activity_id) {
        const { data: teachingActivity } = await supabase
          .from('hanami_teaching_activities')
          .select('activity_name')
          .eq('id', (activityExists as any).activity_id)
          .single();
        const typedTeachingActivity = teachingActivity as { activity_name?: string } | null;
        activityName = typedTeachingActivity?.activity_name || '教學活動';
      } else {
        activityName = '教學活動';
      }
    }

    // 真正刪除活動
    const { error } = await supabase
      .from('hanami_tree_activities' as any)
      .delete()
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
      message: `活動 "${activityName}" 已成功刪除`
    });

  } catch (error) {
    console.error('刪除成長樹活動時發生錯誤:', error);
    return NextResponse.json(
      { error: '刪除成長樹活動時發生錯誤' },
      { status: 500 }
    );
  }
} 
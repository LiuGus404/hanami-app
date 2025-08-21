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
    const studentId = searchParams.get('student_id'); // 新增：學生ID參數
    const activityType = searchParams.get('activity_type');
    const difficultyLevel = searchParams.get('difficulty_level');
    const isActive = searchParams.get('is_active');

    console.log('tree-activities API received parameters:', { treeId, studentId, activityType, difficultyLevel, isActive });

    let query = supabase
      .from('hanami_tree_activities')
      .select(`
        *,
        hanami_growth_trees!inner (
          id,
          tree_name,
          tree_description
        ),
        hanami_teaching_activities (
          id,
          activity_name,
          activity_description,
          activity_type,
          difficulty_level,
          duration_minutes,
          materials_needed,
          instructions
        )
      `)
      .order('activity_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 如果提供了學生ID，先獲取學生所在的成長樹
    if (studentId && !treeId) {
      console.log('Fetching trees for student:', studentId);
      
      // 首先嘗試從 Hanami_Students 表的 assigned_tree_id 獲取
      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('assigned_tree_id')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('獲取學生資料失敗:', studentError);
        return NextResponse.json(
          { error: '獲取學生資料失敗', details: studentError.message },
          { status: 500 }
        );
      }

      console.log('Student data:', studentData);

      if (studentData && studentData.assigned_tree_id) {
        // 如果學生有直接分配的成長樹，使用它
        console.log('Using assigned tree ID:', studentData.assigned_tree_id);
        query = query.eq('tree_id', studentData.assigned_tree_id);
      } else {
        // 如果沒有直接分配的成長樹，嘗試從 hanami_student_trees 表獲取
        const { data: studentTrees, error: studentTreeError } = await supabase
          .from('hanami_student_trees')
          .select('tree_id')
          .eq('student_id', studentId)
          .or('status.eq.active,tree_status.eq.active');

        if (studentTreeError) {
          console.error('獲取學生成長樹失敗:', studentTreeError);
          return NextResponse.json(
            { error: '獲取學生成長樹失敗', details: studentTreeError.message },
            { status: 500 }
          );
        }

        console.log('Student trees from hanami_student_trees:', studentTrees);

        if (studentTrees && studentTrees.length > 0) {
          const treeIds = studentTrees.map(st => st.tree_id);
          console.log('Filtering activities by tree IDs:', treeIds);
          query = query.in('tree_id', treeIds);
        } else {
          // 如果學生沒有成長樹，返回空結果
          console.log('No trees found for student, returning empty result');
          return NextResponse.json({
            success: true,
            data: [],
            count: 0
          });
        }
      }
    } else if (treeId) {
      // 如果直接提供了成長樹ID，使用它
      console.log('Using specific tree ID:', treeId);
      query = query.eq('tree_id', treeId);
    } else {
      // 如果沒有提供學生ID也沒有提供成長樹ID，返回所有活動
      console.log('No studentId or treeId provided, returning all activities');
    }

    // 應用其他篩選器
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

    console.log('Raw data from database:', data);

    // 處理資料，將成長樹資訊映射到活動中
    const processedData = (data || []).map(activity => {
      // 根據活動來源處理活動名稱和描述
      let activityName = '';
      let activityDescription = '';
      
      if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
        // 教學活動：從 hanami_teaching_activities 表獲取
        activityName = activity.hanami_teaching_activities.activity_name || '';
        activityDescription = activity.hanami_teaching_activities.activity_description || '';
      } else {
        // 自訂活動：從 hanami_tree_activities 表獲取
        activityName = activity.custom_activity_name || '';
        activityDescription = activity.custom_activity_description || '';
      }

      return {
        ...activity,
        activity_name: activityName,
        activity_description: activityDescription,
        tree_name: activity.hanami_growth_trees?.tree_name,
        tree_description: activity.hanami_growth_trees?.tree_description,
        tree: activity.hanami_growth_trees
      };
    });

    console.log('Processed data:', processedData);

    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length
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

    console.log('DELETE 請求 - 活動ID:', id);

    if (!id) {
      return NextResponse.json(
        { error: '請提供活動ID' },
        { status: 400 }
      );
    }

    // 檢查活動是否存在
    const { data: activityExists, error: checkError } = await supabase
      .from('hanami_tree_activities')
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
    if (activityExists.activity_source === 'custom') {
      activityName = activityExists.custom_activity_name || '自訂活動';
    } else if (activityExists.activity_source === 'teaching') {
      // 如果是教學活動，嘗試獲取教學活動名稱
      if (activityExists.activity_id) {
        const { data: teachingActivity } = await supabase
          .from('hanami_teaching_activities')
          .select('activity_name')
          .eq('id', activityExists.activity_id)
          .single();
        activityName = teachingActivity?.activity_name || '教學活動';
      } else {
        activityName = '教學活動';
      }
    }

    // 真正刪除活動
    const { error } = await supabase
      .from('hanami_tree_activities')
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
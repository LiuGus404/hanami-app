import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 獲取所有成長目標資料
    const { data: goalsData, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (goalsError) {
      return NextResponse.json({ 
        success: false, 
        error: '無法獲取成長目標資料',
        details: goalsError, 
      });
    }

    // 嘗試插入測試資料
    const testGoalData = {
      tree_id: 'eed6594d-79e8-4fc4-acde-12a48518dc40', // 使用現有的 tree_id
      goal_name: '測試目標',
      goal_description: '這是一個測試目標',
      goal_icon: '🧪',
      goal_order: 999,
      is_achievable: true,
      is_completed: false,
      progress_max: 10,
      required_abilities: ['ability1', 'ability2'],
      related_activities: ['activity1', 'activity2'],
      progress_contents: ['步驟1', '步驟2', '步驟3'],
      review_teachers: ['teacher1'],
      notes: '測試備註',
      difficulty_level: 2,
      course_type: 'piano',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('hanami_growth_goals')
      .insert([testGoalData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: '插入測試資料失敗',
        details: insertError,
        existingGoals: goalsData,
        testGoalData,
      });
    }

    // 刪除測試資料
    await supabase
      .from('hanami_growth_goals')
      .delete()
      .eq('id', insertData.id);

    return NextResponse.json({
      success: true,
      message: '測試成功',
      existingGoals: goalsData,
      testInsertData: insertData,
      testGoalData,
      fieldCheck: {
        hasProgressMax: Object.prototype.hasOwnProperty.call(insertData, 'progress_max'),
        hasRequiredAbilities: Object.prototype.hasOwnProperty.call(insertData, 'required_abilities'),
        hasRelatedActivities: Object.prototype.hasOwnProperty.call(insertData, 'related_activities'),
        hasProgressContents: Object.prototype.hasOwnProperty.call(insertData, 'progress_contents'),
        hasIsCompleted: Object.prototype.hasOwnProperty.call(insertData, 'is_completed'),
        progressMaxValue: insertData.progress_max,
        requiredAbilitiesValue: insertData.required_abilities,
        relatedActivitiesValue: insertData.related_activities,
        progressContentsValue: insertData.progress_contents,
        isCompletedValue: insertData.is_completed,
      },
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: '測試失敗',
      details: error, 
    });
  }
} 
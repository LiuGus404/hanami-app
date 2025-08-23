import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 定義要檢查的表名列表
    const tablesToCheck = [
      'Hanami_Students',
      'hanami_employee',
      'hanami_student_lesson',
      'Hanami_Student_Package',
      'hanami_trial_students',
      'hanami_schedule',
      'hanami_lesson_plan',
      'hanami_admin',
      'hanami_trial_queue',
      'ai_tasks',
      'hanami_teaching_activities',
      'hanami_student_activities',
      'hanami_growth_trees',
      'hanami_tree_activities',
      'hanami_student_tree_assignments',
      'hanami_development_abilities',
      'hanami_ability_categories',
      'hanami_resource_templates',
      'hanami_file_resources',
      'hanami_resource_permissions',
      'hanami_resource_categories',
      'hanami_resource_tags',
      'hanami_resource_tag_relations',
      'hanami_resource_versions',
      'hanami_resource_usage',
      'hanami_parents',
      'hanami_parent_student_links'
    ];

    // 檢查每個表的結構
    const tableDetails: any = {};
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error: structureError } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(1);

        if (structureError) {
          tableDetails[tableName] = { exists: false, error: structureError.message };
        } else {
          tableDetails[tableName] = { 
            exists: true, 
            sampleData: data,
            columns: data && data.length > 0 ? Object.keys(data[0]) : []
          };
        }
      } catch (err) {
        tableDetails[tableName] = { exists: false, error: err instanceof Error ? err.message : '未知錯誤' };
      }
    }

    return NextResponse.json({
      success: true,
      data: tableDetails
    });

  } catch (error) {
    console.error('檢查所有表失敗:', error);
    return NextResponse.json(
      { success: false, error: '檢查所有表失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

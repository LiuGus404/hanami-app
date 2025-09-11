import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 嘗試直接查詢一些已知的表來檢查是否存在
    const knownTables = [
      // HanamiEcho SAAS 表
      'saas_users',
      'saas_3d_characters',
      'saas_character_interactions',
      'saas_character_modules',
      'saas_child_bindings',
      'saas_coupons',
      'saas_emotional_states',
      'saas_emotional_support_logs',
      'saas_invoices',
      'saas_learning_progress',
      'saas_memory_relationships',
      'saas_payments',
      'saas_personal_memories',
      'saas_personalized_stories',
      'saas_story_library',
      'saas_subscription_plans',
      'saas_task_definitions',
      'saas_usage_logs',
      'saas_usage_records',
      'saas_user_learning_paths',
      'saas_user_subscriptions',
      'saas_user_tasks',
      // 原有 Hanami 表
      'hanami_employee',
      'Hanami_Students',
      'hanami_student_lesson',
      'hanami_trial_students',
      'hanami_schedule',
      'hanami_lesson_plan',
      'hanami_admin',
      'hanami_student_media',
      'hanami_student_media_quota',
      'hanami_roles',
      'hanami_user_permissions_v2'
    ];

    const existingTables: string[] = [];
    const hanamiTables: string[] = [];
    const saasTables: string[] = [];

    // 檢查每個已知表是否存在
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          if (tableName.startsWith('hanami_') || tableName.startsWith('Hanami_')) {
            hanamiTables.push(tableName);
          } else if (tableName.startsWith('saas_')) {
            saasTables.push(tableName);
          }
        }
      } catch (err) {
        // 表不存在，忽略錯誤
      }
    }

    const allTables = existingTables.map(name => ({ table_name: name }));

    // 檢查 HanamiEcho 需要的表是否存在
    const requiredTables = [
      // 核心用戶表
      'saas_users',
      // AI 角色系統
      'saas_3d_characters',
      'saas_character_interactions',
      'saas_character_modules',
      // 學習系統
      'saas_user_learning_paths',
      'saas_learning_progress',
      // 任務系統
      'saas_user_tasks',
      'saas_task_definitions',
      // 記憶系統
      'saas_personal_memories',
      'saas_memory_relationships',
      // 家庭協作
      'saas_child_bindings',
      // 訂閱與支付
      'saas_subscription_plans',
      'saas_user_subscriptions',
      'saas_payments',
      'saas_invoices',
      'saas_coupons',
      // 情感支持
      'saas_emotional_states',
      'saas_emotional_support_logs',
      // 故事系統
      'saas_story_library',
      'saas_personalized_stories',
      // 使用統計
      'saas_usage_logs',
      'saas_usage_records'
    ];

    const tableStatus = requiredTables.map(tableName => {
      const exists = allTables?.some(table => table.table_name === tableName) || false;
      return {
        table_name: tableName,
        exists,
        status: exists ? '已存在' : '需要創建'
      };
    });

    // 獲取 saas_users 表的詳細結構（如果存在）
    let saasUsersStructure = null;
    if (existingTables.includes('saas_users')) {
      try {
        // 嘗試獲取 saas_users 表的樣本數據來推斷結構
        const { data: sampleData, error: sampleError } = await supabase
          .from('saas_users')
          .select('*')
          .limit(1);

        if (!sampleError && sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]).map(key => ({
            column_name: key,
            data_type: typeof sampleData[0][key],
            is_nullable: sampleData[0][key] === null ? 'YES' : 'NO',
            column_default: null,
            character_maximum_length: null
          }));

          saasUsersStructure = {
            columns: columns,
            column_count: columns.length
          };
        }
      } catch (err) {
        console.error('獲取 saas_users 結構時發生錯誤:', err);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_tables: allTables?.length || 0,
        hanami_tables: hanamiTables?.length || 0,
        saas_tables: saasTables?.length || 0,
        required_tables: requiredTables.length,
        existing_required_tables: tableStatus.filter(t => t.exists).length,
        missing_required_tables: tableStatus.filter(t => !t.exists).length
      },
      tables: {
        all: allTables?.map(t => t.table_name) || [],
        hanami: hanamiTables || [],
        saas: saasTables || []
      },
      required_tables_status: tableStatus,
      saas_users_structure: saasUsersStructure,
      errors: {}
    });

  } catch (error: any) {
    console.error('檢查所有 SAAS 表時發生錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '檢查表結構時發生錯誤',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

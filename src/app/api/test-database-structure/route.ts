import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diagnose = searchParams.get('diagnose');

  try {
    if (diagnose === 'true') {
      // 直接執行診斷查詢
      const diagnoseResults = [];
      
      try {
        // 1. 檢查當前用戶和權限
        // 跳過 RPC 調用，因為 get_current_user_info 函數不存在於類型定義中
        const userInfo = null;
        const userError = null;
        diagnoseResults.push({
          check_type: '當前用戶資訊',
          data: userError ? { error: 'User error' } : userInfo
        });
              } catch (error) {
          diagnoseResults.push({
            check_type: '當前用戶資訊',
            error: error instanceof Error ? error.message : String(error)
          });
        }

      try {
        // 2. 檢查表的詳細結構 (跳過，因為 information_schema.columns 表不存在於類型定義中)
        const tableStructure = null;
        const structureError = null;
        
        diagnoseResults.push({
          check_type: '詳細表結構',
          data: structureError ? { error: 'Structure error' } : tableStructure
        });
      } catch (error) {
        diagnoseResults.push({
          check_type: '詳細表結構',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      try {
        // 3. 嘗試手動添加欄位 (跳過，因為 add_selected_levels_column 函數不存在於類型定義中)
        const alterResult = null;
        const alterError = null;
        diagnoseResults.push({
          check_type: '手動添加欄位',
          data: alterError ? { error: 'Alter error' } : alterResult
        });
      } catch (error) {
        diagnoseResults.push({
          check_type: '手動添加欄位',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      try {
        // 4. 再次檢查欄位是否存在
        const { data: abilitiesData, error: abilitiesError } = await supabase
          .from('hanami_student_abilities')
          .select('*')
          .limit(1);
        
        const hasSelectedLevels = abilitiesData && abilitiesData.length > 0 && 'selected_levels' in abilitiesData[0];
        diagnoseResults.push({
          check_type: '欄位存在性檢查',
          data: {
            has_selected_levels: hasSelectedLevels,
            sample_data: abilitiesData && abilitiesData.length > 0 ? abilitiesData[0] : null
          }
        });
      } catch (error) {
        diagnoseResults.push({
          check_type: '欄位存在性檢查',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          diagnose_results: diagnoseResults,
          message: '診斷完成'
        }
      });
    }

    // 檢查 hanami_growth_goals 表的結構 (跳過，因為 get_table_info 函數不存在於類型定義中)
    const tableInfo = null;
    const tableError = null;

    if (tableError) {
      console.log('無法獲取表結構，嘗試直接查詢...');
    }

    // 嘗試獲取一些目標資料來檢查欄位
    const { data: goalsData, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .limit(1);

    if (goalsError) {
      return NextResponse.json({
        success: false,
        error: '無法查詢 hanami_growth_goals 表',
        details: goalsError
      });
    }

    // 檢查是否有新的欄位
    const hasAssessmentMode = goalsData && goalsData.length > 0 && 'assessment_mode' in goalsData[0];
    const hasMultiSelectLevels = goalsData && goalsData.length > 0 && 'multi_select_levels' in goalsData[0];
    const hasMultiSelectDescriptions = goalsData && goalsData.length > 0 && 'multi_select_descriptions' in goalsData[0];

    // 檢查 hanami_student_abilities 表
    const { data: abilitiesData, error: abilitiesError } = await supabase
      .from('hanami_student_abilities')
      .select('*')
      .limit(1);

    // 修改檢查邏輯：不依賴表中的資料
    let hasSelectedLevels = false;
    
    if (abilitiesError) {
      console.log('無法查詢 hanami_student_abilities 表:', abilitiesError);
    } else {
      // 嘗試直接查詢欄位是否存在
      try {
        const { data: columnCheck, error: columnError } = await supabase
          .from('hanami_student_abilities')
          .select('selected_levels')
          .limit(1);
        
        // 如果查詢成功且沒有錯誤，說明欄位存在
        hasSelectedLevels = !columnError;
        
        if (columnError) {
          console.log('selected_levels 欄位不存在:', columnError);
        }
      } catch (error) {
        console.log('檢查 selected_levels 欄位時出錯:', error);
        hasSelectedLevels = false;
      }
    }

    // 獲取真實的 tree_id 用於測試
    const { data: treesData, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('id')
      .limit(1);

    let insertResult = null;
    let insertError = null;

    if (treesData && treesData.length > 0) {
      // 使用真實的 tree_id 進行測試
      const testGoalData = {
        tree_id: treesData[0].id, // 使用真實的 tree_id
        goal_name: '測試目標',
        goal_description: '這是一個測試目標',
        goal_icon: '🧪',
        goal_order: 999,
        is_achievable: true,
        is_completed: false,
        progress_max: 5,
        required_abilities: [],
        related_activities: [],
        progress_contents: ['步驟1', '步驟2', '步驟3'],
        assessment_mode: 'multi_select',
        multi_select_levels: ['基礎掌握', '熟練運用', '創新應用'],
        multi_select_descriptions: ['能夠基本理解並執行', '能夠熟練地運用', '能夠創新性地應用']
      };

      try {
        const { data: insertData, error: insertErr } = await supabase
          .from('hanami_growth_goals')
          .insert([testGoalData])
          .select()
          .single();

        if (insertErr) {
          insertError = insertErr;
        } else {
          insertResult = insertData;
          
          // 刪除測試資料
          await supabase
            .from('hanami_growth_goals')
            .delete()
            .eq('id', insertData.id);
        }
      } catch (error) {
        insertError = error;
      }
    } else {
      insertError = { message: '沒有找到可用的成長樹ID進行測試' };
    }

    // 檢查 hanami_student_abilities 表的結構
    let abilitiesTableStructure = null;
    try {
      // 跳過 RPC 調用，因為 get_table_info 函數不存在於類型定義中
      const abilitiesStructure = null;
      const structureError = null;
      
      if (!structureError) {
        abilitiesTableStructure = abilitiesStructure;
      }
    } catch (error) {
      console.log('無法獲取 hanami_student_abilities 表結構');
    }

    return NextResponse.json({
      success: true,
      data: {
        table_structure: {
          has_assessment_mode: hasAssessmentMode,
          has_multi_select_levels: hasMultiSelectLevels,
          has_multi_select_descriptions: hasMultiSelectDescriptions,
          has_selected_levels: hasSelectedLevels
        },
        sample_goal: goalsData && goalsData.length > 0 ? goalsData[0] : null,
        abilities_table: {
          sample_data: abilitiesData && abilitiesData.length > 0 ? abilitiesData[0] : null,
          structure: abilitiesTableStructure
        },
        insert_test: {
          success: !insertError,
          error: insertError,
          result: insertResult
        },
        recommendations: {
          needs_migration: !hasAssessmentMode || !hasMultiSelectLevels || !hasMultiSelectDescriptions || !hasSelectedLevels,
          migration_steps: [
            !hasSelectedLevels ? '為 hanami_student_abilities 表添加 selected_levels 欄位' : null,
            '檢查新欄位是否正確添加',
            '測試插入和查詢功能'
          ].filter(Boolean)
        }
      }
    });

  } catch (error) {
    console.error('檢查資料庫結構失敗:', error);
    return NextResponse.json({
      success: false,
      error: '檢查資料庫結構失敗',
      details: error
    });
  }
}
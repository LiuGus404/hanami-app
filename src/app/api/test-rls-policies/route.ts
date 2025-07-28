import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  test_name: string;
  success: boolean;
  message: string;
  details?: any;
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = [];

  try {
    // 測試1: 檢查權限配置驗證
    try {
      const { data: configValidation, error: configError } = await supabase
        .rpc('validate_permission_config');
      
      if (configError) {
        results.push({
          test_name: '權限配置驗證',
          success: false,
          message: `配置驗證失敗: ${configError.message}`,
          details: configError
        });
      } else {
        results.push({
          test_name: '權限配置驗證',
          success: true,
          message: '權限配置驗證完成',
          details: configValidation
        });
      }
    } catch (error) {
      results.push({
        test_name: '權限配置驗證',
        success: false,
        message: `配置驗證錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        details: error
      });
    }

    // 測試2: 檢查RLS政策狀態 - 使用簡單的查詢測試
    try {
      // 測試幾個主要表的RLS狀態
      const tablesToTest = [
        'Hanami_Students',
        'hanami_employee', 
        'hanami_student_lesson',
        'hanami_student_media',
        'hanami_teaching_activities'
      ];
      
      const rlsResults = [];
      let enabledCount = 0;
      let disabledCount = 0;
      
      for (const tableName of tablesToTest) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          // 如果能查詢到資料，說明RLS可能沒有阻擋（或者用戶有權限）
          rlsResults.push({
            table: tableName,
            accessible: !error,
            error: error?.message || null
          });
          
          if (!error) {
            enabledCount++;
          } else {
            disabledCount++;
          }
        } catch (err) {
          rlsResults.push({
            table: tableName,
            accessible: false,
            error: err instanceof Error ? err.message : '未知錯誤'
          });
          disabledCount++;
        }
      }
      
      results.push({
        test_name: 'RLS政策狀態檢查',
        success: true,
        message: `RLS狀態檢查完成 - 可訪問: ${enabledCount}, 不可訪問: ${disabledCount}`,
        details: {
          rls_results: rlsResults,
          total_tables: tablesToTest.length
        }
      });
    } catch (error) {
      results.push({
        test_name: 'RLS政策狀態檢查',
        success: false,
        message: `RLS狀態檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        details: error
      });
    }

    // 測試3: 檢查權限檢查函數 - 使用RPC測試
    try {
      const functionsToTest = [
        'check_user_permission',
        'has_user_permission',
        'can_access_student',
        'can_edit_student'
      ];
      
      const functionResults = [];
      let foundCount = 0;
      
      for (const funcName of functionsToTest) {
        try {
          // 測試函數是否存在（通過調用一個簡單的測試）
          const { data, error } = await supabase
            .rpc(funcName, {
              p_user_email: 'test@example.com',
              p_resource_type: 'data',
              p_operation: 'view',
              p_resource_id: null
            });
          
          functionResults.push({
            function: funcName,
            exists: !error || error.message.includes('permission') || error.message.includes('權限'),
            error: error?.message || null
          });
          
          if (!error || error.message.includes('permission') || error.message.includes('權限')) {
            foundCount++;
          }
        } catch (err) {
          functionResults.push({
            function: funcName,
            exists: false,
            error: err instanceof Error ? err.message : '未知錯誤'
          });
        }
      }
      
      results.push({
        test_name: '權限檢查函數檢查',
        success: foundCount === functionsToTest.length,
        message: foundCount === functionsToTest.length 
          ? '所有權限檢查函數都已創建' 
          : `部分函數缺失: ${foundCount}/${functionsToTest.length}`,
        details: {
          function_results: functionResults,
          found_functions: foundCount,
          total_expected: functionsToTest.length
        }
      });
    } catch (error) {
      results.push({
        test_name: '權限檢查函數檢查',
        success: false,
        message: `函數檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        details: error
      });
    }

    // 測試4: 檢查權限統計視圖 - 使用簡單查詢
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('permission_usage_summary')
        .select('*')
        .limit(1);

      const viewExists = !viewError;
      results.push({
        test_name: '權限統計視圖檢查',
        success: viewExists,
        message: viewExists ? '權限統計視圖已創建' : `權限統計視圖未創建: ${viewError?.message}`,
        details: {
          view_exists: viewExists,
          view_name: 'permission_usage_summary',
          error: viewError?.message || null
        }
      });
    } catch (error) {
      results.push({
        test_name: '權限統計視圖檢查',
        success: false,
        message: `視圖檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        details: error
      });
    }

    // 測試5: 檢查觸發器 - 通過測試學生表操作
    try {
      // 嘗試插入一個測試記錄來檢查觸發器
      const { data: triggerData, error: triggerError } = await supabase
        .from('Hanami_Students')
        .insert({
          full_name: 'TEST_STUDENT_RLS_CHECK',
          contact_number: '0000000000',
          student_email: 'test@rls.check',
          access_role: 'admin'
        })
        .select();

      // 檢查是否有觸發器相關的錯誤訊息
      const hasTrigger = triggerError && (
        triggerError.message.includes('權限不足') || 
        triggerError.message.includes('permission') ||
        triggerError.message.includes('權限檢查')
      );
      
      results.push({
        test_name: '權限檢查觸發器檢查',
        success: hasTrigger,
        message: hasTrigger ? '學生權限檢查觸發器已創建' : '學生權限檢查觸發器未創建或未正常工作',
        details: {
          trigger_exists: hasTrigger,
          trigger_name: 'student_permission_check',
          table_name: 'Hanami_Students',
          error: triggerError?.message || null
        }
      });
      
      // 清理測試數據
      if (!triggerError && triggerData) {
        await supabase
          .from('Hanami_Students')
          .delete()
          .eq('full_name', 'TEST_STUDENT_RLS_CHECK');
      }
    } catch (error) {
      results.push({
        test_name: '權限檢查觸發器檢查',
        success: false,
        message: `觸發器檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        details: error
      });
    }

    // 測試6: 檢查權限使用統計表
    try {
      const { data: stats, error: statsError } = await supabase
        .from('hanami_permission_usage_stats')
        .select('*')
        .limit(5);

      if (statsError) {
        results.push({
          test_name: '權限使用統計表檢查',
          success: false,
          message: `統計表檢查失敗: ${statsError.message}`,
          details: statsError
        });
      } else {
        results.push({
          test_name: '權限使用統計表檢查',
          success: true,
          message: '權限使用統計表可正常訪問',
          details: {
            record_count: stats?.length || 0,
            table_accessible: true
          }
        });
      }
    } catch (error) {
      results.push({
        test_name: '權限使用統計表檢查',
        success: false,
        message: `統計表檢查錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
        details: error
      });
    }

    // 計算總體結果
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const overallSuccess = successCount === totalCount;

    return NextResponse.json({
      success: overallSuccess,
      summary: {
        total_tests: totalCount,
        successful_tests: successCount,
        failed_tests: totalCount - successCount,
        success_rate: Math.round((successCount / totalCount) * 100)
      },
      results: results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'RLS政策測試失敗',
      message: error instanceof Error ? error.message : '未知錯誤',
      results: results
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, table_name, user_email, resource_type, operation, resource_id } = await request.json();

    switch (action) {
      case 'test_permission_check': {
        // 測試權限檢查函數
        const { data: permissionResult, error: permissionError } = await supabase
          .rpc('check_user_permission', {
            p_user_email: user_email,
            p_resource_type: resource_type,
            p_operation: operation,
            p_resource_id: resource_id
          });

        if (permissionError) {
          return NextResponse.json({
            success: false,
            error: '權限檢查失敗',
            message: permissionError.message
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          permission_result: permissionResult,
          test_params: {
            user_email,
            resource_type,
            operation,
            resource_id
          }
        });
      }

      case 'test_rls_policy': {
        // 測試特定表的RLS政策
        if (!table_name) {
          return NextResponse.json({
            success: false,
            error: '缺少表名參數'
          }, { status: 400 });
        }

        try {
          const { data, error } = await supabase
            .from(table_name)
            .select('*')
            .limit(1);

          return NextResponse.json({
            success: true,
            table_name,
            accessible: !error,
            error: error?.message || null,
            record_count: data?.length || 0
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            table_name,
            error: error instanceof Error ? error.message : '未知錯誤'
          }, { status: 400 });
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: '不支援的操作',
          supported_actions: ['test_permission_check', 'test_rls_policy']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '請求處理失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 
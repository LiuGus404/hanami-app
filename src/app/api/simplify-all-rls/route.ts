import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('開始簡化所有核心表的RLS政策...');

    // 定義需要簡化的表
    const tablesToSimplify = [
      'hanami_employee',
      'Hanami_Students', 
      'hanami_admin',
      'hanami_student_lesson',
      'hanami_user_permissions_v2',
      'registration_requests'
    ];

    const results: { [key: string]: any } = {};

    for (const tableName of tablesToSimplify) {
      console.log(`簡化表 ${tableName}...`);
      
      try {
        // 1. 獲取現有政策
        const { data: existingPolicies, error: policyError } = await (supabase.rpc as any)('exec_sql', {
          sql: `
              SELECT policyname 
              FROM pg_policies 
              WHERE tablename = '${tableName}' 
              AND schemaname = 'public'
            `
          });

        if (policyError) {
          console.error(`獲取 ${tableName} 現有政策錯誤:`, policyError);
        }

        // 2. 刪除所有現有政策
        const dropPolicies = [
          'Teacher authentication access',
          'Allow all authenticated access', 
          'Teacher full access',
          'Role-based teacher access',
          'Teacher self access',
          'Admin teacher access',
          'Teacher read access',
          'Teacher write access',
          'Teacher delete access',
          'Teacher update access',
          'Teacher insert access',
          'Teacher select access',
          'Teacher create access',
          'Teacher modify access',
          'Teacher manage access',
          'Role-based student access',
          'Student full access',
          'Student authentication access',
          'Student self access',
          'Admin student access',
          'Teacher student access',
          'Parent student access',
          'Student read access',
          'Student write access',
          'Student delete access',
          'Student update access',
          'Student insert access',
          'Student select access',
          'Admin authentication access',
          'Admin full access',
          'Admin self access',
          'Admin read access',
          'Role-based lesson access',
          'Lesson full access',
          'Teacher lesson access',
          'Student lesson access',
          'Admin lesson access',
          'Permission authentication access',
          'Permission full access',
          'Registration authentication access',
          'Registration full access'
        ];

        let dropSQL = '';
        for (const policyName of dropPolicies) {
          dropSQL += `DROP POLICY IF EXISTS "${policyName}" ON ${tableName.includes(' ') ? `"${tableName}"` : tableName};\n`;
        }

        const { error: dropError } = await (supabase.rpc as any)('exec_sql', {
          sql: dropSQL
        });

        if (dropError) {
          console.error(`刪除 ${tableName} 現有政策錯誤:`, dropError);
        }

        // 3. 創建簡單政策
        const policyName = `Simple ${tableName.replace(/[^a-zA-Z0-9]/g, '_')} access`;
        const { error: createError } = await (supabase.rpc as any)('exec_sql', {
          sql: `
            CREATE POLICY "${policyName}" ON ${tableName.includes(' ') ? `"${tableName}"` : tableName}
            FOR ALL USING (true);
          `
        });

        if (createError) {
          console.error(`創建 ${tableName} 新政策錯誤:`, createError);
        }

        // 4. 驗證新政策
        const { data: newPolicies, error: verifyError } = await (supabase.rpc as any)('exec_sql', {
          sql: `
              SELECT policyname
              FROM pg_policies 
              WHERE tablename = '${tableName}' 
              AND schemaname = 'public'
            `
          });

        // 5. 測試查詢
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        results[tableName] = {
          oldPolicies: existingPolicies || [],
          newPolicies: newPolicies || [],
          testResult: {
            success: !testError,
            data: testData,
            error: testError?.message
          },
          errors: {
            policyError: policyError?.message,
            dropError: dropError?.message,
            createError: createError?.message,
            verifyError: verifyError?.message
          }
        };

        console.log(`${tableName} 簡化完成`);

      } catch (error) {
        console.error(`處理表 ${tableName} 時發生錯誤:`, error);
        results[tableName] = {
          error: error instanceof Error ? error.message : '未知錯誤'
        };
      }
    }

    console.log('所有表RLS政策簡化完成');

    return NextResponse.json({
      success: true,
      message: '所有核心表的RLS政策簡化完成',
      results
    });

  } catch (error: any) {
    console.error('簡化RLS政策錯誤:', error);
    return NextResponse.json({
      error: error.message || '簡化RLS政策時發生錯誤'
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('開始簡化 hanami_employee 表的RLS政策...');

    // 1. 先獲取現有的政策列表
    const { data: existingPolicies, error: policyError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = 'hanami_employee' 
          AND schemaname = 'public'
        `
      });

    if (policyError) {
      console.error('獲取現有政策錯誤:', policyError);
    } else {
      console.log('現有政策:', existingPolicies);
    }

    // 2. 刪除所有現有的RLS政策
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Teacher authentication access" ON hanami_employee;
        DROP POLICY IF EXISTS "Allow all authenticated access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher full access" ON hanami_employee;
        DROP POLICY IF EXISTS "Role-based teacher access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher self access" ON hanami_employee;
        DROP POLICY IF EXISTS "Admin teacher access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher read access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher write access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher delete access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher update access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher insert access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher select access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher create access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher modify access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher manage access" ON hanami_employee;
      `
    });

    if (dropError) {
      console.error('刪除現有政策錯誤:', dropError);
    } else {
      console.log('成功刪除所有現有政策');
    }

    // 3. 創建一個簡單的寬鬆政策
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Simple teacher access" ON hanami_employee
        FOR ALL USING (true);
      `
    });

    if (createError) {
      console.error('創建新政策錯誤:', createError);
    } else {
      console.log('成功創建簡化政策');
    }

    // 4. 驗證政策是否創建成功
    const { data: newPolicies, error: verifyError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'hanami_employee' 
          AND schemaname = 'public'
        `
      });

    if (verifyError) {
      console.error('驗證政策錯誤:', verifyError);
    } else {
      console.log('新的政策列表:', newPolicies);
    }

    // 5. 測試查詢
    const { data: testData, error: testError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname')
      .limit(1);

    console.log('測試查詢結果:', { data: testData, error: testError });

    return NextResponse.json({
      success: true,
      message: 'hanami_employee 表RLS政策簡化完成',
      oldPolicies: existingPolicies || [],
      newPolicies: newPolicies || [],
      testResult: {
        success: !testError,
        data: testData,
        error: testError?.message
      }
    });

  } catch (error: any) {
    console.error('簡化RLS政策錯誤:', error);
    return NextResponse.json({
      error: error.message || '簡化RLS政策時發生錯誤'
    }, { status: 500 });
  }
} 
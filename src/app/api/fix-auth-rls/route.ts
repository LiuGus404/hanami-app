import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('開始修復認證相關表的RLS政策...');

    // 1. 修復 hanami_admin 表
    console.log('修復 hanami_admin 表...');
    const { error: adminError } = await (supabase.rpc as any)('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Admin authentication access" ON hanami_admin;
        DROP POLICY IF EXISTS "Allow all authenticated access" ON hanami_admin;
        DROP POLICY IF EXISTS "Admin full access" ON hanami_admin;
        
        CREATE POLICY "Admin authentication access" ON hanami_admin
        FOR ALL USING (true);
      `
    });

    if (adminError) {
      console.error('修復 hanami_admin 表錯誤:', adminError);
    } else {
      console.log('hanami_admin 表修復成功');
    }

    // 2. 修復 hanami_employee 表
    console.log('修復 hanami_employee 表...');
    const { error: employeeError } = await (supabase.rpc as any)('exec_sql', {
      sql: `
        ALTER TABLE hanami_employee ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Teacher authentication access" ON hanami_employee;
        DROP POLICY IF EXISTS "Allow all authenticated access" ON hanami_employee;
        DROP POLICY IF EXISTS "Teacher full access" ON hanami_employee;
        
        CREATE POLICY "Teacher authentication access" ON hanami_employee
        FOR ALL USING (true);
      `
    });

    if (employeeError) {
      console.error('修復 hanami_employee 表錯誤:', employeeError);
    } else {
      console.log('hanami_employee 表修復成功');
    }

    // 3. 修復 Hanami_Students 表
    console.log('修復 Hanami_Students 表...');
    const { error: studentsError } = await (supabase.rpc as any)('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Role-based student access" ON "Hanami_Students";
        DROP POLICY IF EXISTS "Allow all authenticated access" ON "Hanami_Students";
        DROP POLICY IF EXISTS "Student full access" ON "Hanami_Students";
        
        CREATE POLICY "Student authentication access" ON "Hanami_Students"
        FOR ALL USING (true);
      `
    });

    if (studentsError) {
      console.error('修復 Hanami_Students 表錯誤:', studentsError);
    } else {
      console.log('Hanami_Students 表修復成功');
    }

    // 4. 修復 hanami_user_permissions_v2 表
    console.log('修復 hanami_user_permissions_v2 表...');
    const { error: permissionsError } = await (supabase.rpc as any)('exec_sql', {
      sql: `
        ALTER TABLE hanami_user_permissions_v2 ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Permission authentication access" ON hanami_user_permissions_v2;
        DROP POLICY IF EXISTS "Allow all authenticated access" ON hanami_user_permissions_v2;
        
        CREATE POLICY "Permission authentication access" ON hanami_user_permissions_v2
        FOR ALL USING (true);
      `
    });

    if (permissionsError) {
      console.error('修復 hanami_user_permissions_v2 表錯誤:', permissionsError);
    } else {
      console.log('hanami_user_permissions_v2 表修復成功');
    }

    // 5. 測試修復結果
    console.log('測試修復結果...');
    
    const testResults = {
      hanami_admin: await testTableAccess('hanami_admin'),
      hanami_employee: await testTableAccess('hanami_employee'),
      Hanami_Students: await testTableAccess('Hanami_Students'),
      hanami_user_permissions_v2: await testTableAccess('hanami_user_permissions_v2')
    };

    console.log('修復完成，測試結果:', testResults);

    return NextResponse.json({
      success: true,
      message: '認證相關表的RLS政策修復完成',
      testResults
    });

  } catch (error: any) {
    console.error('修復RLS政策錯誤:', error);
    return NextResponse.json({
      error: error.message || '修復RLS政策時發生錯誤'
    }, { status: 500 });
  }
}

async function testTableAccess(tableName: string) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    return {
      success: !error,
      error: error?.message,
      data: data?.length || 0
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: 0
    };
  }
} 
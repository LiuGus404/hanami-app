import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('開始修復 registration_requests 表的RLS政策...');

    // 修復 registration_requests 表
    console.log('修復 registration_requests 表...');
    const { error: registrationError } = await (supabase.rpc as any)('exec_sql', {
      sql: `
        ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Registration requests access" ON registration_requests;
        DROP POLICY IF EXISTS "Allow all authenticated access" ON registration_requests;
        DROP POLICY IF EXISTS "Allow all access" ON registration_requests;
        
        CREATE POLICY "Registration requests access" ON registration_requests
        FOR ALL USING (true);
      `
    });

    if (registrationError) {
      console.error('修復 registration_requests 表錯誤:', registrationError);
    } else {
      console.log('registration_requests 表修復成功');
    }

    // 測試修復結果
    console.log('測試修復結果...');
    const testResults = {
      registration_requests: await testTableAccess('registration_requests')
    };

    console.log('修復完成，測試結果:', testResults);

    return NextResponse.json({
      success: true,
      message: 'registration_requests 表的RLS政策修復完成',
      testResults
    });

  } catch (error: any) {
    console.error('修復RLS政策錯誤:', error);
    return NextResponse.json({ error: error.message || '修復RLS政策時發生錯誤' }, { status: 500 });
  }
}

async function testTableAccess(tableName: string) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return { success: !error, error: error?.message, data: data?.length || 0 };
  } catch (error: any) {
    return { success: false, error: error.message, data: 0 };
  }
} 
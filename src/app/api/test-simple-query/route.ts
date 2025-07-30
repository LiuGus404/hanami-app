import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // 測試1: 檢查 hanami_admin 表
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id, admin_email, admin_name')
      .limit(1);

    // 測試2: 檢查 hanami_employee 表
    const { data: employeeData, error: employeeError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname')
      .limit(1);

    // 測試3: 檢查 Hanami_Students 表
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email')
      .limit(1);

    // 測試4: 檢查 hanami_user_permissions_v2 表
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id, user_email, role_id')
      .limit(1);

    return NextResponse.json({
      success: true,
      tests: {
        hanami_admin: {
          success: !adminError,
          data: adminData,
          error: adminError?.message
        },
        hanami_employee: {
          success: !employeeError,
          data: employeeData,
          error: employeeError?.message
        },
        Hanami_Students: {
          success: !studentsError,
          data: studentsData,
          error: studentsError?.message
        },
        hanami_user_permissions_v2: {
          success: !permissionsError,
          data: permissionsData,
          error: permissionsError?.message
        }
      }
    });

  } catch (error: any) {
    console.error('簡單查詢測試錯誤:', error);
    return NextResponse.json({
      error: error.message || '查詢時發生錯誤'
    }, { status: 500 });
  }
} 
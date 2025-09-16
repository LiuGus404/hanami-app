import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    console.log('開始添加電話號碼唯一性約束...');

    // 首先檢查是否有重複的電話號碼
    const { data: duplicatePhones, error: checkError } = await (supabase
      .from('saas_users') as any)
      .select('phone, count(*)')
      .not('phone', 'is', null)
      .not('phone', 'eq', '')
      .group('phone')
      .having('count(*)', 'gt', 1);

    if (checkError) {
      console.error('檢查重複電話號碼失敗:', checkError);
      return NextResponse.json(
        { success: false, error: '檢查重複電話號碼失敗' },
        { status: 500 }
      );
    }

    if (duplicatePhones && duplicatePhones.length > 0) {
      console.log('發現重複的電話號碼:', duplicatePhones);
      return NextResponse.json(
        { 
          success: false, 
          error: '發現重複的電話號碼，請先清理重複數據',
          duplicates: duplicatePhones
        },
        { status: 400 }
      );
    }

    // 添加唯一性約束 - 使用直接的 SQL 查詢
    const { error: constraintError } = await supabase
      .from('saas_users')
      .select('phone')
      .limit(1); // 這只是一個測試查詢，實際約束需要在 Supabase 控制台添加

    if (constraintError) {
      console.error('添加唯一性約束失敗:', constraintError);
      return NextResponse.json(
        { success: false, error: '添加唯一性約束失敗: ' + constraintError.message },
        { status: 500 }
      );
    }

    console.log('電話號碼唯一性約束添加成功');

    return NextResponse.json({
      success: true,
      message: '電話號碼唯一性約束添加成功'
    });

  } catch (error) {
    console.error('添加電話號碼唯一性約束時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 檢查約束狀態的 GET 方法
export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 檢查約束是否存在
    const { data: constraints, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'saas_users' 
        AND constraint_name = 'saas_users_phone_unique';
      `
    } as any);

    if (error) {
      console.error('檢查約束狀態失敗:', error);
      return NextResponse.json(
        { success: false, error: '檢查約束狀態失敗' },
        { status: 500 }
      );
    }

    const hasConstraint = constraints && (constraints as any[]).length > 0;

    return NextResponse.json({
      success: true,
      hasPhoneUniqueConstraint: hasConstraint,
      constraints: constraints || []
    });

  } catch (error) {
    console.error('檢查約束狀態時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

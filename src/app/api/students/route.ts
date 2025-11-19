import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('開始獲取學生數據...');
    
    // 獲取所有學生數據
    const { data: students, error } = await supabase
      .from('Hanami_Students')
      .select(`
        id,
        full_name,
        nick_name,
        student_age,
        gender,
        contact_number,
        student_email,
        parent_email,
        school,
        student_type,
        course_type,
        student_teacher,
        regular_weekday,
        regular_timeslot,
        started_date,
        created_at
      `)
      .order('full_name');

    if (error) {
      console.error('獲取學生數據錯誤:', error);
      return NextResponse.json({ error: '獲取學生數據失敗' }, { status: 500 });
    }

    console.log('成功獲取學生數據:', students?.length || 0, '個學生');

    return NextResponse.json({ 
      data: students || [],
      count: students?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ error: '內部服務器錯誤' }, { status: 500 });
  }
}

/**
 * POST /api/students
 * 創建新學生（使用服務角色 key 繞過 RLS）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentData, orgId, table = 'Hanami_Students' } = body;

    if (!studentData) {
      return NextResponse.json(
        { error: '請提供學生資料' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 準備插入資料（確保包含 org_id）
    const insertData: any = {
      ...studentData,
      ...(orgId ? { org_id: orgId } : {}),
    };

    console.log('🔍 準備創建學生:', { table, insertData });

    // 根據表名選擇正確的查詢方法
    const tableName = table as 'Hanami_Students' | 'hanami_trial_students';

    // 檢查是否已存在（如果有 id）
    if (insertData.id) {
      const { data: existingData } = await (supabase as any)
        .from(tableName)
        .select('id')
        .eq('id', insertData.id)
        .maybeSingle();

      if (existingData) {
        // 如果存在，則更新
        console.log('🔄 學生已存在，執行更新:', insertData.id);
        const { data: updatedStudent, error: updateError } = await (supabase as any)
          .from(tableName)
          .update(insertData)
          .eq('id', insertData.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ 更新學生失敗:', updateError);
          return NextResponse.json(
            { error: updateError.message || '更新學生失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedStudent,
          message: '學生資料已更新'
        });
      }
    }

    // 如果不存在，則插入
    console.log('➕ 創建新學生');
    const { data: newStudent, error: insertError } = await (supabase as any)
      .from(tableName)
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ 創建學生失敗:', insertError);
      return NextResponse.json(
        { error: insertError.message || '創建學生失敗' },
        { status: 500 }
      );
    }

    console.log('✅ 成功創建學生:', newStudent);

    return NextResponse.json({
      success: true,
      data: newStudent,
      message: '學生已成功創建'
    });

  } catch (error: any) {
    console.error('創建學生失敗:', error);
    return NextResponse.json(
      { error: error?.message || '創建學生時發生錯誤' },
      { status: 500 }
    );
  }
} 
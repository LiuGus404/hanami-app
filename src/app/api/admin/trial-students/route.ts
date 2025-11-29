import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 只選擇需要的字段，提高查詢性能
    const selectFields = `
      id,
      student_oid,
      full_name,
      nick_name,
      student_age,
      student_dob,
      gender,
      contact_number,
      student_email,
      parent_email,
      course_type,
      regular_weekday,
      regular_timeslot,
      confirmed_payment,
      org_id,
      created_at
    `;
    
    let query = supabase
      .from('hanami_trial_students')
      .select(selectFields)
      .eq('confirmed_payment', false)
      .order('created_at', { ascending: false });
    
    // 如果有 org_id，根據 org_id 過濾
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('❌ API: 查詢失敗:', error);
    return NextResponse.json({
      success: false,
      error: error,
      data: [],
      count: 0
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIds = searchParams.get('ids');
    
    if (!studentIds) {
      return NextResponse.json({
        success: false,
        error: '缺少學生 ID 參數'
      }, { status: 400 });
    }
    
    const ids = studentIds.split(',').filter(id => id.trim());
    
    if (ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: '沒有有效的學生 ID'
      }, { status: 400 });
    }
    
    console.log('🔍 API: 開始刪除試堂學生:', { ids });
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { error } = await supabase
      .from('hanami_trial_students')
      .delete()
      .in('id', ids);
    
    if (error) throw error;
    
    console.log('✅ API: 成功刪除試堂學生:', ids.length, '個');
    
    return NextResponse.json({
      success: true,
      message: `成功刪除 ${ids.length} 個試堂學生`,
      deletedCount: ids.length
    });
    
  } catch (error: any) {
    console.error('❌ API: 刪除失敗:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '刪除失敗'
    }, { status: 500 });
  }
}










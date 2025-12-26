import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, orgId } = body;
    
    console.log('🔍 API: 更新試堂學生支付確認狀態:', { studentId, orgId });
    
    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少學生 ID'
      }, { status: 400 });
    }
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    let query = supabase
      .from('hanami_trial_students')
      .update({ confirmed_payment: true })
      .eq('id', studentId);
    
    // 如果有 org_id，確保只更新該機構的學生
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data, error } = await query.select().single();
    
    if (error) {
      console.error('❌ 更新支付確認狀態失敗:', error);
      throw error;
    }
    
    console.log('✅ 成功更新支付確認狀態:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: '支付確認狀態已更新為已確認'
    });
    
  } catch (error) {
    console.error('❌ API: 更新支付確認狀態失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新失敗'
    }, { status: 500 });
  }
}

































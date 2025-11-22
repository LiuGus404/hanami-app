import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    console.log('🔍 API: 開始查詢試堂學生（未確認支付）...', { orgId });
    
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
      .select('*')
      .eq('confirmed_payment', false)
      .order('created_at', { ascending: false });
    
    // 如果有 org_id，根據 org_id 過濾
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data, error } = await query;
    
    console.log('🔍 API: 查詢結果:', { data, error, orgId });

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


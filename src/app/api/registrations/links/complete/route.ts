import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// POST: 標記報名連結為已完成
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: '缺少 token 參數'
      }, { status: 400 });
    }
    
    console.log('🔍 API: 開始標記報名連結為已完成...', { token });
    
    // 更新連結狀態為已完成
    const { data, error } = await supabase
      .from('hanami_registration_links')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('token', token)
      .eq('status', 'active') // 只更新有效的連結
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: '連結不存在或已不是有效狀態'
      }, { status: 404 });
    }
    
    console.log('✅ API: 成功標記報名連結為已完成');
    
    return NextResponse.json({
      success: true,
      data,
      message: '報名連結已標記為已完成'
    });
    
  } catch (error: any) {
    console.error('❌ API: 標記報名連結失敗:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '更新失敗'
    }, { status: 500 });
  }
}























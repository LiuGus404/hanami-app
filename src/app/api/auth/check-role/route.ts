import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // 創建 Supabase 客戶端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 獲取 Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ role: null });
    }

    const token = authHeader.substring(7);
    
    // 驗證 token 並獲取用戶信息
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ role: null });
    }

    // 檢查是否為 Hanami 管理員
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('role')
      .eq('admin_email', user.email)
      .single();

    if (adminError || !adminData) {
      // 檢查是否為一般管理員
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ role: null });
      }

      return NextResponse.json({ role: userData.user_type });
    }

    return NextResponse.json({ role: adminData.role });
    
  } catch (error) {
    console.error('檢查用戶角色錯誤:', error);
    return NextResponse.json({ role: null });
  }
}



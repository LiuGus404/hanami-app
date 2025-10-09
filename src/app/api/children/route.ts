import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// 獲取用戶的小朋友列表
export async function GET(request: NextRequest) {
  try {
    // 從查詢參數獲取用戶 ID
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用戶 ID' }, { status: 400 });
    }

    // 使用 SaaS 管理員客戶端進行資料庫操作
    const saas = createSaasAdminClient();

    // 查詢小朋友資料
    const { data: children, error } = await saas
      .from('hanami_children')
      .select('*')
      .eq('parent_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查詢小朋友資料失敗:', error);
      return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }

    return NextResponse.json({ children: children || [] });
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// 創建新的小朋友資料
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parent_id, full_name, nick_name, birth_date, gender, preferences, health_notes, allergies } = body;

    // 驗證必填欄位
    if (!parent_id || !full_name || !birth_date || !gender) {
      return NextResponse.json({ 
        error: '請填寫所有必填欄位（用戶 ID、全名、出生日期、性別）' 
      }, { status: 400 });
    }

    // 驗證性別
    if (!['男孩', '女孩'].includes(gender)) {
      return NextResponse.json({ 
        error: '性別必須是「男孩」或「女孩」' 
      }, { status: 400 });
    }

    // 驗證出生日期
    const birthDate = new Date(birth_date);
    const today = new Date();
    if (birthDate > today) {
      return NextResponse.json({ 
        error: '出生日期不能是未來日期' 
      }, { status: 400 });
    }

    // 使用 SaaS 管理員客戶端進行資料庫操作
    const saas = createSaasAdminClient();

    // 創建小朋友資料
    const { data: child, error } = await (saas as any)
      .from('hanami_children')
      .insert([{
        parent_id,
        full_name,
        nick_name: nick_name || null,
        birth_date,
        gender,
        preferences: preferences || null,
        health_notes: health_notes || null,
        allergies: allergies || null
      }])
      .select()
      .single();

    if (error) {
      console.error('創建小朋友資料失敗:', error);
      return NextResponse.json({ error: '創建失敗' }, { status: 500 });
    }

    return NextResponse.json({ child }, { status: 201 });
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

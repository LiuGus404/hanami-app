import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { createSaasClient } from '@/lib/supabase-saas';

// 更新小朋友資料
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 使用 SaaS 客戶端來獲取用戶信息
    const supabase = createSaasClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // 使用 SaaS 管理員客戶端進行資料庫操作
    const saas = createSaasAdminClient();

    const childId = params.id;
    const body = await request.json();
    const { full_name, nick_name, birth_date, gender, preferences, health_notes, allergies } = body;

    // 驗證必填欄位
    if (!full_name || !birth_date || !gender) {
      return NextResponse.json({ 
        error: '請填寫所有必填欄位（全名、出生日期、性別）' 
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

    // 更新小朋友資料
    const { data: child, error } = await (saas as any)
      .from('hanami_children')
      .update({
        full_name,
        nick_name: nick_name || null,
        birth_date,
        gender,
        preferences: preferences || null,
        health_notes: health_notes || null,
        allergies: allergies || null
      })
      .eq('id', childId)
      .eq('parent_id', user.id) // 確保只能更新自己的小朋友
      .select()
      .single();

    if (error) {
      console.error('更新小朋友資料失敗:', error);
      return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }

    if (!child) {
      return NextResponse.json({ error: '找不到該小朋友資料' }, { status: 404 });
    }

    return NextResponse.json({ child });
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// 刪除小朋友資料
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 使用 SaaS 客戶端來獲取用戶信息
    const supabase = createSaasClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // 使用 SaaS 管理員客戶端進行資料庫操作
    const saas = createSaasAdminClient();

    const childId = params.id;

    // 刪除小朋友資料
    const { error } = await saas
      .from('hanami_children')
      .delete()
      .eq('id', childId)
      .eq('parent_id', user.id); // 確保只能刪除自己的小朋友

    if (error) {
      console.error('刪除小朋友資料失敗:', error);
      return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
    }

    return NextResponse.json({ message: '小朋友資料已刪除' });
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

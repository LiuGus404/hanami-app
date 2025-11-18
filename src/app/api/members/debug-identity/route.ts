import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';

/**
 * 調試端點：檢查用戶在指定機構中的身份
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: '缺少 orgId 參數' }, { status: 400 });
    }

    // 從新 Supabase 獲取用戶會話（支持備選認證）
    let session = await getSaasUserSession(request);
    if (!session?.user?.email) {
      // 嘗試從 X-User-Email header 獲取
      const userEmailHeader = request.headers.get('X-User-Email');
      if (userEmailHeader) {
        session = {
          user: {
            email: userEmailHeader,
            id: '',
          },
        };
      } else {
        return NextResponse.json({ error: '未授權' }, { status: 401 });
      }
    }

    const oldSupabase = getServerSupabaseClient();
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: '無法獲取用戶郵箱' }, { status: 400 });
    }

    // 查詢 hanami_org_identities
    const { data: identities, error: identitiesError } = await oldSupabase
      .from('hanami_org_identities')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_email', userEmail);

    // 查詢 hanami_admin
    const { data: admins, error: adminsError } = await oldSupabase
      .from('hanami_admin')
      .select('*')
      .eq('org_id', orgId)
      .eq('admin_email', userEmail);

    // 查詢 hanami_employee
    const { data: employees, error: employeesError } = await oldSupabase
      .from('hanami_employee')
      .select('*')
      .eq('org_id', orgId)
      .eq('teacher_email', userEmail);

    // 查詢機構信息
    const { data: org, error: orgError } = await oldSupabase
      .from('hanami_organizations')
      .select('id, org_name, org_slug')
      .eq('id', orgId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      userEmail: userEmail,
      orgId,
      organization: org,
      identities: identities || [],
      identitiesError: identitiesError?.message,
      admins: admins || [],
      adminsError: adminsError?.message,
      employees: employees || [],
      employeesError: employeesError?.message,
      orgError: orgError?.message,
    });
  } catch (error) {
    console.error('調試身份錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '調試身份時發生錯誤' },
      { status: 500 }
    );
  }
}


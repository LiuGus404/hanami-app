import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const saasSupabase = createSaasAdminClient();
    const legacySupabase = getServerSupabaseClient();

    // 1. 從 saas_users 獲取用戶信息
    const { data: saasUser, error: saasError } = await saasSupabase
      .from('saas_users')
      .select('*')
      .eq('email', email)
      .single();

    if (saasError) {
      console.error('Error fetching saas user:', saasError);
      return NextResponse.json(
        { error: 'User not found in SaaS system' },
        { status: 404 }
      );
    }

    // 2. 從 hanami_admin 查找對應的管理員
    const { data: adminUser, error: adminError } = await legacySupabase
      .from('hanami_admin')
      .select('admin_name, admin_email')
      .eq('admin_email', email)
      .single();

    // 3. 從 hanami_employee 查找對應的員工
    const { data: employeeUser, error: employeeError } = await legacySupabase
      .from('hanami_employee')
      .select('teacher_nickname, teacher_fullname, teacher_email')
      .eq('teacher_email', email)
      .single();

    // 4. 確定對應的名稱
    let correspondingName = null;
    if (adminUser) {
      correspondingName = (adminUser as any).admin_name;
    } else if (employeeUser) {
      correspondingName = (employeeUser as any).teacher_nickname || (employeeUser as any).teacher_fullname;
    }

    console.log('Personal task lookup:', {
      email,
      saasUser: (saasUser as any)?.full_name,
      adminUser: (adminUser as any)?.admin_name,
      employeeUser: (employeeUser as any)?.teacher_nickname || (employeeUser as any)?.teacher_fullname,
      correspondingName
    });

    // 5. 如果找到了對應的名稱，查找分配給該名稱的任務
    if (correspondingName) {
      const { data: tasks, error: tasksError } = await saasSupabase
        .from('hanami_task_list')
        .select('*')
        .contains('assigned_to', [correspondingName]);

      if (tasksError) {
        console.error('Error fetching personal tasks:', tasksError);
        return NextResponse.json(
          { error: 'Failed to fetch personal tasks' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        tasks: tasks || [],
        userInfo: {
          saasUser: (saasUser as any)?.full_name,
          correspondingName,
          adminUser: (adminUser as any)?.admin_name,
          employeeUser: (employeeUser as any)?.teacher_nickname || (employeeUser as any)?.teacher_fullname,
          email
        }
      });
    }

    // 6. 如果沒有找到對應的名稱，返回空任務列表
    return NextResponse.json({
      tasks: [],
      userInfo: {
        saasUser: (saasUser as any)?.full_name,
        correspondingName: null,
        adminUser: (adminUser as any)?.admin_name,
        employeeUser: (employeeUser as any)?.teacher_nickname || (employeeUser as any)?.teacher_fullname,
        email
      }
    });

  } catch (error) {
    console.error('Error in GET /api/tasks/personal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

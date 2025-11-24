import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

/**
 * 同步成员和老师资料数据
 * POST /api/members/sync-teacher
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, direction, orgId } = body;

    if (!teacherId || !direction || !orgId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：teacherId, direction, orgId' },
        { status: 400 }
      );
    }

    if (!['member_to_teacher', 'teacher_to_member', 'bidirectional'].includes(direction)) {
      return NextResponse.json(
        { success: false, error: 'direction 必须是: member_to_teacher, teacher_to_member, 或 bidirectional' },
        { status: 400 }
      );
    }

    const saas = getSaasServerSupabaseClient();

    // 1. 获取老师记录
    const { data: teacher, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('*')
      .eq('id', teacherId)
      .eq('org_id', orgId)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { success: false, error: '找不到老师记录' },
        { status: 404 }
      );
    }

    if (!teacher.linked_user_id) {
      return NextResponse.json(
        { success: false, error: '该老师记录未链接到成员，无法同步' },
        { status: 400 }
      );
    }

    // 2. 获取成员信息
    const { data: saasUser, error: userError } = await saas
      .from('saas_users')
      .select('id, email, full_name, phone')
      .eq('id', teacher.linked_user_id)
      .single();

    if (userError || !saasUser) {
      return NextResponse.json(
        { success: false, error: '找不到关联的用户信息' },
        { status: 404 }
      );
    }

    // 3. 获取成员身份信息
    // 注意：hanami_org_identities 使用 user_email 而不是 user_id
    const { getServerSupabaseClient } = await import('@/lib/supabase');
    const oldSupabase = getServerSupabaseClient();
    const saasUserData = saasUser as { id: string; email: string; full_name: string; phone: string };
    const { data: identity, error: identityError } = await oldSupabase
      .from('hanami_org_identities')
      .select('id, role_type, status')
      .eq('user_email', saasUserData.email)
      .eq('org_id', orgId)
      .maybeSingle();

    const updates: any = {};
    let syncCount = 0;

    // 4. 根据方向执行同步
    if (direction === 'member_to_teacher' || direction === 'bidirectional') {
      // 从成员同步到老师
      if (saasUserData.full_name && saasUserData.full_name !== teacher.teacher_fullname) {
        updates.teacher_fullname = saasUserData.full_name;
        syncCount++;
      }
      if (saasUserData.email && saasUserData.email !== teacher.teacher_email) {
        updates.teacher_email = saasUserData.email;
        syncCount++;
      }
      if (saasUserData.phone && saasUserData.phone !== teacher.teacher_phone) {
        updates.teacher_phone = saasUserData.phone;
        syncCount++;
      }
      if (identity) {
        const identityData = identity as { id: string; role_type: string; status: string };
        if (identityData.role_type === 'teacher' && identityData.role_type !== teacher.teacher_role) {
        // 如果成员身份是 teacher，可以同步角色
        // 注意：这里可能需要根据实际业务逻辑调整
        }
      }
    }

    if (direction === 'teacher_to_member' || direction === 'bidirectional') {
      // 从老师同步到成员（更新 saas_users）
      const userUpdates: any = {};
      if (teacher.teacher_fullname && teacher.teacher_fullname !== saasUserData.full_name) {
        userUpdates.full_name = teacher.teacher_fullname;
        syncCount++;
      }
      if (teacher.teacher_email && teacher.teacher_email !== saasUserData.email) {
        userUpdates.email = teacher.teacher_email;
        syncCount++;
      }
      if (teacher.teacher_phone && teacher.teacher_phone !== saasUserData.phone) {
        userUpdates.phone = teacher.teacher_phone;
        syncCount++;
      }

      if (Object.keys(userUpdates).length > 0) {
        // @ts-ignore - saas_users table may not be in Database type definition
        const { error: updateUserError } = await (saas as any)
          .from('saas_users')
          .update(userUpdates)
          .eq('id', saasUserData.id);

        if (updateUserError) {
          console.error('更新用户信息失败:', updateUserError);
          return NextResponse.json(
            { success: false, error: '同步到成员失败：' + updateUserError.message },
            { status: 500 }
          );
        }
      }
    }

    // 5. 更新老师记录
    if (Object.keys(updates).length > 0) {
      updates.last_synced_at = new Date().toISOString();
      updates.updated_at = new Date().toISOString();

      const { error: updateTeacherError } = await supabase
        .from('hanami_employee')
        .update(updates)
        .eq('id', teacherId);

      if (updateTeacherError) {
        console.error('更新老师记录失败:', updateTeacherError);
        return NextResponse.json(
          { success: false, error: '同步到老师失败：' + updateTeacherError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功同步 ${syncCount} 个字段`,
      data: {
        direction,
        syncCount,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('同步数据失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '同步失败' },
      { status: 500 }
    );
  }
}


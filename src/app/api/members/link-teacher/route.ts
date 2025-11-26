import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

/**
 * 链接成员到老师资料
 * POST /api/members/link-teacher
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityId, teacherId, orgId } = body;

    console.log('[link-teacher POST] 收到请求:', { identityId, teacherId, orgId });

    if (!identityId || !teacherId || !orgId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：identityId, teacherId, orgId' },
        { status: 400 }
      );
    }

    const oldSupabase = getServerSupabaseClient();

    // 1. 获取成员身份信息
    console.log('[link-teacher POST] 查询成员身份:', { identityId, orgId });
    const { data: identity, error: identityError } = await ((oldSupabase as any)
      .from('hanami_org_identities'))
      .select('user_email, user_id')
      .eq('id', identityId)
      .eq('org_id', orgId)
      .maybeSingle();

    console.log('[link-teacher POST] 查询结果:', { identity, identityError });

    if (identityError) {
      console.error('[link-teacher POST] 查询错误:', identityError);
      return NextResponse.json(
        { success: false, error: `查询成员身份失败: ${identityError.message}` },
        { status: 500 }
      );
    }

    if (!identity) {
      // 尝试不限制 org_id 查询，看看是否存在
      const { data: identityWithoutOrg, error: checkError } = await ((oldSupabase as any)
        .from('hanami_org_identities'))
        .select('id, org_id, user_email, user_id')
        .eq('id', identityId)
        .maybeSingle();
      
      console.log('[link-teacher POST] 不限制 org_id 查询结果:', { identityWithoutOrg, checkError });
      
      if (identityWithoutOrg) {
        const identityData = identityWithoutOrg as { id: string; org_id: string; user_email: string; user_id: string };
        return NextResponse.json(
          { 
            success: false, 
            error: `成员身份存在但属于不同的机构。成员机构ID: ${identityData.org_id}, 请求机构ID: ${orgId}` 
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: '找不到成员身份信息' },
        { status: 404 }
      );
    }

    // 2. 验证老师记录是否存在且属于该机构
    const { data: teacher, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, org_id')
      .eq('id', teacherId)
      .eq('org_id', orgId)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { success: false, error: '找不到老师记录或不属于该机构' },
        { status: 404 }
      );
    }

    // 3. 更新老师记录，添加链接信息
    const identityData = identity as { user_email: string; user_id: string };
    const { error: updateError } = await ((supabase as any)
      .from('hanami_employee'))
      .update({
        linked_user_id: identityData.user_id,
        linked_user_email: identityData.user_email,
        sync_status: 'manual',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', teacherId);

    if (updateError) {
      console.error('更新老师记录失败:', updateError);
      return NextResponse.json(
        { success: false, error: '链接失败：' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '成功链接成员到老师资料',
      data: {
        teacherId,
        userId: identityData.user_id,
        userEmail: identityData.user_email,
      },
    });
  } catch (error) {
    console.error('链接成员到老师失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '链接失败' },
      { status: 500 }
    );
  }
}

/**
 * 取消链接
 * DELETE /api/members/link-teacher
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const orgId = searchParams.get('orgId');

    if (!teacherId || !orgId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：teacherId, orgId' },
        { status: 400 }
      );
    }

    // 验证老师记录是否属于该机构
    const { data: teacher, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, org_id')
      .eq('id', teacherId)
      .eq('org_id', orgId)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { success: false, error: '找不到老师记录或不属于该机构' },
        { status: 404 }
      );
    }

    // 清除链接信息
    const { error: updateError } = await ((supabase as any)
      .from('hanami_employee'))
      .update({
        linked_user_id: null,
        linked_user_email: null,
        sync_status: 'disabled',
        last_synced_at: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', teacherId);

    if (updateError) {
      console.error('取消链接失败:', updateError);
      return NextResponse.json(
        { success: false, error: '取消链接失败：' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '成功取消链接',
    });
  } catch (error) {
    console.error('取消链接失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '取消链接失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取链接状态
 * GET /api/members/link-teacher?identityId=xxx&orgId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identityId = searchParams.get('identityId');
    const teacherId = searchParams.get('teacherId');
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：orgId' },
        { status: 400 }
      );
    }

    const oldSupabase = getServerSupabaseClient();

    if (identityId) {
      // 通过 identityId 查找链接的老师
      const { data: identity, error: identityError } = await ((oldSupabase as any)
        .from('hanami_org_identities'))
        .select('user_email, user_id')
        .eq('id', identityId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (identityError || !identity) {
        return NextResponse.json({
          success: true,
          linked: false,
          data: null,
        });
      }

      // 查找链接的老师记录
      const identityData = identity as { user_email: string; user_id: string };
      const { data: teacher, error: teacherError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_nickname, teacher_email, linked_user_id, linked_user_email, sync_status, last_synced_at')
        .eq('linked_user_id', identityData.user_id)
        .eq('org_id', orgId)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        linked: !!teacher,
        data: teacher,
      });
    } else if (teacherId) {
      // 通过 teacherId 查找链接的成员
      const { data: teacher, error: teacherError } = await supabase
        .from('hanami_employee')
        .select('id, linked_user_id, linked_user_email, sync_status, last_synced_at')
        .eq('id', teacherId)
        .eq('org_id', orgId)
        .single();

      const typedTeacher = teacher as { id: string; linked_user_id: string | null; linked_user_email: string | null; sync_status: string | null; last_synced_at: string | null } | null;
      if (teacherError || !typedTeacher || !typedTeacher.linked_user_id) {
        return NextResponse.json({
          success: true,
          linked: false,
          data: null,
        });
      }

      // 查找链接的成员身份
      // 注意：hanami_org_identities 表使用 user_email 而不是 user_id
      // 需要先通过 user_id 查找 saas_users 获取 email，然后查找 identity
      const { data: identity, error: identityError } = await ((oldSupabase as any)
        .from('hanami_org_identities'))
        .select('id, user_email, role_type, status')
        .eq('user_email', typedTeacher.linked_user_email || '')
        .eq('org_id', orgId)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        linked: !!identity,
        data: {
          teacher,
          identity,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: '需要提供 identityId 或 teacherId' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('获取链接状态失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取链接状态失败' },
      { status: 500 }
    );
  }
}


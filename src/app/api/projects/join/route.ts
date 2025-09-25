import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProjectInviteForm } from '@/types/task-management';

// 加入項目
export async function POST(request: NextRequest) {
  try {
    const body: ProjectInviteForm = await request.json();
    
    // 驗證必填欄位
    if (!body.invite_code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // 查找項目
    const { data: project, error: projectError } = await supabase
      .from('hanami_projects')
      .select('*')
      .eq('invite_code', body.invite_code)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // 獲取當前用戶信息 (這裡需要從認證中獲取)
    // 暫時使用請求中的用戶信息
    const user_phone = request.headers.get('x-user-phone');
    
    if (!user_phone) {
      return NextResponse.json(
        { error: 'User phone is required' },
        { status: 400 }
      );
    }

    // 檢查是否已經是成員
    const { data: existingMember } = await supabase
      .from('hanami_project_members')
      .select('*')
      .eq('project_id', project.id)
      .eq('user_phone', user_phone)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      );
    }

    // 加入項目
    const { data: member, error: memberError } = await supabase
      .from('hanami_project_members')
      .insert([{
        project_id: project.id,
        user_phone: user_phone,
        role: body.role || 'member'
      }])
      .select()
      .single();

    if (memberError) {
      console.error('Error joining project:', memberError);
      return NextResponse.json(
        { error: 'Failed to join project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully joined project',
      project: project,
      member: member
    });

  } catch (error) {
    console.error('Error in POST /api/projects/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

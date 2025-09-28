import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Project, CreateProjectForm } from '@/types/task-management';

// 獲取項目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const is_public = searchParams.get('is_public');

    let query = supabase
      .from('hanami_projects')
      .select(`
        *,
        hanami_project_members(*)
      `);

    // 權限篩選
    if (phone) {
      query = query.or(`is_public.eq.true,owner_id.in.(SELECT id FROM saas_users WHERE phone = ${phone}),id.in.(SELECT project_id FROM hanami_project_members WHERE user_phone = ${phone})`);
    }

    if (is_public !== null) {
      query = query.eq('is_public', is_public === 'true');
    }

    query = query.order('created_at', { ascending: false });

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(projects || []);

  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 創建新項目
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectForm = await request.json();
    
    // 驗證必填欄位
    if (!body.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // 獲取當前用戶 ID (這裡需要從認證中獲取)
    // 暫時使用第一個用戶作為示例
    const { data: users } = await supabase
      .from('saas_users')
      .select('id')
      .limit(1);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 400 }
      );
    }

    const owner_id = users[0].id;

    // 創建項目
    const { data: project, error } = await supabase
      .from('hanami_projects')
      .insert([{
        name: body.name,
        description: body.description,
        is_public: body.is_public || false,
        owner_id: owner_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json(project, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


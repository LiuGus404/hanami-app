import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 獲取學生的成長樹列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '缺少學生ID參數' },
        { status: 400 }
      );
    }

    console.log('獲取學生成長樹列表:', studentId);

    // 查詢學生的成長樹
    const { data: studentTrees, error } = await supabase
      .from('hanami_student_trees')
      .select(`
        id,
        student_id,
        tree_id,
        start_date,
        status,
        tree_status,
        enrollment_date,
        completion_date,
        teacher_notes,
        created_at,
        updated_at,
        hanami_growth_trees (
          id,
          tree_name,
          tree_description,
          tree_icon,
          course_type_id,
          tree_level,
          is_active
        )
      `)
      .eq('student_id', studentId)
      .or('status.eq.active,tree_status.eq.active');

    if (error) {
      console.error('查詢學生成長樹失敗:', error);
      return NextResponse.json(
        { success: false, error: '查詢學生成長樹失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('學生成長樹資料:', studentTrees);

    return NextResponse.json({
      success: true,
      data: studentTrees || []
    });

  } catch (error) {
    console.error('獲取學生成長樹失敗:', error);
    return NextResponse.json(
      { success: false, error: '獲取學生成長樹失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// POST: 為學生新增成長樹
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, treeId, startDate, teacherNotes } = body;

    if (!studentId || !treeId) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數：studentId 和 treeId' },
        { status: 400 }
      );
    }

    console.log('為學生新增成長樹:', { studentId, treeId, startDate, teacherNotes });

    // 檢查學生是否已經有此成長樹
    const { data: existingTree, error: checkError } = await supabase
      .from('hanami_student_trees')
      .select('id')
      .eq('student_id', studentId)
      .eq('tree_id', treeId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是 "not found" 錯誤
      console.error('檢查現有成長樹失敗:', checkError);
      return NextResponse.json(
        { success: false, error: '檢查現有成長樹失敗', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingTree) {
      return NextResponse.json(
        { success: false, error: '學生已經擁有此成長樹' },
        { status: 400 }
      );
    }

    // 新增成長樹給學生
    const { data, error } = await supabase
      .from('hanami_student_trees')
      .insert({
        student_id: studentId,
        tree_id: treeId,
        start_date: startDate || new Date().toISOString().split('T')[0],
        status: 'active',
        tree_status: 'active',
        enrollment_date: new Date().toISOString().split('T')[0],
        teacher_notes: teacherNotes || null
      })
      .select(`
        id,
        student_id,
        tree_id,
        start_date,
        status,
        tree_status,
        enrollment_date,
        teacher_notes,
        hanami_growth_trees (
          id,
          tree_name,
          tree_description,
          tree_icon,
          course_type_id,
          tree_level,
          is_active
        )
      `)
      .single();

    if (error) {
      console.error('新增成長樹失敗:', error);
      return NextResponse.json(
        { success: false, error: '新增成長樹失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('新增成長樹成功:', data);

    return NextResponse.json({
      success: true,
      data: data,
      message: '成功新增成長樹'
    });

  } catch (error) {
    console.error('新增成長樹失敗:', error);
    return NextResponse.json(
      { success: false, error: '新增成長樹失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// PUT: 更新學生成長樹狀態
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentTreeId, status, teacherNotes } = body;

    if (!studentTreeId) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數：studentTreeId' },
        { status: 400 }
      );
    }

    console.log('更新學生成長樹狀態:', { studentTreeId, status, teacherNotes });

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      updateData.status = status;
      updateData.tree_status = status;
    }

    if (teacherNotes !== undefined) {
      updateData.teacher_notes = teacherNotes;
    }

    // 更新成長樹狀態
    const { data, error } = await supabase
      .from('hanami_student_trees')
      .update(updateData)
      .eq('id', studentTreeId)
      .select(`
        id,
        student_id,
        tree_id,
        start_date,
        status,
        tree_status,
        enrollment_date,
        completion_date,
        teacher_notes,
        updated_at,
        hanami_growth_trees (
          id,
          tree_name,
          tree_description,
          tree_icon,
          course_type_id,
          tree_level,
          is_active
        )
      `)
      .single();

    if (error) {
      console.error('更新成長樹狀態失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新成長樹狀態失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('更新成長樹狀態成功:', data);

    return NextResponse.json({
      success: true,
      data: data,
      message: '成功更新成長樹狀態'
    });

  } catch (error) {
    console.error('更新成長樹狀態失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新成長樹狀態失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// DELETE: 移除學生的成長樹
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentTreeId = searchParams.get('studentTreeId');

    if (!studentTreeId) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數：studentTreeId' },
        { status: 400 }
      );
    }

    console.log('移除學生成長樹:', studentTreeId);

    // 刪除成長樹關聯
    const { error } = await supabase
      .from('hanami_student_trees')
      .delete()
      .eq('id', studentTreeId);

    if (error) {
      console.error('移除成長樹失敗:', error);
      return NextResponse.json(
        { success: false, error: '移除成長樹失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('移除成長樹成功');

    return NextResponse.json({
      success: true,
      message: '成功移除成長樹'
    });

  } catch (error) {
    console.error('移除成長樹失敗:', error);
    return NextResponse.json(
      { success: false, error: '移除成長樹失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}




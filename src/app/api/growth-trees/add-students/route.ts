import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/growth-trees/add-students
 * 批量添加學生到成長樹（使用服務角色 key 繞過 RLS）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { treeId, studentIds, orgId } = body;

    if (!treeId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數：treeId 和 studentIds' },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數：orgId' },
        { status: 400 }
      );
    }

    console.log('[API] 批量添加學生到成長樹:', { treeId, studentIds, orgId });

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] 缺少 Supabase 環境變數');
      return NextResponse.json(
        { success: false, error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 檢查學生是否已經在此成長樹中（不限制 org_id，因為唯一約束是 student_id + tree_id）
    const { data: existingStudents, error: checkError } = await supabase
      .from('hanami_student_trees')
      .select('student_id, status, tree_status, org_id')
      .eq('tree_id', treeId)
      .in('student_id', studentIds);

    if (checkError) {
      console.error('[API] 檢查現有學生失敗:', checkError);
      return NextResponse.json(
        { success: false, error: '檢查現有學生失敗', details: checkError.message },
        { status: 500 }
      );
    }

    console.log('[API] 現有學生記錄:', existingStudents);
    
    const existingStudentIds = (existingStudents || []).map((s: any) => s.student_id || '').filter(Boolean);
    let newStudentIds = studentIds.filter((id: string) => !existingStudentIds.includes(id));
    
    // 檢查是否有記錄存在但 org_id 不匹配的情況
    const existingButWrongOrg = (existingStudents || []).filter((s: any) => 
      s.org_id !== orgId && existingStudentIds.includes(s.student_id)
    );
    
    if (existingButWrongOrg.length > 0) {
      console.warn('[API] 發現記錄存在但 org_id 不匹配:', existingButWrongOrg);
      // 這些記錄已經存在，我們不應該重複插入，但可以更新 org_id
      // 為了安全起見，我們先跳過這些，只處理真正新的記錄
    }

    if (newStudentIds.length === 0) {
      // 所有學生都已存在，檢查是否需要更新狀態
      const inactiveStudents = (existingStudents || []).filter((s: any) => 
        (s.status !== 'active' && s.tree_status !== 'active') || s.org_id !== orgId
      );
      
      if (inactiveStudents.length > 0) {
        // 更新非活躍或 org_id 不匹配的記錄
        const updateIds = inactiveStudents.map((s: any) => s.student_id);
        const today = new Date().toISOString().split('T')[0];
        
        const { error: updateError } = await supabase
          .from('hanami_student_trees')
          .update({
            status: 'active',
            tree_status: 'active',
            org_id: orgId,
            start_date: today,
            enrollment_date: today
          })
          .eq('tree_id', treeId)
          .in('student_id', updateIds);
        
        if (updateError) {
          console.error('[API] 更新現有記錄失敗:', updateError);
        } else {
          console.log('[API] 成功更新', updateIds.length, '條記錄為活躍狀態');
        }
      }
      
      return NextResponse.json({
        success: true,
        message: '所有選中的學生都已經在此成長樹中',
        addedCount: 0,
        skippedCount: studentIds.length,
        updatedCount: inactiveStudents.length
      });
    }

    // 驗證學生和成長樹是否存在
    console.log('[API] 驗證學生和成長樹是否存在...');
    
    // 驗證學生是否存在
    const { data: studentsData, error: studentsCheckError } = await supabase
      .from('Hanami_Students')
      .select('id, org_id')
      .in('id', newStudentIds)
      .eq('org_id', orgId);
    
    if (studentsCheckError) {
      console.error('[API] 驗證學生失敗:', studentsCheckError);
      return NextResponse.json(
        { success: false, error: '驗證學生失敗', details: studentsCheckError.message },
        { status: 500 }
      );
    }
    
    const validStudentIds = (studentsData || []).map((s: any) => s.id).filter(Boolean);
    if (validStudentIds.length !== newStudentIds.length) {
      const invalidIds = newStudentIds.filter(id => !validStudentIds.includes(id));
      console.warn('[API] 部分學生ID無效:', invalidIds);
      return NextResponse.json(
        { success: false, error: '部分學生ID無效或不在該機構中', invalidIds },
        { status: 400 }
      );
    }
    
    // 驗證成長樹是否存在
    const { data: treeData, error: treeCheckError } = await supabase
      .from('hanami_growth_trees')
      .select('id, org_id')
      .eq('id', treeId)
      .eq('org_id', orgId)
      .single();
    
    if (treeCheckError || !treeData) {
      console.error('[API] 驗證成長樹失敗:', treeCheckError);
      return NextResponse.json(
        { success: false, error: '成長樹不存在或不在該機構中', details: treeCheckError?.message },
        { status: 400 }
      );
    }
    
    console.log('[API] 驗證通過，開始插入數據...');
    
    // 在插入前再次檢查，避免並發問題
    const { data: finalCheck, error: finalCheckError } = await supabase
      .from('hanami_student_trees')
      .select('student_id')
      .eq('tree_id', treeId)
      .in('student_id', newStudentIds);
    
    if (finalCheckError) {
      console.warn('[API] 最終檢查失敗，但繼續插入:', finalCheckError);
    } else {
      const finalExistingIds = (finalCheck || []).map((s: any) => s.student_id || '').filter(Boolean);
      if (finalExistingIds.length > 0) {
        console.log('[API] 最終檢查發現', finalExistingIds.length, '個學生已存在，將跳過');
        const trulyNewIds = newStudentIds.filter((id: string) => !finalExistingIds.includes(id));
        if (trulyNewIds.length === 0) {
          return NextResponse.json({
            success: true,
            message: '所有選中的學生都已經在此成長樹中（最終檢查）',
            addedCount: 0,
            skippedCount: studentIds.length
          });
        }
        // 只插入真正新的學生
        newStudentIds = trulyNewIds;
      }
    }

    // 批量添加新學生到成長樹
    const today = new Date().toISOString().split('T')[0];
    const insertData = newStudentIds.map((studentId: string) => ({
      student_id: studentId,
      tree_id: treeId,
      org_id: orgId,
      start_date: today,
      enrollment_date: today,
      status: 'active',
      tree_status: 'active'
    }));

    console.log('[API] 插入數據:', JSON.stringify(insertData, null, 2));

    // 使用 upsert 來處理可能的重複（但應該不會發生，因為我們已經檢查過了）
    const { data, error: insertError } = await supabase
      .from('hanami_student_trees')
      .insert(insertData)
      .select('id, student_id, tree_id');

    if (insertError) {
      console.error('[API] 插入失敗:', insertError);
      console.error('[API] 插入錯誤詳情:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: '添加學生失敗', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    console.log('[API] 成功添加學生到成長樹:', data);

    return NextResponse.json({
      success: true,
      message: `成功添加 ${newStudentIds.length} 位學生到成長樹`,
      data: data,
      addedCount: newStudentIds.length,
      skippedCount: existingStudentIds.length
    });

  } catch (error: any) {
    console.error('[API] 批量添加學生失敗:', error);
    return NextResponse.json(
      { success: false, error: '批量添加學生失敗', details: error?.message || '未知錯誤' },
      { status: 500 }
    );
  }
}


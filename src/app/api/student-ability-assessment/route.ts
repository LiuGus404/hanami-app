import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到 API 請求:', body);

    const {
      student_id,
      tree_id,
      assessment_date,
      lesson_date,
      teacher_id,
      ability_assessments,
      overall_performance_rating,
      general_notes,
      next_lesson_focus,
      notes,
      goals,
      org_id
    } = body;

    // 驗證必要欄位
    if (!student_id || !tree_id || !assessment_date || !lesson_date) {
      return NextResponse.json({
        success: false,
        error: '缺少必要欄位: student_id, tree_id, assessment_date, lesson_date'
      }, { status: 400 });
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json({
        success: false,
        error: '服務器配置錯誤'
      }, { status: 500 });
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 檢查是否已存在該日期的評估記錄
    const { data: existingAssessmentData, error: checkError } = await ((supabase as any)
      .from('hanami_ability_assessments')
      .select('id')
      .eq('student_id', student_id)
      .eq('tree_id', tree_id)
      .eq('assessment_date', assessment_date)
      .maybeSingle());

    const existingAssessment = existingAssessmentData as { id: string } | null;

    if (checkError) {
      console.error('檢查現有評估記錄時出錯:', checkError);
      return NextResponse.json({
        success: false,
        error: '檢查現有評估記錄時出錯: ' + checkError.message
      }, { status: 500 });
    }

    // 如果沒有提供 org_id，從學生記錄中獲取
    let finalOrgId = org_id;
    if (!finalOrgId) {
      const { data: studentDataRaw } = await ((supabase as any)
        .from('Hanami_Students')
        .select('org_id')
        .eq('id', student_id)
        .single());
      
      const studentData = studentDataRaw as { org_id: string } | null;
      
      if (studentData?.org_id) {
        finalOrgId = studentData.org_id;
      }
    }

    let assessmentId: string;
    let updateData: any = {
      student_id,
      tree_id,
      assessment_date,
      lesson_date,
      teacher_id: teacher_id || null,
      ability_assessments: ability_assessments || {},
      overall_performance_rating: overall_performance_rating || 3,
      general_notes: general_notes || notes || null,
      next_lesson_focus: next_lesson_focus || null,
      selected_goals: goals || [],
      updated_at: new Date().toISOString()
    };

    // 如果有 org_id，添加到更新數據中
    if (finalOrgId) {
      updateData.org_id = finalOrgId;
    }

    if (existingAssessment) {
      // 更新現有記錄
      console.log('更新現有評估記錄:', existingAssessment.id);
      
      const { data: updatedAssessment, error: updateError } = await (supabase as any)
        .from('hanami_ability_assessments')
        .update(updateData)
        .eq('id', existingAssessment.id)
        .select()
        .single();

      if (updateError) {
        console.error('更新評估記錄時出錯:', updateError);
        return NextResponse.json({
          success: false,
          error: '更新評估記錄時出錯: ' + updateError.message
        }, { status: 500 });
      }

      assessmentId = existingAssessment.id;
    } else {
      // 創建新記錄
      console.log('創建新評估記錄');
      
      const { data: newAssessmentData, error: insertError } = await ((supabase as any)
        .from('hanami_ability_assessments')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        } as any)
        .select()
        .single());

      if (insertError || !newAssessmentData) {
        console.error('創建評估記錄時出錯:', insertError);
        return NextResponse.json({
          success: false,
          error: '創建評估記錄時出錯: ' + (insertError?.message || '未知錯誤')
        }, { status: 500 });
      }

      const newAssessment = newAssessmentData as { id: string };
      assessmentId = newAssessment.id;
    }

    // 學習目標評估已經包含在 selected_goals 欄位中
    console.log('📋 學習目標評估已儲存在 selected_goals 欄位:', {
      goalCount: goals?.length || 0,
      goals: goals || []
    });

    // 獲取更新後的完整評估記錄（分別查詢避免 RLS 遞歸）
    const { data: finalAssessmentData, error: fetchError } = await ((supabase as any)
      .from('hanami_ability_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single());

    if (fetchError || !finalAssessmentData) {
      console.error('獲取最終評估記錄時出錯:', fetchError);
      return NextResponse.json({
        success: false,
        error: '獲取最終評估記錄時出錯: ' + (fetchError?.message || '未知錯誤')
      }, { status: 500 });
    }

    const finalAssessment = finalAssessmentData as any;

    // 分別查詢學生和成長樹資料
    const [studentResult, treeResult] = await Promise.all([
      (supabase as any)
        .from('Hanami_Students')
        .select('full_name, nick_name, course_type')
        .eq('id', student_id)
        .single(),
      (supabase as any)
        .from('hanami_growth_trees')
        .select('tree_name, tree_description')
        .eq('id', tree_id)
        .single()
    ]);

    // 組合最終結果
    const finalAssessmentWithRelations = {
      ...finalAssessment,
      student: studentResult.data || null,
      tree: treeResult.data || null
    };

    console.log('✅ 評估記錄處理成功:', finalAssessmentWithRelations);

    return NextResponse.json({
      success: true,
      data: finalAssessmentWithRelations,
      message: existingAssessment ? '評估記錄已更新' : '評估記錄已創建'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const treeId = searchParams.get('tree_id');
    const date = searchParams.get('date');

    if (!studentId || !treeId || !date) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數: student_id, tree_id, date'
      }, { status: 400 });
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json({
        success: false,
        error: '服務器配置錯誤'
      }, { status: 500 });
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 分別查詢評估記錄、學生和成長樹資料（避免 RLS 遞歸）
    const { data: assessmentData, error } = await ((supabase as any)
      .from('hanami_ability_assessments')
      .select('*')
      .eq('student_id', studentId)
      .eq('tree_id', treeId)
      .eq('assessment_date', date)
      .maybeSingle());

    if (error) {
      console.error('獲取評估記錄時出錯:', error);
      return NextResponse.json({
        success: false,
        error: '獲取評估記錄時出錯: ' + error.message
      }, { status: 500 });
    }

    if (!assessmentData) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '未找到評估記錄'
      });
    }

    const assessment = assessmentData as any;

    // 分別查詢學生和成長樹資料
    const [studentResult, treeResult] = await Promise.all([
      (supabase as any)
        .from('Hanami_Students')
        .select('full_name, nick_name, course_type')
        .eq('id', studentId)
        .single(),
      (supabase as any)
        .from('hanami_growth_trees')
        .select('tree_name, tree_description')
        .eq('id', treeId)
        .single()
    ]);

    // 組合最終結果
    const assessmentWithRelations = {
      ...assessment,
      student: studentResult.data || null,
      tree: treeResult.data || null
    };

    return NextResponse.json({
      success: true,
      data: assessmentWithRelations
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

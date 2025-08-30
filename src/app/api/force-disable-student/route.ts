import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建具有更高權限的 Supabase 客戶端
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 使用 service role key 來繞過 RLS
);

export async function POST(request: NextRequest) {
  try {
    const { studentIds, action = 'disable' } = await request.json();
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少有效的學生ID'
      }, { status: 400 });
    }

    console.log(`${action === 'delete' ? '強制刪除' : '強制停用'}學生，ID:`, studentIds);

    // 步驟1：使用管理員權限強制刪除所有相關記錄
    console.log('步驟1：強制刪除所有相關記錄');
    
    const relatedTables = [
      'hanami_ability_assessments',
      'hanami_student_lesson',
      'Hanami_Student_Package',
      'hanami_student_activities',
      'hanami_student_lesson_activities',
      'hanami_student_trees',
      'hanami_ai_message_logs',
      'hanami_parent_student_links',
      'hanami_student_media',
      'hanami_student_media_quota',
      'hanami_student_progress',
      'hanami_student_abilities',
      'hanami_ability_assessment_history'
    ];

    for (const tableName of relatedTables) {
      try {
        console.log(`刪除 ${tableName} 表中的相關記錄`);
        
        const { error: deleteError } = await supabaseAdmin
          .from(tableName)
          .delete()
          .in('student_id', studentIds);
        
        if (deleteError) {
          console.error(`${tableName} 刪除失敗:`, deleteError);
        } else {
          console.log(`${tableName} 刪除成功`);
        }
      } catch (error) {
        console.error(`處理 ${tableName} 時發生錯誤:`, error);
      }
    }

    // 步驟2：根據動作類型處理學生記錄
    if (action === 'delete') {
      // 刪除學生記錄
      console.log('步驟2：刪除學生記錄');
      
      const { error: deleteError } = await supabaseAdmin
        .from('Hanami_Students')
        .delete()
        .in('id', studentIds);
      
      if (deleteError) {
        console.error('刪除學生記錄失敗:', deleteError);
        return NextResponse.json({
          success: false,
          error: `刪除學生記錄失敗: ${deleteError.message}`,
          details: deleteError
        }, { status: 500 });
      }

      console.log('成功刪除學生記錄');
    } else {
      // 停用學生記錄
      console.log('步驟2：更新學生類型為已停用');
      
      const { error: updateError } = await supabaseAdmin
        .from('Hanami_Students')
        .update({ 
          student_type: '已停用'
        })
        .in('id', studentIds);
      
      if (updateError) {
        console.error('更新學生類型失敗:', updateError);
        return NextResponse.json({
          success: false,
          error: `更新學生類型失敗: ${updateError.message}`,
          details: updateError
        }, { status: 500 });
      }

      console.log('成功將學生標記為已停用');
    }

    const actionText = action === 'delete' ? '刪除' : '停用';
    return NextResponse.json({
      success: true,
      message: `成功${actionText} ${studentIds.length} 位學生`
    });

  } catch (error) {
    console.error('強制處理學生時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: `強制處理學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
    }, { status: 500 });
  }
}

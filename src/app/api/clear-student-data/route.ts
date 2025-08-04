import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始清理 student 資料...');

    // 1. 先查看要清理的資料
    const { data: studentsToClean, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email, student_password')
      .or('student_email.not.is.null,student_password.not.is.null');

    if (studentsError) {
      console.error('查詢學生資料錯誤:', studentsError);
      return NextResponse.json({
        success: false,
        error: '查詢學生資料失敗'
      }, { status: 500 });
    }

    console.log(`找到 ${studentsToClean?.length || 0} 個學生記錄需要清理`);

    // 2. 更新 Hanami_Students 表
    const { error: updateError } = await supabase
      .from('Hanami_Students')
      .update({
        student_email: null,
        student_password: null,
        updated_at: new Date().toISOString()
      })
      .or('student_email.not.is.null,student_password.not.is.null');

    if (updateError) {
      console.error('更新學生資料錯誤:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新學生資料失敗'
      }, { status: 500 });
    }

    // 3. 找出要刪除的權限記錄
    const studentEmails = studentsToClean
      ?.filter(s => s.student_email)
      .map(s => s.student_email)
      .filter(Boolean) || [];

    if (studentEmails.length > 0) {
      const { data: permissionsToDelete, error: permissionsError } = await supabase
        .from('hanami_user_permissions_v2')
        .select('id, user_email, role_id')
        .in('user_email', studentEmails);

      if (permissionsError) {
        console.error('查詢權限記錄錯誤:', permissionsError);
        return NextResponse.json({
          success: false,
          error: '查詢權限記錄失敗'
        }, { status: 500 });
      }

      console.log(`找到 ${permissionsToDelete?.length || 0} 個權限記錄需要刪除`);

      // 4. 刪除權限記錄
      if (permissionsToDelete && permissionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('hanami_user_permissions_v2')
          .delete()
          .in('user_email', studentEmails);

        if (deleteError) {
          console.error('刪除權限記錄錯誤:', deleteError);
          return NextResponse.json({
            success: false,
            error: '刪除權限記錄失敗'
          }, { status: 500 });
        }
      }
    }

    // 5. 驗證清理結果
    const { data: remainingStudents, error: remainingError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .or('student_email.not.is.null,student_password.not.is.null');

    const { count: remainingPermissions } = await supabase
      .from('hanami_user_permissions_v2')
      .select('*', { count: 'exact', head: true });

    console.log('清理完成');

    return NextResponse.json({
      success: true,
      message: '清理完成',
      summary: {
        studentsCleaned: studentsToClean?.length || 0,
        permissionsDeleted: studentEmails.length,
        remainingStudentsWithStudentData: remainingStudents?.length || 0,
        remainingPermissions: remainingPermissions || 0
      }
    });

  } catch (error: any) {
    console.error('清理 student 資料時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '清理過程中發生未知錯誤'
    }, { status: 500 });
  }
} 
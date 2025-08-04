import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始清理試堂學生資料...');

    // 1. 先查看要清理的資料
    const { data: trialStudentsToClean, error: studentsError } = await supabase
      .from('hanami_trial_students')
      .select('id, full_name, student_email, student_password')
      .or('student_email.not.is.null,student_password.not.is.null');

    if (studentsError) {
      console.error('查詢試堂學生資料錯誤:', studentsError);
      return NextResponse.json({
        success: false,
        error: '查詢試堂學生資料失敗'
      }, { status: 500 });
    }

    console.log(`找到 ${trialStudentsToClean?.length || 0} 個試堂學生記錄需要清理`);

    // 2. 更新 hanami_trial_students 表
    const { error: updateError } = await supabase
      .from('hanami_trial_students')
      .update({
        student_email: null,
        student_password: null,
        updated_at: new Date().toISOString()
      })
      .or('student_email.not.is.null,student_password.not.is.null');

    if (updateError) {
      console.error('更新試堂學生資料錯誤:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新試堂學生資料失敗'
      }, { status: 500 });
    }

    // 3. 找出要刪除的權限記錄
    const trialStudentEmails = trialStudentsToClean
      ?.filter(s => s.student_email)
      .map(s => s.student_email)
      .filter(Boolean) || [];

    if (trialStudentEmails.length > 0) {
      const { data: permissionsToDelete, error: permissionsError } = await supabase
        .from('hanami_user_permissions_v2')
        .select('id, user_email, role_id')
        .in('user_email', trialStudentEmails);

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
          .in('user_email', trialStudentEmails);

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
    const { data: remainingTrialStudents, error: remainingError } = await supabase
      .from('hanami_trial_students')
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
        trialStudentsCleaned: trialStudentsToClean?.length || 0,
        permissionsDeleted: trialStudentEmails.length,
        remainingTrialStudentsWithStudentData: remainingTrialStudents?.length || 0,
        remainingPermissions: remainingPermissions || 0
      }
    });

  } catch (error: any) {
    console.error('清理試堂學生資料時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '清理過程中發生未知錯誤'
    }, { status: 500 });
  }
} 
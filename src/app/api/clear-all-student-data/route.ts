import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始清理所有學生資料...');

    // 1. 先查看要清理的資料
    const { data: regularStudentsToClean, error: regularStudentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email, student_password')
      .or('student_email.not.is.null,student_password.not.is.null');

    if (regularStudentsError) {
      console.error('查詢正式學生資料錯誤:', regularStudentsError);
      return NextResponse.json({
        success: false,
        error: '查詢正式學生資料失敗'
      }, { status: 500 });
    }

    const { data: trialStudentsToClean, error: trialStudentsError } = await supabase
      .from('hanami_trial_students')
      .select('id, full_name, student_email, student_password')
      .or('student_email.not.is.null,student_password.not.is.null');

    if (trialStudentsError) {
      console.error('查詢試堂學生資料錯誤:', trialStudentsError);
      return NextResponse.json({
        success: false,
        error: '查詢試堂學生資料失敗'
      }, { status: 500 });
    }

    console.log(`找到 ${regularStudentsToClean?.length || 0} 個正式學生記錄需要清理`);
    console.log(`找到 ${trialStudentsToClean?.length || 0} 個試堂學生記錄需要清理`);

    // 2. 更新 Hanami_Students 表
    const { error: updateRegularError } = await supabase
      .from('Hanami_Students')
      .update({
        student_email: null,
        student_password: null,
        updated_at: new Date().toISOString()
      })
      .or('student_email.not.is.null,student_password.not.is.null');

    if (updateRegularError) {
      console.error('更新正式學生資料錯誤:', updateRegularError);
      return NextResponse.json({
        success: false,
        error: '更新正式學生資料失敗'
      }, { status: 500 });
    }

    // 3. 更新 hanami_trial_students 表
    const { error: updateTrialError } = await supabase
      .from('hanami_trial_students')
      .update({
        student_email: null,
        student_password: null,
        updated_at: new Date().toISOString()
      })
      .or('student_email.not.is.null,student_password.not.is.null');

    if (updateTrialError) {
      console.error('更新試堂學生資料錯誤:', updateTrialError);
      return NextResponse.json({
        success: false,
        error: '更新試堂學生資料失敗'
      }, { status: 500 });
    }

    // 4. 收集所有要刪除的 email
    const allStudentEmails = [
      ...(regularStudentsToClean?.filter(s => s.student_email).map(s => s.student_email) || []),
      ...(trialStudentsToClean?.filter(s => s.student_email).map(s => s.student_email) || [])
    ].filter(Boolean);

    console.log(`總共需要清理 ${allStudentEmails.length} 個 email`);

    // 5. 刪除權限記錄
    if (allStudentEmails.length > 0) {
      const { data: permissionsToDelete, error: permissionsError } = await supabase
        .from('hanami_user_permissions_v2')
        .select('id, user_email, role_id')
        .in('user_email', allStudentEmails);

      if (permissionsError) {
        console.error('查詢權限記錄錯誤:', permissionsError);
        return NextResponse.json({
          success: false,
          error: '查詢權限記錄失敗'
        }, { status: 500 });
      }

      console.log(`找到 ${permissionsToDelete?.length || 0} 個權限記錄需要刪除`);

      if (permissionsToDelete && permissionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('hanami_user_permissions_v2')
          .delete()
          .in('user_email', allStudentEmails);

        if (deleteError) {
          console.error('刪除權限記錄錯誤:', deleteError);
          return NextResponse.json({
            success: false,
            error: '刪除權限記錄失敗'
          }, { status: 500 });
        }
      }
    }

    // 6. 驗證清理結果
    const { data: remainingRegularStudents } = await supabase
      .from('Hanami_Students')
      .select('id')
      .or('student_email.not.is.null,student_password.not.is.null');

    const { data: remainingTrialStudents } = await supabase
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
        regularStudentsCleaned: regularStudentsToClean?.length || 0,
        trialStudentsCleaned: trialStudentsToClean?.length || 0,
        permissionsDeleted: allStudentEmails.length,
        remainingRegularStudentsWithStudentData: remainingRegularStudents?.length || 0,
        remainingTrialStudentsWithStudentData: remainingTrialStudents?.length || 0,
        remainingPermissions: remainingPermissions || 0
      }
    });

  } catch (error: any) {
    console.error('清理所有學生資料時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '清理過程中發生未知錯誤'
    }, { status: 500 });
  }
} 
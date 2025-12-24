import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient, getServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { studentId, studentName, studentOid, institution, bindingType, notes, parentId } = await request.json();

    // 驗證必要參數
    if (!parentId) {
      return NextResponse.json({ error: '缺少家長 ID' }, { status: 400 });
    }

    if (!studentId || !studentName) {
      return NextResponse.json({ error: '缺少學生信息' }, { status: 400 });
    }

    const saasSupabase = getSaasServerSupabaseClient();

    // 檢查是否已經綁定
    const { data: existingBinding, error: checkError } = await saasSupabase
      .from('parent_student_bindings')
      .select('id')
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
      .single();

    // 如果表不存在，返回友好錯誤
    if (checkError && checkError.code === '42P01') {
      console.error('資料庫表不存在:', checkError);
      return NextResponse.json({
        error: '資料庫表尚未創建，請聯繫管理員'
      }, { status: 503 });
    }

    if (existingBinding) {
      return NextResponse.json({
        success: false,
        error: '此學習記錄已經綁定到您的帳戶'
      });
    }

    // 創建綁定記錄
    const { data: binding, error: insertError } = await (saasSupabase
      .from('parent_student_bindings') as any)
      .insert({
        parent_id: parentId,
        student_id: studentId,
        student_name: studentName,
        student_oid: studentOid,
        institution: institution || 'Hanami Music',
        binding_type: bindingType || 'parent',
        binding_status: 'active',
        notes: notes || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error('綁定學習記錄錯誤:', insertError);
      return NextResponse.json({
        error: '綁定失敗，請稍後再試'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      binding,
      message: '學習記錄綁定成功！'
    });

  } catch (error) {
    console.error('綁定學習記錄 API 錯誤:', error);
    return NextResponse.json({
      error: '服務器錯誤'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: '缺少家長 ID' }, { status: 400 });
    }

    const saasSupabase = getSaasServerSupabaseClient();
    const mainSupabase = getServerSupabaseClient();

    // 獲取已綁定的學習記錄列表
    const { data: bindings, error } = await saasSupabase
      .from('parent_student_bindings')
      .select('*')
      .eq('parent_id', parentId)
      .eq('binding_status', 'active')
      .order('last_accessed', { ascending: false });

    // 如果表不存在，返回空列表
    if (error && error.code === '42P01') {
      console.error('資料庫表不存在:', error);
      return NextResponse.json({
        success: true,
        bindings: []
      });
    }

    if (error) {
      console.error('獲取綁定學習記錄錯誤:', error);
      return NextResponse.json({
        error: '獲取綁定學習記錄失敗'
      }, { status: 500 });
    }

    // 如果有綁定資料，從學生表中獲取完整的學生資訊（包括年齡）
    if (bindings && bindings.length > 0) {
      const studentIds = bindings.map((binding: any) => binding.student_id);

      // 從主要學生資料庫獲取學生詳細資訊
      const { data: studentsData, error: studentsError } = await ((mainSupabase as any)
        .from('Hanami_Students')
        .select('id, full_name, student_age, student_dob, course_type, student_oid')
        .in('id', studentIds));

      if (studentsError) {
        console.error('獲取學生詳細資訊錯誤:', studentsError);
      }

      // 合併綁定資料和學生詳細資訊
      const enrichedBindings = bindings.map((binding: any) => {
        const studentInfo: any = studentsData?.find((s: any) => s.id === binding.student_id);

        // 計算月齡
        let ageInMonths = null;
        if (studentInfo?.student_dob) {
          const birthDate = new Date(studentInfo.student_dob);
          const now = new Date();
          const years = now.getFullYear() - birthDate.getFullYear();
          const months = now.getMonth() - birthDate.getMonth();
          const days = now.getDate() - birthDate.getDate();

          let totalMonths = years * 12 + months;
          if (days < 0) {
            totalMonths -= 1;
          }
          ageInMonths = Math.max(0, totalMonths);
        } else if (studentInfo?.student_age) {
          // 如果有直接的年齡資料，嘗試轉換
          const age = typeof studentInfo.student_age === 'string' ? parseInt(studentInfo.student_age) : studentInfo.student_age;
          if (!isNaN(age)) {
            ageInMonths = age;
          }
        }

        return {
          ...binding,
          student_age_months: ageInMonths,
          student_course_type: studentInfo?.course_type || null,
          student_full_name: studentInfo?.full_name || binding.student_name
        };
      });

      return NextResponse.json({
        success: true,
        bindings: enrichedBindings
      });
    }

    return NextResponse.json({
      success: true,
      bindings
    });

  } catch (error) {
    console.error('獲取綁定學習記錄 API 錯誤:', error);
    return NextResponse.json({
      error: '服務器錯誤'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bindingId = searchParams.get('bindingId');
    const parentId = searchParams.get('parentId');

    if (!bindingId) {
      return NextResponse.json({ error: '缺少綁定 ID' }, { status: 400 });
    }

    if (!parentId) {
      return NextResponse.json({ error: '缺少家長 ID' }, { status: 400 });
    }

    const saasSupabase = getSaasServerSupabaseClient();

    // 刪除綁定記錄
    const { error } = await saasSupabase
      .from('parent_student_bindings')
      .delete()
      .eq('id', bindingId)
      .eq('parent_id', parentId);

    if (error) {
      console.error('取消綁定錯誤:', error);
      return NextResponse.json({
        error: '取消綁定失敗'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '取消綁定成功'
    });

  } catch (error) {
    console.error('取消綁定 API 錯誤:', error);
    return NextResponse.json({
      error: '服務器錯誤'
    }, { status: 500 });
  }
}

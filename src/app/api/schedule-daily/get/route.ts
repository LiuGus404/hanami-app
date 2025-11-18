import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scheduleTemplateId = searchParams.get('scheduleTemplateId');
    const lessonDate = searchParams.get('lessonDate');
    const orgId = searchParams.get('orgId');

    if (!scheduleTemplateId || !lessonDate || !orgId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數：scheduleTemplateId, lessonDate, orgId'
      }, { status: 400 });
    }

    // 使用服務角色 key 繞過 RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 查詢記錄
    const { data: dailySchedule, error: dailyError } = await supabase
      .from('hanami_schedule_daily')
      .select('teacher_main_id, teacher_assist_id')
      .eq('schedule_template_id', scheduleTemplateId)
      .eq('lesson_date', lessonDate)
      .eq('org_id', orgId)
      .maybeSingle();

    if (dailyError) {
      console.error('查詢 schedule_daily 失敗:', dailyError);
      return NextResponse.json({
        success: false,
        error: `查詢失敗: ${dailyError.message}`
      }, { status: 500 });
    }

    // 如果找到記錄，獲取老師信息
    let teacherMainName = '';
    let teacherAssistName = '';

    if (dailySchedule) {
      // 獲取主教資訊
      if (dailySchedule.teacher_main_id) {
        const { data: mainTeacher, error: mainError } = await supabase
          .from('hanami_employee')
          .select('teacher_fullname, teacher_nickname')
          .eq('id', dailySchedule.teacher_main_id)
          .eq('org_id', orgId)
          .maybeSingle();

        if (!mainError && mainTeacher) {
          teacherMainName = mainTeacher.teacher_fullname || mainTeacher.teacher_nickname || '';
        }
      }

      // 獲取助教資訊
      if (dailySchedule.teacher_assist_id) {
        const { data: assistTeacher, error: assistError } = await supabase
          .from('hanami_employee')
          .select('teacher_fullname, teacher_nickname')
          .eq('id', dailySchedule.teacher_assist_id)
          .eq('org_id', orgId)
          .maybeSingle();

        if (!assistError && assistTeacher) {
          teacherAssistName = assistTeacher.teacher_fullname || assistTeacher.teacher_nickname || '';
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        teacher_main_id: dailySchedule?.teacher_main_id || null,
        teacher_assist_id: dailySchedule?.teacher_assist_id || null,
        teacher_main_name: teacherMainName,
        teacher_assist_name: teacherAssistName,
      }
    });
  } catch (error) {
    console.error('查詢老師信息時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}


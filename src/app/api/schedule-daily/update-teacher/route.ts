import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服務端客戶端來繞過 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scheduleTemplateId,
      lessonDate,
      teacherId,
      teacherRole,
      orgId
    } = body;

    if (!scheduleTemplateId || !lessonDate || !orgId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數：scheduleTemplateId, lessonDate, orgId'
      }, { status: 400 });
    }

    if (!teacherRole || !['main', 'assist'].includes(teacherRole)) {
      return NextResponse.json({
        success: false,
        error: 'teacherRole 必須是 "main" 或 "assist"'
      }, { status: 400 });
    }

    // 使用服務角色 key 繞過 RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 準備更新數據，確保包含 org_id
    const updateData: any = {
      [teacherRole === 'main' ? 'teacher_main_id' : 'teacher_assist_id']: teacherId,
      updated_at: new Date().toISOString(),
      org_id: orgId, // 確保 org_id 被寫入
    };

    // 先查詢記錄是否存在
    const { data: existingRecord, error: queryError } = await supabase
      .from('hanami_schedule_daily')
      .select('id, org_id')
      .eq('schedule_template_id', scheduleTemplateId)
      .eq('lesson_date', lessonDate)
      .maybeSingle();

    if (queryError) {
      console.error('查詢現有記錄失敗:', queryError);
      return NextResponse.json({
        success: false,
        error: `查詢記錄失敗: ${queryError.message}`
      }, { status: 500 });
    }

    if (existingRecord) {
      // 記錄存在，更新它
      const { data: updatedRecord, error: updateError } = await supabase
        .from('hanami_schedule_daily')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('更新記錄失敗:', updateError);
        return NextResponse.json({
          success: false,
          error: `更新記錄失敗: ${updateError.message}`
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: updatedRecord,
        message: '老師信息更新成功'
      });
    } else {
      // 記錄不存在，需要從模板獲取必要信息後創建新記錄
      // 首先查詢 hanami_schedule 模板以獲取 timeslot 和 duration 等必要字段
      const { data: scheduleTemplate, error: templateError } = await supabase
        .from('hanami_schedule')
        .select('timeslot, duration, course_code, course_section, course_type, weekday, max_students, room_id')
        .eq('id', scheduleTemplateId)
        .maybeSingle();

      if (templateError) {
        console.error('查詢課程模板失敗:', templateError);
        return NextResponse.json({
          success: false,
          error: `查詢課程模板失敗: ${templateError.message}`
        }, { status: 500 });
      }

      if (!scheduleTemplate) {
        return NextResponse.json({
          success: false,
          error: '未找到對應的課程模板'
        }, { status: 404 });
      }

      // 使用模板中的 timeslot 作為 start_time
      const startTime = scheduleTemplate.timeslot || '00:00';

      // 解析 duration（格式可能是 HH:mm:ss 或 HH:mm 或分鐘數）
      let durationMinutes = 45; // 預設 45 分鐘
      if (scheduleTemplate.duration) {
        const durationStr = String(scheduleTemplate.duration);
        if (durationStr.includes(':')) {
          // 格式: "01:00:00" 或 "01:00"
          const parts = durationStr.split(':').map(Number);
          durationMinutes = parts[0] * 60 + (parts[1] || 0);
        } else {
          // 假設是分鐘數
          durationMinutes = parseInt(durationStr) || 45;
        }
      }

      // 計算 end_time
      let endTime = startTime;
      try {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + durationMinutes;
        endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
      } catch {
        endTime = startTime;
      }

      const insertData = {
        schedule_template_id: scheduleTemplateId,
        lesson_date: lessonDate,
        org_id: orgId,
        start_time: startTime,
        end_time: endTime,
        [teacherRole === 'main' ? 'teacher_main_id' : 'teacher_assist_id']: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newRecord, error: insertError } = await supabase
        .from('hanami_schedule_daily')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('創建記錄失敗:', insertError);
        return NextResponse.json({
          success: false,
          error: `創建課堂記錄失敗: ${insertError.message}`
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: newRecord,
        message: '已創建課堂記錄並設置老師'
      });
    }
  } catch (error) {
    console.error('更新老師信息時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}


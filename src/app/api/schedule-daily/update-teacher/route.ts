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
      // 記錄不存在，這不應該發生，因為應該先有 schedule_daily 記錄
      // 但為了完整性，我們返回錯誤
      return NextResponse.json({
        success: false,
        error: '未找到對應的課堂記錄，請先創建課堂排程'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('更新老師信息時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}


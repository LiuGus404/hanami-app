import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    console.log('測試教師排程查詢，教師ID:', teacherId);

    // 1. 檢查 teacher_schedule 表是否存在
    console.log('1. 檢查 teacher_schedule 表...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('teacher_schedule')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('teacher_schedule 表檢查失敗:', tableError);
      return NextResponse.json({
        success: false,
        error: 'teacher_schedule 表不存在或無法訪問',
        details: tableError.message
      }, { status: 500 });
    }

    console.log('✅ teacher_schedule 表存在');

    // 2. 查詢所有教師排程記錄
    console.log('2. 查詢所有教師排程記錄...');
    const { data: allSchedules, error: allError } = await supabase
      .from('teacher_schedule')
      .select('*')
      .limit(10);

    if (allError) {
      console.error('查詢所有排程失敗:', allError);
      return NextResponse.json({
        success: false,
        error: '查詢所有排程失敗',
        details: allError.message
      }, { status: 500 });
    }

    console.log(`✅ 找到 ${allSchedules?.length || 0} 條排程記錄`);

    // 3. 如果提供了教師ID，查詢特定教師的排程
    let teacherSchedules: any[] = [];
    if (teacherId) {
      console.log('3. 查詢特定教師排程...');
      const { data: specificSchedules, error: specificError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .eq('teacher_id', teacherId);

      if (specificError) {
        console.error('查詢特定教師排程失敗:', specificError);
        return NextResponse.json({
          success: false,
          error: '查詢特定教師排程失敗',
          details: specificError.message
        }, { status: 500 });
      }

      teacherSchedules = specificSchedules || [];
      console.log(`✅ 教師 ${teacherId} 有 ${teacherSchedules.length} 條排程記錄`);
    }

    // 4. 檢查日期範圍內的排程
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log('4. 查詢今天到明天的排程...');
    const { data: dateRangeSchedules, error: dateRangeError } = await supabase
      .from('teacher_schedule')
      .select('*')
      .gte('scheduled_date', today)
      .lte('scheduled_date', tomorrow);

    if (dateRangeError) {
      console.error('查詢日期範圍排程失敗:', dateRangeError);
      return NextResponse.json({
        success: false,
        error: '查詢日期範圍排程失敗',
        details: dateRangeError.message
      }, { status: 500 });
    }

    console.log(`✅ 今天到明天有 ${dateRangeSchedules?.length || 0} 條排程記錄`);

    return NextResponse.json({
      success: true,
      data: {
        tableExists: true,
        allSchedulesCount: allSchedules?.length || 0,
        allSchedules: allSchedules?.slice(0, 5) || [], // 只返回前5條作為示例
        teacherSchedulesCount: teacherSchedules.length,
        teacherSchedules: teacherSchedules,
        dateRangeSchedulesCount: dateRangeSchedules?.length || 0,
        dateRangeSchedules: dateRangeSchedules || [],
        testDateRange: { today, tomorrow }
      }
    });

  } catch (error) {
    console.error('測試教師排程時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

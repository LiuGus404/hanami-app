import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 開始檢查教師排班資料庫狀況...');

    // 1. 檢查 teacher_schedule 表的總記錄數
    const { data: totalSchedules, error: totalError } = await supabase
      .from('teacher_schedule')
      .select('*', { count: 'exact' });

    if (totalError) {
      console.error('❌ 查詢總記錄數失敗:', totalError);
      return NextResponse.json({ 
        error: '查詢總記錄數失敗', 
        details: totalError.message 
      }, { status: 500 });
    }

    // 2. 檢查最近30天的排班記錄
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: recentSchedules, error: recentError } = await supabase
      .from('teacher_schedule')
      .select('*')
      .gte('scheduled_date', thirtyDaysAgoStr)
      .order('scheduled_date', { ascending: false });

    if (recentError) {
      console.error('❌ 查詢最近排班記錄失敗:', recentError);
      return NextResponse.json({ 
        error: '查詢最近排班記錄失敗', 
        details: recentError.message 
      }, { status: 500 });
    }

    // 3. 檢查教師資料
    const { data: teachers, error: teachersError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_nickname, teacher_fullname');

    if (teachersError) {
      console.error('❌ 查詢教師資料失敗:', teachersError);
      return NextResponse.json({ 
        error: '查詢教師資料失敗', 
        details: teachersError.message 
      }, { status: 500 });
    }

    // 4. 按教師分組統計排班記錄
    const typedRecentSchedules = (recentSchedules || []) as Array<{
      teacher_id?: string;
      scheduled_date?: string;
      [key: string]: any;
    }>;
    const scheduleByTeacher = typedRecentSchedules.reduce((acc, schedule) => {
      const teacherId = schedule.teacher_id;
      if (!teacherId) return acc;
      if (!acc[teacherId]) {
        acc[teacherId] = [];
      }
      acc[teacherId].push(schedule);
      return acc;
    }, {} as Record<string, any[]>);

    // 5. 檢查是否有重複的排班記錄
    const duplicateSchedules = typedRecentSchedules.filter((schedule, index, self) => 
      self.findIndex(s => 
        s.teacher_id === schedule.teacher_id && 
        s.scheduled_date === schedule.scheduled_date
      ) !== index
    );

    console.log('✅ 資料庫檢查完成');

    return NextResponse.json({
      success: true,
      summary: {
        totalSchedules: totalSchedules?.length || 0,
        recentSchedules: typedRecentSchedules.length || 0,
        totalTeachers: teachers?.length || 0,
        duplicateSchedules: duplicateSchedules.length || 0,
      },
      recentSchedules: typedRecentSchedules,
      teachers: teachers || [],
      scheduleByTeacher: scheduleByTeacher || {},
      duplicateSchedules: duplicateSchedules,
      checkDate: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 檢查教師排班資料時發生錯誤:', error);
    return NextResponse.json({ 
      error: '檢查資料時發生未預期的錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 
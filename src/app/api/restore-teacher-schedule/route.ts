import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { action, teacherId, date, startTime, endTime } = await request.json();
    
    console.log('🔧 開始還原教師排班資料...', { action, teacherId, date, startTime, endTime });

    if (action === 'restore_single') {
      // 還原單一教師的排班記錄
      if (!teacherId || !date) {
        return NextResponse.json({ 
          error: '缺少必要參數', 
          details: '需要提供 teacherId 和 date' 
        }, { status: 400 });
      }

      const { error } = await (supabase
        .from('teacher_schedule') as any)
        .insert({
          teacher_id: teacherId,
          scheduled_date: date,
          start_time: startTime || '09:00',
          end_time: endTime || '18:00',
        } as any);

      if (error) {
        console.error('❌ 還原單一排班記錄失敗:', error);
        return NextResponse.json({ 
          error: '還原排班記錄失敗', 
          details: error.message 
        }, { status: 500 });
      }

      console.log('✅ 單一排班記錄還原成功');
      return NextResponse.json({ 
        success: true, 
        message: '排班記錄還原成功' 
      });

    } else if (action === 'restore_batch') {
      // 批量還原排班記錄
      const { schedules } = await request.json();
      
      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return NextResponse.json({ 
          error: '缺少排班資料', 
          details: '需要提供有效的排班資料陣列' 
        }, { status: 400 });
      }

      const { error } = await (supabase
        .from('teacher_schedule') as any)
        .insert(schedules as any);

      if (error) {
        console.error('❌ 批量還原排班記錄失敗:', error);
        return NextResponse.json({ 
          error: '批量還原排班記錄失敗', 
          details: error.message 
        }, { status: 500 });
      }

      console.log('✅ 批量排班記錄還原成功，共還原', schedules.length, '筆記錄');
      return NextResponse.json({ 
        success: true, 
        message: `成功還原 ${schedules.length} 筆排班記錄` 
      });

    } else if (action === 'clear_duplicates') {
      // 清除重複的排班記錄
      const { data: duplicates, error: fetchError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ 查詢重複記錄失敗:', fetchError);
        return NextResponse.json({ 
          error: '查詢重複記錄失敗', 
          details: fetchError.message 
        }, { status: 500 });
      }

      // 找出重複記錄並保留最新的
      const typedDuplicates = (duplicates || []) as Array<{ teacher_id: string; scheduled_date: string; [key: string]: any }>;
      const uniqueSchedules = new Map();
      typedDuplicates.forEach(schedule => {
        const key = `${schedule.teacher_id}-${schedule.scheduled_date}`;
        if (!uniqueSchedules.has(key)) {
          uniqueSchedules.set(key, schedule);
        }
      });

      const uniqueSchedulesArray = Array.from(uniqueSchedules.values());
      
      // 刪除所有記錄
      const { error: deleteError } = await supabase
        .from('teacher_schedule')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 刪除所有記錄

      if (deleteError) {
        console.error('❌ 刪除重複記錄失敗:', deleteError);
        return NextResponse.json({ 
          error: '刪除重複記錄失敗', 
          details: deleteError.message 
        }, { status: 500 });
      }

      // 重新插入去重後的記錄
      if (uniqueSchedulesArray.length > 0) {
        const { error: insertError } = await (supabase
          .from('teacher_schedule') as any)
          .insert(uniqueSchedulesArray as any);

        if (insertError) {
          console.error('❌ 重新插入記錄失敗:', insertError);
          return NextResponse.json({ 
            error: '重新插入記錄失敗', 
            details: insertError.message 
          }, { status: 500 });
        }
      }

      console.log('✅ 重複記錄清除成功，保留', uniqueSchedulesArray.length, '筆唯一記錄');
      return NextResponse.json({ 
        success: true, 
        message: `成功清除重複記錄，保留 ${uniqueSchedulesArray.length} 筆唯一記錄` 
      });

    } else {
      return NextResponse.json({ 
        error: '無效的操作', 
        details: '支援的操作: restore_single, restore_batch, clear_duplicates' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 還原教師排班資料時發生錯誤:', error);
    return NextResponse.json({ 
      error: '還原資料時發生未預期的錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getSupabaseClient } from '@/lib/supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 獲取香港時間的日期字符串 (YYYY-MM-DD)
export function getHKDateString(date?: Date): string {
  const targetDate = date || new Date();
  // 香港時間是 UTC+8
  const hkTime = new Date(targetDate.getTime() + (8 * 60 * 60 * 1000));
  return hkTime.toISOString().split('T')[0];
}

// 獲取香港時間的日期時間字符串 (YYYY-MM-DDTHH:mm:ss.sssZ)
export function getHKDateTimeString(date?: Date): string {
  const targetDate = date || new Date();
  // 香港時間是 UTC+8
  const hkTime = new Date(targetDate.getTime() + (8 * 60 * 60 * 1000));
  return hkTime.toISOString();
}

// 檢查日期是否為今天（香港時間）
export function isToday(dateString: string): boolean {
  const today = getHKDateString();
  return dateString === today;
}

/**
 * 計算學生基於 hanami_student_lesson 表的剩餘堂數
 * @param studentId 學生ID
 * @param packageId 課程包ID（可選）
 * @param today 今天的日期（可選，預設為今天）
 * @returns 剩餘堂數
 */
// 固定香港時區的 Date 產生器
const getHongKongDate = (date = new Date()) => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000)); // 香港是 UTC+8
};

/**
 * 計算學生剩餘堂數（大於今天的課都算，等於今天的課要判斷 actual_timeslot+lesson_duration 是否結束，未結束才算剩餘堂數）
 * @param studentId 學生ID
 * @param today 今天的日期（可選，預設為今天）
 * @returns 剩餘堂數
 */
export async function calculateRemainingLessons(
  studentId: string,
  today?: Date,
): Promise<number> {
  const supabase = getSupabaseClient();
  const now = today ? new Date(today) : getHongKongDate();
  const todayStr = now.toISOString().slice(0, 10);

  try {
    // 使用 SQL 查詢直接計算剩餘堂數，不考慮 status
    const { data: remainingData, error: remainingError } = await (supabase as any)
      .rpc('calculate_remaining_lessons_batch', {
        student_ids: [studentId],
        today_date: todayStr
      });

    if (remainingError) {
      console.error('SQL 查詢剩餘堂數失敗:', remainingError);
      // 如果 RPC 函數不存在，回退到原始方法
      return await calculateRemainingLessonsFallback(studentId, today);
    }

    console.log('SQL 查詢剩餘堂數結果:', remainingData);

    // 返回結果
    if (remainingData && Array.isArray(remainingData) && remainingData.length > 0) {
      return remainingData[0].remaining_lessons || 0;
    }

    return 0;
  } catch (error) {
    console.error('計算剩餘堂數時發生錯誤:', error);
    // 回退到原始方法
    return await calculateRemainingLessonsFallback(studentId, today);
  }
}

// 回退方法：原始的計算邏輯
async function calculateRemainingLessonsFallback(
  studentId: string,
  today?: Date,
): Promise<number> {
  const supabase = getSupabaseClient();
  const now = today ? new Date(today) : getHongKongDate();
  const todayStr = now.toISOString().slice(0, 10);

  try {
    // 取得所有未來和今天的課堂，不考慮 status
    const { data, error } = await supabase
      .from('hanami_student_lesson')
      .select('id, lesson_date, actual_timeslot, lesson_duration')
      .eq('student_id', studentId)
      .gte('lesson_date', todayStr);
    if (error) {
      console.error('Error fetching future/today lessons:', error);
      return 0;
    }
    if (!data) return 0;

    // 分類：大於今天的都算，等於今天的要判斷結束時間
    let count = 0;
    for (const lesson of data) {
      if (lesson.lesson_date > todayStr) {
        count++;
      } else if (lesson.lesson_date === todayStr) {
        // 判斷 actual_timeslot + lesson_duration 是否大於等於現在
        if (!lesson.actual_timeslot || !lesson.lesson_duration) {
          // 沒有時間資訊，保守算進剩餘堂數
          count++;
          continue;
        }
        // 解析時間
        const [h, m] = lesson.actual_timeslot.split(':').map(Number);
        const durationParts = lesson.lesson_duration.split(':').map(Number);
        const dh = durationParts[0] || 0; // 小時
        const dm = durationParts[1] || 0; // 分鐘
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        const end = new Date(start.getTime() + (dh * 60 + dm) * 60000);
        if (end >= now) {
          count++;
        }
      }
    }
    return count;
  } catch (error) {
    console.error('Error calculating remaining lessons:', error);
    return 0;
  }
}

/**
 * 批量計算多個學生的剩餘堂數（同上邏輯）
 * @param studentIds 學生ID陣列
 * @param today 今天的日期（可選，預設為今天）
 * @param filters 篩選條件（可選）
 * @returns 學生ID到剩餘堂數的映射
 */
export async function calculateRemainingLessonsBatch(
  studentIds: string[],
  today?: Date
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const now = today ? new Date(today) : getHongKongDate();
  const todayStr = now.toISOString().slice(0, 10);
  const results: Record<string, number> = {};

  console.log(`開始計算 ${studentIds.length} 個學生的剩餘堂數，今天日期: ${todayStr}`);

  if (studentIds.length === 0) {
    console.log('沒有學生ID，返回空結果');
    return results;
  }

  try {
    // 使用 SQL 查詢直接計算剩餘堂數，不考慮 status，只按 student_id 分組
    const { data: remainingData, error: remainingError } = await (supabase as any)
      .rpc('calculate_remaining_lessons_batch', {
        student_ids: studentIds,
        today_date: todayStr
      });

    if (remainingError) {
      console.error('SQL 查詢剩餘堂數失敗:', remainingError);
      // 如果 RPC 函數不存在，回退到原始方法
      console.log('回退到原始計算方法');
      return await calculateRemainingLessonsBatchFallback(studentIds, today);
    }

    console.log('SQL 查詢剩餘堂數結果:', remainingData);

    // 將結果轉換為映射格式
    if (remainingData && Array.isArray(remainingData)) {
      remainingData.forEach((item: any) => {
        results[item.student_id] = item.remaining_lessons || 0;
      });
    }

    console.log('剩餘堂數計算完成:', results);
    return results;
  } catch (error) {
    console.error('計算剩餘堂數時發生錯誤:', error);
    // 回退到原始方法
    return await calculateRemainingLessonsBatchFallback(studentIds, today);
  }
}

// 回退方法：原始的計算邏輯
async function calculateRemainingLessonsBatchFallback(
  studentIds: string[],
  today?: Date
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const now = today ? new Date(today) : getHongKongDate();
  const todayStr = now.toISOString().slice(0, 10);
  const results: Record<string, number> = {};

  console.log(`使用回退方法計算 ${studentIds.length} 個學生的剩餘堂數，今天日期: ${todayStr}`);

  // 一次查詢所有學生今天及未來課堂，不考慮 status
  let query = supabase
    .from('hanami_student_lesson')
    .select('id, student_id, lesson_date, actual_timeslot, lesson_duration')
    .gte('lesson_date', todayStr)
    .in('student_id', studentIds);

  const { data: lessonsData, error: lessonsError } = await query;
  if (lessonsError) {
    console.error('Error fetching future/today lessons batch:', lessonsError);
    studentIds.forEach(id => (results[id] = 0));
    return results;
  }

  console.log(`查詢到 ${lessonsData?.length || 0} 條課堂記錄`);

  // 依學生分組，使用與單個學生計算相同的邏輯
  studentIds.forEach(id => {
    const lessons = (lessonsData || []).filter(l => l.student_id === id);
    let count = 0;
    
    console.log(`學生 ${id} 有 ${lessons.length} 條課堂記錄`);
    
    for (const lesson of lessons) {
      if (lesson.lesson_date > todayStr) {
        count++;
        console.log(`學生 ${id} 的未來課堂 ${lesson.lesson_date} 計入剩餘堂數`);
      } else if (lesson.lesson_date === todayStr) {
        // 判斷 actual_timeslot + lesson_duration 是否大於等於現在
        if (!lesson.actual_timeslot || !lesson.lesson_duration) {
          // 沒有時間資訊，保守算進剩餘堂數
          count++;
          console.log(`學生 ${id} 的今天課堂 ${lesson.lesson_date} 沒有時間資訊，計入剩餘堂數`);
          continue;
        }
        // 解析時間
        const [h, m] = lesson.actual_timeslot.split(':').map(Number);
        const durationParts = lesson.lesson_duration.split(':').map(Number);
        const dh = durationParts[0] || 0; // 小時
        const dm = durationParts[1] || 0; // 分鐘
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        const end = new Date(start.getTime() + (dh * 60 + dm) * 60000);
        if (end >= now) {
          count++;
          console.log(`學生 ${id} 的今天課堂 ${lesson.lesson_date} ${lesson.actual_timeslot} 尚未結束，計入剩餘堂數`);
        } else {
          console.log(`學生 ${id} 的今天課堂 ${lesson.lesson_date} ${lesson.actual_timeslot} 已結束，不計入剩餘堂數`);
        }
      }
    }
    console.log(`學生 ${id} 的總剩餘堂數: ${count}`);
    results[id] = count;
  });
  
  console.log('剩餘堂數計算完成:', results);
  return results;
} 
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
    // 優先使用修復版 SQL 函數，確保包含剩餘堂數為 0 的學生
    const { data: remainingData, error: remainingError } = await (supabase as any)
      .rpc('calculate_remaining_lessons_batch_fixed', {
        student_ids: [studentId],
        today_date: todayStr
      });

    if (remainingError) {
      // 嘗試使用原始函數作為備用
      const { data: originalData, error: originalError } = await (supabase as any)
        .rpc('calculate_remaining_lessons_batch', {
          student_ids: [studentId],
          today_date: todayStr
        });

      if (originalError) {
        // 兩個 RPC 函數都失敗，回退到原始方法
        return await calculateRemainingLessonsFallback(studentId, today);
      }

      // 返回結果
      if (originalData && Array.isArray(originalData) && originalData.length > 0) {
        return originalData[0].remaining_lessons || 0;
      }

      return 0;
    }

    // 返回結果
    if (remainingData && Array.isArray(remainingData) && remainingData.length > 0) {
      return remainingData[0].remaining_lessons || 0;
    }

    return 0;
  } catch (error) {
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
    const typedData = data as Array<{ lesson_date: string; actual_timeslot?: string | null; lesson_duration?: string | null; [key: string]: any; }>;
    let count = 0;
    for (const lesson of typedData) {
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
  today?: Date,
  filters?: { organizationId?: string }
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const now = today ? new Date(today) : getHongKongDate();
  const todayStr = now.toISOString().slice(0, 10);
  const results: Record<string, number> = {};
  const organizationId = filters?.organizationId;

  console.log(`開始計算 ${studentIds.length} 個學生的剩餘堂數，今天日期: ${todayStr}`);

  if (studentIds.length === 0) {
    console.log('沒有學生ID，返回空結果');
    return results;
  }

  try {
    // 使用 API 端點計算剩餘課程數（繞過 RLS）
    // 如果沒有 organizationId，嘗試從環境變數或上下文獲取
    if (!organizationId) {
      console.warn('calculateRemainingLessonsBatch: 缺少 organizationId，將回退到直接查詢');
      return await calculateRemainingLessonsBatchFallback(studentIds, today, organizationId);
    }

    console.log('嘗試使用 API 端點計算剩餘堂數');
    
    // 獲取用戶 email（如果可用）
    // 注意：這裡可能需要從上下文獲取，暫時使用空字符串
    const userEmail = ''; // TODO: 從上下文獲取用戶 email

    const calculateResponse = await fetch('/api/students/calculate-remaining-lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentIds,
        todayDate: todayStr,
        orgId: organizationId,
        userEmail,
      }),
    });

    if (!calculateResponse.ok) {
      const errorData = await calculateResponse.json().catch(() => ({}));
      console.error('API 計算剩餘課程數失敗，回退到原始方法:', errorData);
      return await calculateRemainingLessonsBatchFallback(studentIds, today, organizationId);
    }

    const calculateData = await calculateResponse.json();
    const remainingData = calculateData.data || [];

    console.log('API 計算剩餘堂數結果:', remainingData);

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
    return await calculateRemainingLessonsBatchFallback(studentIds, today, organizationId);
  }
}

// 回退方法：原始的計算邏輯
async function calculateRemainingLessonsBatchFallback(
  studentIds: string[],
  today?: Date,
  organizationId?: string
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

  if (organizationId) {
    query = query.eq('org_id', organizationId);
  }

  const { data: lessonsData, error: lessonsError } = await query;
  if (lessonsError) {
    console.error('Error fetching future/today lessons batch:', lessonsError);
    studentIds.forEach(id => (results[id] = 0));
    return results;
  }

  console.log(`查詢到 ${lessonsData?.length || 0} 條課堂記錄`);

  // 依學生分組，使用與單個學生計算相同的邏輯
  const typedLessonsData = lessonsData as Array<{ student_id: string; lesson_date: string; actual_timeslot?: string | null; lesson_duration?: string | null; [key: string]: any; }> | null;
  studentIds.forEach(id => {
    const lessons = (typedLessonsData || []).filter(l => l.student_id === id);
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
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getSupabaseClient } from '@/lib/supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    // 取得所有未來和今天的課堂
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
 * @returns 學生ID到剩餘堂數的映射
 */
export async function calculateRemainingLessonsBatch(
  studentIds: string[],
  today?: Date,
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const now = today ? new Date(today) : getHongKongDate();
  const todayStr = now.toISOString().slice(0, 10);
  const results: Record<string, number> = {};

  // 一次查詢所有學生今天及未來課堂
  const { data, error } = await supabase
    .from('hanami_student_lesson')
    .select('id, student_id, lesson_date, actual_timeslot, lesson_duration')
    .gte('lesson_date', todayStr)
    .in('student_id', studentIds);
  if (error) {
    console.error('Error fetching future/today lessons batch:', error);
    studentIds.forEach(id => (results[id] = 0));
    return results;
  }
  // 依學生分組
  studentIds.forEach(id => {
    const lessons = (data || []).filter(l => l.student_id === id);
    let count = 0;
    for (const lesson of lessons) {
      if (lesson.lesson_date > todayStr) {
        count++;
      } else if (lesson.lesson_date === todayStr) {
        if (!lesson.actual_timeslot || !lesson.lesson_duration) {
          count++;
          continue;
        }
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
    results[id] = count;
  });
  return results;
} 
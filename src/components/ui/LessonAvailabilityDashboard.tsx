'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getTodayISO(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString().slice(0, 10)
}

function formatAge(months: number | null | undefined): string {
  if (!months || isNaN(months)) return ''
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0 && m === 0) return ''
  if (y === 0) return `${m}月`
  if (m === 0) return `${y}歲`
  return `${y}歲${m}月`
}

function calculateAgeRange(students: { student_age: number | null | undefined }[]): string {
  const ages = students
    .map(s => s.student_age)
    .filter((age): age is number => age !== null && age !== undefined && !isNaN(age))
  
  if (ages.length === 0) return ''
  
  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)
  
  if (minAge === maxAge) return formatAge(minAge)
  return `${formatAge(minAge)}-${formatAge(maxAge)}`
}

interface Slot {
  time: string;
  course: string;
  weekday: number;
  max: number;
  current: number;
  duration: string | null;
  trial_students: TrialStudent[];
  regular_students_ages: number[];
}

interface TrialStudent {
  id: string;
  full_name: string;
  student_age: number | null;
  lesson_date: string;
  actual_timeslot: string | null;
  weekday: number;
}

interface ScheduleData {
  weekday: number;
  timeslot: string;
  max_students: number;
  duration: string | null;
}

export default function LessonAvailabilityDashboard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. 取得所有時段（移除 current_students 欄位查詢）
        const { data: slotData, error: slotError } = await supabase
          .from('hanami_teacher_schedule')
          .select('teacher_id, scheduled_date, start_time, end_time, created_at, updated_at')
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true })
        
        console.log('🔍 查詢 hanami_schedule 結果:', { slotData, slotError })
        
        if (slotError) {
          setError('無法載入資料：' + slotError.message)
          return
        }
        
        // 2. 取得所有今天或之後的試堂學生
        const todayISO = getTodayISO()
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('id, full_name, student_age, lesson_date, actual_timeslot, weekday')
          .gte('lesson_date', todayISO)
          .not('actual_timeslot', 'is', null) // 確保有設定試堂時間
          .not('weekday', 'is', null) // 確保有設定試堂日
        
        console.log('🔍 查詢試堂學生結果:', { trialData, trialError })
        
        if (trialError) {
          setError('無法載入試堂學生：' + trialError.message)
          return
        }
        
        // 3. 取得所有常規學生（只計算 active 學生）
        const { data: regularData, error: regularError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age, regular_weekday, regular_timeslot, student_type')
          .in('student_type', ['常規', '試堂']) // 只包含常規和試堂學生
          .not('regular_weekday', 'is', null) // 確保有設定上課日
          .not('regular_timeslot', 'is', null) // 確保有設定上課時間
        
        console.log('🔍 查詢常規學生結果:', { regularData, regularError })
        
        if (regularError) {
          setError('無法載入常規學生：' + regularError.message)
          return
        }
        
        // 4. 將試堂學生依 weekday+timeslot 分組
        const trialMap: { [key: string]: TrialStudent[] } = {}
        for (const t of trialData || []) {
          if (!t.actual_timeslot || t.weekday === null || t.weekday === undefined) continue
          
          // 處理 weekday 欄位，確保是數字格式
          let weekdayNum: number
          if (typeof t.weekday === 'string') {
            weekdayNum = parseInt(t.weekday)
            if (isNaN(weekdayNum)) continue
          } else {
            weekdayNum = t.weekday
          }
          
          const key = `${weekdayNum}_${t.actual_timeslot}`
          if (!trialMap[key]) trialMap[key] = []
          trialMap[key].push({
            ...t,
            full_name: t.full_name || '',
            lesson_date: t.lesson_date || '',
            actual_timeslot: t.actual_timeslot || '',
            weekday: weekdayNum,
            student_age: typeof t.student_age === 'string' ? parseInt(t.student_age) : t.student_age,
          })
        }
        
        console.log('🔍 試堂學生分組結果:', trialMap)
        
        // 5. 將常規學生依 regular_weekday+regular_timeslot 分組，收集年齡
        const regularAgeMap: { [key: string]: number[] } = {}
        const regularCountMap: { [key: string]: number } = {}
        for (const s of regularData || []) {
          if (!s.regular_timeslot || s.regular_weekday === null || s.regular_weekday === undefined) continue
          
          // 處理 regular_weekday 欄位，確保是數字格式
          let weekdayNum: number
          if (typeof s.regular_weekday === 'string') {
            weekdayNum = parseInt(s.regular_weekday)
            if (isNaN(weekdayNum)) continue
          } else {
            weekdayNum = s.regular_weekday
          }
          
          const key = `${weekdayNum}_${s.regular_timeslot}`
          if (!regularAgeMap[key]) regularAgeMap[key] = []
          if (!regularCountMap[key]) regularCountMap[key] = 0
          regularCountMap[key]++
          if (s.student_age !== null && s.student_age !== undefined) {
            const age = typeof s.student_age === 'string' ? parseInt(s.student_age) : s.student_age
            if (!isNaN(age)) {
              regularAgeMap[key].push(age)
            }
          }
        }
        
        console.log('🔍 常規學生分組結果:', { regularAgeMap, regularCountMap })
        
        // 統計資訊
        const totalRegularStudents = Object.values(regularCountMap).reduce((sum, count) => sum + count, 0)
        const totalTrialStudents = Object.values(trialMap).reduce((sum, students) => sum + students.length, 0)
        console.log('📊 統計資訊:', {
          常規學生總數: totalRegularStudents,
          試堂學生總數: totalTrialStudents,
          課堂時段數: slotData?.length || 0
        })
        
        // 6. 合併到 slot，動態計算當前學生數量
        let mapped: Slot[] = [];
        if (Array.isArray(slotData) && !(slotData.length > 0 && 'error' in slotData[0])) {
          mapped = ((slotData as unknown) as ScheduleData[])
            .filter(slot =>
              slot &&
              typeof slot.timeslot === 'string' &&
              typeof slot.weekday === 'number' &&
              typeof slot.max_students === 'number'
            )
            .map(slot => {
              const key = `${slot.weekday}_${slot.timeslot}`
              const regularCount = regularCountMap[key] || 0
              const trialCount = (trialMap[key] || []).length
              const currentTotal = regularCount + trialCount
              
              console.log(`🔍 時段 ${slot.weekday}_${slot.timeslot}:`, {
                常規學生: regularCount,
                試堂學生: trialCount,
                總計: currentTotal,
                上限: slot.max_students
              })
              
              return {
                time: slot.timeslot,
                course: '',
                weekday: slot.weekday,
                max: slot.max_students,
                current: currentTotal,
                duration: slot.duration,
                trial_students: trialMap[key] || [],
                regular_students_ages: regularAgeMap[key] || []
              }
            })
        }
        
        console.log('🔍 最終處理結果:', mapped)
        setSlots(mapped)
      } catch (err) {
        console.error('❌ 系統錯誤:', err)
        setError('系統錯誤，請稍後再試')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 依據 slots 動態產生每一天的時段
  const slotsByDay: { [weekday: number]: Slot[] } = {}
  slots.forEach(slot => {
    if (!slotsByDay[slot.weekday]) slotsByDay[slot.weekday] = []
    slotsByDay[slot.weekday].push(slot)
  })

  // 格式化時段顯示：09:15-10:15（不含秒數）
  function formatTimeslot(time: string, duration: string | null | undefined): string {
    if (!duration) return time.slice(0, 5)
    const start = time.slice(0, 5)
    const end = (() => {
      const [h, m] = time.split(':').map(Number)
      const [dh, dm] = duration.split(':').map(Number)
      const startDate = new Date(2000, 0, 1, h, m)
      const endDate = new Date(startDate.getTime() + (dh * 60 + dm) * 60000)
      const eh = endDate.getHours().toString().padStart(2, '0')
      const em = endDate.getMinutes().toString().padStart(2, '0')
      return `${eh}:${em}`
    })()
    return `${start}-${end}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-[#4B4036]">載入中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        ⚠️ {error}
      </div>
    )
  }

  // 檢查是否有課堂資料
  if (slots.length === 0) {
    return (
      <div className="w-full flex flex-col items-center px-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-[#4B4036]">課堂空缺情況</h2>
          <Image src="/rabbit.png" alt="icon" width={24} height={24} />
        </div>
        <div className="text-center p-8 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl">
          <div className="text-[#4B4036] mb-2">目前沒有課堂資料</div>
          <div className="text-sm text-[#87704e] mb-4">請確認以下項目：</div>
          <div className="text-sm text-[#87704e] text-left space-y-1">
            <div>• hanami_schedule 表中有設定課堂時段</div>
            <div>• Hanami_Students 表中有常規學生且設定了 regular_weekday 和 regular_timeslot</div>
            <div>• 或點擊「插入測試資料」按鈕來查看示例</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-[#4B4036]">課堂空缺情況</h2>
        <Image src="/rabbit.png" alt="icon" width={24} height={24} />
      </div>
      <div className="w-full overflow-auto">
        <div className="min-w-[700px] border border-[#EADBC8] rounded-xl bg-[#FFFDF7] shadow-sm">
          <div className="grid grid-cols-7 text-sm">
            {/* 星期標題 */}
            {weekdays.map((day) => (
              <div key={day} className="bg-[#FFF5E5] font-bold border-b border-r border-[#EADBC8] p-2 text-center text-[#4B4036]">
                {day}
              </div>
            ))}
            {/* 動態產生每一天的時段格子 */}
            {weekdays.map((_, dayIdx) => (
              <div key={dayIdx} className="flex flex-col border-r border-[#EADBC8] min-h-[60px]">
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 ? (
                  slotsByDay[dayIdx].map((slot, i) => (
                    <div
                      key={slot.time + i}
                      className="border border-[#EADBC8] p-2 text-center text-sm rounded-xl shadow hover:shadow-md transition-all duration-200 my-1 mx-1"
                      style={{ backgroundColor: slot.current < slot.max ? '#FFE5D2' : '#FFFAF2' }}
                    >
                      <div className="text-[11px] text-gray-500">{formatTimeslot(slot.time, slot.duration)}</div>
                      <div className="font-semibold text-[#4B4036] text-base">
                        {slot.current}/{slot.max}
                      </div>
                      {/* 顯示常規學生年齡範圍 */}
                      {slot.regular_students_ages && slot.regular_students_ages.length > 0 && (
                        <div className="text-[10px] text-[#87704e] mt-1 text-center">
                          {calculateAgeRange(slot.regular_students_ages.map(a => ({ student_age: a })))}
                        </div>
                      )}
                      {/* 試堂學生名單 */}
                      {slot.trial_students && slot.trial_students.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {[...slot.trial_students]
                            .sort((a, b) => {
                              // 確保日期格式正確進行排序
                              const dateA = a.lesson_date ? new Date(a.lesson_date).getTime() : 0
                              const dateB = b.lesson_date ? new Date(b.lesson_date).getTime() : 0
                              return dateA - dateB
                            })
                            .map((stu) => {
                              // 格式化日期 dd/MM
                              let dateStr = ''
                              if (stu.lesson_date) {
                                try {
                                  const d = new Date(stu.lesson_date)
                                  if (!isNaN(d.getTime())) {
                                    dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`
                                  }
                                } catch (err) {
                                  console.error('日期格式化錯誤:', err)
                                }
                              }
                              return (
                                <a
                                  key={stu.id}
                                  href={`/admin/add-trial-students?id=${stu.id}`}
                                  className="inline-block px-2 py-1 rounded bg-yellow-100 text-xs text-[#4B4036] hover:bg-yellow-200 transition leading-snug"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <div>{stu.full_name}</div>
                                  <div className="mt-[2px] flex items-center gap-2 text-[10px] text-[#87704e]">
                                    {(stu.student_age !== null && stu.student_age !== undefined && !isNaN(stu.student_age)) && (
                                      <span className="inline-flex items-center gap-1">
                                        <Image src="/age.png" alt="age" width={16} height={16} />
                                        {formatAge(stu.student_age)}
                                      </span>
                                    )}
                                    {dateStr && (
                                      <span className="inline-flex items-center gap-1">
                                        <Image src="/calendar.png" alt="calendar" width={16} height={16} />
                                        {dateStr}
                                      </span>
                                    )}
                                  </div>
                                </a>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex-1 border-b border-[#EADBC8]" />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* 圖例說明 */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm bg-[#FFF8EF] border border-[#EADBC8] rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFE5D2] border border-[#EADBC8] rounded"></div>
            <span>有空缺的時段</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFFAF2] border border-[#EADBC8] rounded"></div>
            <span>已滿的時段</span>
          </div>
          <div className="flex items-center gap-2">
            <span>格式：現有/可容納人數</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#87704e]">
            <span>※ 現有人數 = 常規學生 + 即將試堂學生</span>
          </div>
        </div>
      </div>
    </div>
  )
}
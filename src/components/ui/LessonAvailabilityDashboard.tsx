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
    .filter((age): age is number => age !== null && age !== undefined)
  
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
  current_students: number;
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
        // 1. 取得所有時段
        const { data: slotData, error: slotError } = await supabase
          .from('hanami_schedule')
          .select('weekday, timeslot, max_students, current_students, duration')
          .order('weekday', { ascending: true })
          .order('timeslot', { ascending: true })
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
        if (trialError) {
          setError('無法載入試堂學生：' + trialError.message)
          return
        }
        // 3. 取得所有常規學生
        const { data: regularData, error: regularError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age, regular_weekday, regular_timeslot')
        if (regularError) {
          setError('無法載入常規學生：' + regularError.message)
          return
        }
        // 4. 將試堂學生依 weekday+timeslot 分組
        const trialMap: { [key: string]: TrialStudent[] } = {}
        for (const t of trialData || []) {
          if (!t.actual_timeslot || t.weekday === null || t.weekday === undefined) continue
          const key = `${t.weekday}_${t.actual_timeslot}`
          if (!trialMap[key]) trialMap[key] = []
          trialMap[key].push({
            ...t,
            full_name: t.full_name || '',
            lesson_date: t.lesson_date || '',
            actual_timeslot: t.actual_timeslot || '',
            weekday: typeof t.weekday === 'string' ? parseInt(t.weekday) : t.weekday,
          })
        }
        // 5. 將常規學生依 regular_weekday+regular_timeslot 分組，收集年齡
        const regularAgeMap: { [key: string]: number[] } = {}
        for (const s of regularData || []) {
          if (!s.regular_timeslot || s.regular_weekday === null || s.regular_weekday === undefined) continue
          const key = `${s.regular_weekday}_${s.regular_timeslot}`
          if (!regularAgeMap[key]) regularAgeMap[key] = []
          if (s.student_age !== null && s.student_age !== undefined) {
            regularAgeMap[key].push(s.student_age)
          }
        }
        // 6. 合併到 slot
        let mapped: Slot[] = [];
        if (Array.isArray(slotData) && !(slotData.length > 0 && 'error' in slotData[0])) {
          mapped = ((slotData as unknown) as ScheduleData[])
            .filter(slot =>
              slot &&
              typeof slot.timeslot === 'string' &&
              typeof slot.weekday === 'number' &&
              typeof slot.max_students === 'number' &&
              typeof slot.current_students === 'number'
            )
            .map(slot => ({
              time: slot.timeslot,
              course: '',
              weekday: slot.weekday,
              max: slot.max_students,
              current: slot.current_students,
              duration: slot.duration,
              trial_students: trialMap[`${slot.weekday}_${slot.timeslot}`] || [],
              regular_students_ages: regularAgeMap[`${slot.weekday}_${slot.timeslot}`] || []
            }))
        }
        setSlots(mapped)
      } catch (err) {
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
                            .sort((a, b) => (a.lesson_date || '').localeCompare(b.lesson_date || ''))
                            .map((stu) => {
                              // 格式化日期 dd/MM
                              let dateStr = ''
                              if (stu.lesson_date) {
                                const d = new Date(stu.lesson_date)
                                dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`
                              }
                              return (
                                <a
                                  key={stu.id}
                                  href={`/admin/students/${stu.id}`}
                                  className="inline-block px-2 py-1 rounded bg-yellow-100 text-xs text-[#4B4036] hover:bg-yellow-200 transition leading-snug"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <div>{stu.full_name}</div>
                                  <div className="mt-[2px] flex items-center gap-2 text-[10px] text-[#87704e]">
                                    {(stu.student_age !== null && stu.student_age !== undefined) && (
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
        <div className="mt-4 flex gap-4 justify-center text-sm bg-[#FFF8EF] border border-[#EADBC8] rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>時段（現有/可容納人數），下方顯示即將試堂學生</span>
          </div>
        </div>
      </div>
    </div>
  )
}
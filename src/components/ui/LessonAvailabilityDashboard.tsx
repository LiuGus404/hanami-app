'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  id: string;
  time: string;
  course: string;
  weekday: number;
  max: number;
  current: number;
  duration: string | null;
  trial_students: TrialStudent[];
  regular_students_ages: number[];
  regular_students: any[];
}

interface TrialStudent {
  id: string;
  full_name: string;
  student_age: number | null;
  lesson_date: string;
  actual_timeslot: string | null;
  weekday: number;
  course_type?: string;
}



export default function LessonAvailabilityDashboard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();
  const [expandedTrial, setExpandedTrial] = useState<{[key:string]: boolean}>({});
  const [queueByDay, setQueueByDay] = useState<{[weekday: number]: any[]}>({});
  const [expandedQueue, setExpandedQueue] = useState<{[weekday: number]: boolean}>({});
  const [expandedCourseTypes, setExpandedCourseTypes] = useState<{[weekday: number]: {[courseType: string]: boolean}}>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. 從 hanami_schedule 表取得所有課堂空缺情況設定
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('hanami_schedule')
          .select('*')
          .order('weekday', { ascending: true })
          .order('timeslot', { ascending: true })
        
        console.log('🔍 查詢 hanami_schedule 結果:', { scheduleData, scheduleError })
        
        if (scheduleError) {
          setError('無法載入課堂空缺情況設定：' + scheduleError.message)
          return
        }
        
        // 2. 取得所有今天或之後的試堂學生
        const todayISO = getTodayISO()
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('id, full_name, student_age, lesson_date, actual_timeslot, weekday, course_type')
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
          .select('id, full_name, student_age, regular_weekday, regular_timeslot, student_type, course_type')
          .in('student_type', ['常規', '試堂']) // 只包含常規和試堂學生
          .not('regular_weekday', 'is', null) // 確保有設定上課日
          .not('regular_timeslot', 'is', null) // 確保有設定上課時間
        
        console.log('🔍 查詢常規學生結果:', { regularData, regularError })
        
        if (regularError) {
          setError('無法載入常規學生：' + regularError.message)
          return
        }
        
        // 4. 將試堂學生依 weekday+timeslot+course_type 分組
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
          // 取得 course_type
          const courseType = t.course_type || ''
          const key = `${weekdayNum}_${t.actual_timeslot}_${courseType}`
          if (!trialMap[key]) trialMap[key] = []
          trialMap[key].push({
            ...t,
            full_name: t.full_name || '',
            lesson_date: t.lesson_date || '',
            actual_timeslot: t.actual_timeslot || '',
            weekday: weekdayNum,
            student_age: typeof t.student_age === 'string' ? parseInt(t.student_age) : t.student_age,
            course_type: courseType,
          })
        }
        
        console.log('🔍 試堂學生分組結果:', trialMap)
        
        // 5. 將常規學生依 regular_weekday+regular_timeslot+course_type 分組
        const regularAgeMap: { [key: string]: number[] } = {}
        const regularCountMap: { [key: string]: number } = {}
        const regularStudentsMap: { [key: string]: any[] } = {}
        
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
          
          const courseType = s.course_type || ''
          const key = `${weekdayNum}_${s.regular_timeslot}_${courseType}`
          if (!regularAgeMap[key]) regularAgeMap[key] = []
          if (!regularCountMap[key]) regularCountMap[key] = 0
          if (!regularStudentsMap[key]) regularStudentsMap[key] = []
          
          regularCountMap[key]++
          regularStudentsMap[key].push(s)
          
          if (s.student_age !== null && s.student_age !== undefined) {
            const age = typeof s.student_age === 'string' ? parseInt(s.student_age) : s.student_age
            if (!isNaN(age)) {
              regularAgeMap[key].push(age)
            }
          }
        }
        
        console.log('🔍 常規學生分組結果:', { regularAgeMap, regularCountMap, regularStudentsMap })
        
        // 6. 基於 hanami_schedule 表生成時段，並計算每班學生數量
        // 先按 weekday+timeslot+course_type 分組所有 schedule 記錄
        const scheduleGroups: { [key: string]: any[] } = {}
        scheduleData?.forEach(schedule => {
          const courseType = schedule.course_type || ''
          const key = `${schedule.weekday}_${schedule.timeslot}_${courseType}`
          if (!scheduleGroups[key]) scheduleGroups[key] = []
          scheduleGroups[key].push(schedule)
        })
        
                 // 為每個 schedule 記錄分配學生
         const mapped: Slot[] = []
         Object.entries(scheduleGroups).forEach(([groupKey, schedules]) => {
           const [weekday, timeslot, courseType] = groupKey.split('_')
           const weekdayNum = parseInt(weekday)
           
           // 取得該時段該班級的所有學生
           const regularStudents = regularStudentsMap[groupKey] || []
           const trialStudents = trialMap[groupKey] || []
           
           // 將學生分配到各個 schedule 記錄中
           let regularIndex = 0
           let trialIndex = 0
           
           schedules.forEach((schedule, index) => {
             // 計算這個 schedule 應該分配多少學生
             const maxStudents = schedule.max_students
             let regularCount = 0
             let trialCount = 0
             
             // 優先分配常規學生
             while (regularIndex < regularStudents.length && regularCount < maxStudents) {
               regularCount++
               regularIndex++
             }
             
             // 再分配試堂學生
             while (trialIndex < trialStudents.length && (regularCount + trialCount) < maxStudents) {
               trialCount++
               trialIndex++
             }
             
             // 分配對應的學生資料
             const slotRegularStudents = regularStudents.slice(regularIndex - regularCount, regularIndex)
             const slotTrialStudents = trialStudents.slice(trialIndex - trialCount, trialIndex)
             const slotRegularAges = slotRegularStudents
               .map(s => s.student_age)
               .filter((age): age is number => age !== null && age !== undefined && !isNaN(age))
             
             mapped.push({
               id: schedule.id,
               time: schedule.timeslot,
               course: courseType,
               weekday: weekdayNum,
               max: schedule.max_students,
               current: regularCount + trialCount,
               duration: schedule.duration,
               trial_students: slotTrialStudents,
               regular_students_ages: slotRegularAges,
               regular_students: slotRegularStudents
             })
           })
         })
        
        setSlots(mapped)

        // 2. 查詢 hanami_trial_queue 輪候學生
        console.log('🔍 開始查詢 hanami_trial_queue...');
        
        const { data: queueData, error: queueError } = await supabase
          .from('hanami_trial_queue')
          .select('id, full_name, student_age, phone_no, prefer_time, notes, course_types, created_at')
          .order('created_at', { ascending: true }); // 按舊到新排序
        
        console.log('🔍 查詢 hanami_trial_queue 結果:', { queueData, queueError });
        
        if (queueError) {
          console.error('❌ 查詢輪候學生失敗:', queueError);
          // 不中斷整個流程，只是輪候學生無法顯示
        }
        
        console.log('🔍 queueData 原始資料:', queueData);
        console.log('🔍 queueData 長度:', queueData?.length);
        console.log('🔍 queueData 詳細內容:');
        queueData?.forEach((item, index) => {
          console.log(`  [${index}] ID: ${item.id}, Prefer_time: ${item.prefer_time}`);
        });
        
        console.log('🔍 查詢排隊名單結果:', { queueData, queueError })
        
        if (queueError) {
          setError('無法載入排隊名單：' + queueError.message)
          return
        }
        
        // 分組到每個星期，並按班別（課程類型）分組
        const queueMap: { [weekday: string]: { [courseType: string]: any[] } } = {};
        console.log('🔍 開始分組處理...');
        
        for (const q of queueData || []) {
          console.log(`🔍 處理項目: ID=${q.id}, prefer_time=${q.prefer_time}, course_types=${q.course_types}`);
          
          if (!q.prefer_time) {
            console.log(`  ❌ 跳過：prefer_time 為空`);
            continue;
          }
          
          let preferTime;
          if (typeof q.prefer_time === 'string') {
            try {
              preferTime = JSON.parse(q.prefer_time);
              console.log(`  ✅ JSON 解析成功:`, preferTime);
            } catch (err) {
              console.log(`  ❌ JSON 解析失敗:`, err);
              continue;
            }
          } else {
            preferTime = q.prefer_time;
            console.log(`  ✅ 已經是物件:`, preferTime);
          }
          
          // 解析課程類型
          let courseTypes: string[] = [];
          if (q.course_types) {
            if (typeof q.course_types === 'string') {
              try {
                courseTypes = JSON.parse(q.course_types);
              } catch (err) {
                console.log(`  ❌ 課程類型 JSON 解析失敗:`, err);
              }
            } else if (Array.isArray(q.course_types)) {
              courseTypes = q.course_types;
            }
          }
          
          // 如果沒有課程類型，使用「未指定課程」
          if (!courseTypes || courseTypes.length === 0) {
            courseTypes = ['未指定課程'];
          }
          
          if (preferTime && preferTime.week && Array.isArray(preferTime.week)) {
            console.log(`  ✅ 找到 week 陣列:`, preferTime.week);
            for (const weekday of preferTime.week) {
              const weekdayKey = String(weekday);
              if (!queueMap[weekdayKey]) queueMap[weekdayKey] = {};
              
              // 為每個課程類型分組
              for (const courseType of courseTypes) {
                if (!queueMap[weekdayKey][courseType]) queueMap[weekdayKey][courseType] = [];
                queueMap[weekdayKey][courseType].push({ 
                  ...q, 
                  prefer: { weekday, timeslot: preferTime.range || '未指定' },
                  courseType: courseType
                });
                console.log(`  ✅ 分配到 weekday ${weekday}, courseType ${courseType}`);
              }
            }
          } else {
            console.log(`  ❌ 跳過：preferTime.week 不是陣列或不存在`);
          }
        }
        
        // 對每個星期每個課程類型的資料按 created_at 排序
        Object.keys(queueMap).forEach(weekdayKey => {
          Object.keys(queueMap[weekdayKey]).forEach(courseType => {
            queueMap[weekdayKey][courseType].sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateA - dateB; // 升序排列（最早的在前）
            });
          });
        });
        console.log('🔍 queueMap 分組後:', queueMap);
        console.log('🔍 queueMap keys:', Object.keys(queueMap));
        console.log('🔍 排隊名單分組結果:', queueMap);
        console.log('🔍 準備 setQueueByDay:', queueMap);
        console.log('🔍 分組結果詳細:');
        Object.keys(queueMap).forEach(weekdayKey => {
          const weekdayData = queueMap[weekdayKey];
          const totalStudents = Object.values(weekdayData).reduce((sum, arr) => sum + arr.length, 0);
          console.log(`  weekday ${weekdayKey}: ${totalStudents} 個學生`);
          
          Object.entries(weekdayData).forEach(([courseType, students]) => {
            console.log(`    課程 ${courseType}: ${students.length} 個學生`);
            students.forEach((q: any, i: number) => {
              console.log(`      [${i}] ${q.phone_no || q.full_name || '未命名'} (${q.student_age}歲) - ${q.created_at}`);
            });
          });
        });

        // 將 queueMap 的 key 轉為 number，並合併所有課程類型的學生陣列
        const queueMapNumberKey: { [weekday: number]: any[] } = {};
        Object.keys(queueMap).forEach((weekdayKey) => {
          const allStudents = Object.values(queueMap[weekdayKey]).flat();
          queueMapNumberKey[Number(weekdayKey)] = allStudents;
        });
        setQueueByDay(queueMapNumberKey);
      } catch (err) {
        console.error('❌ 系統錯誤:', err)
        setError('系統錯誤：' + (err instanceof Error ? err.message : JSON.stringify(err)))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 依據 slots 動態產生每一天的時段
  // 以 weekday 為主，時段內可有多班（course_type），每班可有多筆記錄
  const slotsByDay: { [weekday: number]: Slot[] } = {}
  slots.forEach(slot => {
    if (!slotsByDay[slot.weekday]) slotsByDay[slot.weekday] = []
    slotsByDay[slot.weekday].push(slot)
  })

  // Debug: 檢查 queueByDay 內容
  console.log('🔍 渲染時的 queueByDay:', queueByDay);
  console.log('🔍 渲染時的 expandedQueue:', expandedQueue);

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
            <div>• hanami_schedule 表中有設定課堂空缺情況</div>
            <div>• Hanami_Students 表中有常規學生且設定了 regular_weekday 和 regular_timeslot</div>
            <div>• hanami_trial_students 表中有試堂學生且設定了 weekday 和 actual_timeslot</div>
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
                {queueByDay[dayIdx] && queueByDay[dayIdx].length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <button
                      className="text-xs px-2 py-1 rounded bg-[#E6F0FF] text-[#2B4B6F] border border-blue-100 hover:bg-[#D6E8FF] transition"
                      onClick={() => setExpandedQueue(prev => ({...prev, [dayIdx]: !prev[dayIdx]}))}
                    >
                      {expandedQueue[dayIdx] ? '收起' : '展開'}輪候學生（{queueByDay[dayIdx]?.length || 0}）
                    </button>
                  </div>
                )}
                {queueByDay[dayIdx] && queueByDay[dayIdx].length > 0 && expandedQueue[dayIdx] && (
                  <div className="flex flex-col gap-2 mb-1">
                    {/* 按課程類型分組顯示輪候學生 */}
                    {(() => {
                      const students = queueByDay[dayIdx] || []
                      const courseGroups: { [courseType: string]: any[] } = {}
                      
                      students.forEach((student: any) => {
                        const courseType = student.courseType || '未指定課程'
                        if (!courseGroups[courseType]) courseGroups[courseType] = []
                        courseGroups[courseType].push(student)
                      })
                      
                      return Object.entries(courseGroups).map(([courseType, students]) => (
                        <div key={courseType} className="border border-[#EADBC8] rounded p-1 bg-[#FFF9F2]">
                          <button
                            className="text-[10px] font-semibold text-[#4B4036] mb-1 px-1 w-full text-left hover:bg-[#FDE6B8] transition rounded"
                            onClick={() => setExpandedCourseTypes(prev => ({
                              ...prev,
                              [dayIdx]: {
                                ...(prev[dayIdx] || {}),
                                [courseType]: !(prev[dayIdx]?.[courseType] || false)
                              }
                            }))}
                          >
                            {expandedCourseTypes[dayIdx]?.[courseType] ? '▼' : '▶'} {courseType}（{students.length}人）
                          </button>
                          {expandedCourseTypes[dayIdx]?.[courseType] && (
                            <div className="flex flex-col gap-1">
                              {students.map((q: any, i: number) => (
                                <button
                                  key={`${q.id}-${i}`}
                                  onClick={() => router.push(`/admin/add-trial-students?id=${q.id}`)}
                                  className="inline-block px-2 py-1 rounded bg-[#F0F6FF] text-xs text-[#2B4B6F] hover:bg-[#E0EDFF] transition leading-snug text-left"
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div>{q.phone_no || q.full_name || '未命名'}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-[#4B5A6F] mt-0.5">
                                    {q.student_age !== null && q.student_age !== undefined && !isNaN(q.student_age) && (
                                      <span>{q.student_age}歲</span>
                                    )}
                                    {q.prefer && q.prefer.timeslot && q.prefer.timeslot !== '未指定' && (
                                      <span>偏好時段: {q.prefer.timeslot}</span>
                                    )}
                                    {q.notes && (
                                      <span>備註: {q.notes}</span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    })()}
                  </div>
                )}
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 ? (
                  slotsByDay[dayIdx].map((slot, i) => (
                    <div
                      key={slot.id || slot.time + slot.course + i}
                      className="border border-[#EADBC8] p-2 text-center text-sm rounded-xl shadow hover:shadow-md transition-all duration-200 my-1 mx-1"
                      style={{ backgroundColor: slot.current < slot.max ? '#FFE5D2' : '#FFFAF2' }}
                    >
                      <div className="text-[11px] text-gray-500">{formatTimeslot(slot.time, slot.duration)}{slot.course ? `｜${slot.course}` : ''}</div>
                      <div className="font-semibold text-[#4B4036] text-base">
                        {slot.regular_students.length}{slot.trial_students.length > 0 ? `+${slot.trial_students.length}` : ''}/{slot.max}
                      </div>
                      {/* 顯示常規學生年齡範圍 */}
                      {slot.regular_students_ages && slot.regular_students_ages.length > 0 && (
                        <div className="text-[10px] text-[#87704e] mt-1 text-center">
                          {calculateAgeRange(slot.regular_students_ages.map(a => ({ student_age: a })))}
                        </div>
                      )}
                      {/* 試堂學生名單 */}
                      {slot.trial_students && slot.trial_students.length > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <button
                            className="text-xs px-2 py-1 rounded bg-[#FFF9E2] text-[#4B4036] border border-yellow-200 hover:bg-[#FFEFC2] transition"
                            onClick={() => setExpandedTrial(prev => ({...prev, [`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]: !prev[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]}))}
                          >
                            {expandedTrial[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] ? '收起' : '展開'}試堂學生（{slot.trial_students.length}）
                          </button>
                        </div>
                      )}
                      {/* 展開時才顯示名單 */}
                      {slot.trial_students && slot.trial_students.length > 0 && expandedTrial[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] && (
                        <div className="flex flex-col gap-1 mt-1">
                          {[...slot.trial_students]
                            .sort((a, b) => {
                              const dateA = a.lesson_date ? new Date(a.lesson_date).getTime() : 0
                              const dateB = b.lesson_date ? new Date(b.lesson_date).getTime() : 0
                              return dateA - dateB
                            })
                            .map((stu) => {
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
                                <button
                                  key={stu.id}
                                  onClick={() => router.push(`/admin/students/${stu.id}`)}
                                  className="inline-block px-2 py-1 rounded bg-yellow-100 text-xs text-[#4B4036] hover:bg-yellow-200 transition leading-snug"
                                  style={{ cursor: 'pointer' }}
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
                                </button>
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
            <span>格式：常規+試堂/可容納人數</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#87704e]">
            <span>※ 例如：3+2/5 表示3個常規學生+2個試堂學生，共可容納5人</span>
          </div>
        </div>
      </div>
    </div>
  )
}
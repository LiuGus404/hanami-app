'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import TrialLimitSettingsModal from './TrialLimitSettingsModal'

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
  available_dates?: {date: string, remain: number}[];
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
  const [expandedTrialByDate, setExpandedTrialByDate] = useState<{[key:string]: boolean}>({});
  const [expandedAvailableDates, setExpandedAvailableDates] = useState<{[key:string]: boolean}>({});
  const [queueByDay, setQueueByDay] = useState<{[weekday: number]: any[]}>({});
  const [expandedQueue, setExpandedQueue] = useState<{[weekday: number]: boolean}>({});
  const [expandedCourseTypes, setExpandedCourseTypes] = useState<{[weekday: number]: {[courseType: string]: boolean}}>({});
  const [courseTypes, setCourseTypes] = useState<{[id: string]: string}>({})
  const [trialLimitSettings, setTrialLimitSettings] = useState<{[courseTypeId: string]: number}>({})
  const [showTrialLimitModal, setShowTrialLimitModal] = useState(false)

  const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 0. 先載入課程類型資料
        const { data: courseTypesData, error: courseTypesError } = await supabase
          .from('Hanami_CourseTypes')
          .select('id, name')
          .eq('status', true)
        
        if (courseTypesError) {
          console.error('無法載入課程類型：', courseTypesError)
          setError('無法載入課程類型：' + courseTypesError.message)
          return
        }
        
        // 建立課程類型映射表
        const courseTypesMap: {[id: string]: string} = {}
        courseTypesData?.forEach(course => {
          courseTypesMap[course.id] = course.name || course.id
        })
        setCourseTypes(courseTypesMap)
        console.log('課程類型映射表：', courseTypesMap)
        
        // 調試信息：檢查課程類型資料
        console.log('課程類型原始資料：', courseTypesData)
        console.log('課程類型映射表詳細：', Object.entries(courseTypesMap))

        // 1. 從 hanami_schedule 表取得所有課堂空缺情況設定
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('hanami_schedule')
          .select('*')
          .order('weekday', { ascending: true })
          .order('timeslot', { ascending: true })
        

        
        if (scheduleError) {
          setError('無法載入課堂空缺情況設定：' + scheduleError.message)
          return
        }
        
        // 調試信息：檢查時段資料
        console.log('時段資料總數：', scheduleData?.length || 0)
        console.log('時段資料範例：', scheduleData?.slice(0, 3))
        console.log('時段資料星期六：', scheduleData?.filter(s => s.weekday === 6))
        
        // 3. 取得所有常規學生（只計算 active 學生）
        const { data: regularData, error: regularError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age, regular_weekday, regular_timeslot, student_type, course_type')
          .in('student_type', ['常規', '試堂']) // 只包含常規和試堂學生
          .not('regular_weekday', 'is', null) // 確保有設定上課日
          .not('regular_timeslot', 'is', null) // 確保有設定上課時間
        

        
        if (regularError) {
          setError('無法載入常規學生：' + regularError.message)
          return
        }
        
        // 調試信息：檢查常規學生資料
        console.log('常規學生資料總數：', regularData?.length || 0)
        console.log('常規學生資料範例：', regularData?.slice(0, 3))
        
        // 2. 取得所有今天或之後的試堂學生
        const todayISO = getTodayISO()
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('id, full_name, student_age, lesson_date, actual_timeslot, weekday, course_type')
          .gte('lesson_date', todayISO)
          .not('actual_timeslot', 'is', null) // 確保有設定試堂時間
          .not('weekday', 'is', null) // 確保有設定試堂日
        

        
        if (trialError) {
          setError('無法載入試堂學生：' + trialError.message)
          return
        }
        
        // 調試信息：檢查試堂學生資料
        console.log('試堂學生資料總數：', trialData?.length || 0)
        console.log('試堂學生資料範例：', trialData?.slice(0, 3))
        
        // 4. 查詢 hanami_student_lesson 表獲取最快有空位的日子
        const { data: lessonData, error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .select('lesson_date, actual_timeslot, course_type, student_id')
          .gte('lesson_date', todayISO)
          .order('lesson_date', { ascending: true })
        

        
        if (lessonError) {
          console.error('❌ 查詢 hanami_student_lesson 失敗:', lessonError)
          // 不中斷整個流程，只是最快有空位日子無法顯示
        }

        // 試堂學生的課堂記錄直接從 hanami_trial_students 表獲取
        // 將試堂學生資料轉換為課堂記錄格式
        const trialLessonData = (trialData || []).map(trial => ({
          lesson_date: trial.lesson_date,
          actual_timeslot: trial.actual_timeslot,
          course_type: trial.course_type,
          student_id: trial.id
        }))

        // 合併常規學生和試堂學生的課堂記錄
        const allLessonData = [
          ...(lessonData || []),
          ...trialLessonData
        ]
        
        // 4. 將試堂學生依 weekday+timeslot+course_type 分組，並加上偵錯 log
        const trialMap: { [key: string]: TrialStudent[] } = {}
        const unmatchedTrialStudents: TrialStudent[] = []
        // 收集所有 schedule key
        const allScheduleKeys = (scheduleData || []).map(s => `${s.weekday}_${s.timeslot}_${s.course_type || ''}`)
        

        
        for (const t of trialData || []) {
          if (!t.actual_timeslot || !t.lesson_date) {
            continue
          }
          
          // 從 lesson_date 計算 weekday
          const lessonDate = new Date(t.lesson_date)
          const weekdayNum = lessonDate.getDay() // 0=星期日, 1=星期一, ..., 6=星期六
          
          const courseType = t.course_type || ''
          const keyFull = `${weekdayNum}_${t.actual_timeslot}_${courseType}`
          const keyNoType = `${weekdayNum}_${t.actual_timeslot}_`
          const keySimple = `${weekdayNum}_${t.actual_timeslot}`
          
          let matched = false
          for (const key of [keyFull, keyNoType, keySimple]) {
            if (allScheduleKeys.includes(key)) {
              if (!trialMap[key]) trialMap[key] = []
              trialMap[key].push({
                ...t,
                full_name: t.full_name || '',
                lesson_date: t.lesson_date || '',
                actual_timeslot: t.actual_timeslot || '',
                weekday: weekdayNum,
                student_age: typeof t.student_age === 'string' ? parseInt(t.student_age) : t.student_age,
                course_type: courseType, // 使用 course_types 的 ID
              })
              matched = true
              break
            }
          }
          if (!matched) {
            unmatchedTrialStudents.push({
              ...t,
              full_name: t.full_name || '',
              lesson_date: t.lesson_date || '',
              actual_timeslot: t.actual_timeslot || '',
              weekday: weekdayNum,
              student_age: typeof t.student_age === 'string' ? parseInt(t.student_age) : t.student_age,
              course_type: courseType // 使用 course_types 的 ID
            })
          }
        }
        console.log('所有 schedule key:', allScheduleKeys)
        console.log('無法分配的試堂學生:', unmatchedTrialStudents)
        
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
          
          const courseType = s.course_type || '' // 使用 course_types 的 ID
          
          // 嘗試多種匹配方式
          const possibleKeys = [
            `${weekdayNum}_${s.regular_timeslot}_${courseType}`, // 完整匹配
            `${weekdayNum}_${s.regular_timeslot}_`, // 不考慮 course_type
            `${weekdayNum}_${s.regular_timeslot}` // 最簡單匹配
          ]
          
          // 使用第一個匹配的 key
          const key = possibleKeys[0]
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
        

        
        // 6. 基於 hanami_schedule 表生成時段，並計算每班學生數量
        // 先按時段和課程分組，然後輪流分配學生
        const mapped: Slot[] = []
        
        // 先按時段和課程分組
        const scheduleGroups: {[key: string]: any[]} = {}
        scheduleData?.forEach(schedule => {
          const courseType = schedule.course_type || ''
          const key = `${schedule.weekday}_${schedule.timeslot}_${courseType}`
          if (!scheduleGroups[key]) scheduleGroups[key] = []
          scheduleGroups[key].push(schedule)
        })
        
        // 為每個 schedule 分配學生
        scheduleData?.forEach((schedule) => {
          const courseType = schedule.course_type || ''
          const weekdayNum = schedule.weekday
          const groupKey = `${weekdayNum}_${schedule.timeslot}_${courseType}`
          const groupSchedules = scheduleGroups[groupKey] || []
          const scheduleIndex = groupSchedules.findIndex(s => s.id === schedule.id)
          

          
          // 取得該時段該課程的所有學生
          const allRegularStudents = (regularData || []).filter(s => {
            if (!s.regular_timeslot || s.regular_weekday === null || s.regular_weekday === undefined) return false
            
            let sWeekdayNum: number
            if (typeof s.regular_weekday === 'string') {
              sWeekdayNum = parseInt(s.regular_weekday)
              if (isNaN(sWeekdayNum)) return false
            } else {
              sWeekdayNum = s.regular_weekday
            }
            
            // 將學生的課程名稱轉換為課程ID進行匹配
            const studentCourseName = s.course_type || ''
            const scheduleCourseType = courseType || ''
            
            // 方法1：直接比較課程名稱（如果學生的course_type是課程名稱）
            const matchByName = sWeekdayNum === weekdayNum && 
                   s.regular_timeslot === schedule.timeslot && 
                   studentCourseName === (courseTypesMap[scheduleCourseType] || scheduleCourseType)
            
            // 方法2：比較課程ID（如果學生的course_type是課程ID）
            const matchById = sWeekdayNum === weekdayNum && 
                   s.regular_timeslot === schedule.timeslot && 
                   studentCourseName === scheduleCourseType
            
            const match = matchByName || matchById
            
            // 調試信息：檢查學生匹配
            if (sWeekdayNum === weekdayNum && s.regular_timeslot === schedule.timeslot) {
              console.log(`學生匹配檢查 - 學生: ${s.full_name}, 時段: ${schedule.timeslot}, 星期: ${weekdayNum}`)
              console.log(`  學生課程: ${studentCourseName}, 時段課程ID: ${scheduleCourseType}`)
              console.log(`  時段課程名稱: ${courseTypesMap[scheduleCourseType] || scheduleCourseType}`)
              console.log(`  學生星期: ${sWeekdayNum}, 時段星期: ${weekdayNum}`)
              console.log(`  學生時段: ${s.regular_timeslot}, 時段時段: ${schedule.timeslot}`)
              console.log(`  按名稱匹配: ${matchByName}, 按ID匹配: ${matchById}`)
              console.log(`  最終匹配結果: ${match}`)
            }
            
            return match
          })
          
          const allTrialStudents = (trialData || []).filter(t => {
            if (!t.actual_timeslot || !t.lesson_date) return false
            
            const lessonDate = new Date(t.lesson_date)
            const tWeekdayNum = lessonDate.getDay()
            
            // 將試堂學生的課程名稱轉換為課程ID進行匹配
            const trialCourseName = t.course_type || ''
            const scheduleCourseType = courseType || ''
            
            // 方法1：直接比較課程名稱（如果試堂學生的course_type是課程名稱）
            const matchByName = tWeekdayNum === weekdayNum && 
                   t.actual_timeslot === schedule.timeslot && 
                   trialCourseName === (courseTypesMap[scheduleCourseType] || scheduleCourseType)
            
            // 方法2：比較課程ID（如果試堂學生的course_type是課程ID）
            const matchById = tWeekdayNum === weekdayNum && 
                   t.actual_timeslot === schedule.timeslot && 
                   trialCourseName === scheduleCourseType
            
            const match = matchByName || matchById
            
            // 調試信息：檢查試堂學生匹配
            if (tWeekdayNum === weekdayNum && t.actual_timeslot === schedule.timeslot) {
              console.log(`試堂學生匹配檢查 - 學生: ${t.full_name}, 時段: ${schedule.timeslot}, 星期: ${weekdayNum}`)
              console.log(`  試堂學生課程: ${trialCourseName}, 時段課程ID: ${scheduleCourseType}`)
              console.log(`  時段課程名稱: ${courseTypesMap[scheduleCourseType] || scheduleCourseType}`)
              console.log(`  試堂學生星期: ${tWeekdayNum}, 時段星期: ${weekdayNum}`)
              console.log(`  試堂學生時段: ${t.actual_timeslot}, 時段時段: ${schedule.timeslot}`)
              console.log(`  按名稱匹配: ${matchByName}, 按ID匹配: ${matchById}`)
              console.log(`  最終匹配結果: ${match}`)
            }
            
            return match
          })
          
          // 調試信息：檢查學生數量
          console.log(`時段 ${schedule.timeslot} 星期 ${weekdayNum} 課程 ${courseType}:`)
          console.log(`  常規學生數量: ${allRegularStudents.length}`)
          console.log(`  試堂學生數量: ${allTrialStudents.length}`)
          
          // 輪流分配學生到不同的 schedule
          let trialStudents = (allTrialStudents as any[]).filter((_, index) => index % groupSchedules.length === scheduleIndex)
          
          console.log(`  總學生數量: ${allRegularStudents.length + trialStudents.length}`)
          
          const slotRegularAges = allRegularStudents
            .map(s => s.student_age)
            .filter((age): age is number => age !== null && age !== undefined && !isNaN(age))
          
          // 計算該時段最快有空位的日子
          const availableDates: {date: string, remain: number}[] = []
          
          // 獲取該時段所有常規學生的ID
          const regularStudentIds = allRegularStudents.map(s => s.id)
          if (allLessonData && regularStudentIds.length > 0) {
            // 輸出一筆 lessonData 範例
            if (allLessonData.length > 0) {
              console.log('【DEBUG】allLessonData 範例:', allLessonData[0])
            }
            // 輸出 allRegularStudents id
            console.log('【DEBUG】allRegularStudents id:', regularStudentIds)
            
            // 查詢這些學生在未來日期的課堂記錄
            // 需要處理課程類型的比對：lessonData中的course_type可能是課程名稱或ID
            const studentLessons = allLessonData.filter(lesson => {
              const lessonCourseType = lesson.course_type || ''
              const scheduleCourseType = courseType || ''
              
              // 方法1：直接比較課程ID
              const matchById = lesson.course_type === courseType
              
              // 方法2：比較課程名稱（如果lesson中的course_type是課程名稱）
              const matchByName = lessonCourseType === (courseTypesMap[scheduleCourseType] || scheduleCourseType)
              
              const courseMatch = matchById || matchByName
              
              return lesson.student_id && regularStudentIds.includes(lesson.student_id) && 
                     lesson.actual_timeslot === schedule.timeslot && 
                     courseMatch
            })
            // 按日期分組，計算每天實際出席的學生數量
            const dailyAttendance: {[date: string]: number} = {}
            studentLessons.forEach(lesson => {
              if (!lesson.lesson_date) return;
              if (!dailyAttendance[lesson.lesson_date]) {
                dailyAttendance[lesson.lesson_date] = 0
              }
              dailyAttendance[lesson.lesson_date]++
            })
            // 計算每個日期的剩餘空位
            const dateMap: {[date: string]: number} = {}
            // 檢查未來8週的該星期日期
            const today = new Date()
            for (let week = 0; week < 8; week++) {
              const d = new Date(today)
              d.setDate(d.getDate() + (7 + weekdayNum - d.getDay()) % 7 + (week * 7))
              const dateStr = d.toISOString().slice(0, 10)
              // 計算該日該時段該課程的試堂學生數
              // 從 hanami_trial_lesson 表查詢試堂學生的課堂記錄
              const trialLessons = allLessonData.filter(lesson => {
                const lessonCourseType = lesson.course_type || ''
                const scheduleCourseType = courseType || ''
                
                // 方法1：直接比較課程ID
                const matchById = lesson.course_type === courseType
                
                // 方法2：比較課程名稱（如果lesson中的course_type是課程名稱）
                const matchByName = lessonCourseType === (courseTypesMap[scheduleCourseType] || scheduleCourseType)
                
                const courseMatch = matchById || matchByName
                
                return lesson.lesson_date === dateStr && 
                       lesson.actual_timeslot === schedule.timeslot && 
                       courseMatch &&
                       // 確保是試堂學生的記錄（不在常規學生ID列表中）
                       lesson.student_id && !regularStudentIds.includes(lesson.student_id)
              })
              
              const trialCount = trialLessons.length
              
              // 獲取該課程類型的試堂人數限制
              const trialLimit = trialLimitSettings[courseType] || 0
              
              // 計算試堂學生是否已達限制
              const trialAtLimit = trialCount >= trialLimit
              // 計算該日實際出席的常規學生數
              const regularCount = dailyAttendance[dateStr] || 0
              // 計算剩餘空位
              const remain = (schedule.max_students || 0) - regularCount - trialCount
              
              // 考慮試堂人數限制：如果試堂學生已達限制，則不顯示該日期有空位
              const canAcceptTrial = trialLimit === 0 || trialCount < trialLimit
              
              // 詳細 log
              console.log(`【DEBUG】${dateStr}｜${schedule.timeslot}｜${courseType}：regularCount=${regularCount}，trialCount=${trialCount}，trialLimit=${trialLimit}，canAcceptTrial=${canAcceptTrial}，remain=${remain}`)
              
              if (remain > 0 && canAcceptTrial) {
                dateMap[dateStr] = remain
              }
            }
            // 轉換為陣列並排序，取前5個
            availableDates.push(...Object.entries(dateMap)
              .map(([date, remain]) => ({date, remain}))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
            )
            // 調試信息
            console.log(`時段 ${schedule.timeslot} 星期 ${weekdayNum} 課程 ${courseType} 的空位計算:`)
            console.log(`  常規學生ID: ${regularStudentIds}`)
            console.log(`  學生課堂記錄: ${studentLessons.length} 條`)
            console.log(`  每日出席記錄:`, dailyAttendance)
            console.log(`  計算出的空位日期:`, availableDates)
          }
          
          mapped.push({
            id: schedule.id,
            time: schedule.timeslot,
            course: courseTypesMap[courseType] || courseType, // 使用 courseTypesMap 而不是 courseTypes
            weekday: weekdayNum,
            max: schedule.max_students,
            current: allRegularStudents.length + trialStudents.length,
            duration: schedule.duration,
            trial_students: trialStudents,
            regular_students_ages: slotRegularAges,
            regular_students: allRegularStudents,
            available_dates: availableDates
          })
          
          // 調試信息
          console.log(`課程ID: ${courseType}, 課程名稱: ${courseTypesMap[courseType] || courseType}`)
          console.log(`課程類型映射表當前狀態:`, courseTypesMap)
          console.log(`課程ID類型: ${typeof courseType}, 值: ${courseType}`)
          console.log(`映射結果: ${courseTypesMap[courseType] || courseType}`)
        })
        
        setSlots(mapped)

        // 2. 查詢 hanami_trial_queue 輪候學生

        
        const { data: queueData, error: queueError } = await supabase
          .from('hanami_trial_queue')
          .select('id, full_name, student_age, phone_no, prefer_time, notes, course_types, created_at')
          .order('created_at', { ascending: true }); // 按舊到新排序
        

        
        if (queueError) {
          console.error('❌ 查詢輪候學生失敗:', queueError);
          // 不中斷整個流程，只是輪候學生無法顯示
        }
        

        
        if (queueError) {
          setError('無法載入排隊名單：' + queueError.message)
          return
        }
        
        // 分組到每個星期，並按班別（課程類型）分組
        const queueMap: { [weekday: string]: { [courseType: string]: any[] } } = {};

        
        for (const q of queueData || []) {
          
          
          if (!q.prefer_time) {
            
            continue;
          }
          
          let preferTime;
          if (typeof q.prefer_time === 'string') {
            try {
              preferTime = JSON.parse(q.prefer_time);

            } catch (err) {
              
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

              }
            }
          } else {

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

  useEffect(() => {
    fetchData()
  }, [])

  // 依據 slots 動態產生每一天的時段
  // 以 weekday 為主，時段內可有多班（course_type），每班可有多筆記錄
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
            <div>• hanami_schedule 表中有設定課堂空缺情況</div>
            <div>• Hanami_Students 表中有常規學生且設定了 regular_weekday 和 regular_timeslot</div>
            <div>• hanami_trial_students 表中有試堂學生且設定了 weekday 和 actual_timeslot</div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#4B4036]">課堂空缺情況</h2>
          <Image src="/rabbit.png" alt="icon" width={24} height={24} />
        </div>
        <button
          onClick={() => setShowTrialLimitModal(true)}
          className="px-3 py-1.5 bg-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#D4C4A8] transition-colors text-sm flex items-center gap-2"
        >
          <Image src="/edit-pencil.png" alt="設定" width={16} height={16} />
          試堂人數設定
        </button>
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
                {/* 課程總數統計 */}
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 && (
                  <div className="flex justify-center mb-1">
                    <div className="text-xs px-2 py-1 rounded bg-[#FFF0E5] text-[#8B4513] border border-orange-200">
                      {(() => {
                        const daySlots = slotsByDay[dayIdx] || [];
                        const totalRegular = daySlots.reduce((sum, slot) => sum + slot.regular_students.length, 0);
                        const totalTrial = daySlots.reduce((sum, slot) => sum + slot.trial_students.length, 0);
                        const totalCapacity = daySlots.reduce((sum, slot) => sum + slot.max, 0);
                        return `${totalRegular}+${totalTrial}/${totalCapacity}`;
                      })()}
                    </div>
                  </div>
                )}
                {queueByDay[dayIdx] && queueByDay[dayIdx].length > 0 && expandedQueue[dayIdx] && (
                  <div className="flex flex-col gap-2 mb-1">
                    {/* 簡化顯示：直接顯示所有輪候學生 */}
                    <div className="border border-[#EADBC8] rounded p-1 bg-[#FFF9F2]">
                      <div className="text-[10px] font-semibold text-[#4B4036] mb-1 px-1">
                        輪候學生（{queueByDay[dayIdx].length}人）
                      </div>
                          <div className="flex flex-col gap-1">
                        {queueByDay[dayIdx].map((q: any, i: number) => (
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
                              {q.courseType && (
                                <span>課程: {q.courseType}</span>
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
                      </div>
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
                          {/* 按日期分組試堂學生 */}
                          {(() => {
                            // 按日期分組
                            const studentsByDate: { [date: string]: TrialStudent[] } = {}
                            slot.trial_students.forEach(stu => {
                              if (stu.lesson_date) {
                                const dateKey = stu.lesson_date
                                if (!studentsByDate[dateKey]) {
                                  studentsByDate[dateKey] = []
                                }
                                studentsByDate[dateKey].push(stu)
                              }
                            })
                            
                            // 按日期排序
                            const sortedDates = Object.keys(studentsByDate).sort((a, b) => {
                              return new Date(a).getTime() - new Date(b).getTime()
                            })
                            
                            return sortedDates.map(dateKey => {
                              const students = studentsByDate[dateKey]
                              const dateObj = new Date(dateKey)
                              const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}`
                              const expandedKey = `${slot.weekday}_${slot.time}_${slot.course}_${slot.id}_${dateKey}`
                              
                              return (
                                <div key={dateKey} className="border border-yellow-200 rounded p-1 bg-yellow-50">
                                  <button
                                    className="w-full text-left text-xs font-semibold text-[#4B4036] mb-1 px-1 flex items-center justify-between"
                                    onClick={() => setExpandedTrialByDate(prev => ({...prev, [expandedKey]: !prev[expandedKey]}))}
                                  >
                                    <span>試堂日期: {dateStr} ({students.length}人)</span>
                                    <span className="text-[10px]">
                                      {expandedTrialByDate[expandedKey] ? '收起' : '展開'}
                                    </span>
                                  </button>
                                  {expandedTrialByDate[expandedKey] && (
                                    <div className="flex flex-col gap-1">
                                      {students.map((stu) => (
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
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                    )}
                                  </div>
                              )
                            })
                          })()}
                        </div>
                      )}
                      
                      {/* 最快有空位日子 */}
                      {slot.available_dates && slot.available_dates.length > 0 && (
                        <>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                              className="text-xs px-2 py-1 rounded bg-[#E8F5E8] text-[#2D5A2D] border border-green-200 hover:bg-[#D8F0D8] transition"
                              onClick={() => setExpandedAvailableDates(prev => ({...prev, [`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]: !prev[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]}))}
                            >
                              {expandedAvailableDates[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] ? '收起' : '展開'}最快有空位日子（{slot.available_dates?.length || 0}個）
                            </button>
                          </div>
                          {/* 展開時才顯示最快有空位日子 */}
                          {expandedAvailableDates[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="border border-green-200 rounded p-1 bg-green-50">
                                <div className="text-[10px] font-semibold text-[#2D5A2D] mb-1 px-1">
                                  最快有空位日子
                                </div>
                                <div className="flex flex-col gap-1">
                                  {slot.available_dates.map((item, idx) => {
                                    const dateObj = new Date(item.date)
                                    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}`
                                    const weekdayStr = ['日','一','二','三','四','五','六'][dateObj.getDay()]
                                    return (
                                      <div key={`${item.date}_${slot.id}`} className="flex items-center justify-between px-2 py-1 rounded bg-green-100 text-xs text-[#2D5A2D]">
                                        <span>{dateStr} ({weekdayStr})</span>
                                        <span>剩餘 {item.remain} 位</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
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
            <div className="w-4 h-4 bg-[#FFF0E5] border border-orange-200 rounded"></div>
            <span>課程總數統計（學生數/滿額數）</span>
          </div>
          <div className="flex items-center gap-2">
            <span>格式：常規+試堂/可容納人數</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#87704e]">
            <span>※ 例如：3+2/5 表示3個常規學生+2個試堂學生，共可容納5人</span>
          </div>
        </div>
      </div>
      
      {/* 試堂人數設定模態框 */}
      <TrialLimitSettingsModal
        isOpen={showTrialLimitModal}
        onClose={() => setShowTrialLimitModal(false)}
        onSave={(settings) => {
          setTrialLimitSettings(settings)
          setShowTrialLimitModal(false)
          // 重新載入資料以更新有位時間計算
          fetchData()
        }}
        currentSettings={trialLimitSettings}
      />
    </div>
  )
}
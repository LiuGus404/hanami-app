'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { TrialLesson } from '@/types';
import { ScheduleSlot, PreferTime, ScheduleOption } from '@/types/schedule';

export default function TrialQueueForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;
  
  const [form, setForm] = useState({
    id: crypto.randomUUID() || '',
    full_name: '',
    student_dob: '',
    student_age: '',
    student_id: '',
    prefer_time: [] as string[],
    notes: '',
    status: 'trial',
    created_at: '',
    phone_no: '',
    course_types: [] as string[],
  });

  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [courseTypes, setCourseTypes] = useState<string[]>([]);

  // 載入課堂空缺情況選項
  useEffect(() => {
    setLoadingSchedule(true);
    try {
      // 固定提供3個時段選項
      const fixedTimeSlots = [
        '09:00-12:30',
        '13:00-16:00', 
        '16:00-19:30',
      ];
      
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const options: ScheduleOption[] = [];
      
      // 為每一天生成3個時段選項
      weekdays.forEach((day, weekdayIndex) => {
        fixedTimeSlots.forEach(timeslot => {
          options.push({
            label: `${day} ${timeslot}`,
            value: `${weekdayIndex}_${timeslot}`,
            weekday: weekdayIndex,
            timeslot,
          });
        });
      });
      
      setScheduleOptions(options);
      console.log('✅ 載入固定課堂空缺情況選項:', options);
    } catch (err) {
      console.error('❌ 載入課堂空缺情況異常:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  // 載入課程類型
  useEffect(() => {
    const loadCourseTypes = async () => {
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('name')
        .eq('status', true)
        .order('name');
      if (!error && data) {
        setCourseTypes(data.map((c: any) => c.name).filter(Boolean));
      }
    };
    loadCourseTypes();
  }, []);

  // 載入現有資料（如果是編輯模式）
  useEffect(() => {
    const loadExistingData = async () => {
      if (!isEditMode || !editId || initialized) return;
      
      setLoading(true);
      try {
        console.log('🔍 嘗試載入資料，editId:', editId);
        
        // 先嘗試用 id 查詢
        let { data, error } = await supabase
          .from('hanami_trial_queue')
          .select('*')
          .eq('id', editId)
          .single();
        
        // 如果找不到，嘗試用 student_id 查詢
        if (error && error.code === 'PGRST116') {
          console.log('🔍 用 id 查詢失敗，嘗試用 student_id 查詢');
          const { data: data2, error: error2 } = await supabase
            .from('hanami_trial_queue')
            .select('*')
            .eq('student_id', editId)
            .single();
          
          data = data2;
          error = error2;
        }
        
        if (error) {
          console.error('❌ 載入資料錯誤:', error);
          alert(`載入資料失敗：${error.message}`);
          return;
        }
        
        if (data) {
          // 解析 prefer_time JSON
          let preferTimeArray: string[] = [];
          if (data.prefer_time) {
            try {
              const preferTime = typeof data.prefer_time === 'string' 
                ? JSON.parse(data.prefer_time) 
                : data.prefer_time;
              
              if (preferTime.week && Array.isArray(preferTime.week) && preferTime.range && Array.isArray(preferTime.range)) {
                // 將 week 和 range 轉換為選項值
                preferTimeArray = preferTime.range.map((range: string) => {
                  const [weekday, timeslot] = range.split('_');
                  const dayMap = {
                    0: '星期日',
                    1: '星期一', 
                    2: '星期二',
                    3: '星期三',
                    4: '星期四',
                    5: '星期五',
                    6: '星期六',
                  };
                  const dayText = dayMap[parseInt(weekday) as keyof typeof dayMap] || `星期${weekday}`;
                  return `${dayText} ${timeslot?.slice(0, 5) || ''}`;
                });
              }
            } catch (err) {
              console.error('❌ 解析 prefer_time 錯誤:', err);
            }
          }
          
          // 轉換年齡格式
          let ageText = '';
          if (data.student_age !== null && data.student_age !== undefined) {
            const years = Math.floor(data.student_age / 12);
            const months = data.student_age % 12;
            ageText = `${years}Y${months}M`;
          }
          
          setForm({
            id: data.id || '',
            full_name: data.full_name || '',
            student_dob: data.student_dob || '',
            student_age: ageText,
            student_id: data.student_id || '',
            prefer_time: preferTimeArray,
            notes: data.notes || '',
            status: data.status || 'pending',
            created_at: data.created_at || '',
            phone_no: data.phone_no || '',
            course_types: data.course_types ? (typeof data.course_types === 'string' ? JSON.parse(data.course_types) : data.course_types) : [],
          });
        }
      } catch (err) {
        console.error('❌ 載入資料異常:', err);
        alert('載入資料時發生錯誤');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    
    loadExistingData();
  }, [isEditMode, editId, initialized]);

  const handleChange = (field: keyof TrialLesson | 'course_types', value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // 將 "1Y5M" 轉為月齡
    let ageInMonths = 0;
    if (form.student_age && typeof form.student_age === 'string') {
      const match = form.student_age.match(/(\d+)Y(\d+)M/);
      if (match) {
        const years = parseInt(match[1]);
        const months = parseInt(match[2]);
        ageInMonths = years * 12 + months;
      }
    }
    
    // 轉換 prefer_time 為正確的 JSON 格式
    const selectedWeeks = new Set<number>();
    const selectedRanges: string[] = [];
    
    form.prefer_time.forEach((entry) => {
      const [dayText, timeText] = (entry).split(' ');
      const dayMap = {
        '星期日': 0,
        '星期一': 1,
        '星期二': 2,
        '星期三': 3,
        '星期四': 4,
        '星期五': 5,
        '星期六': 6,
      };
      const weekday = dayMap[dayText as keyof typeof dayMap];
      if (weekday !== undefined) {
        selectedWeeks.add(weekday);
        // 找到對應的 schedule 選項
        const option = scheduleOptions.find(opt => 
          opt.label === `${dayText} ${timeText}`,
        );
        if (option) {
          selectedRanges.push(option.value);
        }
      }
    });
    
    // 轉換為 JSON 格式
    const preferTimeJson: PreferTime = {
      week: Array.from(selectedWeeks).sort(),
      range: selectedRanges,
    };
    
    const id = form.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    // 清理資料，將空字串轉換為 null
    const insertData: any = {
      id,
      full_name: form.full_name || null,
      student_dob: form.student_dob || null,
      student_age: ageInMonths || null,
      phone_no: form.phone_no || null,
      prefer_time: JSON.stringify(preferTimeJson),
      notes: form.notes || null,
      status: '未試堂',
      created_at: now,
      course_types: Array.isArray(form.course_types) ? form.course_types : null,
    };
    
    // 只有在 student_id 不為空時才包含
    if (form.student_id && form.student_id.trim() !== '') {
      insertData.student_id = form.student_id;
    }
    
    console.log('🔍 準備', isEditMode ? '更新' : '插入', '的資料:', insertData);
    
    let error;
    if (isEditMode) {
      // 更新現有資料
      const { error: updateError } = await supabase
        .from('hanami_trial_queue')
        .update(insertData)
        .eq('id', editId);
      error = updateError;
    } else {
      // 插入新資料
      const { error: insertError } = await supabase
        .from('hanami_trial_queue')
        .insert([insertData]);
      error = insertError;
    }
    
    if (!error) {
      setSubmitted(true);
    } else {
      console.error('❌', isEditMode ? '更新' : '插入', '錯誤:', error);
      alert(`提交失敗：${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-md mx-auto text-center bg-[#FFFAF2] rounded-xl border border-[#EADBC8]">
        <div className="text-[#4B4036]">載入中...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-md mx-auto text-center bg-[#FFFAF2] rounded-xl border border-[#EADBC8]">
        <Image alt="success" className="mx-auto mb-3" height={48} src="/rabbit.png" width={48} />
        <h2 className="text-[#4B4036] font-semibold text-lg">已成功{isEditMode ? '更新' : '提交'}！</h2>
        <p className="text-sm text-[#87704e] mt-1">
          {isEditMode ? '學生資料已更新' : '我們會儘快聯絡你安排試堂'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-[#FFFDF7] rounded-xl border border-[#EADBC8] shadow">
      <h2 className="text-lg font-bold text-[#4B4036] mb-4 text-center">
        {isEditMode ? '編輯輪候學生' : '輪候登記表'}
      </h2>

      <div className="flex flex-col gap-4">
        {/* 學生姓名 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">小朋友姓名 *</label>
          <input
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
            placeholder="請輸入小朋友全名"
            type="text"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
          />
        </div>

        {/* 出生日期 + 計算按鈕 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">出生日期 *</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
              type="date"
              value={form.student_dob}
              onChange={(e) => handleChange('student_dob', e.target.value)}
            />
            <button
              className="px-3 py-2 bg-[#EADBC8] text-[#4B4036] rounded-lg text-sm"
              type="button"
              onClick={() => {
                if (form.student_dob) {
                  const birth = new Date(form.student_dob);
                  const now = new Date();
                  const nowYear = now.getFullYear();
                  const nowMonth = now.getMonth();
                  let years = nowYear - birth.getFullYear();
                  let months = nowMonth - birth.getMonth();
                  if (now.getDate() < birth.getDate()) {
                    months -= 1;
                  }
                  if (months < 0) {
                    years -= 1;
                    months += 12;
                  }
                  handleChange('student_age', `${years}Y${months}M`);
                  alert('已成功計算年齡');
                } else {
                  alert('請先輸入出生日期');
                }
              }}
            >
              點我計算年齡
            </button>
          </div>
        </div>

        {/* 學生年齡 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">小朋友年齡</label>
          <input
            disabled
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFF8EE] text-[#4B4036] opacity-80 cursor-not-allowed"
            placeholder="請輸入出生日期後按計算"
            type="text"
            value={form.student_age}
          />
        </div>

        {/* 聯絡電話 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">聯絡電話 *</label>
          <input
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
            placeholder="請輸入家長電話"
            type="text"
            value={form.phone_no}
            onChange={(e) => handleChange('phone_no', e.target.value)}
          />
        </div>

        {/* 新增 想排課程 多選欄位 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">想排課程（可選多項）</label>
          <div className="flex flex-wrap gap-2">
            {courseTypes.map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full text-sm border ${
                  (form.course_types).includes(type)
                    ? 'bg-[#FDE6C2] border-[#E4B888] text-[#4B4036]'
                    : 'bg-white border-[#D8CDBF] text-[#87704e]'
                }`}
                type="button"
                onClick={() => {
                  const arr = Array.isArray(form.course_types) ? form.course_types : [];
                  const updated = arr.includes(type)
                    ? arr.filter((t: string) => t !== type)
                    : [...arr, type];
                  handleChange('course_types', updated);
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 第一層：可試堂時間 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">會想預約的課堂空缺情況（可選多項）</label>
          {loadingSchedule ? (
            <div className="text-center py-4 text-[#87704e]">載入課堂空缺情況中...</div>
          ) : scheduleOptions.length === 0 ? (
            <div className="text-center py-4 text-[#87704e]">暫無可選的課堂空缺情況</div>
          ) : (
            <div className="flex flex-col">
              {Array.from(new Set(scheduleOptions.map(opt => opt.weekday))).sort().map((weekday) => {
                const dayOptions = scheduleOptions.filter(opt => opt.weekday === weekday);
                const dayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                const dayText = dayMap[weekday];
                
                return (
                  <div key={weekday} className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-[#4B4036] min-w-[60px]">{dayText}</div>
                      <div className="space-x-2 text-sm flex-shrink-0">
                        <button
                          className="px-1.5 py-0.5 text-xs bg-white text-[#4B4036] border border-[#D8CDBF] rounded-md hover:bg-[#f5f5f5] transition"
                          type="button"
                          onClick={() => {
                            const updated = [
                              ...form.prefer_time,
                              ...dayOptions.map((opt) => opt.label),
                            ].filter((v, i, arr) => arr.indexOf(v) === i); // 去重
                            handleChange('prefer_time', updated);
                          }}
                        >
                          全選
                        </button>
                        <button
                          className="px-1.5 py-0.5 text-xs bg-white text-[#87704e] border border-[#D8CDBF] rounded-md hover:bg-[#f5f5f5] transition"
                          type="button"
                          onClick={() => {
                            const updated = form.prefer_time.filter((v) => !dayOptions.map((opt) => opt.label).includes(v));
                            handleChange('prefer_time', updated);
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map((option) => {
                        const label = option.label;
                        return (
                          <button
                            key={label}
                            className={`px-3 py-1 rounded-full text-sm border ${
                              (form.prefer_time).includes(label)
                                ? 'bg-[#FDE6C2] border-[#E4B888] text-[#4B4036]'
                                : 'bg-white border-[#D8CDBF] text-[#87704e]'
                            }`}
                            onClick={() => {
                              const current = form.prefer_time;
                              const updated = (current).includes(label)
                                ? (current).filter((v) => v !== label)
                                : [...(current), label];
                              handleChange('prefer_time', updated);
                            }}
                          >
                            {option.timeslot || ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 第二層：其他備註與具體時間需求 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">學習目標或其他備註</label>
          <textarea
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
            placeholder="例如：小朋友午睡時間是1300-1500，所以1500後都ok;屯門放學出來最快要1730才能到達；小朋友目標是培養興趣"
            rows={3}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

        <button
          className="w-full bg-[#A68A64] text-white py-2 rounded-full font-semibold hover:bg-[#8f7350] transition"
          onClick={handleSubmit}
        >
          {isEditMode ? '更新資料' : '提交登記'}
        </button>
      </div>
    </div>
  );
}
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { ScheduleOption, PreferTime } from '@/types/schedule';

// 兼容的 UUID 生成函數
const generateUUID = () => {
  // 優先使用 crypto.randomUUID（如果支援）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback：使用 Math.random 生成 UUID v4 格式
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function TrialRegisterPage() {
  const [form, setForm] = useState({
    id: generateUUID() || '',
    full_name: '',
    student_dob: '',
    student_age: '',
    student_id: '',
    prefer_time: [],
    notes: '',
    status: 'pending',
    created_at: '',
    phone_no: '',
    course_types: [] as string[],
  });

  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseTypes, setCourseTypes] = useState<string[]>([]);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaResult, setCaptchaResult] = useState(0);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaText, setCaptchaText] = useState('');

  // 生成圖片驗證碼
  const generateCaptcha = () => {
    // 確保在客戶端環境
    if (typeof window === 'undefined') return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 120;
    canvas.height = 40;

    // 生成隨機驗證碼文字（4位數字和字母組合）
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < 4; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);

    // 設置背景
    ctx.fillStyle = '#FFF9F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加干擾線
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // 添加干擾點
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    // 繪製文字
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#4B4036';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 為每個字符添加輕微旋轉和位置偏移
    for (let i = 0; i < text.length; i++) {
      const x = 30 + i * 20;
      const y = 20 + (Math.random() - 0.5) * 10;
      const rotation = (Math.random() - 0.5) * 0.3;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // 轉換為base64圖片
    const imageData = canvas.toDataURL('image/png');
    setCaptchaImage(imageData);
  };

  // 生成驗證題目
  useEffect(() => {
    // 確保在客戶端環境才生成驗證碼
    if (typeof window !== 'undefined') {
      generateCaptcha();
    }
  }, []);

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
      
      const weekdays = ['星期日', '星期二', '星期三', '星期四', '星期五', '星期六'];
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

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // 驗證人機驗證
    if (!captchaAnswer.trim()) {
      alert('請完成人機驗證');
      return;
    }
    
    if (captchaAnswer.toUpperCase() !== captchaText) {
      alert('驗證碼錯誤，請重新輸入');
      setCaptchaAnswer('');
      generateCaptcha();
      return;
    }
    
    // 將 "1Y5M" 轉換為月齡數字
    let ageInMonths = null;
    if (form.student_age && typeof form.student_age === 'string') {
      const match = form.student_age.match(/(\d+)Y(\d+)M/);
      if (match) {
        const years = parseInt(match[1]);
        const months = parseInt(match[2]);
        ageInMonths = years * 12 + months;
      } else {
        // 如果只有月數
        const monthMatch = form.student_age.match(/(\d+)M/);
        if (monthMatch) {
          ageInMonths = parseInt(monthMatch[1]);
        } else {
          // 如果只有年數
          const yearMatch = form.student_age.match(/(\d+)Y/);
          if (yearMatch) {
            ageInMonths = parseInt(yearMatch[1]) * 12;
          }
        }
      }
    }
    
    // 轉換 prefer_time 為正確的 JSON 格式
    const selectedWeeks = new Set<number>();
    const selectedRanges: string[] = [];
    
    form.prefer_time.forEach((entry) => {
      const [dayText, timeText] = (entry as string).split(' ');
      const dayMap = {
        '星期日': 0,
        '星期二': 1,
        '星期三': 2,
        '星期四': 3,
        '星期五': 4,
        '星期六': 5,
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
    
    const id = form.id || generateUUID();
    const now = new Date().toISOString();
    
    // 清理資料，將空字串轉換為 null
    const insertData: any = {
      id,
      full_name: form.full_name || null,
      student_dob: form.student_dob || null,
      student_age: ageInMonths,
      phone_no: form.phone_no || null,
      prefer_time: JSON.stringify(preferTimeJson),
      notes: form.notes || null,
      status: '未試堂',
      created_at: now,
      course_types: Array.isArray(form.course_types) && form.course_types.length > 0 ? JSON.stringify(form.course_types) : null,
    };
    
    // 只有在 student_id 不為空時才包含
    if (form.student_id && form.student_id.trim() !== '') {
      insertData.student_id = form.student_id;
    }
    
    console.log('🔍 準備插入的資料:', insertData);
    
    try {
      // 確保所有資料都是正確的型別
      const cleanData = {
        ...insertData,
        student_age: ageInMonths,
        course_types: Array.isArray(form.course_types) && form.course_types.length > 0 ? JSON.stringify(form.course_types) : null,
      };
      
      console.log('🔍 清理後的資料:', cleanData);
      
      const { error } = await supabase
        .from('hanami_trial_queue')
        .insert([cleanData]);
      
      if (!error) {
        // 同時插入到 hanami_trial_students 表
        try {
          // 生成 student_oid (B840FAF 格式)
          const generateStudentOid = () => {
            const chars = '0123456789ABCDEF';
            let result = '';
            for (let i = 0; i < 7; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };

          // 準備插入到 hanami_trial_students 的資料
          const trialStudentData = {
            student_oid: generateStudentOid(),
            full_name: form.full_name || null,
            student_dob: form.student_dob || null,
            lesson_date: null, // 試聽日期需要後續安排
            lesson_duration: null,
            course_type: form.course_types && form.course_types.length > 0 ? form.course_types[0] : null,
            contact_number: form.phone_no || null,
            parent_email: null, // 試聽註冊表單中沒有此欄位
            trial_status: 'pending',
            trial_remarks: form.notes || null,
            student_age: ageInMonths || null,
            health_notes: null,
            student_preference: null,
            weekday: form.prefer_time && form.prefer_time.length > 0 ? (form.prefer_time[0] as any).weekday : null,
            address: null,
            school: null,
            student_email: null,
            student_password: null,
            gender: null,
            student_type: '試堂',
            student_teacher: null,
            regular_weekday: form.prefer_time && form.prefer_time.length > 0 ? (form.prefer_time[0] as any).weekday : null,
            regular_timeslot: form.prefer_time && form.prefer_time.length > 0 ? (form.prefer_time[0] as any).timeslot : null,
            access_role: 'trial_student',
            duration_months: null,
            nick_name: null,
            remaining_lessons: 1, // 試聽通常只有1堂課
            ongoing_lessons: 0,
            upcoming_lessons: 1,
            actual_timeslot: null,
            confirmed_payment: false // 支付確認狀態，提交時設為 false，之後可手動更新為 true
          };

          console.log('🔍 準備插入到 hanami_trial_students 的資料:', trialStudentData);

          const { error: trialStudentError } = await supabase
            .from('hanami_trial_students')
            .insert([trialStudentData]);

          if (trialStudentError) {
            console.error('❌ 插入 hanami_trial_students 錯誤:', trialStudentError);
            console.error('❌ 錯誤詳情:', {
              message: trialStudentError.message,
              details: trialStudentError.details,
              hint: trialStudentError.hint,
              code: trialStudentError.code
            });
            // 不影響主要流程，只記錄錯誤
          } else {
            console.log('✅ 成功插入到 hanami_trial_students');
          }
        } catch (trialStudentErr) {
          console.error('❌ 插入 hanami_trial_students 異常:', trialStudentErr);
          // 不影響主要流程，只記錄錯誤
        }

        // 發送webhook通知
        try {
          const webhookData = {
            event: 'trial_registration',
            timestamp: new Date().toISOString(),
            data: {
              student_name: form.full_name,
              phone: form.phone_no,
              age: form.student_age,
              course_types: form.course_types,
              prefer_time: form.prefer_time,
              notes: form.notes,
              registration_time: now,
            },
          };
          
          // 使用no-cors模式避免CORS問題
          await fetch('https://webhook.lingumiai.com/webhook/f46df434-86ea-4fb0-97a6-9911eae45b20', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData),
          });
          
          console.log('✅ Webhook發送成功');
        } catch (webhookError) {
          console.error('⚠️ Webhook發送失敗:', webhookError);
          // Webhook失敗不影響主要功能
        }
        
        setSubmitted(true);
      } else {
        console.error('❌ 插入錯誤:', error);
        alert(`提交失敗：${error.message}`);
        generateCaptcha(); // 提交失敗時更新驗證碼
        setCaptchaAnswer(''); // 清空驗證碼輸入
      }
    } catch (err) {
      console.error('❌ 提交異常:', err);
      alert('提交時發生錯誤');
      generateCaptcha(); // 發生錯誤時更新驗證碼
      setCaptchaAnswer(''); // 清空驗證碼輸入
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF9F2]">
        <div className="p-6 max-w-md mx-auto text-center bg-[#FFFAF2] rounded-xl border border-[#EADBC8]">
          <div className="text-[#4B4036]">載入中...</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF9F2]">
        <div className="p-6 max-w-md mx-auto text-center bg-[#FFFAF2] rounded-xl border border-[#EADBC8]">
          <Image alt="success" className="mx-auto mb-3" height={48} src="/rabbit.png" width={48} />
          <h2 className="text-[#4B4036] font-semibold text-lg">已成功提交！</h2>
          <p className="text-sm text-[#87704e] mt-1">
            我們會儘快聯絡你安排試堂
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="p-6 max-w-md mx-auto bg-[#FFFDF7] rounded-xl border border-[#EADBC8] shadow">
          <h2 className="text-lg font-bold text-[#4B4036] mb-4 text-center">
            輪候登記表
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

            {/* 想排課程 多選欄位 */}
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

            {/* 可試堂時間 */}
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
                    const dayMap = ['星期日', '星期二', '星期三', '星期四', '星期五', '星期六'];
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
                                handleChange('prefer_time', updated as string[]);
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
                                  (form.prefer_time as string[]).includes(label)
                                    ? 'bg-[#FDE6C2] border-[#E4B888] text-[#4B4036]'
                                    : 'bg-white border-[#D8CDBF] text-[#87704e]'
                                }`}
                                onClick={() => {
                                  const current = form.prefer_time;
                                  const updated = (current as string[]).includes(label)
                                    ? (current as string[]).filter((v) => v !== label)
                                    : [...(current as string[]), label];
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

            {/* 其他備註與具體時間需求 */}
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

            {/* 人機驗證 */}
            <div className="bg-[#FFF8EE] p-4 rounded-lg border border-[#EADBC8]">
              <label className="block text-sm text-[#4B4036] mb-2 font-medium">
                🔒 人機驗證（防止機器人提交）
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {captchaImage ? (
                    <img 
                      alt="驗證碼" 
                      className="border border-[#EADBC8] rounded bg-white" 
                      src={captchaImage}
                      style={{ width: '120px', height: '40px' }}
                    />
                  ) : (
                    <div 
                      className="border border-[#EADBC8] rounded bg-white flex items-center justify-center"
                      style={{ width: '120px', height: '40px' }}
                    >
                      <span className="text-[#87704e] text-sm">載入中...</span>
                    </div>
                  )}
                  <button
                    className="absolute -top-1 -right-1 w-6 h-6 bg-[#FFB84C] text-white rounded-full text-xs flex items-center justify-center hover:bg-[#FFA726] transition-colors"
                    title="重新生成驗證碼"
                    type="button"
                    onClick={generateCaptcha}
                  >
                    ↻
                  </button>
                </div>
                <input
                  className="flex-1 border border-[#EADBC8] rounded-lg px-4 py-2 bg-white text-[#4B4036] uppercase"
                  maxLength={4}
                  placeholder="請輸入驗證碼"
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                />
              </div>
              <p className="text-xs text-[#87704e] mt-2">
                請輸入上方圖片中的驗證碼（不區分大小寫），以證明您是真人
              </p>
            </div>

            <button
              className="w-full bg-[#A68A64] text-white py-2 rounded-full font-semibold hover:bg-[#8f7350] transition"
              onClick={handleSubmit}
            >
              提交登記
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
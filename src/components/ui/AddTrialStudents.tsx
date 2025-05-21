'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { TrialLesson } from '@/types'

export default function TrialQueueForm() {
  const [form, setForm] = useState({
    id: crypto.randomUUID() || '',
    full_name: '',
    student_dob: '',
    student_age: '',
    student_id: '',
    prefer_time: [],
    notes: '',
    status: '候補中',
    created_at: '',
    phone_no: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field: keyof TrialLesson, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  const handleSubmit = async () => {
    // 將 "1Y5M" 轉為月齡
    let ageInMonths = 0
    if (form.student_age && typeof form.student_age === 'string') {
      const match = form.student_age.match(/(\d+)Y(\d+)M/)
      if (match) {
        const years = parseInt(match[1])
        const months = parseInt(match[2])
        ageInMonths = years * 12 + months
      }
    }
    const dayMap = {
      '星期日': '0',
      '星期一': '1',
      '星期二': '2',
      '星期三': '3',
      '星期四': '4',
      '星期五': '5',
      '星期六': '6',
    }
    const convertedPreferTime = form.prefer_time.map((entry) => {
      const [dayText, time] = (entry as string).split(' ')
      const weekday = dayMap[dayText as keyof typeof dayMap] ?? dayText
      return `${weekday} ${time}`
    })
    const id = form.id || crypto.randomUUID()
    const now = new Date().toISOString()
    const student_id = form.student_id && form.student_id !== '' ? form.student_id : null
    const { error } = await supabase.from('hanami_trial_queue').insert([
      { ...form, prefer_time: convertedPreferTime, id, student_id, student_age: ageInMonths, created_at: now }
    ])
    if (!error) {
      setSubmitted(true)
    } else {
      alert('提交失敗：' + error.message)
    }
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-md mx-auto text-center bg-[#FFFAF2] rounded-xl border border-[#EADBC8]">
        <Image src="/rabbit.png" alt="success" width={48} height={48} className="mx-auto mb-3" />
        <h2 className="text-[#4B4036] font-semibold text-lg">已成功提交！</h2>
        <p className="text-sm text-[#87704e] mt-1">我們會儘快聯絡你安排試堂</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-[#FFFDF7] rounded-xl border border-[#EADBC8] shadow">
      <h2 className="text-lg font-bold text-[#4B4036] mb-4 text-center">輪候登記表</h2>

      <div className="flex flex-col gap-4">
        {/* 學生姓名 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">小朋友姓名 *</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="請輸入小朋友全名"
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
          />
        </div>

        {/* 出生日期 + 計算按鈕 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">出生日期 *</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={form.student_dob}
              onChange={(e) => handleChange('student_dob', e.target.value)}
              className="flex-1 border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
            />
            <button
              type="button"
              onClick={() => {
                if (form.student_dob) {
                  const birth = new Date(form.student_dob)
                  const now = new Date()
                  const nowYear = now.getFullYear()
                  const nowMonth = now.getMonth()
                  let years = nowYear - birth.getFullYear()
                  let months = nowMonth - birth.getMonth()
                  if (now.getDate() < birth.getDate()) {
                    months -= 1
                  }
                  if (months < 0) {
                    years -= 1
                    months += 12
                  }
                  handleChange('student_age', `${years}Y${months}M`)
                  alert('已成功計算年齡')
                } else {
                  alert('請先輸入出生日期')
                }
              }}
              className="px-3 py-2 bg-[#EADBC8] text-[#4B4036] rounded-lg text-sm"
            >
              點我計算年齡
            </button>
          </div>
        </div>

        {/* 學生年齡 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">小朋友年齡</label>
          <input
            type="text"
            value={form.student_age}
            disabled
            placeholder="請輸入出生日期後按計算"
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFF8EE] text-[#4B4036] opacity-80 cursor-not-allowed"
          />
        </div>

        {/* 聯絡電話 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">聯絡電話 *</label>
          <input
            type="text"
            value={form.phone_no}
            onChange={(e) => handleChange('phone_no', e.target.value)}
            placeholder="請輸入家長電話"
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
          />
        </div>

        {/* 第一層：可試堂時間 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">會想預約的時間（可選多項）</label>
          <div className="flex flex-col">
            {[
              { day: '星期日', slots: ['0900-1200', '1300-1600', '1600-1900'] },
              { day: '星期二', slots: ['0900-1200', '1300-1600', '1600-1900'] },
              { day: '星期三', slots: ['0900-1200', '1300-1600', '1600-1900'] },
              { day: '星期四', slots: ['0900-1200', '1300-1600', '1600-1900'] },
              { day: '星期五', slots: ['0900-1200', '1300-1600', '1600-1900'] },
              { day: '星期六', slots: ['0900-1200', '1300-1600', '1600-1900'] },
            ].map(({ day, slots }, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-[#4B4036] min-w-[60px]">{day}</div>
                  <div className="space-x-2 text-sm flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [
                          ...form.prefer_time,
                          ...slots.map((slot) => `${day} ${slot}`),
                        ].filter((v, i, arr) => arr.indexOf(v) === i) // 去重
                        handleChange('prefer_time', updated as string[])
                      }}
                      className="px-1.5 py-0.5 text-xs bg-white text-[#4B4036] border border-[#D8CDBF] rounded-md hover:bg-[#f5f5f5] transition"
                    >
                      全選
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.prefer_time.filter((v) => !slots.map((slot) => `${day} ${slot}`).includes(v))
                        handleChange('prefer_time', updated as string[])
                      }}
                      className="px-1.5 py-0.5 text-xs bg-white text-[#87704e] border border-[#D8CDBF] rounded-md hover:bg-[#f5f5f5] transition"
                    >
                      取消
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const label = `${day} ${slot}`
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          const current = form.prefer_time
                          const updated = (current as string[]).includes(label)
                            ? (current as string[]).filter((v) => v !== label)
                            : [...(current as string[]), label]
                          handleChange('prefer_time', updated as string[])
                        }}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          (form.prefer_time as string[]).includes(label)
                            ? 'bg-[#FDE6C2] border-[#E4B888] text-[#4B4036]'
                            : 'bg-white border-[#D8CDBF] text-[#87704e]'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 第二層：其他備註與具體時間需求 */}
        <div>
          <label className="block text-sm text-[#4B4036] mb-1">學習目標或其他備註</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="例如：小朋友午睡時間是1300-1500，所以1500後都ok;屯門放學出來最快要1730才能到達；小朋友目標是培養興趣"
            className="w-full border border-[#EADBC8] rounded-lg px-4 py-2 bg-[#FFFCF5] text-[#4B4036]"
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#A68A64] text-white py-2 rounded-full font-semibold hover:bg-[#8f7350] transition"
        >
          提交登記
        </button>
      </div>
    </div>
  )
}
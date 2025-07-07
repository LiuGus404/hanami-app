import React from 'react'
import dynamic from 'next/dynamic'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'

// 動態導入以避免 SSR 問題
const TimePickerLib = dynamic(() => import('react-time-picker'), {
  ssr: false,
  loading: () => (
    <div className="w-full p-2 border border-[#EADBC8] rounded bg-white text-[#4B4036] animate-pulse">
      載入中...
    </div>
  )
})

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
}

export default function TimePicker({ label = "選擇時間", value, onChange }: TimePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-[#4B4036] mb-1">{label}</label>}
      <div className="hanami-timepicker-wrapper">
        <TimePickerLib
          value={value}
          onChange={(val) => { if (typeof val === 'string') onChange(val) }}
          disableClock={true}
          format="HH:mm"
          clearIcon={null}
          clockIcon={null}
          locale="zh-TW"
          className="hanami-timepicker-input"
        />
      </div>
      <style jsx global>{`
        .hanami-timepicker-wrapper .react-time-picker {
          width: 200px;
          background: #FFFDF8;
          border-radius: 1rem;
          box-shadow: 0 2px 12px #eadbc8aa;
          border: 1px solid #EADBC8;
          padding: 12px 16px;
        }
        .hanami-timepicker-input .react-time-picker__inputGroup input {
          background: transparent;
          border: none;
          color: #8A6E47;
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
        }
        .hanami-timepicker-input .react-time-picker__inputGroup__divider {
          color: #8A6E47;
          font-size: 1.5rem;
        }
        .hanami-timepicker-input .react-time-picker__inputGroup {
          gap: 0.5rem;
        }
        .hanami-timepicker-input .react-time-picker__wrapper {
          border: none;
          box-shadow: none;
        }
        .hanami-timepicker-input .react-time-picker__clear-button,
        .hanami-timepicker-input .react-time-picker__clock-button {
          display: none;
        }
      `}</style>
    </div>
  )
}
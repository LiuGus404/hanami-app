import React, { useState } from 'react'

export default function TimePicker({ label = "選擇時間", value, onChange }: {
  label?: string,
  value: string,
  onChange: (val: string) => void
}) {
  const [selectedHour, setSelectedHour] = useState(() => {
    const [h] = (value || '00:00').split(':')
    return h.padStart(2, '0')
  })
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const [, m] = (value || '00:00').split(':')
    return m?.padStart(2, '0') || '00'
  })

  React.useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':')
      setSelectedHour(h.padStart(2, '0'))
      setSelectedMinute(m.padStart(2, '0'))
    }
  }, [value])

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-[#4B4036]">{label}</label>
      <div className="bg-[#FFFDF8] rounded-2xl shadow-xl p-3 w-[200px] text-center">
        <h2 className="text-sm text-[#4B4036] mb-2">選擇時間</h2>
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="23"
              value={selectedHour}
              onChange={(e) => {
                const num = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                const h = String(num).padStart(2, '0');
                setSelectedHour(h);
                onChange(`${h}:${selectedMinute}`);
              }}
              className="w-12 text-2xl font-bold text-[#8A6E47] text-center bg-transparent border-none focus:outline-none"
            />
            <span className="text-2xl font-bold text-[#8A6E47]">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={selectedMinute}
              onChange={(e) => {
                const num = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                const m = String(num).padStart(2, '0');
                setSelectedMinute(m);
                onChange(`${selectedHour}:${m}`);
              }}
              className="w-12 text-2xl font-bold text-[#8A6E47] text-center bg-transparent border-none focus:outline-none"
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#4B4036]">{parseInt(selectedHour) >= 12 ? 'PM' : 'AM'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
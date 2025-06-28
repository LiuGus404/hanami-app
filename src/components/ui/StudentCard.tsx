'use client'

import { LucideIcon } from 'lucide-react'

type FieldItem = {
  icon: LucideIcon
  label: string
  value: string | number
  color?: string
}

type Props = {
  name: string
  selected?: boolean
  onToggle?: () => void
  fields: FieldItem[]
  avatar?: string
  studentType?: string
  isTrialStudent?: boolean
  isInactive?: boolean
}

export default function StudentCard({
  name,
  selected = false,
  onToggle,
  fields,
  avatar,
  studentType,
  isTrialStudent = false,
  isInactive = false,
}: Props) {
  return (
    <div
      onClick={onToggle}
      className={`relative border rounded-[24px] p-5 shadow flex flex-col items-center text-[#4B4B4B] cursor-pointer transition-all ${
        isInactive
          ? 'bg-gray-100 border-gray-300 opacity-60' // 停用學生的灰色樣式
          : isTrialStudent
            ? 'bg-[#FFF7D6]/50 border-[#EADBC8]' // 較淺的背景色和邊框
            : 'bg-[#FFFDF8] border-[#D8CDBF]'
      }`}
    >
      {selected && !isInactive && (
        <img
          src="/leaf-sprout.png"
          alt="Selected"
          className="absolute top-3 right-3 w-8 h-8"
        />
      )}

      {isTrialStudent && !isInactive && (
        <img
          src="/trial.png"
          alt="Trial"
          className="absolute top-3 right-3 w-10 h-10 rotate-12"
        />
      )}

      {isInactive && (
        <div className="absolute top-3 right-3 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
          已停用
        </div>
      )}

      {avatar && (
        <img
          src={avatar}
          alt="avatar"
          className={`w-20 h-20 rounded-full border mb-2 ${
            isInactive
              ? 'border-gray-300 grayscale'
              : isTrialStudent 
                ? 'border-[#EADBC8]' 
                : 'border-[#D8CDBF]'
          }`}
        />
      )}

      <h3 className={`text-lg font-bold mb-2 ${isInactive ? 'text-gray-500' : ''}`}>
        {name}
        {isInactive && <span className="text-xs text-gray-400 ml-2">(已停用)</span>}
      </h3>

      <div className="flex flex-col gap-2">
        {fields.map(({ icon: Icon, label, value, color }, idx) => {
          const defaultColor = isInactive 
            ? '#9CA3AF' 
            : isTrialStudent 
              ? '#C4B5A0' 
              : '#A68A64'
          
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4" style={{ color: color || defaultColor }} />
              <span className={isInactive ? 'text-gray-500' : ''}>
                {label}：{value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
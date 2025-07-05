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

function getRemainingLessonColor(remainingLessons?: number | string) {
  const num = Number(remainingLessons);
  if (num === 1) return '#FF8A8A'; // 紅
  if (num === 2) return '#FFB67A'; // 橙
  return '#A68A64'; // 預設
}

function getCardBgByRemainingLessons(fields: FieldItem[], isInactive?: boolean, isTrialStudent?: boolean) {
  if (isInactive) return { bg: '#f3f4f6', border: '#d1d5db' };
  if (isTrialStudent) return { bg: '#FFF7D6', border: '#EADBC8' };
  const remainingField = fields.find(f => f.label.replace(/[:：\s]/g, '') === '剩餘堂數');
  const num = Number((remainingField?.value ?? '').toString().replace(/[^0-9]/g, ''));
  if (num === 0) return { bg: 'rgba(255,100,100,0.35)', border: '#FF5A5A' };
  if (num === 1) return { bg: 'rgba(255,138,138,0.3)', border: '#FF8A8A' };
  if (num === 2) return { bg: 'rgba(255,182,122,0.3)', border: '#FFB67A' };
  return { bg: '#FFFDF8', border: '#D8CDBF' };
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
  const cardColor = getCardBgByRemainingLessons(fields, isInactive, isTrialStudent);

  return (
    <div
      onClick={onToggle}
      className={`relative border rounded-[24px] p-5 shadow flex flex-col items-center text-[#4B4B4B] cursor-pointer transition-all`}
      style={{
        backgroundColor: cardColor.bg,
        borderColor: cardColor.border
      }}
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
              <span
                className={isInactive ? 'text-gray-500' : ''}
                style={label === '剩餘堂數' ? { color: getRemainingLessonColor(value) } : {}}
              >
                {label}：{value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
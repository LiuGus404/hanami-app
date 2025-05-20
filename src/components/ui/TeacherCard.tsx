'use client'

import { LucideIcon, User, Briefcase, Phone, Mail, DollarSign, BadgeCheck } from 'lucide-react'

type FieldItem = {
  icon: LucideIcon
  label: string
  value: string | number
  color?: string
}

type Props = {
  name: string
  nickname?: string
  role?: string
  status?: string
  phone?: string
  email?: string
  msalary?: number
  selected?: boolean
  onToggle?: () => void
  avatar?: string
}

export default function TeacherCard({
  name,
  nickname,
  role,
  status,
  phone,
  email,
  msalary,
  selected = false,
  onToggle,
  avatar,
}: Props) {
  const fields: FieldItem[] = [
    { icon: Briefcase, label: '職位', value: role || '—' },
    { icon: BadgeCheck, label: '狀態', value: status || '—' },
    { icon: Phone, label: '電話', value: phone || '—' },
    { icon: Mail, label: 'Email', value: email || '—' },
    { icon: DollarSign, label: '月薪', value: msalary != null ? msalary : '—' },
  ]
  return (
    <div
      onClick={onToggle}
      className={`relative border rounded-[24px] p-5 shadow flex flex-col items-center text-[#4B4B4B] cursor-pointer bg-[#FFFDF8] border-[#D8CDBF] hover:shadow-lg transition`}
    >
      {selected && (
        <img
          src="/leaf-sprout.png"
          alt="Selected"
          className="absolute top-3 right-3 w-8 h-8"
        />
      )}
      <img
        src={avatar || '/teacher.png'}
        alt="avatar"
        className="w-20 h-20 rounded-full border mb-2 border-[#D8CDBF]"
      />
      <h3 className="text-lg font-bold mb-1">{name}</h3>
      <div className="text-sm text-[#A68A64] mb-2">{nickname || '—'}</div>
      <div className="flex flex-col gap-2">
        {fields.map(({ icon: Icon, label, value, color = '#A68A64' }, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4" style={{ color }} />
            <span>{label}：{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 
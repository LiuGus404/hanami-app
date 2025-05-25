'use client'

import React, { useState } from 'react'
import { Sprout } from 'lucide-react'

export type PopupSelectProps = {
  title: string
  options: { label: string; value: string }[]
  selected: string[] | string
  onChange: (newSelected: string[] | string) => void
  onConfirm?: () => void
  onCancel?: () => void
  mode?: 'multi' | 'single'
}

export const PopupSelect: React.FC<PopupSelectProps> = ({
  title,
  options,
  selected,
  onChange,
  onConfirm,
  onCancel,
  mode = 'multi',
}) => {
  const isSelected = (value: string) =>
    Array.isArray(selected) ? selected.includes(value) : selected === value

  const toggleOption = (value: string) => {
    if (mode === 'multi') {
      const current = Array.isArray(selected) ? selected : []
      let updated: string[]
      if (value === 'all') {
        updated = ['all']
      } else {
        updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current.filter((v) => v !== 'all'), value]
        if (updated.length === 0) updated = ['all']
      }
      onChange(updated)
    } else {
      onChange(value)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#FFFDF8] border border-[#D8CDBF] rounded-[24px] w-80 p-6 shadow-xl text-[#4B4B4B] max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          {options.map(({ label, value }) => (
            <div
              key={value}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition ${
                isSelected(value) ? 'bg-[#E8E3D5]' : 'bg-white hover:bg-[#F3F0E5]'
              }`}
              onClick={() => toggleOption(value)}
            >
              <div className="flex items-center gap-3">
                <Sprout className={`w-5 h-5 ${isSelected(value) ? 'text-green-600' : 'text-[#D8CDBF]'}`} />
                <span className="text-base font-medium">{label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-around mt-6 pt-4 border-t border-[#D8CDBF]">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#D8CDBF] rounded-xl hover:bg-[#F3F0E5]"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#A68A64] text-white font-semibold rounded-xl hover:bg-[#937654]"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  )
}
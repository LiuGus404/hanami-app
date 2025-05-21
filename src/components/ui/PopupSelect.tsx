'use client'

import React, { useState, useEffect } from 'react'
import { Sprout } from 'lucide-react'

interface PopupSelectProps {
  title: string
  options: { label: string; value: string }[]
  selected: string[] | string
  onChange: (newSelected: string[] | string) => void
  onConfirm?: () => void
  onCancel?: () => void
  mode?: 'multi' | 'single'
  disabled?: boolean
}

export const PopupSelect: React.FC<PopupSelectProps> = ({
  title,
  options,
  selected,
  onChange,
  onConfirm,
  onCancel,
  mode = 'single',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tempSelected, setTempSelected] = useState<string[] | string>(selected)

  useEffect(() => {
    setTempSelected(selected)
  }, [selected])

  const handleToggle = (value: string) => {
    if (mode === 'single') {
      setTempSelected(value)
    } else {
      const currentSelected = Array.isArray(tempSelected) ? tempSelected : []
      if (currentSelected.includes(value)) {
        setTempSelected(currentSelected.filter(v => v !== value))
      } else {
        setTempSelected([...currentSelected, value])
      }
    }
  }

  const handleConfirm = () => {
    if (mode === 'multi') {
      onChange(Array.isArray(tempSelected) ? tempSelected : [String(tempSelected)])
    } else {
      onChange(typeof tempSelected === 'string' ? tempSelected : (tempSelected[0] || ''))
    }
    setIsOpen(false)
    onConfirm?.()
  }

  const handleCancel = () => {
    setTempSelected(selected)
    setIsOpen(false)
    onCancel?.()
  }

  const selectedArray = Array.isArray(selected) ? selected : [selected]
  const tempSelectedArray = Array.isArray(tempSelected) ? tempSelected : [tempSelected]

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(true)}
        className={`w-full px-4 py-2 text-left border rounded-lg ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-500'
        }`}
        disabled={disabled}
      >
        {selectedArray.length > 0
          ? options
              .filter(opt => selectedArray.includes(opt.value))
              .map(opt => opt.label)
              .join(', ')
          : '請選擇'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-medium">{title}</h3>
            <div className="max-h-60 overflow-y-auto">
              {options.map(option => (
                <div
                  key={option.value}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${
                    tempSelectedArray.includes(option.value) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleToggle(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
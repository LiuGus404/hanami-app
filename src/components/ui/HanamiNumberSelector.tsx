import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface HanamiNumberSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}

export function HanamiNumberSelector({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  suffix = '筆',
  className = '',
  disabled = false
}: HanamiNumberSelectorProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(value - step);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div
      className={`
        relative inline-flex items-center justify-between
        px-3 py-2 text-sm font-medium
        bg-gradient-to-b from-white to-[#FFF9F2]
        border border-[#EADBC8] rounded-lg
        shadow-sm hover:shadow-md
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#D4A5A5]'}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 顯示數值和單位 */}
      <div className="flex items-center gap-1 text-[#2B3A3B]">
        <input
          type="number"
          value={value ?? ''}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-12 text-center bg-transparent border-none outline-none text-[#2B3A3B] font-medium"
        />
        <span className="text-[#A68A64]">{suffix}</span>
      </div>

      {/* 上下箭頭按鈕 */}
      <div className="flex flex-col ml-1">
        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`
            p-0.5 rounded-t-sm transition-colors
            ${disabled || value >= max 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-[#A68A64] hover:text-[#8B7355] hover:bg-[#FFF9F2]'
            }
          `}
        >
          <ChevronUpIcon className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`
            p-0.5 rounded-b-sm transition-colors
            ${disabled || value <= min 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-[#A68A64] hover:text-[#8B7355] hover:bg-[#FFF9F2]'
            }
          `}
        >
          <ChevronDownIcon className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* 懸停效果 */}
      {isHovered && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD59A]/10 to-[#EBC9A4]/10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

// 預設選項的數字選擇器
interface HanamiPresetNumberSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options: { label: string; value: number }[];
  className?: string;
  disabled?: boolean;
}

export function HanamiPresetNumberSelector({
  value,
  onChange,
  options,
  className = '',
  disabled = false
}: HanamiPresetNumberSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className={`
        px-3 py-2 text-sm font-medium
        bg-gradient-to-b from-white to-[#FFF9F2]
        border border-[#EADBC8] rounded-lg
        text-[#2B3A3B] shadow-sm
        hover:border-[#D4A5A5] hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#D4A5A5]
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

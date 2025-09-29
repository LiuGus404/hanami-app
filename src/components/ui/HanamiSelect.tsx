'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface HanamiSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function HanamiSelect({
  options,
  value,
  onChange,
  placeholder = '請選擇',
  required = false,
  disabled = false,
  className = '',
  label,
  error,
  icon,
}: HanamiSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#4B4036]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <motion.select
          value={value || ''}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={`
            w-full py-3 pr-10
            ${icon ? 'pl-12' : 'px-4'}
            bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2]
            border-2 border-[#EADBC8] rounded-2xl
            text-[#4B4036] text-sm font-medium
            focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A]
            disabled:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50
            transition-all duration-200 ease-in-out
            appearance-none cursor-pointer
            shadow-sm hover:shadow-md focus:shadow-lg
            ${error ? 'border-red-400 focus:ring-red-400' : ''}
            ${className}
          `}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>
        
        {/* 自定義下拉箭頭 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <motion.div
            className="text-[#EBC9A4]"
            animate={{ rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
        
        {/* 可選圖標 */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <div className="text-[#EBC9A4]">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-sm text-red-500 flex items-center space-x-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </motion.p>
      )}
    </div>
  );
}

// 保持向後兼容的默認導出
export default HanamiSelect;
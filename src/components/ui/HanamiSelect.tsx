'use client';

import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface HanamiSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void; // 修改為直接傳遞值
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
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
}: HanamiSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-hanami-text">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={`
          w-full px-4 py-3 
          border border-hanami-border rounded-lg 
          bg-white text-hanami-text
          focus:ring-2 focus:ring-hanami-primary focus:border-transparent
          disabled:bg-hanami-surface disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
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
      </select>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// 保持向後兼容的默認導出
export default HanamiSelect;
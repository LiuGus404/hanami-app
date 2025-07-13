'use client';

import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface HanamiSelectProps {
  options: Option[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export default function HanamiSelect({
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
  const baseClasses = 'w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200 bg-white text-[#2B3A3B]';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed bg-[#F5F5F5]' : '';
  const errorClasses = error ? 'border-[#FF6B6B] focus:ring-[#FF6B6B]' : '';
  
  const classes = `${baseClasses} ${disabledClasses} ${errorClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
          {label}
          {required && <span className="text-[#FF6B6B] ml-1">*</span>}
        </label>
      )}
      <select
        className={classes}
        disabled={disabled}
        required={required}
        value={value || ''}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-[#FF6B6B]">{error}</p>
      )}
    </div>
  );
} 
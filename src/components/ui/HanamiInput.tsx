'use client';

import React from 'react';

interface HanamiInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' | 'url';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  min?: number;
  max?: number;
}

export default function HanamiInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  required = false,
  disabled = false,
  className = '',
  label,
  error,
  min,
  max,
}: HanamiInputProps) {
  const baseClasses = 'w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FDE6B8] focus:border-[#EAC29D] transition-all duration-200 bg-white text-[#2B3A3B] placeholder-[#999]';
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
      <input
        className={classes}
        disabled={disabled}
        max={max}
        min={min}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      {error && (
        <p className="mt-1 text-sm text-[#FF6B6B]">{error}</p>
      )}
    </div>
  );
} 
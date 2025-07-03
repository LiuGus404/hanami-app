'use client';

import React from 'react';

interface HanamiInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export default function HanamiInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  label,
  error
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
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={classes}
      />
      {error && (
        <p className="mt-1 text-sm text-[#FF6B6B]">{error}</p>
      )}
    </div>
  );
} 
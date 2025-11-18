'use client';

import React from 'react';

interface HanamiInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' | 'url';
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void; // 修改為直接傳遞值
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  min?: number;
  max?: number;
}

export function HanamiInput({
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e || !e.target) {
        console.warn('[HanamiInput] handleChange: event or target is null/undefined');
        return;
      }
      onChange?.(e.target.value);
    } catch (error) {
      console.error('[HanamiInput] handleChange error:', error);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-hanami-text">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={`
          w-full px-4 py-3 
          border border-hanami-border rounded-lg 
          bg-white text-hanami-text
          placeholder-hanami-text-secondary
          focus:ring-2 focus:ring-hanami-primary focus:border-transparent
          disabled:bg-hanami-surface disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// 保持向後兼容的默認導出
export default HanamiInput;
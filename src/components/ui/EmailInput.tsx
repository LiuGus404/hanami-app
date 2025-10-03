'use client';

import { useState } from 'react';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { validateEmail } from '@/lib/validationUtils';

interface EmailInputProps {
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
  showValidation?: boolean;
}

export default function EmailInput({
  value,
  onChange,
  placeholder = "請輸入電郵地址",
  className = "",
  error,
  required = false,
  showValidation = true
}: EmailInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // 驗證電郵格式
  const validation = validateEmail(value);
  const showError = error || (hasInteracted && !validation.isValid);
  const showSuccess = showValidation && hasInteracted && validation.isValid && value.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 sm:py-4 pr-12 text-base rounded-xl border-2 transition-all duration-200 ${
            showError
              ? 'border-red-500 focus:border-red-500 bg-red-50'
              : showSuccess
              ? 'border-green-500 focus:border-green-500 bg-green-50'
              : isFocused
              ? 'border-[#FFD59A] bg-white'
              : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
          } focus:outline-none ${className}`}
          placeholder={placeholder}
          required={required}
          autoComplete="email"
        />
        
        {/* 右側圖標 */}
        <div className="absolute right-3 top-3.5 sm:top-4 flex items-center">
          {showSuccess ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          ) : showError ? (
            <XCircleIcon className="w-5 h-5 text-red-500" />
          ) : (
            <EnvelopeIcon className="w-5 h-5 text-[#4B4036]" />
          )}
        </div>
      </div>

      {/* 錯誤訊息 */}
      {showError && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <XCircleIcon className="w-4 h-4 mr-1" />
          {error || validation.error}
        </p>
      )}

      {/* 成功提示 */}
      {showSuccess && (
        <p className="mt-1 text-sm text-green-600 flex items-center">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          電郵格式正確
        </p>
      )}

      {/* 格式提示 */}
      {!showError && !showSuccess && isFocused && (
        <p className="mt-1 text-xs text-[#2B3A3B]/70">
          請輸入有效的電郵地址，例如: example@email.com
        </p>
      )}
    </div>
  );
}

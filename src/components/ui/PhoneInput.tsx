'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { countryCodes, validatePhoneNumber, formatPhoneNumber } from '@/lib/validationUtils';
import CountryFlag from './CountryFlag';

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (phoneNumber: string, countryCode: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

export default function PhoneInput({
  value,
  countryCode,
  onChange,
  placeholder = "請輸入電話號碼",
  className = "",
  error,
  required = false
}: PhoneInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentCountryCode, setCurrentCountryCode] = useState(countryCode);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 初始化時處理已包含國碼的電話號碼
  useEffect(() => {
    if (value) {
      // 檢查是否已包含國碼
      const foundCountry = countryCodes.find(country => 
        value.startsWith(country.code)
      );
      
      if (foundCountry) {
        // 如果包含國碼，提取純電話號碼
        const phoneOnly = value.replace(foundCountry.code, '').trim();
        setDisplayValue(phoneOnly);
        setCurrentCountryCode(foundCountry.code);
        onChange(phoneOnly, foundCountry.code);
      } else {
        // 如果沒有國碼，直接使用原值
        setDisplayValue(value);
        setCurrentCountryCode(countryCode);
      }
    }
  }, [value, countryCode, onChange]);

  // 當外部 countryCode 改變時更新
  useEffect(() => {
    setCurrentCountryCode(countryCode);
  }, [countryCode]);

  // 處理電話號碼輸入
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // 只允許數字、空格、括號和連字符
    const cleanValue = inputValue.replace(/[^\d\s()-]/g, '');
    setDisplayValue(cleanValue);
    onChange(cleanValue, currentCountryCode);
  };

  // 處理國碼選擇
  const handleCountryCodeChange = (newCountryCode: string) => {
    setCurrentCountryCode(newCountryCode);
    onChange(displayValue, newCountryCode);
    setIsDropdownOpen(false);
  };

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 獲取當前選中的國碼信息
  const selectedCountry = countryCodes.find(country => country.code === currentCountryCode) || countryCodes[0];

  return (
    <div className="relative">
      <div className={`flex rounded-xl border-2 transition-all duration-200 ${
        error
          ? 'border-red-500'
          : 'border-[#EADBC8] focus-within:border-[#FFD59A]'
      }`}>
        {/* 國碼選擇器 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              console.log('國碼選擇器被點擊');
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className={`flex items-center px-3 py-3 sm:py-4 text-base bg-white rounded-l-xl transition-all duration-200 ${
              error
                ? 'bg-red-50'
                : 'hover:bg-[#FFF9F2]'
            } focus:outline-none`}
          >
            <CountryFlag countryCode={selectedCountry.code} className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium text-[#4B4036] mr-2">
              {selectedCountry.code}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-[#4B4036]" />
          </button>

          {/* 下拉選單 */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-[9999] w-64 mt-1 bg-white border-2 border-[#EADBC8] rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {countryCodes.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryCodeChange(country.code)}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-[#FFF9F2] transition-colors duration-200 ${
                    country.code === currentCountryCode ? 'bg-[#FFD59A]/20' : ''
                  }`}
                >
                  <CountryFlag countryCode={country.code} className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium text-[#4B4036]">{country.code}</div>
                    <div className="text-sm text-[#2B3A3B]">{country.country}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 電話號碼輸入框 */}
        <div className="flex-1 relative">
          <input
            type="tel"
            value={displayValue}
            onChange={handlePhoneChange}
            className={`w-full px-4 py-3 sm:py-4 pr-12 text-base bg-white rounded-r-xl transition-all duration-200 ${
              error
                ? 'bg-red-50'
                : ''
            } focus:outline-none ${className}`}
            placeholder={placeholder}
            required={required}
          />
          <PhoneIcon className="absolute right-3 top-3.5 sm:top-4 w-5 h-5 text-[#4B4036] pointer-events-none" />
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* 格式提示 */}
      {!error && displayValue && (
        <p className="mt-1 text-xs text-[#2B3A3B]/70">
          格式: {selectedCountry.code} {formatPhoneNumber(displayValue, currentCountryCode)}
        </p>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { CountrySelector } from './CountrySelector';

interface PhoneNumberInputProps {
  value: string;
  onChange: (phoneNumber: string) => void;
  className?: string;
  placeholder?: string;
}

export function PhoneNumberInput({ 
  value, 
  onChange, 
  className = '', 
  placeholder = '請輸入電話號碼' 
}: PhoneNumberInputProps) {
  const [countryCode, setCountryCode] = useState('+852');
  const [phoneNumber, setPhoneNumber] = useState('');

  // 解析完整的電話號碼
  const parsePhoneNumber = (fullNumber: string) => {
    if (!fullNumber) {
      setCountryCode('+852');
      setPhoneNumber('');
      return;
    }

    // 嘗試從完整號碼中提取國家代碼和電話號碼
    const country = ['+852', '+886', '+86', '+65', '+60', '+66', '+81', '+82', '+1', '+44', '+61', '+49', '+33', '+39', '+34', '+31', '+32', '+41', '+43'];
    
    for (const code of country) {
      if (fullNumber.startsWith(code)) {
        setCountryCode(code);
        setPhoneNumber(fullNumber.substring(code.length));
        return;
      }
    }

    // 如果沒有找到國家代碼，使用默認的香港代碼
    setCountryCode('+852');
    setPhoneNumber(fullNumber);
  };

  // 當 value 改變時更新內部狀態
  React.useEffect(() => {
    if (value) {
      parsePhoneNumber(value);
    }
  }, [value]);

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const fullNumber = newCountryCode + phoneNumber;
    onChange(fullNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value.replace(/[^\d]/g, '').slice(0, 8); // 只保留數字，限制8位
    setPhoneNumber(newPhoneNumber);
    const fullNumber = countryCode + newPhoneNumber;
    onChange(fullNumber);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="w-32">
        <CountrySelector
          value={countryCode}
          onChange={handleCountryChange}
        />
      </div>
      <div className="flex-1">
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          maxLength={8}
          className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors"
        />
      </div>
    </div>
  );
}

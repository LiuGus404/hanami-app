'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import CountryFlag from '@/components/ui/CountryFlag';

export default function DebugPhoneDropdownPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('+852');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countryCodes = [
    { code: '+852', country: '香港', flag: '🇭🇰' },
    { code: '+86', country: '中國', flag: '🇨🇳' },
    { code: '+886', country: '台灣', flag: '🇹🇼' },
    { code: '+65', country: '新加坡', flag: '🇸🇬' },
    { code: '+60', country: '馬來西亞', flag: '🇲🇾' },
  ];

  const currentCountry = countryCodes.find(c => c.code === selectedCountry) || countryCodes[0];

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

  const handleButtonClick = () => {
    console.log('按鈕被點擊了！');
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCountrySelect = (code: string) => {
    console.log('選擇了國碼:', code);
    setSelectedCountry(code);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">
          調試國碼下拉選單
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* 調試信息 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">調試信息</h3>
            <p className="text-sm text-yellow-700">
              下拉選單狀態: {isDropdownOpen ? '開啟' : '關閉'}
            </p>
            <p className="text-sm text-yellow-700">
              選中的國碼: {selectedCountry}
            </p>
          </div>

          {/* 簡化版國碼選擇器 */}
          <div>
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">簡化版測試</h2>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={handleButtonClick}
                className="flex items-center px-4 py-3 bg-white border-2 border-[#EADBC8] rounded-xl hover:border-[#FFD59A] transition-all duration-200 focus:outline-none focus:border-[#FFD59A]"
              >
                <CountryFlag countryCode={currentCountry.code} className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium text-[#4B4036] mr-2">
                  {currentCountry.code}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-[#4B4036]" />
              </button>

              {/* 下拉選單 */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 z-[9999] w-64 mt-2 bg-white border-2 border-[#EADBC8] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {countryCodes.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country.code)}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-[#FFF9F2] transition-colors duration-200 ${
                        country.code === selectedCountry ? 'bg-[#FFD59A]/20' : ''
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
          </div>

          {/* 測試按鈕 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#4B4036]">測試按鈕</h3>
            <button
              onClick={() => setIsDropdownOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              強制打開下拉選單
            </button>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-2"
            >
              強制關閉下拉選單
            </button>
          </div>

          {/* 事件測試 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">事件測試</h3>
            <p className="text-sm text-gray-600">
              打開瀏覽器控制台查看點擊事件日誌
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

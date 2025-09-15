'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'HK', name: '香港', flag: '🇭🇰', dialCode: '+852' },
  { code: 'TW', name: '台灣', flag: '🇹🇼', dialCode: '+886' },
  { code: 'CN', name: '中國', flag: '🇨🇳', dialCode: '+86' },
  { code: 'SG', name: '新加坡', flag: '🇸🇬', dialCode: '+65' },
  { code: 'MY', name: '馬來西亞', flag: '🇲🇾', dialCode: '+60' },
  { code: 'TH', name: '泰國', flag: '🇹🇭', dialCode: '+66' },
  { code: 'JP', name: '日本', flag: '🇯🇵', dialCode: '+81' },
  { code: 'KR', name: '韓國', flag: '🇰🇷', dialCode: '+82' },
  { code: 'US', name: '美國', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: '英國', flag: '🇬🇧', dialCode: '+44' },
  { code: 'AU', name: '澳洲', flag: '🇦🇺', dialCode: '+61' },
  { code: 'CA', name: '加拿大', flag: '🇨🇦', dialCode: '+1' },
  { code: 'DE', name: '德國', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: '法國', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IT', name: '意大利', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: '西班牙', flag: '🇪🇸', dialCode: '+34' },
  { code: 'NL', name: '荷蘭', flag: '🇳🇱', dialCode: '+31' },
  { code: 'BE', name: '比利時', flag: '🇧🇪', dialCode: '+32' },
  { code: 'CH', name: '瑞士', flag: '🇨🇭', dialCode: '+41' },
  { code: 'AT', name: '奧地利', flag: '🇦🇹', dialCode: '+43' },
];

interface CountrySelectorProps {
  value: string;
  onChange: (dialCode: string) => void;
  className?: string;
}

export function CountrySelector({ value, onChange, className = '' }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.dialCode === value) || countries[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country.dialCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors bg-white flex items-center justify-between hover:border-[#FFD59A]"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-[#4B4036] font-medium">{selectedCountry.dialCode}</span>
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 text-[#4B4036] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-xl z-50 max-h-64 overflow-hidden"
          >
            {/* 搜尋框 */}
            <div className="p-3 border-b border-[#EADBC8]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4B4036]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋國家..."
                  className="w-full pl-10 pr-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* 國家列表 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-4 py-3 text-left hover:bg-[#FFF9F2] transition-colors flex items-center space-x-3 ${
                    selectedCountry.code === country.code ? 'bg-[#FFD59A] bg-opacity-20' : ''
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="text-[#4B4036] font-medium">{country.name}</div>
                    <div className="text-sm text-[#2B3A3B]">{country.dialCode}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


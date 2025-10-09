'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchableSelectOption {
  id: string;
  label: string;
  value: string;
  subtitle?: string;
  metadata?: any;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string, option?: SearchableSelectOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "請選擇...",
  searchPlaceholder = "搜尋...",
  className = "",
  disabled = false,
  loading = false,
  emptyMessage = "沒有找到選項"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 過濾選項
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 獲取選中的選項
  const selectedOption = options.find(option => option.id === value);

  // 處理點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 處理鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (option: SearchableSelectOption) => {
    onChange(option.id, option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 觸發按鈕 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border border-[#EADBC8] rounded-lg 
          focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent
          bg-white hover:bg-gray-50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-[#FFD59A] border-transparent' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <div>
                <div className="font-medium text-[#4B4036] truncate">
                  {selectedOption.label}
                </div>
                {selectedOption.subtitle && (
                  <div className="text-sm text-[#2B3A3B] truncate">
                    {selectedOption.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            {selectedOption && !disabled && (
              <div
                onClick={handleClear}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* 搜尋框 */}
          <div className="p-3 border-b border-[#EADBC8]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* 選項列表 */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFD59A] mx-auto mb-2"></div>
                載入中...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-[#FFD59A] hover:bg-opacity-20 
                    transition-colors border-b border-[#EADBC8] last:border-b-0
                    ${highlightedIndex === index ? 'bg-[#FFD59A] bg-opacity-20' : ''}
                    ${option.id === value ? 'bg-[#FFD59A] bg-opacity-30' : ''}
                  `}
                >
                  <div className="font-medium text-[#4B4036] truncate">
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className="text-sm text-[#2B3A3B] truncate">
                      {option.subtitle}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

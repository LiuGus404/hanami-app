import React, { useState, useEffect } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

interface ResponsiveNavigationDropdownProps {
  items: NavigationItem[];
  currentPage?: string;
  className?: string;
}

export function ResponsiveNavigationDropdown({
  items,
  currentPage,
  className = ''
}: ResponsiveNavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 檢測螢幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px 以下視為移動設備
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 獲取當前頁面的標籤
  const getCurrentPageLabel = () => {
    const currentItem = items.find(item => item.href === currentPage);
    return currentItem ? currentItem.label : '選擇頁面';
  };

  // 處理導航
  const handleNavigation = (href: string) => {
    window.location.href = href;
    setIsOpen(false);
  };

  // 移動設備版本 - 下拉選單
  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <button
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-white text-[#2B3A3B] border border-[#EADBC8] shadow-sm hover:bg-[#FFF9F2] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{getCurrentPageLabel()}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10">
            {items.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0 transition-colors"
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 桌面版本 - 水平按鈕組
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <button
          key={index}
          className={`
            flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors
            ${item.variant === 'primary' 
              ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white shadow-md hover:from-[#FF5252] hover:to-[#FF7676]' 
              : item.variant === 'accent'
              ? 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white shadow-md hover:from-[#26D0CE] hover:to-[#1A9B8A]'
              : 'bg-white text-[#2B3A3B] border border-[#EADBC8] shadow-sm hover:bg-[#FFF9F2] hover:border-[#D4A5A5]'
            }
            ${currentPage === item.href ? 'ring-2 ring-[#FF6B6B] ring-opacity-50' : ''}
          `}
          onClick={() => handleNavigation(item.href)}
        >
          <item.icon className="w-3 h-3" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

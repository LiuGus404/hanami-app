import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AnimatedNavigationButtonProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function AnimatedNavigationButton({
  icon: Icon,
  label,
  href,
  isActive = false,
  variant = 'secondary',
  className = ''
}: AnimatedNavigationButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white shadow-md hover:shadow-lg hover:from-[#FF5252] hover:to-[#FF7676]';
      case 'accent':
        return 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white shadow-md hover:shadow-lg hover:from-[#26D0CE] hover:to-[#1A9B8A]';
      default:
        return 'bg-white text-[#2B3A3B] border border-[#EADBC8] shadow-sm hover:shadow-md hover:bg-[#FFF9F2] hover:border-[#D4A5A5]';
    }
  };

  const handleClick = () => {
    // 添加點擊動畫效果
    const button = document.activeElement as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
    
    // 導航到目標頁面
    window.location.href = href;
  };

      return (
      <button
        className={`
          group relative flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
          transition-all duration-200 ease-out transform hover:scale-105 active:scale-95
          ${getVariantStyles()}
          ${isActive ? 'ring-2 ring-[#FF6B6B] ring-opacity-50' : ''}
          ${className}
        `}
        onClick={handleClick}
        style={{
          backgroundSize: '200% 200%',
          animation: isActive ? 'gradientShift 2s ease infinite' : 'none'
        }}
      >
        {/* 背景動畫效果 */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />
        
        {/* 圖標容器 */}
        <div className="relative z-10 flex items-center justify-center w-5 h-5 rounded-md bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-200">
          <Icon className="w-3 h-3 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
        </div>
        
        {/* 文字 */}
        <span className="relative z-10 transition-all duration-200 group-hover:translate-x-0.5">
          {label}
        </span>
        
        {/* 懸停時的邊框效果 */}
        <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-white/20 transition-all duration-200" />
        
        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </button>
    );
}

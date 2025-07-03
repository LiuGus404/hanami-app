'use client';

import React from 'react';

interface AccountIconProps {
  type: 'teacher' | 'student' | 'admin' | 'parent' | 'all';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AccountIcon({ type, size = 'md', className = '' }: AccountIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const getIcon = () => {
    switch (type) {
      case 'teacher':
        return (
          <div className={`${sizeClasses[size]} bg-[#FFF3E0] rounded-full flex items-center justify-center ${className}`}>
            <span className="text-[#A64B2A] text-lg">👨‍🏫</span>
          </div>
        );
      case 'student':
        return (
          <div className={`${sizeClasses[size]} bg-[#E0F2E0] rounded-full flex items-center justify-center ${className}`}>
            <span className="text-[#2B3A3B] text-lg">👨‍🎓</span>
          </div>
        );
      case 'admin':
        return (
          <div className={`${sizeClasses[size]} bg-[#E0F2F2] rounded-full flex items-center justify-center ${className}`}>
            <span className="text-[#2B3A3B] text-lg">👨‍💼</span>
          </div>
        );
      case 'parent':
        return (
          <div className={`${sizeClasses[size]} bg-[#E0F2E0] rounded-full flex items-center justify-center ${className}`}>
            <span className="text-[#2B3A3B] text-lg">👨‍👩‍👧‍👦</span>
          </div>
        );
      case 'all':
        return (
          <div className={`${sizeClasses[size]} bg-[#FDE6B8] rounded-full flex items-center justify-center ${className}`}>
            <span className="text-[#A64B2A] text-lg">👥</span>
          </div>
        );
      default:
        return null;
    }
  };

  return getIcon();
} 
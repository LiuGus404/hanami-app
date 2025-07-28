'use client';

import React from 'react';

interface HanamiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'cute' | 'soft';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  animated?: boolean;
}

export function HanamiButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  animated = true,
}: HanamiButtonProps) {
  const baseClasses = 'font-semibold rounded-full border shadow-lg transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-br from-[#FDE6B8] to-[#FCE2C8] text-[#A64B2A] border-[#EAC29D] hover:from-[#fce2c8] hover:to-[#fad8b8] hover:shadow-xl hover:shadow-[#EAC29D]/30',
    secondary: 'bg-gradient-to-br from-white to-[#FFFCEB] text-[#2B3A3B] border-[#EADBC8] hover:from-[#FFFCEB] hover:to-[#FFF8E6] hover:shadow-xl hover:shadow-[#EADBC8]/30',
    danger: 'bg-gradient-to-br from-[#FFE0E0] to-[#FFD4D4] text-[#A64B2A] border-[#EAC29D] hover:from-[#ffd4d4] hover:to-[#ffc8c8] hover:shadow-xl hover:shadow-[#EAC29D]/30',
    success: 'bg-gradient-to-br from-[#E0F2E0] to-[#D4F2D4] text-[#2B3A3B] border-[#C8EAC8] hover:from-[#d4f2d4] hover:to-[#c8eac8] hover:shadow-xl hover:shadow-[#C8EAC8]/30',
    cute: 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] border-[#EAC29D] hover:from-[#EBC9A4] hover:to-[#FDE6B8] hover:shadow-xl hover:shadow-[#EAC29D]/40 hover:rotate-1',
    soft: 'bg-gradient-to-br from-[#F5E7D4] to-[#F0E0C8] text-[#2B3A3B] border-[#EADBC8] hover:from-[#F0E0C8] hover:to-[#F5E7D4] hover:shadow-xl hover:shadow-[#EADBC8]/30',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100 hover:shadow-lg' : 'cursor-pointer';
  
  const animationClasses = animated ? 'hover:animate-bounce-subtle active:animate-press' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${animationClasses} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
} 
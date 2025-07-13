'use client';

import React from 'react';

interface CuteButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  animated?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function CuteButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  animated = true,
  icon,
  iconPosition = 'left',
}: CuteButtonProps) {
  const baseClasses = 'font-bold rounded-full border-2 shadow-lg transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2';
  
  const variantClasses = {
    default: 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] border-[#EAC29D] hover:from-[#EBC9A4] hover:to-[#FDE6B8] hover:shadow-xl hover:shadow-[#EAC29D]/40',
    pink: 'bg-gradient-to-br from-[#FFB6C1] to-[#FFC0CB] text-[#4B4036] border-[#FFB6C1] hover:from-[#FFC0CB] hover:to-[#FFB6C1] hover:shadow-xl hover:shadow-[#FFB6C1]/40 hover:rotate-1',
    blue: 'bg-gradient-to-br from-[#B6E0FF] to-[#C0E8FF] text-[#2B3A3B] border-[#B6E0FF] hover:from-[#C0E8FF] hover:to-[#B6E0FF] hover:shadow-xl hover:shadow-[#B6E0FF]/40',
    green: 'bg-gradient-to-br from-[#B6FFB6] to-[#C0FFC0] text-[#2B3A3B] border-[#B6FFB6] hover:from-[#C0FFC0] hover:to-[#B6FFB6] hover:shadow-xl hover:shadow-[#B6FFB6]/40',
    purple: 'bg-gradient-to-br from-[#E0B6FF] to-[#E8C0FF] text-[#2B3A3B] border-[#E0B6FF] hover:from-[#E8C0FF] hover:to-[#E0B6FF] hover:shadow-xl hover:shadow-[#E0B6FF]/40',
    orange: 'bg-gradient-to-br from-[#FFD4B6] to-[#FFE0C0] text-[#4B4036] border-[#FFD4B6] hover:from-[#FFE0C0] hover:to-[#FFD4B6] hover:shadow-xl hover:shadow-[#FFD4B6]/40',
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

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </>
  );

  return (
    <button
      className={classes}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {content}
    </button>
  );
} 
'use client';

import React from 'react';

interface HanamiBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function HanamiBadge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: HanamiBadgeProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-[#F5F5F5] text-[#666]',
    success: 'bg-[#E0F2E0] text-[#2B3A3B]',
    warning: 'bg-[#FFF3E0] text-[#A64B2A]',
    danger: 'bg-[#FFE0E0] text-[#A64B2A]',
    info: 'bg-[#E0F2F2] text-[#2B3A3B]',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
} 
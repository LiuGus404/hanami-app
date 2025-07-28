'use client';

import React from 'react';

interface HanamiCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'hover' | 'interactive';
}

export function HanamiCard({ 
  children, 
  className = '', 
  onClick, 
  variant = 'default', 
}: HanamiCardProps) {
  const baseClasses = 'bg-white rounded-2xl border border-[#EADBC8] p-4';
  
  const variantClasses = {
    default: 'shadow-sm',
    hover: 'shadow-sm hover:shadow-md transition-shadow',
    interactive: 'shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (onClick) {
    return (
      <div className={classes} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
} 
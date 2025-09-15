'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HanamiButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'cute' | 'soft' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

function HanamiButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button'
}: HanamiButtonProps) {
  const baseClasses = 'font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] hover:from-[#EBC9A4] hover:to-[#FFD59A] focus:ring-[#FFD59A] shadow-lg hover:shadow-xl',
    secondary: 'bg-[#FFFDF8] text-[#4B4036] border-2 border-[#EADBC8] hover:bg-[#FFD59A] hover:border-[#FFD59A] focus:ring-[#FFD59A]',
    cute: 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#2B3A3B] hover:from-[#FFD59A] hover:to-[#FFB6C1] focus:ring-[#FFB6C1] shadow-lg hover:shadow-xl',
    soft: 'bg-[#E0F2E0] text-[#2B3A3B] hover:bg-[#C8E6C8] focus:ring-[#E0F2E0]',
    success: 'bg-[#E0F2E0] text-[#2B3A3B] hover:bg-[#C8E6C8] focus:ring-[#E0F2E0]',
    danger: 'bg-[#FFE0E0] text-[#2B3A3B] hover:bg-[#FFCCCC] focus:ring-[#FFE0E0]'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      whileHover={{ scale: isDisabled ? 1 : 1.05 }}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>載入中...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}

export { HanamiButton };
export default HanamiButton;
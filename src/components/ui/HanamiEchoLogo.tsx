'use client';

import { motion } from 'framer-motion';

interface HanamiEchoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function HanamiEchoLogo({ size = 'md', className = '' }: HanamiEchoLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center space-x-3 ${className}`}
    >
      {/* Logo 圖標 */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg`}>
        <span className="text-[#2B3A3B] font-bold">H</span>
      </div>
      
      {/* 品牌名稱 */}
      <div className="flex flex-col">
        <span className={`font-bold text-[#4B4036] ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : size === 'lg' ? 'text-lg' : 'text-xl'}`}>
          HanamiEcho
        </span>
        <span className={`text-[#2B3A3B] ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-sm' : 'text-base'}`}>
          AIHome
        </span>
      </div>
    </motion.div>
  );
}

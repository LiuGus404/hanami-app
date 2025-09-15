'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface HanamiEchoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function HanamiEchoLogo({ size = 'md', className = '' }: HanamiEchoLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const subTextSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center space-x-3 ${className}`}
    >
      {/* Logo 圖標 */}
      <motion.div 
        className={`${sizeClasses[size]} relative rounded-full shadow-lg overflow-hidden`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src="/hanami.png"
          alt="HanamiEcho Logo"
          fill
          sizes="(max-width: 768px) 32px, (max-width: 1024px) 48px, 64px"
          className="object-contain"
          priority
        />
      </motion.div>
      
      {/* 品牌名稱 */}
      <div className="flex flex-col">
        <span className={`font-bold text-[#4B4036] ${textSizeClasses[size]}`}>
          HanamiEcho
        </span>
        <span className={`text-[#2B3A3B] ${subTextSizeClasses[size]}`}>
          兒童與成人的智能伙伴
        </span>
      </div>
    </motion.div>
  );
}

export { HanamiEchoLogo };
export default HanamiEchoLogo;

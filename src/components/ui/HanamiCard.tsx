'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HanamiCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

function HanamiCard({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  onClick
}: HanamiCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl'
  };

  const baseClasses = 'bg-[#FFFDF8] border border-[#EADBC8] rounded-2xl transition-all duration-200';
  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`;

  if (onClick) {
    return (
      <motion.div
        onClick={onClick}
        className={`${classes} cursor-pointer hover:shadow-xl hover:scale-[1.02]`}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export { HanamiCard };
export default HanamiCard;
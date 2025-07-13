'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export type CardSelectEffectProps = {
  children: React.ReactNode
  selected?: boolean
  onToggle?: () => void
  className?: string
}

export default function CardSelectEffect({
  children,
  selected = false,
  onToggle,
  className = '',
}: CardSelectEffectProps) {
  return (
    <motion.div
      className={`relative rounded-2xl border px-4 py-5 cursor-pointer
        ${selected ? 'bg-[#FDF6ED] border-[#E3C8A0] shadow-lg' : 'bg-white border-[#EADBC8] shadow-sm'}
        ${className}`}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
    >
      {children}

      <AnimatePresence>
        {selected && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 right-2"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: -10 }}
          >
            <img alt="selected" className="w-5 h-5" src="/icons/leaf-sprout.svg" />
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <div className="absolute bottom-2 right-2 text-xs text-[#A68A64] font-medium">✔ 已選擇</div>
      )}
    </motion.div>
  );
}

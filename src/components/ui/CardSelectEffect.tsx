'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

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
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative rounded-2xl border px-4 py-5 cursor-pointer
        ${selected ? 'bg-[#FDF6ED] border-[#E3C8A0] shadow-lg' : 'bg-white border-[#EADBC8] shadow-sm'}
        ${className}`}
    >
      {children}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2"
          >
            <img src="/icons/leaf-sprout.svg" alt="selected" className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <div className="absolute bottom-2 right-2 text-xs text-[#A68A64] font-medium">✔ 已選擇</div>
      )}
    </motion.div>
  )
}

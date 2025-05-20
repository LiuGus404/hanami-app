'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface FloatingPlusMenuProps {
  options: {
    icon: string
    label: string
    onClick: () => void
  }[]
}

export default function FloatingPlusMenu({ options }: FloatingPlusMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="fixed bottom-[calc(6rem+64px)] right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3 rounded-xl bg-[#FFF9ED] shadow-lg border border-[#EADBC8] overflow-hidden"
          >
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick()
                  setOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-3 w-48 hover:bg-[#FDF6ED] text-left text-[#4B4B4B] text-sm border-b last:border-none border-[#F3E8D9]"
              >
                <span className="text-xl">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9, rotate: 90 }}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full w-14 h-14 bg-[#A68A64] text-white text-3xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? '×' : '+'}
      </motion.button>
    </div>
  )
}
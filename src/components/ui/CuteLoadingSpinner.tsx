'use client';

import { motion } from 'framer-motion';

interface CuteLoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function CuteLoadingSpinner({ 
  message = '載入中...',
  className = ''
}: CuteLoadingSpinnerProps) {
  return (
    <div className={`flex min-h-[50vh] items-center justify-center ${className}`}>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="relative mx-auto w-20 h-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-[#FFD59A] border-t-transparent"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/owlui.png"
                alt="載入中"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[#2B3A3B] font-medium"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}


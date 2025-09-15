'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SpeechBubbleProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function SpeechBubble({ 
  isVisible, 
  message, 
  onClose, 
  position = 'top',
  className = ''
}: SpeechBubbleProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsTyping(true);
      setCurrentMessage('');
      
      // 逐字顯示效果
      let index = 0;
      const timer = setInterval(() => {
        if (index < message.length) {
          setCurrentMessage(message.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    }
    
    return undefined;
  }, [isVisible, message]);

  // 自動關閉
  useEffect(() => {
    if (isVisible && !isTyping) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [isVisible, isTyping, onClose]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[#FFD59A]',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[#FFD59A]',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[#FFD59A]',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[#FFD59A]'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`absolute z-[60] ${positionClasses[position]} ${className}`}
        >
          {/* 對話氣泡 */}
          <div className="relative bg-[#FFD59A] rounded-2xl px-4 py-3 shadow-lg border-2 border-[#EBC9A4] max-w-xs">
            {/* 文字內容 */}
            <div className="text-[#2B3A3B] font-medium text-sm leading-relaxed">
              {currentMessage}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-1"
                >
                  |
                </motion.span>
              )}
            </div>
            
            {/* 關閉按鈕 */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#EBC9A4] rounded-full flex items-center justify-center hover:bg-[#D4B896] transition-colors"
            >
              <svg className="w-3 h-3 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* 箭頭 */}
          <div className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}


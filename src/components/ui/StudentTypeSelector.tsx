'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  regularPath?: string;
  trialPath?: string;
}

export default function StudentTypeSelector({
  isOpen,
  onClose,
  regularPath = '/admin/students/new?type=regular',
  trialPath = '/admin/students/new?type=trial',
}: StudentTypeSelectorProps) {
  const router = useRouter();

  const handleSelectType = (type: 'regular' | 'trial') => {
    const target = type === 'regular' ? regularPath : trialPath;
    router.push(target);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          {/* 彈窗內容 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: 'auto',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              minWidth: '280px'
            }}
          >
            {/* 關閉按鈕 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 標題 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#2B3A3B] mb-2">新增學生</h2>
              <p className="text-gray-600">請選擇要新增的學生類型</p>
            </div>

            {/* 選項 */}
            <div className="space-y-4">
              {/* 常規學生選項 */}
              <button
                type="button"
                onClick={() => handleSelectType('regular')}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleSelectType('regular');
                }}
                className="w-full p-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-xl border border-[#EADBC8] hover:shadow-lg active:scale-[0.98] transition-all duration-300 group"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <UserPlus className="w-6 h-6 text-[#A64B2A]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-[#2B3A3B] text-lg">常規學生</h3>
                    <p className="text-[#4B4036] text-sm">新增正式註冊的常規學生</p>
                  </div>
                </div>
              </button>

              {/* 試堂學生選項 */}
              <button
                type="button"
                onClick={() => handleSelectType('trial')}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleSelectType('trial');
                }}
                className="w-full p-4 bg-gradient-to-r from-[#FFB6C1] to-[#EBC9A4] rounded-xl border border-[#EADBC8] hover:shadow-lg active:scale-[0.98] transition-all duration-300 group"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <Calendar className="w-6 h-6 text-[#A64B2A]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-[#2B3A3B] text-lg">試堂學生</h3>
                    <p className="text-[#4B4036] text-sm">新增試聽課程的學生</p>
                  </div>
                </div>
              </button>
            </div>

            {/* 取消按鈕 */}
            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="text-[#A68A64] hover:text-[#8B7355] transition-colors"
              >
                取消
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
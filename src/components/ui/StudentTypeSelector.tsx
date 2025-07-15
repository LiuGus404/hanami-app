'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentTypeSelector({ isOpen, onClose }: StudentTypeSelectorProps) {
  const router = useRouter();

  const handleSelectType = (type: 'regular' | 'trial') => {
    if (type === 'regular') {
      router.push('/admin/students/new?type=regular');
    } else {
      router.push('/admin/students/new?type=trial');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-transparent"
            onClick={onClose}
          />
          
          {/* 彈窗內容 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectType('regular')}
                className="w-full p-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-xl border border-[#EADBC8] hover:shadow-lg transition-all duration-300 group"
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
              </motion.button>

              {/* 試堂學生選項 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectType('trial')}
                className="w-full p-4 bg-gradient-to-r from-[#FFB6C1] to-[#EBC9A4] rounded-xl border border-[#EADBC8] hover:shadow-lg transition-all duration-300 group"
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
              </motion.button>
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
        </div>
      )}
    </AnimatePresence>
  );
} 
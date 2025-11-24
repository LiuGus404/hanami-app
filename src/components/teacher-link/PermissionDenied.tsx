/**
 * 權限不足提示組件
 */

'use client';

import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface PermissionDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  backPath?: string;
}

export default function PermissionDenied({
  title = '權限不足',
  message = '您沒有權限訪問此頁面，請聯繫機構管理員獲取相應權限。',
  showBackButton = true,
  backPath = '/aihome/teacher-link/create',
}: PermissionDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-xl border border-[#EADBC8] p-8 max-w-md w-full text-center"
      >
        {/* 图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <LockClosedIcon className="w-10 h-10 text-gray-500" />
          </div>
        </motion.div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-[#2B3A3B] mb-3">{title}</h1>

        {/* 消息 */}
        <p className="text-[#8A7C70] mb-6 leading-relaxed">{message}</p>

        {/* 返回按钮 */}
        {showBackButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(backPath)}
            className="w-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            返回管理面板
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}


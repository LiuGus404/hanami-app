'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import PaymeFpsAccountManager from '@/components/admin/PaymeFpsAccountManager';

export default function PaymeFpsManagementPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
      {/* 頂部導航 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              <h1 className="text-xl font-bold text-[#4B4036]">PAYME FPS 帳戶管理</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PaymeFpsAccountManager />
        </motion.div>
      </div>
    </div>
  );
}

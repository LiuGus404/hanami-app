'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TeacherMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void;
  teacherName: string;
}

export default function TeacherMobileSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onLogout,
  teacherName,
}: TeacherMobileSidebarProps) {
  const tabs = [
    { id: 'dashboard', name: '主頁', icon: '🏠' },
    { id: 'profile', name: '個人資料', icon: '👤' },
    { id: 'growth-tree', name: '成長樹管理', icon: '🌳' },
    { id: 'ability-development', name: '發展能力圖卡', icon: '📈' },
    { id: 'teaching-activities', name: '教學活動管理', icon: '🎨' },
    { id: 'ability-assessment', name: '能力評估管理', icon: '📋' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* 側邊欄 */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-64 bg-white border-r border-[#EADBC8] z-50 lg:hidden"
          >
            {/* Logo 區域 */}
            <div className="p-6 border-b border-[#EADBC8] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#FFD59A] rounded-xl flex items-center justify-center">
                  <span className="text-brown-700 text-xl">🎵</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-brown-700">Hanami</h1>
                  <p className="text-xs text-brown-500">音樂教育</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#FFF9F2] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* 導航選單 */}
            <div className="flex-1 p-4 overflow-y-auto">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      onClose();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-[#FFD59A] text-brown-700 shadow-md'
                        : 'text-brown-600 hover:bg-[#FFF9F2]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* 底部通知 */}
            <div className="p-4 border-t border-[#EADBC8]">
              <motion.button
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-brown-600 hover:bg-[#FFF9F2] transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">🚪</span>
                <span className="font-medium">登出</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  HomeIcon,
  CalendarDaysIcon,
  UsersIcon,
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
  description: string;
}

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

export default function AppSidebar({ isOpen, onClose, currentPath }: AppSidebarProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    setIsMounted(true);
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const sidebarMenuItems: SidebarItem[] = [
    { 
      icon: HomeIcon, 
      label: '首頁', 
      href: '/aihome', 
      description: '返回主頁' 
    },
    { 
      icon: CalendarDaysIcon, 
      label: '課程活動', 
      href: '/aihome/course-activities', 
      description: '查看所有報讀的機構和課程活動' 
    },
    { 
      icon: UsersIcon, 
      label: '家長連結', 
      href: '/aihome/parent/bound-students', 
      description: '查看孩子的學習' 
    },
    { 
      icon: UserIcon, 
      label: '個人資料', 
      href: '/aihome/profile', 
      description: '查看和編輯個人資料' 
    },
    { 
      icon: Cog6ToothIcon, 
      label: '設置', 
      href: '/aihome/settings', 
      description: '系統設置和偏好' 
    }
  ];

  const handleItemClick = (href: string) => {
    router.push(href);
    // 在移動端自動收起側邊欄，桌面端保持展開
    if (!isDesktop) {
      onClose();
    }
  };

  return (
    <>
      {/* 移動端遮罩 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 側邊欄 */}
      <AnimatePresence mode="wait">
        {(isMounted && isOpen) && (
          <motion.div
            id="hanami-app-sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-16 bottom-0 left-0 w-80 bg-white shadow-xl z-50 lg:fixed lg:top-16 lg:shadow-lg lg:z-50 lg:flex-shrink-0"
          >
            {/* 標題區域 */}
            <div className="p-6 border-b border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 relative">
                    <img 
                      src="/@hanami.png" 
                      alt="HanamiEcho Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#4B4036]">HanamiEcho</h2>
                    <p className="text-sm text-[#2B3A3B]">選單</p>
                  </div>
                </div>
                {!isDesktop && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#FFD59A]/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                  </button>
                )}
              </div>
            </div>

            {/* 選單項目 */}
            <nav className="p-4 space-y-2">
              {sidebarMenuItems.map((item, index) => {
                const isActive = currentPath === item.href;
                
                
                return (
                  <motion.button
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleItemClick(item.href)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md' 
                        : 'text-[#2B3A3B] hover:bg-[#FFD59A]/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive 
                        ? 'bg-white/80' 
                        : 'bg-[#FFD59A]/20'
                    }`}>
                      <item.icon className={`w-5 h-5 ${
                        isActive ? 'text-[#4B4036]' : 'text-[#4B4036]'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-[#4B4036]">{item.label}</div>
                      <div className="text-xs text-[#2B3A3B] mt-0.5">{item.description}</div>
                    </div>
                    <div className="text-[#4B4036]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

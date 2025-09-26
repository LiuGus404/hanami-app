'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface MobileBottomNavigationProps {
  className?: string;
}

export default function MobileBottomNavigation({ className = '' }: MobileBottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 檢查是否應該顯示底部導航（手機/平板/窄螢幕）
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // 在 1024px 以下顯示底部導航
      setIsVisible(width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 檢查用戶角色 - 簡化邏輯，避免重複檢查
  useEffect(() => {
    const checkUserRole = () => {
      try {
        // 使用現有的認證系統檢查用戶角色
        const { getUserSession } = require('@/lib/authUtils');
        const userSession = getUserSession();
        
        if (userSession && userSession.role === 'admin') {
          setUserRole('admin');
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.log('無法獲取用戶角色:', error);
        setUserRole(null);
      }
    };

    // 延遲檢查，避免與其他認證檢查衝突
    const timeoutId = setTimeout(checkUserRole, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // 導航項目配置 - 動態根據用戶角色顯示
  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'mobile-nav-dashboard',
        icon: HomeIcon,
        href: '/aihome/dashboard',
        label: '首頁'
      },
      {
        id: 'mobile-nav-ai-companions',
        icon: ChatBubbleLeftRightIcon,
        href: '/aihome/ai-companions',
        label: 'AI夥伴'
      },
      {
        id: 'mobile-nav-parent-connect',
        icon: UserGroupIcon,
        href: '/aihome/parent/connect',
        label: '家長連結'
      },
      {
        id: 'mobile-nav-settings',
        icon: Cog6ToothIcon,
        href: '/aihome/settings',
        label: '設定'
      }
    ];

    // 如果是管理員，添加管理面板按鈕
    if (userRole === 'admin') {
      baseItems.splice(3, 0, {
        id: 'mobile-nav-admin',
        icon: ShieldCheckIcon,
        href: '/admin',
        label: '管理面板'
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // 檢查當前活動項目
  const getActiveItem = () => {
    return navigationItems.find(item => pathname.startsWith(item.href)) || navigationItems[0];
  };

  const activeItem = getActiveItem();

  // 處理導航點擊
  const handleNavigation = (href: string) => {
    // 添加觸覺反饋
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    router.push(href);
  };

  // 如果不應該顯示，返回 null
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* 為內容添加底部間距，避免被導航遮擋 */}
      <div key="mobile-nav-spacer" className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <div className="h-16 lg:hidden"></div>
      </div>
      
      <motion.div
        key="mobile-nav-main"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-auto ${className}`}
      >
        {/* 弧形背景容器 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 半透明背景 - Hanami 可愛淺色 */}
          <div className="absolute inset-0 bg-[#FFF8E7]/80 backdrop-blur-sm"></div>
          {/* 弧形背景 - Hanami 可愛淺色 */}
          <div className="absolute -top-4 left-0 right-0 h-16 bg-[#FFF8E7]/80 backdrop-blur-sm" 
               style={{
                 borderRadius: '50% 50% 0 0 / 60% 60% 0 0'
               }}>
          </div>
        </div>
        
        {/* 動態導航按鈕 - 弧形佈局 */}
        <div className="relative px-4 py-4">
          <div className="flex justify-around items-end">
            {navigationItems.map((item, index) => {
              const isActive = pathname.startsWith(item.href);
              // 中間的按鈕（AI夥伴）稍微高一些
              const isCenter = index === 1;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -2
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center justify-center p-2 transition-all duration-200 ${
                    isCenter ? 'mb-2' : ''
                  }`}
                >
                  <motion.div
                    className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                      isActive 
                        ? 'w-12 h-12 bg-[#FFD59A] text-white shadow-lg border-2 border-[#EBC9A4]' 
                        : 'w-9 h-9 bg-white/90 text-[#4B4036] border border-[#F0E68C] hover:bg-[#FFD59A]/10 hover:border-[#FFD59A]'
                    }`}
                    whileHover={{ 
                      scale: 1.1,
                      y: -2
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className={`w-4 h-4 stroke-2 ${
                      isActive ? 'text-white' : 'text-[#4B4036]/70'
                    }`} />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 底部安全區域 - Hanami 可愛淺色背景 */}
        <div className="h-safe-area-bottom bg-[#FFF8E7]/80 backdrop-blur-sm"></div>
      </motion.div>
    </AnimatePresence>
  );
}

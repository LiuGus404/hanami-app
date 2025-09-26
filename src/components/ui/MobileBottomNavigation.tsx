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

  // 檢查用戶角色 - 嚴格檢查新系統（SaaS）和舊系統（Hanami）的認證狀態
  useEffect(() => {
    const checkUserRole = () => {
      try {
        let hasAdminRole = false;

        // 檢查新系統（SaaS）的認證狀態
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          try {
            const saasData = JSON.parse(saasSession);
            // 檢查會話是否有效且用戶角色為 admin
            if (saasData.user && 
                saasData.user.role === 'admin' && 
                saasData.user.id && 
                saasData.user.email) {
              hasAdminRole = true;
              console.log('✅ SaaS 系統檢測到管理員權限:', saasData.user.email);
            }
          } catch (error) {
            console.log('❌ 解析 SaaS 會話失敗:', error);
          }
        }

        // 如果 SaaS 系統沒有 admin 權限，檢查舊系統（Hanami）
        if (!hasAdminRole) {
          const { getUserSession } = require('@/lib/authUtils');
          const userSession = getUserSession();
          
          if (userSession && 
              userSession.role === 'admin' && 
              userSession.id && 
              userSession.email) {
            hasAdminRole = true;
            console.log('✅ Hanami 系統檢測到管理員權限:', userSession.email);
          }
        }

        setUserRole(hasAdminRole ? 'admin' : null);
        
        if (!hasAdminRole) {
          console.log('ℹ️ 未檢測到管理員權限');
        }
      } catch (error) {
        console.log('❌ 權限檢查失敗:', error);
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

        // 如果是管理員，添加管理面板按鈕（額外安全檢查）
        if (userRole === 'admin') {
          // 再次驗證權限，確保安全
          const hasValidAdminSession = () => {
            try {
              // 檢查 SaaS 系統
              const saasSession = localStorage.getItem('saas_user_session');
              if (saasSession) {
                const saasData = JSON.parse(saasSession);
                if (saasData.user && saasData.user.role === 'admin') {
                  return true;
                }
              }

              // 檢查 Hanami 系統
              const { getUserSession } = require('@/lib/authUtils');
              const userSession = getUserSession();
              return userSession && userSession.role === 'admin';
            } catch (error) {
              return false;
            }
          };

          if (hasValidAdminSession()) {
            baseItems.splice(3, 0, {
              id: 'mobile-nav-admin',
              icon: ShieldCheckIcon,
              href: '/admin',
              label: '管理面板'
            });
          }
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
      {/* 為內容添加底部間距，避免被導航遮擋 - 優化高度 */}
      <div key="mobile-nav-spacer" className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <div className="h-20 lg:hidden"></div>
      </div>
      
      <motion.div
        key="mobile-nav-main"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-auto overflow-hidden ${className}`}
        style={{
          // 確保背景完全覆蓋，無穿透 - 超強保護
          background: '#FFF8E7',
          backgroundImage: `
            linear-gradient(to top, #FFF8E7 0%, #FFF8E7 100%),
            linear-gradient(to top, #FFF8E7 0%, #FFF8E7 100%)
          `,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          // 額外保護
          borderTop: '1px solid #FFF8E7',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* 弧形背景容器 - 終極無穿透設計 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 弧形頂部層 - 減少高度，保持覆蓋 */}
          <div className="absolute -top-12 left-0 right-0 h-24 bg-[#FFF8E7]" 
               style={{
                 borderRadius: '50% 50% 0 0 / 90% 90% 0 0',
                 boxShadow: '0 -8px 16px rgba(0, 0, 0, 0.08)'
               }}>
          </div>
          
          {/* 第二層弧形覆蓋 */}
          <div className="absolute -top-8 left-0 right-0 h-16 bg-[#FFF8E7]" 
               style={{
                 borderRadius: '50% 50% 0 0 / 80% 80% 0 0'
               }}>
          </div>
          
          {/* 第三層弧形覆蓋 */}
          <div className="absolute -top-4 left-0 right-0 h-12 bg-[#FFF8E7]" 
               style={{
                 borderRadius: '50% 50% 0 0 / 70% 70% 0 0'
               }}>
          </div>
          
          {/* 過渡層 - 簡化設計 */}
          <div className="absolute -top-2 left-0 right-0 h-8 bg-[#FFF8E7]"></div>
          
          {/* 主體背景層 */}
          <div className="absolute inset-0 bg-[#FFF8E7]"></div>
          
          {/* 邊緣保護層 */}
          <div className="absolute -top-1 left-0 right-0 h-4 bg-[#FFF8E7]"></div>
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#FFF8E7]"></div>
        </div>
        
        {/* 動態導航按鈕 - 弧形佈局 - 減少高度 */}
        <div className="relative px-4 py-2">
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
                  className={`flex items-center justify-center p-1 transition-all duration-200 ${
                    isCenter ? 'mb-1' : ''
                  }`}
                >
                  <motion.div
                    className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                      isActive 
                        ? 'w-10 h-10 bg-[#FFD59A] text-white shadow-lg border-2 border-[#EBC9A4]' 
                        : 'w-8 h-8 bg-white/90 text-[#4B4036] border border-[#F0E68C] hover:bg-[#FFD59A]/10 hover:border-[#FFD59A]'
                    }`}
                    whileHover={{ 
                      scale: 1.1,
                      y: -2
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className={`w-3.5 h-3.5 stroke-2 ${
                      isActive ? 'text-white' : 'text-[#4B4036]/70'
                    }`} />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 底部安全區域 - 超強無穿透背景 */}
        <div 
          className="h-safe-area-bottom"
          style={{
            background: '#FFF8E7',
            backgroundImage: 'linear-gradient(to top, #FFF8E7 0%, #FFF8E7 100%)',
            borderTop: '2px solid #FFF8E7',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
          }}
        ></div>
      </motion.div>
    </AnimatePresence>
  );
}

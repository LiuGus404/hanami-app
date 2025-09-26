'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface MobileBottomNavigationProps {
  className?: string;
}

export default function MobileBottomNavigation({ className = '' }: MobileBottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasTeacherAccess, setHasTeacherAccess] = useState(false);
  const [hasLegacyAdminAccess, setHasLegacyAdminAccess] = useState(false);

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

  // 檢查用戶角色和教師權限
  useEffect(() => {
    const checkUserRole = () => {
      try {
        let hasAdminRole = false;
        let hasTeacherRole = false;
        let hasLegacyAdminRole = false;

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
            }
          } catch (error) {
            console.log('❌ 解析 SaaS 會話失敗:', error);
          }
        }

        // 檢查教師權限
        const teacherSession = sessionStorage.getItem('hanami_teacher_access');
        if (teacherSession) {
          try {
            const teacherData = JSON.parse(teacherSession);
            if (teacherData.hasTeacherAccess && teacherData.employeeData) {
              hasTeacherRole = true;
            }
          } catch (error) {
            console.log('❌ 解析教師會話失敗:', error);
          }
        }

        // 檢查舊系統（Hanami AI system）的管理員權限
        try {
          const { getUserSession } = require('@/lib/authUtils');
          const userSession = getUserSession();
          if (userSession && 
              userSession.role === 'admin' && 
              userSession.id && 
              userSession.email) {
            hasLegacyAdminRole = true;
          }
        } catch (error) {
          console.log('❌ 檢查舊系統管理員權限失敗:', error);
        }

        setUserRole(hasAdminRole ? 'admin' : null);
        setHasTeacherAccess(hasTeacherRole);
        setHasLegacyAdminAccess(hasLegacyAdminRole);
      } catch (error) {
        console.log('❌ 權限檢查失敗:', error);
        setUserRole(null);
        setHasTeacherAccess(false);
        setHasLegacyAdminAccess(false);
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

    // 如果有教師權限，添加教師專區按鈕
    if (hasTeacherAccess) {
      // 根據當前頁面決定導航目標
      const isInTeacherZone = pathname.startsWith('/aihome/teacher-zone');
      const isInTaskManagement = pathname.startsWith('/aihome/task-management');
      
      let teacherNavItem;
      if (isInTeacherZone) {
        // 如果在課堂活動管理，導航到工作提示系統
        teacherNavItem = {
          id: 'mobile-nav-teacher-task',
          icon: ClipboardDocumentListIcon,
          href: '/aihome/task-management',
          label: '工作提示'
        };
      } else {
        // 在其他頁面，導航到課堂活動管理
        teacherNavItem = {
          id: 'mobile-nav-teacher-zone',
          icon: AcademicCapIcon,
          href: '/aihome/teacher-zone',
          label: '課堂活動'
        };
      }
      
      // 插入到設定按鈕之前
      baseItems.splice(3, 0, teacherNavItem);
    }

    // 如果有舊系統管理員權限，添加舊系統管理面板按鈕
    if (hasLegacyAdminAccess) {
      const legacyAdminItem = {
        id: 'mobile-nav-legacy-admin',
        icon: ShieldCheckIcon,
        href: '/admin',
        label: '舊系統管理'
      };
      
      // 計算插入位置：如果有教師權限，插入到教師按鈕之後，否則插入到設定之前
      const insertIndex = hasTeacherAccess ? 4 : 3;
      baseItems.splice(insertIndex, 0, legacyAdminItem);
    }

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

          // 檢查 Hanami 系統 - 嚴格檢查只有 admin 角色
          const { getUserSession } = require('@/lib/authUtils');
          const userSession = getUserSession();
          return userSession && 
                 userSession.role === 'admin' && 
                 userSession.id && 
                 userSession.email;
        } catch (error) {
          return false;
        }
      };

      if (hasValidAdminSession()) {
        // 計算插入位置：考慮教師權限和舊系統管理員權限
        let insertIndex = 3; // 默認插入到設定之前
        if (hasTeacherAccess) insertIndex++;
        if (hasLegacyAdminAccess) insertIndex++;
        
        baseItems.splice(insertIndex, 0, {
          id: 'mobile-nav-admin',
          icon: ShieldCheckIcon,
          href: '/admin',
          label: '新系統管理'
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
              // 檢查是否為教師專區按鈕
              const isTeacherButton = item.id.includes('teacher');
              // 檢查是否為舊系統管理員按鈕
              const isLegacyAdminButton = item.id.includes('legacy-admin');
              
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
                        ? isTeacherButton
                          ? 'w-10 h-10 bg-gradient-to-br from-[#FF8C42] to-[#FFB366] text-white shadow-lg border-2 border-[#FF8C42]'
                          : isLegacyAdminButton
                            ? 'w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] text-white shadow-lg border-2 border-[#8B5CF6]'
                            : 'w-10 h-10 bg-[#FFD59A] text-white shadow-lg border-2 border-[#EBC9A4]'
                        : isTeacherButton
                          ? 'w-8 h-8 bg-gradient-to-br from-[#FF8C42]/20 to-[#FFB366]/20 text-[#FF8C42] border border-[#FF8C42]/30 hover:from-[#FF8C42]/30 hover:to-[#FFB366]/30 hover:border-[#FF8C42]/50'
                          : isLegacyAdminButton
                            ? 'w-8 h-8 bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 hover:from-[#8B5CF6]/30 hover:to-[#A855F7]/30 hover:border-[#8B5CF6]/50'
                            : 'w-8 h-8 bg-white/90 text-[#4B4036] border border-[#F0E68C] hover:bg-[#FFD59A]/10 hover:border-[#FFD59A]'
                    }`}
                    whileHover={{ 
                      scale: 1.1,
                      y: -2
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className={`w-3.5 h-3.5 stroke-2 ${
                      isActive 
                        ? 'text-white' 
                        : isTeacherButton 
                          ? 'text-[#FF8C42]' 
                          : isLegacyAdminButton
                            ? 'text-[#8B5CF6]'
                            : 'text-[#4B4036]/70'
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

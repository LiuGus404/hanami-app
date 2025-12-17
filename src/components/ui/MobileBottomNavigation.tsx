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
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import toast from 'react-hot-toast';

interface MobileBottomNavigationProps {
  className?: string;
}

export default function MobileBottomNavigation({ className = '' }: MobileBottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSaasAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasTeacherAccess, setHasTeacherAccess] = useState(false);
  const [hasLegacyAdminAccess, setHasLegacyAdminAccess] = useState(false);
  const [hasOrgIdentity, setHasOrgIdentity] = useState(false);

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

        // 額外檢查：如果用戶在 SaaS 系統中有教師角色
        if (saasSession) {
          try {
            const saasData = JSON.parse(saasSession);
            if (saasData.user && saasData.user.role === 'teacher') {
              hasTeacherRole = true;
            }
          } catch (error) {
            console.log('❌ 解析 SaaS 教師角色失敗:', error);
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

  // 監聽會話存儲變化，實時更新教師權限狀態
  useEffect(() => {
    const handleStorageChange = () => {
      const teacherSession = sessionStorage.getItem('hanami_teacher_access');
      if (teacherSession) {
        try {
          const teacherData = JSON.parse(teacherSession);
          if (teacherData.hasTeacherAccess && teacherData.employeeData) {
            setHasTeacherAccess(true);
          } else {
            setHasTeacherAccess(false);
          }
        } catch (error) {
          console.log('❌ 解析教師會話失敗:', error);
          setHasTeacherAccess(false);
        }
      } else {
        setHasTeacherAccess(false);
      }
    };

    // 監聽 sessionStorage 變化
    window.addEventListener('storage', handleStorageChange);

    // 定期檢查教師權限狀態（因為 sessionStorage 變化不會觸發 storage 事件）
    const intervalId = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // 檢查用戶是否有機構身份
  useEffect(() => {
    const checkOrgIdentity = async () => {
      try {
        // 獲取用戶信息
        const saasSession = localStorage.getItem('saas_user_session');
        if (!saasSession) {
          setHasOrgIdentity(false);
          return;
        }

        const saasData = JSON.parse(saasSession);
        const userId = saasData.user?.id;
        const userEmail = saasData.user?.email;

        if (!userId && !userEmail) {
          setHasOrgIdentity(false);
          return;
        }

        // 調用 API 獲取機構身份
        const response = await fetch(
          `/api/organizations/user-organizations?${userId ? `userId=${encodeURIComponent(userId)}` : ''}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`
        );

        if (response.ok) {
          const data = await response.json();
          const organizations = data.data || [];
          // 如果有任何機構身份，設置為 true
          setHasOrgIdentity(organizations.length > 0);
        } else {
          setHasOrgIdentity(false);
        }
      } catch (error) {
        console.log('❌ 檢查機構身份失敗:', error);
        setHasOrgIdentity(false);
      }
    };

    // 延遲檢查，避免與其他認證檢查衝突
    const timeoutId = setTimeout(checkOrgIdentity, 1500);
    return () => clearTimeout(timeoutId);
  }, []);

  // 智能主頁導航邏輯
  const getHomeNavigation = () => {
    // 檢查用戶登入狀態
    const isLoggedIn = () => {
      try {
        const saasSession = localStorage.getItem('saas_user_session');
        if (saasSession) {
          const saasData = JSON.parse(saasSession);
          return saasData.user && saasData.user.id && saasData.user.email;
        }
        return false;
      } catch (error) {
        return false;
      }
    };

    const userLoggedIn = isLoggedIn();

    // 根據當前頁面和登入狀態決定主頁導航目標
    if (pathname === '/') {
      // 在主頁：已登入跳轉到儀表板，未登入跳轉到登入頁
      return userLoggedIn ? '/aihome/dashboard' : '/aihome/auth/login';
    } else if (pathname.startsWith('/aihome/auth/login') || pathname.startsWith('/aihome/dashboard')) {
      // 在登入頁或儀表板：跳轉到主頁
      return '/';
    } else {
      // 其他頁面：根據登入狀態決定
      return userLoggedIn ? '/aihome/dashboard' : '/';
    }
  };

  // 導航項目配置 - 動態根據用戶角色顯示
  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'mobile-nav-dashboard',
        icon: HomeIcon,
        href: getHomeNavigation(),
        label: '首頁'
      },
      {
        id: 'mobile-nav-ai-companions',
        icon: ChatBubbleLeftRightIcon,
        href: '/aihome/ai-companions',
        label: '換腦工房'
      },
      {
        id: 'mobile-nav-parent-connect',
        icon: UserGroupIcon,
        href: '/aihome/parent/bound-students',
        label: '家長連結'
      },
      {
        id: 'mobile-nav-settings',
        icon: Cog6ToothIcon,
        href: '/aihome/profile',
        label: '設定'
      }
    ];

    // 如果有機構身份，添加花見老師專區按鈕（跳轉到老師連結）
    if (hasOrgIdentity) {
      const teacherNavItem = {
        id: 'mobile-nav-teacher-link',
        icon: AcademicCapIcon,
        href: '/aihome/teacher-link',
        label: '老師專區'
      };

      // 插入到設定按鈕之前
      baseItems.splice(3, 0, teacherNavItem);
    }

    // 如果有舊系統管理員權限，添加舊系統管理面板按鈕
    if (hasLegacyAdminAccess) {
      const legacyAdminItem = {
        id: 'mobile-nav-legacy-admin',
        icon: ShieldCheckIcon,
        href: '/admin',
        label: '舊系統'
      };

      // 計算插入位置：如果有機構身份，插入到花見老師專區按鈕之後，否則插入到設定之前
      const insertIndex = hasOrgIdentity ? 4 : 3;
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
        // 計算插入位置：考慮機構身份和舊系統管理員權限
        let insertIndex = 3; // 默認插入到設定之前
        if (hasOrgIdentity) insertIndex++;
        if (hasLegacyAdminAccess) insertIndex++;

        baseItems.splice(insertIndex, 0, {
          id: 'mobile-nav-admin',
          icon: ShieldCheckIcon,
          href: '/admin',
          label: '新系統'
        });
      }
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // 處理導航點擊
  const handleNavigation = (href: string) => {
    if (href === '/aihome/parent/bound-students' && !user) {
      toast('請先登入才能查看家長連結');
      router.push('/aihome/auth/login');
      return;
    }

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

  // 檢查當前活動路徑
  const isItemActive = (href: string) => {
    // 特殊處理首頁，避免所有路徑都匹配 '/'
    if (href === '/' || href === '/aihome/dashboard') {
      return pathname === '/' || pathname === '/aihome/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <AnimatePresence>
      {/* 底部間距，防止內容被遮擋 */}
      <div key="mobile-nav-spacer" className="fixed bottom-0 left-0 right-0 pointer-events-none z-0">
        <div className="h-28 lg:hidden"></div>
      </div>

      {/* 懸浮式導航條 - 膠囊設計 */}
      <motion.div
        key="mobile-nav-main"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
        className={`fixed bottom-6 left-4 right-4 z-50 pointer-events-auto flex justify-center ${className}`}
      >
        <div
          className="flex items-center justify-between bg-[#FFF9F2] rounded-full p-2 shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF] border border-[#EADBC8]/50 max-w-md w-full"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {navigationItems.map((item) => {
            const isActive = isItemActive(item.href);
            // 檢查特殊角色顏色
            const isTeacherButton = item.id.includes('teacher-link') || item.id.includes('teacher-zone');
            const isLegacyAdminButton = item.id.includes('legacy-admin') || item.id.includes('admin');

            let activeBgColor = "bg-[#FFD59A]";
            let activeTextColor = "text-[#4B4036]";
            let activeIconColor = "text-[#4B4036]";

            if (isTeacherButton) {
              activeBgColor = "bg-gradient-to-r from-orange-400 to-amber-400";
              activeTextColor = "text-white";
              activeIconColor = "text-white";
            } else if (isLegacyAdminButton) {
              activeBgColor = "bg-gradient-to-r from-purple-500 to-indigo-500";
              activeTextColor = "text-white";
              activeIconColor = "text-white";
            }

            return (
              <motion.button
                key={item.id}
                layout
                onClick={() => handleNavigation(item.href)}
                className={`
                    relative flex items-center justify-center rounded-full h-10 px-4 transition-colors duration-300
                    ${isActive ? `${activeBgColor} shadow-inner` : 'bg-transparent hover:bg-[#EADBC8]/20'}
                `}
                whileTap={{ scale: 0.95 }}
                // 添加 layoutId 確保平滑過渡
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${isActive ? activeIconColor : 'text-[#8B7E74]'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {isActive && (
                    <motion.span
                      layout="position"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className={`text-xs font-bold ${activeTextColor}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

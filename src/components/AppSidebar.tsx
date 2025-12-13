'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  HomeIcon,
  CalendarDaysIcon,
  UsersIcon,
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon,
  SparklesIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { useDirectTeacherAccess } from '@/hooks/saas/useDirectTeacherAccess';
import { createSaasClient } from '@/lib/supabase-saas';
import toast from 'react-hot-toast';

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
  const { user, supabase: saasSupabase } = useSaasAuth();
  const { hasTeacherAccess, checkTeacherAccess, teacherAccess, forceRefreshState, loading } = useTeacherAccess();
  const {
    hasTeacherAccess: directHasTeacherAccess,
    checkTeacherAccess: directCheckTeacherAccess,
    teacherAccess: directTeacherAccess,
    loading: directLoading
  } = useDirectTeacherAccess();
  // const saasSupabase = useMemo(() => createSaasClient(), []); // Removed in favor of shared client
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);


  useEffect(() => {
    setIsMounted(true);
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (user?.email && !directLoading && !directTeacherAccess) {
      directCheckTeacherAccess(user.email).catch((error) => {
        console.error('AppSidebar: 直接 Supabase 檢查失敗:', error);
      });
    }
  }, [user?.email, directLoading, directTeacherAccess, directCheckTeacherAccess]);

  useEffect(() => {
    let cancelled = false;
    const resolveRole = async () => {
      // console.log('AppSidebar: resolveRole called', { userExists: !!user, email: user?.email });

      if (!user) {
        setIsSuperAdmin(false);
        setRoleLoading(false);
        return;
      }

      // 0. Hardcoded Owner Check (Fail-safe)
      if (user.email === 'tqfea12@gmail.com') {
        // console.log('AppSidebar: Detected Owner Email -> Force Super Admin');
        setIsSuperAdmin(true);
        setRoleLoading(false);
        // We can still run the DB check for consistency logs, but return early to ensure UI shows
        return;
      }

      // 1. Check user Metadata
      const normalizedRoleFromUser = (
        (user as any)?.user_role ??
        (user as any)?.role ??
        (user as any)?.metadata?.user_role ??
        (user as any)?.metadata?.role ??
        (user as any)?.app_metadata?.user_role ??
        (user as any)?.app_metadata?.role ??
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      console.log('AppSidebar: normalizedRoleFromUser', normalizedRoleFromUser);

      if (normalizedRoleFromUser === 'super_admin' || normalizedRoleFromUser === 'admin') {
        console.log('AppSidebar: Role found in user object:', normalizedRoleFromUser);
        setIsSuperAdmin(true);
        setRoleLoading(false);
        return;
      }

      // 2. DB Check
      const userId = user.id || (user as any)?.user_id;
      const userEmail = user.email;

      if (!userId && !userEmail) {
        setIsSuperAdmin(false);
        setRoleLoading(false);
        return;
      }

      try {
        console.log('AppSidebar: Querying DB for role', { userId, userEmail });
        let query = saasSupabase.from('saas_users').select('user_role');

        if (userId) {
          query = query.eq('id', userId);
        } else if (userEmail) {
          query = query.eq('email', userEmail);
        }

        const { data: userData, error } = await query.maybeSingle();

        if (!cancelled) {
          if (error) {
            console.error(`AppSidebar: 讀取 user_role 失敗 (User: ${userEmail})`, error.message);
            // Don't set false immediately if we had true?
            // But we started false.
            setIsSuperAdmin(false);
          } else {
            const role = (userData as { user_role: string } | null)?.user_role || 'user';
            const isSuperAdminRole = role.toLowerCase() === 'super_admin' || role.toLowerCase() === 'admin';
            console.log(`AppSidebar: DB Check Result. Role: ${role}, IsSuper: ${isSuperAdminRole}`);
            setIsSuperAdmin(isSuperAdminRole);
          }
          setRoleLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('AppSidebar: 查詢 user_role 發生錯誤:', err);
          setIsSuperAdmin(false);
          setRoleLoading(false);
        }
      }
    };

    resolveRole();
    return () => {
      cancelled = true;
    };
  }, [user, saasSupabase]);

  const sidebarMenuItems: SidebarItem[] = useMemo(() => {
    const baseItems: SidebarItem[] = [
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
        icon: BriefcaseIcon,
        label: '老師連結',
        href: '/aihome/teacher-link',
        description: '建立與管理您的課程機構',
      },
      {
        icon: SparklesIcon,
        label: 'AI伙伴',
        href: '/aihome/ai-companions',
        description: '您的工作和學習伙伴'
      },
    ];

    // 如果是 super_admin，添加管理員控制中心選項
    // 移除 !roleLoading 檢查，避免因加載狀態卡住導致選項消失
    // 同時添加日誌以便調試
    if (isSuperAdmin) {
      console.log('AppSidebar: Rendering Admin Control Center link');
      baseItems.push({
        icon: Cog6ToothIcon,
        label: '管理員控制中心',
        href: '/aihome/admin/control-center',
        description: '調整 AI 角色模型與系統設定'
      });
    } else {
      // console.log('AppSidebar: Skipping Admin link. isSuperAdmin:', isSuperAdmin, 'roleLoading:', roleLoading);
    }

    // 添加設定選項
    baseItems.push({
      icon: UserIcon,
      label: '設定',
      href: '/aihome/profile',
      description: '管理您的個人信息和系統設定'
    });

    return baseItems;
  }, [isSuperAdmin, roleLoading]);

  const handleNavigation = (href: string) => {
    if (href === '/aihome/parent/bound-students' && !user) {
      toast('請先登入才能查看家長連結');
      router.push('/aihome/auth/login');
      return;
    }

    router.push(href);
  };

  const handleItemClick = (href: string) => {
    handleNavigation(href);
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
            className="fixed top-16 bottom-0 left-0 w-80 bg-white shadow-xl z-50 lg:fixed lg:top-16 lg:shadow-lg lg:z-50 lg:flex-shrink-0 flex flex-col h-full"
          >
            {/* 標題區域 */}
            <div className="p-6 border-b border-[#EADBC8] flex-shrink-0">
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
                    <p className="text-sm text-[#2B3A3B]">選單 {isSuperAdmin && <span className="text-xs bg-red-100 text-red-600 px-1 rounded ml-1">Admin</span>}</p>
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
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {sidebarMenuItems.map((item, index) => {
                const isActive = currentPath === item.href;


                return (
                  <motion.button
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleItemClick(item.href)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] shadow-md'
                      : 'text-[#2B3A3B] hover:bg-[#FFD59A]/20'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive
                      ? 'bg-white/80'
                      : 'bg-[#FFD59A]/20'
                      }`}>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#4B4036]' : 'text-[#4B4036]'
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

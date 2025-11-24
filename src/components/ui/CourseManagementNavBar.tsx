'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { useTeacherLinkPermissions } from '@/hooks/useTeacherLinkPermissions';
import { toast } from 'react-hot-toast';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  permissionKey?: 'class-activities' | 'schedule-management' | 'lesson-availability';
}

const navItems: NavItem[] = [
  {
    id: 'class-activities',
    label: '課堂活動管理',
    path: '/aihome/teacher-link/create/class-activities',
    icon: <BookOpen className="w-5 h-5" />,
    permissionKey: 'class-activities',
  },
  {
    id: 'lesson-availability',
    label: '多課程時間表',
    path: '/aihome/teacher-link/create/lesson-availability',
    icon: <Clock className="w-5 h-5" />,
    permissionKey: 'schedule-management', // 多课程时间表属于排期管理的一部分
  },
  {
    id: 'schedule-management',
    label: '課程與課堂排期管理',
    path: '/aihome/teacher-link/create/schedule-management',
    icon: <Calendar className="w-5 h-5" />,
    permissionKey: 'schedule-management',
  },
];

interface CourseManagementNavBarProps {
  orgId?: string | null;
}

export default function CourseManagementNavBar({ orgId }: CourseManagementNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useTeacherLinkPermissions();

  // 確定當前活動的標籤
  const getActiveTab = () => {
    if (pathname?.includes('/class-activities')) return 'class-activities';
    if (pathname?.includes('/lesson-availability')) return 'lesson-availability';
    if (pathname?.includes('/schedule-management')) return 'schedule-management';
    return 'class-activities'; // 默認
  };

  const activeTab = getActiveTab();

  const handleNavigation = (item: NavItem) => {
    // 检查权限
    if (item.permissionKey && !hasPermission(item.permissionKey)) {
      toast.error('權限不足，未能進入', {
        duration: 2000,
      });
      return;
    }
    
    const url = orgId ? `${item.path}?orgId=${encodeURIComponent(orgId)}` : item.path;
    router.push(url);
  };

  // 根据权限过滤导航项
  const visibleNavItems = navItems.filter((item) => {
    if (!item.permissionKey) return true;
    return hasPermission(item.permissionKey);
  });

  return (
    <div className="mb-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] shadow-lg p-2">
        <nav className="flex gap-2">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const hasAccess = !item.permissionKey || hasPermission(item.permissionKey);
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item)}
                whileHover={hasAccess ? { scale: 1.02 } : {}}
                whileTap={hasAccess ? { scale: 0.98 } : {}}
                disabled={!hasAccess}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
                  ${
                    !hasAccess
                      ? 'bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed text-gray-500'
                      : isActive
                      ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                      : 'text-[#6E5A4A] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                  }
                `}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">
                  {item.id === 'class-activities' ? '活動' : 
                   item.id === 'lesson-availability' ? '時間表' : 
                   '排期'}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}



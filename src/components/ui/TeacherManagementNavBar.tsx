'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Users, User, Calendar } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'members',
    label: '成員管理',
    path: '/aihome/teacher-link/create/member-management',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'teachers',
    label: '老師資料管理',
    path: '/aihome/teacher-link/create/teachers',
    icon: <User className="w-5 h-5" />,
  },
  {
    id: 'schedule',
    label: '排班管理',
    path: '/aihome/teacher-link/create/teachers/teacher-schedule',
    icon: <Calendar className="w-5 h-5" />,
  },
];

interface TeacherManagementNavBarProps {
  orgId?: string | null;
}

export default function TeacherManagementNavBar({ orgId }: TeacherManagementNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 確定當前活動的標籤
  const getActiveTab = () => {
    if (pathname?.includes('/member-management')) return 'members';
    if (pathname?.includes('/teacher-schedule')) return 'schedule';
    if (pathname?.includes('/teachers')) return 'teachers';
    return 'members'; // 默認
  };

  const activeTab = getActiveTab();

  const handleNavigation = (item: NavItem) => {
    const url = orgId ? `${item.path}?orgId=${encodeURIComponent(orgId)}` : item.path;
    router.push(url);
  };

  return (
    <div className="mb-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] shadow-lg p-2">
        <nav className="flex gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                      : 'text-[#6E5A4A] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                  }
                `}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split('管理')[0]}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

































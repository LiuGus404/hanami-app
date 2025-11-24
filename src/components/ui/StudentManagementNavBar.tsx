'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface StudentManagementNavBarProps {
  orgId?: string | null;
}

export default function StudentManagementNavBar({ orgId }: StudentManagementNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { 
      id: 'students', 
      label: '學生管理', 
      path: '/aihome/teacher-link/create/students', 
      icon: <UserGroupIcon className="w-5 h-5" /> 
    },
    { 
      id: 'pending-students', 
      label: '待審核學生', 
      path: '/aihome/teacher-link/create/pending-students', 
      icon: <ClockIcon className="w-5 h-5" /> 
    },
  ];

  const getActiveTab = () => {
    for (const item of navItems) {
      if (pathname?.startsWith(item.path)) {
        return item.id;
      }
    }
    return 'students'; // Default to students
  };

  const activeTab = getActiveTab();

  const handleNavigation = (item: NavItem) => {
    const url = orgId ? `${item.path}?orgId=${encodeURIComponent(orgId)}` : item.path;
    router.push(url);
  };

  return (
    <div className="mb-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] shadow-lg p-2">
        <nav className="flex flex-wrap gap-2">
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
                <span className="sm:hidden">
                  {item.id === 'students' ? '學生' : '待審核'}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

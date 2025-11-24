'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3, TreePine, TrendingUp, Gamepad2, Users, GraduationCap, Video, FileText } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '進度總覽',
    path: '/aihome/teacher-link/create/student-progress',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: 'growth-trees',
    label: '成長樹',
    path: '/aihome/teacher-link/create/student-progress/growth-trees',
    icon: <TreePine className="w-5 h-5" />,
  },
  {
    id: 'learning-paths',
    label: '學習路線',
    path: '/aihome/teacher-link/create/student-progress/learning-paths',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'abilities',
    label: '發展能力',
    path: '/aihome/teacher-link/create/student-progress/abilities',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    id: 'activities',
    label: '教學活動',
    path: '/aihome/teacher-link/create/student-progress/activities',
    icon: <Gamepad2 className="w-5 h-5" />,
  },
  {
    id: 'assessments',
    label: '能力評估',
    path: '/aihome/teacher-link/create/student-progress/ability-assessments',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'media',
    label: '學生媒體',
    path: '/aihome/teacher-link/create/student-progress/student-media',
    icon: <Video className="w-5 h-5" />,
  },
  {
    id: 'templates',
    label: '範本管理',
    path: '/aihome/teacher-link/create/student-progress/templates',
    icon: <FileText className="w-5 h-5" />,
  },
];

interface StudentProgressNavBarProps {
  orgId?: string | null;
}

export default function StudentProgressNavBar({ orgId }: StudentProgressNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 確定當前活動的標籤
  const getActiveTab = () => {
    if (pathname?.includes('/templates')) return 'templates';
    if (pathname?.includes('/student-media')) return 'media';
    if (pathname?.includes('/ability-assessments')) return 'assessments';
    if (pathname?.includes('/activities')) return 'activities';
    if (pathname?.includes('/abilities')) return 'abilities';
    if (pathname?.includes('/learning-paths')) return 'learning-paths';
    if (pathname?.includes('/growth-trees')) return 'growth-trees';
    return 'dashboard'; // 默認
  };

  const activeTab = getActiveTab();

  const handleNavigation = (item: NavItem) => {
    const url = orgId ? `${item.path}?orgId=${encodeURIComponent(orgId)}` : item.path;
    router.push(url);
  };

  return (
    <div className="mb-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] shadow-lg p-2">
        <nav className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex-shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap
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
                  {item.id === 'dashboard' ? '總覽' :
                   item.id === 'growth-trees' ? '成長樹' :
                   item.id === 'learning-paths' ? '路線' :
                   item.id === 'abilities' ? '能力' :
                   item.id === 'activities' ? '活動' :
                   item.id === 'assessments' ? '評估' :
                   item.id === 'media' ? '媒體' :
                   item.id === 'templates' ? '範本' : item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


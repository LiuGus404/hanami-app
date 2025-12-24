'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  UsersIcon,
  LinkIcon,
  HeartIcon,
  BookOpenIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ParentNavigationProps {
  className?: string;
}

export default function ParentNavigation({ className = '' }: ParentNavigationProps) {
  const router = useRouter();

  const parentMenuItems = [
    {
      icon: UsersIcon,
      label: '家長連結',
      href: '/aihome/parent/bound-students',
      description: '查看學習記錄',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: BookOpenIcon,
      label: '學生課程',
      href: '/aihome/parent/student-courses',
      description: '查看學生的課程和進度',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: CalendarIcon,
      label: '課程安排',
      href: '/aihome/parent/schedule',
      description: '查看課程時間安排',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center">
          <HeartIcon className="w-5 h-5 text-[#4B4036]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#4B4036]">家長功能</h3>
          <p className="text-sm text-[#2B3A3B]">管理您的學生帳戶</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parentMenuItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(item.href)}
            className={`${item.bgColor} rounded-xl p-4 cursor-pointer border border-gray-200 hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 text-white`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {item.label}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Copy, Settings, Users, UserPlus, LayoutGrid, List } from 'lucide-react';

import CopyAvailableTimesModal from '@/components/ui/CopyAvailableTimesModal';
import LessonAvailabilityDashboard from '@/components/ui/LessonAvailabilityDashboard';
import MultiCourseAvailabilityDashboard from '@/components/ui/MultiCourseAvailabilityDashboard';
import { getUserSession } from '@/lib/authUtils';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default function LessonAvailabilityPage() {
  const router = useRouter();
  const pathname = usePathname();
  // 從會話中獲取機構信息（admin 頁面可能沒有 OrganizationProvider）
  const session = getUserSession();
  const currentOrganization = session?.organization || null;
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) {
      return null;
    }
    return UUID_REGEX.test(currentOrganization.id) ? currentOrganization.id : null;
  }, [currentOrganization?.id]);
  
  const isAllowedOrg = validOrgId === 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';
  
  // 根據當前路徑決定導航目標
  const scheduleManagementPath = useMemo(() => {
    if (pathname?.includes('/teacher-link/create/')) {
      return '/aihome/teacher-link/create/schedule-management';
    }
    return '/admin/schedule-management';
  }, [pathname]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'traditional' | 'multi-course'>('multi-course');

  const handleTrialQueueClick = (e: React.MouseEvent) => {
    if (!isAllowedOrg) {
      e.preventDefault();
      toast.error('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
    }
  };

  const handleAddTrialClick = (e: React.MouseEvent) => {
    if (!isAllowedOrg) {
      e.preventDefault();
      toast.error('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
    }
  };

  return (
    <div className="p-6">
      {/* 工具欄 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#EADBC8] mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* 左側：視圖切換 */}
          <div className="flex flex-wrap gap-3 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('multi-course')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                viewMode === 'multi-course'
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                  : 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              多課程視圖
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('traditional')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                viewMode === 'traditional'
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                  : 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white'
              }`}
            >
              <List className="w-4 h-4" />
              傳統視圖
            </motion.button>
          </div>
          
          {/* 右側：操作按鈕 */}
          <div className="flex flex-wrap gap-3 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <Copy className="w-4 h-4" />
              複製有位時間
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white transition-all shadow-sm flex items-center gap-2"
              onClick={() => router.push(scheduleManagementPath)}
            >
              <Settings className="w-4 h-4" />
              管理課程
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                className={`px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 ${
                  isAllowedOrg
                    ? 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white'
                    : 'bg-gray-400 opacity-60 text-white border-gray-400 cursor-not-allowed'
                }`}
                href="/admin/trial-queue"
                onClick={handleTrialQueueClick}
              >
                <Users className="w-4 h-4" />
                輪候學生列表
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                className={`px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 ${
                  isAllowedOrg
                    ? 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white'
                    : 'bg-gray-400 opacity-60 text-white border-gray-400 cursor-not-allowed'
                }`}
                href="/admin/add-trial-students"
                onClick={handleAddTrialClick}
              >
                <UserPlus className="w-4 h-4" />
                新增輪候學生
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* 主要內容區域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {viewMode === 'multi-course' ? (
          <MultiCourseAvailabilityDashboard />
        ) : (
          <LessonAvailabilityDashboard />
        )}
      </motion.div>
      
      <CopyAvailableTimesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

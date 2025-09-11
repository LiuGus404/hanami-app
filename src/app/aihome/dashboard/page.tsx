'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  UserIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function DashboardPage() {
  const { user, logout } = useSaasAuth();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/aihome');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 導航欄 */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <HanamiEchoLogo size="lg" />
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/aihome/pricing')}
              className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              定價方案
            </button>
            <button
              onClick={handleLogout}
              className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 歡迎區域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
              歡迎回來，{user.full_name || user.email}！
            </h1>
            <p className="text-[#2B3A3B]">
              管理您的 AIHome 帳戶和服務
            </p>
          </motion.div>

          {/* 快速操作 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: UserIcon,
                title: '個人資料',
                description: '管理您的帳戶信息',
                action: () => router.push('/aihome/profile'),
                color: 'bg-blue-100 text-blue-600'
              },
              {
                icon: CreditCardIcon,
                title: '訂閱管理',
                description: '查看和管理訂閱',
                action: () => router.push('/aihome/subscription'),
                color: 'bg-green-100 text-green-600'
              },
              {
                icon: ChartBarIcon,
                title: '使用統計',
                description: '查看使用情況',
                action: () => router.push('/aihome/analytics'),
                color: 'bg-purple-100 text-purple-600'
              },
              {
                icon: CogIcon,
                title: '設置',
                description: '帳戶和應用設置',
                action: () => router.push('/aihome/settings'),
                color: 'bg-gray-100 text-gray-600'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              >
                <HanamiCard 
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={item.action}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#4B4036] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#2B3A3B]">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-[#4B4036]" />
                  </div>
                </HanamiCard>
              </motion.div>
            ))}
          </div>

          {/* 帳戶信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                帳戶信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#4B4036] mb-1">姓名</p>
                  <p className="text-[#2B3A3B] font-medium">
                    {user.full_name || '未設置'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4B4036] mb-1">電子郵箱</p>
                  <p className="text-[#2B3A3B] font-medium">
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4B4036] mb-1">註冊時間</p>
                  <p className="text-[#2B3A3B] font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4B4036] mb-1">帳戶狀態</p>
                  <p className="text-[#2B3A3B] font-medium">
                    {user.is_verified ? '已驗證' : '未驗證'}
                  </p>
                </div>
              </div>
            </HanamiCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

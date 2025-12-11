import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';

export interface UnifiedNavbarProps {
  onToggleSidebar: () => void;
  user: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
  customRightContent?: React.ReactNode;
}

export default function UnifiedNavbar({
  onToggleSidebar,
  user,
  onLogout,
  onLogin,
  onRegister,
  customRightContent
}: UnifiedNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const displayName = (user?.full_name || user?.email || 'U').trim();
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';



  const handleGearClick = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onToggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative"
              title="開啟選單"
            >
              <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
            </motion.button>
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src="/@hanami.png"
                alt="Hanami logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 食量顯示 */}
            <FoodBalanceButton />

            {customRightContent ? (
              customRightContent
            ) : (
              <div className="relative">
                <motion.button
                  onClick={handleGearClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                  title="帳戶設定"
                >
                  <Cog6ToothIcon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={closeMenu} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-44 bg-white border border-[#EADBC8] rounded-xl shadow-lg z-50"
                    >
                      {user ? (
                        <div className="px-4 py-3 text-[#4B4036] text-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{displayInitial}</span>
                            </div>
                            <div className="leading-tight">
                              <p className="font-semibold text-sm">
                                {displayName || '使用者'}
                              </p>
                              {user.email && (
                                <p className="text-xs text-[#8A7C70]">{user.email}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              router.push('/aihome/profile');
                              closeMenu();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 hover:bg-[#FFF4DF] transition-colors text-[#4B4036] font-medium text-xs border border-[#EADBC8] mb-2"
                          >
                            設定
                          </button>
                          <button
                            onClick={() => {
                              onLogout();
                              closeMenu();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFF9F2] hover:bg-[#FFF4DF] transition-colors text-[#4B4036] font-medium text-xs"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            登出
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col text-[#4B4036] text-sm">
                          <button
                            onClick={() => {
                              onLogin();
                              closeMenu();
                            }}
                            className="px-3 py-2 hover:bg-[#FFF9F2] text-left"
                          >
                            登入
                          </button>
                          <button
                            onClick={() => {
                              onRegister();
                              closeMenu();
                            }}
                            className="px-3 py-2 hover:bg-[#FFF9F2] text-left"
                          >
                            註冊
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

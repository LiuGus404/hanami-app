'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import ChildrenManagement from '@/components/children/ChildrenManagement';
import GrowthWitnessPopup from '@/components/profile/GrowthWitnessPopup';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Settings,
  Users,
  LogOut,
  ChevronRight,
  Sparkles,
  Utensils,
  ArrowUpRight,
  LayoutGrid
} from 'lucide-react';
import {
  Bars3Icon,
  BuildingLibraryIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import UsageStatsDisplay from '@/components/ai-companion/UsageStatsDisplay';
import { useFoodDisplay } from '@/hooks/useFoodDisplay';
import { getUserOrganizations, type UserOrganizationIdentity } from '@/lib/organizationUtils';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useSaasAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'children' | 'settings'>('overview');
  const [showWitnessPopup, setShowWitnessPopup] = useState(false);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [organizationCount, setOrganizationCount] = useState<number>(0);
  const [organizations, setOrganizations] = useState<UserOrganizationIdentity[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Custom hook for food stats - Now including history
  const {
    foodBalance,
    fetchFoodInfo,
    foodHistory,
    showFoodHistory,
    toggleFoodHistory
  } = useFoodDisplay(user?.id);

  // Auto refresh food info
  useEffect(() => {
    if (user?.id) fetchFoodInfo();
  }, [user?.id, fetchFoodInfo]);

  // Load children count - same logic as ChildrenManagement
  const loadChildrenCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/children?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.children) {
        setChildrenCount(data.children.length || 0);
      }
    } catch (error) {
      console.error('載入孩子數量失敗:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChildrenCount();
  }, [loadChildrenCount]);

  // Refresh children count when switching to children tab
  useEffect(() => {
    if (activeTab === 'children') {
      loadChildrenCount();
    }
  }, [activeTab, loadChildrenCount]);

  const [currentOrg, setCurrentOrg] = useState<{ name: string, role?: string, status?: string } | null>(null);

  // Load organization count - same logic as teacher-link
  const loadOrganizationCount = useCallback(async () => {
    if (!user?.id || !user?.email) return;

    try {
      const response = await fetch(
        `/api/organizations/user-organizations?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`
      );

      if (response.ok) {
        const result = await response.json();
        const organizations = result.data || [];
        setOrganizationCount(organizations.length || 0);
      }
    } catch (error) {
      console.error('載入機構數量失敗:', error);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadOrganizationCount();
  }, [loadOrganizationCount]);

  useEffect(() => {
    if (user) {
      const fetchOrgs = async () => {
        try {
          // Try API first to bypass RLS (matches TeacherLinkShell logic)
          try {
            const response = await fetch(
              `/api/organizations/user-organizations?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`
            );
            if (response.ok) {
              const result = await response.json();
              const apiOrgs = result.data || [];
              if (apiOrgs.length > 0) {
                setOrganizations(apiOrgs);

                // Process matches with currentOrg from localStorage
                processLocalStorageMatch(apiOrgs);
                return;
              }
            }
          } catch (apiErr) {
            console.error('API fetch failed, falling back to direct query', apiErr);
          }

          // Fallback to direct query
          const orgs = await getUserOrganizations(supabase, user.id, user.email);
          setOrganizations(orgs);
          processLocalStorageMatch(orgs);

        } catch (err) {
          console.error('Failed to fetch organizations', err);
        } finally {
          setLoadingOrgs(false);
        }
      };

      const processLocalStorageMatch = (orgs: UserOrganizationIdentity[]) => {
        // Try to get selected org from localStorage first to match TeacherLink logic
        try {
          const stored = localStorage.getItem('hanami_current_org');
          if (stored) {
            const storedOrg = JSON.parse(stored);
            if (storedOrg && storedOrg.name) {
              // Find the role for this org if possible
              const matchingOrg = orgs.find(o => o.orgId === storedOrg.id);
              setCurrentOrg({
                name: storedOrg.name,
                role: matchingOrg ? matchingOrg.role : 'Member',
                status: storedOrg.status || (matchingOrg ? matchingOrg.status : 'active')
              });
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing stored org', e);
        }

        // Fallback to primary or first
        const primary = orgs.find(o => o.isPrimary) || orgs[0];
        if (primary) {
          setCurrentOrg({
            name: primary.orgName,
            role: primary.role,
            status: primary.status
          });
        }
      };

      fetchOrgs();
    }
  }, [user]);

  // Display Org is now state-based
  const displayOrg = currentOrg;

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login?redirect=/aihome/profile');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#FFF9F2] shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[#FFD59A] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-sans text-[#4B4036] flex overflow-hidden">
      {/* Sidebar */}
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col items-center w-full h-screen overflow-y-auto overflow-x-hidden relative scrollbar-hide">

        {/* Top Navigation Bar - AI Companions Style */}
        <nav className="w-full bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Menu Button */}
                <motion.button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                  title={isSidebarOpen ? "關閉選單" : "開啟選單"}
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
                </motion.button>

                {/* Logo */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                  <Image
                    src="/@hanami.png"
                    alt="HanamiEcho Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Food Display */}
                <div className="relative mx-2">
                  <motion.button
                    onClick={toggleFoodHistory}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#FFD59A] rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <img src="/apple-icon.svg" alt="食量" className="w-4 h-4" />
                    <span className="text-sm font-bold text-[#4B4036]">{foodBalance}</span>
                  </motion.button>

                  <AnimatePresence>
                    {showFoodHistory && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-xl border border-[#EADBC8] p-3 z-50 overflow-hidden"
                      >
                        <div className="text-xs font-bold text-[#8C7A6B] mb-2 px-1">最近 5 次食量記錄</div>
                        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                          {foodHistory.length === 0 ? (
                            <div className="text-center text-xs text-gray-400 py-2">尚無記錄</div>
                          ) : (
                            foodHistory.map((record: any) => {
                              let characterName = '';
                              const roleId = record.ai_messages?.role_instances?.role_id || record.ai_messages?.role_id;
                              if (roleId) {
                                const roleNameMap: Record<string, string> = {
                                  'hibi': '希希',
                                  'mori': '墨墨',
                                  'pico': '皮可'
                                };
                                characterName = roleNameMap[roleId] || roleId;
                              }
                              return (
                                <div key={record.id} className="flex justify-between items-center text-xs p-2 bg-[#F8F5EC] rounded-lg">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-[#4B4036] flex items-center gap-1.5">
                                      <img src="/apple-icon.svg" alt="食量" className="w-3.5 h-3.5" />
                                      <span>{record.amount > 0 ? '+' : ''}{record.amount} {characterName}</span>
                                    </span>
                                    <span className="text-[10px] text-[#8C7A6B]">{new Date(record.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Unified Right Content */}
                <UnifiedRightContent
                  user={user}
                  onLogout={logout}
                  onNavigate={() => { }} // Profile page handles its own navigation
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area - Responsive Flex/Grid (Neumorphic) */}
        <div className="w-full max-w-md lg:max-w-7xl flex-1 px-8 py-8 lg:pb-12">

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start h-full">

            {/* LEFT COLUMN: Profile & Stats (Sticky on Desktop) */}
            <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-8 lg:sticky lg:top-28">
              {/* HERO SECTION */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative p-8 rounded-[2.5rem] bg-[#FFF9F2] shadow-[12px_12px_24px_#E6D9C5,-12px_-12px_24px_#FFFFFF] overflow-hidden group"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-bl-[2.5rem] transition-all group-hover:scale-110 duration-700" />

                <div className="flex flex-col items-center relative z-10">
                  <div className="mb-4 w-28 h-28 rounded-full bg-[#FFF9F2] shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF] flex items-center justify-center p-1.5 transition-all group-hover:shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF]">
                    {/* Inner glowing ring */}
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] p-[3px] animate-pulse-slow">
                      <div className="w-full h-full rounded-full bg-[#FFF9F2] flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="User" className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-110 duration-500" />
                        ) : (
                          <UserIcon className="w-10 h-10 text-[#EBC9A4]" />
                        )}
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-[#4B4036] mb-1 text-center">{user.full_name || 'User Name'}</h2>
                  <div className="px-4 py-1.5 rounded-full bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#E6D9C5,inset_-2px_-2px_5px_#FFFFFF] text-xs font-semibold text-[#8B7E74]">
                    {user.email}
                  </div>

                  {/* Quick Action Row */}
                  <div className="flex gap-4 mt-8 w-full justify-center">
                    <NeuButton
                      onClick={() => setShowWitnessPopup(true)}
                      className="flex-1 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold text-[#4B4036] gap-2 hover:text-[#EBC9A4]"
                    >
                      <Sparkles className="w-4 h-4 text-[#FFD59A]" /> Witness of Growth
                    </NeuButton>
                    <NeuButton onClick={() => router.push('/aihome/profile/edit')} className="flex-1 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold text-[#4B4036] gap-2 hover:text-[#8B7E74]">
                      <Settings className="w-4 h-4 text-[#8B7E74]" /> 編輯
                    </NeuButton>
                  </div>
                </div>
              </motion.div>

              {/* DASHBOARD */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[2.5rem] p-8 bg-[#FFF9F2] shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF] flex flex-col gap-6"
              >
                <h3 className="ml-2 text-xs font-bold text-[#8B7E74] tracking-[0.2em] uppercase opacity-70">數據統計</h3>

                <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl xl:text-3xl font-bold text-[#4B4036] drop-shadow-sm">{foodBalance}</div>
                    <div className="text-[9px] font-bold text-[#8B7E74]/70 mt-1 uppercase">食物</div>
                  </div>

                  <div className="h-10 w-1.5 bg-[#FFF9F2] shadow-[1px_1px_2px_#E6D9C5,-1px_-1px_2px_#FFFFFF] rounded-full"></div>

                  <div className="flex flex-col items-center">
                    <div className="text-2xl xl:text-3xl font-bold text-[#4B4036] drop-shadow-sm">
                      {childrenCount}
                    </div>
                    <div className="text-[9px] font-bold text-[#8B7E74]/70 mt-1 uppercase">孩子</div>
                  </div>

                  <div className="h-10 w-1.5 bg-[#FFF9F2] shadow-[1px_1px_2px_#E6D9C5,-1px_-1px_2px_#FFFFFF] rounded-full"></div>

                  <div className="flex flex-col items-center">
                    <div className="text-2xl xl:text-3xl font-bold text-[#4B4036] drop-shadow-sm">{organizationCount}</div>
                    <div className="text-[9px] font-bold text-[#8B7E74]/70 mt-1 uppercase">機構</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Interactive Content */}
            <div className="w-full flex-1 flex flex-col gap-6 lg:min-h-[600px]">
              {/* Tab Switcher - Now Aligned on Desktop */}
              <div className="p-2 rounded-2xl bg-[#FFF9F2] shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF] flex items-center justify-between lg:max-w-md lg:self-start w-full">
                {['overview', 'children', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`
                              flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300
                              ${activeTab === tab
                        ? 'text-[#4B4036] bg-[#FFF9F2] shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF]'
                        : 'text-[#8B7E74] hover:text-[#4B4036] hover:bg-[#E6D9C5]/20'
                      }
                            `}
                  >
                    {tab === 'overview' ? '總覽' : tab === 'children' ? '孩子' : '設定'}
                  </button>
                ))}
              </div>

              <div className="flex-1 w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 gap-6">
                        {/* Organization & Identity Card */}
                        <div className="rounded-[2.5rem] p-8 bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF]">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#FFF9F2] shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] flex items-center justify-center text-[#FFD59A]">
                                <BuildingLibraryIcon className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-[#4B4036]">機構與身份</h3>
                                <p className="text-xs text-[#8B7E74]">您目前的角色與學校</p>
                              </div>
                            </div>
                            {displayOrg && (
                              <span className="px-3 py-1 rounded-full bg-[#FFD59A]/20 text-[#D48347] text-xs font-bold border border-[#FFD59A]/30">
                                {displayOrg.status === 'active' ? '使用中' : displayOrg.status}
                              </span>
                            )}
                          </div>

                          {loadingOrgs ? (
                            <div className="text-center py-8 text-[#8B7E74]">載入機構資料...</div>
                          ) : displayOrg ? (
                            <div className="space-y-4">
                              <div className="p-5 rounded-2xl bg-[#FFF9F2] border border-[#EADBC8]/50 shadow-sm relative overflow-hidden group">
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFD59A]/10 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />

                                <div className="relative z-10">
                                  <h4 className="text-xl font-bold text-[#4B4036] mb-1">{displayOrg.name}</h4>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EADBC8]/20 text-[#8B5E3C] text-sm font-medium">
                                      <IdentificationIcon className="w-4 h-4" />
                                      <span className="capitalize">{displayOrg.role === 'owner' ? '擁有者' : displayOrg.role === 'admin' ? '管理員' : displayOrg.role === 'teacher' ? '老師' : displayOrg.role === 'member' ? '成員' : (displayOrg.role || '成員')}</span>
                                    </div>
                                    {organizations.length > 1 && (
                                      <span className="text-xs text-[#8B7E74]">+{organizations.length - 1} 其他</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <NeuButton className="flex-1 py-3 text-sm font-bold text-[#4B4036]" onClick={() => router.push('/aihome/teacher-link/create')}>
                                  管理學校
                                </NeuButton>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-[#8B7E74] mb-4">您尚未加入任何機構。</p>
                              <NeuButton onClick={() => router.push('/aihome/teacher-link/create/join-organization')}>
                                加入機構
                              </NeuButton>
                            </div>
                          )}
                        </div>

                        {/* AI Food Usage Statistics */}
                        <div className="rounded-[2.5rem] p-8 bg-[#FFF9F2] shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF] min-h-[400px]">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#FFF9F2] shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] flex items-center justify-center text-[#FFD59A]">
                                <Utensils className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-[#4B4036]">AI 食用統計</h3>
                                <p className="text-xs text-[#8B7E74]">Recent food usage history</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <UsageStatsDisplay userId={user.id} className="!p-0 !bg-transparent !shadow-none !border-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'children' && (
                      <div className="rounded-[2.5rem] p-8 bg-[#FFF9F2] shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF] min-h-[400px]">
                        <h3 className="font-bold text-lg text-[#4B4036] mb-6">管理孩子與學生</h3>
                        <ChildrenManagement />
                      </div>
                    )}

                    {activeTab === 'settings' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 rounded-[2.5rem] p-8 bg-[#FFF9F2] shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF]">
                          <h3 className="font-bold text-lg text-[#4B4036] mb-6">帳戶設定</h3>
                          <div className="space-y-4">
                            <NeuListItem icon={UserIcon} label="個人資料" onClick={() => router.push('/aihome/profile/edit')} />
                            <NeuListItem
                              icon={Sparkles}
                              label="外觀與主題"
                              onClick={() => toast.success('即將推出 / Coming Soon', { icon: '🚧' })}
                              className="opacity-60"
                            />
                            <NeuListItem
                              icon={Users}
                              label="家庭共享"
                              onClick={() => toast.success('即將推出 / Coming Soon', { icon: '🚧' })}
                              className="opacity-60"
                            />
                          </div>
                        </div>
                        <NeuButton onClick={logout} className="md:col-span-2 p-6 rounded-[2rem] text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50">
                          <LogOut className="w-5 h-5" /> 安全登出
                        </NeuButton>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>

      <GrowthWitnessPopup
        isOpen={showWitnessPopup}
        onClose={() => setShowWitnessPopup(false)}
      />
    </div>
  );
}

// --- Neumorphic Components ---

function NeuButton({ children, onClick, className = '' }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`
            bg-[#FFF9F2] 
            shadow-[6px_6px_14px_#E6D9C5,-6px_-6px_14px_#FFFFFF] 
            hover:shadow-[8px_8px_18px_#E6D9C5,-8px_-8px_18px_#FFFFFF]
            active:shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF]
            transition-all duration-200
            ${className}
         `}
    >
      {children}
    </motion.button>
  )
}

function NeuListItem({ icon: Icon, label, onClick, isDestructive, className = '' }: { icon: any, label: string, onClick?: () => void, isDestructive?: boolean, className?: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full p-5 flex items-center justify-between rounded-2xl bg-[#FFF9F2] shadow-[6px_6px_14px_#E6D9C5,-6px_-6px_14px_#FFFFFF] hover:shadow-[8px_8px_18px_#E6D9C5,-8px_-8px_18px_#FFFFFF] active:shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] transition-all duration-200 ${isDestructive ? 'text-red-500' : 'text-[#4B4036]'} group ${className}`}
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] ${isDestructive ? 'text-red-400' : 'text-[#EBC9A4]'} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm tracking-wide">{label}</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#FFF9F2] shadow-[3px_3px_6px_#E6D9C5,-3px_-3px_6px_#FFFFFF] flex items-center justify-center">
        <ChevronRight className="w-4 h-4 text-[#8B7E74]/50 group-hover:text-[#4B4036] transition-colors" />
      </div>
    </motion.button>
  )
}

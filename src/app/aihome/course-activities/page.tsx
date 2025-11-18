'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  StarIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TrophyIcon,
  SparklesIcon,
  MusicalNoteIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';
import CourseMiniCard from '@/components/ui/CourseMiniCard';
import OrganizationMiniCard from '@/components/ui/OrganizationMiniCard';
import { supabase } from '@/lib/supabase';
import { getUserSession } from '@/lib/authUtils';
import { CATEGORY_GROUPS } from '@/app/aihome/teacher-link/create/CreateOrganizationPanel';

const AGE_RANGES: Array<{ key: string; label: string; min?: number; max?: number }> = [
  { key: '0_3', label: '0-3 歲', min: 0, max: 3 },
  { key: '3_6', label: '3-6 歲', min: 3, max: 6 },
  { key: '6_9', label: '6-9 歲', min: 6, max: 9 },
  { key: '9_12', label: '9-12 歲', min: 9, max: 12 },
  { key: '12_plus', label: '12 歲以上', min: 12 },
];

export default function CourseActivitiesPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'courses' | 'orgs'>('courses'); // 預設右滑：課程
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

  // 新增：多選機構類別篩選
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CATEGORY_GROUPS.map(g => [g.title, false]))
  );
  // 年齡篩選
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [ageFilterOpen, setAgeFilterOpen] = useState(false);
  
  // 排序
  const [sortBy, setSortBy] = useState<'likes' | 'created_at' | 'reviews' | 'none'>('none');
  const [sortOpen, setSortOpen] = useState(false);

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 移除認證保護 - 允許未登入用戶訪問
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/aihome/auth/login');
  //   }
  // }, [user, loading, router]);


  // 課程活動數據 - 目前為空
  // 定義課程活動的類型
  interface Course {
    id: string;
    name: string;
    description: string;
    duration: string;
    level: string;
    instructor: string;
    schedule: string;
    location: string;
    maxStudents: number;
    currentStudents: number;
    price: number;
    rating: number;
    image: string;
    status: string;
    progress: number;
    nextClass: string;
    // 詳情用
    // @ts-ignore
    discountConfigs: any;
    // @ts-ignore
    images: string[];
    minAge?: number | null;
    maxAge?: number | null;
    // 透過 flatMap 時附帶的所屬機構
    // @ts-ignore
    _inst?: Institution;
  }

  interface Institution {
    id: string;
    name: string;
    institution: string;
    institutionLogo: string;
    description: string;
    location: string;
    courses: Course[];
    createdAt?: string; // 添加創建時間
    likeCount?: number; // 添加 like 數量
    reviewCount?: number; // 添加評論數量
    orgData?: {
      orgName: string;
      orgSlug?: string; // 添加 org_slug
      description?: string | null;
      coverImageUrl?: string | null;
      categories?: string[] | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      socialLinks?: Array<{
        platform: string;
        label: string;
        url: string;
        icon?: string | null;
        customLabel?: string | null;
      }> | null;
    };
  }

  const [courseActivities, setCourseActivities] = useState<Institution[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // 從資料庫載入課程類型
  useEffect(() => {
    const loadCourseTypes = async () => {
      try {
        setLoadingCourses(true);
        const institutions: Institution[] = [];
        
        console.log('📥 開始載入機構和課程數據...');
        
        // 使用 API 端點獲取機構列表（繞過 RLS）
        // 先獲取所有機構（包括 inactive），因為課程可能屬於 inactive 機構
        // 但在顯示時會過濾掉 inactive 的機構
        const orgResponse = await fetch('/api/organizations/list?status=all', {
          credentials: 'include',
        });
        let orgList: any[] = [];
        let allOrgList: any[] = []; // 保存所有機構（用於課程分配）
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          console.log('✅ 機構 API 響應:', { success: orgData.success, count: orgData.count, hasData: !!orgData.data });
          allOrgList = orgData.data || [];
          
          // 調試：顯示每個機構的狀態
          console.log('🔍 機構狀態檢查:', allOrgList.map((org: any) => ({ 
            id: org.id, 
            name: org.org_name, 
            status: org.status,
            statusType: typeof org.status,
            statusValue: JSON.stringify(org.status)
          })));
          
          // 過濾掉 inactive 的機構，只保留 active 和 suspended 的機構用於顯示
          orgList = allOrgList.filter((org: any) => {
            // 確保 status 存在且不為 'inactive'
            const status = org.status;
            // 轉換為字符串並轉小寫進行比較，處理可能的類型問題
            const statusStr = String(status || '').toLowerCase().trim();
            const isActive = statusStr !== 'inactive' && statusStr !== '' && status !== null && status !== undefined;
            
            if (!isActive) {
              console.log(`🚫 過濾掉機構: ${org.org_name} (status: ${JSON.stringify(status)}, statusStr: ${statusStr})`);
            } else {
              console.log(`✅ 保留機構: ${org.org_name} (status: ${JSON.stringify(status)}, statusStr: ${statusStr})`);
            }
            return isActive;
          });
          console.log(`📋 載入 ${allOrgList.length} 個機構 (所有狀態)，顯示 ${orgList.length} 個機構 (過濾掉 inactive)`);
          console.log('✅ 顯示的機構:', orgList.map((org: any) => ({ name: org.org_name, status: org.status })));
          console.log('🚫 被過濾的機構:', allOrgList.filter((org: any) => {
            const statusStr = String(org.status || '').toLowerCase().trim();
            return statusStr === 'inactive' || org.status === null || org.status === undefined;
          }).map((org: any) => ({ name: org.org_name, status: org.status })));
          
          // 創建機構 ID 到機構對象的映射（使用所有機構，確保課程能正確分配）
          const orgMap = new Map(allOrgList.map((org: any) => [org.id, org]));
          console.log('🗺️ 機構映射表:', Array.from(orgMap.keys()));
        } else {
          const errorData = await orgResponse.json().catch(() => ({ error: '無法解析錯誤響應' }));
          console.error('❌ 獲取機構列表失敗:', orgResponse.status, errorData);
        }

        // 使用 API 端點獲取課程列表（繞過 RLS）
        const coursesResponse = await fetch('/api/courses/list?status=true', {
          credentials: 'include',
        });
        let courseTypes: any[] = [];
        
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log('✅ 課程 API 響應:', { success: coursesData.success, count: coursesData.count, hasData: !!coursesData.data });
          courseTypes = coursesData.data || [];
          console.log(`📚 載入 ${courseTypes.length} 個課程`);
        } else {
          const errorData = await coursesResponse.json().catch(() => ({ error: '無法解析錯誤響應' }));
          console.error('❌ 獲取課程列表失敗:', coursesResponse.status, errorData);
        }

        // 創建機構 ID 到機構對象的映射（使用所有機構，包括 inactive，確保課程能正確分配）
        const orgMap = new Map((allOrgList.length > 0 ? allOrgList : orgList).map((org: any) => [org.id, org]));
        
        const orgIdToCourses: Record<string, Course[]> = {};
        const buildCourse = (ct: any, orgSettings: any): Course => {
                const images = Array.isArray(ct.images) ? ct.images : [];
                const firstImage = images.length > 0 ? images[0] : '/HanamiMusic/musicclass.png';
          const discountConfigs = (ct.discount_configs && typeof ct.discount_configs === 'object')
            ? ct.discount_configs
            : { packages: [], trialBundles: [] };
          const trialBundles = Array.isArray(discountConfigs?.trialBundles) ? discountConfigs.trialBundles : [];
          const firstActiveTrial = trialBundles.find((b: any) => b?.is_active !== false) || trialBundles[0];
          const displayPrice = (firstActiveTrial?.price != null)
            ? Number(firstActiveTrial.price)
            : (ct.price_per_lesson || 0);
                
                return {
                  id: ct.id,
                  name: ct.name || '未命名課程',
                  description: ct.description || '專業音樂教育課程',
                  duration: ct.duration_minutes ? `${ct.duration_minutes} 分鐘` : '靈活安排',
                  level: ct.difficulty_level === 'beginner' ? '初級' : 
                         ct.difficulty_level === 'intermediate' ? '中級' :
                         ct.difficulty_level === 'advanced' ? '進階' : '專家',
                  instructor: '專業教師團隊',
                  schedule: '靈活安排',
            location: orgSettings?.location || '香港九龍旺角威達商業大廈504-505室',
                  maxStudents: ct.max_students || 8,
                  currentStudents: 0,
            price: displayPrice,
                  rating: 5.0,
                  image: firstImage,
                  status: '招生中',
                  progress: 0,
            nextClass: '立即報名開始學習',
            discountConfigs,
            images,
            minAge: typeof ct.min_age === 'number' ? ct.min_age : null,
            maxAge: typeof ct.max_age === 'number' ? ct.max_age : null,
          } as Course;
        };

        // 將課程分配到對應的機構
        if (courseTypes && courseTypes.length > 0) {
          courseTypes.forEach((ct: any) => {
            const orgId = ct.org_id;
            if (orgId && orgMap.has(orgId)) {
              const org = orgMap.get(orgId);
              const orgStatus = org?.status;
              
              // 只將課程分配給 active 或 suspended 的機構（不分配給 inactive 機構）
              if (orgStatus && orgStatus !== 'inactive') {
                if (!orgIdToCourses[orgId]) {
                  orgIdToCourses[orgId] = [];
                }
                const orgSettings = (org?.settings as any) || {};
                orgIdToCourses[orgId].push(buildCourse(ct, orgSettings));
                console.log(`✅ 課程 "${ct.name}" 分配給機構 "${org?.org_name}" (status: ${orgStatus})`);
              } else {
                console.log(`🚫 課程 "${ct.name}" 屬於 inactive 機構 "${org?.org_name}"，不分配`);
              }
            } else {
              // 課程沒有 org_id 或機構不存在，記錄警告
              console.warn(`⚠️ 課程 "${ct.name}" (${ct.id}) 沒有有效的 org_id 或機構不存在:`, orgId);
            }
          });
          
          console.log('📊 課程分配統計（只包含 active/suspended 機構）:', Object.keys(orgIdToCourses).map(orgId => {
            const org = orgMap.get(orgId);
            return `${org?.org_name || orgId} (${org?.status}): ${orgIdToCourses[orgId].length} 個課程`;
          }));
        }

        if (orgList && orgList.length > 0) {
          // 批量獲取所有機構的 like count 和 review count（使用 API 端點）
          const orgIds = orgList.map((org: any) => org.id);
          
          const statsResponse = await fetch(
            `/api/organizations/stats?orgIds=${orgIds.join(',')}`,
            { credentials: 'include' }
          );
          
          const likeCountMap: Record<string, number> = {};
          const reviewCountMap: Record<string, number> = {};
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            const stats = statsData.data || {};
            
            orgIds.forEach((orgId: string) => {
              likeCountMap[orgId] = stats[orgId]?.likeCount || 0;
              reviewCountMap[orgId] = stats[orgId]?.reviewCount || 0;
            });
          } else {
            console.error('獲取機構統計失敗:', await statsResponse.json().catch(() => ({})));
          }
          
          // 顯示所有 active/suspended 的機構，即使沒有課程
          for (const org of orgList as any[]) {
            const settings = (org.settings as any) || {};
            const coursesForOrg: Course[] = orgIdToCourses[org.id] || [];
            
            console.log(`📝 處理機構: ${org.org_name} (status: ${org.status}), 課程數: ${coursesForOrg.length}`);

            // 顯示所有機構，即使沒有課程
            institutions.push({
              id: org.id,
              name: org.org_name,
              institution: org.org_name,
              institutionLogo: settings.coverImageUrl || '/@hanami.png',
              description: settings.description || '專業教育機構',
              location: settings.location || '香港九龍旺角',
              courses: coursesForOrg,
              createdAt: org.created_at || new Date().toISOString(),
              likeCount: likeCountMap[org.id] || 0,
              reviewCount: reviewCountMap[org.id] || 0,
              orgData: {
                orgName: org.org_name,
                orgSlug: org.org_slug, // 添加 org_slug 用於識別
                description: settings.description || null,
                coverImageUrl: settings.coverImageUrl || null,
                categories: settings.categories || null,
                contactPhone: org.contact_phone || settings.contactPhone || null,
                contactEmail: org.contact_email || settings.contactEmail || null,
                socialLinks: settings.socialLinks || null,
              }
            });
          }
        } else {
          console.warn('⚠️ orgList 為空，無法構建機構列表');
        }

        // 不再添加默認的「花見音樂」課程，完全依賴資料庫中的機構與課程

        console.log('📋 最終機構列表:', institutions.map(i => ({ id: i.id, name: i.name, hasOrgData: !!i.orgData, coursesCount: i.courses.length })));
        console.log(`✅ 總共載入 ${institutions.length} 個機構，${institutions.reduce((sum, inst) => sum + inst.courses.length, 0)} 個課程`);
        
        if (institutions.length === 0) {
          console.warn('⚠️ 沒有載入到任何機構，可能的原因：1) 資料庫中沒有機構 2) API 端點錯誤 3) RLS 策略問題');
        }
        
        setCourseActivities(institutions);
      } catch (error) {
        console.error('載入課程活動失敗:', error);
        // 出錯時至少顯示默認的「花見音樂」課程
        setCourseActivities([
          {
            id: 'hanami-music',
            name: 'Hanami Music 花見音樂',
            institution: 'Hanami Music 花見音樂',
            institutionLogo: '/@hanami.png',
            description: '專業音樂教育機構，提供創新的音樂教學方法',
            location: '香港九龍旺角威達商業大廈504-505室',
            courses: [
              {
                id: 'hanami-main',
                name: 'Hanami Music 精選課程',
                description: '2022-2024連續獲得優秀教育機構及導師獎。以最有趣活潑又科學的音樂教學助孩子成長發展。孩子絕對會學上癮的非傳統音樂鋼琴教學法。專業團隊精心設計，以遊戲、活動與訓練讓孩子愛上音樂',
                duration: '15個月起',
                level: '初級至高級',
                instructor: '8年資深幼師、一級榮譽特殊幼師、ABA行為治療師、奧福音樂導師專業團隊',
                schedule: '靈活安排',
                location: '香港九龍旺角威達商業大廈504-505室',
                maxStudents: 8,
                currentStudents: 6,
                price: 168,
                rating: 5.0,
                image: '/HanamiMusic/musicclass.png',
                status: '招生中',
                progress: 0,
                nextClass: '立即報名開始學習',
                discountConfigs: { packages: [], trialBundles: [] },
                images: [],
                minAge: null,
                maxAge: null,
              }
            ]
          }
        ]);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourseTypes();
  }, []);

  // 顯示載入狀態
  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  // 移除未認證檢查 - 允許未登入用戶訪問
  // if (!user) {
  //   return null;
  // }

  // 類別篩選：判斷某機構是否符合所選
  const orgMatchesCategory = (inst: Institution) => {
    if (!selectedCategories.length) return true;
    const cats = inst.orgData?.categories || [];
    return selectedCategories.some(c => (cats || []).includes(c));
  };

  // 年齡範圍與課程年齡是否重疊
  const courseMatchesAge = (c: Course) => {
    if (!selectedAgeRanges.length) return true;
    const cMin = typeof c.minAge === 'number' ? c.minAge : undefined;
    const cMax = typeof c.maxAge === 'number' ? c.maxAge : undefined;
    // 若課程沒有標示年齡，視為可通過（避免過濾掉全部）
    if (cMin == null && cMax == null) return true;
    return selectedAgeRanges.some(key => {
      const r = AGE_RANGES.find(a => a.key === key);
      if (!r) return false;
      const rMin = r.min ?? -Infinity;
      const rMax = r.max ?? Infinity;
      // 區間重疊判斷：c區間 [cMin,cMax] 與 r區間 [rMin,rMax]
      const cmn = cMin ?? -Infinity;
      const cmx = cMax ?? Infinity;
      return cmn <= rMax && rMin <= cmx;
    });
  };

  // 機構需最少有一門課符合年齡
  const orgMatchesAge = (inst: Institution) => {
    if (!selectedAgeRanges.length) return true;
    return inst.courses.some(courseMatchesAge);
  };

  // 同時套用類別與年齡到機構
  const orgMatchesFilter = (inst: Institution) => {
    return orgMatchesCategory(inst) && orgMatchesAge(inst);
  };
  
  // 排序函數
  const sortInstitutions = (institutions: Institution[]): Institution[] => {
    if (sortBy === 'none') return institutions;
    
    const sorted = [...institutions];
    switch (sortBy) {
      case 'likes':
        sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case 'created_at':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // 最新的在前
        });
        break;
      case 'reviews':
        sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }
    return sorted;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex flex-col">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 返回主頁按鈕 */}
              <motion.button
                onClick={() => router.push('/aihome')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回主頁"
              >
                <HomeIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>

              {/* 選單按鈕 - 只在登入時顯示 */}
              {user && (
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                  title="開啟選單"
                >
                  <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
              )}
              
              <div className="w-10 h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="HanamiEcho Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                <p className="text-sm text-[#2B3A3B]">課程活動</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#2B3A3B]">
                {currentTime.toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {user ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                    title="登出"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>登出</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                  >
                    登入
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/register')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-all duration-200"
                  >
                    註冊
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <div className="flex-1 flex">
        {/* 側邊欄選單 - 只在登入時顯示 */}
        {user && (
          <AppSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentPath="/aihome/course-activities"
          />
        )}

        {/* 主內容 */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* 頁面標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            課程活動
          </h1>
          <p className="text-xl text-[#2B3A3B] max-w-3xl mx-auto">
            探索更多機構和優惠課程活動，掌握更多優質教育資源
          </p>
        </motion.div>

        {/* 搜尋與篩選 */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋機構或課程"
                className="flex-1 rounded-xl border border-[#EADBC8] bg-white px-4 py-2 text-[#2B3A3B] focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
              />

              {/* 多選機構類別下拉選單 */}
              
            </div>
          </div>
        </div>

        {/* 分段切換 + 機構類別與年齡篩選（顯示在機構之上，同一行） */}
        <div className="mb-6 px-2">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            {/* 分段切換：機構 / 課程 */}
            <div className="relative inline-flex items-center bg-white border border-[#EADBC8] rounded-full p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('orgs')}
                className={`relative z-10 px-4 py-1.5 text-sm rounded-full transition-colors ${
                  activeTab === 'orgs' ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]' : 'text-[#4B4036]/70'
                }`}
                type="button"
              >
                機構
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`relative z-10 px-4 py-1.5 text-sm rounded-full transition-colors ${
                  activeTab === 'courses' ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]' : 'text-[#4B4036]/70'
                }`}
                type="button"
              >
                課程
              </button>
            </div>

            {/* 篩選群組：類別 + 年齧齡 + 清除 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 類別下拉 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(prev => { const next = !prev; if (next) setAgeFilterOpen(false); return next; })}
                  className="px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] text-sm flex items-center gap-2 shadow-sm hover:bg-[#FFF9F2]"
                >
                  機構類別 <span className="text-[#8A7C70]">▾</span>
                </button>
                {filterOpen && (
                  <div className="absolute z-20 mt-2 w-80 max-w-[90vw] bg-white border border-[#EADBC8] rounded-xl shadow-lg p-3">
                    <div className="max-h-80 overflow-auto pr-1">
                      {CATEGORY_GROUPS.map(group => (
                        <div key={group.title} className="mb-2 border border-[#F5E7D6] rounded-md">
                          <button
                            type="button"
                            onClick={() => setOpenGroups(prev => ({...prev, [group.title]: !prev[group.title]}))}
                            className="w-full flex justify-between items-center px-2 py-1 text-sm text-left text-[#4B4036] hover:bg-[#FFEFD9] rounded-md"
                          >
                            <span>{group.title}</span>
                            <span className={`transition-transform ${openGroups[group.title] ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                          {openGroups[group.title] && (
                            <div className="px-2 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {group.options.map(opt => {
                                const checked = selectedCategories.includes(opt.value);
                                return (
                                  <label key={opt.value} className="flex items-center gap-2 text-sm text-[#2B3A3B] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setSelectedCategories(prev => {
                                          if (prev.includes(opt.value)) return prev.filter(v => v !== opt.value);
                                          return [...prev, opt.value];
                                        });
                                      }}
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedCategories.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-[#FFF9F2] border border-[#EADBC8] text-[#4B4036]">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setSelectedCategories([]); setFilterOpen(false); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#EADBC8] text-[#4B4036] hover:bg-[#FFF4DF]"
                      >
                        清除類別
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 年齡下拉 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAgeFilterOpen(prev => { const next = !prev; if (next) setFilterOpen(false); return next; })}
                  className="px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] text-sm flex items-center gap-2 shadow-sm hover:bg-[#FFF9F2]"
                >
                  適合年齡 <span className="text-[#8A7C70]">▾</span>
                </button>
                {ageFilterOpen && (
                  <div className="absolute z-20 mt-2 w-56 max-w-[90vw] bg-white border border-[#EADBC8] rounded-xl shadow-lg p-3">
                    <div className="space-y-1">
                      {AGE_RANGES.map(r => {
                        const checked = selectedAgeRanges.includes(r.key);
                        return (
                          <label key={r.key} className="flex items-center gap-2 text-sm text-[#2B3A3B] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedAgeRanges(prev => {
                                  if (prev.includes(r.key)) return prev.filter(v => v !== r.key);
                                  return [...prev, r.key];
                                });
                              }}
                            />
                            <span>{r.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedAgeRanges.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedAgeRanges.map(k => {
                          const r = AGE_RANGES.find(x => x.key === k);
                          return (
                            <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-[#FFF9F2] border border-[#EADBC8] text-[#4B4036]">
                              {r?.label || k}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedAgeRanges([]); setAgeFilterOpen(false); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#EADBC8] text-[#4B4036] hover:bg-[#FFF4DF]"
                      >
                        清除年齡
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 排序下拉 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen(prev => { const next = !prev; if (next) { setFilterOpen(false); setAgeFilterOpen(false); } return next; })}
                  className="px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] text-sm flex items-center gap-2 shadow-sm hover:bg-[#FFF9F2]"
                >
                  <FunnelIcon className="w-4 h-4" />
                  <span>排序</span>
                  <span className="text-[#8A7C70]">▾</span>
                </button>
                {sortOpen && (
                  <div className="absolute z-20 mt-2 w-48 max-w-[90vw] bg-white border border-[#EADBC8] rounded-xl shadow-lg p-3">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm text-[#2B3A3B] cursor-pointer hover:bg-[#FFF9F2] rounded px-2 py-1 transition-colors">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === 'none'}
                          onChange={() => { setSortBy('none'); setSortOpen(false); }}
                          className="text-[#FFD59A]"
                        />
                        <span>預設排序</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#2B3A3B] cursor-pointer hover:bg-[#FFF9F2] rounded px-2 py-1 transition-colors">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === 'likes'}
                          onChange={() => { setSortBy('likes'); setSortOpen(false); }}
                          className="text-[#FFD59A]"
                        />
                        <HeartIcon className="w-4 h-4 text-red-500" />
                        <span>心心數</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#2B3A3B] cursor-pointer hover:bg-[#FFF9F2] rounded px-2 py-1 transition-colors">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === 'created_at'}
                          onChange={() => { setSortBy('created_at'); setSortOpen(false); }}
                          className="text-[#FFD59A]"
                        />
                        <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                        <span>加入時間</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#2B3A3B] cursor-pointer hover:bg-[#FFF9F2] rounded px-2 py-1 transition-colors">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === 'reviews'}
                          onChange={() => { setSortBy('reviews'); setSortOpen(false); }}
                          className="text-[#FFD59A]"
                        />
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-yellow-500" />
                        <span>評論數</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 清除全部 */}
              {(selectedCategories.length > 0 || selectedAgeRanges.length > 0 || sortBy !== 'none') && (
                <button
                  type="button"
                  onClick={() => { 
                    setSelectedCategories([]); 
                    setSelectedAgeRanges([]); 
                    setSortBy('none');
                    setFilterOpen(false); 
                    setAgeFilterOpen(false);
                    setSortOpen(false);
                  }}
                  className="px-3 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] text-sm shadow-sm hover:bg-[#FFE0B2]"
                >
                  清除全部
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 內容區域：加入左右滑動手勢（類 iPhone） */}
        <div
          onTouchStart={(e) => {
            setTouchStartX(e.changedTouches[0].clientX);
            setTouchCurrentX(e.changedTouches[0].clientX);
          }}
          onTouchMove={(e) => {
            setTouchCurrentX(e.changedTouches[0].clientX);
          }}
          onTouchEnd={() => {
            if (touchStartX != null && touchCurrentX != null) {
              const delta = touchCurrentX - touchStartX;
              // 右滑 delta>50：顯示機構；左滑 delta<-50：顯示課程
              if (delta > 50) setActiveTab('orgs');
              if (delta < -50) setActiveTab('courses');
            }
            setTouchStartX(null);
            setTouchCurrentX(null);
          }}
        >
          {/* 機構 Carousell（左） */}
          {activeTab === 'orgs' && (
            <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-[#4B4036]">機構</h2>
                      </div>
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4">
                {sortInstitutions(
                  courseActivities.filter((inst) => {
                    const q = searchQuery.trim().toLowerCase();
                    if (q && !(
                      inst.name.toLowerCase().includes(q) ||
                      inst.description.toLowerCase().includes(q)
                    )) return false;
                    // 按機構類別與年齡過濾
                    return orgMatchesFilter(inst);
                  })
                )
                  .map((inst) => {
                    // 檢查是否為花見音樂機構（優先使用 org_slug，這是從 Supabase 載入的）
                    const isHanamiMusic = 
                      inst.orgData?.orgSlug === 'hanami-music' ||
                      inst.id === 'f8d269ec-b682-45d1-a796-3b74c2bf3eec' ||
                      inst.name?.toLowerCase() === 'hanami music' ||
                      inst.name?.toLowerCase().includes('hanami music') ||
                      inst.name?.includes('花見音樂') ||
                      inst.orgData?.orgName?.toLowerCase() === 'hanami music' ||
                      inst.orgData?.orgName?.toLowerCase().includes('hanami music') ||
                      inst.orgData?.orgName?.includes('花見音樂');
                    
                    // 如果是花見音樂，導向專屬頁面；否則導向一般機構詳情頁
                    const orgRoute = isHanamiMusic 
                      ? '/aihome/hanami-music'
                      : `/aihome/organizations/${inst.id}`;
                    
                    // 對於 Hanami Music，使用專屬的封面圖片和描述
                    // 優先使用 Supabase 中的數據，如果為空或只有 "yeah" 則使用更好的默認值
                    let finalCoverImage: string;
                    let finalDescription: string;
                    
                    if (isHanamiMusic) {
                      // 封面圖片：優先使用 Supabase 的 coverImageUrl，否則使用 Hanami Music 專屬圖片
                      finalCoverImage = inst.orgData?.coverImageUrl || '/HanamiMusic/IndexLogo.png';
                      
                      // 描述：如果 Supabase 中的描述為空或只是 "yeah"，使用更好的默認描述
                      const supabaseDesc = inst.orgData?.description || inst.description;
                      if (!supabaseDesc || supabaseDesc.trim() === 'yeah' || supabaseDesc.trim() === '') {
                        finalDescription = '專業音樂教育機構，提供創新的音樂教學方法。2022-2024連續獲得優秀教育機構及導師獎。以最有趣活潑又科學的音樂教學助孩子成長發展。';
                      } else {
                        finalDescription = supabaseDesc;
                      }
                    } else {
                      finalCoverImage = inst.orgData?.coverImageUrl || inst.institutionLogo;
                      finalDescription = inst.description;
                    }
                    
                    return (
                      <OrganizationMiniCard
                        key={inst.id}
                        orgId={inst.id}
                        name={inst.name}
                        coverImageUrl={finalCoverImage}
                        description={finalDescription}
                        categories={inst.orgData?.categories || null}
                        onClick={() => router.push(orgRoute)}
                      />
                    );
                  })}
                        </div>
                        </div>
                      </div>
                    )}

          {/* 課程 Carousell（右，預設） */}
          {activeTab === 'courses' && (
            <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-[#4B4036]">課程</h2>
                        </div>
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4">
                {courseActivities
                  .flatMap((inst) =>
                    inst.courses.map((c) => ({ ...c, _inst: inst }))
                  )
                  .filter((c) => {
                    const q = searchQuery.trim().toLowerCase();
                    const passSearch =
                      !q ||
                      c.name.toLowerCase().includes(q) ||
                      (c.description || '').toLowerCase().includes(q) ||
                      c._inst!.name.toLowerCase().includes(q);
                    const passCategory = orgMatchesCategory(c._inst!);
                    const passAge = courseMatchesAge(c);
                    return passSearch && passCategory && passAge;
                  })
                  .map((c) => {
                    // 檢查是否為花見音樂的課程
                    const isHanamiMusic = 
                      c._inst!.name?.toLowerCase().includes('hanami music') ||
                      c._inst!.name?.includes('花見音樂') ||
                      c._inst!.orgData?.orgSlug === 'hanami-music' ||
                      c._inst!.orgData?.orgName?.toLowerCase().includes('hanami music') ||
                      c._inst!.orgData?.orgName?.includes('花見音樂');
                    
                    // 檢查課程名稱
                    const courseName = c.name || '';
                    const isPianoClass = courseName.includes('鋼琴') || courseName.toLowerCase().includes('piano');
                    const isMusicFocusClass = courseName.includes('音樂專注力') || courseName.includes('專注力') || courseName.toLowerCase().includes('music focus') || courseName.toLowerCase().includes('focus');
                    
                    // 決定路由
                    let courseRoute = `/aihome/courses/${c.id}`; // 預設路由
                    if (isHanamiMusic) {
                      if (isPianoClass) {
                        courseRoute = '/aihome/hanami-music/piano-class';
                      } else if (isMusicFocusClass) {
                        courseRoute = '/aihome/hanami-music/music-focus-class';
                      }
                    }
                    
                    return (
                      <CourseMiniCard
                        key={c.id}
                        id={c.id}
                        name={c.name}
                        image={c.image}
                        images={c.images}
                        description={c.description}
                        price={c.price}
                        orgName={c._inst!.name}
                        orgLogo={c._inst!.orgData?.coverImageUrl || c._inst!.institutionLogo}
                        categories={c._inst!.orgData?.categories || null}
                        discountConfigs={c.discountConfigs}
                        minAge={c.minAge}
                        maxAge={c.maxAge}
                        onClick={() => router.push(courseRoute)}
                      />
                    );
                  })}
                        </div>
                        </div>
                          </div>
                        )}
                      </div>

        {/* 空狀態 */}
        {courseActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-6">
              <AcademicCapIcon className="w-12 h-12 text-[#4B4036]" />
            </div>
            <h3 className="text-2xl font-bold text-[#4B4036] mb-4">還沒有報讀任何課程</h3>
            <p className="text-lg text-[#2B3A3B] mb-8">開始您的學習之旅，探索豐富的課程活動</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/aihome')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              探索課程
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </motion.button>
          </motion.div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

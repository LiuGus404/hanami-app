'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import {
  fallbackOrganization,
  type OrganizationProfile,
} from '@/lib/authUtils';
import { resolveUserOrganization, getUserOrganizations, type UserOrganizationIdentity } from '@/lib/organizationUtils';
import { supabase } from '@/lib/supabase';
import { CreateOrganizationPanel } from './CreateOrganizationPanel';
import { OrganizationSelectorPanel } from './OrganizationSelectorPanel';
import { OrganizationOnboardingPage } from './OrganizationOnboardingPage';
import { useOrganization } from '@/contexts/OrganizationContext';

interface TeacherLinkShellContextValue {
  organization: OrganizationProfile;
  orgId: string | null;
  allowOrgData: boolean;
  organizationResolved: boolean;
  orgDataDisabled: boolean;
  userOrganizations: UserOrganizationIdentity[];
  showOrganizationSelector: boolean;
}

export const TeacherLinkShellContext = createContext<
  TeacherLinkShellContextValue | undefined
>(undefined);

export const useTeacherLinkOrganization = () => {
  const ctx = useContext(TeacherLinkShellContext);
  if (!ctx) {
    throw new Error(
      'useTeacherLinkOrganization must be used within TeacherLinkShell',
    );
  }
  return ctx;
};

type TeacherLinkShellProps = {
  children: React.ReactNode;
  currentPath: string;
  contentClassName?: string;
};

const allowOrgData =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_ORG_DATA === 'true';

// 調試：檢查 allowOrgData 的值
if (typeof window !== 'undefined') {
  console.log('TeacherLinkShell: allowOrgData =', allowOrgData);
  console.log('TeacherLinkShell: NEXT_PUBLIC_ENABLE_ORG_DATA =', process.env.NEXT_PUBLIC_ENABLE_ORG_DATA);
}

const UNASSIGNED_ORG: OrganizationProfile = {
  id: 'unassigned-org-placeholder',
  name: '未設定機構',
  slug: 'unassigned-org',
  status: null,
};

export function TeacherLinkShell({
  children,
  currentPath,
  contentClassName,
}: TeacherLinkShellProps) {
  const router = useRouter();
  const { user: saasUser, loading: authLoading } = useSaasAuth();
  const {
    currentOrganization: sharedOrganization,
    setCurrentOrganizationId,
    setCurrentOrganization,
  } = useOrganization();

  const [organization, setOrganization] =
    useState<OrganizationProfile>(UNASSIGNED_ORG);
  const [organizationResolved, setOrganizationResolved] = useState(false);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganizationIdentity[]>([]);
  const [showOrganizationSelector, setShowOrganizationSelector] = useState(false);
  const [showOnboardingPage, setShowOnboardingPage] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const redirectingRef = useRef(false);
  const redirectingToSelectRef = useRef(false); // 追蹤是否已跳轉到選擇機構頁面
  const orgResolvedRef = useRef(false); // 追蹤是否已完成機構解析
  const lastResolvedPathRef = useRef<string | null>(null); // 追蹤上次解析的路徑

  const displayName =
    (saasUser?.full_name && saasUser.full_name.trim()) ||
    saasUser?.email ||
    '';
  const displayInitial = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : 'U';

  useEffect(() => {
    if (authLoading) return;

    if (!saasUser) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        const redirectPath = encodeURIComponent(currentPath);
        router.replace(`/aihome/auth/login?redirect=${redirectPath}`);
      }
      return;
    }

    redirectingRef.current = false;
  }, [authLoading, saasUser, router, currentPath]);

  useEffect(() => {
    console.log('TeacherLinkShell: useEffect 觸發', {
      authLoading,
      hasUser: !!saasUser,
      userEmail: saasUser?.email,
      allowOrgData,
      currentPath,
      orgResolvedRef: orgResolvedRef.current,
      lastResolvedPath: lastResolvedPathRef.current,
    });

    if (authLoading) {
      console.log('TeacherLinkShell: 認證載入中，等待...');
      return;
    }

    if (!saasUser) {
      console.log('TeacherLinkShell: 沒有用戶，重置狀態');
      setOrganization(UNASSIGNED_ORG);
      setUserOrganizations([]);
      setShowOrganizationSelector(false);
      // 檢查是否在 join-organization 頁面，如果是則不顯示介紹頁面
      const isJoinPage = currentPath?.includes('/join-organization');
      setShowOnboardingPage(!isJoinPage);
      setShowCreatePanel(false);
      setOrganizationResolved(true);
      redirectingToSelectRef.current = false; // 重置跳轉標記
      orgResolvedRef.current = false; // 重置解析標記
      lastResolvedPathRef.current = null; // 重置路徑標記
      return;
    }

    // 檢查是否在主創建頁面
    const isCreatePage = currentPath === '/aihome/teacher-link/create' || currentPath === '/aihome/teacher-link/create/';
    const isSelectPage = currentPath?.includes('/select-organization');
    const isJoinPage = currentPath?.includes('/join-organization');
    
    // 檢查 localStorage 中是否有有效的機構（在開始解析之前）
    let hasValidLocalStorageOrgEarly = false;
    if (typeof window !== 'undefined' && isCreatePage) {
      try {
        const stored = localStorage.getItem('hanami_current_org');
        if (stored) {
          const storedOrg = JSON.parse(stored);
          const storedOrgId = storedOrg.id || null;
          // 如果 localStorage 中有機構 ID，標記為有效（稍後會驗證是否在列表中）
          hasValidLocalStorageOrgEarly = Boolean(storedOrgId) && storedOrgId !== UNASSIGNED_ORG.id && storedOrgId !== 'default-org';
          console.log('TeacherLinkShell: 提前檢查 localStorage 機構:', storedOrgId, '是否有效:', hasValidLocalStorageOrgEarly);
        }
      } catch (error) {
        console.error('TeacherLinkShell: 提前讀取 localStorage 失敗', error);
      }
    }
    
    // 如果路徑變化且不是主創建頁面，重置跳轉標記（允許用戶之後回到主創建頁面時可以跳轉）
    if (lastResolvedPathRef.current && lastResolvedPathRef.current !== currentPath && !isCreatePage) {
      redirectingToSelectRef.current = false;
    }
    
    // 如果已經完成機構解析，且當前路徑與上次解析的路徑相同，且不是主創建頁面，則不重新執行
    // 這樣可以避免在子頁面中點擊按鈕時觸發重新解析
    // 如果是主創建頁面，但 localStorage 中有有效的機構，也跳過重新執行（避免不必要的跳轉）
    if (orgResolvedRef.current && lastResolvedPathRef.current === currentPath && !isCreatePage && !isSelectPage && !isJoinPage) {
      console.log('TeacherLinkShell: 已在子頁面完成機構解析，跳過重新執行');
      return;
    }
    
    // 如果是主創建頁面，且已經完成過解析，且 localStorage 中有有效的機構，跳過重新執行
    if (orgResolvedRef.current && isCreatePage && hasValidLocalStorageOrgEarly && !isSelectPage && !isJoinPage) {
      console.log('TeacherLinkShell: 在主創建頁面，已解析過且 localStorage 中有有效機構，跳過重新執行');
      // 確保機構狀態已設置（如果還沒設置）
      if (organization?.id === UNASSIGNED_ORG.id || !organization?.id) {
        try {
          const stored = localStorage.getItem('hanami_current_org');
          if (stored) {
            const storedOrg = JSON.parse(stored);
            setOrganization({
              id: storedOrg.id,
              name: storedOrg.name,
              slug: storedOrg.slug,
              status: storedOrg.status === 'active' ? 'active' : null,
            });
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
            setShowOrganizationSelector(false);
          }
        } catch (error) {
          console.error('TeacherLinkShell: 恢復機構狀態失敗', error);
        }
      }
      return;
    }

    console.log('TeacherLinkShell: 開始解析機構，用戶:', saasUser.email, 'allowOrgData:', allowOrgData);

    const resolveOrg = async () => {
      if (!allowOrgData) {
        console.log('TeacherLinkShell: allowOrgData 為 false，但仍嘗試獲取機構身份');
        // 即使 allowOrgData 為 false，我們仍然嘗試獲取機構身份以顯示選擇面板
        // 只是不會使用機構數據來過濾查詢
      }

      try {
        // 獲取用戶所有機構身份（即使 allowOrgData 為 false 也獲取，用於顯示選擇面板）
        console.log('TeacherLinkShell: 開始獲取機構身份...', {
          userId: saasUser.id,
          userEmail: saasUser.email,
          allowOrgData,
        });
        
        // 使用 API 端點查詢機構列表，繞過 RLS 問題
        let allOrgs: UserOrganizationIdentity[] = [];
        try {
          const response = await fetch(
            `/api/organizations/user-organizations?userId=${encodeURIComponent(saasUser.id)}&userEmail=${encodeURIComponent(saasUser.email)}`
          );
          if (response.ok) {
            const result = await response.json();
            allOrgs = result.data || [];
            console.log('TeacherLinkShell: API 返回的機構身份數量:', allOrgs.length, allOrgs);
          } else {
            console.error('TeacherLinkShell: API 查詢失敗', response.status, await response.text());
            // 如果 API 失敗，回退到直接查詢（可能會有 RLS 問題）
            allOrgs = await getUserOrganizations(supabase, saasUser.id, saasUser.email);
          }
        } catch (apiError) {
          console.error('TeacherLinkShell: API 查詢異常', apiError);
          // 如果 API 失敗，回退到直接查詢（可能會有 RLS 問題）
          allOrgs = await getUserOrganizations(supabase, saasUser.id, saasUser.email);
        }
        
        console.log('TeacherLinkShell: 獲取的機構身份數量:', allOrgs.length, allOrgs);
        setUserOrganizations(allOrgs);

        // 如果有機構身份，檢查是否需要跳轉到選擇機構頁面
        if (allOrgs.length > 0) {
          console.log('TeacherLinkShell: 有機構身份，檢查是否需要跳轉', {
            currentPath,
            allOrgsCount: allOrgs.length,
          });
          
          // 檢查當前路徑是否已經是選擇機構頁面或加入機構頁面
          const isSelectPage = currentPath?.includes('/select-organization');
          const isJoinPage = currentPath?.includes('/join-organization');
          // 嚴格檢查是否在主創建頁面（不包括子頁面）
          const isCreatePage = currentPath === '/aihome/teacher-link/create' || currentPath === '/aihome/teacher-link/create/';
          
          // 檢查 URL 參數中是否有 orgId（表示用戶已經選擇了機構）
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlOrgId = urlParams?.get('orgId');
          
          // 優先從 localStorage 讀取機構 ID（在檢查跳轉條件之前）
          let localStorageOrgId: string | null = null;
          let hasValidLocalStorageOrg = false;
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('hanami_current_org');
              if (stored) {
                const storedOrg = JSON.parse(stored);
                localStorageOrgId = storedOrg.id || null;
                // 檢查 localStorage 中的機構是否在列表中
                hasValidLocalStorageOrg = !!(localStorageOrgId && allOrgs.some(org => org.orgId === localStorageOrgId));
                console.log('TeacherLinkShell: 從 localStorage 讀取機構 ID:', localStorageOrgId, '是否有效:', hasValidLocalStorageOrg);
              }
            } catch (error) {
              console.error('TeacherLinkShell: read stored org failed', error);
            }
          }
          
          console.log('TeacherLinkShell: 路徑檢查', {
            isSelectPage,
            isJoinPage,
            isCreatePage,
            currentPath,
            urlOrgId,
            localStorageOrgId,
            hasValidLocalStorageOrg,
            redirectingToSelectRef: redirectingToSelectRef.current,
          });
          
          // 如果 URL 中有 orgId，且該機構在列表中，使用它
          if (urlOrgId) {
            const urlOrg = allOrgs.find(org => org.orgId === urlOrgId);
            if (urlOrg) {
              console.log('TeacherLinkShell: 從 URL 參數獲取機構', urlOrg);
              const selectedOrg: OrganizationProfile = {
                id: urlOrg.orgId,
                name: urlOrg.orgName,
                slug: urlOrg.orgSlug,
                status: urlOrg.status === 'active' ? 'active' : null,
              };
              setOrganization(selectedOrg);
              setShowOnboardingPage(false);
              setShowCreatePanel(false);
              setShowOrganizationSelector(false);
              // 保存到 localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem(
                  'hanami_current_org',
                  JSON.stringify({
                    id: selectedOrg.id,
                    name: selectedOrg.name,
                    slug: selectedOrg.slug,
                    status: selectedOrg.status ?? null,
                  }),
                );
                // 清除 URL 參數，避免重複跳轉（延遲執行，確保狀態已設置）
                setTimeout(() => {
                  if (isCreatePage) {
                    window.history.replaceState({}, '', '/aihome/teacher-link/create');
                  }
                }, 100);
              }
              // 不跳轉，繼續執行後續邏輯（設置機構後，hasValidOrgId 會變為 true）
              // 注意：不要提前返回，讓後續的 localStorage 恢復邏輯也能執行
            }
          }
          
          // 如果沒有 URL 參數，但 localStorage 中有有效的機構，優先恢復它
          if (!urlOrgId && hasValidLocalStorageOrg && localStorageOrgId) {
            const preferredOrg = allOrgs.find(org => org.orgId === localStorageOrgId);
            if (preferredOrg) {
              const currentOrgId = organization?.id ?? null;
              // 只有當前機構與 localStorage 不一致時才更新
              if (currentOrgId !== localStorageOrgId) {
                console.log('TeacherLinkShell: 從 localStorage 恢復機構', preferredOrg);
                setOrganization({
                  id: preferredOrg.orgId,
                  name: preferredOrg.orgName,
                  slug: preferredOrg.orgSlug,
                  status: preferredOrg.status === 'active' ? 'active' : null,
                });
                setShowOnboardingPage(false);
                setShowCreatePanel(false);
                setShowOrganizationSelector(false);
              }
            } else {
              console.warn('TeacherLinkShell: localStorage 中的機構不在列表中，清除 localStorage');
              // 如果 localStorage 中的機構不在列表中，清除它
              if (typeof window !== 'undefined') {
                localStorage.removeItem('hanami_current_org');
              }
              hasValidLocalStorageOrg = false;
              localStorageOrgId = null;
            }
          }
          
          // 檢查當前是否有有效的機構 ID（優先使用 localStorage 的值，因為狀態可能還沒更新）
          const effectiveOrgId = localStorageOrgId || organization?.id || null;
          const hasCurrentValidOrgId = Boolean(effectiveOrgId) && effectiveOrgId !== UNASSIGNED_ORG.id && effectiveOrgId !== 'default-org';
          
          // 只有在主創建頁面時才跳轉到選擇機構頁面
          // 子頁面（如 /student-progress）不應該觸發跳轉
          // 如果 localStorage 中有有效的機構，也不跳轉（即使當前狀態還沒更新）
          if (isCreatePage && !isSelectPage && !isJoinPage && !redirectingToSelectRef.current && !hasCurrentValidOrgId && !urlOrgId && !hasValidLocalStorageOrg) {
            console.log('TeacherLinkShell: 在主創建頁面，有機構身份但未選中機構，跳轉到選擇機構頁面', {
              hasCurrentValidOrgId,
              urlOrgId,
              hasValidLocalStorageOrg,
              effectiveOrgId,
            });
            // 先重置狀態，避免顯示介紹頁面
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
            setShowOrganizationSelector(false);
            redirectingToSelectRef.current = true;
            router.replace('/aihome/teacher-link/create/select-organization');
            return; // 提前返回，不設置其他狀態
          }
          
          // 如果有 localStorage 中的機構但當前狀態還沒更新，確保不顯示選擇面板
          if (hasValidLocalStorageOrg && !hasCurrentValidOrgId) {
            console.log('TeacherLinkShell: localStorage 中有有效機構，等待狀態更新，不顯示選擇面板');
            setShowOrganizationSelector(false);
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
          }
          
          // 如果在選擇機構頁面，設置選擇面板狀態
          if (isSelectPage) {
            console.log('TeacherLinkShell: 在選擇機構頁面，設置選擇面板狀態');
            setShowOrganizationSelector(true);
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
          } else if (hasCurrentValidOrgId) {
            // 如果已經有有效的機構 ID，不顯示選擇面板或介紹頁面
            setShowOrganizationSelector(false);
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
          } else if (isCreatePage) {
            // 只有在主創建頁面時才顯示選擇面板
            console.log('TeacherLinkShell: 在主創建頁面，有機構身份但未選中機構，顯示選擇面板');
            setShowOrganizationSelector(true);
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
          } else {
            // 在子頁面中，如果有機構身份但沒有選中機構，不顯示選擇面板（讓子頁面正常顯示）
            console.log('TeacherLinkShell: 在子頁面，不顯示選擇面板');
            setShowOrganizationSelector(false);
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
          }
        } else {
          // 沒有機構身份，檢查是否在 join-organization 頁面
          const isJoinPage = currentPath?.includes('/join-organization');
          if (isJoinPage) {
            // 如果在加入機構頁面，不顯示介紹頁面，讓用戶可以加入機構
            console.log('TeacherLinkShell: 在加入機構頁面，不顯示介紹頁面');
            setShowOrganizationSelector(false);
            setShowOnboardingPage(false);
            setShowCreatePanel(false);
            setOrganization(UNASSIGNED_ORG);
          } else {
            // 沒有機構身份，顯示介紹頁面
            console.log('TeacherLinkShell: 沒有機構身份，顯示介紹頁面');
            setShowOrganizationSelector(false);
            setShowOnboardingPage(true);
            setShowCreatePanel(false); // 確保創建面板被關閉
            setOrganization(UNASSIGNED_ORG);
            console.log('TeacherLinkShell: 設置狀態 - showOnboardingPage=true, showCreatePanel=false');
          }
        }

        // 保存到 localStorage
        if (typeof window !== 'undefined') {
          try {
            const currentOrg = organization.id !== UNASSIGNED_ORG.id ? organization : null;
            if (currentOrg) {
              localStorage.setItem(
                'hanami_current_org',
                JSON.stringify({
                  id: currentOrg.id,
                  name: currentOrg.name,
                  slug: currentOrg.slug,
                  status: currentOrg.status ?? null,
                }),
              );
            }
          } catch (error) {
            console.error('TeacherLinkShell: store organization failed', error);
          }
        }
      } catch (error) {
        console.error('TeacherLinkShell: resolve organization failed', error);
        setOrganization(UNASSIGNED_ORG);
        setUserOrganizations([]);
        setShowOrganizationSelector(false);
        setShowCreatePanel(false); // 確保創建面板被關閉
        // 如果解析失敗且沒有機構，檢查是否在 join-organization 頁面
        const isJoinPage = currentPath?.includes('/join-organization');
        if (!isJoinPage) {
          // 如果不在加入機構頁面，顯示介紹頁面
          setShowOnboardingPage(true);
          console.log('TeacherLinkShell: 錯誤處理 - showOnboardingPage=true, showCreatePanel=false');
        } else {
          setShowOnboardingPage(false);
          console.log('TeacherLinkShell: 在加入機構頁面，不顯示介紹頁面');
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              'hanami_current_org',
              JSON.stringify({
                id: UNASSIGNED_ORG.id,
                name: UNASSIGNED_ORG.name,
                slug: UNASSIGNED_ORG.slug,
                status: UNASSIGNED_ORG.status,
              }),
            );
          } catch (storageError) {
            console.error(
              'TeacherLinkShell: fallback store organization failed',
              storageError,
            );
          }
        }
      } finally {
        console.log('TeacherLinkShell: 機構解析完成，設置 organizationResolved = true');
        setOrganizationResolved(true);
        orgResolvedRef.current = true; // 標記機構解析已完成
        lastResolvedPathRef.current = currentPath; // 記錄當前路徑
      }
    };

    resolveOrg();
  }, [authLoading, saasUser, allowOrgData, currentPath, router]);

  const orgId = organization?.id ?? null;
  const hasValidOrgId =
    Boolean(orgId) &&
    orgId !== UNASSIGNED_ORG.id &&
    orgId !== 'default-org';

  useEffect(() => {
    if (!organizationResolved) return;

    if (hasValidOrgId && orgId) {
      if (sharedOrganization?.id !== orgId) {
        setCurrentOrganization(organization);
      }
    } else if (sharedOrganization?.id !== fallbackOrganization.id) {
      setCurrentOrganization(fallbackOrganization);
    }
  }, [
    organizationResolved,
    hasValidOrgId,
    orgId,
    organization,
    sharedOrganization?.id,
    setCurrentOrganization,
  ]);

  // 注意：showOrganizationOnboarding 已由 showOnboardingPage 替代
  // 保留此變量僅用於向後相容，但不再用於控制顯示邏輯
  const showOrganizationOnboarding =
    allowOrgData && organizationResolved && !hasValidOrgId && userOrganizations.length === 0;

  const orgDataDisabled = showOnboardingPage || showOrganizationSelector;

  const handleOrganizationSelect = (selectedOrg: OrganizationProfile) => {
    setOrganization(selectedOrg);
    setShowOrganizationSelector(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'hanami_current_org',
          JSON.stringify({
            id: selectedOrg.id,
            name: selectedOrg.name,
            slug: selectedOrg.slug,
            status: selectedOrg.status ?? null,
          }),
        );
      } catch (error) {
        console.error('TeacherLinkShell: store selected org failed', error);
      }
    }
  };

  // 注意：不再在 useEffect 中重置狀態，因為這會與機構解析邏輯衝突
  // 狀態將由機構解析邏輯正確設置

  const handleCreateNew = () => {
    setShowOrganizationSelector(false);
    setShowOnboardingPage(false);
    setShowCreatePanel(true);
  };

  const handleJoinExisting = () => {
    setShowOrganizationSelector(false);
    setShowOnboardingPage(false);
    setShowCreatePanel(false);
    // 跳轉到加入機構頁面
    router.push('/aihome/teacher-link/create/join-organization');
  };

  const handleStartOnboarding = () => {
    setShowOnboardingPage(true);
  };

  const contextValue = useMemo(
    () => ({
      organization,
      orgId: hasValidOrgId ? orgId : null,
      allowOrgData,
      organizationResolved,
      orgDataDisabled,
      userOrganizations,
      showOrganizationSelector,
    }),
    [organization, hasValidOrgId, allowOrgData, organizationResolved, orgDataDisabled, userOrganizations, showOrganizationSelector],
  );

  const mainClassName = contentClassName
    ? `flex-1 overflow-auto ${contentClassName}`
    : 'flex-1 overflow-auto bg-[#FFFDF8]';

  return (
    <TeacherLinkShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
        <div className="flex">
          <AppSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentPath={currentPath}
          />

          <div className="flex-1 flex flex-col">
            <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen((prev) => !prev)}
                      className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                      title={sidebarOpen ? '關閉選單' : '開啟選單'}
                    >
                      <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                    </button>
                    <div className="w-10 h-10 relative">
                      <img
                        src="/@hanami.png"
                        alt="HanamiEcho Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-[#4B4036]">
                        HanamiEcho
                      </h1>
                      <p className="text-sm text-[#2B3A3B]">老師專屬入口</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[#FFF9F2] px-3 py-1 text-xs text-[#4B4036]">
                      {organizationResolved
                        ? organization?.name || fallbackOrganization.name
                        : '載入中…'}
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-[#4B4036]">
                        {displayInitial}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            <main className={mainClassName}>
              {(() => {
                console.log('TeacherLinkShell: 渲染邏輯檢查', {
                  showOrganizationSelector,
                  showOnboardingPage,
                  showCreatePanel,
                  showOrganizationOnboarding,
                  userOrganizationsCount: userOrganizations.length,
                  hasValidOrgId,
                  orgId,
                  organizationResolved,
                  allowOrgData,
                });
                return null;
              })()}
              {(() => {
            // 優先級：選擇面板 > 介紹頁面 > 創建面板 > 主內容
            // 但如果當前路徑是 join-organization，則不顯示選擇面板或介紹頁面
            const isJoinPage = currentPath?.includes('/join-organization');
            
            if (showOrganizationSelector && !isJoinPage) {
              console.log('TeacherLinkShell: 渲染選擇面板');
              return (
                <OrganizationSelectorPanel
                  organizations={userOrganizations}
                  onSelect={handleOrganizationSelect}
                  onCreateNew={handleCreateNew}
                  onJoinExisting={handleJoinExisting}
                  currentOrgId={hasValidOrgId ? orgId : null}
                />
              );
            }
            if (showOnboardingPage && !isJoinPage) {
              console.log('TeacherLinkShell: 渲染介紹頁面');
              return (
                <OrganizationOnboardingPage
                  onCreateOrganization={handleCreateNew}
                  onJoinOrganization={handleJoinExisting}
                />
              );
            }
            if (showCreatePanel && !isJoinPage) {
                  console.log('TeacherLinkShell: 渲染創建面板');
                  return (
                    <CreateOrganizationPanel
                      userEmail={saasUser?.email ?? null}
                      userId={saasUser?.id ?? null}
                      onCreated={(createdOrg) => {
                        setOrganization(createdOrg);
                        setShowOrganizationSelector(false);
                        setShowCreatePanel(false);
                        setShowOnboardingPage(false);
                        setOrganizationResolved(true);
                        // 重新獲取機構列表
                        getUserOrganizations(supabase, saasUser?.id, saasUser?.email).then(orgs => {
                          setUserOrganizations(orgs);
                          // 如果只有一個機構，自動選擇它
                          if (orgs.length === 1) {
                            handleOrganizationSelect(createdOrg);
                          } else {
                            // 如果有多個機構，顯示選擇器
                            setShowOrganizationSelector(true);
                          }
                        });
                        if (typeof window !== 'undefined') {
                          localStorage.setItem(
                            'hanami_current_org',
                            JSON.stringify({
                              id: createdOrg.id,
                              name: createdOrg.name,
                              slug: createdOrg.slug,
                              status: createdOrg.status ?? null,
                            }),
                          );
                        }
                      }}
                    />
                  );
                }
                console.log('TeacherLinkShell: 渲染主內容（children）');
                return children;
              })()}
            </main>
          </div>
        </div>
      </div>
    </TeacherLinkShellContext.Provider>
  );
}

